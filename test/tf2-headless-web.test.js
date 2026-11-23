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
const { boot } = require('./fixtures/tf1-boot.js');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const chrome = require('./fixtures/chrome-path.js').findChrome();  // GC-163-04: Linux / Windows / macOS

function scripts() {
  const skip = new Set(['vendor/supabase.js', 'supabase-config.js', 'sync.js', 'notify.js', 'profile.js', 'sentry.js']);
  return [...read('index.html').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]).filter(s => !skip.has(s));
}
function page(state, lang, ls, body) {
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="style.css">
<script>navigator.serviceWorker&&(navigator.serviceWorker.register=()=>Promise.reject(new Error('no-sw')));localStorage.setItem('gym',${JSON.stringify(JSON.stringify(state))});${Object.entries(ls || {}).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)},${JSON.stringify(v)});`).join('')}window.confirm=()=>true;</script></head>
<body><header id="top"><h1 id="title">GymCaptain</h1><span id="wclock" hidden></span></header><main id="app"></main><div id="timer" class="hidden"><b id="tval">0:00</b></div><nav id="nav"></nav><div id="modal" class="hidden"></div>
${scripts().map(s => `<script src="${s}"></script>`).join('\n')}
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
async function inChrome(state, lang, ls, body, search) {
  const { port, result, close } = await serve(page(state, lang, ls, body));
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'tf2-chrome-'));
  const child = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', '--disable-extensions', '--disable-background-networking',
    '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1', '--window-size=390,844', '--user-data-dir=' + prof, `http://127.0.0.1:${port}/__tf2.html${search || ''}`], { stdio: 'ignore' });
  try { return await result; } finally { child.kill('SIGKILL'); await close(); }
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
