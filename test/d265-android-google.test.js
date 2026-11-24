'use strict';
// D-265: Android app — Google sign-in in an in-app Custom Tab, back via auth-callback.html → app.gymcaptain://auth-callback (PKCE exchange in the app).
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
    createClient(url, key, o) {
      cloud.clientOpts = o;
      const table = name => ({
        insert(row) { cloud.inserts.push({ table: name, row: JSON.parse(JSON.stringify(row)) }); return Promise.resolve({ error: null }); },
        upsert(row) { cloud.upserts.push({ table: name, row: JSON.parse(JSON.stringify(row)) }); return Promise.resolve({ error: null }); },
        select() { return { eq() { return { maybeSingle() { return Promise.resolve({ data: cloud.remote || null, error: null }); } }; } }; },
        delete() { return { eq(col, val) { cloud.deletes.push({ table: name, col, val }); return Promise.resolve({ error: cloud.deleteError || null }); } }; }
      });
      return {
        from: table,
        rpc(name, args) { cloud.rpcs.push({ name, args }); return Promise.resolve({ error: cloud.rpcError || null }); },
        auth: {
          onAuthStateChange(fn) { cloud.listener = fn; },
          getSession() {
            if (cloud.pending) { cloud.pending = false; return new Promise(res => { cloud.release = () => res({ data: { session: cloud.user ? { user: cloud.user } : null } }); }); }
            if (cloud.getError) return Promise.resolve({ data: { session: null }, error: { message: 'Failed to fetch' } });
            if (cloud.refreshOnGet) { cloud.refreshOnGet = false; cloud.refreshed = (cloud.refreshed || 0) + 1; cloud.user = USER; }
            return Promise.resolve({ data: { session: cloud.user ? { user: cloud.user } : null } });
          },
          signOut() { cloud.signedOut = (cloud.signedOut || 0) + 1; return Promise.resolve({ error: null }); },
          updateUser() { return Promise.resolve({}); },
          signInWithPassword() { cloud.user = USER; return Promise.resolve({ data: { user: USER, session: { user: USER } }, error: null }); },
          signInWithOtp() { return Promise.resolve({ error: null }); },
          verifyOtp() { return this.signInWithPassword(); },
          signInWithOAuth(o) { (cloud.oauth = cloud.oauth || []).push(o); return Promise.resolve({ data: { url: 'https://example.invalid/auth/v1/authorize?provider=google' }, error: null }); },
          exchangeCodeForSession(c) { (cloud.exchanged = cloud.exchanged || []).push(c); if (cloud.exchangeError) return Promise.resolve({ data: {}, error: { message: cloud.exchangeError } }); cloud.user = USER; return Promise.resolve({ data: { session: { user: USER } }, error: null }); }
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
    console, setTimeout() { return 0; }, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
    scrollTo() {}, crypto: require('crypto').webcrypto, addEventListener(t, fn) { g.__listeners[t] = fn; }, prompt() { return null; },
    confirm() { return opts.confirm !== false; }, alert(m) { g.__alerts.push(String(m)); },
    URL, Blob, navigator: { language: 'ru', languages: ['ru'], onLine: !opts.offline },
    localStorage: ls,
    location: Object.assign({ href: 'http://127.0.0.1/' + (opts.search || ''), origin: 'http://127.0.0.1', pathname: '/', search: opts.search || '', hash: '', replace() {}, reload() { g.__reloaded = true; } }, opts.loc || {}),
    document: {
      documentElement: { lang: 'ru' }, title: '', body: { append() {}, style: {} },
      querySelector(sel) { const m = /^#([\w-]+)/.exec(sel || ''); return el(m ? m[1] : ''); },
      querySelectorAll() { return []; }, addEventListener() {}, createElement() { return el(); }
    },
    indexedDB: idb.indexedDB,
    caches: { keys() { return Promise.resolve(g.__cacheKeys || []); }, delete(k) { g.__cachesDeleted.push(k); return Promise.resolve(true); } },
    __alerts: [], __listeners: {}, __reloaded: false, __cachesDeleted: []
  };
  if (opts.native) g.Capacitor = opts.native;
  g.window = g; g.globalThis = g; g.self = g;
  const ctx = vm.createContext(g);
  const files = ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'place.js', 'prog.js', 'plan.js', 'movekit.js', 'premium.js', 'features.js', 'csv.js'];
  if (opts.cloud) {
    g.MZ_SB = Object.assign({ url: 'https://example.invalid', anon: 'test-anon' }, opts.sb || {}); g.supabase = fakeSupabase(opts.cloud);
    files.push('sync.js');
  }
  for (const f of files) {
    let src = read(f);
    if (f === 'sync.js') src = src.replace('  init();\n})();', '  window.__mzApplyRemoteFresh=applyRemoteFresh;window.__mzApplyMerged=applyMerged;window.__mzSync=sync;window.__mzDeleteCloud=mzDeleteCloud;\n  init();\n})();');
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
const go = async (r, v) => { r.run(`view=${JSON.stringify(v || 'today')};render()`); for (let i = 0; i < 6; i++) await tick(); };
const LIVE = { href: 'https://eduardsbor.github.io/gym-app/index.html', origin: 'https://eduardsbor.github.io', pathname: '/gym-app/index.html' };

function nativeMock() {
  const n = { opened: [], closed: 0, listeners: {}, launchUrl: null };
  n.cap = {
    isNativePlatform: () => true,
    Plugins: {
      Browser: { open(o) { n.opened.push(o.url); return Promise.resolve(); }, close() { n.closed++; return Promise.resolve(); } },
      App: { addListener(ev, fn) { n.listeners[ev] = fn; return Promise.resolve({ remove() {} }); }, getLaunchUrl() { return Promise.resolve(n.launchUrl ? { url: n.launchUrl } : undefined); } }
    }
  };
  return n;
}
const APPLOC = { href: 'https://localhost/', origin: 'https://localhost', pathname: '/' };
const settle = async () => { for (let i = 0; i < 30; i++) await tick(); };

test('D-265: Android — Google opens in the in-app browser tab, redirect to the bounce page, no WebView navigation', async () => {
  const n = nativeMock();
  const r = bootA(undefined, { sb: { googleAuth: true }, loc: APPLOC, native: n.cap });
  await go(r);
  r.run('document.querySelector("#mzgoogle").onclick()');
  await settle();
  assert.equal(r.cloud.oauth.length, 1);
  assert.equal(r.cloud.oauth[0].provider, 'google');
  assert.equal(r.cloud.oauth[0].options.redirectTo, 'https://eduardsbor.github.io/gym-app/auth-callback.html');
  assert.equal(r.cloud.oauth[0].options.skipBrowserRedirect, true);
  assert.deepEqual(n.opened, ['https://example.invalid/auth/v1/authorize?provider=google']);
  assert.equal(typeof n.listeners.appUrlOpen, 'function');
});

test('D-265: Android — app.gymcaptain://auth-callback?code= is exchanged (PKCE), browser closed, user signed in', async () => {
  const n = nativeMock();
  const r = bootA(undefined, { sb: { googleAuth: true }, loc: APPLOC, native: n.cap });
  await go(r);
  n.listeners.appUrlOpen({ url: 'app.gymcaptain://auth-callback?code=abc123' });
  await settle();
  assert.deepEqual(r.cloud.exchanged, ['abc123']);
  assert.ok(n.closed >= 1);
  assert.equal(r.store.get('gc_auth'), USER.id);
  assert.notEqual(r.run('view'), 'auth');
  // the same code delivered twice (appUrlOpen + launch URL) is exchanged once
  n.listeners.appUrlOpen({ url: 'app.gymcaptain://auth-callback?code=abc123' });
  await settle();
  assert.equal(r.cloud.exchanged.length, 1);
});

test('D-265: Android — cold start with the callback as launch URL also signs in; foreign URLs ignored', async () => {
  const n = nativeMock();
  n.launchUrl = 'app.gymcaptain://auth-callback?code=cold1';
  const r = bootA(undefined, { sb: { googleAuth: true }, loc: APPLOC, native: n.cap });
  await go(r);
  await settle();
  assert.deepEqual(r.cloud.exchanged, ['cold1']);
  n.listeners.appUrlOpen({ url: 'https://evil.example/?code=x' });
  await settle();
  assert.deepEqual(r.cloud.exchanged, ['cold1']);
});

test('D-265: Android — error from Google/Supabase is shown, nothing exchanged', async () => {
  const n = nativeMock();
  const r = bootA(undefined, { sb: { googleAuth: true }, loc: APPLOC, native: n.cap });
  await go(r);
  n.listeners.appUrlOpen({ url: 'app.gymcaptain://auth-callback?error=access_denied&error_description=Cancelled' });
  await settle();
  assert.equal(r.cloud.exchanged, undefined);
  assert.equal(r.run('view'), 'auth');
});

test('D-265: web (PWA) flow unchanged — redirect to the site, no Custom Tab', async () => {
  const r = bootA(undefined, { sb: { googleAuth: true }, loc: LIVE });
  await go(r);
  r.run('document.querySelector("#mzgoogle").onclick()');
  await settle();
  assert.equal(r.cloud.oauth[0].options.redirectTo, 'https://eduardsbor.github.io/gym-app/');
  assert.equal(r.cloud.oauth[0].options.skipBrowserRedirect, undefined);
});

test('D-265: bounce page, manifest intent-filter, plugins, SW', () => {
  const cb = read('auth-callback.html');
  assert.match(cb, /intent:\/\/auth-callback/);
  assert.match(cb, /scheme=app\.gymcaptain;package=app\.gymcaptain/);
  assert.doesNotMatch(cb, /localStorage|fetch\(/);
  const m = read('android/app/src/main/AndroidManifest.xml');
  assert.match(m, /android:scheme="app\.gymcaptain" android:host="auth-callback"/);
  assert.match(m, /android\.intent\.category\.BROWSABLE/);
  const pkg = JSON.parse(read('package.json'));
  assert.ok(pkg.devDependencies['@capacitor/browser'] && pkg.devDependencies['@capacitor/app']);
  assert.match(read('android/app/build.gradle'), /versionCode 9/);
  const sw = read('sw.js');
  assert.match(read('cache-ver.js'), /var SW_CACHE='moyzal-v170'/);
  assert.match(read('sw.js'), /const C=SW_CACHE/);
  assert.match(sw, /privacy\|terms\|auth-callback/);
});

test('D-265: Android build copies every script index.html loads (blocks.js, exscreen.js) and data/blocks', () => {
  const b = read('scripts/build-web.js');
  const files = [...b.match(/const FILES = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
  const dirs = [...b.match(/const DIRS = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
  for (const src of [...read('index.html').matchAll(/<script src="([^"]+)"/g)].map(m => m[1])) {
    assert.ok(files.includes(src) || dirs.includes(src.split('/')[0]), 'build-web.js misses ' + src);
  }
  assert.ok(dirs.includes('data'));
});
