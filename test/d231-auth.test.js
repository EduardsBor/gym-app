'use strict';
// D-231: sign-in is required at start; session kept for offline; local data kept and synced; Google button behind a flag.
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
          signInWithPassword() { cloud.user = USER; return Promise.resolve({ data: { user: USER, session: { user: USER } }, error: null }); },
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

test('D-231: first start without a session shows the sign-in screen first (Google hidden by flag)', async () => {
  const r = bootA(undefined);
  await go(r);
  assert.equal(r.run('view'), 'auth');
  assert.match(r.html(), /id="mzgate"/);
  assert.match(r.html(), /id="mzemail"/);
  assert.match(r.html(), /id="mzin"/);
  assert.doesNotMatch(r.html(), /mzgoogle/);
  assert.equal(r.run('mzNeedAuth()'), true);
  assert.equal(r.run('MZ_SB.googleAuth'), undefined);
  assert.match(read('supabase-config.js'), /googleAuth:false/);
});

test('D-231: «Войти через Google» uses signInWithOAuth(google) with redirect to the site when the flag is on', async () => {
  const r = bootA(undefined, { sb: { googleAuth: true } });
  await go(r);
  assert.match(r.html(), /id="mzgoogle"[^>]*>Войти через Google</);
  r.run('document.querySelector("#mzgoogle").onclick()');
  for (let i = 0; i < 4; i++) await tick();
  assert.equal(r.cloud.oauth.length, 1);
  assert.equal(r.cloud.oauth[0].provider, 'google');
  assert.equal(r.cloud.oauth[0].options.redirectTo, 'http://127.0.0.1/');
});

test('D-231: a stored session (Supabase token or gc_auth) opens the app without signing in again, offline too', async () => {
  for (const ls of [{ 'sb-krrhwuldkwkkcegxhyqq-auth-token': '{"x":1}' }, { gc_auth: USER.id }]) {
    const r = bootA(undefined, { ls, offline: true });
    await go(r);
    assert.notEqual(r.run('view'), 'auth');
    assert.equal(r.run('mzNeedAuth()'), false);
  }
  const r = bootA(seed(), { ls: { gc_auth: USER.id } });
  await go(r);
  assert.equal(r.run('view'), 'today');
});

test('D-231: an existing user without an account keeps the data; sign-in syncs it and opens the app', async () => {
  const local = seed({ workouts: [W('w1', 5000), W('w2', 6000)] });
  const r = bootA(local);
  await go(r);
  assert.equal(r.run('view'), 'auth');
  assert.equal(r.run('S.workouts.length'), 2);
  r.run('document.querySelector("#mzemail").value="someone@example.com";document.querySelector("#mzpass").value="secret1"');
  r.run('document.querySelector("#mzin").onclick()');
  for (let i = 0; i < 30; i++) await tick();
  assert.equal(r.run('S.workouts.length'), 2);
  assert.equal(r.store.get('gc_auth'), USER.id);
  assert.ok(r.cloud.upserts.length > 0, 'local data pushed to the cloud');
  assert.equal(r.run('view'), 'today');
  assert.equal(r.run('mzNeedAuth()'), false);
});

test('D-231: offline without a session — existing data can continue; logout clears the flag', async () => {
  const r = bootA(seed(), { offline: true });
  await go(r);
  assert.match(r.html(), /id="mzoffline"/);
  r.run('document.querySelector("#mzoffline").onclick()');
  assert.equal(r.run('view'), 'today');
  const r2 = bootA(undefined, { offline: true });
  await go(r2);
  assert.doesNotMatch(r2.html(), /mzoffline/);
  assert.match(read('sync.js'), /removeItem\(AUTH_FLAG\)/);
});

test('D-231: without the cloud config the app does not lock (no gate)', async () => {
  const r = boot(undefined);
  r.run('view="today";render()');
  assert.notEqual(r.run('view'), 'auth');
});

test('Body screen: height without a weight measurement asks for a weight, no height keeps the old text', async () => {
  const r = boot(seed({ height: 180, body: [], consentHealth: { v: 1, at: '2026-11-19' } }));
  r.run('body()');
  assert.match(r.run('document.querySelector("#app").innerHTML'), /Добавь замер с весом — посчитаем ИМТ\./);
  const r2 = boot(seed({ body: [], consentHealth: { v: 1, at: '2026-11-19' } }));
  r2.run('delete S.height;body()');
  assert.match(r2.run('document.querySelector("#app").innerHTML'), /Укажи рост — посчитаем ИМТ\./);
  assert.match(read('i18n/dict3.js'), /\['Добавь замер с весом — посчитаем ИМТ\.','[^']+','[^']+'\]/);
});

test('Body «Мои данные»: height and weight in one card; weight updates today\'s measurement only; BMI with a colour label', async () => {
  const CH = { v: 1, at: '2026-11-19' };
  const today = new Date().toISOString().slice(0, 10);
  const r = boot(seed({ height: 180, consentHealth: CH, body: [{ id: 'b1', date: today, photos: [], waist: 80, weight: '' }, { id: 'b0', date: '2026-01-01', photos: [], weight: 90 }] }));
  r.run('chart=()=>{};body()');
  let h = r.run('document.querySelector("#app").innerHTML');
  assert.match(h, /id="mydata"[\s\S]*id="hgt"[\s\S]*id="wgt"/);
  assert.ok(h.indexOf('id="mydata"') < h.indexOf('id="badd"'));
  assert.match(h, /\+ Новый замер \(обхваты, фото\)/);
  r.run('bodySetWeight("72.5");body()');
  assert.equal(r.run('S.body.length'), 2);
  const e = r.run(`S.body.find(x=>x.id==="b1")`);
  assert.equal(e.weight, 72.5); assert.equal(e.waist, 80);
  h = r.run('document.querySelector("#app").innerHTML');
  assert.match(h, /ИМТ: <b>22\.4<\/b> <span class="badge" id="bmit" data-bmi="ok"/);
  r.run('bodySetWeight("110");body()');
  assert.match(r.run('document.querySelector("#app").innerHTML'), /id="bmit" data-bmi="danger"/);
  assert.equal(r.run('bodySetWeight("abc")'), null);
  // no measurement today → a new one with only the weight
  const r2 = boot(seed({ height: 170, consentHealth: CH, body: [{ id: 'b0', date: '2026-01-01', photos: [], weight: 90, hips: 100 }] }));
  r2.run('bodySetWeight("80")');
  assert.equal(r2.run('S.body.length'), 2);
  const n = r2.run('S.body[1]');
  assert.equal(n.date, today); assert.equal(n.weight, 80); assert.equal(n.hips, undefined);
  assert.equal(r2.run('S.body[0].weight'), 90);
  assert.match(read('i18n/dict3.js'), /\['Мои данные','My data','Mani dati'\]/);
});
