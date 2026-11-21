'use strict';
// D-270: auth-required PR 2 — transfer, conflict merge, logout, demo date, second user on the same device.
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
          updateUser() { return Promise.resolve({}); },
          signInWithPassword() { const U=cloud.loginUser||USER; cloud.user=U; return Promise.resolve({ data: { user: U, session: { user: U } }, error: null }); },
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
    scrollTo() {}, crypto: require('crypto').webcrypto, addEventListener() {}, prompt() { return null; },
    confirm() { return opts.confirm !== false; }, alert(m) { g.__alerts.push(String(m)); },
    URL, Blob, navigator: { language: 'ru', languages: ['ru'], onLine: !opts.offline },
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
const USER_B = { id: 'bbbbbbbb-2222-3333-4444-555555555555', email: 'other@example.com' };

test('D-270: no path into tabs after account deletion', async () => {
  const r = bootA(seed({ workouts: [W('w1', 5000)] }), { ls: { gc_auth: USER.id }, cloud: { user: USER, inserts: [], upserts: [], deletes: [], rpcs: [], oauth: [] } });
  await go(r);
  assert.equal(r.run('view'), 'today');
  await r.run('wipeAll()');
  for (let i = 0; i < 15; i++) await tick();
  assert.equal(r.g.__reloaded, true);
  assert.equal(r.run('view'), 'auth');
  assert.match(r.html(), /id="mzgate"/);
  r.run('view="today";render()');
  assert.equal(r.run('view'), 'auth');
});

test('D-270: declining guest transfer keeps a copy of gym + moyzal history on the device', async () => {
  const local = seed({ workouts: [W('w-guest', 5000)], progName: 'Guest', ownerUid: null });
  const remote = seed({ workouts: [W('w-acc', 8000)], progName: 'Account', goal: 'cut' });
  let asked = 0;
  const r = bootA(local, { cloud: { remote: { payload: remote, updated_at: '2026-06-01T00:00:00.000Z' }, inserts: [], upserts: [], deletes: [], rpcs: [], oauth: [] } });
  r.g.confirm = m => { asked++; return true; };
  await go(r);
  r.run('document.querySelector("#mzemail").value="someone@example.com";document.querySelector("#mzpass").value="secret1"');
  r.run('document.querySelector("#mzin").onclick()');
  for (let i = 0; i < 30; i++) await tick();
  assert.match(r.html(), /id="mztransfer"/);
  assert.match(r.html(), /id="mzkeep"[^>]*>Не переносить/);
  assert.equal(asked, 0, 'must not use confirm()');
  await r.run('document.querySelector("#mzkeep").onclick()');
  for (let i = 0; i < 30; i++) await tick();
  assert.equal(r.run('view'), 'today');
  const ids = r.run('S.workouts.map(x=>x.id).join(",")');
  assert.equal(ids, 'w-acc');
  assert.doesNotMatch(ids, /w-guest/);
  assert.equal(r.run('S.progName'), 'Account');
  assert.equal(r.run('S.ownerUid'), USER.id);
  const copy = JSON.parse(r.run('localStorage.getItem("gym_guest_copy")'));
  assert.ok(copy && copy.workouts.some(x => x.id === 'w-guest'), 'gym_guest_copy keeps guest workouts');
  assert.equal(copy.progName, 'Guest');
  const hist = r.idb.get('moyzal_guest') && r.idb.get('moyzal_guest').stores.get('history');
  const fromIdb = hist && hist.get('workouts');
  assert.ok(fromIdb && fromIdb.some(x => x.id === 'w-guest'), 'moyzal_guest history copy is on the device');
});

