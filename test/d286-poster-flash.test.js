'use strict';
// D-286: ticking a warm-up/set checkbox must not recreate other rows' poster <img> nodes
// or change their src. Verified in headless Chrome at 390×844 with a started workout.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const os = require('os');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

test('D-286: tick/set-log handlers no longer rebuild the workout list; timers only patch text', () => {
  const app = read('app.js');
  const slice = (sel) => {
    const start = app.indexOf("app.querySelectorAll('" + sel + "')");
    assert.ok(start >= 0, sel + ' handler present');
    const end = app.indexOf('});', start);
    return app.slice(start, end + 3);
  };
  const wu = slice('[data-wu]');
  const cd = slice('[data-cd]');
  const done = slice('[data-done]');
  assert.equal(wu.includes('workoutView()'), false, 'wu must not call workoutView()');
  assert.equal(cd.includes('workoutView()'), false, 'cd must not call workoutView()');
  assert.equal(done.includes('workoutView()'), false, 'set-log must not call workoutView()');
  assert.match(wu, /patchWuCd\('wu'/);
  assert.match(cd, /patchWuCd\('cd'/);
  assert.match(done, /patchSets\(/);
  assert.match(app, /function reuseMkPosters\(/);
  assert.match(app, /reuseMkPosters\(app,\(\)=>\{/);
  const tickStart = app.indexOf('const tick=()=>{');
  const tick = app.slice(tickStart, app.indexOf('};', tickStart) + 2);
  assert.equal(tick.includes('innerHTML'), false);
  assert.equal(tick.includes('workoutView()'), false);
  const stStart = app.indexOf('function startTimer(sec){');
  const startTimer = app.slice(stStart, app.indexOf('}', stStart) + 1);
  assert.equal(startTimer.includes('workoutView()'), false);
  const movekit = read('movekit.js');
  assert.match(movekit, /mkPosterPathUrls/);
  assert.match(movekit, /function posterUrlForPath\(/);
  assert.match(read('cache-ver.js'), /moyzal-v152/);
});

function gymState() {
  const wu = {
    cardio: { id: 'mk-rowing-machine-steady-state', min: 3, note: '' },
    mob: [
      { id: 'mk-arm-circles-front-back', dose: '20 с' },
      { id: 'mk-cat-camel', dose: '8 раз' },
      { id: 'mk-broomstick-pass-throughs', dose: '8 раз' },
      { id: 'mk-hip-hinge-drill', dose: '8 раз' },
      { id: 'mk-band-row', dose: '12 раз' }
    ],
    ramp: [
      { exId: 'bp', pct: 50, reps: 8 },
      { exId: 'bp', pct: 70, reps: 4 }
    ]
  };
  const cd = {
    stretch: [
      { id: 'mk-foam-roll-thoracic', dose: '30 с' },
      { id: 'mk-childs-pose', dose: '30 с' }
    ]
  };
  // Fallback stretch ids if those names are missing from MOVEKIT — the test
  // still works as long as warm-up + main rows have posters. Keep simple ids.
  return {
    lang: 'lv',
    goal: 'mass',
    weightAsked: 1,
    progName: 'Tests',
    prof: { goal: 'mass', sex: 'm', level: 'mid', days: 3, len: 60, place: 'g', prio: [], lim: [] },
    program: [{ name: 'Diena 1', items: [{ exId: 'bp', sets: 3, min: 8, max: 10, rest: 90 }, { exId: 'mk-barbell-deadlift', sets: 2, min: 5, max: 8, rest: 120 }], wu, cd }],
    workouts: [],
    next: 0,
    custom: [],
    templates: [],
    active: {
      id: 'w-d286',
      start: Date.now() - 8000,
      dayIdx: 0,
      dayName: 'Diena 1',
      notes: '',
      warm: { t: 1, wu, c: [true, false, false, false, false, false, false, false] },
      cool: { cd: { stretch: [{ id: 'mk-arm-circles-front-back', dose: '20 с' }] }, c: [false] },
      items: [
        { exId: 'bp', ns: 3, rest: 90, min: 8, max: 10, sets: [{ w: 40, r: 8, done: false }, { w: 40, r: 8, done: false }, { w: 40, r: 8, done: false }] },
        { exId: 'mk-barbell-deadlift', ns: 2, rest: 120, min: 5, max: 8, sets: [{ w: 80, r: 5, done: false }, { w: 80, r: 5, done: false }] }
      ]
    }
  };
}

function scriptTags() {
  const html = read('index.html');
  const tags = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
  const skip = new Set([
    'vendor/supabase.js', 'supabase-config.js', 'sync.js', 'notify.js', 'profile.js', 'sentry.js'
  ]);
  return tags.filter(src => !skip.has(src));
}

function harnessHtml() {
  const scripts = scriptTags().map(src => `<script src="${src}"></script>`).join('\n');
  const state = JSON.stringify(gymState());
  return `<!doctype html><html lang="lv"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>D-286 poster flash</title>
<link rel="stylesheet" href="style.css">
<script>navigator.serviceWorker&&navigator.serviceWorker.register&&(navigator.serviceWorker.register=()=>Promise.reject(new Error('no-sw')));
localStorage.setItem('gym', ${JSON.stringify(state)});
</script>
</head>
<body>
<header id="top"><h1 id="title">GymCaptain</h1><span id="wclock" class="wclock" role="timer" hidden></span></header>
<main id="app"></main>
<div id="timer" class="hidden"><div><small>Отдых</small><b id="tval">0:00</b></div></div>
<nav id="nav"></nav>
<div id="modal" class="hidden"></div>
${scripts}
<script>
(function () {
  var PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
  function report(result) {
    return fetch('/__result', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result) });
  }
  function paint() {
    var els = document.querySelectorAll('#app [data-mk-poster]');
    els.forEach(function (el, i) {
      var img = el.querySelector('img');
      if (!img) {
        img = document.createElement('img');
        img.alt = '';
        el.appendChild(img);
      }
      img.dataset.probe = 'p' + i;
      img.src = PIXEL;
      el.dataset.mkPosterState = 'ok';
    });
    return document.querySelectorAll('#app [data-mk-poster] img');
  }
  function capture(imgs) {
    return Array.prototype.map.call(imgs, function (img) {
      return { node: img, src: img.getAttribute('src') || img.src, probe: img.dataset.probe };
    });
  }
  function sameAs(before, after) {
    if (after.length !== before.length) return false;
    for (var i = 0; i < before.length; i++) {
      if (after[i] !== before[i].node) return false;
      var src = after[i].getAttribute('src') || after[i].src;
      if (src !== before[i].src) return false;
      if (after[i].dataset.probe !== before[i].probe) return false;
    }
    return true;
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  async function run() {
    var result = { ok: false, errors: [], viewport: { w: window.innerWidth, h: window.innerHeight } };
    try {
      if (typeof workoutView === 'function' && (!S || !S.active)) {
        throw new Error('active workout missing');
      }
      if (typeof view !== 'undefined' && view !== 'today') go('today');
      if (!document.querySelector('[data-wu]')) workoutView();
      await wait(50);
      var imgs = paint();
      result.posterCount = imgs.length;
      if (imgs.length < 3) throw new Error('not enough posters: ' + imgs.length);
      var beforeWu = capture(imgs);
      var otherIdx = [];
      for (var i = 0; i < beforeWu.length; i++) otherIdx.push(i);
      var btn = document.querySelector('[data-wu="1"]');
      if (!btn) throw new Error('no warm-up checkbox');
      btn.click();
      var afterWu = document.querySelectorAll('#app [data-mk-poster] img');
      result.wuSameAll = sameAs(beforeWu, afterWu);
      result.wuSameOthers = true;
      for (var j = 0; j < beforeWu.length; j++) {
        var rowBtn = afterWu[j] && afterWu[j].closest && afterWu[j].closest('.li');
        var isTicked = rowBtn && rowBtn.querySelector && rowBtn.querySelector('[data-wu="1"]');
        if (isTicked) continue;
        if (afterWu[j] !== beforeWu[j].node || (afterWu[j].getAttribute('src') || afterWu[j].src) !== beforeWu[j].src) {
          result.wuSameOthers = false;
        }
      }
      var saved = JSON.parse(localStorage.getItem('gym'));
      result.ticked = !!(saved.active && saved.active.warm && saved.active.warm.c[1] === true);
      result.alreadyTickedKept = !!(saved.active && saved.active.warm && saved.active.warm.c[0] === true);
      var tickedRow = document.querySelector('[data-wu="1"]');
      result.tickedUi = !!(tickedRow && tickedRow.classList.contains('ok'));

      var beforeSet = capture(document.querySelectorAll('#app [data-mk-poster] img'));
      var doneBtn = document.querySelector('[data-done="0,0"]');
      if (!doneBtn) throw new Error('no set checkbox');
      doneBtn.click();
      var afterSet = document.querySelectorAll('#app [data-mk-poster] img');
      result.setSame = sameAs(beforeSet, afterSet);
      var saved2 = JSON.parse(localStorage.getItem('gym'));
      result.setSaved = !!(saved2.active && saved2.active.items[0].sets[0].done);

      var beforeTick = capture(document.querySelectorAll('#app [data-mk-poster] img'));
      await wait(1100);
      var afterTick = document.querySelectorAll('#app [data-mk-poster] img');
      result.timerSame = sameAs(beforeTick, afterTick);

      result.ok = !!(result.wuSameOthers && result.ticked && result.alreadyTickedKept && result.tickedUi && result.setSame && result.setSaved && result.timerSame);
    } catch (e) {
      result.errors.push(String(e && e.stack || e));
    }
    await report(result);
  }
  if (document.readyState === 'complete') setTimeout(run, 50);
  else window.addEventListener('load', function () { setTimeout(run, 50); });
})();
</script>
</body></html>`;
}

function mime(file) {
  const ext = path.extname(file).toLowerCase();
  return ({
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4'
  })[ext] || 'application/octet-stream';
}

function startServer(harness) {
  return new Promise((resolve, reject) => {
    let resultResolve, resultReject;
    const resultP = new Promise((res, rej) => { resultResolve = res; resultReject = rej; });
    const timer = setTimeout(() => resultReject(new Error('timed out waiting for Chrome result')), 25000);
    const server = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://127.0.0.1');
      if (u.pathname === '/__result' && req.method === 'POST') {
        const chunks = [];
        req.on('data', c => chunks.push(c));
        req.on('end', () => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end('{"ok":true}');
          try {
            clearTimeout(timer);
            resultResolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
          } catch (e) {
            resultReject(e);
          }
        });
        return;
      }
      if (u.pathname === '/' || u.pathname === '/__d286.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(harness);
        return;
      }
      const rel = path.normalize(u.pathname).replace(/^\/+/, '');
      if (rel.startsWith('..')) { res.writeHead(403); res.end(); return; }
      const fp = path.join(root, rel);
      if (!fp.startsWith(root) || !fs.existsSync(fp) || !fs.statSync(fp).isFile()) {
        res.writeHead(404); res.end('not found'); return;
      }
      res.writeHead(200, { 'Content-Type': mime(fp), 'Cache-Control': 'no-store' });
      fs.createReadStream(fp).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ port, resultP, close: () => new Promise(r => server.close(r)) });
    });
    server.on('error', reject);
  });
}

function chromePath() {
  for (const p of ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/opt/google/chrome/chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']) {
    if (fs.existsSync(p)) return p;
  }
  return 'google-chrome';
}

test('D-286: headless Chrome 390×844 — tick keeps other poster img nodes and src, and saves the tick', async t => {
  const { port, resultP, close } = await startServer(harnessHtml());
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'd286-chrome-'));
  const args = [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-background-networking',
    '--window-size=390,844',
    '--force-device-scale-factor=1',
    '--user-data-dir=' + profile,
    'http://127.0.0.1:' + port + '/__d286.html'
  ];
  const child = spawn(chromePath(), args, { stdio: ['ignore', 'pipe', 'pipe'] });
  const errChunks = [];
  child.stderr.on('data', d => errChunks.push(d));
  let result;
  try {
    result = await resultP;
  } catch (e) {
    const err = Buffer.concat(errChunks).toString('utf8').slice(-2000);
    e.message += (err ? '\nchrome stderr: ' + err : '');
    throw e;
  } finally {
    child.kill('SIGKILL');
    await close();
  }
  assert.equal((result.errors || []).join('\n'), '', 'harness errors');
  assert.ok(result.posterCount >= 3, 'expected several posters, got ' + result.posterCount);
  assert.equal(result.ticked, true, 'ticked warm-up row was saved');
  assert.equal(result.alreadyTickedKept, true, 'previously ticked row stayed ticked');
  assert.equal(result.tickedUi, true);
  assert.equal(result.wuSameOthers, true, 'other rows kept the same poster <img> node and src after tick');
  assert.equal(result.wuSameAll, true, 'ticked row also kept its poster node');
  assert.equal(result.setSame, true, 'logging a set must not recreate posters');
  assert.equal(result.setSaved, true, 'logged set was saved');
  assert.equal(result.timerSame, true, 'the 1s duration tick must not recreate posters');
  assert.equal(result.ok, true);
});
