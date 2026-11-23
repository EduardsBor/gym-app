'use strict';
// D-289 (Eduards, iPhone screenshot on v141): after opening an exercise and going back, a cool-down
// row showed the exercise screen's big poster/video instead of its thumbnail, pushed the row off-screen
// and iOS zoomed the whole page out. Root cause: reuseMkPosters() (D-286) reused ANY painted
// [data-mk-poster] node by id, including the exercise-screen <video class="a3d mk"> and wide poster boxes.
// Guard: after every full re-render with poster reuse, each list poster is a thumbnail
// (span.athumb.mkposter, not .mkwide, no <video>), ≤ 52px wide, and the page never gets wider than the viewport.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const os = require('os');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

test('D-289: reuseMkPosters only reuses same-kind thumbnails', () => {
  const app = read('app.js');
  const s = app.indexOf('function reuseMkPosters(');
  assert.ok(s >= 0);
  const fn = app.slice(s, app.indexOf('\n}', s) + 2);
  assert.match(fn, /mkThumbReusable\(/, 'reuse must go through the thumbnail guard');
  const g = app.slice(app.indexOf('function mkThumbKey('), app.indexOf('function reuseMkPosters('));
  assert.match(g, /athumb/);
  assert.match(g, /mkwide/);
  assert.match(g, /className/);
  assert.match(read('cache-ver.js'), /moyzal-v160/);
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
    lang: 'en',
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
      id: 'w-d289',
      start: Date.now() - 8000,
      dayIdx: 0,
      dayName: 'Diena 1',
      notes: '',
      warm: { t: 1, wu, c: [true, false, false, false, false, false, false, false] },
      cool: { cd: { stretch: [{ id: 'mk-cat-camel', dose: '30 с' }, { id: 'mk-hip-hinge-drill', dose: '30 с' }, { id: 'mk-band-row', dose: '30 с' }] }, c: [false, false, false] },
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


function scriptTags() {
  const html = read('index.html');
  const tags = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
  const skip = new Set(['vendor/supabase.js', 'supabase-config.js', 'sync.js', 'notify.js', 'profile.js', 'sentry.js']);
  return tags.filter(src => !skip.has(src));
}

function harnessHtml(opts) {
  const keep = !!(opts && opts.keep);
  const scripts = scriptTags().map(src => `<script src="${src}"></script>`).join('\n');
  const state = JSON.stringify(gymState());
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>D-289 poster reuse</title>
<link rel="stylesheet" href="style.css">
<script>navigator.serviceWorker&&navigator.serviceWorker.register&&(navigator.serviceWorker.register=()=>Promise.reject(new Error('no-sw')));
localStorage.setItem('gym', ${JSON.stringify(state)});
</script>
</head>
<body>
<header id="top"><h1 id="title">GymCaptain</h1><span id="wclock" class="wclock" role="timer" hidden></span></header>
<main id="app"></main>
<div id="timer" class="hidden"><div><small>Rest</small><b id="tval">0:00</b></div></div>
<nav id="nav"></nav>
<div id="modal" class="hidden"></div>
${scripts}
<script>
(function () {
  var KEEP = ${keep ? 'true' : 'false'};
  var PIXEL = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="#c84"/><circle cx="300" cy="250" r="120" fill="#222"/><rect x="230" y="370" width="140" height="330" fill="#222"/></svg>');
  function report(result) {
    return fetch('/__result', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result) });
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  // Simulate MoveKit having painted every poster on screen (thumbnails get an <img>, the exercise <video> a poster).
  function paint() {
    document.querySelectorAll('#app [data-mk-poster]').forEach(function (el) {
      if (String(el.tagName).toUpperCase() === 'VIDEO') { el.poster = PIXEL; el.dataset.mkPosterState = 'ok'; return; }
      var img = el.querySelector('img');
      if (!img) { img = document.createElement('img'); img.alt = ''; el.appendChild(img); }
      img.src = PIXEL;
      el.dataset.mkPosterState = 'ok';
    });
  }
  function audit(step) {
    var bad = [];
    var list = document.querySelectorAll('#app [data-mk-poster]');
    list.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var cls = String(el.className && el.className.baseVal != null ? el.className.baseVal : el.className);
      var thumb = String(el.tagName).toUpperCase() === 'SPAN' && el.classList.contains('athumb') && el.classList.contains('mkposter') && !el.classList.contains('mkwide');
      if (!thumb) bad.push(step + ': not a thumbnail <' + el.tagName.toLowerCase() + ' class="' + cls + '">');
      if (r.width > 52.5) bad.push(step + ': poster ' + el.dataset.mkPoster + ' width ' + Math.round(r.width));
      var img = el.querySelector && el.querySelector('img');
      if (img && img.getBoundingClientRect().width > 52.5) bad.push(step + ': img width ' + Math.round(img.getBoundingClientRect().width));
    });
    if (document.querySelector('#app .exo video, #app .li video')) bad.push(step + ': <video> inside a list row');
    var sw = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    // On a phone the layout viewport grows with the content (that is the iOS zoom-out), so also compare with the screen width.
    var vw = Math.min(window.innerWidth, (window.screen && screen.width) || window.innerWidth);
    if (sw > vw) bad.push(step + ': page wider than viewport ' + sw + ' > ' + vw);
    return { step: step, posters: list.length, bad: bad, scrollWidth: sw };
  }
  function imgs() { return Array.prototype.slice.call(document.querySelectorAll('#app [data-mk-poster] img')); }
  window.__paint = paint;
  async function run() {
    if (location.hash === '#manual') { window.__result = { manual: true }; return; }
    var result = { ok: false, errors: [], steps: [], viewport: { w: window.innerWidth, h: window.innerHeight } };
    try {
      if (!S || !S.active) throw new Error('active workout missing');
      if (typeof view !== 'undefined' && view !== 'today') go('today');
      if (!document.querySelector('[data-cd]')) workoutView();
      document.querySelectorAll('#app details').forEach(function (d) { d.open = true; });
      await wait(50);
      paint();
      result.steps.push(audit('start'));
      // tick two cool-down items
      document.querySelector('[data-cd="0"]').click();
      document.querySelector('[data-cd="1"]').click();
      result.steps.push(audit('tick cool-down'));
      // open the second cool-down exercise, let its poster paint, go back (full re-render with reuse)
      // (synchronously: in the test there is no MoveKit login, so the async auth check would swap the <video> out)
      exOpen('c', 1);
      result.exVideo = !!document.querySelector('#app [data-mk-poster]');
      paint();
      exBack();
      await wait(80);
      document.querySelectorAll('#app details').forEach(function (d) { d.open = true; });
      result.steps.push(audit('back from exercise'));
      // add set / remove set (full re-render) — thumbnails must still be reused, not recreated
      paint();
      var before = imgs();
      document.querySelector('[data-add="0"]').click();
      var after = imgs();
      result.addKeptNodes = before.length === after.length && before.every(function (n, i) { return n === after[i]; });
      result.steps.push(audit('add set'));
      document.querySelector('[data-del="0"]').click();
      result.steps.push(audit('remove set'));
      // open a main exercise, back again
      exOpen('m', 0);
      paint();
      exBack();
      await wait(80);
      result.steps.push(audit('back from main exercise'));
      document.querySelector('[data-wu="2"]') && document.querySelector('[data-wu="2"]').click();
      result.steps.push(audit('tick warm-up'));
      document.querySelectorAll('#app details').forEach(function (d) { d.open = true; });
      var row = document.querySelector('[data-cd="1"]');
      if (row) row.scrollIntoView({ block: 'center' });
      result.bad = [].concat.apply([], result.steps.map(function (s) { return s.bad; }));
      result.ok = result.bad.length === 0 && result.addKeptNodes && result.exVideo;
    } catch (e) {
      result.errors.push(String(e && e.stack || e));
    }
    if (!KEEP) await report(result); else window.__result = result;
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


test('D-289: headless Chrome 390×844 — list posters stay thumbnails after poster reuse; page never wider than viewport', async () => {
  const { port, resultP, close } = await startServer(harnessHtml());
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'd289-chrome-'));
  const args = ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run',
    '--no-default-browser-check', '--disable-extensions', '--disable-background-networking',
    '--window-size=390,844', '--force-device-scale-factor=1', '--user-data-dir=' + profile,
    'http://127.0.0.1:' + port + '/__d286.html'];
  const child = spawn(chromePath(), args, { stdio: ['ignore', 'pipe', 'pipe'] });
  const errChunks = [];
  child.stderr.on('data', d => errChunks.push(d));
  let result;
  try {
    result = await resultP;
  } catch (e) {
    e.message += '\nchrome stderr: ' + Buffer.concat(errChunks).toString('utf8').slice(-2000);
    throw e;
  } finally {
    child.kill('SIGKILL');
    await close();
  }
  assert.equal((result.errors || []).join('\n'), '', 'harness errors');
  assert.equal(result.exVideo, true, 'exercise screen rendered a MoveKit poster/video (precondition)');
  assert.deepEqual(result.bad, [], 'list posters must stay thumbnails');
  assert.equal(result.addKeptNodes, true, 'add set must still reuse painted thumbnails (no flicker)');
  assert.equal(result.ok, true);
});

module.exports = { harnessHtml, startServer };
