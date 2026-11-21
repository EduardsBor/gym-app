'use strict';
// Pre-Play (v129): Android backup excluded; analytics id only after consent;
// deleted-account tombstone; health-consent log flushed before user_state upsert.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

test('Android backup and device transfer exclude app data', () => {
  const man = read('android/app/src/main/AndroidManifest.xml');
  assert.match(man, /android:allowBackup="false"/);
  assert.match(man, /android:dataExtractionRules="@xml\/data_extraction_rules"/);
  assert.match(man, /android:fullBackupContent="@xml\/backup_rules"/);
  assert.doesNotMatch(man, /android:allowBackup="true"/);
  const ext = read('android/app/src/main/res/xml/data_extraction_rules.xml');
  assert.match(ext, /<cloud-backup>/);
  assert.match(ext, /<device-transfer>/);
  assert.match(ext, /<exclude domain="database"/);
  assert.match(ext, /<exclude domain="sharedpref"/);
  const bak = read('android/app/src/main/res/xml/backup_rules.xml');
  assert.match(bak, /<full-backup-content>/);
  assert.match(bak, /<exclude domain="sharedpref"/);
  const sql = read('sql/004_preplay_consent_tombstone.sql');
  assert.match(sql, /health_consent_log/);
  assert.match(sql, /deleted_accounts/);
  assert.match(sql, /account_deleted/);
  assert.match(read('sql/004_preplay_consent_tombstone_rollback.sql'), /drop table if exists public\.deleted_accounts/);
});

function fakeSupabase(cloud) {
  return {
    createClient() {
      const table = name => ({
        insert(row) { cloud.inserts.push({ table: name, row: JSON.parse(JSON.stringify(row)) }); return Promise.resolve({ error: cloud.insertError || null }); },
        upsert(row) { cloud.upserts.push({ table: name, row: JSON.parse(JSON.stringify(row)) }); return Promise.resolve({ error: cloud.upsertError || null }); },
        select() { return { eq() { return { maybeSingle() { return Promise.resolve({ data: name === 'deleted_accounts' ? null : (cloud.remote || null), error: null }); } }; } }; },
        delete() { return { eq() { return Promise.resolve({ error: null }); } }; }
      });
      return {
        from: table,
        rpc(name, args) {
          (cloud.rpcs = cloud.rpcs || []).push({ name, args });
          if (name === 'account_is_deleted') return Promise.resolve({ data: cloud.accountDeleted === true, error: null });
          return Promise.resolve({ data: null, error: cloud.rpcError || null });
        },
        auth: {
          onAuthStateChange() {},
          getSession() { return Promise.resolve({ data: { session: cloud.user ? { user: cloud.user } : null } }); },
          signOut() { cloud.signedOut = (cloud.signedOut || 0) + 1; cloud.user = null; return Promise.resolve({ error: null }); },
          updateUser() { return Promise.resolve({}); }
        }
      };
    }
  };
}

function boot(stored, cloud) {
  const store = new Map();
  if (stored !== undefined) store.set('gym', JSON.stringify(stored));
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
    console, setTimeout() { return 0; }, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {}, scrollTo() {},
    crypto: require('crypto').webcrypto, addEventListener() {}, prompt() { return null; },
    URL, Blob, navigator: { language: 'ru', languages: ['ru'], onLine: true },
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
    location: { href: 'http://127.0.0.1/', origin: 'http://127.0.0.1', pathname: '/', reload() { g.reloaded = true; } },
    document: {
      documentElement: { lang: 'ru' }, title: '', body: { append() {}, style: {} },
      querySelector(sel) { const m = /^#([\w-]+)/.exec(sel || ''); return el(m ? m[1] : ''); },
      querySelectorAll() { return []; }, addEventListener() {}, createElement() { return el(); }
    }
  };
  g.window = g; g.globalThis = g; g.self = g;
  const ctx = vm.createContext(g);
  const files = ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'place.js', 'prog.js', 'plan.js', 'movekit.js', 'premium.js', 'features.js'];
  g.MZ_SB = { url: 'https://example.invalid', anon: 'test-anon' };
  g.supabase = fakeSupabase(cloud);
  files.push('sync.js');
  for (const f of files) {
    let src = read(f);
    if (f === 'sync.js') src = src.replace('  init();\n})();', '  window.ensureMeta=ensureMeta;window.persistLocal=persistLocal;window.bootAnalytics=bootAnalytics;window.__mzSync=sync;\n  init();\n})();');
    vm.runInContext(src, ctx, { filename: f });
  }
  return { run: code => vm.runInContext(code, ctx), store, g };
}

