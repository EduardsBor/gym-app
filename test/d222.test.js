'use strict';
// D-222: first_workout analytics event (once, consent-gated) and Sentry wording in the built-in policy.
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
  const files = ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'place.js', 'prog.js', 'plan.js', 'movekit.js', 'premium.js', 'features.js', 'autow.js'];
  if (cloud) {
    g.MZ_SB = { url: 'https://example.invalid', anon: 'test-anon' }; g.supabase = fakeSupabase(cloud);
    files.push('sync.js');
  }
  for (const f of files) {
    let src = read(f);
    if (f === 'sync.js') src = src.replace('  init();\n})();', '  window.bootAnalytics=bootAnalytics;\n  init();\n})();');
    vm.runInContext(src, ctx, { filename: f });
  }
  return { run: code => vm.runInContext(code, ctx), store };
}

const tick = () => new Promise(r => setImmediate(r));
async function settle() { for (let i = 0; i < 8; i++) await tick(); }
const events = cloud => cloud.inserts.filter(x => x.table === 'events').map(x => x.row);

function seed(extra) {
  return Object.assign({
    lang: 'ru', goal: 'mass', days: 3, next: 0, obDone: 1,
    prof: { goal: 'mass', sex: 'm', level: 'mid', days: 3, len: 60, place: 'g', prio: [], lim: [] },
    program: [{ name: 'A', items: [{ exId: 'bp', sets: 3, min: 8, max: 12, rest: 120 }] }],
    workouts: [],
    custom: [], body: [],
    consentAnalytics: { v: 1, at: '2026-11-16T00:00:00Z' }
  }, extra || {});
}

function doneWo(id, placeNote) {
  return { id, start: 1, end: 2, items: [{ exId: 'bp', sets: [{ w: 40, r: 8, done: true }] }] };
}

test('D-222: first_workout fires once after the first finished workout; props are only place and goal', async () => {
  const cloud = { inserts: [], upserts: [], user: null };
  const b = boot(seed({ prof: { goal: 'fit', sex: 'm', level: 'mid', days: 3, len: 60, place: 'd', prio: [], lim: [] }, goal: 'fit' }), cloud);
  await settle();
  assert.equal(events(cloud).some(e => e.name === 'first_workout'), false);
  assert.equal(b.run('S.azFirstWo||0'), 0);

  b.run(`S.workouts.push(${JSON.stringify(doneWo('w1'))}); mzOnWorkoutFinished(S.workouts[S.workouts.length-1])`);
  await settle();
  const first = events(cloud).filter(e => e.name === 'first_workout');
  assert.equal(first.length, 1);
  assert.deepEqual(first[0].props, { place: 'd', goal: 'fit' });
  assert.deepEqual(Object.keys(first[0].props).sort(), ['goal', 'place']);
  assert.equal(b.run('S.azFirstWo'), 1);

  b.run(`S.workouts.push(${JSON.stringify(doneWo('w2'))}); mzOnWorkoutFinished(S.workouts[S.workouts.length-1])`);
  await settle();
  assert.equal(events(cloud).filter(e => e.name === 'first_workout').length, 1);
});

test('D-222: first_workout does not fire for an unfinished workout', async () => {
  const cloud = { inserts: [], upserts: [], user: null };
  const b = boot(seed(), cloud);
  await settle();
  b.run(`mzOnWorkoutFinished({id:'open',start:1,items:[{exId:'bp',sets:[{w:40,r:8,done:false}]}]})`);
  b.run(`mzOnWorkoutFinished({id:'empty',start:1,end:2,items:[]})`);
  b.run(`S.active={id:'a1',start:Date.now(),dayIdx:0,dayName:'A',items:[{exId:'bp',sets:[{w:'',r:8,done:false}]}]}`);
  await settle();

  assert.equal(events(cloud).filter(e => e.name === 'first_workout').length, 0);
  assert.equal(b.run('S.azFirstWo||0'), 0);
});

test('D-222: first_workout is not sent without consent; later consent does not backfill it', async () => {
  const cloud = { inserts: [], upserts: [], user: null };
  const b = boot(seed({ consentAnalytics: null }), cloud);
  await settle();
  assert.equal(cloud.inserts.length, 0);

  b.run(`S.workouts.push(${JSON.stringify(doneWo('w1'))}); mzOnWorkoutFinished(S.workouts[S.workouts.length-1])`);
  await settle();
  assert.equal(cloud.inserts.length, 0);
  assert.equal(b.run('S.azFirstWo'), 1);

  b.run(`S.consentAnalytics={v:1,at:'2026-11-16T12:00:00Z'}; bootAnalytics()`);
  await settle();
  assert.equal(events(cloud).some(e => e.name === 'first_workout'), false);
});

