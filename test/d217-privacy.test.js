'use strict';
// D-217: anonymous analytics (install_id only) and limitations synced only with health consent.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

// Fake Supabase client: records inserts/upserts, never touches the network.
function fakeSupabase(cloud) {
  return {
    createClient() {
      const table = name => ({
        insert(row) { cloud.inserts.push({ table: name, row: JSON.parse(JSON.stringify(row)) }); return Promise.resolve({ error: null }); },
        upsert(row) { cloud.upserts.push({ table: name, row: JSON.parse(JSON.stringify(row)) }); return Promise.resolve({ error: null }); },
        select() { return { eq() { return { maybeSingle() { return Promise.resolve({ data: cloud.remote || null, error: null }); } }; } }; },
        delete() { return { eq() { return Promise.resolve({ error: null }); } }; }
      });
      return {
        from: table,
        rpc() { return Promise.resolve({ error: null }); },
        auth: {
          onAuthStateChange() {},
          getSession() { return Promise.resolve({ data: { session: cloud.user ? { user: cloud.user } : null } }); },
          updateUser() { return Promise.resolve({}); }
        }
      };
    }
  };
}

function boot(stored, withFeatures, cloud) {
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
    console, setTimeout() { return 0; }, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {}, scrollTo() {}, crypto: require('crypto').webcrypto, addEventListener() {}, prompt() { return null; },
    URL, Blob, navigator: { language: 'ru', languages: ['ru'] },
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
    location: { href: 'http://127.0.0.1/', origin: 'http://127.0.0.1', pathname: '/' },
    document: {
      documentElement: { lang: 'ru' }, title: '', body: { append() {}, style: {} },
      querySelector(sel) { const m = /^#([\w-]+)/.exec(sel || ''); return el(m ? m[1] : ''); },
      querySelectorAll() { return []; }, addEventListener() {}, createElement() { return el(); }
    }
  };
  g.window = g; g.globalThis = g; g.self = g;
  const ctx = vm.createContext(g);
  const files = ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'place.js', 'prog.js', 'plan.js', 'movekit.js'];
  if (withFeatures) files.push('premium.js', 'features.js');
  if (cloud) {
    g.MZ_SB = { url: 'https://example.invalid', anon: 'test-anon' }; g.supabase = fakeSupabase(cloud);
    files.push('sync.js');
  }
  for (const f of files) {
    let src = read(f);
    if (f === 'sync.js') src = src.replace('  init();\n})();', '  window.__mzApplyRemoteFresh=applyRemoteFresh;window.__mzSync=sync;\n  init();\n})();');
    vm.runInContext(src, ctx, { filename: f });
  }
  return { run: code => vm.runInContext(code, ctx), store };
}

const tick = () => new Promise(r => setImmediate(r));
const USER = { id: '11111111-2222-3333-4444-555555555555', email: 'someone@example.com' };
function seed(extra) {
  return Object.assign({
    lang: 'ru', goal: 'mass', days: 3, next: 0, obDone: 1,
    prof: { goal: 'mass', sex: 'm', level: 'mid', days: 3, len: 60, place: 'g', prio: [], lim: ['s', 'k'] },
    why: [['Ограничения (спина, колени): рискованные упражнения заменены на более щадящие. При боли — проконсультируйся с врачом.', []], ['Объём в неделю (подходов): грудь 10.', []]],
    program: [{ name: 'A', items: [{ exId: 'bp', sets: 3, min: 8, max: 12, rest: 120 }] }],
    workouts: [{ id: 'w1', start: 1, end: 2, items: [{ exId: 'bp', pain: true, sets: [{ w: 60, r: 10, done: true }] }] }],
    pg: { bp: { st: { success: 0, miss: 0 }, next: { weight: 52.5, note: 'pain' } } },
    custom: [], body: [], weightKg: 80, age: 40,
    consentAnalytics: { v: 1, at: '2026-11-14T00:00:00Z' }
  }, extra || {});
}

