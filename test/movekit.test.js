'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');

function boot() {
  const nodes = new Map();
  function el(id) {
    if (id && nodes.has(id)) return nodes.get(id);
    const node = {
      id: id || '', innerHTML: '', textContent: '', className: '', value: '', style: {}, dataset: {},
      classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
      append() {}, addEventListener() {}, setAttribute() {}, getAttribute() { return null; }, closest() { return null; },
      querySelector() { return null; }, querySelectorAll() { return []; }
    };
    if (id) nodes.set(id, node);
    return node;
  }
  const g = {
    console, setTimeout, clearTimeout, setInterval() { return 0; }, clearInterval() {},
    URL, Blob, navigator: { language: 'ru', languages: ['ru'] },
    localStorage: { getItem() { return null; }, setItem() {} },
    location: { href: 'http://127.0.0.1/', origin: 'http://127.0.0.1', pathname: '/' },
    document: {
      documentElement: { lang: 'ru' }, title: '', body: { append() {}, style: {} },
      querySelector(sel) { const m = /^#([\w-]+)/.exec(sel || ''); return el(m ? m[1] : ''); },
      querySelectorAll() { return []; }, addEventListener() {}, createElement() { return el(); }
    }
  };
  g.window = g; g.globalThis = g; g.self = g;
  const ctx = vm.createContext(g);
  const files = ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'place.js', 'prog.js', 'plan.js', 'movekit.js'];
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
  return ctx;
}


// movekit.js first asks the movekit-sign function; until it is deployed the function answers 404
// and the app falls back to the direct storage sign. These mocks keep that 404 route separate.
const FN_URL = 'https://example.test/functions/v1/movekit-sign';
const fnMissing = { ok: false, status: 404, json: async () => ({}) };

const ctx = boot();
const run = code => vm.runInContext(code, ctx);

