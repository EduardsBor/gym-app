'use strict';
// v149: QA-01…QA-14 scenarios from the safe harness, plus the gaps the review found.
// Everything runs in Node against a fake cloud. No network, no real Supabase.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const tick = () => new Promise(r => setImmediate(r));
const USER = { id: '11111111-2222-3333-4444-555555555555', email: 'qa@example.com' };
const T0 = Date.UTC(2026, 10, 1, 8, 0, 0);

function wo(id, day, end) {
  const start = T0 + day * 864e5;
  return { id, start, end: end == null ? start + 3600e3 : end, dayName: 'A', items: [{ exId: 'bp', sets: [{ w: 60, r: 8, done: true }] }] };
}

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

function fakeIDB() {
  const dbs = new Map();
  const later = fn => queueMicrotask(fn);
  function req(fill) {
    const r = { result: undefined, error: null, onsuccess: null, onerror: null, onupgradeneeded: null, onblocked: null };
    later(() => { try { fill(r); if (r.onsuccess) r.onsuccess({ target: r }); } catch (e) { r.error = e; if (r.onerror) r.onerror({ target: r }); } });
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
      return {
        from(name) {
          return {
            insert(row) { cloud.inserts.push({ table: name, row }); return Promise.resolve({ error: null }); },
            upsert(row) {
              cloud.upserts.push({ table: name, row });
              if (cloud.deleted) return Promise.resolve({ error: { message: 'account_deleted' } });
              if (name === 'user_state') cloud.state = { payload: JSON.parse(JSON.stringify(row.payload)), updated_at: row.updated_at };
              return Promise.resolve({ error: null });
            },
            select() { return { eq() { return { maybeSingle() { return Promise.resolve({ data: cloud.state || null, error: null }); } }; } }; },
            delete() { return { eq(col, val) { cloud.deletes.push({ table: name, col, val }); return Promise.resolve({ error: null }); } }; }
          };
        },
        rpc(name) {
          cloud.rpcs.push(name);
          if (name === 'delete_my_account') {
            if (cloud.mode === 'lost') { cloud.deleted = true; cloud.state = null; return Promise.resolve({ error: { message: 'lost response' } }); }
            if (cloud.mode === 'down') return Promise.resolve({ error: { message: 'down' } });
            if (cloud.mode === 'net') return Promise.reject(Object.assign(new TypeError('Failed to fetch'), { name: 'TypeError' }));
            cloud.deleted = true; cloud.state = null; return Promise.resolve({ error: null });
          }
          if (name === 'account_is_deleted') return Promise.resolve({ data: !!cloud.deleted, error: null });
          return Promise.resolve({ error: null, data: null });
        },
        auth: {
          onAuthStateChange() {},
          getSession() { return Promise.resolve({ data: { session: cloud.user ? { user: cloud.user } : null } }); },
          signOut() { cloud.signedOut = (cloud.signedOut || 0) + 1; return Promise.resolve({ error: null }); }
        }
      };
    }
  };
}

function elFactory(nodes) {
  return function el(id) {
    if (id && nodes.has(id)) return nodes.get(id);
    const node = {
      id: id || '', innerHTML: '', textContent: '', className: '', value: '', style: {}, dataset: {}, hidden: false,
      classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
      append() {}, remove() {}, addEventListener() {}, insertAdjacentHTML() {}, setAttribute() {}, getAttribute() { return null; },
      closest() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; }
    };
    if (id) nodes.set(id, node);
    return node;
  };
}