test('analytics event: install_id only, no user_id even when signed in', async () => {
  const cloud = { inserts: [], upserts: [], user: USER };
  const b = boot(seed(), true, cloud);
  await tick(); await tick();
  b.run("mzTrack('paywall_shown',{reason:'x',user_id:'u',email:'e'})");
  await tick();
  const ev = cloud.inserts.filter(x => x.table === 'events');
  assert.ok(ev.length >= 2, 'install/app_open/paywall events were sent');
  const id = b.run('S.installId');
  assert.match(id, /^[0-9a-f]{32}$/);
  for (const e of ev) {
    assert.equal(e.row.install_id, id);
    assert.ok(!('user_id' in e.row), 'no user_id column');
    assert.deepEqual(Object.keys(e.row).sort(), ['install_id', 'name', 'props']);
    const json = JSON.stringify(e.row);
    assert.ok(!json.includes(USER.id) && !json.includes(USER.email));
  }
  assert.deepEqual(ev.find(e => e.row.name === 'paywall_shown').row.props, { reason: 'x' });
});

test('no analytics without consent', async () => {
  const cloud = { inserts: [], upserts: [], user: null };
  boot(seed({ consentAnalytics: null }), true, cloud);
  await tick(); await tick();
  assert.equal(cloud.inserts.length, 0);
});

async function pushed(extra) {
  const cloud = { inserts: [], upserts: [], user: USER };
  const b = boot(seed(extra), true, cloud);
  for (let i = 0; i < 6; i++) await tick();
  const up = cloud.upserts.filter(x => x.table === 'user_state');
  assert.ok(up.length >= 1, 'profile was pushed');
  return { p: up[up.length - 1].row.payload, b };
}

test('without health consent: limitations, pain marks, weight/age stay on the device', async () => {
  const { p, b } = await pushed({ consentHealth: null });
  assert.equal(p.prof.lim, undefined);
  assert.equal(p.prof.goal, 'mass');
  assert.ok(!JSON.stringify(p.why).includes('Ограничения'));
  assert.equal(p.why.length, 1);
  assert.equal(p.workouts[0].items[0].pain, undefined);
  assert.equal(p.pg.bp.next.note, 'same');
  assert.equal(p.weightKg, undefined);
  assert.equal(p.age, undefined);
  assert.equal(p.installId, undefined);
  // the device keeps them
  assert.deepEqual(JSON.parse(b.run('JSON.stringify(S.prof.lim)')), ['s', 'k']);
  assert.equal(b.run('S.workouts[0].items[0].pain'), true);
  assert.equal(b.run('S.why.length'), 2);
});

test('with health consent: limitations are synced like weight/age', async () => {
  const { p } = await pushed({ consentHealth: { v: 1, at: '2026-11-14T00:00:00Z' } });
  assert.deepEqual(p.prof.lim, ['s', 'k']);
  assert.equal(p.why.length, 2);
  assert.equal(p.workouts[0].items[0].pain, true);
  assert.equal(p.weightKg, 80);
  assert.equal(p.installId, undefined);
});

test('pulling a cloud copy without limitations does not erase them on the device', async () => {
  const remote = seed({ consentHealth: null, updatedAt: Date.now() + 1e6, progAt: Date.now() + 1e6 });
  delete remote.prof.lim; remote.why = remote.why.slice(1);
  const cloud = { inserts: [], upserts: [], user: USER, remote: { payload: remote, updated_at: new Date(Date.now() + 1e6).toISOString() } };
  const b = boot(seed({ consentHealth: null }), true, cloud);
  for (let i = 0; i < 6; i++) await tick();
  assert.deepEqual(JSON.parse(b.run('JSON.stringify(S.prof.lim)')), ['s', 'k']);
  assert.equal(b.run('S.why.length'), 2);
});

