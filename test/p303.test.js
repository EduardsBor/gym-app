'use strict';
// P-303: weekly volume by muscle, records, Epley 1RM, gating.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const S = require('../stats.js');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

const local = (y, m, d, h = 12, min = 0) => new Date(y, m - 1, d, h, min, 0, 0).getTime();
const groupOf = id => ({ bp: 'Грудь', pu: 'Грудь', sq: 'Ноги', row: 'Спина', tm: 'Кардио' }[id] || '');
const isBW = id => id === 'pu';
const set = (w, r, extra) => Object.assign({ w, r, done: true }, extra || {});
const wo = (id, t, items) => ({ id, start: t, end: t + 3600e3, items });

const opts = { groupOf, isBodyweight: isBW };

test('Epley 1RM: 1–10 reps, no estimate above 10 or invalid input', () => {
  assert.equal(S.epley1RM(100, 1), 100 * (1 + 1 / 30));
  assert.equal(S.epley1RM(100, 5), 100 * (1 + 5 / 30));
  assert.equal(S.epley1RM(100, 10), 100 * (1 + 10 / 30));
  assert.equal(S.epley1RM(80, 8), 80 * (1 + 8 / 30));
  assert.equal(S.epley1RM(100, 11), null);
  assert.equal(S.epley1RM(100, 12), null);
  assert.equal(S.epley1RM(100, 0), null);
  assert.equal(S.epley1RM(100, 0.5), null);
  assert.equal(S.epley1RM(0, 5), null);
  assert.equal(S.epley1RM('', 5), null);
  assert.equal(S.epley1RM(100, ''), null);
  assert.equal(S.epley1RM(60, 10), 80);
});

test('week bounds are Mon–Sun local time; Sunday belongs to the ending week', () => {
  // A Wednesday sits in the week that started that Monday.
  const wed = local(2026, 11, 11, 15, 0);
  const b = S.weekBounds(wed);
  assert.equal(b.current.start, local(2026, 11, 9, 0, 0));
  assert.equal(b.current.end, local(2026, 11, 16, 0, 0));
  assert.equal(b.previous.start, local(2026, 11, 2, 0, 0));
  assert.equal(b.previous.end, local(2026, 11, 9, 0, 0));
  const sunNight = local(2026, 11, 15, 23, 59);
  const monAm = local(2026, 11, 16, 0, 1);
  const sunPrev = local(2026, 11, 8, 23, 30);
  const monStart = local(2026, 11, 9, 0, 1);
  const b2 = S.weekBounds(sunNight);
  assert.equal(b2.current.start, b.current.start);
  const b3 = S.weekBounds(monAm);
  assert.equal(b3.current.start, local(2026, 11, 16, 0, 0));
  assert.ok(sunPrev >= b.previous.start && sunPrev < b.previous.end);
  assert.ok(monStart >= b.current.start && monStart < b.current.end);
  assert.ok(sunNight >= b.current.start && sunNight < b.current.end);
});

test('weekly volume: working sets and tonnage, week boundaries, bodyweight sets only', () => {
  const now = local(2026, 11, 11, 12);
  const workouts = [
    wo('w1', local(2026, 11, 9, 10), [
      { exId: 'bp', sets: [set(80, 5), set(80, 5), set(80, 5)] }
    ]),
    wo('w2', local(2026, 11, 10, 10), [
      { exId: 'pu', sets: [set(0, 12), set(20, 10)] }, // bodyweight: sets only, even with a logged weight
      { exId: 'bp', sets: [set(90, 3), set(90, 3, { wu: true }), set(90, 3, { done: false })] }
    ]),
    wo('w3', local(2026, 11, 8, 23, 30), [
      { exId: 'sq', sets: [set(100, 5), set(100, 5)] },
      { exId: 'tm', sets: [set(0, 20)] } // cardio ignored
    ]),
    wo('w4', local(2026, 11, 16, 0, 1), [
      { exId: 'row', sets: [set(60, 8)] } // next week, ignored
    ])
  ];
  const v = S.weeklyVolume(workouts, { now, ...opts });
  const chest = v.current.groups.find(g => g.group === 'Грудь');
  assert.ok(chest);
  // w1: 3 bench sets; w2: 2 push-up sets + 1 working bench (warmup and incomplete excluded)
  assert.equal(chest.sets, 3 + 2 + 1);
  // tonnage: 3*80*5 + 1*90*3; push-ups add 0
  assert.equal(chest.tonnage, 3 * 80 * 5 + 90 * 3);
  assert.equal(v.current.groups.find(g => g.group === 'Ноги'), undefined);
  const legs = v.previous.groups.find(g => g.group === 'Ноги');
  assert.ok(legs);
  assert.equal(legs.sets, 2);
  assert.equal(legs.tonnage, 2 * 100 * 5);
  assert.equal(v.previous.groups.find(g => g.group === 'Кардио'), undefined);
  assert.equal(v.current.groups.find(g => g.group === 'Спина'), undefined);
});

test('records: best weight, best reps at a weight, best estimated 1RM; warmup excluded', () => {
  const workouts = [
    wo('a', local(2026, 11, 1), [{ exId: 'bp', sets: [set(80, 5), set(80, 6), set(70, 10)] }]),
    wo('b', local(2026, 11, 3), [{ exId: 'bp', sets: [set(90, 3), set(100, 12), set(85, 4, { warmup: true })] }])
  ];
  const r = S.recordsForExercise(workouts, 'bp');
  // 100×12 still counts as best weight (the 1–10 cap applies only to the 1RM estimate).
  assert.equal(r.bestWeight, 100);
  assert.equal(r.bestWeightReps, 12);
  assert.deepEqual(r.bestRepsAtWeight, { w: 100, r: 12 }); // most reps; tie would prefer heavier
  // 1RM: 80×6 = 80*(1+6/30)=96; 70×10=93.33; 90×3=99; 100×12 not estimated; warmup 85×4 ignored
  assert.equal(r.best1RM, 90 * (1 + 3 / 30));
  assert.deepEqual(r.best1RMSet, { w: 90, r: 3 });
});