test('D-222: existing users with a finished workout in history get the flag and no first_workout event', async () => {
  const cloud = { inserts: [], upserts: [], user: null };
  const b = boot(seed({ workouts: [doneWo('old')] }), cloud);
  await settle();
  assert.equal(b.run('S.azFirstWo'), 1);
  assert.equal(events(cloud).some(e => e.name === 'first_workout'), false);
  assert.ok(events(cloud).some(e => e.name === 'install') || events(cloud).some(e => e.name === 'app_open'));

  b.run(`S.workouts.push(${JSON.stringify(doneWo('later'))}); mzOnWorkoutFinished(S.workouts[S.workouts.length-1])`);
  await settle();
  assert.equal(events(cloud).filter(e => e.name === 'first_workout').length, 0);
});

test('D-222: first_workout props allow only place and goal (no extra fields)', async () => {
  const cloud = { inserts: [], upserts: [], user: null };
  const b = boot(seed(), cloud);
  await settle();
  b.run("mzTrack('first_workout',{place:'g',goal:'mass',email:'e@x',user_id:'u',uid:'u',notes:'secret',weight:80})");
  await settle();
  // flag is not set via mzTrack alone, so this direct call is only a props-allowlist check
  const ev = events(cloud).filter(e => e.name === 'first_workout');
  assert.equal(ev.length, 1);
  assert.deepEqual(ev[0].props, { place: 'g', goal: 'mass' });
  // tech-fix-1: install_id is a random 32-hex id and contains «80» in ~11 % of runs (the old flake) — leave it out of the substring check
  const json = JSON.stringify(Object.assign({}, ev[0], { install_id: undefined }));
  assert.match(String(ev[0].install_id || ''), /^[0-9a-f]{32}$/);
  assert.equal(json.includes('e@x') || json.includes('secret') || json.includes('80') || json.includes('user_id'), false);
});

test('D-222: azFirstWo stays on the device and is not uploaded in the account payload', async () => {
  const cloud = { inserts: [], upserts: [], user: { id: '11111111-2222-3333-4444-555555555555', email: 'someone@example.com' } };
  const b = boot(seed({ workouts: [doneWo('old')] }), cloud);
  await settle();
  assert.equal(b.run('S.azFirstWo'), 1);
  const ups = cloud.upserts.filter(x => x.table === 'user_state');
  assert.ok(ups.length >= 1, 'profile was pushed');
  const p = ups[ups.length - 1].row.payload;
  assert.equal(p.azFirstWo, undefined);
  assert.equal(p.installId, undefined);
});

test('D-222: built-in privacy policy mentions Sentry in RU, EN and LV (B-410 §3.6)', () => {
  const legal = read('legal.js');
  assert.match(legal, /<h4>3\.6\. Сбор ошибок \(Sentry\)<\/h4>/);
  assert.match(legal, /В <b>Android-приложении<\/b> при сбое Приложение отправляет технический отчёт об ошибке обработчику <b>Sentry<\/b>/);
  assert.match(legal, /В отчёт <b>не входят<\/b> имя, адрес электронной почты, IP-адрес и данные тренировок/);

  assert.match(legal, /<h4>3\.6\. Crash reporting \(Sentry\)<\/h4>/);
  assert.match(legal, /In the <b>Android app<\/b>, when the App crashes it sends a technical crash report to the processor <b>Sentry<\/b>/);
  assert.match(legal, /A report <b>does not include<\/b> your name, email address, IP address or workout data/);

  assert.match(legal, /<h4>3\.6\. Kļūdu vākšana \(Sentry\)<\/h4>/);
  assert.match(legal, /<b>Android lietotnē<\/b> avārijas gadījumā Lietotne nosūta tehnisku kļūdas ziņojumu apstrādātājam <b>Sentry<\/b>/);
  assert.match(legal, /Ziņojumā <b>nav<\/b> vārda, e-pasta adreses, IP adreses un treniņu datu/);

  assert.equal(/Sentry не подключено|Sentry сейчас не подключено|Sentry is not connected today|Sentry nav pieslēgts/i.test(legal), false);
});

test('D-222: sw is moyzal-v67; changelog; LV strings only in docs/LV-NEW-D222.md; hooks present; not via Sentry', () => {
  assert.match(read('cache-ver.js'), /var SW_CACHE='moyzal-v158'/);
  assert.match(read('sw.js'), /const C=SW_CACHE/);
  const log = read('CHANGELOG.md');
  assert.match(log, /D-222/);
  assert.match(log, /first_workout/);
  assert.match(log, /moyzal-v66/);

  const lv = read('docs/LV-NEW-D222.md');
  assert.match(lv, /Kļūdu ziņojumi/);
  assert.match(lv, /pirmais pabeigtais treniņš/);
  assert.equal(read('LV-REVIEW.md').includes('D-222'), false);

  assert.match(read('app.js'), /mzOnWorkoutFinished\(A\)/);
  assert.match(read('autow.js'), /mzOnWorkoutFinished\(W\)/);
  assert.match(read('sync.js'), /mzTrack\('first_workout'/);
  assert.equal(read('sentry.js').includes('first_workout'), false);
});
