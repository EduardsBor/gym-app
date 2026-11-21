'use strict';
// D-253: automatic cloud sync (triggers, debounce, one run at a time, offline-safe). Harness from d231. Was D-231: sign-in is required at start; session kept for offline; local data kept and synced; Google button behind a flag.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const tick = () => new Promise(r => setImmediate(r));
const USER = { id: '11111111-2222-3333-4444-555555555555', email: 'someone@example.com' };
const DAY = 864e5;

function mockStorage(initial) {
  const data = new Map();
  const ls = {
    getItem(k) { return data.has(k) ? data.get(k) : null; },
    setItem(k, v) { data.set(String(k), String(v)); ls[k] = String(v); },
    removeItem(k) { data.delete(String(k)); delete ls[k]; },
    clear() {
      for (const k of data.keys()) delete ls[k];
      data.clear();
    },
    key(i) { return [...data.keys()][i] ?? null; },
    get length() { return data.size; }
  };
  if (initial) for (const [k, v] of Object.entries(initial)) ls.setItem(k, v);
  return { ls, data };
}

function fakeIDB() {
  const dbs = new Map();
  const later = fn => queueMicrotask(fn);
  function req(fill) {
    const r = { result: undefined, error: null, onsuccess: null, onerror: null, onupgradeneeded: null, onblocked: null };
    later(() => {
      try { fill(r); if (r.onsuccess) r.onsuccess({ target: r }); }
      catch (e) { r.error = e; if (r.onerror) r.onerror({ target: r }); }
    });
    return r;
  }
  function storeApi(map) {
    return {
      get(k) { return { result: map.get(k), error: null }; },
      put(v, k) { map.set(k, v); return { result: undefined, error: null }; },
      delete(k) { map.delete(k); return { result: undefined, error: null }; },
      getAllKeys() { return { result: [...map.keys()], error: null }; }
    };
  }
  function conn(db) {
    return {
      objectStoreNames: { contains: n => db.stores.has(n) },
      createObjectStore(n) { if (!db.stores.has(n)) db.stores.set(n, new Map()); return storeApi(db.stores.get(n)); },
      transaction(storeName) {
        const t = { oncomplete: null, onerror: null, error: null, objectStore(n) { return storeApi(db.stores.get(n)); } };
        later(() => { if (t.oncomplete) t.oncomplete(); });
        return t;
      }
    };
  }
  return {
    dbs,
    indexedDB: {
      open(name, version) {
        return req(r => {
          let db = dbs.get(name);
          const oldVer = db ? db.version : 0;
          if (!db) { db = { version: version || 1, stores: new Map() }; dbs.set(name, db); }
          if ((version || 1) > oldVer) db.version = version || 1;
          r.result = conn(db);
          if ((version || 1) > oldVer && r.onupgradeneeded) r.onupgradeneeded({ target: r, oldVersion: oldVer, newVersion: db.version });
        });
      },
      deleteDatabase(name) { return req(() => { dbs.delete(name); }); }
    }
  };
}

