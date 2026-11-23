'use strict';
// v162: GC-161-01 (Grok QA v160 P1) — sex is synced only with the health consent (privacy policy 3.2, 9(2)(a));
// Grok QA v160 P2 — D2 gravitron with an empty counterweight asks for it on every path, not «0 kg».
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

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
  const files = ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'place.js', 'prog.js', 'plan.js', 'movekit.js', 'premium.js', 'features.js'];
  g.MZ_SB = { url: 'https://example.invalid', anon: 'test-anon' }; g.supabase = fakeSupabase(cloud);
  files.push('sync.js');
  for (const f of files) {
    let src = read(f);
    if (f === 'sync.js') src = src.replace('  init();\n})();', '  window.__mzApplyRemoteFresh=applyRemoteFresh;window.__mzApplyMerged=applyMerged;window.__mzSync=sync;\n  init();\n})();');
    vm.runInContext(src, ctx, { filename: f });
  }
  return { run: code => vm.runInContext(code, ctx), J: code => JSON.parse(vm.runInContext('JSON.stringify(' + code + ')', ctx)), store };
}

const tick = () => new Promise(r => setImmediate(r));
const USER = { id: '11111111-2222-3333-4444-555555555555', email: 'someone@example.com' };
const CONSENT = { v: 1, at: '2026-11-14T00:00:00Z' };
const SEXWHY = ['Пол: женский — в относительных величинах мужчины и женщины прибавляют в силе и мышцах сопоставимо, поэтому принципы программы одинаковые.', ['sx']];
function seed(extra) {
  return Object.assign({
    lang: 'ru', goal: 'mass', days: 3, next: 0, obDone: 1,
    prof: { goal: 'mass', sex: 'f', level: 'mid', days: 3, len: 60, place: 'g', prio: [], lim: ['k'] },
    why: [['Объём в неделю (подходов): грудь 10.', []], ['Ограничения (колени): рискованные упражнения заменены на более щадящие. При боли — проконсультируйся с врачом.', []], SEXWHY],
    program: [{ name: 'A', items: [{ exId: 'bp', sets: 3, min: 8, max: 12, rest: 120 }] }],
    workouts: [{ id: 'w1', start: 1, end: 2, items: [{ exId: 'bp', sets: [{ w: 60, r: 10, done: true }] }] }],
    pg: { bp: { st: { success: 0, miss: 0 }, next: { weight: 62.5, note: 'inc' } } },
    custom: [], body: [], weightKg: 70, age: 30,
    consentAnalytics: { v: 1, at: '2026-11-14T00:00:00Z' }
  }, extra || {});
}
async function push(extra) {
  const cloud = { inserts: [], upserts: [], user: USER };
  const b = boot(seed(extra), cloud);
  for (let i = 0; i < 6; i++) await tick();
  const up = cloud.upserts.filter(x => x.table === 'user_state');
  assert.ok(up.length >= 1, 'profile was pushed');
  return { p: up[up.length - 1].row.payload, b, cloud };
}

test('GC-161-01: without health consent — no prof.sex and no «Пол:» line in the cloud copy; the device keeps them; history / pg / plan sync', async () => {
  for (const c of [null, false, undefined]) {
    const { p, b, cloud } = await push({ consentHealth: c });
    const json = JSON.stringify(p);
    assert.equal('sex' in p.prof, false, 'consent=' + c);
    assert.equal(p.prof.lim, undefined);
    assert.doesNotMatch(json, /"sex"|Пол: |"sx"/);
    assert.equal(p.prof.goal, 'mass', 'the rest of the questionnaire syncs');
    assert.equal(p.why.length, 1, 'only the non-health why line');
    assert.equal(p.workouts.length, 1); assert.equal(p.pg.bp.next.weight, 62.5); assert.equal(p.program[0].items[0].sets, 3);
    assert.equal(b.run('S.prof.sex'), 'f', 'device keeps sex');
    assert.equal(b.J('S.why').length, 3, 'device keeps the why lines');
    for (const e of cloud.inserts) assert.doesNotMatch(JSON.stringify(e.row), /"sex"|Пол: /, 'no sex in events / logs');
  }
});