test('movekit.js stores file names only', () => {
  const src = fs.readFileSync(path.join(root, 'movekit.js'), 'utf8');
  assert.equal(/https?:\/\//i.test(src), false);
  assert.equal(src.includes('token='), false);
  assert.equal(src.includes('.supabase.co'), false);
  assert.equal(src.includes('anim3d/'), false);
});

test('map covers known exercises and leaves the rest on the old clip', () => {
  const report = run(`(() => {
    const ids = new Set(EX.map(e => e.id));
    const keys = Object.keys(MOVEKIT);
    const files = Object.values(MOVEKIT);
    const unmatched = keys.filter(k => !ids.has(k)).sort();
    const mapped = keys.filter(k => ids.has(k)).sort();
    const oldAnim = EX.map(e => e.id).filter(id => hasAnim(id) && !MOVEKIT[id]).sort();
    const placeholder = EX.map(e => e.id).filter(id => !hasAnim(id) && !MOVEKIT[id]).sort();
    return { keys: keys.length, files: new Set(files).size, mapped, unmatched, oldAnim, placeholder };
  })()`);
  // 132 + 25 (v1.2c: 22 new clips, ht-db/ht-bw on glute-bridge, scap-pullup on scapular-pull-up).
  assert.equal(report.keys, 157);
  assert.equal(report.files, 153);
  assert.equal(run('movekitFile("bp")'), 'barbell-bench-press.mp4');
  assert.equal(run('movekitFile("pu")'), 'push-up.mp4');
  assert.equal(run('movekitFile("mk-barbell-deadlift")'), 'barbell-deadlift.mp4');
  assert.equal(run('movekitFile("dl")'), '');
  assert.equal(run('movekitFile("no-such")'), '');
  assert.ok(report.mapped.includes('bp'));
  assert.ok(report.mapped.includes('pu'));
  assert.equal(report.unmatched.includes('bp'), false);
  assert.equal(report.oldAnim.includes('mk-barbell-deadlift'), false);
  assert.equal(report.oldAnim.includes('bp'), false);
  assert.equal(report.mapped.length + report.unmatched.length, 157);
  const bp = run('animMedia("bp")');
  const pu = run('animMedia("pu")');
  const dl = run('animMedia("mk-barbell-deadlift")');
  const soon = run('animMedia("cd_lat")');
  assert.match(bp, /data-mk="bp"/);
  assert.match(bp, /data-mk-poster="bp"/);
  assert.match(bp, /class="a3d mk"/);
  assert.equal(bp.includes('src='), false);
  assert.equal(/\sposter=/.test(bp), false);
  assert.equal(bp.includes('anim3d/'), false);
  assert.equal(/https?:/.test(bp), false);
  assert.match(pu, /data-mk="pu"/);
  assert.equal(pu.includes('anim3d/'), false);
  assert.match(dl, /data-mk="mk-barbell-deadlift"/);
  assert.equal(dl.includes('anim3d/'), false);
  assert.match(soon, /Анимация в разработке/);
  assert.equal(run('hasAnim("bp")'), false);
  assert.equal(run('hasAnim("pu")'), false);
  assert.equal(run('hasAnim("mk-barbell-deadlift")'), false);
  assert.equal(run('hasAnim("chest-supported-2db")'), false);
  assert.match(run('animMedia("chest-supported-2db")'), /data-mk="chest-supported-2db"/);
  assert.equal(run('animMedia("chest-supported-2db")').includes('anim3d/'), false);
  assert.equal(report.oldAnim.length, 0);
  const names = run('Object.keys(MOVEKIT).map(movekitPosterName)');
  assert.equal(new Set(names).size, 153);
  assert.equal(names.every(n => /^[a-z0-9.-]+\.jpg$/.test(n)), true);
  assert.equal(run('movekitPosterName("bp")'), 'barbell-bench-press.jpg');
  assert.equal(run('movekitPosterName("mk-barbell-deadlift")'), 'barbell-deadlift.jpg');
  assert.equal(run('movekitPosterName("dl")'), '');
  assert.equal(run('movekitPosterPath("bp")'), 'posters/barbell-bench-press.jpg');
  assert.equal(run('movekitCacheUrl("posters/barbell-deadlift.jpg")'), 'http://127.0.0.1/movekit/posters/barbell-deadlift.jpg');
  const thumb = run('animThumb("bp")');
  assert.match(thumb, /class="athumb mkposter"/);
  assert.match(thumb, /data-mk-poster="bp"/);
  assert.equal(thumb.includes('src='), false);
  assert.equal(thumb.includes('anim3d/'), false);
  assert.equal(/https?:/.test(thumb), false);
  assert.match(run('animShot("mk-barbell-deadlift")'), /data-mk-poster="mk-barbell-deadlift"/);
  assert.equal(run('animShot("cd_lat")'), '');
  assert.match(run('animPosterBox("bp")'), /mkwide/);
  assert.equal(run('animThumb("cd_lat")').includes('data-mk-poster'), false);
});

test('poster slots are in the workout and the alternatives list', () => {
  run('S.goal="mass";S.days=3;S.workouts=[];S.next=0;S.prof={place:"g",lim:[],goal:"mass",level:"mid",days:3,len:60};S.program=[{name:"День",items:[{exId:"bp",sets:3,min:6,max:10,rest:120},{exId:"cd_lat",sets:1,min:1,max:1,rest:0}]}]');
  run('today(0)');
  const today = run('app.innerHTML');
  assert.match(today, /data-mk-poster="bp"/);
  assert.equal(today.includes('data-mk-poster="cd_lat"'), false);
  assert.equal(/https?:/.test(today), false);
  run('S.active={id:"w1",start:Date.now(),dayIdx:0,dayName:"День",notes:"",items:[{exId:"mk-barbell-deadlift",ns:1,rest:60,min:5,max:8,sets:[{w:"",r:5,done:false}]}]}');
  run('workoutView()');
  assert.match(run('app.innerHTML'), /data-mk-poster="mk-barbell-deadlift"/);
  run('swapModal("bp",{place:"g",lim:[]},function(){})');
  const modal = run('document.querySelector("#modal").innerHTML');
  assert.match(modal, /data-mk-poster="dbp"/);
  assert.equal(modal.includes('token='), false);
  assert.equal(/https?:/.test(modal), false);
});

test('anim3d keeps clips only for exercises without a MoveKit file', () => {
  const dir = path.join(root, 'anim3d');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => !f.startsWith('.')).sort() : [];
  const map = run('MOVEKIT');
  const stems = [...new Set(files.map(f => f.replace(/\.(mp4|jpg)$/i, '')))].sort();
  for (const f of files) {
    assert.match(f, /\.(mp4|jpg)$/);
    const stem = f.replace(/\.(mp4|jpg)$/i, '');
    assert.equal(map[stem], undefined, f);
    assert.equal(files.includes(stem + '.mp4'), true, stem + ' mp4');
    assert.equal(files.includes(stem + '.jpg'), true, stem + ' jpg');
  }
  assert.equal(files.length, 0);
  assert.equal(stems.length, 0);
  assert.deepEqual(stems, Array.from(run('EX.map(e => e.id).filter(id => hasAnim(id)).sort()')));
  assert.equal(files.includes('bp.mp4'), false);
  assert.equal(files.includes('bp.jpg'), false);
  assert.equal(files.includes('dl.mp4'), false);
  assert.equal(files.includes('dl.jpg'), false);
});