function boot(stored, opts) {
  opts = opts || {};
  const cloud = opts.cloud || { inserts: [], upserts: [], deletes: [], rpcs: [], user: USER, state: null, deleted: false, mode: 'ok' };
  const { ls, data } = mockStorage(stored !== undefined ? { gym: JSON.stringify(stored) } : undefined);
  const idb = fakeIDB();
  const nodes = new Map();
  const el = elFactory(nodes);
  const g = {
    console, setTimeout(fn) { if (typeof fn === 'function') queueMicrotask(fn); return 1; }, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
    scrollTo() {}, crypto: require('crypto').webcrypto, addEventListener() {}, prompt() { return null; },
    confirm() { return opts.confirm !== false; }, alert(m) { g.__alerts.push(String(m)); },
    URL, Blob, Audio: function Audio() { this.setAttribute = () => {}; this.play = () => Promise.resolve(); this.pause = () => {}; this.volume = 1; this.currentTime = 0; },
    navigator: { language: 'ru', languages: ['ru'], onLine: opts.offline ? false : true, vibrate() {} },
    localStorage: ls,
    location: { href: 'http://127.0.0.1/', origin: 'http://127.0.0.1', pathname: '/', search: '', hash: '', reload() { g.__reloaded = true; } },
    document: {
      documentElement: { lang: 'ru' }, title: '', hidden: false,
      body: { append() {}, style: {} },
      querySelector(sel) { const m = /^#([\w-]+)/.exec(sel || ''); return el(m ? m[1] : ''); },
      querySelectorAll() { return []; }, addEventListener() {}, createElement() { return el(); }
    },
    indexedDB: idb.indexedDB,
    caches: { keys() { return Promise.resolve([]); }, delete() { return Promise.resolve(true); } },
    __alerts: [], __reloaded: false
  };
  g.URL.createObjectURL = () => 'blob:mock';
  g.URL.revokeObjectURL = () => {};
  g.window = g; g.globalThis = g; g.self = g;
  const ctx = vm.createContext(g);
  const files = ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'place.js', 'prog.js', 'plan.js', 'premium.js', 'features.js', 'csv.js'];
  g.MZ_SB = { url: 'https://example.invalid', anon: 'test-anon' };
  g.supabase = fakeSupabase(cloud);
  files.push('sync.js');
  for (const f of files) {
    let src = read(f);
    if (f === 'sync.js') src = src.replace('  init();\n})();', '  window.__mzApplyRemoteFresh=applyRemoteFresh;window.__mzApplyMerged=applyMerged;window.__mzPull=pullAndMerge;window.__mzSync=sync;\n  init();\n})();');
    vm.runInContext(src, ctx, { filename: f });
  }
  return { run: code => vm.runInContext(code, ctx), store: data, idb, g, cloud };
}

function seed(extra) {
  return Object.assign({
    lang: 'ru', goal: 'mass', days: 3, next: 0, obDone: 1, updatedAt: 1000, schema: 4, v: 2,
    ownerUid: USER.id, ownerPremium: true, premium: false, demoStart: 1700000000000,
    consentHealth: false, consentAnalytics: false,
    prof: { goal: 'mass', sex: 'm', level: 'mid', days: 3, len: 60, place: 'g', prio: [], lim: [] },
    program: [{ name: 'A', items: [{ exId: 'bp', sets: 3, min: 8, max: 12, rest: 90 }] }],
    workouts: [], custom: [], body: [], deletedWorkouts: []
  }, extra || {});
}

async function ready(b) { for (let i = 0; i < 8; i++) await tick(); return b; }

function importFile(b, obj) {
  return b.run(`importBackup(${JSON.stringify(JSON.stringify(obj))})`);
}

test('QA-04: import allowlist drops unknown, premium, consents and a later demoStart', async () => {
  const b = await ready(boot(seed({ workouts: [wo('keep', 0)] })));
  await importFile(b, {
    workouts: [wo('y', 3)], evilKey: 'nope', entitlements: { pro: true }, ownerUid: 'stranger',
    ownerPremium: false, premium: { active: true }, consentHealth: { at: '2026-11-01' }, consentAnalytics: true,
    demoStart: 1800000000000, age: 999, weightKg: -3, height: 5, restOverride: -5
  });
  const out = b.run(`JSON.stringify({
    ids:S.workouts.map(w=>w.id), evil:S.evilKey, ent:S.entitlements, uid:S.ownerUid, op:S.ownerPremium, p:S.premium,
    h:S.consentHealth, a:S.consentAnalytics, demo:S.demoStart, age:S.age, w:S.weightKg, ht:S.height, r:S.restOverride
  })`);
  const j = JSON.parse(out);
  assert.deepEqual(j.ids, ['y']);
  assert.equal(j.evil, undefined);
  assert.equal(j.ent, undefined);
  assert.equal(j.uid, USER.id);
  assert.equal(j.op, true);
  assert.equal(j.p, false);
  assert.equal(j.h, false);
  assert.equal(j.a, false);
  assert.equal(j.demo, 1700000000000);
  assert.ok(!(j.age > 100));
  assert.ok(!(j.w < 0));
  assert.ok(!(j.ht > 0 && j.ht < 50));
  assert.ok(!(j.r < 0));
});