test('GC-161-01: with health consent — sex and the «Пол:» line sync (privacy policy 3.2), limSeen never', async () => {
  const { p } = await push({ consentHealth: CONSENT, limSeen: 1 });
  assert.equal(p.prof.sex, 'f');
  assert.deepEqual(p.prof.lim, ['k']);
  assert.ok(p.why.some(w => /^Пол: /.test(w[0])));
  assert.equal('limSeen' in p, false);
});

test('GC-161-01: a cloud copy without sex (second device / withdrawn consent) does not wipe sex on this device; a cloud value with consent is taken', async () => {
  const cloud = { inserts: [], upserts: [], user: USER };
  const b = boot(seed({ consentHealth: null }), cloud);
  for (let i = 0; i < 6; i++) await tick();
  const remote = JSON.parse(JSON.stringify(seed({ consentHealth: null })));
  delete remote.prof.sex; delete remote.prof.lim; remote.why = [remote.why[0]];
  b.run('window.__mzApplyRemoteFresh(' + JSON.stringify(remote) + ')');
  assert.equal(b.run('S.prof.sex'), 'f');
  assert.deepEqual(b.J('S.prof.lim'), ['k']);
  assert.equal(b.J('S.why').filter(w => /^Пол: /.test(w[0])).length, 1);
  remote.updatedAt = Date.now() + 1e6; remote.progAt = Date.now() + 1e6;
  b.run('window.__mzApplyMerged(' + JSON.stringify(remote) + ',' + remote.updatedAt + ')');
  assert.equal(b.run('S.prof.sex'), 'f', 'merge path too');
  assert.equal(b.J('S.why').filter(w => /^Пол: /.test(w[0])).length, 1, 'no duplicates');
  assert.equal(b.J('S.workouts').length, 1, 'history kept');
  // with consent the cloud value wins as before
  const r2 = JSON.parse(JSON.stringify(seed({ consentHealth: CONSENT })));
  r2.prof.sex = 'm';
  b.run('window.__mzApplyRemoteFresh(' + JSON.stringify(r2) + ')');
  assert.equal(b.run('S.prof.sex'), 'm');
});

test('Grok v160 P2: D2 gravitron, empty counterweight → need_w on every path (first top, same, miss, calibration), weight null', () => {
  const P = require(path.join(root, 'progress.js'));
  const base = { id: 'assisted-pullup', level: 'mid', range: [5, 8], sets_plan: 3, weight: null, place: 'g', need_w: true };
  const cases = [
    { results: [8, 8, 8], state: { success: 0 } },
    { results: [8, 8, 8], state: { success: 1 } },
    { results: [6, 6, 6], state: {} },
    { results: [3, 3, 3], state: { miss: 2 } },
    { results: [8, 8, 8], state: {}, calibration: true },
    { results: [8, 8, 8], state: { success: 0 }, weight: 0 }
  ];
  for (const c of cases) {
    const o = P.prNext(Object.assign({}, base, c));
    assert.equal(o.note, 'need_w', JSON.stringify(c));
    assert.equal(o.weight, null);
    assert.equal(o.id, 'assisted-pullup');
  }
  // with a counterweight written — normal progression
  const ok = P.prNext(Object.assign({}, base, { weight: 30, results: [8, 8, 8], state: { success: 1 } }));
  assert.notEqual(ok.note, 'need_w');
  assert.ok(ok.weight > 0);
  // not a D2 step (need_w false) — unchanged behaviour
  const old = P.prNext(Object.assign({}, base, { need_w: false, weight: 30, results: [8, 8, 8], state: { success: 0 } }));
  assert.notEqual(old.note, 'need_w');
});

test('v162: cache version', () => {
  assert.match(read('cache-ver.js'), /var SW_CACHE='moyzal-v165'/);
});