test('signed url is requested once and reused until near expiry', async () => {
  const calls = [];
  const g = {
    console, URL, Blob, Map, Promise, JSON, encodeURIComponent, Date,
    setTimeout, clearTimeout,
    MZ_SB: { url: 'https://example.test', anon: 'anon-test' }
  };
  g.window = g;
  g.globalThis = g;
  g.self = g;
  const fnCalls = [];
  g.fetch = async (url, opt) => {
    if (url === FN_URL) { fnCalls.push({ url, opt }); return fnMissing; }
    calls.push({ url, opt });
    const file = url.split('/').pop();
    return {
      ok: true,
      status: 200,
      json: async () => ({ signedURL: '/object/sign/movekit/' + file + '?token=fixture' })
    };
  };
  const signCtx = vm.createContext(g);
  vm.runInContext(fs.readFileSync(path.join(root, 'movekit.js'), 'utf8'), signCtx, { filename: 'movekit.js' });
  const go = code => vm.runInContext(code, signCtx);
  assert.equal(await go('movekitSignedUrl("missing")'), null);
  assert.equal(calls.length, 0);
  const first = await go('movekitSignedUrl("bp")');
  const second = await go('movekitSignedUrl("bp")');
  assert.equal(calls.length, 1);
  assert.equal(fnCalls.length, 1);
  assert.deepEqual(JSON.parse(fnCalls[0].opt.body), { path: 'barbell-bench-press.mp4' });
  assert.equal(first, second);
  assert.equal(first, 'https://example.test/storage/v1' + '/object/sign/movekit/barbell-bench-press.mp4?token=fixture');
  assert.equal(calls[0].url, 'https://example.test/storage/v1/object/sign/movekit/barbell-bench-press.mp4');
  assert.equal(calls[0].opt.method, 'POST');
  assert.equal(calls[0].opt.headers.apikey, 'anon-test');
  assert.equal(calls[0].opt.headers.Authorization, 'Bearer anon-test');
  assert.deepEqual(JSON.parse(calls[0].opt.body), { expiresIn: 3600 });
  const pair = await Promise.all([go('movekitSignedUrl("pu")'), go('movekitSignedUrl("pu")')]);
  assert.equal(pair[0], pair[1]);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].url, 'https://example.test/storage/v1/object/sign/movekit/push-up.mp4');
  const now = Date.now;
  try {
    Date.now = () => now() + 3500 * 1000;
    await go('movekitSignedUrl("bp")');
    assert.equal(calls.length, 3);
  } finally {
    Date.now = now;
  }
});

function posterGlobals(fetchImpl) {
  function URLShim(a, b) { return new URL(a, b); }
  URLShim.createObjectURL = blob => 'blob:poster-' + (blob && blob.size);
  URLShim.revokeObjectURL = () => {};
  const g = {
    console, URL: URLShim, Blob, Map, Promise, JSON, encodeURIComponent, Date, Uint8Array, Response,
    setTimeout, clearTimeout,
    location: { href: 'http://127.0.0.1/' },
    MZ_SB: { url: 'https://example.test', anon: 'anon-test' }
  };
  g.window = g;
  g.globalThis = g;
  g.self = g;
  g.fetch = fetchImpl;
  const signCtx = vm.createContext(g);
  vm.runInContext(fs.readFileSync(path.join(root, 'movekit.js'), 'utf8'), signCtx, { filename: 'movekit.js' });
  return { go: code => vm.runInContext(code, signCtx) };
}

