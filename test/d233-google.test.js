'use strict';
// D-233: «Войти через Google» on top of the sign-in screen; redirect to the live site; session picked up after return.
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

test('D-233: Google button is on top, big, with the «new account» note, above email/password', async () => {
  const r = bootA(undefined, { sb: { googleAuth: true }, loc: LIVE });
  await go(r);
  const h = r.html();
  assert.match(h, /id="mzgoogle"[^>]*font-size:18px[^>]*>Войти через Google</);
  assert.match(h, /id="mzgnote"[^>]*>Новый аккаунт создастся автоматически</);
  assert.ok(h.indexOf('id="mzgoogle"') < h.indexOf('id="mzemail"'));
  assert.doesNotMatch(h, /id="mzpass"/);
  assert.match(read('supabase-config.js'), /googleAuth:true/);
  assert.match(read('i18n/dict3.js'), /\['Новый аккаунт создастся автоматически','[^']+','[^']+'\]/);
});

test('D-233: signInWithOAuth(google) redirects to https://eduardsbor.github.io/gym-app/', async () => {
  const r = bootA(undefined, { sb: { googleAuth: true }, loc: LIVE });
  await go(r);
  r.run('document.querySelector("#mzgoogle").onclick()');
  for (let i = 0; i < 4; i++) await tick();
  assert.equal(r.cloud.oauth.length, 1);
  assert.equal(r.cloud.oauth[0].provider, 'google');
  assert.equal(r.cloud.oauth[0].options.redirectTo, 'https://eduardsbor.github.io/gym-app/');
});

test('D-233: after the Google return (?code=) — «Вход…», then the ready-program catalog', async () => {
  const cloud = { inserts: [], upserts: [], deletes: [], rpcs: [], oauth: [], pending: true };
  const r = bootA(undefined, { cloud, sb: { googleAuth: true }, loc: Object.assign({}, LIVE, { pathname: '/gym-app/' }), search: '?code=abc' });
  r.run('view="today";render()');
  assert.match(r.html(), /id="mzwait"/);
  cloud.user = USER; cloud.release();
  for (let i = 0; i < 30; i++) await tick();
  assert.equal(r.run('view'), 'catalog');
  assert.equal(r.store.get('gc_auth'), USER.id);
  assert.match(r.html(), /Подобрать программу под себя/);
});
