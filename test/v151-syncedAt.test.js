'use strict';
// v151 / QA-02b: syncedAt — when a record first reached the cloud. «Заменить» keeps a record
// that arrived after the backup even if the workout itself is older. Node only, fake cloud.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const USER = { id: '11111111-2222-3333-4444-555555555555' };

function wo(id, end, extra) {
  return Object.assign({ id, start: end - 3600e3, end, dayName: 'A', items: [] }, extra || {});
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
  return ls;
}

function fakeSupabase(cloud) {
  return {
    createClient() {
      return {
        from(name) {
          return {
            insert(row) {
              cloud.inserts.push({ table: name, row });
              return Promise.resolve({ error: null });
            },
            upsert(row) {
              cloud.upserts.push({ table: name, row: JSON.parse(JSON.stringify(row)) });
              if (name !== 'user_state') return Promise.resolve({ error: null });
              if (cloud.upsertThrow) return Promise.reject(cloud.upsertThrow);
              if (cloud.upsertError) return Promise.resolve({ error: cloud.upsertError });
              cloud.state = { payload: JSON.parse(JSON.stringify(row.payload)), updated_at: row.updated_at };
              return Promise.resolve({ error: null });
            },
            select() {
              return {
                eq() {
                  return {
                    maybeSingle() {
                      cloud.selects++;
                      if (!cloud.state) return Promise.resolve({ data: null, error: null });
                      return Promise.resolve({ data: JSON.parse(JSON.stringify(cloud.state)), error: null });
                    }
                  };
                }
              };
            },
            delete() { return { eq() { return Promise.resolve({ error: null }); } }; }
          };
        },
        rpc(name) {
          cloud.rpcs.push(name);
          if (name === 'account_is_deleted') return Promise.resolve({ data: false, error: null });
          return Promise.resolve({ data: null, error: null });
        },
        auth: {
          onAuthStateChange() {},
          getSession() { return Promise.resolve({ data: { session: cloud.user ? { user: cloud.user } : null } }); },
          signOut() { return Promise.resolve({ error: null }); }
        }
      };
    }
  };
}

function seed(extra) {
  return Object.assign({
    lang: 'ru', goal: 'mass', days: 3, next: 0, obDone: 1, updatedAt: 1000, schema: 4, v: 2,
    ownerUid: USER.id, consentHealth: false, consentAnalytics: false,
    prof: { goal: 'mass', sex: 'm', level: 'mid', days: 3, len: 60, place: 'g', prio: [], lim: [] },
    program: [{ name: 'A', items: [] }],
    workouts: [], custom: [], templates: [], eqProfiles: [], body: [],
    deletedWorkouts: [], deletedCustom: [], deletedTemplates: [], deletedEqProfiles: [], deletedBody: []
  }, extra || {});
}

function boot(stored, opts) {
  opts = opts || {};
  const cloud = opts.cloud || {
    inserts: [], upserts: [], selects: 0, rpcs: [], user: USER, state: null, upsertError: null, upsertThrow: null
  };
  if (cloud.selects == null) cloud.selects = 0;
  const state = JSON.parse(JSON.stringify(stored));
  const ls = mockStorage({ gym: JSON.stringify(state) });
  const toasts = [];
  const g = {
    console, URL, TextEncoder, Date, JSON, Math, Promise,
    setTimeout(fn, ms) { const id = setTimeout(fn, ms); if (id.unref) id.unref(); return id; },
    clearTimeout, setInterval() { return 0; }, clearInterval() {},
    crypto: require('crypto').webcrypto,
    addEventListener() {},
    navigator: { language: 'ru', languages: ['ru'], onLine: opts.offline ? false : true },
    localStorage: ls,
    location: { href: 'http://127.0.0.1/', origin: 'http://127.0.0.1', pathname: '/', search: '', hash: '' },
    history: { replaceState() {} },
    document: {
      documentElement: { lang: 'ru' }, hidden: false, visibilityState: 'visible',
      addEventListener() {}, createElement() { return { className: '', textContent: '', style: {} }; },
      body: { append() {} }
    },
    toast(t) { toasts.push(String(t)); },
    $(id) {
      return {
        id: id || '', textContent: '', className: '', innerHTML: '', style: {}, hidden: false,
        classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
        addEventListener() {}, append() {}, insertAdjacentHTML() {}
      };
    },
    view: 'today',
    S: state,
    __toasts: toasts
  };
  g.window = g;
  g.globalThis = g;
  g.self = g;
  g.MZ_SB = { url: 'https://example.invalid', anon: 'test-anon' };
  g.supabase = fakeSupabase(cloud);
  const ctx = vm.createContext(g);
  let src = read('sync.js');
  const hook = '  window.__mzPush=pushNow;window.__mzPull=pullAndMerge;\n  init();\n})();';
  if (!src.includes('  init();\n})();')) throw new Error('sync.js init hook not found');
  src = src.replace('  init();\n})();', hook);
  vm.runInContext(src, ctx, { filename: 'sync.js' });
  return {
    cloud,
    toasts,
    run(code) { return vm.runInContext(code, ctx); }
  };
}