test('QA-04: an earlier demoStart in the file is kept; a missing one does not clear the device', async () => {
  const b = await ready(boot(seed()));
  await importFile(b, { workouts: [wo('y', 1)], demoStart: 1600000000000 });
  assert.equal(b.run('S.demoStart'), 1600000000000);
  await importFile(b, { workouts: [wo('z', 2)] });
  assert.equal(b.run('S.demoStart'), 1600000000000);
  assert.equal(b.run('S.ownerPremium'), true);
});

test('QA-04: premium is not taken from the cloud', async () => {
  const b = await ready(boot(seed()));
  b.run('__mzApplyMerged({premium:true, ownerPremium:false, workouts:[], consentAnalytics:{v:1}}, Date.now())');
  assert.equal(b.run('S.premium'), false);
  assert.equal(b.run('S.ownerPremium'), true);
  b.run('delete S.premium; __mzApplyRemoteFresh({premium:{active:true}, workouts:[], demoStart:1900000000000})');
  assert.equal(b.run('S.premium'), undefined);
  assert.equal(b.run('S.demoStart'), 1700000000000);
  assert.equal(b.run('mzPayloadForUpload(S).payload.premium'), undefined);
});

test('QA-02: replace keeps a workout another device wrote after the backup', async () => {
  const cloud = { inserts: [], upserts: [], deletes: [], rpcs: [], user: USER, state: null, deleted: false, mode: 'ok' };
  const b = await ready(boot(seed({ workouts: [wo('a', 0), wo('b', 1), wo('c', 2)] }), { cloud }));
  const exportedAt = T0 + 4 * 864e5;
  const newer = wo('wB', 6, exportedAt + 20000);
  cloud.state = { payload: { workouts: [wo('a', 0), wo('b', 1), wo('c', 2), newer], deletedWorkouts: [] }, updated_at: new Date(exportedAt + 30000).toISOString() };
  b.run(`S.workouts=${JSON.stringify([wo('x', 5)])}; S.exportedAt=${exportedAt}; S.replacePending=${exportedAt + 1000}; S.deletedWorkouts=[];`);
  await b.run('__mzPull()');
  for (let i = 0; i < 6; i++) await tick();
  const ids = JSON.parse(b.run('JSON.stringify(S.workouts.map(w=>w.id).sort())'));
  assert.deepEqual(ids, ['wB', 'x']);
  assert.ok(b.run("S.deletedWorkouts.includes('a')&&S.deletedWorkouts.includes('b')&&S.deletedWorkouts.includes('c')"));
  assert.ok(!b.run("S.deletedWorkouts.includes('wB')"));
  const pushed = cloud.state.payload.workouts.map(w => w.id).sort();
  assert.deepEqual(pushed, ['wB', 'x']);
  // Second client still holding the old list merges and does not bring a/b/c back.
  const b2 = await ready(boot(seed({ workouts: [wo('a', 0), wo('b', 1), wo('c', 2), newer] }), { cloud }));
  b2.run(`__mzApplyMerged(${JSON.stringify(cloud.state.payload)}, ${exportedAt + 40000})`);
  const ids2 = JSON.parse(b2.run('JSON.stringify(S.workouts.map(w=>w.id).sort())'));
  assert.deepEqual(ids2, ['wB', 'x']);
});

test('QA-02: importing the same file twice does not duplicate workouts', async () => {
  const b = await ready(boot(seed({ workouts: [wo('a', 0)] })));
  const file = { workouts: [wo('x', 5)], deletedWorkouts: [] };
  await importFile(b, file);
  await importFile(b, file);
  assert.deepEqual(JSON.parse(b.run('JSON.stringify(S.workouts.map(w=>w.id))')), ['x']);
});