test('applyRemoteFresh without health consent keeps local it.pain marks, like lim', async () => {
  const cloud = { inserts: [], upserts: [], user: USER };
  const b = boot(seed({ consentHealth: null }), true, cloud);
  for (let i = 0; i < 6; i++) await tick();
  assert.equal(b.run('typeof __mzApplyRemoteFresh'), 'function');
  // Облачная копия без согласия — без отметок «боль» и без ограничений.
  const ok = b.run(`(function(){
    S.consentHealth = null;
    S.prof = { goal: 'mass', sex: 'm', level: 'mid', days: 3, len: 60, place: 'g', prio: [], lim: ['s', 'k'] };
    S.workouts = [
      { id: 'w1', start: 1, end: 2, items: [{ exId: 'bp', pain: true, sets: [{ w: 60, r: 10, done: true }] }, { exId: 'sq', sets: [{ w: 80, r: 8, done: true }] }] },
      { id: 'w2', start: 3, end: 4, items: [{ exId: 'rdl', pain: true, sets: [{ w: 70, r: 8, done: true }] }] }
    ];
    __mzApplyRemoteFresh({
      consentHealth: null, lang: 'ru', goal: 'mass',
      prof: { goal: 'mass', sex: 'm', level: 'mid', days: 3, len: 60, place: 'g', prio: [] },
      workouts: [
        { id: 'w1', start: 1, end: 2, items: [{ exId: 'bp', sets: [{ w: 60, r: 10, done: true }] }, { exId: 'sq', sets: [{ w: 80, r: 8, done: true }] }] },
        { id: 'w2', start: 3, end: 4, items: [{ exId: 'rdl', sets: [{ w: 70, r: 8, done: true }] }] }
      ]
    });
    return JSON.stringify({
      pain1: S.workouts[0].items[0].pain,
      sqPain: 'pain' in S.workouts[0].items[1],
      pain2: S.workouts[1].items[0].pain,
      lim: S.prof.lim,
      w: S.workouts[0].items[0].sets[0].w
    });
  })()`);
  assert.deepEqual(JSON.parse(ok), { pain1: true, sqPain: false, pain2: true, lim: ['s', 'k'], w: 60 });
});

test('withdrawing health consent: next sync sends no limitations, pain marks, weight/age; device keeps them', async () => {
  const CONSENT = { v: 1, at: '2026-11-01T00:00:00Z' };
  const old = new Date(Date.now() - 864e5).toISOString();
  // the cloud still holds the copy made with consent
  const remote = seed({ consentHealth: CONSENT, updatedAt: Date.parse(old) });
  const cloud = { inserts: [], upserts: [], user: USER, remote: { payload: remote, updated_at: old } };
  const b = boot(seed({ consentHealth: CONSENT }), true, cloud);
  for (let i = 0; i < 6; i++) await tick();
  const first = cloud.upserts.filter(u => u.table === 'user_state').pop().row.payload;
  assert.deepEqual(first.prof.lim, ['s', 'k']); // with consent they were synced
  assert.equal(first.weightKg, 80);
  // withdraw (same as the «Отозвать согласие» button, keeping the measurements)
  b.run('S.consentHealth=null; save()');
  cloud.upserts.length = 0;
  await b.run('__mzSync()');
  const ups = cloud.upserts.filter(u => u.table === 'user_state');
  assert.equal(ups.length, 1);
  const p = ups[0].row.payload; // upsert replaces the whole cloud payload
  assert.equal(p.consentHealth, null);
  assert.equal(p.prof.lim, undefined);
  assert.ok(!JSON.stringify(p.why).includes('Ограничения'));
  assert.equal(p.workouts[0].items[0].pain, undefined);
  assert.equal(p.pg.bp.next.note, 'same');
  assert.equal(p.weightKg, undefined);
  assert.equal(p.age, undefined);
  assert.equal(p.body, undefined);
  // the older cloud copy with consent did not switch consent back on; data stays on the device
  assert.equal(b.run('S.consentHealth'), null);
  assert.deepEqual(JSON.parse(b.run('JSON.stringify(S.prof.lim)')), ['s', 'k']);
  assert.equal(b.run('S.workouts[0].items[0].pain'), true);
  assert.equal(b.run('S.weightKg'), 80);
  assert.equal(b.run('S.age'), 40);
});

test('D-215 mapping: standing single-leg curl, bodyweight -> single-leg glute bridge', () => {
  const b = boot(seed());
  assert.equal(b.run("d215Id('standing-single-leg-curl','b',[])"), 'sglb');
  assert.equal(b.run("d215Id('standing-single-leg-curl','g',[])"), 'lc');
  assert.equal(b.run("d215Id('standing-single-leg-curl','d',[])"), 'rdl-db');
});

test('migration SQL drops user_id from events and adds 13-month retention; no secrets', () => {
  const up = read('sql/003_anon_analytics.sql'), down = read('sql/003_anon_analytics_rollback.sql');
  assert.match(up, /drop column if exists user_id/i);
  assert.match(up, /interval '13 months'/i);
  assert.match(down, /add column if not exists user_id/i);
  for (const s of [up, down]) assert.doesNotMatch(s, /service_role\s*=|eyJ[A-Za-z0-9_-]{10,}|password\s*=/i);
});