async function until(fn, label) {
  for (let i = 0; i < 80; i++) {
    if (fn()) return;
    await new Promise(r => setImmediate(r));
  }
  throw new Error('timed out waiting for ' + (label || 'condition'));
}

function byId(list) {
  const m = {};
  (list || []).forEach(x => { if (x && x.id != null) m[x.id] = x; });
  return m;
}

test('QA-02b: after a successful upsert a new record gets syncedAt at send time, an unmarked cloud record gets 1, a marked one keeps the cloud stamp', async () => {
  const cloudStamp = 1710000000000;
  const old = wo('old', 1_000_000);
  const marked = wo('marked', 2_000_000);
  const fresh = wo('fresh', 3_000_000);
  const cloud = {
    inserts: [], upserts: [], selects: 0, rpcs: [], user: USER, upsertError: null, upsertThrow: null,
    state: {
      payload: { workouts: [wo('old', 1_000_000), wo('marked', 2_000_000, { syncedAt: cloudStamp })], deletedWorkouts: [] },
      updated_at: new Date(500).toISOString()
    }
  };
  const b = boot(seed({ workouts: [old, marked, fresh], updatedAt: Date.now() }), { cloud });
  await until(() => cloud.upserts.length >= 1, 'first upsert');
  const local = byId(JSON.parse(b.run('JSON.stringify(S.workouts)')));
  const sent = cloud.upserts[cloud.upserts.length - 1].row;
  const sentAt = Date.parse(sent.updated_at);
  const uploaded = byId(sent.row ? sent.row.payload.workouts : sent.payload.workouts);
  assert.equal(local.fresh.syncedAt, sentAt);
  assert.ok(Math.abs(sentAt - Date.now()) < 10000);
  assert.equal(uploaded.fresh.syncedAt, sentAt);
  assert.equal(local.old.syncedAt, 1);
  assert.equal(uploaded.old.syncedAt, 1);
  assert.equal(local.marked.syncedAt, cloudStamp);
  assert.equal(uploaded.marked.syncedAt, cloudStamp);
});

test('QA-02b: an upsert error and a thrown upsert remove stamps placed in that attempt', async () => {
  const cloud = {
    inserts: [], upserts: [], selects: 0, rpcs: [], user: USER, upsertError: null, upsertThrow: null,
    state: {
      payload: { workouts: [wo('old', 1_000_000)], deletedWorkouts: [] },
      updated_at: new Date(500).toISOString()
    }
  };
  const b = boot(seed({ workouts: [wo('old', 1_000_000)], updatedAt: Date.now() }), { cloud });
  await until(() => cloud.upserts.length >= 1, 'first upsert');
  assert.equal(b.run("S.workouts.find(w=>w.id==='old').syncedAt"), 1);

  b.run(`S.workouts.push(${JSON.stringify(wo('fresh', 4_000_000))})`);
  cloud.upsertError = { message: 'upsert failed' };
  await assert.rejects(() => b.run('__mzPush()'));
  assert.equal(b.run("S.workouts.find(w=>w.id==='fresh').syncedAt"), undefined);
  assert.equal(b.run("S.workouts.find(w=>w.id==='old').syncedAt"), 1);
  assert.deepEqual(cloud.state.payload.workouts.map(w => w.id), ['old']);

  b.run(`S.workouts.push(${JSON.stringify(wo('fresh2', 5_000_000))})`);
  cloud.upsertError = null;
  cloud.upsertThrow = new Error('upsert threw');
  await assert.rejects(() => b.run('__mzPush()'), /upsert threw/);
  assert.equal(b.run("S.workouts.find(w=>w.id==='fresh').syncedAt"), undefined);
  assert.equal(b.run("S.workouts.find(w=>w.id==='fresh2').syncedAt"), undefined);
  assert.equal(b.run("S.workouts.find(w=>w.id==='old').syncedAt"), 1);
  assert.deepEqual(cloud.state.payload.workouts.map(w => w.id), ['old']);
});