test('QA-11: empty file keeps the program; an active workout blocks the replace', async () => {
  const b = await ready(boot(seed({ workouts: [wo('a', 0)] })));
  const prog = b.run('S.program[0].name');
  await importFile(b, { workouts: [] });
  assert.equal(b.run('S.program[0].name'), prog);
  b.run('S.active={id:"act",start:Date.now(),items:[]}; S.tEnd=Date.now()+20000; tEnd=S.tEnd;');
  const before = b.run('JSON.stringify(S.workouts.map(w=>w.id))');
  await importFile(b, { workouts: [wo('z', 1)] });
  assert.match(b.g.__alerts.join('\n'), /идёт тренировка/);
  assert.equal(b.run('!!S.active'), true);
  assert.equal(b.run('JSON.stringify(S.workouts.map(w=>w.id))'), before);
  assert.ok(b.run('tEnd>Date.now()'));
});

test('QA-12: a full disk does not claim the data was restored', async () => {
  const b = await ready(boot(seed({ workouts: [wo('a', 0)] })));
  b.run(`localStorage.setItem=function(){throw new Error('quota')}`);
  await importFile(b, { workouts: [wo('q', 1)] });
  assert.equal(b.run('S.workouts[0].id'), 'a');
  assert.ok(!b.g.__alerts.some(a => /Данные восстановлены/.test(a)));
  assert.match(b.g.__alerts.join('\n'), /память устройства заполнена/);
});

test('QA-05: rest timer clamps to 0…600 step 5 and sound generation does not throw', async () => {
  const b = await ready(boot(seed()));
  const cases = [['""', 0], ['0', 0], ['-5', 0], ['0.5', 0], ['"abc"', 0], ['NaN', 0], ['30', 30], ['37', 35], ['600', 600], ['601', 600], ['99999', 600]];
  for (const [raw, exp] of cases) assert.equal(b.run(`clampRest(${raw})`), exp, raw);
  assert.match(read('app.js'), /id="ro"[^>]*min="0"/);
  assert.match(read('app.js'), /id="ro"[^>]*max="600"/);
  assert.match(read('app.js'), /id="ro"[^>]*step="5"/);
  b.run('S.tEnd=0; tEnd=0;');
  for (const v of ['""', '0', '-5', '0.5', 'NaN']) {
    b.run(`startTimer(${v})`);
    assert.equal(b.run('tEnd'), 0, 'start ' + v);
  }
  assert.equal(b.run('wavFor(99999)'), 'blob:mock');
  assert.equal(b.run('wavFor(NaN)'), 'blob:mock');
  assert.equal(b.run('wavFor(-5)'), 'blob:mock');
  assert.equal(b.run('wavFor(0)'), 'blob:mock');
  assert.doesNotThrow(() => b.run('armAudio(99999); armAudio(NaN); armAudio(0.5); armAudio("")'));
  b.run('startTimer(30)');
  assert.ok(b.run('tEnd>Date.now()'));
});

test('QA-01: server error does not delete local data or say the data was deleted; network is a different message', async () => {
  const down = { inserts: [], upserts: [], deletes: [], rpcs: [], user: USER, state: { payload: {} }, deleted: false, mode: 'down' };
  const b = await ready(boot(seed({ workouts: [wo('a', 0)] }), { cloud: down }));
  const before = b.store.get('gym');
  await b.run('wipeAll()');
  for (let i = 0; i < 8; i++) await tick();
  assert.equal(b.store.get('gym'), before);
  assert.equal(b.g.__reloaded, false);
  assert.equal(down.deletes.length, 0);
  assert.equal(down.rpcs.filter(n => n === 'delete_my_account').length, 2);
  const msg = b.g.__alerts.join('\n');
  assert.match(msg, /Сервер не подтвердил удаление аккаунта/);
  assert.match(msg, /ещё раз/);
  assert.doesNotMatch(msg, /Данные удалены/);
  assert.doesNotMatch(msg, /Нет сети/);

  const off = { inserts: [], upserts: [], deletes: [], rpcs: [], user: USER, state: { payload: {} }, deleted: false, mode: 'ok' };
  const b2 = await ready(boot(seed({ workouts: [wo('a', 0)] }), { cloud: off }));
  b2.g.navigator.onLine = false;
  b2.g.__alerts.length = 0;
  await b2.run('wipeAll()');
  for (let i = 0; i < 4; i++) await tick();
  assert.ok(b2.store.has('gym'));
  assert.match(b2.g.__alerts.join('\n'), /Нет сети/);
  assert.doesNotMatch(b2.g.__alerts.join('\n'), /Сервер не подтвердил/);
});