test('D-270: guest signing into an empty account is transferred with no question', async () => {
  const local = seed({ workouts: [W('w1', 5000), W('w2', 6000)], progName: 'Guest' });
  let asked = 0;
  const r = bootA(local, { cloud: { remote: null, inserts: [], upserts: [], deletes: [], rpcs: [], oauth: [] } });
  r.g.confirm = m => { asked++; return false; };
  await go(r);
  r.run('document.querySelector("#mzemail").value="someone@example.com";document.querySelector("#mzpass").value="secret1"');
  r.run('document.querySelector("#mzin").onclick()');
  for (let i = 0; i < 30; i++) await tick();
  assert.doesNotMatch(r.html(), /mztransfer|mzkeep|mzmerge/);
  assert.equal(asked, 0, 'empty account: no transfer question');
  assert.equal(r.run('view'), 'today');
  assert.equal(r.run('S.workouts.map(x=>x.id).join(",")'), 'w1,w2');
  assert.equal(r.run('S.progName'), 'Guest');
  assert.ok(r.cloud.upserts.length > 0, 'guest data pushed to the empty account');
  assert.equal(r.run('S.ownerUid'), USER.id);
});

test('D-270: second user on the same device does not see the first user\'s data and is not offered a transfer', async () => {
  const local = seed({ workouts: [W('w-A', 5000)], progName: 'UserA', ownerUid: USER.id });
  const remoteB = seed({ workouts: [W('w-B', 9000)], progName: 'UserB' });
  let asked = 0;
  const r = bootA(local, { cloud: { loginUser: USER_B, user: null, remote: { payload: remoteB, updated_at: '2026-07-01T00:00:00.000Z' }, inserts: [], upserts: [], deletes: [], rpcs: [], oauth: [] } });
  r.g.confirm = m => { asked++; return true; };
  await go(r);
  assert.equal(r.run('view'), 'auth');
  r.run('document.querySelector("#mzemail").value="other@example.com";document.querySelector("#mzpass").value="secret1"');
  r.run('document.querySelector("#mzin").onclick()');
  for (let i = 0; i < 30; i++) await tick();
  assert.equal(r.run('view'), 'today');
  assert.equal(r.run('S.workouts.map(x=>x.id).join(",")'), 'w-B');
  assert.doesNotMatch(r.run('S.workouts.map(x=>x.id).join(",")'), /w-A/);
  assert.equal(r.run('S.progName'), 'UserB');
  assert.equal(r.run('S.ownerUid'), USER_B.id);
  assert.equal(asked, 0, 'must not ask to transfer another account\'s data');
});

test('D-270: history merge keeps every workout, never duplicates the same id; program/settings use newer', () => {
  const r = bootA(seed());
  const local = [W('w1', 1000, 50), W('same', 2000, 60)];
  const remote = [W('w2', 1500, 70), W('same', 3000, 80)];
  const out = r.run(`JSON.stringify(mzMergeLists(${JSON.stringify(local)},${JSON.stringify(remote)},[],[],'id',x=>x.end||x.start||0))`);
  const m = JSON.parse(out);
  const ids = m.list.map(x => x.id).sort();
  assert.deepEqual(ids, ['same', 'w1', 'w2']);
  assert.equal(m.list.filter(x => x.id === 'same').length, 1);
  assert.equal(m.list.find(x => x.id === 'same').items[0].sets[0].w, 80);
  // applyMerged: history union + newer program
  r.run(`
    S.workouts=${JSON.stringify([W('w1',1000,50)])};
    S.program=[{name:'Old'}]; S.progName='Old'; S.progAt=10; S.updatedAt=10;
    const R=${JSON.stringify({ workouts: [W('w2', 2000, 70)], program: [{ name: 'New' }], progName: 'New', progAt: 20, updatedAt: 20 })};
    __mzApplyMerged(R, 20);
  `);
  assert.deepEqual(JSON.parse(r.run('JSON.stringify(S.workouts.map(x=>x.id).sort())')), ['w1','w2']);
  assert.equal(r.run('S.progName'), 'New');
});