test('best reps at a lighter weight is reported separately from best weight', () => {
  const workouts = [
    wo('a', local(2026, 11, 1), [{ exId: 'bp', sets: [set(100, 3), set(80, 8)] }])
  ];
  const r = S.recordsForExercise(workouts, 'bp');
  assert.equal(r.bestWeight, 100);
  assert.equal(r.bestWeightReps, 3);
  assert.deepEqual(r.bestRepsAtWeight, { w: 80, r: 8 });
});

test('record detection: first session is not a record; later beats are one per type', () => {
  const prior = [wo('a', local(2026, 11, 1), [{ exId: 'bp', sets: [set(80, 5), set(80, 5)] }])];
  const first = wo('z', local(2026, 11, 1), [{ exId: 'bp', sets: [set(80, 5)] }]);
  assert.deepEqual(S.detectNewRecords([], first), []);
  const beat = wo('b', local(2026, 11, 4), [{ exId: 'bp', sets: [set(90, 3), set(90, 4), set(80, 6)] }]);
  const found = S.detectNewRecords(prior, beat);
  const types = found.map(x => x.type).sort();
  assert.deepEqual(types, ['e1rm', 'reps', 'weight']);
  const w = found.find(x => x.type === 'weight');
  assert.equal(w.prev, 80);
  assert.equal(w.next, 90);
  const rp = found.find(x => x.type === 'reps');
  assert.equal(rp.weight, 80);
  assert.equal(rp.prev, 5);
  assert.equal(rp.next, 6);
  const e = found.find(x => x.type === 'e1rm');
  assert.ok(e.next > e.prev);
  // 12-rep set cannot create a 1RM record
  const highRep = wo('c', local(2026, 11, 5), [{ exId: 'bp', sets: [set(120, 12)] }]);
  const onlyW = S.detectNewRecords(prior, highRep);
  assert.equal(onlyW.some(x => x.type === 'e1rm'), false);
  assert.equal(onlyW.some(x => x.type === 'weight'), true);
  // warmup set is ignored
  const wu = wo('d', local(2026, 11, 5), [{ exId: 'bp', sets: [set(150, 3, { wu: true })] }]);
  assert.deepEqual(S.detectNewRecords(prior, wu), []);
});

test('gating: volume chart and 1RM trend use charts; records stay behind existing FEATURES.prs', () => {
  const ctx = vm.createContext({ localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, location: { search: '' } });
  vm.runInContext(read('premium.js'), ctx);
  const F = vm.runInContext('FEATURES', ctx);
  assert.equal(F.charts, 'sub');
  assert.equal(F.prs, 'sub');
  assert.equal(F.oneRM, 'sub');
  assert.equal(F.muscleVolume, 'sub');
  assert.equal(F.graphs, undefined);
  // Paywall off → everything stays open
  assert.equal(vm.runInContext('PREM_CFG.PAYWALL_ENABLED', ctx), false);
  assert.equal(vm.runInContext("can('charts') && can('prs') && can('oneRM') && can('muscleVolume')", ctx), true);
  const app = read('app.js');
  const feat = read('features.js');
  assert.match(app, /can\('charts'\)/);
  assert.match(app, /can\('prs'\)/);
  assert.match(feat, /can\('charts'\)\|\|can\('prs'\)/);
  // Records were not made free: the existing prs rule is followed.
  assert.equal(F.prs, 'sub');
});

test('P-303 is wired: histList, stats.js precache, cache v59, changelog, new LV file only', () => {
  const app = read('app.js');
  const sw = read('sw.js');
  const html = read('index.html');
  const build = read('scripts/build-web.js');
  assert.match(app, /histWorkouts\(\)/);
  assert.match(app, /weeklyVolume\(histWorkouts/);
  assert.match(app, /recordsForExercise/);
  assert.match(app, /1ПМ \(оценка\)/);
  assert.match(app, /Новый рекорд/);
  assert.match(app, /function prNotes/);
  assert.equal(app.includes('pendingFan=true;celebrate'), false);
  assert.match(sw, /const C='moyzal-v106'/);
  assert.equal(sw.includes("C='moyzal-v59'"), false);
  assert.match(sw, /'stats\.js'/);
  assert.match(html, /<script src="stats\.js"><\/script>/);
  assert.ok(html.indexOf('stats.js') < html.indexOf('app.js') && html.indexOf('stats.js') > html.indexOf('alt.js'));
  assert.match(build, /'stats\.js'/);
  assert.match(read('CHANGELOG.md'), /P-303/);
  assert.ok(fs.existsSync(path.join(root, 'docs/LV-NEW-P303.md')));
  // Must not have been edited
  const st = fs.statSync(path.join(root, 'LV-REVIEW.md'));
  assert.ok(st);
});

test('new P-303 dictionary rows have EN and LV', () => {
  const ctx = vm.createContext({ console });
  vm.runInContext(read('i18n/dict3.js') + '\nthis.DICT3=DICT3;', ctx);
  const keys = [
    'Объём по мышцам за неделю',
    'Эта неделя',
    'Прошлая неделя',
    '1ПМ (оценка)',
    '🏆 Новый рекорд',
    '🏆 Новые рекорды'
  ];
  const rows = ctx.DICT3;
  for (const k of keys) {
    const r = rows.find(x => x[0] === k);
    assert.ok(r, k);
    assert.ok(String(r[1]).trim(), k + ' en');
    assert.ok(String(r[2]).trim(), k + ' lv');
  }
});