test('QA-01: a lost response that did delete the account still clears the phone', async () => {
  const cloud = { inserts: [], upserts: [], deletes: [], rpcs: [], user: USER, state: { payload: { workouts: [wo('a', 0)] } }, deleted: false, mode: 'lost' };
  const b = await ready(boot(seed({ workouts: [wo('a', 0)] }), { cloud }));
  await b.run('wipeAll()');
  for (let i = 0; i < 8; i++) await tick();
  assert.equal(cloud.deleted, true);
  assert.equal(b.store.has('gym'), false);
  assert.equal(b.g.__reloaded, true);
  assert.ok(!b.g.__alerts.some(a => /Данные удалены|не удалось/i.test(a)));
});

test('QA-03: clear-this-phone while signed in and offline wipes local copies, including after «Выйти всё равно»', async () => {
  const cloud = { inserts: [], upserts: [], deletes: [], rpcs: [], user: USER, state: null, deleted: false, mode: 'ok' };
  const b = await ready(boot(seed({ workouts: [wo('a', 0), wo('b', 1)], updatedAt: Date.now() }), { cloud, offline: true }));
  b.store.set('gym_guest_copy', '{"workouts":[1]}');
  b.store.set('gym_broken', 'x');
  await new Promise((res, rej) => {
    const r = b.g.indexedDB.open('moyzal_guest', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('photos');
    r.onsuccess = () => res(); r.onerror = () => rej(r.error);
  });
  assert.equal(b.run('mzHasUnsyncedWorkouts()'), true);
  await b.run('mzDoLogout({wipeLocal:true})');
  for (let i = 0; i < 4; i++) await tick();
  await b.run('$("#mzoutanyway").onclick()');
  for (let i = 0; i < 6; i++) await tick();
  assert.equal(b.store.has('gym'), false);
  assert.equal(b.store.has('gym_guest_copy'), false);
  assert.equal(b.store.has('gym_broken'), false);
  assert.equal(b.idb.dbs.has('moyzal_guest'), false);
  assert.equal(b.run('mzSignedIn()'), false);
  assert.equal(b.run('(S.workouts||[]).length'), 0);
});

test('QA-03: cancelling the offline clear changes nothing', async () => {
  const cloud = { inserts: [], upserts: [], deletes: [], rpcs: [], user: USER, state: null, deleted: false, mode: 'ok' };
  const b = await ready(boot(seed({ workouts: [wo('a', 0)], updatedAt: Date.now() }), { cloud, offline: true }));
  const before = b.store.get('gym');
  await b.run('mzDoLogout({wipeLocal:true})');
  try { await b.run('$("#mzclearcancel").onclick()'); } catch (e) { /* profile redraw needs the real DOM; the data decision already happened */ }
  assert.equal(b.store.get('gym'), before);
  assert.equal(b.run('mzSignedIn()'), true);
  assert.equal(b.run('S.workouts.length'), 1);
});

test('QA-08: a measurement removed on another device drops its photo here', async () => {
  const b = await ready(boot(seed({ consentHealth: { at: '2026-11-01T00:00:00Z' }, body: [{ id: 'b1', date: '2026-11-01', photos: ['ph1'] }] })));
  await new Promise((res, rej) => {
    const r = b.g.indexedDB.open('moyzal', 2);
    r.onupgradeneeded = () => { const db = r.result; if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos'); if (!db.objectStoreNames.contains('history')) db.createObjectStore('history'); };
    r.onsuccess = () => {
      const t = r.result.transaction('photos', 'readwrite');
      t.objectStore('photos').put('data:image/png;base64,xx', 'ph1');
      t.oncomplete = res; t.onerror = () => rej(t.error);
    };
    r.onerror = () => rej(r.error);
  });
  b.run(`__mzApplyMerged({consentHealth:{at:'2026-11-01T00:00:00Z'}, body:[], deletedBody:['b1'], workouts:[]}, Date.now())`);
  for (let i = 0; i < 6; i++) await tick();
  assert.equal(b.run('S.body.length'), 0);
  const keys = b.idb.dbs.get('moyzal').stores.get('photos');
  assert.equal(keys.has('ph1'), false);
});

test('QA-09 / sync hold: auto-sync does not push while a delete or clear is holding it', async () => {
  const cloud = { inserts: [], upserts: [], deletes: [], rpcs: [], user: USER, state: null, deleted: false, mode: 'ok' };
  const b = await ready(boot(seed({ workouts: [wo('a', 0)] }), { cloud }));
  const n = cloud.upserts.length;
  b.run('mzHoldSync(); S.workouts.push(' + JSON.stringify(wo('z', 3)) + '); save()');
  for (let i = 0; i < 6; i++) await tick();
  assert.equal(cloud.upserts.length, n);
  assert.equal(b.run('mzSyncHold()'), 1);
  b.run('mzReleaseSync()');
  await b.run('__mzSync()');
  for (let i = 0; i < 6; i++) await tick();
  assert.ok(cloud.upserts.length > n);
});

test('QA-06: equipment profile can be switched; no duplicate eqbar id; editor does not point at «Сегодня»', async () => {
  const b = await ready(boot(seed()));
  assert.equal(b.run('eqSetActive("home")'), 'home');
  assert.equal(b.run('eqActiveId()'), 'home');
  assert.match(b.run('eqSwitchHTML("eqswitch")'), /data-eqsw="gym"/);
  assert.match(b.run('eqSwitchHTML("eqswitch")'), /data-eqsw="body"/);
  b.run('eqEditor()');
  const html = b.run('$("#modal").innerHTML');
  assert.match(html, /data-eqsw="home"/);
  assert.match(html, /Активный профиль выбирается здесь/);
  assert.doesNotMatch(html, /Сегодня/);
  b.run('S.active={id:"w",items:[]};');
  assert.match(b.run('eqSwitchHTML("eqswitch")'), /disabled/);
  assert.equal((read('autow.js') + read('features.js')).includes('id="eqbar"'), false);
  assert.match(read('autow.js'), /id="awbar"/);
  assert.match(read('autow.js'), /eqSwitchHTML\('eqswitch'\)/);
});

test('QA-10: every profile hook is still claimed by a section', () => {
  const src = read('profile.js');
  const m = src.match(/const SECTIONS=(\[[\s\S]*?\n  \]);/);
  const S = vm.runInNewContext('(' + m[1] + ')');
  const sels = new Set(S.flatMap(s => s.sel));
  for (const id of ['#mzacc', '#awequip', '#eqdb', '#ro', '#expcsv', '#privdata', '#pfdanger', '#helpc']) {
    assert.ok(sels.has(id), id);
  }
});

test('QA-14: the rest circle uses the profile override', () => {
  assert.match(read('exscreen.js'), /S\.restOverride/);
});

test('v149: cache name, new strings have EN and LV, LV review files untouched', () => {
  assert.match(read('cache-ver.js'), /var SW_CACHE='moyzal-v149'/);
  assert.match(read('sw.js'), /const C=SW_CACHE/);
  const d3 = read('i18n/dict3.js');
  const lv = read('docs/LV-NEW-v149.md');
  for (const s of [
    '🏠 Профили оборудования (зал / дом / без инвентаря)',
    'Сервер не подтвердил удаление аккаунта',
    'Нет сети. Аккаунт не удалён',
    'Сейчас идёт тренировка',
    'Оставлены записи с другого устройства'
  ]) assert.ok(d3.includes(s), s);
  assert.match(lv, /Aprīkojuma profili/);
  assert.match(lv, /Serveris neapstiprināja konta dzēšanu/);
  assert.match(read('style.css'), /\.grow\{flex:1;min-width:0\}/);
  assert.match(read('style.css'), /#lpriv,#lterms/);
  assert.doesNotMatch(read('app.js'), /white-space:nowrap">\$\{esc\(typeof exShort/);
});
