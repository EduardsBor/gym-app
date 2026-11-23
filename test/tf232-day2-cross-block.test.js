'use strict';
// tech-fix-2.3.2 (P2, found by GPT after 2.3.1): only DAY 2 of mass_nov_3_g_b36 was done on an old app (no record of day 1),
// then fit_nov_3_g_b36 was assigned (old app: no S.block.passAt, records without w.blk, S.block.next = 0). Day 2 of both
// programs has the same dayIdx, n and name → lgDayLocked(1) said 'done' and lgAuditPlan() skipped the day (no limitation check).
// 2.3.1 used a day-1 record as the anchor; with no day-1 record there was none. Now: while S.block.next = 0 and there is no
// passAt, no record without w.blk can confirm a day of THIS pass → those days are 'unsure' (asked, not changed automatically).
// Records with w.blk of the current block still count (new app). S.workouts and S.pg are never changed.
const test = require('node:test');
const assert = require('node:assert/strict');
const { boot, DAY } = require('./fixtures/tf1-boot.js');

const now = Date.now();
const OLD = 'mass_nov_3_g_b36', NEW = 'fit_nov_3_g_b36';
const PR = { goal: 'mass', sex: 'm', level: 'nov', days: 3, len: 60, place: 'g', prio: [], lim: [] };
function st() {
  return { lang: 'ru', goal: 'mass', days: 3, next: 0, prof: Object.assign({}, PR), workouts: [], custom: [], body: [],
    pg: { lp: { st: { success: 1, miss: 0 }, next: { weight: 80 } } }, pgSince: now - 60 * DAY };
}
function assign(b, id, next, passAt) {
  b.run(`S.block={id:${JSON.stringify(id)},next:${next}${passAt != null ? ',passAt:' + passAt : ''}};S.next=${next};S.program=planFromBlock(getBlock(${JSON.stringify(id)}),${JSON.stringify(PR)}).days;save()`);
}
// old-app workout record: no w.blk
function hist(b, i, at, extra) {
  b.run(`(()=>{const d=S.program[${i}];S.workouts.push(Object.assign({id:'h${i}_${at}',start:${at},dayIdx:${i},dayName:d.name,n:d.n,notes:'',items:[{exId:'lp',ns:3,sets:[{w:80,r:10,done:true}]}]},${JSON.stringify(extra || {})}))})()`);
}
const HP = b => b.run('JSON.stringify({w:S.workouts,pg:S.pg})');
const snap = (b, i) => b.run(`JSON.stringify(S.program[${i}])`);
function lim(b) { b.run(`S.prof.lim=['k'];save()`); }
// GPT scenario 2.3.2: only day 2 of mass on the old app, then fit assigned on the old app (no passAt, next 0)
function gpt2(b) {
  assign(b, OLD, 0);
  hist(b, 1, now - 10 * DAY);
  b.run(`finishBlockWorkout(S,getBlock(${JSON.stringify(OLD)}))`);
  assign(b, NEW, 0);
  lim(b);
}

test('tf2.3.2 P2: only day 2 of mass_nov_3_g_b36 done, then fit_nov_3_g_b36 assigned without passAt → its day 2 is NOT done (unsure, asked)', () => {
  const b = boot({ state: st() });
  assert.deepEqual(b.failed, []);
  gpt2(b);
  assert.equal(b.run('S.block.id'), NEW);
  assert.equal(b.run('S.block.next'), 0);
  assert.equal(b.run('S.block.passAt'), undefined, 'old data: no passAt');
  assert.equal(b.run('S.workouts.length'), 1);
  assert.equal(b.run('S.workouts[0].dayIdx'), 1, 'no record of day 1');
  assert.equal(b.run('S.workouts[0].blk'), undefined, 'old record: no w.blk');
  assert.equal(b.run('S.program[1].name'), b.run('S.workouts[0].dayName'), 'same day name in both programs');
  assert.equal(b.run('S.program[1].n'), b.run('S.workouts[0].n'), 'same day number');
  assert.ok(b.J('!!lgAuditDay(S.program[1])'), 'fit day 2 has knee-risky exercises');
  const H = HP(b);
  assert.notEqual(b.J('lgDayLocked(1)'), 'done', 'history of another program must not count day 2 of the new one as done');
  assert.equal(b.J('lgDayLocked(1)'), 'unsure');
  assert.ok(b.J('lgAuditUnsure().map(x=>x.d)').includes(1), 'the day is shown with a question');
  assert.match(b.J('lgPlanCardHTML(lgAuditPlan(),lgAuditUnsure())'), /id="lgfixunsure"/);
  const before = snap(b, 1);
  b.run('lgFixAll()');
  assert.equal(snap(b, 1), before, 'not changed automatically');
  assert.ok(b.run('lgFixUnsure()') > 0, 'changed after the user confirms');
  assert.equal(b.J('!!lgAuditDay(S.program[1])'), false);
  assert.equal(HP(b), H, 'S.workouts and S.pg unchanged');
});

