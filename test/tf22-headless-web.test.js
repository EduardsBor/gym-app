'use strict';
// tech-fix-2.2 (same harness as tf2-headless-web): headless Chrome (390×844, real DOM, the app scripts of index.html) — plan check card, start modal, open
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

test('tf2.2 headless web: «Остановить» on a partly done exercise → «Завершить» → working weights (S.pg) unchanged, history keeps the done sets', { skip }, async () => {
  const st = oldState('ru', ['k']);
  st.pg.sq = { st: { success: 1, miss: 0 }, next: { weight: 80, sets: 4, target: 5, note: 'top1' }, first: Date.now() - 30 * 864e5, last: Date.now() - 3 * 864e5 };
  st.active = { id: 'a1', start: Date.now() - 600e3, dayIdx: 0, dayName: 'x', notes: '', items: [{ exId: 'sq', ns: 4, min: 5, max: 8, rest: 120, sets: [{ w: 80, r: 8, done: true }, { w: 80, r: 8, done: true }, { w: 80, r: 8, done: false }, { w: 80, r: 8, done: false }] }] };
  const r = await inChrome(st, 'ru', {}, `
    window.confirm=()=>true;if(typeof go==='function')go('today');await wait(120);
    const b=document.querySelector('[data-lgat="0"]');R.btn=!!b;b&&b.click();await wait(100);
    const f=document.getElementById('fin');R.fin=!!f;f&&f.onclick&&f.onclick();await wait(150);
    const saved=JSON.parse(localStorage.getItem('gym'));R.active=!!saved.active;R.pg=JSON.stringify(saved.pg.sq);R.hist=JSON.stringify(saved.workouts[saved.workouts.length-1].items);`);
  assert.deepEqual(r.errors, []);
  assert.equal(r.btn, true); assert.equal(r.fin, true); assert.equal(r.active, false);
  assert.equal(r.pg, JSON.stringify(st.pg.sq));
  const h = JSON.parse(r.hist);
  assert.equal(h[0].exId, 'sq'); assert.deepEqual(h[0].sets.map(s => [s.w, s.r, s.done]), [[80, 8, true], [80, 8, true]]);
});

test('tf2.2 headless web: day №4 done, then day №1, then knees → «Заменить безопасными» keeps day №4 (old data without passAt)', { skip }, async () => {
  const st = oldState('ru', ['k']);
  const b = boot();
  const d4 = b.J(`(()=>{S.prof={lim:['k'],place:'g'};S.program=${JSON.stringify(st.program)};return S.program.findIndex((d,j)=>j>=3&&lgAuditDay(d))})()`);
  st.block = { id: 'str_adv_5_g_b35', next: 1 };
  st.workouts = [d4, 0].map((i, k) => ({ id: 'h' + i, start: Date.now() - (5 - k) * 864e5, end: Date.now() - (5 - k) * 864e5 + 3600e3, dayIdx: i, dayName: st.program[i].name, n: st.program[i].n, notes: '', items: [] }));
  const r = await inChrome(st, 'ru', {}, `
    if(typeof go==='function')go('today');await wait(120);const f=document.getElementById('lgfixall');R.btn=!!f;f&&f.click();await wait(150);
    const saved=JSON.parse(localStorage.getItem('gym'));R.d4=JSON.stringify(saved.program[${d4}]);R.d0=JSON.stringify(saved.program[0]);R.hist=JSON.stringify(saved.workouts);`);
  assert.deepEqual(r.errors, []);
  assert.ok(d4 >= 3);
  assert.equal(r.btn, true);
  assert.equal(r.d4, JSON.stringify(st.program[d4]));
  assert.equal(r.d0, JSON.stringify(st.program[0]));
  assert.equal(r.hist, JSON.stringify(st.workouts));
});