test('poster signed url is requested once per file and reused', async () => {
  const calls = [];
  const { go } = posterGlobals(async (url, opt) => {
    if (url === FN_URL) return fnMissing;
    calls.push({ url, opt });
    const file = String(url).split('/').pop();
    return {
      ok: true,
      status: 200,
      json: async () => ({ signedURL: '/object/sign/movekit/posters/' + file + '?token=fixture' })
    };
  });
  assert.equal(await go('movekitPosterSignedUrl("missing")'), null);
  assert.equal(calls.length, 0);
  const first = await go('movekitPosterSignedUrl("bp")');
  const second = await go('movekitPosterSignedUrl("bp")');
  assert.equal(calls.length, 1);
  assert.equal(first, second);
  assert.equal(first, 'https://example.test/storage/v1/object/sign/movekit/posters/barbell-bench-press.jpg?token=fixture');
  assert.equal(calls[0].url, 'https://example.test/storage/v1/object/sign/movekit/posters/barbell-bench-press.jpg');
  assert.equal(calls[0].opt.method, 'POST');
  assert.equal(calls[0].opt.headers.apikey, 'anon-test');
  assert.equal(calls[0].opt.headers.Authorization, 'Bearer anon-test');
  assert.deepEqual(JSON.parse(calls[0].opt.body), { expiresIn: 3600 });
  const pair = await Promise.all([go('movekitPosterSignedUrl("pu")'), go('movekitPosterSignedUrl("pu")')]);
  assert.equal(pair[0], pair[1]);
  assert.equal(calls.length, 2);
});

test('visible posters sign a few at a time, not the whole map', async () => {
  const calls = [];
  let waiting = [];
  const hold = () => new Promise(resolve => { waiting.push(resolve); });
  const release = () => { const batch = waiting.splice(0); batch.forEach(fn => fn()); };
  const { go } = posterGlobals((url, opt) => {
    if (url === FN_URL) return Promise.resolve(fnMissing);
    calls.push({ url, opt });
    const file = String(url).split('/').pop();
    return hold().then(() => {
      if (opt && opt.method === 'POST') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ signedURL: '/object/sign/movekit/posters/' + file + '?token=fixture' })
        };
      }
      const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
      return { ok: true, status: 200, arrayBuffer: async () => bytes.buffer };
    });
  });
  const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
  const ids = ['bp', 'dbp', 'pu', 'sq', 'ohp', 'lat'];
  go(`
    globalThis.__els = ${JSON.stringify(ids)}.map(function (id) {
      return { isConnected: true, tagName: 'SPAN', dataset: { mkPoster: id }, style: {}, classList: { contains: function () { return false; } } };
    });
    __els.forEach(enqueueMovekitPoster);
  `);
  for (let i = 0; i < 30 && calls.length < 4; i++) await flush();
  assert.equal(calls.length, 4);
  assert.equal(calls.filter(c => c.opt && c.opt.method === 'POST').length, 4);
  release();
  for (let i = 0; i < 30 && calls.length < 8; i++) await flush();
  assert.equal(calls.length, 8);
  release();
  for (let i = 0; i < 30 && calls.length < 10; i++) await flush();
  assert.equal(calls.length, 10);
  assert.equal(calls.filter(c => c.opt && c.opt.method === 'POST').length, 6);
});

