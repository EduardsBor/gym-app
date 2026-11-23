'use strict';
// v161 P1: limitations / limSeen and the cloud — both health-consent states (harness copied from d217-privacy.test.js).
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
    if (f === 'sync.js') src = src.replace('  init();\n})();', '  window.__mzApplyRemoteFresh=applyRemoteFresh;window.__mzApplyMerged=applyMerged;window.__mzSync=sync;\n  init();\n})();');
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

async function pushed(extra) {
  const cloud = { inserts: [], upserts: [], user: USER };
  const b = boot(seed(extra), true, cloud);
  for (let i = 0; i < 6; i++) await tick();
  const up = cloud.upserts.filter(x => x.table === 'user_state');
  assert.ok(up.length >= 1, 'profile was pushed');
  return { p: up[up.length - 1].row.payload, b };
}

const CONSENT = { v: 1, at: '2026-11-14T00:00:00Z' };
// v160 plan items carry merged / swapped / limWarn; the device flag limSeen is set after the local confirmation
const v161 = extra => seed(Object.assign({ limSeen: 1,
  program: [{ name: 'A', limWarn: [{ from: 'bwsq', to: 'step-bw', lim: ['k'], add: 2 }], items: [{ exId: 'step-bw', sets: 4, min: 8, max: 12, rest: 90, merged: 2 }, { exId: 'bp', sets: 3, min: 8, max: 12, rest: 120, swapped: 1 }] }] }, extra || {}));

test('v161 P1: without health consent — no limitations, no limSeen, no merged / swapped / limWarn in the cloud copy; the device keeps them', async () => {
  const cloud = { inserts: [], upserts: [], user: USER };
  const b = boot(v161({ consentHealth: null }), true, cloud);
  for (let i = 0; i < 6; i++) await tick();
  const up = cloud.upserts.filter(x => x.table === 'user_state');
  assert.ok(up.length >= 1);
  const p = up[up.length - 1].row.payload, json = JSON.stringify(p);
  assert.equal(p.prof.lim, undefined);
  assert.equal('limSeen' in p, false);
  assert.equal(p.program[0].limWarn, undefined);
  assert.equal(p.program[0].items[0].merged, undefined);
  assert.equal(p.program[0].items[1].swapped, undefined);
  assert.equal(p.program[0].items[0].sets, 4, 'the plan itself is synced');
  assert.doesNotMatch(json, /"lim"|limSeen|limWarn|"merged"/);
  assert.deepEqual(JSON.parse(b.run('JSON.stringify(S.prof.lim)')), ['s', 'k']);
  assert.equal(b.run('S.limSeen'), 1);
  assert.equal(b.run('S.program[0].items[0].merged'), 2);
  // events never carry limitations
  for (const e of cloud.inserts.filter(x => x.table === 'events')) assert.doesNotMatch(JSON.stringify(e.row), /"lim"|limSeen/);
});

test('v161 P1: with health consent — limitations sync as before (D-217, privacy policy 3.2), but limSeen never does', async () => {
  const cloud = { inserts: [], upserts: [], user: USER };
  boot(v161({ consentHealth: CONSENT }), true, cloud);
  for (let i = 0; i < 6; i++) await tick();
  const up = cloud.upserts.filter(x => x.table === 'user_state');
  const p = up[up.length - 1].row.payload;
  assert.deepEqual(p.prof.lim, ['s', 'k']);
  assert.equal('limSeen' in p, false, 'device flag stays on the device');
  assert.equal(p.weightKg, 80, 'other consented health data unchanged');
});

test('v161 P1: the confirmation text matches the consent state (no «only on this device» promise when they do sync)', () => {
  const app = read('app.js');
  assert.match(app, /\$\{S\.consentHealth\?'Ограничения сохраняются в облаке вместе с другими данными о здоровье — по твоему согласию\. Отозвать его можно в «Профиле»\.':'Ограничения хранятся только на этом устройстве и не отправляются в облако\.'\}/);
  assert.match(read('sync.js'), /delete p\.replacePending;delete p\.replaceBody;\n    \/\/ v161[^\n]*\n    delete p\.limSeen;/);
  assert.match(read('i18n/dict3.js'), /'Ierobežojumi tiek saglabāti mākonī kopā ar citiem veselības datiem, jo ir dota tava piekrišana\. To vari atsaukt sadaļā «Profils»\.'/);
});

test('v161: cache version', () => {
  assert.match(read('cache-ver.js'), /var SW_CACHE='moyzal-v165'/);
});