function fakeSupabase(cloud) {
  return {
    createClient() {
      const table = name => ({
        insert(row) { cloud.inserts.push({ table: name, row: JSON.parse(JSON.stringify(row)) }); return Promise.resolve({ error: null }); },
        upsert(row) { cloud.upserts.push({ table: name, row: JSON.parse(JSON.stringify(row)) }); return Promise.resolve({ error: null }); },
        select() { cloud.selects = (cloud.selects || 0) + 1; return { eq() { return { maybeSingle() { if (cloud.netFail) return Promise.reject(new TypeError('Failed to fetch')); return cloud.gate ? cloud.gate.then(() => ({ data: cloud.remote || null, error: null })) : Promise.resolve({ data: cloud.remote || null, error: null }); } }; } }; },
        delete() { return { eq(col, val) { cloud.deletes.push({ table: name, col, val }); return Promise.resolve({ error: cloud.deleteError || null }); } }; }
      });
      return {
        from: table,
        rpc(name, args) { cloud.rpcs.push({ name, args }); return Promise.resolve({ error: cloud.rpcError || null }); },
        auth: {
          onAuthStateChange() {},
          getSession() { return Promise.resolve({ data: { session: cloud.user ? { user: cloud.user } : null } }); },
          signOut() { cloud.signedOut = (cloud.signedOut || 0) + 1; return Promise.resolve({ error: null }); },
          updateUser() { return Promise.resolve({}); },
          signInWithPassword() { cloud.user = USER; return Promise.resolve({ data: { user: USER, session: { user: USER } }, error: null }); },
          signInWithOtp() { return Promise.resolve({ error: null }); },
          verifyOtp() { return this.signInWithPassword(); },
          signInWithOAuth(o) { (cloud.oauth = cloud.oauth || []).push(o); return Promise.resolve({ error: null }); }
        }
      };
    }
  };
}

function elFactory(nodes) {
  return function el(id) {
    if (id && nodes.has(id)) return nodes.get(id);
    const node = {
      id: id || '', innerHTML: '', textContent: '', className: '', value: '', style: {}, dataset: {},
      classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
      append() {}, addEventListener() {}, insertAdjacentHTML() {}, setAttribute() {}, getAttribute() { return null; }, closest() { return null; },
      querySelector() { return null; }, querySelectorAll() { return []; }
    };
    if (id) nodes.set(id, node);
    return node;
  };
}

function boot(stored, opts) {
  opts = opts || {};
  const { ls, data } = mockStorage(stored !== undefined ? { gym: JSON.stringify(stored) } : undefined);
  if (opts.ls) for (const [k, v] of Object.entries(opts.ls)) ls.setItem(k, v);
  const idb = fakeIDB();
  const nodes = new Map();
  const el = elFactory(nodes);
  const g = {
    console, setTimeout(fn, ms) { g.__timers.push({ fn, ms }); return g.__timers.length; }, clearTimeout(id) { if (g.__timers[id - 1]) g.__timers[id - 1].cleared = true; }, setInterval(fn, ms) { g.__intervals.push({ fn, ms }); return 0; }, clearInterval() {},
    scrollTo() {}, crypto: require('crypto').webcrypto, addEventListener(t, fn) { (g.__win[t] = g.__win[t] || []).push(fn); }, prompt() { return null; },
    confirm() { return opts.confirm !== false; }, alert(m) { g.__alerts.push(String(m)); },
    URL, Blob, navigator: { language: 'ru', languages: ['ru'], onLine: !opts.offline },
    localStorage: ls,
    location: { href: 'http://127.0.0.1/', origin: 'http://127.0.0.1', pathname: '/', search: '', reload() { g.__reloaded = true; } },
    document: {
      documentElement: { lang: 'ru' }, title: '', body: { append() {}, style: {} },
      querySelector(sel) { const m = /^#([\w-]+)/.exec(sel || ''); return el(m ? m[1] : ''); },
      querySelectorAll() { return []; }, addEventListener(t, fn) { (g.__doc[t] = g.__doc[t] || []).push(fn); }, createElement() { return el(); }, visibilityState: 'visible'
    },
    indexedDB: idb.indexedDB,
    caches: { keys() { return Promise.resolve(g.__cacheKeys || []); }, delete(k) { g.__cachesDeleted.push(k); return Promise.resolve(true); } },
    __alerts: [], __reloaded: false, __cachesDeleted: [], __timers: [], __intervals: [], __win: {}, __doc: {}
  };
  g.window = g; g.globalThis = g; g.self = g;
  const ctx = vm.createContext(g);
  const files = ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'place.js', 'prog.js', 'plan.js', 'movekit.js', 'premium.js', 'features.js', 'csv.js'];
  if (opts.cloud) {
    g.MZ_SB = Object.assign({ url: 'https://example.invalid', anon: 'test-anon' }, opts.sb || {}); g.supabase = fakeSupabase(opts.cloud);
    files.push('sync.js');
  }
  for (const f of files) {
    let src = read(f);
    if (f === 'sync.js') src = src.replace('  init();\n})();', '  window.__mzApplyRemoteFresh=applyRemoteFresh;window.__mzApplyMerged=applyMerged;window.__mzSync=sync;window.__mzDeleteCloud=mzDeleteCloud;window.__mzLogout=doLogout;\n  init();\n})();');
    vm.runInContext(src, ctx, { filename: f });
  }
  return { run: code => vm.runInContext(code, ctx), store: data, idb: idb.dbs, g };
}