test('QA-02b: a shortened copy does not leave syncedAt on records that missed the cloud', async () => {
  const blob = 'x'.repeat(500000);
  const workouts = [wo('w0', 1000, { blob }), wo('w1', 2000, { blob }), wo('w2', 3000, { blob })];
  const cloud = {
    inserts: [], upserts: [], selects: 0, rpcs: [], user: USER, state: null, upsertError: null, upsertThrow: null
  };
  const b = boot(seed({ workouts, updatedAt: Date.now() }), { cloud });
  await until(() => cloud.upserts.length >= 1, 'trimmed upsert');
  const sent = cloud.upserts[cloud.upserts.length - 1].row;
  const payload = sent.payload;
  const uploadedIds = payload.workouts.map(w => w.id);
  assert.ok(uploadedIds.length >= 1 && uploadedIds.length < 3);
  assert.deepEqual(uploadedIds, ['w0', 'w1', 'w2'].slice(3 - uploadedIds.length));
  const local = byId(JSON.parse(b.run('JSON.stringify(S.workouts.map(w=>({id:w.id,syncedAt:w.syncedAt})))')));
  const sentAt = Date.parse(sent.updated_at);
  for (const id of ['w0', 'w1', 'w2']) {
    if (uploadedIds.includes(id)) {
      assert.equal(local[id].syncedAt, sentAt, id);
      assert.equal(byId(payload.workouts)[id].syncedAt, sentAt, id);
    } else {
      assert.equal(local[id].syncedAt, undefined, id);
    }
  }
  assert.equal(b.run('S.workouts.length'), 3);
});

test('QA-02b: replace keeps a cloud record with an old end but syncedAt after exportedAt, and deletes an older record missing from the file', async () => {
  const exportedAt = 1700000000000;
  const fileWo = wo('a', exportedAt - 5 * 864e5, { syncedAt: 50 });
  const drop = wo('c', exportedAt - 5 * 864e5, { syncedAt: exportedAt - 60000 });
  const keep = wo('wOff', exportedAt - 20 * 3600e3, { syncedAt: exportedAt + 60000 });
  const cloud = {
    inserts: [], upserts: [], selects: 0, rpcs: [], user: USER, upsertError: null, upsertThrow: null,
    state: {
      payload: { workouts: [fileWo, drop, keep], deletedWorkouts: [] },
      updated_at: new Date(exportedAt + 120000).toISOString()
    }
  };
  const b = boot(seed({
    workouts: [wo('a', exportedAt - 5 * 864e5)],
    exportedAt,
    replacePending: exportedAt + 1000,
    deletedWorkouts: [],
    updatedAt: exportedAt + 1000
  }), { cloud });
  await until(() => cloud.upserts.length >= 1, 'replace upsert');
  const ids = JSON.parse(b.run('JSON.stringify(S.workouts.map(w=>w.id).sort())'));
  assert.deepEqual(ids, ['a', 'wOff']);
  assert.equal(b.run("S.workouts.find(w=>w.id==='wOff').syncedAt"), exportedAt + 60000);
  assert.ok(b.run("S.workouts.find(w=>w.id==='wOff').syncedAt > S.exportedAt"));
  assert.ok(b.run("S.deletedWorkouts.includes('c')"));
  assert.equal(b.run("S.deletedWorkouts.includes('wOff')"), false);
  assert.equal(b.run("S.deletedWorkouts.includes('a')"), false);
  const pushed = cloud.state.payload.workouts.map(w => w.id).sort();
  assert.deepEqual(pushed, ['a', 'wOff']);
  assert.equal(byId(cloud.state.payload.workouts).wOff.syncedAt > exportedAt, true);
  assert.ok(cloud.state.payload.deletedWorkouts.includes('c'));
  assert.ok(b.toasts.some(t => t.includes('Оставлены записи с другого устройства')));
});

test('QA-02b: without a cloud read in this run, push does not stamp syncedAt', async () => {
  const fresh = wo('fresh', 3_000_000);
  const cloud = {
    inserts: [], upserts: [], selects: 0, rpcs: [], user: USER, state: null, upsertError: null, upsertThrow: null
  };
  const b = boot(seed({ workouts: [fresh], updatedAt: Date.now() }), { cloud, offline: true });
  await until(() => b.run("localStorage.getItem('gc_auth')") != null, 'signed-in flag');
  await new Promise(r => setImmediate(r));
  assert.equal(cloud.selects, 0);
  assert.equal(cloud.upserts.length, 0);
  assert.equal(b.run("S.workouts.find(w=>w.id==='fresh').syncedAt"), undefined);
  b.run('navigator.onLine=true');
  await b.run('__mzPush()');
  assert.equal(cloud.selects, 0);
  assert.equal(cloud.upserts.length, 1);
  assert.equal(b.run("S.workouts.find(w=>w.id==='fresh').syncedAt"), undefined);
  const uploaded = cloud.upserts[0].row.payload.workouts.find(w => w.id === 'fresh');
  assert.equal(uploaded.syncedAt, undefined);
});
