'use strict';
// tech-fix-2.3 (same harness as tf2/tf2.2-headless-web, + window size / user agent): headless Chrome, real DOM, the app scripts of index.html.
// Old data without S.block.passAt, repeat of the block, last day done first → the plan card keeps that day and asks. External network
// is blocked; no clip / poster file is served.
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
async function inChrome(state, lang, ls, body, search, size, ua) {
  const { port, result, close } = await serve(page(state, lang, ls, body));
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'tf2-chrome-'));
  const child = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', '--disable-extensions', '--disable-background-networking',
    '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1', '--window-size=' + (size || '390,844'), ...(ua ? ['--user-agent=' + ua] : []), '--user-data-dir=' + prof, `http://127.0.0.1:${port}/__tf2.html${search || ''}`], { stdio: 'ignore' });
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
const BID = 'str_adv_5_g_b35';
// old data: whole first pass, repeat on the old app (no passAt), then the LAST day, then day 1; knees set later
function gptState(lang) {
  const b = boot();
  const program = b.J(`planFromBlock(getBlock('${BID}'),{goal:'str',level:'adv',days:5,place:'g',lim:[]}).days`);
  const n = program.length, now = Date.now(), DAYMS = 864e5;
  const W = (i, at) => ({ id: 'w' + i + '_' + at, start: at, end: at + 3600e3, dayIdx: i, dayName: program[i].name, n: program[i].n, notes: '', items: [{ exId: 'sq', ns: 3, min: 5, max: 8, rest: 120, sets: [{ w: 50, r: 5, done: true }] }] });
  const workouts = Array.from({ length: n }, (_, i) => W(i, now - 80 * DAYMS + i * DAYMS)).concat([W(n - 1, now - 3 * DAYMS), W(0, now - 2 * DAYMS)]);
  return { n, state: { lang, goal: 'str', days: 5, next: 1, weightAsked: 1, obDone: 1, consentLegal: 1, legalOk: 1, progName: 'T', prof: { goal: 'str', sex: 'm', level: 'adv', days: 5, len: 90, place: 'g', prio: [], lim: ['k'] },
    block: { id: BID, next: 1 }, program, workouts, custom: [], templates: [], body: [], pg: { sq: { st: { success: 2, miss: 0 }, next: { weight: 100, sets: 3, target: 5 } } } } };
}
const CYR = /[А-Яа-яЁё]/;
for (const [lang, size, conf] of [['ru', '390,844', true], ['lv', '1280,800', false]]) {
  test(`tf2.3 headless web (${lang.toUpperCase()}, ${size}): old data, repeat, last day then day 1 → «Заменить безопасными» keeps the last day; the question changes it only after OK`, { skip }, async () => {
    const { n, state } = gptState(lang);
    const r = await inChrome(state, lang, {}, `
      if(typeof go==='function')go('today');await wait(150);
      const u=document.getElementById('lgunsure');R.unsure=u?u.textContent:null;
      const f=document.getElementById('lgfixall');R.fixall=!!f;f&&f.click();await wait(150);
      let s=JSON.parse(localStorage.getItem('gym'));R.last1=JSON.stringify(s.program[${n - 1}]);
      const q=document.getElementById('lgfixunsure');R.q=!!q;let asked=null;window.confirm=m=>{asked=m;return ${conf}};q&&q.click();await wait(150);R.asked=asked;
      s=JSON.parse(localStorage.getItem('gym'));R.last2=JSON.stringify(s.program[${n - 1}]);R.hp=JSON.stringify({w:s.workouts,pg:s.pg});`, '', size);
    assert.deepEqual(r.errors, []);
    assert.ok(r.unsure, 'question shown');
    if (lang !== 'ru') assert.ok(!CYR.test(r.unsure), r.unsure); else assert.match(r.unsure, /Не удалось точно определить/);
    assert.equal(r.fixall, true);
    assert.equal(r.last1, JSON.stringify(state.program[n - 1]), 'last day unchanged by «Заменить безопасными»');
    assert.equal(r.q, true);
    assert.ok(r.asked && (lang === 'ru' || !CYR.test(r.asked)), String(r.asked));
    if (conf) assert.notEqual(r.last2, JSON.stringify(state.program[n - 1]), 'OK → changed'); else assert.equal(r.last2, JSON.stringify(state.program[n - 1]), 'Cancel → unchanged');
    assert.equal(r.hp, JSON.stringify({ w: state.workouts, pg: state.pg }), 'history and S.pg unchanged');
  });
}
