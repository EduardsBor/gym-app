'use strict';
// D-207: workout history in IndexedDB, one-time localStorage migration, persist() once, LS fallback.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const tick = () => new Promise(r => setImmediate(r));
async function flush(n) { for (let i = 0; i < (n || 8); i++) await tick(); }

function mockStorage(initial) {
  const data = new Map();
  const ls = {
    getItem(k) { return data.has(k) ? data.get(k) : null; },
    setItem(k, v) { data.set(String(k), String(v)); ls[k] = String(v); },
    removeItem(k) { data.delete(String(k)); delete ls[k]; },
    clear() { for (const k of data.keys()) delete ls[k]; data.clear(); },
    key(i) { return [...data.keys()][i] ?? null; },
    get length() { return data.size; }
  };
  if (initial) for (const [k, v] of Object.entries(initial)) ls.setItem(k, v);
  return { ls, data };
}

function fakeIDB(opts) {
  const dbs = new Map();
  const later = fn => queueMicrotask(fn);
  const failOpen = !!(opts && opts.failOpen);
  if (opts && opts.preHist) dbs.set('moyzal', { version: 2, stores: new Map([['photos', new Map()], ['history', new Map([['workouts', opts.preHist]])]]) });
  function req(fill) {
    const r = { result: undefined, error: null, onsuccess: null, onerror: null, onupgradeneeded: null, onblocked: null };
    later(() => {
      try { fill(r); if (r.error) { if (r.onerror) r.onerror({ target: r }); return; } if (r.onsuccess) r.onsuccess({ target: r }); }
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
          if (failOpen) { r.error = new Error('idb disabled'); return; }
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

function seed(extra) {
  return Object.assign({
    lang: 'ru', goal: 'mass', days: 3, next: 0, schema: 4, ownerPremium: false, obDone: 1,
    prof: { goal: 'mass', sex: 'm', level: 'mid', days: 3, len: 60, place: 'g', prio: [], lim: [] },
    program: [{ name: 'A', items: [{ exId: 'bp', sets: 3, min: 8, max: 12, rest: 120 }] }],
    workouts: [], custom: [], body: []
  }, extra || {});
}
function W(id, end, exId, w) {
  return { id, start: end - 3600e3, end, dayName: 'A', notes: '', items: [{ exId: exId || 'bp', sets: [{ w: w || 60, r: 10, done: true }] }] };
}

function boot(stored, opts) {
  opts = opts || {};
  const initial = stored !== undefined ? { gym: JSON.stringify(stored) } : {};
  if (opts.ls) Object.assign(initial, opts.ls);
  const { ls, data } = mockStorage(Object.keys(initial).length ? initial : undefined);
  const idb = opts.noIdb ? null : fakeIDB(opts);
  const persistCalls = { n: 0 };
  const nodes = new Map();
  function el(id) {
    if (id && nodes.has(id)) return nodes.get(id);
    const node = {
      id: id || '', innerHTML: '', textContent: '', className: '', value: '', style: {}, dataset: {},
      classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
      append() {}, addEventListener() {}, insertAdjacentHTML() {}, setAttribute() {}, getAttribute() { return null; }, closest() { return null; },
      querySelector() { return null; }, querySelectorAll() { return []; }
    };
    if (id) nodes.set(id, node);
    return node;
  }
  const g = {
    console, setTimeout() { return 0; }, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
    scrollTo() {}, crypto: require('crypto').webcrypto, addEventListener() {}, prompt() { return null; },
    confirm() { return true; }, alert() {},
    URL, Blob,
    navigator: {
      language: 'ru', languages: ['ru'],
      storage: {
        persist() { persistCalls.n++; return Promise.resolve(opts.persistResult !== undefined ? opts.persistResult : true); }
      }
    },
    localStorage: ls,
    location: { href: 'http://127.0.0.1/', origin: 'http://127.0.0.1', pathname: '/', search: '', reload() { g.__reloaded = true; } },
    document: {
      documentElement: { lang: 'ru' }, title: '', body: { append() {}, style: {} },
      querySelector(sel) { const m = /^#([\w-]+)/.exec(sel || ''); return el(m ? m[1] : ''); },
      querySelectorAll() { return []; }, addEventListener() {}, createElement() { return el(); }
    },
    __reloaded: false
  };
  if (idb) g.indexedDB = idb.indexedDB;
  g.window = g; g.globalThis = g; g.self = g;
  const ctx = vm.createContext(g);
  const files = ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'place.js', 'csv.js', 'premium.js', 'features.js'];
  for (const f of files) vm.runInContext(read(f), ctx, { filename: f });
  return { run: code => vm.runInContext(code, ctx), store: data, idb: idb && idb.dbs, persistCalls, g };
}

const jclone = v => JSON.parse(JSON.stringify(v));
function histFromDb(dbs) {
  const db = dbs && dbs.get('moyzal');
  if (!db) return undefined;
  const store = db.stores.get('history');
  return store ? store.get('workouts') : undefined;
}

test('empty history migrates once: IDB gets [], backup snapshot is kept, gym copy stays', async () => {
  const b = boot(seed({ workouts: [] }));
  const r = await b.run('histReady');
  assert.equal(r.ok, true);
  assert.equal(r.source, 'migrated');
  assert.deepEqual(jclone(histFromDb(b.idb)), []);
  assert.equal(b.store.get('gym_hist_backup'), '[]');
  assert.equal(b.store.get('gym_hist_idb'), '1');
  assert.deepEqual(JSON.parse(b.store.get('gym')).workouts, []);
  assert.equal(b.run('S.workouts.length'), 0);
});

test('existing history migrates to IndexedDB; ids and format stay intact; localStorage copy remains', async () => {
  const workouts = [W('w-old', 1_700_000_000_000, 'bp', 60), W('w-new', 1_700_100_000_000, 'sq', 80)];
  const frozen = JSON.parse(JSON.stringify(workouts));
  const b = boot(seed({ workouts }));
  const r = await b.run('histReady');
  assert.equal(r.ok, true);
  assert.equal(r.source, 'migrated');
  const idbList = histFromDb(b.idb);
  assert.deepEqual(jclone(idbList), frozen);
  assert.deepEqual(JSON.parse(b.store.get('gym_hist_backup')), frozen);
  assert.deepEqual(JSON.parse(b.store.get('gym')).workouts, frozen);
  assert.deepEqual(JSON.parse(b.run('JSON.stringify(S.workouts)')), frozen);
  assert.deepEqual(jclone(idbList).map(w => w.items.map(i => i.exId)), [['bp'], ['sq']]);
  // CSV and in-memory stats still see the same history
  const csv = b.run('workoutsCsv(S.workouts, csvExName, null, typeof isCardio==="function"?isCardio:null)');
  assert.match(csv, /w-old|bp/);
  assert.match(csv, /sq/);
  assert.equal(b.run('S.workouts.length'), 2);
});

test('rerunning migration is idempotent and does not overwrite the backup', async () => {
  const workouts = [W('w1', 1_700_000_000_000, 'bp', 60)];
  const b = boot(seed({ workouts: JSON.parse(JSON.stringify(workouts)) }));
  await b.run('histReady');
  const backup1 = b.store.get('gym_hist_backup');
  // a later workout is saved; backup must stay the original snapshot
  b.run(`S.workouts.push(${JSON.stringify(W('w2', 1_700_200_000_000, 'dl', 100))}); save()`);
  await flush();
  const r2 = await b.run('migrateHistory()');
  assert.equal(r2.ok, true);
  assert.equal(r2.source, 'idb'); // already in IDB
  assert.equal(b.store.get('gym_hist_backup'), backup1);
  assert.deepEqual(JSON.parse(backup1).map(w => w.id), ['w1']);
  const ids = jclone(histFromDb(b.idb)).map(w => w.id);
  assert.deepEqual(ids, ['w1', 'w2']); // saved workout is in IDB, not duplicated
  assert.equal(ids.filter(id => id === 'w1').length, 1);
});

test('if IndexedDB is missing, history stays in localStorage and the app keeps working', async () => {
  const workouts = [W('w1', 1_700_000_000_000, 'bp', 55)];
  const b = boot(seed({ workouts }), { noIdb: true });
  const r = await b.run('histReady');
  assert.equal(r.ok, false);
  assert.equal(r.fallback, 'localStorage');
  assert.equal(b.store.has('gym_hist_idb'), false);
  assert.deepEqual(JSON.parse(b.run('JSON.stringify(S.workouts.map(w=>w.id))')), ['w1']);
  assert.equal(JSON.parse(b.store.get('gym')).workouts[0].items[0].exId, 'bp');
  b.run(`S.workouts.push(${JSON.stringify(W('w2', 1_700_200_000_000, 'sq', 70))}); save()`);
  await flush();
  assert.deepEqual(JSON.parse(b.store.get('gym')).workouts.map(w => w.id), ['w1', 'w2']);
  const csv = b.run('workoutsCsv(S.workouts, csvExName)');
  assert.match(csv, /bp/);
  assert.match(csv, /sq/);
});

test('if IndexedDB open fails, migration falls back to localStorage', async () => {
  const workouts = [W('w1', 1_700_000_000_000, 'bp', 55)];
  const b = boot(seed({ workouts }), { failOpen: true });
  const r = await b.run('histReady');
  assert.equal(r.ok, false);
  assert.equal(r.fallback, 'localStorage');
  assert.deepEqual(JSON.parse(b.run('JSON.stringify(S.workouts.map(w=>[w.id,w.items[0].exId]) )')), [['w1', 'bp']]);
  assert.ok(b.store.has('gym'));
});

test('persist() is asked once and the result is recorded; a second call does nothing', async () => {
  const b = boot(seed({ workouts: [W('w1', 1_700_000_000_000, 'bp', 60)] }));
  await b.run('histReady');
  await flush();
  assert.equal(b.persistCalls.n, 1);
  assert.equal(b.store.get('gymPersist'), 'granted');
  await b.run('requestPersist()');
  await flush();
  assert.equal(b.persistCalls.n, 1);
});

test('persist() is not asked again when gymPersist is already stored', async () => {
  const b = boot(seed({ workouts: [W('w1', 1_700_000_000_000, 'bp', 60)] }), { ls: { gymPersist: 'denied' } });
  await b.run('histReady');
  await flush();
  assert.equal(b.persistCalls.n, 0);
  assert.equal(b.store.get('gymPersist'), 'denied');
});

test('clearLocalData removes gym, the history backup and the IndexedDB database', async () => {
  const b = boot(seed({ workouts: [W('w1', 1_700_000_000_000, 'bp', 60)] }));
  await b.run('histReady');
  await flush();
  assert.ok(b.store.has('gym'));
  assert.ok(b.store.has('gym_hist_backup'));
  assert.ok(b.idb.has('moyzal'));
  await b.run('clearLocalData()');
  await flush();
  assert.equal(b.store.has('gym'), false);
  assert.equal(b.store.has('gym_hist_backup'), false);
  assert.equal(b.store.has('gym_hist_idb'), false);
  assert.equal(b.store.has('gymPersist'), false);
  assert.equal(b.idb.has('moyzal'), false);
});

test('service worker cache is moyzal-v67 and still precaches app.js and sync.js', () => {
  const sw = read('sw.js');
  assert.match(sw, /const C='moyzal-v86'/);
  assert.equal(sw.includes("C='moyzal-v62'"), false);
  assert.match(sw, /'app\.js'/);
  assert.match(sw, /'sync\.js'/);
  assert.match(read('CHANGELOG.md'), /D-207/);
});

// D-207 fix (Claude 15.11): startup merges IDB + localStorage history by id instead of replacing it.
test('startup: a workout only in localStorage (IDB write not finished) survives and is written back to IDB', async () => {
  const w1 = W('w1', 1_700_000_000_000, 'bp', 60), w2 = W('w2', 1_700_100_000_000, 'sq', 80);
  const b = boot(seed({ workouts: [w1, w2] }), { ls: { gym_hist_idb: '1' }, preHist: [jclone(w1)] });
  const r = await b.run('histReady');
  assert.equal(r.source, 'idb');
  assert.deepEqual(JSON.parse(b.run('JSON.stringify(S.workouts.map(w=>w.id))')), ['w1', 'w2']);
  assert.deepEqual(jclone(histFromDb(b.idb)).map(w => w.id), ['w1', 'w2']);
  assert.deepEqual(JSON.parse(b.store.get('gym')).workouts.map(w => w.id), ['w1', 'w2']);
  assert.equal(jclone(histFromDb(b.idb))[1].items[0].exId, 'sq');
});

test('startup: a workout deleted locally is not resurrected from IDB', async () => {
  const w1 = W('w1', 1_700_000_000_000, 'bp', 60), w2 = W('w2', 1_700_100_000_000, 'sq', 80);
  const b = boot(seed({ workouts: [w1], deletedWorkouts: ['w2'] }), { preHist: [jclone(w1), jclone(w2)] });
  await b.run('histReady');
  assert.deepEqual(JSON.parse(b.run('JSON.stringify(S.workouts.map(w=>w.id))')), ['w1']);
  assert.deepEqual(jclone(histFromDb(b.idb)).map(w => w.id), ['w1']);
  assert.deepEqual(JSON.parse(b.store.get('gym')).deletedWorkouts, ['w2']);
});

test('startup: workouts in both IDB and localStorage are not duplicated; IDB-only ones are kept; newer edit wins', async () => {
  const w1 = W('w1', 1_700_000_000_000, 'bp', 60), w2 = W('w2', 1_700_100_000_000, 'sq', 80), w3 = W('w3', 1_700_200_000_000, 'dl', 100);
  const w2edited = Object.assign(jclone(w2), { updatedAt: 1_700_300_000_000, notes: 'edited' });
  const b = boot(seed({ workouts: [w1, w2edited] }), { preHist: [jclone(w1), jclone(w2), jclone(w3)] });
  await b.run('histReady');
  const ids = JSON.parse(b.run('JSON.stringify(S.workouts.map(w=>w.id))'));
  assert.deepEqual(ids, ['w1', 'w2', 'w3']);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(b.run('S.workouts[1].notes'), 'edited');
  assert.deepEqual(jclone(histFromDb(b.idb)).map(w => w.id), ['w1', 'w2', 'w3']);
  assert.deepEqual(b.run('JSON.stringify(mergeHist([{id:"a",end:2}],[{id:"a",end:1}],[]))'), '[{"id":"a","end":2}]');
});
