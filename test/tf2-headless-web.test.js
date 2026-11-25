'use strict';
// tech-fix-2: headless Chrome (390×844, real DOM, the app scripts of index.html) — plan check card, start modal, open
// workout card, swap list, LV translation, variant chooser. External network is blocked; no clip / poster file is served.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');
const { spawn } = require('child_process');
const { setTimeout: delay } = require('node:timers/promises');
const { boot } = require('./fixtures/tf1-boot.js');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const chrome = require('./fixtures/chrome-path.js').findChrome();  // GC-163-04: Linux / Windows / macOS

function scripts(withProfile) {
  const skip = new Set(['vendor/supabase.js', 'supabase-config.js', 'sync.js', 'notify.js', 'profile.js', 'sentry.js']);
  if (withProfile) skip.delete('profile.js');
  return [...read('index.html').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]).filter(s => !skip.has(s));
}
function page(state, lang, ls, body, withProfile) {
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="style.css">
<script>navigator.serviceWorker&&(navigator.serviceWorker.register=()=>Promise.reject(new Error('no-sw')));localStorage.setItem('gym',${JSON.stringify(JSON.stringify(state))});${Object.entries(ls || {}).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)},${JSON.stringify(v)});`).join('')}window.confirm=()=>true;</script></head>
<body><header id="top"><h1 id="title">GymCaptain</h1><span id="wclock" hidden></span></header><main id="app"></main><div id="timer" class="hidden"><b id="tval">0:00</b></div><nav id="nav">${withProfile?'<button data-v="today">Тренировки</button><button data-v="more">Профиль</button>':''}</nav><div id="modal" class="hidden"></div>
${scripts(withProfile).map(s => `<script src="${s}"></script>`).join('\n')}
<script>(function(){const wait=ms=>new Promise(r=>setTimeout(r,ms));
// GC-165-03: wait for a state, not for a fixed time (async block-file loads were slower than 60 ms under a full parallel run)
const until=async(f,ms)=>{const t=Date.now();while(Date.now()-t<(ms||5000)){try{if(f())return true}catch(e){}await wait(20)}return false};const R={errors:[]};window.onerror=(m)=>{R.errors.push(String(m))};
async function run(){try{${body}}catch(e){R.errors.push(String(e&&e.stack||e))}await fetch('/__result',{method:'POST',body:JSON.stringify(R)})}
if(document.readyState==='complete')setTimeout(run,80);else addEventListener('load',()=>setTimeout(run,80))})();</script></body></html>`;
}
function serve(html) {
  return new Promise(resolve => {
    let done; const result = new Promise((r, j) => { done = r; setTimeout(() => j(new Error('timeout')), 30000); });
    const server = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://127.0.0.1');
      if (u.pathname === '/__result') { const c = []; req.on('data', d => c.push(d)); req.on('end', () => { res.end('{}'); done(JSON.parse(Buffer.concat(c).toString() || '{}')); }); return; }
      if (u.pathname === '/' || u.pathname === '/__tf2.html') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(html); return; }
      // never serve clips or posters (MoveKit media is not opened by tests)
      if (/\.(mp4|webm|mov|m4v|jpg|jpeg|png|webp|gif)$/i.test(u.pathname) || /movekit\//i.test(u.pathname)) { res.writeHead(404); res.end(); return; }
      const rel = path.normalize(decodeURIComponent(u.pathname)).replace(/^\/+/, ''); const fp = path.join(root, rel);
      if (rel.startsWith('..') || !fs.existsSync(fp) || !fs.statSync(fp).isFile()) { res.writeHead(404); res.end(); return; }
      const ext = path.extname(fp); res.writeHead(200, { 'Content-Type': ext === '.js' ? 'text/javascript; charset=utf-8' : ext === '.css' ? 'text/css' : ext === '.json' ? 'application/json' : 'text/plain' });
      fs.createReadStream(fp).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve({ port: server.address().port, result, close: () => new Promise(r => server.close(r)) }));
  });
}
// New headless Chrome may clamp the outer window to 500 px; set a real layout viewport.
async function emulatedViewport(profile, width, url) {
  const timeout = Date.now() + 5000;
  let target;
  while (!target && Date.now() < timeout) {
    try {
      const port = Number(fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]);
      const response = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(1000) });
      target = (await response.json()).find(t => t.type === 'page' && t.webSocketDebuggerUrl);
    } catch {}
    if (!target) await delay(25);
  }
  if (!target) throw new Error('Chrome did not expose its DevTools page');
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  const request = (id, method, params) => new Promise((resolve, reject) => {
    const signal = AbortSignal.timeout(5000);
    socket.addEventListener('message', function onMessage({ data }) {
      const reply = JSON.parse(data);
      if (reply.id !== id) return;
      socket.removeEventListener('message', onMessage);
      reply.error ? reject(new Error(reply.error.message)) : resolve(reply.result);
    }, { signal });
    signal.addEventListener('abort', () => reject(new Error(`Chrome timed out on ${method}`)), { once: true });
    socket.send(JSON.stringify({ id, method, params }));
  });
  try {
    await new Promise((resolve, reject) => {
      const signal = AbortSignal.timeout(5000);
      socket.addEventListener('open', resolve, { once: true, signal });
      socket.addEventListener('error', () => reject(new Error('Could not open the DevTools socket')), { once: true, signal });
      signal.addEventListener('abort', () => reject(new Error('DevTools socket did not open')), { once: true });
    });
    await request(1, 'Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: false });
    const navigation = await request(2, 'Page.navigate', { url });
    if (navigation.errorText) throw new Error(navigation.errorText);
    return socket;
  } catch (e) {
    socket.close();
    throw e;
  }
}
async function inChrome(state, lang, ls, body, search, withProfile, width) {
  const { port, result, close } = await serve(page(state, lang, ls, body, withProfile));
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'tf2-chrome-'));
  const url = `http://127.0.0.1:${port}/__tf2.html${search || ''}`;
  const child = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', '--disable-extensions', '--disable-background-networking',
    '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1', ...(width?['--hide-scrollbars','--remote-debugging-port=0']:[]), '--window-size='+(width?500:390)+',844', '--user-data-dir=' + prof, width?'about:blank':url], { stdio: 'ignore' });
  let socket;
  try {
    if (width) socket = await emulatedViewport(prof, width, url);
    return await result;
  } finally {
    if (socket) socket.close();
    child.kill('SIGKILL');
    await close();
  }
}
// saved plan: made without limitations, knees set later (old data)
function oldState(lang, lim) {
  const b = boot();
  const program = b.J(`planFromBlock(getBlock('str_adv_5_g_b35'),{goal:'str',level:'adv',days:5,place:'g',lim:[]}).days`);
  return { lang, goal: 'str', days: 5, next: 0, weightAsked: 1, obDone: 1, consentLegal: 1, legalOk: 1, progName: 'T', prof: { goal: 'str', sex: 'm', level: 'adv', days: 5, len: 90, place: 'g', prio: [], lim },
    block: { id: 'str_adv_5_g_b35', next: 0 }, program, workouts: [{ id: 'h1', start: Date.now() - 3 * 864e5, end: Date.now() - 3 * 864e5 + 3600e3, dayIdx: 0, dayName: 'x', notes: '', items: [{ exId: 'smith-bench', ns: 1, min: 3, max: 6, rest: 120, sets: [{ w: 80, r: 5, done: true }] }] }],
    custom: [], templates: [], body: [], pg: { 'smith-bench': { st: { success: 1, miss: 0 }, next: { weight: 82.5, sets: 3, target: 3 }, first: Date.now() - 50 * 864e5, last: Date.now() - 3 * 864e5 } } };
}
const skip = !chrome && 'no Chrome on this machine';

