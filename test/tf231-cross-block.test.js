'use strict';
// tech-fix-2.3.1 (P2): history of ANOTHER program counted a day of the new one as done. Day 1 of mass_nov_3_g_b36 was done
// on an old app; then fit_nov_3_g_b36 was assigned (old app: no S.block.passAt, S.block.next = 0). Day 1 of both programs has
// the same dayIdx 0, n 1 and dayName «Неделя 1 · Всё тело A» → lgDayLocked(0) said 'done' and lgAuditPlan() skipped the day.
// Now: a day-1 workout while S.block.next = 0 cannot be from this pass (it would have moved next) → the stretch from it on is
// 'unsure' (asked, not changed automatically); new workouts store the block id (w.blk) → other blocks never match.
// S.workouts and S.pg are never changed.
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
// GPT scenario: day 1 of mass done on the old app, then fit assigned on the old app (no passAt, next 0)
function gpt(b) {
  assign(b, OLD, 0);
  hist(b, 0, now - 10 * DAY);
  b.run(`finishBlockWorkout(S,getBlock(${JSON.stringify(OLD)}))`);
  assign(b, NEW, 0);              // old app: no passAt
  lim(b);
}

test('tf2.3.1 P2: mass_nov_3_g_b36 day 1 done, then fit_nov_3_g_b36 assigned without passAt → its day 1 is NOT done (unsure, asked)', () => {
  const b = boot({ state: st() });
  assert.deepEqual(b.failed, []);
  gpt(b);
  assert.equal(b.run('S.block.id'), NEW);
  assert.equal(b.run('S.block.next'), 0);
  assert.equal(b.run('S.block.passAt'), undefined, 'old data: no passAt');
  assert.equal(b.run('S.program[0].name'), b.run('S.workouts[0].dayName'), 'same day name in both programs');
  assert.equal(b.run('S.program[0].n'), 1);
  assert.ok(b.J('!!lgAuditDay(S.program[0])'), 'fit day 1 has knee-risky exercises');
  const H = HP(b);
  assert.notEqual(b.J('lgDayLocked(0)'), 'done', 'history of another program must not count day 1 of the new one as done');
  assert.equal(b.J('lgDayLocked(0)'), 'unsure');
  assert.deepEqual(b.J('lgAuditUnsure().map(x=>x.d)'), [0], 'the day is shown with a question');
  assert.match(b.J('lgPlanCardHTML(lgAuditPlan(),lgAuditUnsure())'), /id="lgfixunsure"/);
  const before = snap(b, 0);
  b.run('lgFixAll()');
  assert.equal(snap(b, 0), before, 'not changed automatically');
  assert.ok(b.run('lgFixUnsure()') > 0, 'changed after the user confirms');
  assert.equal(b.J('!!lgAuditDay(S.program[0])'), false);
  assert.equal(HP(b), H, 'S.workouts and S.pg unchanged');
});

test('tf2.3.1: the same switch on the new app (blockOnApplied stores passAt) → day 1 of fit is upcoming and is checked', () => {
  const b = boot({ state: st() });
  assign(b, OLD, 0);
  hist(b, 0, now - 10 * DAY);
  b.run(`finishBlockWorkout(S,getBlock(${JSON.stringify(OLD)}));blockOnApplied({blockId:${JSON.stringify(NEW)}});S.program=planFromBlock(getBlock(${JSON.stringify(NEW)}),${JSON.stringify(PR)}).days;save()`);
  lim(b);
  assert.ok(b.run('S.block.passAt') > 0);
  assert.equal(b.J('lgDayLocked(0)'), false);
  assert.ok(b.J('lgAuditPlan().map(x=>x.d)').includes(0));
  assert.equal(b.J('lgAuditUnsure().length'), 0);
});

