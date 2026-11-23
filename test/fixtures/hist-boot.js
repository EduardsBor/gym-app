'use strict';
// GC-166: shared harness for workout-history tests — mock localStorage + fake IndexedDB ('moyzal' / 'history')
// with presets (workouts / owner / quarantine), a switchable failing write and app scripts loaded in a vm.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

function mockStorage(initial) {
  const data = new Map();
  const ls = {
    getItem(k) { return data.has(k) ? data.get(k) : null; },
    setItem(k, v) { data.set(String(k), String(v)); },
    removeItem(k) { data.delete(String(k)); },
    clear() { data.clear(); },
    key(i) { return [...data.keys()][i] ?? null; },
    get length() { return data.size; }
  };
  if (initial) for (const [k, v] of Object.entries(initial)) ls.setItem(k, v);
  return { ls, data };
}

// opts: preHist (workouts), preOwner (any, incl. null), preQ (quarantine), failPut (bool), dbs (reuse a Map = same device)
function fakeIDB(opts) {
  const dbs = opts.dbs || new Map();
  const later = fn => queueMicrotask(fn);
  if (!opts.dbs) {
    const hist = new Map();
    if (opts.preHist) hist.set('workouts', opts.preHist);
    if ('preOwner' in opts) hist.set('owner', opts.preOwner);
    if (opts.preQ) hist.set('quarantine', opts.preQ);
    if (hist.size) dbs.set('moyzal', { version: 2, stores: new Map([['photos', new Map()], ['history', hist]]) });
  }
  const ctl = { failPut: !!opts.failPut, puts: 0 };
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
          get(k) { return { result: map.get(k), readyState: 'done' }; },
          put(v, k) { staged.push(() => map.set(k, JSON.parse(JSON.stringify(v === undefined ? null : v)))); return { readyState: 'done' }; },
          delete(k) { staged.push(() => map.delete(k)); return { readyState: 'done' }; },
          getAllKeys() { return { result: [...map.keys()], readyState: 'done' }; } }; } };
        later(() => {
          if (ctl.failPut && staged.length) { t.error = new Error('QuotaExceededError'); if (t.onerror) t.onerror(); return; }   // all-or-nothing, like a real aborted transaction
          if (staged.length) ctl.puts++;
          staged.forEach(f => f()); if (t.oncomplete) t.oncomplete();
        });
        return t;
      }
    };
  }
  return {
    dbs, ctl,
    indexedDB: {
      open(name, version) {
        return req(r => {
          let db = dbs.get(name); const oldVer = db ? db.version : 0;
          if (!db) { db = { version: version || 1, stores: new Map() }; dbs.set(name, db); }
          if ((version || 1) > oldVer) db.version = version || 1;
          r.result = conn(db);
          if ((version || 1) > oldVer && r.onupgradeneeded) r.onupgradeneeded({ target: r });
        });
      },
      deleteDatabase(name) { return req(() => { dbs.delete(name); }); }
    }
  };
}

// stored: state for localStorage 'gym' (undefined = no localStorage copy); opts as fakeIDB + lsRaw (Map of the same device)
function boot(stored, opts) {
  opts = opts || {};
  const initial = stored !== undefined ? { gym: JSON.stringify(stored) } : {};
  const { ls, data } = mockStorage(initial);
  const idb = fakeIDB(opts);
  const el = () => ({ innerHTML: '', textContent: '', className: '', value: '', style: {}, dataset: {}, classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
    append() {}, addEventListener() {}, insertAdjacentHTML() {}, setAttribute() {}, getAttribute() { return null; }, closest() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; } });
  const g = {
    console, setTimeout() { return 0; }, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {}, scrollTo() {}, crypto: require('crypto').webcrypto,
    addEventListener() {}, prompt() { return null; }, confirm() { return true; }, alert() {}, URL, Blob,
    navigator: { language: 'ru', languages: ['ru'], storage: { persist() { return Promise.resolve(true); } } },
    localStorage: ls, location: { href: 'http://127.0.0.1/', origin: 'http://127.0.0.1', pathname: '/', search: '', reload() {} },
    document: { documentElement: { lang: 'ru' }, title: '', body: { append() {}, style: {} }, querySelector: el, querySelectorAll() { return []; }, addEventListener() {}, createElement: el }
  };
  g.indexedDB = idb.indexedDB;
  g.window = g; g.globalThis = g; g.self = g;
  const ctx = vm.createContext(g);
  for (const f of ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'place.js', 'csv.js', 'premium.js', 'features.js'])
    vm.runInContext(read(f), ctx, { filename: f });
  const b = { run: c => vm.runInContext(c, ctx), J: c => JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', ctx)), store: data, idb, g };
  b.hist = () => { const db = idb.dbs.get('moyzal'); const h = db && db.stores.get('history'); return h ? JSON.parse(JSON.stringify(Object.fromEntries(h))) : {}; };
  b.ls = () => JSON.parse(data.get('gym') || 'null');
  return b;
}
const settle = async n => { for (let i = 0; i < (n || 30); i++) await new Promise(r => setImmediate(r)); };
// a restart on the same device: same IndexedDB (Map), localStorage copied as it was left
function restart(prev, opts) { return boot(prev.ls() === null ? undefined : prev.ls(), Object.assign({ dbs: prev.idb.dbs }, opts || {})); }
const ids = list => JSON.parse(JSON.stringify((list || []).map(w => w.id).sort()));
const W = (id, end, w) => ({ id, start: end - 3600e3, end, dayName: 'A', items: [{ exId: 'bp', sets: [{ w: w || 60, r: 10, done: true }] }] });
function seed(extra) {
  return Object.assign({ lang: 'ru', goal: 'mass', days: 3, next: 0, schema: 4, obDone: 1, prof: { goal: 'mass', sex: 'm', level: 'mid', days: 3, len: 60, place: 'g', prio: [], lim: [] },
    program: [{ name: 'A', items: [{ exId: 'bp', sets: 3, min: 8, max: 12, rest: 120 }] }], workouts: [], custom: [], body: [] }, extra || {});
}
module.exports = { boot, restart, settle, ids, W, seed, read, root };