test('tf2 headless web: Today shows the plan check; Start opens the modal; «Заменить и начать» starts a safe workout; history kept', { skip }, async () => {
  const st = oldState('ru', ['k']);
  const r = await inChrome(st, 'ru', {}, `
    if(typeof go==='function')go('today');await wait(80);
    R.card=!!document.getElementById('lgplan');R.cardText=(document.getElementById('lgplan')||{}).textContent||'';
    const di=S.program.findIndex(d=>lgAuditDay(d));R.di=di;today(di);await wait(60);
    const st=document.getElementById('start');R.startBtn=!!st;st&&st.click();await wait(60);
    R.modal=!!document.querySelector('#modal:not(.hidden) #lgstart');R.activeBefore=!!S.active;
    document.getElementById('lgsfix').click();await wait(80);
    R.active=!!S.active;R.safe=S.active.items.every(i=>blockLimOk(i.exId,{lim:['k']}));
    const saved=JSON.parse(localStorage.getItem('gym'));R.hist=JSON.stringify(saved.workouts);R.pg=JSON.stringify(saved.pg);R.warn=(saved.program[di].limWarn||[]).length;`);
  assert.deepEqual(r.errors, []);
  assert.equal(r.card, true); assert.match(r.cardText, /Проверка ограничений/);
  assert.equal(r.startBtn, true); assert.equal(r.modal, true); assert.equal(r.activeBefore, false);
  assert.equal(r.active, true); assert.equal(r.safe, true); assert.ok(r.warn > 0);
  assert.equal(r.hist, JSON.stringify(st.workouts)); assert.equal(r.pg, JSON.stringify(st.pg));
});

test('tf2 headless web: open workout with a risky exercise → card with consent buttons; swap list greys out risky alternatives', { skip }, async () => {
  const st = oldState('ru', ['p']);
  st.active = { id: 'a1', start: Date.now() - 60e3, dayIdx: 0, dayName: 'x', notes: '', items: [{ exId: 'ohp', ns: 3, min: 6, max: 8, rest: 120, sets: [{ w: '', r: 8, done: false }, { w: '', r: 8, done: false }] }, { exId: 'lat', ns: 3, min: 8, max: 12, rest: 90, sets: [{ w: '', r: 12, done: false }] }] };
  const r = await inChrome(st, 'ru', {}, `
    if(typeof go==='function')go('today');await wait(100);
    R.card=!!document.getElementById('lgaw');const b=document.querySelector('[data-lgaw="0"],[data-lgar="0"]');R.btn=!!b;b&&b.click();await wait(80);
    R.first=S.active.items[0].exId;R.safe=blockLimOk(R.first,{lim:['p']});R.cardAfter=!!document.getElementById('lgaw');
    swapModal('bp',S.prof,()=>{});await wait(30);const m=document.getElementById('modal');
    R.disabled=m.querySelectorAll('.lgrisky button[disabled]').length;R.tapRisky=[...m.querySelectorAll('[data-p]')].map(x=>x.dataset.p).filter(x=>!blockLimOk(x,{lim:['p']}));`);
  assert.deepEqual(r.errors, []);
  assert.equal(r.card, true); assert.equal(r.btn, true);
  assert.notEqual(r.first, 'ohp'); assert.equal(r.safe, true); assert.equal(r.cardAfter, false);
  assert.ok(r.disabled > 0); assert.deepEqual(r.tapRisky, []);
});