test('tf2.3.1: new workout records store the block id (w.blk); a record of another block never matches, even without passAt', () => {
  const b = boot({ state: st() });
  assign(b, OLD, 0, now - 20 * DAY);
  b.run('LG_GO=true;startW(0);LG_GO=false');
  assert.equal(b.run('S.active.blk'), OLD, 'open workout carries the block id');
  b.run('S.active.items.forEach(it=>it.sets.forEach(s=>{s.w=10;s.r=10;s.done=true}));S.workouts.push(JSON.parse(JSON.stringify(S.active)));blockOnFinished(S.active);S.active=null;save()');
  assert.equal(b.run('S.workouts[0].blk'), OLD);
  assign(b, NEW, 0);                                  // old-app style switch: no passAt
  lim(b);
  assert.equal(b.J('lgDayLocked(0)'), false, 'record of mass (w.blk) is not a fit day');
  assert.equal(b.J('lgAuditUnsure().length'), 0, 'no question: the record is known to be from another block');
  assert.ok(b.J('lgAuditPlan().map(x=>x.d)').includes(0));
});

test('tf2.3.1: old data, fit done day 1 (next 1) after mass days 1–2 → mass day 2 is not taken as fit day 2 done (unsure)', () => {
  const b = boot({ state: st() });
  assign(b, OLD, 0);
  hist(b, 0, now - 12 * DAY); hist(b, 1, now - 11 * DAY);
  const sameName2 = b.run(`S.program[1].name`);
  assign(b, NEW, 0);
  assert.equal(b.run('S.program[1].name'), sameName2, 'day 2 has the same name too');
  hist(b, 0, now - 2 * DAY);
  b.run(`finishBlockWorkout(S,getBlock(${JSON.stringify(NEW)}))`);
  lim(b);
  assert.equal(b.J('lgDayLocked(0)'), 'done');
  assert.notEqual(b.J('lgDayLocked(1)'), 'done');
  assert.equal(b.J('lgDayLocked(1)'), 'unsure');
});

test('tf2.3.1: mixed history — old mass records without w.blk + new fit records with w.blk, no passAt → fit records count, mass record is unsure only', () => {
  const b = boot({ state: st() });
  assign(b, OLD, 0);
  hist(b, 0, now - 12 * DAY); hist(b, 2, now - 11 * DAY);           // mass, old app
  assign(b, NEW, 0);                                                 // old app switch
  hist(b, 1, now - 3 * DAY, { blk: NEW });                           // fit day 2 out of order, new app
  hist(b, 0, now - 2 * DAY, { blk: NEW });                           // fit day 1, new app
  b.run(`finishBlockWorkout(S,getBlock(${JSON.stringify(NEW)}))`);
  lim(b);
  assert.equal(b.J('lgDayLocked(0)'), 'done');
  assert.equal(b.J('lgDayLocked(1)'), 'done', 'fit record with its block id → done');
  assert.equal(b.J('lgDayLocked(2)'), 'unsure', 'old untagged record before fit day 1, after an earlier day 1 → unsure');
});

test('tf2.3.1: old data, first pass of one block, day done out of order before day 1, no earlier day 1 → still done (2.2 behaviour)', () => {
  const b = boot({ state: st() });
  assign(b, NEW, 0);
  hist(b, 2, now - 5 * DAY); hist(b, 0, now - 4 * DAY);
  b.run(`finishBlockWorkout(S,getBlock(${JSON.stringify(NEW)}))`);
  lim(b);
  assert.equal(b.J('lgDayLocked(2)'), 'done');
});

test('tf2.3.1: old data, another program fully finished before the switch → the new program is all upcoming, no question', () => {
  const b = boot({ state: st() });
  assign(b, OLD, 0);
  const n = b.run('S.program.length');
  for (let i = 0; i < n; i++) hist(b, i, now - 200 * DAY + i * DAY);
  assign(b, NEW, 0);
  lim(b);
  assert.equal(b.J('S.program.map((d,i)=>lgDayLocked(i)).filter(Boolean).length'), 0);
  assert.equal(b.J('lgAuditUnsure().length'), 0);
});

test('tf2.3.1 migration: saved old state → restart → day 1 of fit stays unsure; after «Повторить блок» / new block passAt is exact', () => {
  const b = boot({ state: st() });
  gpt(b);
  const b2 = boot({ ls: { gym: b.run(`localStorage.getItem('gym')`) } });
  assert.equal(b2.run('S.block.id'), NEW);
  assert.equal(b2.run('S.block.passAt'), undefined);
  assert.equal(b2.J('lgDayLocked(0)'), 'unsure');
  b2.run(`blockOnApplied({blockId:${JSON.stringify(NEW)}});save()`);
  assert.equal(b2.J('lgDayLocked(0)'), false);
});
