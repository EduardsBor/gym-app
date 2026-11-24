'use strict';
// GC-167: integration harness — the REAL app.js + sync.js together on simulated devices:
//  • a device = its own localStorage + IndexedDB that survive app restarts (and an «online» switch);
//  • one fake Supabase server for all devices: auth sessions per device, user_state row PER user_id (RLS-like), events,
//    consent log, account rpc; network errors when the device is offline.
// sync.js internals are reached through a small hook appended to its IIFE (window.__mz).
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));

function server() {
  return { rows: new Map(), log: [], events: [], consent: [] };
}
function device(name) {
  return { name, ls: new Map(), dbs: new Map(), online: true, user: null, failIdbPut: false };
}

function fakeSupabase(srv, dev) {
  const net = () => { if (!dev.online) { const e = new TypeError('Failed to fetch'); throw e; } };
  return {
    createClient() {
      const table = name => ({
        insert(row) { return Promise.resolve().then(() => { net(); (name === 'events' ? srv.events : srv.consent).push({ dev: dev.name, user: dev.user && dev.user.id, row: clone(row) }); return { error: null }; }); },
        upsert(row) {
          return Promise.resolve().then(() => {
            net();
            if (!dev.user || row.user_id !== dev.user.id) return { error: { message: 'RLS: not your row' } };
            srv.rows.set(row.user_id, { payload: clone(row.payload), updated_at: row.updated_at });
            srv.log.push({ op: 'upsert', dev: dev.name, user: row.user_id, ids: (row.payload.workouts || []).map(w => w.id) });
            return { error: null };
          });
        },
        select() {
          return { eq(col, val) { return { maybeSingle() { return Promise.resolve().then(() => {
            net();
            if (!dev.user || val !== dev.user.id) return { data: null, error: { message: 'RLS: not your row' } };
            const r = srv.rows.get(val); return { data: r ? clone(r) : null, error: null };
          }); } }; } };
        },
        delete() { return { eq() { return Promise.resolve({ error: null }); } }; }
      });
      return {
        from: table,
        rpc(n) { return Promise.resolve().then(() => { net(); return { data: n === 'account_is_deleted' ? false : null, error: null }; }); },
        auth: {
          onAuthStateChange() {},
          getSession() { return Promise.resolve({ data: { session: dev.user ? { user: clone(dev.user) } : null } }); },
          // like supabase-js: the default (global) sign-out calls the server → fails offline and the saved session stays;
          // scope 'local' only drops the session on this device (no network needed)
          signOut(o) { if (!dev.online && !(o && o.scope === 'local')) return Promise.reject(new TypeError('Failed to fetch')); dev.user = null; dev.ls.delete('sb-example-auth-token'); return Promise.resolve({ error: null }); },
          updateUser() { return Promise.resolve({}); },
          signInWithOtp() { return Promise.resolve({ error: null }); },
          verifyOtp() { return Promise.resolve({ data: { user: clone(dev.user) }, error: null }); },
          signInWithOAuth() { return Promise.resolve({ error: null }); }
        }
      };
    }
  };
}

function fakeIDB(dev) {
  const later = fn => queueMicrotask(fn);
  function req(fill) {
    const r = { result: undefined, error: null, onsuccess: null, onerror: null, onupgradeneeded: null, onblocked: null };
    later(() => { try { fill(r); if (r.error) { if (r.onerror) r.onerror({ target: r }); return; } if (r.onsuccess) r.onsuccess({ target: r }); } catch (e) { r.error = e; if (r.onerror) r.onerror({ target: r }); } });
    return r;
  }
  function conn(db) {
    return {
      objectStoreNames: { contains: n => db.stores.has(n) },
      createObjectStore(n) { if (!db.stores.has(n)) db.stores.set(n, new Map()); },
      close() {},
      transaction() {
        const staged = [];
        const t = { oncomplete: null, onerror: null, error: null, objectStore(n) { const map = db.stores.get(n); return {
          get(k) { return { result: clone(map.get(k)), readyState: 'done' }; },
          put(v, k) { staged.push(() => map.set(k, clone(v === undefined ? null : v))); return { readyState: 'done' }; },
          delete(k) { staged.push(() => map.delete(k)); return { readyState: 'done' }; },
          getAllKeys() { return { result: [...map.keys()], readyState: 'done' }; } }; } };
        later(() => {
          if (dev.failIdbPut && staged.length) { t.error = new Error('QuotaExceededError'); if (t.onerror) t.onerror(); return; }
          staged.forEach(f => f()); if (t.oncomplete) t.oncomplete();
        });
        return t;
      }
    };
  }
  return {
    open(name, version) {
      return req(r => {
        let db = dev.dbs.get(name); const oldVer = db ? db.version : 0;
        if (!db) { db = { version: version || 1, stores: new Map() }; dev.dbs.set(name, db); }
        if ((version || 1) > oldVer) db.version = version || 1;
        r.result = conn(db);
        if ((version || 1) > oldVer && r.onupgradeneeded) r.onupgradeneeded({ target: r });
      });
    },
    deleteDatabase(name) { return req(() => { dev.dbs.delete(name); }); }
  };
}