test('tf2 headless web: LV — the plan check card is translated (no Cyrillic)', { skip }, async () => {
  const r = await inChrome(oldState('lv', ['k']), 'lv', {}, `
    if(typeof go==='function')go('today');await wait(300);const c=document.getElementById('lgplan');R.card=!!c;R.text=c?c.textContent:'';`);
  assert.deepEqual(r.errors, []);
  assert.equal(r.card, true);
  assert.match(r.text, /Ierobežojumu pārbaude/);
  assert.doesNotMatch(r.text.replace(/\s+/g, ' '), /[А-Яа-яЁё]/, r.text);
});

test('tf2 headless web: pilot variant chooser — asked 6 days → B with 4×/нед; tap A → 6×/нед; tap B → 4×/нед', { skip }, async () => {
  const st = { lang: 'ru', weightAsked: 1, obDone: 1, workouts: [], custom: [], templates: [], body: [], pg: {} };
  const r = await inChrome(st, 'ru', { gc_pilot: '1' }, `
    preview({name:'P',desc:'',a:{goal:'loss',level:'nov',days:6,place:'g',sex:'m',lim:[],prio:[],len:75}},'catalog');
    const tags=()=>[...document.querySelectorAll('#app .badge')].map(x=>x.textContent).join('|');
    await until(()=>document.querySelectorAll('[data-bv]').length===2&&/×\\/нед/.test(tags()));
    R.t1=tags();R.bv=[...document.querySelectorAll('[data-bv]')].map(x=>x.dataset.bv);
    document.querySelector('[data-bv="loss_nov_6_g_b36_va"]').click();await until(()=>PV.gen.blockId==='loss_nov_6_g_b36_va'&&/6×\\/нед/.test(tags()));R.t2=tags();R.id2=PV.gen.blockId;
    document.querySelector('[data-bv="loss_nov_4_g_b36_vb"]').click();await until(()=>PV.gen.blockId==='loss_nov_4_g_b36_vb'&&/4×\\/нед/.test(tags()));R.t3=tags();R.id3=PV.gen.blockId;
    document.getElementById('pstart').click();await until(()=>S.block&&S.block.id==='loss_nov_4_g_b36_vb');R.days=[S.days,S.prof.days,S.prof.daysAsked,S.block&&S.block.id];`);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.bv, ['loss_nov_4_g_b36_vb', 'loss_nov_6_g_b36_va']);
  assert.match(r.t1, /4×\/нед/); assert.match(r.t2, /6×\/нед/); assert.match(r.t3, /4×\/нед/);
  assert.equal(r.id2, 'loss_nov_6_g_b36_va'); assert.equal(r.id3, 'loss_nov_4_g_b36_vb');
  assert.deepEqual(r.days, [4, 4, 6, 'loss_nov_4_g_b36_vb']);
});

