'use strict';
// tech-fix-1 GC-01: a real break (the user did not train) vs a planned return of an exercise (rotation of the block, user kept training).
const test = require('node:test');
const assert = require('node:assert/strict');
const { boot, DAY } = require('./fixtures/tf1-boot.js');

const now = Date.now();
const wo = (id, daysAgo, exId, w, reps) => ({ id, start: now - daysAgo * DAY, end: now - daysAgo * DAY + 3600e3, dayIdx: 0, dayName: 'A', notes: '',
  items: [{ exId, ns: reps.length, min: 3, max: 6, rest: 180, sets: reps.map(r => ({ w, r, done: true })) }] });
function state(workouts, extra) {
  return Object.assign({ lang: 'ru', goal: 'str', days: 3, next: 0, prof: { goal: 'str', sex: 'm', level: 'adv', days: 3, len: 75, place: 'g', prio: [], lim: [] },
    program: [{ name: 'A', items: [{ exId: 'bp', sets: 5, min: 3, max: 6, rest: 180 }] }], workouts, custom: [], body: [],
    pg: { bp: { st: { success: 1, miss: 0 }, next: { weight: 100, sets: 5, target: 6, note: 'top1' }, first: now - 90 * DAY, last: now - 14 * DAY } },
    pgSince: now - 90 * DAY, dlLast: now - 10 * DAY }, extra || {});
}
const sug = st => { const b = boot({ state: st }); b.run('startW(0)'); return { s: b.J('S.active.items[0].sug'), n: b.J('S.active.items[0].sets.length'), hist: b.J('S.workouts.length'), b }; };

test('GC-01: rotation 14 days, user trained 3 days ago → planned return: weight kept, state kept, no −10 %', () => {
  const { s, n } = sug(state([wo('w1', 14, 'bp', 100, [6, 6, 6, 6, 6]), wo('w2', 10, 'sq', 100, [5, 5, 5]), wo('w3', 3, 'sq', 100, [5, 5, 5])]));
  assert.equal(s.note, 'return_planned');
  assert.equal(s.weight, 100);
  assert.equal(s.target, 3);
  assert.equal(n, 5);
  assert.deepEqual(s.st, { success: 1, miss: 0 });
});

test('GC-01: rotation 28+ days, user trained 2 days ago → planned return, no −20 %', () => {
  const st = state([wo('w1', 30, 'bp', 100, [6, 6, 6, 6, 6]), wo('w2', 9, 'sq', 100, [5, 5, 5]), wo('w3', 2, 'sq', 100, [5, 5, 5])]);
  st.pg.bp.last = now - 30 * DAY;
  const { s } = sug(st);
  assert.equal(s.note, 'return_planned');
  assert.equal(s.weight, 100);
});

test('GC-01: real break — no workout for 15 days → break14, weight −10 %', () => {
  const { s } = sug(state([wo('w1', 15, 'bp', 100, [6, 6, 6, 6, 6]), wo('w2', 16, 'sq', 100, [5, 5, 5])]));
  assert.equal(s.note, 'break14');
  assert.equal(s.weight, 90);
  assert.equal(s.st.success, 0);
});

test('GC-01: real break — no workout for 30 days → break28, weight −20 %, RIR +1', () => {
  const st = state([wo('w1', 30, 'bp', 100, [6, 6, 6, 6, 6])]);
  st.pg.bp.last = now - 30 * DAY;
  const { s } = sug(st);
  assert.equal(s.note, 'break28');
  assert.equal(s.weight, 80);
  assert.deepEqual(s.rir, [3, 4]); // adv main lift [2,3] + 1 after 4+ weeks (as before)
});

test('GC-01: the user break decides the size — exercise 40 days ago, last workout 16 days ago → break14 (−10 %), not break28', () => {
  const st = state([wo('w1', 40, 'bp', 100, [6, 6, 6, 6, 6]), wo('w2', 16, 'sq', 100, [5, 5, 5])]);
  st.pg.bp.last = now - 40 * DAY;
  const { s } = sug(st);
  assert.equal(s.note, 'break14');
  assert.equal(s.weight, 90);
});

test('GC-01: under 14 days nothing changes (regression) and history is not rewritten', () => {
  const W = [wo('w1', 5, 'bp', 100, [6, 6, 6, 6, 6])];
  const { s, hist, b } = sug(state(W));
  assert.equal(s.note, 'top1');
  assert.equal(s.weight, 100);
  assert.equal(hist, 1);
  assert.deepEqual(b.J('S.workouts[0]'), W[0]);
});

test('GC-01: prNext — planned_return keeps state; days_since_last behaves as before', () => {
  const b = boot();
  const e = b.J('awEq()');
  const pn = inp => b.J(`prNext(${JSON.stringify(inp)},${JSON.stringify(e)})`);
  const r = pn({ id: 'bp', level: 'adv', range: [3, 6], sets_plan: 5, weight: 100, state: { success: 1 }, flags: [], ctx: { planned_return: 1 } });
  assert.equal(r.note, 'return_planned'); assert.equal(r.weight, 100); assert.equal(r.state.success, 1); assert.equal(r.target, 3);
  assert.equal(pn({ id: 'bp', level: 'adv', range: [3, 6], sets_plan: 5, weight: 100, state: { success: 1 }, flags: [], ctx: { days_since_last: 14 } }).weight, 90);
  assert.equal(pn({ id: 'bp', level: 'adv', range: [3, 6], sets_plan: 5, weight: 100, state: {}, flags: [], ctx: { days_since_last: 28 } }).weight, 80);
});