test('tf2.3.2: the other days of fit stay upcoming and are checked (only the matching day is asked)', () => {
  const b = boot({ state: st() });
  gpt2(b);
  const n = b.run('S.program.length');
  for (let i = 0; i < n; i++) if (i !== 1) assert.equal(b.J(`lgDayLocked(${i})`), false, `day ${i + 1} upcoming`);
  assert.equal(b.J('lgAuditPlan().some(x=>x.d===1)'), false, 'asked, not auto-fixed');
});

test('tf2.3.2: the same switch on the new app (passAt stored) → fit day 2 is upcoming and checked, no question', () => {
  const b = boot({ state: st() });
  assign(b, OLD, 0);
  hist(b, 1, now - 10 * DAY);
  b.run(`finishBlockWorkout(S,getBlock(${JSON.stringify(OLD)}));blockOnApplied({blockId:${JSON.stringify(NEW)}});S.program=planFromBlock(getBlock(${JSON.stringify(NEW)}),${JSON.stringify(PR)}).days;save()`);
  lim(b);
  assert.ok(b.run('S.block.passAt') > 0);
  assert.equal(b.J('lgDayLocked(1)'), false);
  assert.ok(b.J('lgAuditPlan().map(x=>x.d)').includes(1));
  assert.equal(b.J('lgAuditUnsure().length'), 0);
});

test('tf2.3.2: next 0, no passAt, day 2 of THIS block done out of order on the new app (w.blk) → done, not asked', () => {
  const b = boot({ state: st() });
  assign(b, NEW, 0);
  hist(b, 1, now - 2 * DAY, { blk: NEW });
  lim(b);
  assert.equal(b.J('lgDayLocked(1)'), 'done');
  assert.equal(b.J('lgAuditUnsure().length'), 0);
});

test('tf2.3.2: next 0, no passAt, untagged out-of-order record of the same program → unsure (history cannot tell the program)', () => {
  const b = boot({ state: st() });
  assign(b, NEW, 0);
  hist(b, 2, now - 2 * DAY);
  lim(b);
  assert.equal(b.J('lgDayLocked(2)'), 'unsure');
  assert.equal(b.J('lgDayLocked(0)'), false);
});

test('tf2.3.2: old data, another program fully finished before the switch → the new program is all upcoming, no question', () => {
  const b = boot({ state: st() });
  assign(b, OLD, 0);
  const n = b.run('S.program.length');
  for (let i = 0; i < n; i++) hist(b, i, now - 200 * DAY + i * DAY);
  assign(b, NEW, 0);
  lim(b);
  assert.equal(b.J('S.program.map((d,i)=>lgDayLocked(i)).filter(Boolean).length'), 0);
  assert.equal(b.J('lgAuditUnsure().length'), 0);
});

test('tf2.3.2 migration: saved old state → restart → fit day 2 stays unsure; after «Повторить блок» / new block passAt is exact', () => {
  const b = boot({ state: st() });
  gpt2(b);
  const b2 = boot({ ls: { gym: b.run(`localStorage.getItem('gym')`) } });
  assert.equal(b2.run('S.block.id'), NEW);
  assert.equal(b2.run('S.block.passAt'), undefined);
  assert.equal(b2.J('lgDayLocked(1)'), 'unsure');
  b2.run(`blockOnApplied({blockId:${JSON.stringify(NEW)}});save()`);
  assert.equal(b2.J('lgDayLocked(1)'), false);
});