test('Questionnaire: actual Profile menu, catalog and legacy route share one form; preview/apply and Data remain separate', {skip}, async () => {
  const r=await inChrome(oldState('ru',['k']),'ru',{},`
    const click=s=>{const e=document.querySelector(s);if(!e)throw Error('Missing '+s);e.click();};
    const history=JSON.stringify(S.workouts), before=JSON.stringify(S.program);
    click('nav [data-v="more"]'); click('[data-pf="quiz"]');
    R.profile=view;R.heading=document.querySelector('#title').textContent;
    R.fields=['goal','sex','level','days','place','lim'].filter(k=>document.querySelector('#qf-'+k));
    const pick=(key,value)=>{const e=document.querySelector('#qf-'+key);e.value=value;e.dispatchEvent(new Event('change',{bubbles:true}));};
    R.optional=!!document.querySelector('#bwkg')&&!!document.querySelector('#agey');
    R.height=!!document.querySelector('#hgt');
    pick('place','b');pick('bar','1');
    pick('goal','fit');pick('sex','f');
    const edit=(id,v)=>{const e=document.querySelector(id);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));return e.value;};
    R.valid=[edit('#bwkg','77.3'),edit('#agey','42')];
    R.invalid=edit('#bwkg','900');
    R.saved=JSON.parse(localStorage.getItem('gym'));
    click('#qgo');R.preview=view;R.previewProfile=PV.pr.a;
    R.beforeApply=JSON.stringify(S.program)===before&&S.next===0&&!S.active;
    click('#pback'); R.previewBack=[view,Q.place,Q.bar,Q.sex,document.querySelector('#bwkg').value];
    click('#qback');R.profileBack=view;
    click('[data-pf="data"]');R.data=[!!document.querySelector('#privdata'),!!document.querySelector('#wipe'),!!document.querySelector('#bwkg')];
    click('#pfback');click('[data-pf="train"]');R.train=[!!document.querySelector('#snd'),!!document.querySelector('#ro'),!!document.querySelector('#agey')];
    click('#pfback');click('[data-pf="prog"]');R.old=!!document.querySelector('#obre');
    click('#pchg');click('#toq');R.catalog=[view,QBack];click('#qcat');R.catalogBack=view;
    obStart('today');R.legacy=[view,QBack];click('#qback');R.legacyBack=view;
    click('nav [data-v="more"]');click('[data-pf="quiz"]');pick('goal','fit');click('#qgo');
    window.confirm=()=>false; click('#pstart'); R.cancelApply=JSON.stringify(S.program)===before;
    window.confirm=()=>true; click('#pstart'); R.applied=[view,S.goal,S.obDone,S.limSeen];
    R.history=JSON.stringify(S.workouts)===history; R.consent=S.consentHealth||null;
    R.appliedProfile=S.prof;
  `, '', true);
  assert.deepEqual(r.errors,[]);
  assert.equal(r.profile,'quiz');
  assert.equal(r.heading,'Анкета');
  assert.deepEqual(r.fields,['goal','sex','level','days','place','lim']);
  assert.equal(r.optional,true);
  assert.equal(r.height,false);
  assert.deepEqual(r.valid,['77.3','42']);
  assert.equal(r.invalid,'77.3');
  assert.equal(r.saved.weightKg,77.3);
  assert.equal(r.saved.age,42);
  assert.equal(r.saved.prof.weightKg,undefined);
  assert.equal(r.saved.prof.age,undefined);
  assert.equal(r.preview,'preview');
  assert.equal(r.previewProfile.weightKg,undefined);
  assert.equal(r.previewProfile.age,undefined);
  assert.equal(r.beforeApply,true);
  assert.deepEqual(r.previewBack,['quiz','b','1','f','77.3']);
  assert.equal(r.profileBack,'more');
  assert.deepEqual(r.data,[true,true,false]);
  assert.deepEqual(r.train,[true,true,false]);
  assert.equal(r.old,false);
  assert.deepEqual(r.catalog,['quiz','catalog']);
  assert.equal(r.catalogBack,'catalog');
  assert.deepEqual(r.legacy,['quiz','today']);
  assert.equal(r.legacyBack,'today');
  assert.equal(r.cancelApply,true);
  assert.deepEqual(r.applied,['today','fit',1,1]);
  assert.equal(r.history,true);
  assert.equal(r.consent,null);
  assert.equal(r.appliedProfile.weightKg,undefined);
  assert.equal(r.appliedProfile.age,undefined);
});

test('Questionnaire: active workout blocks both apply routes; its history is kept when a program is applied after finishing', {skip}, async()=>{
  const st=oldState('ru',[]);
  st.weightAsked=0;
  st.next=2;
  st.active={id:'active-q',start:Date.now()-1000,dayIdx:0,dayName:'Тест',notes:'',items:[
    {exId:'bp',ns:1,min:6,max:8,rest:60,sets:[{w:12,r:8,done:true}]}]};
  const r=await inChrome(st,'ru',{},`
    const click=s=>{const e=document.querySelector(s);if(!e)throw Error('Missing '+s);e.click()};
    await until(()=>document.querySelector('#hquestionnaire'));
    R.localEditors=!!document.querySelector('#hkg,#hage');
    const old=JSON.stringify(S.active.items);
    const plan=()=>JSON.stringify([S.program,S.prof,S.goal,S.progName,S.next,S.block]);
    const before=plan();
    let prompts=0; window.confirm=()=>{prompts++;return true};
    click('#hquestionnaire');R.question=[view,QBack,document.activeElement.id];
    click('#qgo');click('#pstart');R.blocked=[view,S.active.id,plan()===before,prompts];
    click('#pback');click('#qback');R.return=[view,S.active.id,JSON.stringify(S.active.items)===old,!!document.querySelector('#fin')];

    click('nav [data-v="more"]');click('[data-pf="quiz"]');click('#qcat');click('[data-c="c0"]');
    R.catalogPreview=[view,PV.back];click('#pstart');
    R.catalogBlocked=[view,S.active.id,plan()===before,prompts,JSON.stringify(S.active.items)===old];
    if(view==='preview'){click('#pback');click('nav [data-v="today"]')}
    click('#fin');
    if(document.querySelector('#modal:not(.hidden) #sumok'))click('#sumok');
    R.finished=[!S.active,S.workouts.some(w=>w.id==='active-q')];

    click('nav [data-v="more"]');click('[data-pf="quiz"]');click('#qcat');click('[data-c="c0"]');click('#pstart');
    R.applied=[view,S.progName===CATALOG[0].name,S.next,plan()!==before,prompts,S.workouts.some(w=>w.id==='active-q')];
  `, '', true);
  assert.deepEqual(r.errors,[]);
  assert.equal(r.localEditors,false);
  assert.deepEqual(r.question,['quiz','today','bwkg']);
  assert.deepEqual(r.blocked,['preview','active-q',true,0]);
  assert.deepEqual(r.return,['today','active-q',true,true]);
  assert.deepEqual(r.catalogPreview,['preview','catalog']);
  assert.deepEqual(r.catalogBlocked,['preview','active-q',true,0,true]);
  assert.deepEqual(r.finished,[true,true]);
  assert.deepEqual(r.applied,['today',true,0,true,1,true]);
});

