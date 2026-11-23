'use strict';
// tech-fix-2.1 (same harness as tf2-headless-web): headless Chrome (390×844, real DOM, the app scripts of index.html) — plan check card, start modal, open
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
const chrome = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(p => fs.existsSync(p));

function scripts() {
  const skip = new Set(['vendor/supabase.js', 'supabase-config.js', 'sync.js', 'notify.js', 'profile.js', 'sentry.js']);
  return [...read('index.html').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]).filter(s => !skip.has(s));
}
function page(state, lang, ls, body) {
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="style.css">
<script>navigator.serviceWorker&&(navigator.serviceWorker.register=()=>Promise.reject(new Error('no-sw')));localStorage.setItem('gym',${JSON.stringify(JSON.stringify(state))});${Object.entries(ls || {}).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)},${JSON.stringify(v)});`).join('')}window.confirm=()=>true;</script></head>
<body><header id="top"><h1 id="title">GymCaptain</h1><span id="wclock" hidden></span></header><main id="app"></main><div id="timer" class="hidden"><b id="tval">0:00</b></div><nav id="nav"></nav><div id="modal" class="hidden"></div>
${scripts().map(s => `<script src="${s}"></script>`).join('\n')}
<script>(function(){const wait=ms=>new Promise(r=>setTimeout(r,ms));const R={errors:[]};window.onerror=(m)=>{R.errors.push(String(m))};
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

test('tf2.1 headless web: partly done risky exercise → card «выполнено 2/4»; «Заменить остаток» adds a separate safe exercise; done sets kept', { skip }, async () => {
  const st = oldState('ru', ['k']);
  st.active = { id: 'a1', start: Date.now() - 600e3, dayIdx: 0, dayName: 'x', notes: '', items: [{ exId: 'sq', ns: 4, min: 5, max: 8, rest: 120, sets: [{ w: 80, r: 8, done: true }, { w: 82.5, r: 7, done: true }, { w: 82.5, r: 8, done: false }, { w: 82.5, r: 8, done: false }] }] };
  const r = await inChrome(st, 'ru', {}, `
    if(typeof go==='function')go('today');await wait(120);
    const c=document.getElementById('lgaw');R.card=!!c;R.text=c?c.textContent:'';const b=document.querySelector('[data-lgas="0"]');R.btn=!!b;b&&b.click();await wait(100);
    R.items=S.active.items.map(i=>({exId:i.exId,sets:i.sets,limFrom:i.limFrom||null}));R.cardAfter=!!document.getElementById('lgaw');
    const saved=JSON.parse(localStorage.getItem('gym'));R.savedFirst=JSON.stringify(saved.active.items[0].sets);`);
  assert.deepEqual(r.errors, []);
  assert.equal(r.card, true); assert.match(r.text, /выполнено 2\/4/); assert.match(r.text, /Выполненные подходы и веса сохраняются/);
  assert.equal(r.btn, true);
  assert.equal(r.items.length, 2); assert.equal(r.items[0].exId, 'sq'); assert.equal(r.items[0].sets.length, 2);
  assert.equal(r.items[1].limFrom, 'sq'); assert.equal(r.items[1].sets.length, 2);
  assert.equal(r.savedFirst, JSON.stringify([{ w: 80, r: 8, done: true }, { w: 82.5, r: 7, done: true }]));
  assert.equal(r.cardAfter, false);
});

test('tf2.1 headless web: LV — partly done card and «Pabeigtie treniņi netiek mainīti» on the plan card (no Cyrillic)', { skip }, async () => {
  const st = oldState('lv', ['k']);
  st.active = { id: 'a1', start: Date.now() - 600e3, dayIdx: 0, dayName: 'x', notes: '', items: [{ exId: 'sq', ns: 3, min: 5, max: 8, rest: 120, sets: [{ w: 80, r: 8, done: true }, { w: 80, r: 8, done: false }, { w: 80, r: 8, done: false }] }] };
  const r = await inChrome(st, 'lv', {}, `if(typeof go==='function')go('today');await wait(300);const c=document.getElementById('lgaw');R.text=c?c.textContent:'';
    S.active=null;save();go('today');await wait(300);const p=document.getElementById('lgplan');R.plan=p?p.textContent:'';`);
  assert.deepEqual(r.errors, []);
  assert.ok(r.text.length > 0); assert.doesNotMatch(r.text, /[А-Яа-яЁё]/, r.text);
  assert.match(r.plan, /Pabeigtie treniņi netiek mainīti/); assert.doesNotMatch(r.plan, /[А-Яа-яЁё]/, r.plan);
});

test('tf2.1 headless web: block with 3 finished days → «Заменить безопасными» changes upcoming days only; saved plan keeps the finished part', { skip }, async () => {
  const st = oldState('ru', ['k']);
  st.block.next = 3;
  st.workouts = [0, 1, 2].map(i => ({ id: 'h' + i, start: Date.now() - (5 - i) * 864e5, end: Date.now() - (5 - i) * 864e5 + 3600e3, dayIdx: i, dayName: st.program[i].name, n: st.program[i].n, notes: '', items: [] }));
  const r = await inChrome(st, 'ru', {}, `
    if(typeof go==='function')go('today');await wait(120);const f=document.getElementById('lgfixall');R.btn=!!f;f&&f.click();await wait(150);
    const saved=JSON.parse(localStorage.getItem('gym'));R.first3=JSON.stringify(saved.program.slice(0,3));R.rest=saved.program.slice(3).some(d=>d.items.some(i=>blockLimConf(i.exId,{lim:['k']}).length&&!i.limAck));R.hist=JSON.stringify(saved.workouts);`);
  assert.deepEqual(r.errors, []);
  assert.equal(r.btn, true);
  assert.equal(r.first3, JSON.stringify(st.program.slice(0, 3)));
  assert.equal(r.rest, false);
  assert.equal(r.hist, JSON.stringify(st.workouts));
});
