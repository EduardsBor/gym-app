'use strict';
// GC-165-01: workout history (localStorage 'gym' + IndexedDB 'history') — mergeHist / migrateHistory scenarios 1–7.
// Harness = d207.test.js (fake IndexedDB, mock localStorage) + owner mark, a failing write and sync.js source checks.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
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

function fakeIDB(opts) {
  const dbs = new Map();
  const later = fn => queueMicrotask(fn);
  const hist = new Map();
  if (opts.preHist) hist.set('workouts', opts.preHist);
  if ('preOwner' in opts) hist.set('owner', opts.preOwner);
  if (opts.preHist || 'preOwner' in opts) dbs.set('moyzal', { version: 2, stores: new Map([['photos', new Map()], ['history', hist]]) });
  const failPut = { on: !!opts.failPut };
  function req(fill) {
    const r = { result: undefined, error: null, onsuccess: null, onerror: null, onupgradeneeded: null, onblocked: null };
    later(() => { try { fill(r); if (r.error) { if (r.onerror) r.onerror({ target: r }); return; } if (r.onsuccess) r.onsuccess({ target: r }); } catch (e) { r.error = e; if (r.onerror) r.onerror({ target: r }); } });
    return r;
  }
  function conn(db) {
    return {
      objectStoreNames: { contains: n => db.stores.has(n) },
      createObjectStore(n) { if (!db.stores.has(n)) db.stores.set(n, new Map()); },
      transaction() {
        const staged = [];
        const t = { oncomplete: null, onerror: null, error: null, objectStore(n) { const map = db.stores.get(n); return {
          get(k) { return { result: map.get(k) }; },
          put(v, k) { staged.push(() => map.set(k, v)); return { result: undefined }; },
          delete(k) { staged.push(() => map.delete(k)); return {}; },
          getAllKeys() { return { result: [...map.keys()] }; } }; } };
        later(() => {
          if (failPut.on && staged.length) { t.error = new Error('QuotaExceededError'); if (t.onerror) t.onerror(); return; }
          staged.forEach(f => f()); if (t.oncomplete) t.oncomplete();
        });
        return t;
      }
    };
  }
  return {
    dbs, failPut,
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
  return { run: c => vm.runInContext(c, ctx), J: c => JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', ctx)), store: data, idb };
}
const hist = b => { const db = b.idb.dbs.get('moyzal'); return db && db.stores.get('history'); };
const ids = list => JSON.parse(JSON.stringify((list || []).map(w => w.id).sort()));
function seed(extra) {
  return Object.assign({ lang: 'ru', goal: 'mass', days: 3, next: 0, schema: 4, obDone: 1, prof: { goal: 'mass', sex: 'm', level: 'mid', days: 3, len: 60, place: 'g', prio: [], lim: [] },
    program: [{ name: 'A', items: [{ exId: 'bp', sets: 3, min: 8, max: 12, rest: 120 }] }], workouts: [], custom: [], body: [] }, extra || {});
}
const W = (id, end, w) => ({ id, start: end - 3600e3, end, dayName: 'A', items: [{ exId: 'bp', sets: [{ w: w || 60, r: 10, done: true }] }] });

test('1. a saved workout stays after an update / restart (also when it reached only localStorage or only IndexedDB)', async () => {
  const b = boot(seed({ ownerUid: 'U1', workouts: [W('w1', 1000), W('w3', 3000)] }), { preHist: [W('w1', 1000), W('w2', 2000)], preOwner: 'U1' });
  const r = await b.run('histReady');
  assert.equal(r.source, 'idb');
  assert.deepEqual(ids(b.J('S.workouts')), ['w1', 'w2', 'w3']);
  assert.deepEqual(ids(JSON.parse(b.store.get('gym')).workouts), ['w1', 'w2', 'w3']);
  assert.deepEqual(ids(hist(b).get('workouts')), ['w1', 'w2', 'w3']);
  assert.equal(hist(b).get('owner'), 'U1');
});

test('2. a workout the user deleted is not brought back from IndexedDB (tombstone), also after a second restart', async () => {
  const b = boot(seed({ ownerUid: 'U1', workouts: [W('w1', 1000)], deletedWorkouts: ['w2'] }), { preHist: [W('w1', 1000), W('w2', 2000)], preOwner: 'U1' });
  await b.run('histReady');
  assert.deepEqual(ids(b.J('S.workouts')), ['w1']);
  assert.deepEqual(ids(hist(b).get('workouts')), ['w1']);
  // delete in the UI path: list filtered + tombstone + save
  b.run('S.workouts=S.workouts.filter(x=>x.id!=="w1");S.deletedWorkouts=(S.deletedWorkouts||[]).concat("w1");save()');
  await new Promise(r => setTimeout(r, 0)); for (let i = 0; i < 10; i++) await new Promise(r => setImmediate(r));
  const b2 = boot(JSON.parse(b.store.get('gym')), { preHist: hist(b).get('workouts'), preOwner: hist(b).get('owner') });
  await b2.run('histReady');
  assert.deepEqual(ids(b2.J('S.workouts')), []);
});

test('3. a record from IndexedDB is not duplicated in localStorage (union by id, newer copy wins)', async () => {
  const b = boot(seed({ ownerUid: 'U1', workouts: [W('w1', 1000, 60), W('w1', 1000, 60)] }), { preHist: [W('w1', 1000, 60), W('w1', 5000, 65)], preOwner: 'U1' });
  await b.run('histReady');
  const list = b.J('S.workouts');
  assert.equal(list.length, 1);
  assert.equal(list[0].items[0].sets[0].w, 65, 'newer copy (end 5000) wins');
  assert.equal(JSON.parse(b.store.get('gym')).workouts.length, 1);
});

test('4. a failing IndexedDB write (quota / private mode) loses nothing: localStorage keeps the history', async () => {
  const b = boot(seed({ ownerUid: 'U1', workouts: [W('w1', 1000), W('w2', 2000)] }), { failPut: true });
  const r = await b.run('histReady');
  assert.equal(r.ok, false);
  assert.deepEqual(ids(b.J('S.workouts')), ['w1', 'w2']);
  assert.deepEqual(ids(JSON.parse(b.store.get('gym')).workouts), ['w1', 'w2']);
  b.run('S.workouts.push(' + JSON.stringify(W('w3', 3000)) + ');save()');
  for (let i = 0; i < 10; i++) await new Promise(r => setImmediate(r));
  assert.deepEqual(ids(JSON.parse(b.store.get('gym')).workouts), ['w1', 'w2', 'w3'], 'new workout saved to localStorage although IDB fails');
  // IDB works again → next start merges, nothing lost
  const b2 = boot(JSON.parse(b.store.get('gym')), { preHist: [W('w1', 1000)], preOwner: 'U1' });
  await b2.run('histReady');
  assert.deepEqual(ids(b2.J('S.workouts')), ['w1', 'w2', 'w3']);
});

test('5. deletion is honoured by sync: tombstones are part of the cloud copy and the merge (source check of sync.js)', () => {
  const s = read('sync.js');
  assert.match(s, /const w=mergeLists\(S\.workouts,R\.workouts,S\.deletedWorkouts,R\.deletedWorkouts,'id',/);
  assert.match(s, /S\.workouts=w\.list;S\.deletedWorkouts=w\.deleted;/);
  assert.doesNotMatch(s.slice(s.indexOf('function payloadOf'), s.indexOf('function stripLimits')), /delete p\.deletedWorkouts/);
});

test('6. «clear data on this device» removes only this device’s copies (localStorage keys + IndexedDB), nothing else', async () => {
  const b = boot(seed({ ownerUid: 'U1', workouts: [W('w1', 1000)] }), { preHist: [W('w1', 1000)], preOwner: 'U1' });
  await b.run('histReady');
  b.run('localStorage.setItem("other_site_key","keep")');
  await b.run('clearLocalData()');
  assert.equal(b.store.has('gym'), false);
  assert.equal(b.store.get('other_site_key'), 'keep', 'unrelated keys untouched');
  assert.equal(b.idb.dbs.has('moyzal'), false);
  const src = read('app.js');
  assert.match(src, /\['gym','gym_hist_backup','gym_hist_idb','gymPersist','gym_guest_copy','gym_broken'\]\.forEach\(k=>localStorage\.removeItem\(k\)\)/);
});

test('7a. GC-165 defect: IndexedDB history of ANOTHER account is not mixed into this account (device copy wins, IDB rewritten)', async () => {
  const b = boot(seed({ ownerUid: 'U2', workouts: [W('b1', 5000)] }), { preHist: [W('a1', 1000), W('a2', 2000)], preOwner: 'U1' });
  const r = await b.run('histReady');
  assert.equal(r.source, 'isolated');   // GC-166: the other account's history is isolated (kept), not destroyed
  assert.deepEqual(ids(hist(b).get('quarantine')[0].workouts), ['a1', 'a2']);
  assert.deepEqual(ids(b.J('S.workouts')), ['b1']);
  assert.deepEqual(ids(JSON.parse(b.store.get('gym')).workouts), ['b1']);
  assert.deepEqual(ids(hist(b).get('workouts')), ['b1']);
  assert.equal(hist(b).get('owner'), 'U2');
});

test('7b. a guest who did not transfer (IDB owner = guest) is not mixed into the signed-in account', async () => {
  const b = boot(seed({ ownerUid: 'U2', workouts: [W('b1', 5000)] }), { preHist: [W('g1', 1000)], preOwner: null });
  await b.run('histReady');
  assert.deepEqual(ids(b.J('S.workouts')), ['b1']);
});

test('7c. history written before v165 (no owner mark): IDB-only records are isolated (GC-166), not merged; guest↔guest still merges', async () => {
  const old = boot(seed({ ownerUid: 'U1', workouts: [W('w2', 2000)] }), { preHist: [W('w1', 1000)] });
  await old.run('histReady');
  assert.deepEqual(ids(old.J('S.workouts')), ['w2']);
  assert.deepEqual(ids(hist(old).get('quarantine')[0].workouts), ['w1']);
  assert.equal(hist(old).get('owner'), 'U1', 'owner mark written from now on');
  const guest = boot(seed({ workouts: [W('w2', 2000)] }), { preHist: [W('w1', 1000)], preOwner: null });
  await guest.run('histReady');
  assert.deepEqual(ids(guest.J('S.workouts')), ['w1', 'w2']);
});

test('7d. localStorage lost, IndexedDB of account U1 survives → history restored WITH its owner (another account later = foreign data)', async () => {
  const b = boot(undefined, { preHist: [W('w1', 1000), W('w2', 2000)], preOwner: 'U1' });
  await b.run('histReady');
  assert.deepEqual(ids(b.J('S.workouts')), ['w1', 'w2']);
  assert.equal(b.run('S.ownerUid'), 'U1');
});

test('7e. switching accounts: adoptAccountFromCloud writes the new history + owner to IndexedDB (awaited) BEFORE localStorage', () => {
  const s = read('sync.js');
  const fn = s.slice(s.indexOf('async function adoptAccountFromCloud'), s.indexOf('function clearBodyPhotos'));
  const iPut = fn.indexOf('await histWrite(Array.isArray(S.workouts)?S.workouts:[],S.ownerUid)'), iLS = fn.indexOf('persistLocal();');   // GC-166: guarded write
  assert.ok(iPut > 0 && iLS > iPut, 'IDB first, then localStorage');
  assert.ok(fn.indexOf('S.ownerUid=user.id;') < iPut);
  assert.match(read('app.js'), /histPut:\(list,owner,quarantine\)=>tx\('history','readwrite',s=>\{if\(quarantine!==undefined\)s\.put\(quarantine,'quarantine'\);if\(owner!==undefined\)s\.put\(owner,'owner'\);return s\.put\(list,'workouts'\)\}\)/);
});