test('a cached poster shows without signing, and a miss keeps the placeholder', async () => {
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
  const bag = new Map();
  function URLShim(a, b) { return new URL(a, b); }
  URLShim.createObjectURL = blob => 'blob:cached-' + (blob && blob.size);
  URLShim.revokeObjectURL = () => {};
  const g = {
    console, URL: URLShim, Blob, Map, Promise, JSON, encodeURIComponent, Date, Uint8Array, Response,
    setTimeout, clearTimeout,
    location: { href: 'http://127.0.0.1/' },
    MZ_SB: { url: 'https://example.test', anon: 'anon-test' },
    caches: {
      async open() {
        return {
          async match(u) { return bag.get(u) || null; },
          async put(u, res) { bag.set(u, res); }
        };
      }
    }
  };
  g.window = g;
  g.globalThis = g;
  g.self = g;
  let fetches = 0;
  g.fetch = async url => { if (url !== FN_URL) fetches++; return { ok: false, status: 404 }; };
  const ctx = vm.createContext(g);
  vm.runInContext(fs.readFileSync(path.join(root, 'movekit.js'), 'utf8'), ctx, { filename: 'movekit.js' });
  const go = code => vm.runInContext(code, ctx);
  const key = go('movekitCacheUrl("posters/barbell-bench-press.jpg")');
  bag.set(key, new Response(new Blob([bytes], { type: 'image/jpeg' }), { headers: { 'Content-Type': 'image/jpeg' } }));
  go('globalThis.__v = { isConnected: true, tagName: "VIDEO", dataset: { mkPoster: "bp", mk: "bp" }, style: {}, classList: { contains: function () { return false; } } }');
  await go('loadMovekitPoster(__v)');
  assert.equal(fetches, 0);
  assert.equal(go('__v.dataset.mkPosterState'), 'ok');
  assert.equal(go('__v.poster'), 'blob:cached-' + bytes.length);
  go('globalThis.__miss = { isConnected: true, tagName: "VIDEO", dataset: { mkPoster: "pu" }, style: {}, poster: "", classList: { contains: function () { return false; } } }');
  await go('loadMovekitPoster(__miss)');
  assert.equal(go('__miss.dataset.mkPosterState'), 'fail');
  assert.equal(go('__miss.poster'), '');
  assert.equal(fetches, 1);
});

test('deployed movekit-sign function is used and storage is not signed directly', async () => {
  const calls = [];
  const { go } = posterGlobals(async (url, opt) => {
    calls.push({ url, opt });
    if (url !== FN_URL) throw new Error('direct sign must not be used');
    const p = JSON.parse(opt.body).path;
    return { ok: true, status: 200, json: async () => ({ signedUrl: 'https://example.test/storage/v1/object/sign/movekit/' + p + '?token=fn' }) };
  });
  assert.equal(await go('movekitSignedUrl("bp")'), 'https://example.test/storage/v1/object/sign/movekit/barbell-bench-press.mp4?token=fn');
  assert.equal(await go('movekitPosterSignedUrl("bp")'), 'https://example.test/storage/v1/object/sign/movekit/posters/barbell-bench-press.jpg?token=fn');
  assert.equal(calls.length, 2);
  assert.equal(calls[0].opt.method, 'POST');
  assert.equal(calls[0].opt.headers.apikey, 'anon-test');
  assert.deepEqual(JSON.parse(calls[1].opt.body), { path: 'posters/barbell-bench-press.jpg' });
});

test('a movekit-sign error other than 404 does not fall back to the direct sign', async () => {
  const calls = [];
  const { go } = posterGlobals(async (url, opt) => {
    calls.push(url);
    return { ok: false, status: 429, json: async () => ({}) };
  });
  await assert.rejects(go('movekitSignedUrl("bp")'), /movekit sign 429/);
  assert.deepEqual(calls, [FN_URL]);
});

test('a missing movekit-sign function is asked once, then direct sign is used for a while', async () => {
  const calls = [];
  const { go } = posterGlobals(async (url) => {
    calls.push(url);
    if (url === FN_URL) throw new TypeError('Failed to fetch');
    const file = String(url).split('/').pop();
    return { ok: true, status: 200, json: async () => ({ signedURL: '/object/sign/movekit/' + file + '?token=fixture' }) };
  });
  await go('movekitSignedUrl("bp")');
  await go('movekitSignedUrl("pu")');
  await go('movekitPosterSignedUrl("sq")');
  assert.equal(calls.filter(u => u === FN_URL).length, 1);
  assert.equal(calls.filter(u => u !== FN_URL).length, 3);
});