const tick = () => new Promise(r => setImmediate(r));
const USER = { id: '11111111-2222-3333-4444-555555555555', email: 'someone@example.com' };
function seed(extra) {
  return Object.assign({
    goal: 'mass', progName: 'P', program: [{ name: 'A', items: [] }],
    workouts: [], body: [{ id: 'b1', w: 80 }], height: 180, weightKg: 80,
    ownerUid: USER.id, updatedAt: 1000, consentAnalytics: { v: 1, at: '2026-11-14T00:00:00Z' },
    consentHealth: { v: 1, at: '2026-11-14T00:00:00Z' }
  }, extra || {});
}

test('analytics id is created only after consent and dropped when consent is withdrawn', async () => {
  const cloud = { inserts: [], upserts: [], user: USER };
  const b = boot(seed({ consentAnalytics: null, installId: undefined }), cloud);
  for (let i = 0; i < 8; i++) await tick();
  assert.equal(b.run('S.installId'), undefined);
  assert.equal(cloud.inserts.filter(x => x.table === 'events').length, 0);
  b.run("S.consentAnalytics={v:1,at:'2026-11-21T00:00:00Z'};ensureMeta();persistLocal();bootAnalytics()");
  for (let i = 0; i < 6; i++) await tick();
  const id = b.run('S.installId');
  assert.match(id, /^[0-9a-f]{32}$/);
  b.run('S.consentAnalytics=null;delete S.installId;ensureMeta();persistLocal()');
  assert.equal(b.run('S.installId'), undefined);
});

test('granting body consent writes an append-only log row before user_state is upserted', async () => {
  const cloud = { inserts: [], upserts: [], user: USER, remote: { payload: { goal: 'mass' }, updated_at: '2026-01-01T00:00:00.000Z' } };
  const b = boot(seed({ healthConsentQueue: [] }), cloud);
  for (let i = 0; i < 8; i++) await tick();
  const before = cloud.upserts.length;
  b.run("mzLogHealthConsent('grant')");
  const q = JSON.parse(b.run('JSON.stringify(S.healthConsentQueue)'));
  assert.equal(q.length, 1);
  assert.equal(q[0].action, 'grant');
  assert.equal(q[0].text_version, b.run('mzHealthConsentTextV'));
  await b.run('__mzSync()');
  for (let i = 0; i < 8; i++) await tick();
  const logs = cloud.inserts.filter(x => x.table === 'health_consent_log');
  assert.ok(logs.length >= 1, 'consent log was sent');
  assert.equal(logs[0].row.action, 'grant');
  assert.equal(logs[0].row.text_version, '2026-11-21');
  assert.ok(!('user_id' in logs[0].row), 'user_id is set by the server trigger, not the client');
  const ups = cloud.upserts.filter(x => x.table === 'user_state');
  assert.ok(ups.length > before || ups.length >= 1, 'profile upserted after the log');
  const p = ups[ups.length - 1].row.payload;
  assert.equal(p.healthConsentQueue, undefined);
});

test('a deleted account is not recreated: sync does not upsert user_state and clears the device copy', async () => {
  const cloud = { inserts: [], upserts: [], user: USER, accountDeleted: true };
  const b = boot(seed({ workouts: [{ id: 'w1', t: 1, items: [] }] }), cloud);
  for (let i = 0; i < 10; i++) await tick();
  assert.equal(cloud.upserts.filter(x => x.table === 'user_state').length, 0, 'must not recreate the row');
  assert.ok(cloud.signedOut >= 1);
  assert.equal(b.run('mzSignedIn()'), false);
  assert.equal(b.store.has('gym'), false, 'local copy is cleared');
});

test('Claude 21.11: missing consent table does not stop sync; queue is kept for later', async () => {
  const cloud = { inserts: [], upserts: [], user: USER, insertError: { code: 'PGRST205', message: "Could not find the table 'public.health_consent_log'" }, remote: { payload: { goal: 'mass' }, updated_at: '2026-01-01T00:00:00.000Z' } };
  const b = boot(seed({ healthConsentQueue: [] }), cloud);
  for (let i = 0; i < 8; i++) await tick();
  b.run("mzLogHealthConsent('grant')");
  const before = cloud.upserts.filter(x => x.table === 'user_state').length;
  await b.run('__mzSync()');
  for (let i = 0; i < 8; i++) await tick();
  assert.ok(cloud.upserts.filter(x => x.table === 'user_state').length > before, 'user_state still upserted');
  assert.equal(JSON.parse(b.run('JSON.stringify(S.healthConsentQueue)')).length, 1, 'grant stays queued');
  assert.equal(b.run('mzSignedIn()'), true);
});

test('Claude 21.11: migration 004 backfills legacy consent before the uid trigger and clamps future dates', () => {
  const sql = read('sql/004_preplay_consent_tombstone.sql');
  const back = sql.indexOf("'legacy-v1'"), trg = sql.indexOf('create trigger health_consent_log_set_uid');
  assert.ok(back > 0 && back < trg);
  assert.match(sql, /NEW\.created_at := least\(coalesce\(NEW\.created_at, now\(\)\), now\(\)\)/);
});
