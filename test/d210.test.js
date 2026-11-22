'use strict';
// D-210: tests for sync merge (workouts, deletions), 14-day demo boundary, local/account deletion.
// Consent revoke, pain/limits without consent, most Premium rights and ?demo= are already in
// test/d217-privacy.test.js, test/premium.test.js and test/prelaunch.test.js — not repeated here.
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
        select() { return { eq() { return { maybeSingle() { return Promise.resolve({ data: cloud.remote || null, error: null }); } }; } }; },
        delete() { return { eq(col, val) { cloud.deletes.push({ table: name, col, val }); return Promise.resolve({ error: cloud.deleteError || null }); } }; }
      });
      return {
        from: table,
        rpc(name, args) { cloud.rpcs.push({ name, args }); return Promise.resolve({ error: cloud.rpcError || null }); },
        auth: {
          onAuthStateChange() {},
          getSession() { return Promise.resolve({ data: { session: cloud.user ? { user: cloud.user } : null } }); },
          signOut() { cloud.signedOut = (cloud.signedOut || 0) + 1; return Promise.resolve({ error: null }); },
          updateUser() { return Promise.resolve({}); }
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
  const idb = fakeIDB();
  const nodes = new Map();
  const el = elFactory(nodes);
  const g = {
    console, setTimeout() { return 0; }, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
    scrollTo() {}, crypto: require('crypto').webcrypto, addEventListener() {}, prompt() { return null; },
    confirm() { return opts.confirm !== false; }, alert(m) { g.__alerts.push(String(m)); },
    URL, Blob, navigator: { language: 'ru', languages: ['ru'] },
    localStorage: ls,
    location: { href: 'http://127.0.0.1/', origin: 'http://127.0.0.1', pathname: '/', search: '', reload() { g.__reloaded = true; } },
    document: {
      documentElement: { lang: 'ru' }, title: '', body: { append() {}, style: {} },
      querySelector(sel) { const m = /^#([\w-]+)/.exec(sel || ''); return el(m ? m[1] : ''); },
      querySelectorAll() { return []; }, addEventListener() {}, createElement() { return el(); }
    },
    indexedDB: idb.indexedDB,
    caches: { keys() { return Promise.resolve(g.__cacheKeys || []); }, delete(k) { g.__cachesDeleted.push(k); return Promise.resolve(true); } },
    __alerts: [], __reloaded: false, __cachesDeleted: []
  };
  g.window = g; g.globalThis = g; g.self = g;
  const ctx = vm.createContext(g);
  const files = ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'place.js', 'prog.js', 'plan.js', 'movekit.js', 'premium.js', 'features.js', 'csv.js'];
  if (opts.cloud) {
    g.MZ_SB = { url: 'https://example.invalid', anon: 'test-anon' }; g.supabase = fakeSupabase(opts.cloud);
    files.push('sync.js');
  }
  for (const f of files) {
    let src = read(f);
    if (f === 'sync.js') src = src.replace('  init();\n})();', '  window.__mzApplyRemoteFresh=applyRemoteFresh;window.__mzApplyMerged=applyMerged;window.__mzPull=pullAndMerge;window.__mzSync=sync;window.__mzDeleteCloud=mzDeleteCloud;\n  init();\n})();');
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

test('applyMerged: newer workout wins, local and remote workouts are kept, deletions stick', async () => {
  const cloud = { inserts: [], upserts: [], deletes: [], rpcs: [], user: USER };
  const local = seed({
    updatedAt: 5000,
    workouts: [W('w-old', 100, 50), W('w-local', 200, 70), W('w-gone', 150, 40)],
    deletedWorkouts: ['w-del']
  });
  const b = boot(local, { cloud });
  for (let i = 0; i < 6; i++) await tick();
  const out = JSON.parse(b.run(`(function(){
    S.updatedAt = 5000;
    __mzApplyMerged({
      lang: 'en', updatedAt: 9000,
      workouts: [
        { id: 'w-old', start: 1, end: 300, dayName: 'A', items: [{ exId: 'bp', sets: [{ w: 80, r: 8, done: true }] }] },
        { id: 'w-remote', start: 250, end: 350, dayName: 'B', items: [{ exId: 'sq', sets: [{ w: 100, r: 5, done: true }] }] },
        { id: 'w-del', start: 10, end: 20, dayName: 'A', items: [{ exId: 'bp', sets: [{ w: 1, r: 1, done: true }] }] }
      ],
      deletedWorkouts: ['w-gone'],
      custom: [], body: [], prof: S.prof, program: S.program, consentHealth: null
    }, 9000);
    return JSON.stringify({
      ids: S.workouts.map(x => x.id).sort(),
      oldW: S.workouts.find(x => x.id === 'w-old').items[0].sets[0].w,
      localW: S.workouts.find(x => x.id === 'w-local').items[0].sets[0].w,
      remoteW: S.workouts.find(x => x.id === 'w-remote').items[0].sets[0].w,
      deleted: (S.deletedWorkouts || []).slice().sort(),
      lang: S.lang
    });
  })()`));
  assert.deepEqual(out.ids, ['w-local', 'w-old', 'w-remote']);
  assert.equal(out.oldW, 80); // remote end 300 > local end 100
  assert.equal(out.localW, 70);
  assert.equal(out.remoteW, 100);
  assert.deepEqual(out.deleted, ['w-del', 'w-gone']);
  assert.equal(out.lang, 'en'); // remote updatedAt is newer
});

test('applyMerged: local updatedAt wins settings; program follows progAt; workouts still merge', async () => {
  const cloud = { inserts: [], upserts: [], deletes: [], rpcs: [], user: USER };
  const b = boot(seed({
    updatedAt: 8000, progAt: 2000, lang: 'ru', next: 1, sound: true,
    program: [{ name: 'Local', items: [{ exId: 'bp', sets: 3, min: 8, max: 12, rest: 120 }] }],
    workouts: [W('w-l', 100, 60)]
  }), { cloud });
  for (let i = 0; i < 6; i++) await tick();
  const out = JSON.parse(b.run(`(function(){
    __mzApplyMerged({
      updatedAt: 3000, progAt: 5000, lang: 'lv', next: 2, sound: false,
      program: [{ name: 'Remote', items: [{ exId: 'sq', sets: 3, min: 8, max: 12, rest: 120 }] }],
      workouts: [{ id: 'w-r', start: 100, end: 200, dayName: 'A', items: [{ exId: 'sq', sets: [{ w: 90, r: 5, done: true }] }] }],
      custom: [], body: [], prof: S.prof, consentHealth: null
    }, 3000);
    return JSON.stringify({
      lang: S.lang, next: S.next, sound: S.sound, pname: S.program[0].name, ids: S.workouts.map(x => x.id).sort()
    });
  })()`));
  assert.equal(out.lang, 'ru');
  assert.equal(out.next, 1);
  assert.equal(out.sound, true);
  assert.equal(out.pname, 'Remote'); // remote progAt is newer
  assert.deepEqual(out.ids, ['w-l', 'w-r']);
});

test('sync pull: workouts from both sides survive; a deleted id does not come back', async () => {
  const remote = seed({
    updatedAt: Date.now() + 1e6,
    lang: 'en',
    workouts: [W('w-cloud', 400, 90), W('w-shared', 250, 75), W('w-removed', 50, 10)],
    deletedWorkouts: []
  });
  const cloud = {
    inserts: [], upserts: [], deletes: [], rpcs: [], user: USER,
    remote: { payload: remote, updated_at: new Date(Date.now() + 1e6).toISOString() }
  };
  const b = boot(seed({
    updatedAt: 1000,
    workouts: [W('w-phone', 300, 65), W('w-shared', 200, 55), W('w-removed', 40, 10)],
    deletedWorkouts: ['w-removed']
  }), { cloud });
  for (let i = 0; i < 8; i++) await tick();
  const ids = JSON.parse(b.run('JSON.stringify(S.workouts.map(x=>x.id).sort())'));
  assert.deepEqual(ids, ['w-cloud', 'w-phone', 'w-shared']);
  assert.equal(b.run("S.workouts.find(x=>x.id==='w-shared').items[0].sets[0].w"), 75);
  assert.ok(b.run("S.deletedWorkouts.includes('w-removed')"));
  const pushed = cloud.upserts.filter(u => u.table === 'user_state').pop();
  assert.ok(pushed);
  const pids = pushed.row.payload.workouts.map(x => x.id).sort();
  assert.deepEqual(pids, ['w-cloud', 'w-phone', 'w-shared']);
});

test('demo ends at exactly 14 days; a millisecond earlier is still trial; warmup/cooldown stay free', () => {
  const now = Date.now();
  const start = now - 14 * DAY;
  const b = boot(seed({ demoStart: start, workouts: [W('w1', start, 60)] }));
  b.run('PREM_CFG.PAYWALL_ENABLED=true; PREM_CFG.PAYWALL_LAUNCH=1; S.premium=false; S.ownerPremium=false');
  assert.equal(b.run(`premState(${now}).tier`), 'free'); // end === now → free
  assert.equal(b.run(`premState(${now - 1}).tier`), 'trial');
  assert.equal(b.run(`premState(${now - 1}).left`), 1);
  assert.equal(b.run('can("video")'), false);
  assert.equal(b.run('can("warmup")'), true);
  assert.equal(b.run('can("cooldown")'), true);
  // paywall off still opens everything, including video
  b.run('PREM_CFG.PAYWALL_ENABLED=false');
  assert.equal(b.run('premTier()'), 'open');
  assert.equal(b.run('can("video")'), true);
});

test('local wipe clears gym and the IndexedDB database, then reloads', async () => {
  const b = boot(seed({ workouts: [W('w1', 100, 60)] }));
  // seed a photo in the existing store, like a real install
  await new Promise((res, rej) => {
    const r = b.g.indexedDB.open('moyzal', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('photos');
    r.onsuccess = () => {
      const t = r.result.transaction('photos', 'readwrite');
      t.objectStore('photos').put('data:image/jpeg,aaa', 'p1');
      t.oncomplete = res; t.onerror = () => rej(t.error);
    };
    r.onerror = () => rej(r.error);
  });
  assert.equal(b.idb.has('moyzal'), true);
  assert.ok(b.store.has('gym'));
  await b.run('wipeAll()');
  for (let i = 0; i < 6; i++) await tick();
  assert.equal(b.store.has('gym'), false);
  assert.equal(b.idb.has('moyzal'), false);
  assert.equal(b.g.__reloaded, true);
});

test('account deletion calls delete_my_account, then clears local data and auth tokens', async () => {
  const cloud = { inserts: [], upserts: [], deletes: [], rpcs: [], user: USER };
  const b = boot(seed({ workouts: [W('w1', 100, 60)] }), { cloud });
  b.g.localStorage.setItem('sb-krrhwuldkwkkcegxhyqq-auth-token', '{"access_token":"x"}');
  for (let i = 0; i < 6; i++) await tick();
  assert.ok(b.store.has('gym'));
  await b.run('wipeAll()');
  for (let i = 0; i < 8; i++) await tick();
  assert.ok(cloud.rpcs.some(r => r.name === 'delete_my_account'));
  assert.equal(cloud.rpcs.filter(r => r.name === 'delete_my_account').length, 1);
  assert.equal(cloud.deletes.length, 0); // rpc succeeded — no fallback delete
  assert.ok(cloud.signedOut >= 1);
  assert.equal(b.store.has('gym'), false);
  assert.equal(b.store.has('sb-krrhwuldkwkkcegxhyqq-auth-token'), false);
  assert.equal(b.idb.has('moyzal'), false);
  assert.equal(b.g.__reloaded, true);
});

test('if delete_my_account fails, local data stays and the alert does not claim the data was deleted', async () => {
  const cloud = { inserts: [], upserts: [], deletes: [], rpcs: [], user: USER, rpcError: { message: 'not found' } };
  const b = boot(seed({ workouts: [W('w1', 100, 60)] }), { cloud });
  for (let i = 0; i < 6; i++) await tick();
  const before = b.store.get('gym');
  await b.run('wipeAll()');
  for (let i = 0; i < 8; i++) await tick();
  assert.ok(cloud.rpcs.filter(r => r.name === 'delete_my_account').length >= 1);
  assert.ok(cloud.rpcs.some(r => r.name === 'account_is_deleted'));
  assert.equal(cloud.deletes.length, 0); // no user_state-only fallback
  assert.equal(b.store.get('gym'), before);
  assert.equal(b.g.__reloaded, false);
  const alerts = b.g.__alerts.join('\n');
  assert.match(alerts, /Сервер не подтвердил удаление аккаунта/);
  assert.match(alerts, /Удалить аккаунт/);
  assert.doesNotMatch(alerts, /Данные удалены/);
});

test('if the cloud delete fails, local data and IndexedDB stay and the page does not reload', async () => {
  const cloud = {
    inserts: [], upserts: [], deletes: [], rpcs: [], user: USER,
    rpcError: { message: 'down' }, deleteError: { message: 'down' }
  };
  const b = boot(seed({ workouts: [W('w1', 100, 60)] }), { cloud });
  for (let i = 0; i < 6; i++) await tick();
  const before = b.store.get('gym');
  await b.run('wipeAll()');
  for (let i = 0; i < 8; i++) await tick();
  assert.equal(b.store.get('gym'), before);
  assert.equal(JSON.parse(before).workouts[0].id, 'w1');
  assert.equal(b.g.__reloaded, false);
  assert.ok(b.g.__alerts.some(a => /Сервер не подтвердил удаление аккаунта/.test(a)));
  assert.ok(!b.g.__alerts.some(a => /Данные удалены/.test(a)));
});