function seed(extra) {
  return Object.assign({
    lang: 'ru', goal: 'mass', days: 3, next: 0, obDone: 1, updatedAt: 1000,
    prof: { goal: 'mass', sex: 'm', level: 'mid', days: 3, len: 60, place: 'g', prio: [], lim: [] },
    program: [{ name: 'A', items: [{ exId: 'bp', sets: 3, min: 8, max: 12, rest: 120 }] }],
    workouts: [], custom: [], body: []
  }, extra || {});
}

function W(id, end, w) {
  return { id, start: end - 1000, end, dayName: 'A', items: [{ exId: 'bp', sets: [{ w: w || 60, r: 10, done: true }] }] };
}

function bootA(stored, opts) {
  opts = opts || {};
  const cloud = opts.cloud || { inserts: [], upserts: [], deletes: [], rpcs: [], oauth: [] };
  const r = boot(stored, Object.assign({}, opts, { cloud }));
  return Object.assign(r, { cloud, html: () => r.run('document.querySelector("#app").innerHTML') });
}
const ticks = async n => { for (let i = 0; i < (n || 30); i++) await tick(); };
async function signedIn() {
  const cloud = { inserts: [], upserts: [], deletes: [], rpcs: [], oauth: [], user: USER };
  const r = bootA(seed(), { ls: { gc_auth: USER.id }, cloud });
  await ticks();
  return r;
}
const sel = r => r.cloud.selects || 0;
const st = r => r.run('document.querySelector("#mzst").textContent');

test('D-253: sync starts by itself after start when signed in', async () => {
  const r = await signedIn();
  assert.equal(sel(r), 1);
  assert.ok(r.cloud.upserts.some(u => u.table === 'user_state'));
  assert.match(st(r), /Синхронизировано/);
});

test('D-253: saved changes are debounced (3 s, one run for many saves)', async () => {
  const r = await signedIn();
  const before = sel(r), t0 = r.g.__timers.length;
  r.run('save();save();save()');
  const ts = r.g.__timers.slice(t0).filter(t => t.ms === 3000);
  assert.equal(ts.length, 3);
  assert.equal(ts.filter(t => !t.cleared).length, 1, 'earlier timers cleared');
  ts.find(t => !t.cleared).fn();
  await ticks();
  assert.equal(sel(r), before + 1);
});

test('D-253: visible / hidden (D-253b) / online / every 5 min trigger a sync', async () => {
  const r = await signedIn();
  let n = sel(r);
  r.g.document.visibilityState = 'hidden'; r.g.__doc.visibilitychange.forEach(f => f()); await ticks();
  assert.equal(sel(r), ++n, 'minimised → sync');
  r.g.__intervals.find(i => i.ms === 300000).fn(); await ticks();
  assert.equal(sel(r), n, 'no periodic sync while hidden');
  r.g.document.visibilityState = 'visible'; r.g.__doc.visibilitychange.forEach(f => f()); await ticks();
  assert.equal(sel(r), ++n);
  r.g.__win.online.forEach(f => f()); await ticks();
  assert.equal(sel(r), ++n);
  r.g.__intervals.find(i => i.ms === 300000).fn(); await ticks();
  assert.equal(sel(r), ++n);
});