// start the app on a device (a «launch»); returns helpers
function launch(srv, dev) {
  const ls = {
    getItem: k => dev.ls.has(k) ? dev.ls.get(k) : null,
    setItem: (k, v) => dev.ls.set(String(k), String(v)),
    removeItem: k => dev.ls.delete(String(k)),
    clear: () => dev.ls.clear(),
    key: i => [...dev.ls.keys()][i] ?? null,
    get length() { return dev.ls.size; }
  };
  const nodes = new Map();
  const el = id => {
    if (id && nodes.has(id)) return nodes.get(id);
    const n = { id: id || '', innerHTML: '', textContent: '', className: '', value: '', style: {}, dataset: {}, classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
      append() {}, addEventListener() {}, insertAdjacentHTML() {}, setAttribute() {}, getAttribute() { return null; }, closest() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; } };
    if (id) nodes.set(id, n); return n;
  };
  const listeners = {};
  const g = {
    console, setTimeout() { return 0; }, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {}, scrollTo() {}, crypto: require('crypto').webcrypto,
    addEventListener(t, f) { (listeners[t] = listeners[t] || []).push(f); }, prompt() { return null; }, confirm() { return true; }, alert() {}, URL, Blob, TextEncoder,
    navigator: { language: 'ru', languages: ['ru'], get onLine() { return dev.online; }, storage: { persist() { return Promise.resolve(true); } } },
    localStorage: ls, location: { href: 'http://127.0.0.1/', origin: 'http://127.0.0.1', pathname: '/', search: '', hash: '', reload() {} },
    history: { replaceState() {} },
    document: { documentElement: { lang: 'ru' }, title: '', body: { append() {}, style: {} }, visibilityState: 'visible',
      querySelector(sel) { const m = /^#([\w-]+)/.exec(sel || ''); return el(m ? m[1] : ''); }, querySelectorAll() { return []; }, addEventListener() {}, createElement() { return el(); } },
    caches: { keys() { return Promise.resolve([]); }, delete() { return Promise.resolve(true); } }
  };
  g.indexedDB = fakeIDB(dev);
  g.MZ_SB = { url: 'https://example.supabase.invalid', anon: 'test-anon' };   // → AUTH_KEY 'sb-example-auth-token'
  g.supabase = fakeSupabase(srv, dev);
  g.window = g; g.globalThis = g; g.self = g;
  const ctx = vm.createContext(g);
  const files = ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js',
    'cards.js', 'warm.js', 'cd.js', 'place.js', 'prog.js', 'plan.js', 'movekit.js', 'premium.js', 'features.js', 'csv.js', 'sync.js'];
  for (const f of files) {
    let src = read(f);
    if (f === 'sync.js') src = src.replace('  init();\n})();', '  window.__mz={afterAuth,sync:()=>sync(),pushNow,doLogout,finishLogout,adoptAccountFromCloud,transferGuestToAccount,snapshotUnboundGuest,get user(){return user},set user(u){user=u},get status(){return status}};\n  init();\n})();');
    vm.runInContext(src, ctx, { filename: f });
  }
  const app = {
    g, dev,
    run: c => vm.runInContext(c, ctx),
    J: c => JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', ctx)),
    settle: async n => { for (let i = 0; i < (n || 40); i++) await new Promise(r => setImmediate(r)); },
    ids: () => JSON.parse(vm.runInContext('JSON.stringify((S.workouts||[]).map(w=>w.id).sort())', ctx)),
    hist: () => { const db = dev.dbs.get('moyzal'); const h = db && db.stores.get('history'); return h ? clone(Object.fromEntries(h)) : {}; },
    bundle: owner => { const db = dev.dbs.get('moyzal'); const h = db && db.stores.get('history'); const Q = (h && h.get('quarantine')) || []; const b = Q.find(x => x && x.owner === owner); return b ? b.workouts.map(w => w.id).sort() : null; }
  };
  // sign in (the code step is done by the person in real life; here the server just opens the session and supabase-js saves it)
  app.signIn = async user => { dev.user = clone(user); dev.ls.set('sb-example-auth-token', JSON.stringify({ user })); app.run('__mz.user=' + JSON.stringify(user)); await app.run('__mz.afterAuth()'); await app.settle(); };
  // a browser event (e.g. «online» when the network is back)
  app.fire = async type => { for (const f of listeners[type] || []) await f({ type }); await app.settle(); };
  app.sync = async () => { await app.run('__mz.sync()'); await app.settle(); };
  // finish a workout the way the app stores it: list + save() (localStorage sync, IndexedDB async)
  app.addWorkout = async (w) => { app.run('S.workouts.push(' + JSON.stringify(w) + ');save()'); await app.settle(); };
  app.deleteWorkout = async (id) => { app.run(`S.workouts=S.workouts.filter(x=>x.id!==${JSON.stringify(id)});S.deletedWorkouts=(S.deletedWorkouts||[]).concat(${JSON.stringify(id)});save()`); await app.settle(); };
  return app;
}
async function start(srv, dev) { const a = launch(srv, dev); await a.run('histReady'); await a.settle(); return a; }
const W = (id, end, extra) => Object.assign({ id, start: end - 3600e3, end, dayName: 'A', items: [{ exId: 'bp', sets: [{ w: 60, r: 10, done: true }] }] }, extra || {});
const cloudIds = (srv, uid) => { const r = srv.rows.get(uid); return r ? (r.payload.workouts || []).map(w => w.id).sort() : null; };
const cloudDeleted = (srv, uid) => { const r = srv.rows.get(uid); return r ? (r.payload.deletedWorkouts || []).slice().sort() : null; };
module.exports = { server, device, launch, start, W, cloudIds, cloudDeleted, clone, read };
