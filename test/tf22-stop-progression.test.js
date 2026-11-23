'use strict';
// tech-fix-2.2 (defect 1): an exercise stopped / split because of a limitation went into prNext as an incomplete workout
// (2 of 4 planned sets) → counted as a miss. Rule now:
//  · the source exercise (stopped, or split — remaining sets moved out): done sets and weights stay in history,
//    S.pg[source] is not changed at all (no success, no miss, previous successes kept);
//  · the replacement exercise (limFrom): own progression by its own exId and its own sets (sets_plan = moved sets),
//    only when all its sets are done; a replacement left incomplete is neutral too (S.pg[replacement] unchanged).
//  · without a limitation stop nothing changes: an ordinary incomplete exercise is handled by prNext as before.
const test = require('node:test');
const assert = require('node:assert/strict');
const { boot, DAY } = require('./fixtures/tf1-boot.js');

const now = Date.now();
const PG = { sq: { st: { success: 1, miss: 0 }, next: { weight: 80, sets: 4, target: 5, note: 'top1' }, first: now - 30 * DAY, last: now - 3 * DAY } };
function st() {
  return { lang: 'ru', goal: 'str', days: 3, next: 0, prof: { goal: 'str', sex: 'm', level: 'mid', days: 3, len: 60, place: 'g', prio: [], lim: ['k'] },
    workouts: [], custom: [], body: [], pg: JSON.parse(JSON.stringify(PG)), pgSince: now - 40 * DAY };
}
// plan 4 sets, 2 done at the top of the range, then the limitation card
function open(b) {
  b.run(`startTimer=()=>{};S.program=[{name:'x',items:[{exId:'sq',sets:4,min:5,max:8,rest:120}]}];
    S.active={id:'a1',start:Date.now(),dayIdx:0,dayName:'x',notes:'',items:[
      {exId:'sq',ns:4,min:5,max:8,rest:120,sets:[{w:80,r:8,done:true},{w:80,r:8,done:true},{w:80,r:8,done:false},{w:80,r:8,done:false}]}]};save()`);
}
// the real «Завершить» of the app: saved items keep only the done sets, then awFinish (autow.js wrapper of #fin)
const finish = b => { b.run(`go('today');$('#fin').onclick()`); assert.equal(b.run('!!S.active'), false, 'workout finished'); };

test('tf2.2 stop: «4 planned, 2 done at the top, stop» — S.pg of the exercise unchanged (no miss, success kept); history keeps 2 sets', () => {
  const b = boot({ state: st() });
  open(b);
  b.run(`lgActiveFix(0,'stop')`);
  finish(b);
  assert.deepEqual(b.J('S.pg.sq'), PG.sq);
  assert.deepEqual(b.J('S.workouts[0].items[0].sets'), [{ w: 80, r: 8, done: true }, { w: 80, r: 8, done: true }]);
  assert.equal(b.J('S.workouts[0].items[0].exId'), 'sq');
});

test('tf2.2 stop: control — the same 2 of 4 without a limitation stop still goes through the usual rules (S.pg changes)', () => {
  const b = boot({ state: st() });
  open(b);
  b.run(`S.active.items[0].sets.splice(2,2)`);
  finish(b);
  assert.notDeepEqual(b.J('S.pg.sq'), PG.sq);
});

test('tf2.2 split: source unchanged; the replacement gets its own S.pg from its own sets (all done)', () => {
  const b = boot({ state: st() });
  open(b);
  const to = b.J('lgAuditActive()[0].to');
  assert.ok(to);
  b.run(`lgActiveFix(0,'split');S.active.items[1].sets.forEach(s=>{s.w=20;s.r=12;s.done=true})`);
  finish(b);
  assert.deepEqual(b.J('S.pg.sq'), PG.sq, 'source exercise neutral');
  const p = b.J(`S.pg[${JSON.stringify(to)}]||null`);
  if (b.run(`!!awCls(${JSON.stringify(to)})`)) {
    assert.ok(p && p.next, 'replacement has its own progression entry');
    assert.equal(p.next.sets, 2, 'planned sets of the replacement = moved sets');
  }
  assert.equal(b.J(`Object.keys(S.pg).filter(k=>k!=='sq'&&k!==${JSON.stringify(to)})`).length, 0, 'nothing else touched');
});

test('tf2.2 split: replacement left incomplete (1 of 2) → neutral for both exercises', () => {
  const b = boot({ state: st() });
  b.run(`S.pg['mk-dumbbell-step-up-low']={st:{success:1,miss:1},next:{weight:12,sets:3,target:8},first:1,last:2}`);
  open(b);
  b.run(`lgActiveFix(0,'split')`);
  const to = b.J('S.active.items[1].exId');
  const before = b.J(`S.pg[${JSON.stringify(to)}]||null`);
  b.run(`S.active.items[1].sets[0].w=12;S.active.items[1].sets[0].r=8;S.active.items[1].sets[0].done=true`);
  finish(b);
  assert.deepEqual(b.J('S.pg.sq'), PG.sq);
  assert.deepEqual(b.J(`S.pg[${JSON.stringify(to)}]||null`), before);
  assert.deepEqual(b.J('S.workouts[0].items[1].sets.map(s=>s.done)'), [true], 'the done set is in history');
});

test('tf2.2 stop / split survive a reload: saved S → new start of the app → finish → S.pg still neutral', () => {
  const b = boot({ state: st() });
  open(b);
  b.run(`lgActiveFix(0,'stop')`);
  const saved = JSON.parse(b.run(`localStorage.getItem('gym')`));
  const b2 = boot({ state: saved });
  assert.equal(b2.J('S.active.items[0].limStop'), 1);
  b2.run('startTimer=()=>{}');
  finish(b2);
  assert.deepEqual(b2.J('S.pg.sq'), PG.sq);
  const b3 = boot({ state: st() });
  open(b3);
  b3.run(`lgActiveFix(0,'split')`);
  const s3 = JSON.parse(b3.run(`localStorage.getItem('gym')`));
  const b4 = boot({ state: s3 });
  assert.equal(b4.J('S.active.items[0].limStop'), 1);
  assert.equal(b4.J('S.active.items[1].limFrom'), 'sq');
  finish(b4);
  assert.deepEqual(b4.J('S.pg.sq'), PG.sq);
});