test('D-270: demo start on transfer keeps the earlier date (re-login does not extend the trial)', () => {
  const r = bootA(seed());
  r.run('mzKeepEarliestDemo(2e12, 1e12)');
  assert.equal(r.run('S.demoStart'), 1e12);
  r.run('S.demoStart=5e12; mzKeepEarliestDemo(S.demoStart, 4e12)');
  assert.equal(r.run('S.demoStart'), 4e12);
  // later cloud date must not move it forward
  r.run('S.demoStart=4e12; mzKeepEarliestDemo(S.demoStart, 9e12)');
  assert.equal(r.run('S.demoStart'), 4e12);
});

test('D-270: logout when synced clears the local copy and returns to sign-in; data would come back from the cloud', async () => {
  const r = bootA(seed({ workouts: [W('w1', 5000)] }), { ls: { gc_auth: USER.id }, cloud: { user: USER, inserts: [], upserts: [], deletes: [], rpcs: [], oauth: [] } });
  await go(r);
  assert.equal(r.run('view'), 'today');
  assert.ok(r.run('S.workouts.length') > 0);
  await r.run('mzDoLogout()');
  for (let i = 0; i < 10; i++) await tick();
  assert.equal(r.run('view'), 'auth');
  assert.match(r.html(), /id="mzgate"/);
  assert.equal(r.run('S.workouts.length'), 0);
  assert.equal(r.store.get('gym') == null || r.run('(()=>{try{const g=JSON.parse(localStorage.getItem("gym")||"null");return !g||!(g.workouts&&g.workouts.length)}catch(e){return true}})()'), true);
  r.run('view="today";render()');
  assert.equal(r.run('view'), 'auth');
});

test('D-270: logout with unsynced workouts warns; wait-for-sync then clears; sign-out anyway keeps local data', async () => {
  const r = bootA(seed({ workouts: [W('w1', 5000)] }), { ls: { gc_auth: USER.id }, cloud: { user: USER, inserts: [], upserts: [], deletes: [], rpcs: [], oauth: [] } });
  await go(r);
  r.run('S.workouts.push({id:"w-new",start:9000,end:10000,dayName:"A",items:[]}); S.updatedAt=Date.now()+1e12');
  r.g.navigator.onLine = false;
  assert.equal(r.run('mzHasUnsyncedWorkouts()'), true);
  await r.run('mzDoLogout()');
  for (let i = 0; i < 10; i++) await tick();
  assert.match(r.html(), /id="mzunsynced"/);
  assert.match(r.html(), /Есть тренировки, которые ещё не сохранены в облаке/);
  assert.match(r.html(), /Если на этом устройстве войдёт другой аккаунт, несохранённые тренировки и фото тела удалятся\./);
  assert.match(r.html(), /id="mzwaitsync"/);
  assert.match(r.html(), /id="mzoutanyway"/);
  // anyway: stay signed out but keep local workouts
  await r.run('document.querySelector("#mzoutanyway").onclick()');
  for (let i = 0; i < 15; i++) await tick();
  assert.equal(r.run('view'), 'auth');
  assert.ok(r.run('S.workouts.some(x=>x.id==="w-new")'));
  assert.equal(r.run('mzNeedAuth()'), true);

  const r2 = bootA(seed({ workouts: [W('w1', 5000)] }), { ls: { gc_auth: USER.id }, cloud: { user: USER, inserts: [], upserts: [], deletes: [], rpcs: [], oauth: [] } });
  await go(r2);
  r2.run('S.workouts.push({id:"w-new",start:9000,end:10000,dayName:"A",items:[]}); S.updatedAt=Date.now()+1e12');
  r2.g.navigator.onLine = false;
  await r2.run('mzDoLogout()');
  for (let i = 0; i < 10; i++) await tick();
  assert.match(r2.html(), /id="mzunsynced"/);
  r2.g.navigator.onLine = true;
  await r2.run('document.querySelector("#mzwaitsync").onclick()');
  for (let i = 0; i < 25; i++) await tick();
  assert.equal(r2.run('view'), 'auth');
  assert.equal(r2.run('S.workouts.length'), 0);
});