test('D-253: one run at a time — calls during a run are queued once', async () => {
  const r = await signedIn();
  let open; r.cloud.gate = new Promise(res => { open = res; });
  const n = sel(r);
  r.run('__mzSync();__mzSync();__mzSync()');
  await ticks();
  assert.equal(sel(r), n + 1, 'no concurrent run');
  assert.equal(st(r), 'Синхронизация…');
  open(); await ticks(80);
  assert.equal(sel(r), n + 2, 'exactly one queued rerun');
  assert.match(st(r), /Синхронизировано/);
});

test('D-253: offline and network errors show only the offline note; back online syncs', async () => {
  const r = await signedIn();
  r.g.navigator.onLine = false;
  r.run('__mzSync()'); await ticks();
  assert.match(st(r), /Нет сети/);
  r.g.navigator.onLine = true; r.cloud.netFail = true;
  r.run('__mzSync()'); await ticks();
  assert.match(st(r), /Нет сети/);
  assert.doesNotMatch(st(r), /не удалась/);
  r.cloud.netFail = false;
  r.g.__win.online.forEach(f => f()); await ticks();
  assert.match(st(r), /Синхронизировано/);
});

test('D-253: no «Синхронизировать сейчас»; «Выйти» syncs first; consent/photo text kept', async () => {
  const s = read('sync.js');
  assert.doesNotMatch(s, /mzsync|Синхронизировать сейчас/);
  assert.doesNotMatch(read('i18n/dict3.js'), /Синхронизировать сейчас/);
  assert.match(s, /id="mzout">Выйти</);
  assert.match(s, /При выходе данные остаются в облаке и вернутся после входа\. Фото тела хранятся только на этом устройстве\./);
  assert.match(read('i18n/dict3.js'), /\['Синхронизация автоматическая: при открытии приложения, после тренировки и изменений, при появлении сети\.','Sync is automatic/);
  assert.ok(fs.existsSync(path.join(root, 'docs/LV-NEW-AUTO-SYNC.md')));
  const r = await signedIn();
  const n = sel(r);
  await r.run('__mzLogout()');
  await ticks();
  assert.equal(sel(r), n + 1, 'final sync before sign-out');
  assert.equal(r.cloud.signedOut, 1);
  const r2 = await signedIn();
  r2.g.navigator.onLine = false;
  const n2 = sel(r2);
  await r2.run('__mzLogout()');
  assert.equal(sel(r2), n2, 'offline: sign out without waiting for the cloud');
});

test('D-253b: pagehide syncs; hidden+pagehide together run once (+1 queued), pending debounce is dropped', async () => {
  const r = await signedIn();
  const n = sel(r);
  r.g.__win.pagehide.forEach(f => f()); await ticks();
  assert.equal(sel(r), n + 1);
  let open; r.cloud.gate = new Promise(res => { open = res; });
  const t0 = r.g.__timers.length;
  r.run('save()');
  r.g.document.visibilityState = 'hidden'; r.g.__doc.visibilitychange.forEach(f => f()); r.g.__win.pagehide.forEach(f => f());
  await ticks();
  assert.equal(sel(r), n + 2, 'no parallel run');
  assert.ok(r.g.__timers.slice(t0).filter(t => t.ms === 3000).every(t => t.cleared), 'debounced sync cleared');
  open(); await ticks(80);
  assert.equal(sel(r), n + 3, 'one queued rerun only');
});

test('D-253b: hidden / pagehide without sign-in do nothing and stay silent', async () => {
  const cloud = { inserts: [], upserts: [], deletes: [], rpcs: [], oauth: [] };
  const r = bootA(seed(), { cloud });
  await ticks();
  const n = sel(r);
  r.g.document.visibilityState = 'hidden';
  (r.g.__doc.visibilitychange || []).forEach(f => f()); (r.g.__win.pagehide || []).forEach(f => f()); await ticks();
  assert.equal(sel(r), n);
  assert.equal(r.g.__alerts.length, 0);
});