test('Questionnaire: ready program does not confirm new limitations during a workout', {skip}, async()=>{
  const st=oldState('ru',['k']);
  st.active={id:'active-q',start:Date.now()-1000,dayIdx:0,dayName:'Тест',notes:'',items:[
    {exId:'bp',ns:1,min:6,max:8,rest:60,sets:[{w:12,r:8,done:false}]}]};
  const r=await inChrome(st,'ru',{},`
    window.mzSignedIn=()=>true; delete S.limSeen;
    const click=s=>{const e=document.querySelector(s);if(!e)throw Error('Missing '+s);e.click()};
    click('nav [data-v="more"]');click('[data-pf="quiz"]');click('#qcat');click('[data-c="c0"]');
    R.attempt=[view,S.active.id,S.prof.lim,!!S.limSeen,!!document.querySelector('#modal:not(.hidden) #limok')];
  `, '', true);
  assert.deepEqual(r.errors,[]);
  assert.deepEqual(r.attempt,['catalog','active-q',['k'],false,false]);
});

test('Questionnaire: all filters fit at 320–390 px in RU/LV/EN and retain answers on preview/back', {skip}, async()=>{
  const locales=[
    ['ru','Анкета','Фильтры программы','Вес и возраст (необязательно)','Готовые программы','Сила и контроль тела','Тренажёрный зал','Ягодицы и ноги','Спина · Колени','Не выбрано'],
    ['lv','Anketa','Programmas filtri','Svars un vecums (nav obligāti)','Gatavās programmas','Spēks un ķermeņa kontrole','Trenažieru zāle','Sēžas muskuļi un kājas','Mugura · Ceļi','Nav izvēlēts'],
    ['en','Questionnaire','Program filters','Weight and age (optional)','Ready-made programs','Strength & Body Control','Gym','Glutes and legs','Back · Knees','None selected'],
  ];
  for(const [lang,heading,title,optional,back,homeStrength,gym,glutes,limits,empty] of locales)for(const width of [320,390]){
    const st={lang,workouts:[],custom:[],templates:[],body:[],pg:{}};
    const r=await inChrome(st,lang,{},`
      const qs=s=>document.querySelector(s), fields=['goal','place','level','days','sex','acc'];
      const click=s=>{const e=qs(s);if(!e)throw Error('Missing '+s);e.click()};
      const values=()=>fields.map(k=>qs('#qf-'+k).value);
      const change=(key,value)=>{const e=qs('#qf-'+key);e.focus();e.value=value;e.dispatchEvent(new Event('change',{bubbles:true}))};
      const selected=k=>qs('#qf-'+k).selectedOptions[0].textContent;
      const layout=()=>{
        const root=document.documentElement, card=qs('.qfilters'), box=card.getBoundingClientRect();
        const controls=[...card.querySelectorAll('select,input[type=number]')], c=document.createElement('canvas').getContext('2d');
        const clipped=controls.filter(e=>e.tagName==='SELECT').flatMap(e=>{
          const css=getComputedStyle(e);c.font=css.font;
          const available=e.clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight);
          return [...e.options].filter(o=>c.measureText(o.textContent).width+2>available).map(o=>[e.id,o.textContent,available]);
        });
        return {width:root.clientWidth,scroll:root.scrollWidth,height:Math.round(box.height),clipped,
          labels:controls.every(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>=44&&r.left>=0&&r.right<=root.clientWidth&&e.labels.length===1&&!!e.labels[0].querySelector('span').textContent.trim()}),
          contained:[...document.querySelectorAll('#app select,#app input,#app details,#qlen')].every(e=>card.contains(e))};
      };
      await until(()=>qs('#toq'));click('#toq');
      await until(()=>qs('#title').textContent===${JSON.stringify(heading)});
      R.heading=qs('#title').textContent;R.filters=qs('#qfilters-title').textContent;R.optional=qs('#qf-optional').textContent;
      R.gym=selected('place');R.before=values();R.gymLayout=layout();R.gymBar=!!qs('#qf-bar');R.empty=qs('#qfs-lim').textContent;
      R.duration=[Q.lenLabel,qs('#qlen span').textContent];
      change('goal','str');change('place','b');change('level','adv');change('days','2');change('sex','f');change('bar','1');change('acc','glutes');
      await until(()=>selected('goal')===${JSON.stringify(homeStrength)}&&selected('acc')===${JSON.stringify(glutes)});
      R.homeStrength=selected('goal');R.glutes=selected('acc');R.focus=document.activeElement.id;
      R.homeLayout=layout();R.growth=!!qs('#qgrowth');R.homeHint=!!qs('#qhome');
      click('#qf-lim summary');
      R.open=qs('#qf-lim').open;
      const checks=[...qs('#qf-lim').querySelectorAll('input')];
      R.multiAccessible=checks.every(e=>e.type==='checkbox'&&e.labels.length===1&&e.labels[0].getBoundingClientRect().height>=44);
      click('#qf-lim label[for="qf-lim-0"]');click('#qf-lim label[for="qf-lim-1"]');click('#qf-lim label[for="qf-lim-2"]');click('#qf-lim label[for="qf-lim-2"]');
      change('place','g');R.toggle=[!!qs('#qf-bar'),qs('#qf-lim').open];change('place','b');R.restoredBar=qs('#qf-bar').value;
      await until(()=>qs('#qfs-lim').textContent===${JSON.stringify(limits)});
      R.limits=qs('#qfs-lim').textContent;R.openLayout=layout();R.homeDuration=[Q.lenLabel,qs('#qlen span').textContent];
      const edit=(id,value)=>{const e=qs(id);e.value=value;e.dispatchEvent(new Event('change',{bubbles:true}))};
      edit('#bwkg','71.3');edit('#agey','35');click('#qgo');
      R.preview=[view,PV.pr.a.goal,PV.pr.a.place,PV.pr.a.level,PV.pr.a.days,PV.pr.a.bar,PV.pr.a.sex,PV.pr.a.acc,PV.pr.a.lim,PV.pr.a.weightKg,PV.pr.a.age];
      click('#pback');R.afterBack=[view,...values(),qs('#qf-bar').value,...[...qs('#qf-lim').querySelectorAll('input')].map(el=>el.checked),qs('#bwkg').value,qs('#agey').value];
      await until(()=>qs('#qfs-lim').textContent===${JSON.stringify(limits)});
      R.backLimits=qs('#qfs-lim').textContent;
      await until(()=>qs('#qcat').textContent.trim()===${JSON.stringify(back)});
      R.back=qs('#qcat').textContent.trim();click('#qcat');R.view=view;R.program=!!S.program;
      S.prof={...S.prof,lim:['s','k']};click('#toq');R.fromSaved=qs('#qfs-lim').textContent;
    `,'',true,width);
    const context=lang+' '+width+'px';
    assert.deepEqual(r.errors,[],context);
    assert.equal(r.heading,heading,context);assert.equal(r.filters,title,context);assert.equal(r.optional,optional,context);
    assert.equal(r.gym,gym,context);assert.equal(r.empty,empty,context);
    assert.deepEqual(r.before,['mass','g','mid','3','m','none'],context);assert.equal(r.gymBar,false,context);
    for(const actual of [r.gymLayout,r.homeLayout,r.openLayout]){
      assert.equal(actual.width,width,context);assert.equal(actual.scroll,width,context);
      assert.deepEqual(actual.clipped,[],context);assert.equal(actual.labels,true,context);assert.equal(actual.contained,true,context);
    }
    assert.ok(r.gymLayout.height<740,context+' collapsed card '+r.gymLayout.height);
    assert.equal(r.homeStrength,homeStrength,context);assert.equal(r.glutes,glutes,context);
    assert.equal(r.focus,'qf-acc',context);assert.equal(r.growth,true,context);assert.equal(r.homeHint,true,context);
    assert.equal(r.open,true,context);assert.equal(r.multiAccessible,true,context);
    assert.deepEqual(r.toggle,[false,true],context);assert.equal(r.restoredBar,'1',context);
    assert.equal(r.limits,limits,context);assert.equal(r.backLimits,limits,context);assert.equal(r.fromSaved,limits,context);
    assert.notEqual(r.duration[0],r.homeDuration[0],context);
    for(const [,shown] of [r.duration,r.homeDuration]){
      assert.match(shown,/\d+.*\(/,context);
      if(lang!=='ru')assert.doesNotMatch(shown,/[А-Яа-яЁё]/,context);
    }
    assert.deepEqual(r.preview,['preview','str','b','adv',2,'1','f','glutes',['s','k'],null,null],context);
    assert.deepEqual(r.afterBack,['quiz','str','b','adv','2','f','glutes','1',true,true,false,'71.3','35'],context);
    assert.equal(r.back,back,context);assert.equal(r.view,'catalog',context);assert.equal(r.program,false,context);
  }
});

test('Questionnaire: legacy duration and multiple priority muscles remain in the same filter block', {skip}, async()=>{
  for(const [lang,summary] of [['ru','Грудь · Спина'],['lv','Krūtis · Mugura'],['en','Chest · Back']]){
    const st={lang,workouts:[],custom:[],templates:[],body:[],pg:{}};
    const r=await inChrome(st,lang,{},`
      const qs=s=>document.querySelector(s);
      await until(()=>qs('#toq'));qs('#toq').click();
      const change=(k,v)=>{const e=qs('#qf-'+k);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}))};
      change('goal','str');
      R.duration=[...qs('#qf-len').options].map(e=>+e.value);
      change('len','45');
      qs('#qf-prio summary').click();
      qs('#qf-prio label[for="qf-prio-0"]').click();
      qs('#qf-prio label[for="qf-prio-1"]').click();
      R.filters=['#qf-len','#qf-prio','#qf-lim','#qlenoff'].map(s=>qs('.qfilters').contains(qs(s)));
      R.summary=qs('#qfs-prio').textContent;R.open=qs('#qf-prio').open;
      qs('#qgo').click();R.preview=[view,PV.pr.a.len,PV.pr.a.prio];
      qs('#pback').click();R.after=[view,qs('#qf-len').value,qs('#qfs-prio').textContent];
      qs('#qcat').click();S.prof={...S.prof,prio:['Грудь','Спина']};qs('#toq').click();R.fromSaved=qs('#qfs-prio').textContent;
    `,'?blocks=0',true,320);
    assert.deepEqual(r.errors,[]);
    assert.deepEqual(r.duration,[45,60,75,90]);
    assert.deepEqual(r.filters,[true,true,true,true]);
    assert.equal(r.summary,summary,lang);assert.equal(r.open,true,lang);
    assert.deepEqual(r.preview,['preview',45,['Грудь','Спина']]);
    assert.deepEqual(r.after,['quiz','45',summary],lang);
    assert.equal(r.fromSaved,summary,lang);
  }
});

test('Ready programs: questionnaire action, labeled filters and all named rows at equal mobile size in RU/LV/EN', {skip}, async()=>{
  const locales=[
    ['ru','Готовые программы','Подобрать программу','Фильтры программы','Сбросить фильтры','По этим фильтрам программы не найдены.'],
    ['lv','Gatavās programmas','Izvēlēties programmu','Programmas filtri','Atiestatīt filtrus','Atlasītajiem filtriem neatbilst neviena programma.'],
    ['en','Ready-made programs','Build program','Program filters','Reset filters','No programs match these filters.'],
  ];
  for(const [lang,ready,build,title,reset,empty] of locales)for(const width of [320,390]){
    const st={lang,workouts:[],custom:[],templates:[],body:[],pg:{}};
    const r=await inChrome(st,lang,{},`
      const qs=s=>document.querySelector(s), all=s=>[...document.querySelectorAll(s)];
      const click=s=>{const e=qs(s);if(!e)throw Error('Missing '+s);e.click()};
      const box=e=>{const b=e.getBoundingClientRect();return [b.width,b.height]};
      const size=()=>[innerWidth,document.documentElement.clientWidth,document.documentElement.scrollWidth];
      const ids=()=>all('[data-c]').map(e=>e.dataset.c);
      const plan=()=>JSON.stringify([S.program,S.prof,S.goal,S.workouts,S.active]);
      const initial=plan();
      await until(()=>qs('#toq'));click('#toq');
      await until(()=>qs('#qcat').textContent===${JSON.stringify(ready)});
      R.q=[size(),box(qs('#qgo')),box(qs('#qcat')),qs('#qgo').textContent,qs('#qcat').textContent];
      const readyButton=qs('#qcat'), filters=qs('.qfilters'), buildButton=qs('#qgo');
      const follows=(a,b)=>!!(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING);
      const [readyRect,filterRect,buildRect]=[readyButton,filters,buildButton].map(el=>el.getBoundingClientRect());
      R.unique=!qs('#tocat,#qback')&&all('#qcat').length===1;
      R.qOrder=[
        document.getElementById('app').firstElementChild===readyButton,
        follows(readyButton,filters)&&follows(filters,buildButton),
        readyRect.bottom<=filterRect.top&&filterRect.bottom<=buildRect.top,
        readyRect.top>=0&&readyRect.bottom<=innerHeight,
      ];
      click('#qcat');await until(()=>qs('#title').textContent===${JSON.stringify(ready)});
      const names=all('[data-c]');
      R.cat=[view,size(),qs('#title').textContent,qs('#catalog-filters-title').textContent,qs('#cf-reset').textContent];
      R.all=ids();
      R.options=all('[data-cfilter]').map(e=>[e.dataset.cfilter,e.labels.length,e.labels[0].textContent.trim(),e.getBoundingClientRect().height]);
      R.filterOrder=qs('.catalog-filters').compareDocumentPosition(names[0])&Node.DOCUMENT_POSITION_FOLLOWING;
      R.sizes=[...new Set(names.map(b=>JSON.stringify(box(b))))].map(x=>JSON.parse(x));
      R.clipped=names.map(b=>[b,b.getBoundingClientRect(),b.firstChild.getBoundingClientRect()]).filter(([b,z,t])=>t.top<z.top||t.bottom>z.bottom||t.left<z.left||t.right>z.right).map(([b])=>b.dataset.c);
      R.accessible=names.every(e=>e.tagName==='BUTTON'&&e.textContent.trim()&&document.getElementById(e.getAttribute('aria-describedby')).textContent.trim());
      R.locales=[qs('#cf-count').textContent,...all('[data-cfilter] option,[data-cfilter] + label,[data-c]').map(e=>e.textContent)].join(' ');
      for(const [key,value] of [['goal','str'],['place','b'],['level','adv'],['days','2']]){
        const e=qs('#cf-'+key);e.focus();e.value=value;e.dispatchEvent(new Event('change',{bubbles:true}));
      }
      R.focus=document.activeElement.id;const narrowed=ids();R.filtered=narrowed.map(id=>{const a=catalogFind(id).a;return [a.goal,catalogCardPlace({a}),a.level,a.days]});
      R.count=+qs('#cf-count').textContent.match(/\\d+$/)[0];const pick=qs('[data-c]'), picked=pick.dataset.c, label=pick.textContent;
      pick.click();R.preview=[view,PV.pr.id,picked,qs('#app h2').textContent,label,!!qs('#pstart'),!!qs('#catalog-preview-summary'),plan()===initial];
      click('#pback');R.back=[view,...all('[data-cfilter]').map(e=>e.value),JSON.stringify(ids())===JSON.stringify(narrowed)];
      click('#cf-reset');R.reset=[all('[data-cfilter]').every(e=>e.value===''),JSON.stringify(ids())===JSON.stringify(R.all),plan()===initial];
      // Every combination is populated today; exercise the explicit fallback with an empty result.
      const filter=filterCatalog;filterCatalog=()=>[];click('#cf-reset');
      await until(()=>qs('#cf-results').textContent.trim()===${JSON.stringify(empty)});
      R.empty=[qs('#cf-results').textContent.trim(),all('[data-c]').length,!!qs('#cf-reset')];
      filterCatalog=filter;click('#cf-reset');
    `,'',true,width);
    const where=lang+' '+width+'px';
    assert.deepEqual(r.errors,[],where);
    assert.deepEqual(r.q,[[width,width,width],[width-28,48],[width-28,48],build,ready],where);
    assert.equal(r.unique,true,where);
    assert.deepEqual(r.qOrder,[true,true,true,true],where);
    assert.deepEqual(r.cat,['catalog',[width,width,width],ready,title,reset],where);
    assert.deepEqual(r.sizes,[[width-28,48]],where);
    assert.deepEqual(r.clipped,[],where);
    assert.equal(r.accessible,true,where);
    assert.equal(r.all.length,124,where);
    assert.equal(new Set(r.all).size,124,where);
    assert.equal(r.filterOrder,4,where);
    assert.deepEqual(r.options.map(x=>x[0]),['goal','place','level','days'],where);
    assert.ok(r.options.every(([,n,label,h])=>n===1&&label&&h>=44),where);
    if(lang!=='ru')assert.doesNotMatch(r.locales,/[А-Яа-яЁё]/,where);
    assert.equal(r.focus,'cf-days',where);
    assert.ok(r.filtered.length&&r.filtered.length<r.all.length,where);
    assert.equal(r.count,r.filtered.length,where);
    assert.ok(r.filtered.every(x=>JSON.stringify(x)===JSON.stringify(['str','b','adv',2])),where);
    assert.deepEqual(r.preview,['preview',r.preview[2],r.preview[2],r.preview[4],r.preview[4],true,true,true],where);
    assert.deepEqual(r.back,['catalog','str','b','adv','2',true],where);
    assert.deepEqual(r.reset,[true,true,true],where);
    assert.deepEqual(r.empty,[empty,0,true],where);
  }
});

test('Ready programs: the top button uses each theme accent without affecting the catalog rows', {skip}, async()=>{
  for(const theme of ['captain','studio','cobalt','copper','mono']){
    const st={lang:'ru',workouts:[],custom:[],templates:[],body:[],pg:{}};
    const settings=theme==='captain'?{}:{gc_theme:theme};
    const r=await inChrome(st,'ru',settings,`
      const qs=s=>document.querySelector(s);
      const box=e=>{const b=e.getBoundingClientRect();return [b.width,b.height]};
      const rgb=el=>{const css=getComputedStyle(el);return [css.backgroundColor,css.color]};
      const canvas=document.createElement('canvas').getContext('2d');
      const norm=s=>{
        canvas.fillStyle=s;
        const hex=canvas.fillStyle;
        return 'rgb('+[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(', ')+')';
      };
      const lum=s=>{
        const values=s.match(/\\d+/g).slice(0,3).map(n=>{
          const v=Number(n)/255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4;
        });
        return values[0]*0.2126+values[1]*0.7152+values[2]*0.0722;
      };
      const contrast=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)};
      await until(()=>qs('#toq'));qs('#toq').click();
      const ready=qs('#qcat'), build=qs('#qgo'), root=document.documentElement, css=getComputedStyle(root);
      const token=s=>norm(css.getPropertyValue(s).trim());
      R.theme=root.dataset.theme; R.top=qs('#app').firstElementChild===ready;
      R.sizes=[innerWidth,box(ready),box(build)]; R.ready=rgb(ready); R.build=rgb(build);
      R.accent=[token('--acc'),token('--on-acc')];
      R.textContrast=contrast(...R.ready);R.panelContrast=contrast(R.ready[0],token('--bg'));
      ready.click();const row=qs('[data-c]');
      R.catalog=[view,qs('#title').textContent,!!qs('.catalog-filters'),box(row)];
      R.rowBg=rgb(row)[0];R.panel=token('--card2');
    `,'',true,320);
    assert.deepEqual(r.errors,[],theme);
    assert.equal(r.theme,theme);
    assert.equal(r.top,true,theme);
    assert.deepEqual(r.sizes,[320,[292,48],[292,48]],theme);
    assert.deepEqual(r.ready,r.accent,theme);
    assert.deepEqual(r.build,r.accent,theme);
    assert.ok(r.textContrast>=4.5,theme+' text '+r.textContrast);
    assert.ok(r.panelContrast>=3,theme+' background '+r.panelContrast);
    assert.deepEqual(r.catalog,['catalog','Готовые программы',true,[292,48]],theme);
    assert.equal(r.rowBg,r.panel,theme);
    assert.notEqual(r.rowBg,r.ready[0],theme);
  }
});
