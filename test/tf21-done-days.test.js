'use strict';
// tech-fix-2.1 P1 (defect 2): «Заменить безопасными» changed finished days of the plan too.
// Now only upcoming days change: block plans use S.block.next and the real history (out-of-order days), plain plans the
// history of the current week (same rule as ✓ on the workouts tab); the open workout's day is not touched.
const test = require('node:test');
const assert = require('node:assert/strict');
const { boot, DAY } = require('./fixtures/tf1-boot.js');

const now = Date.now();
const BID = 'str_adv_5_g_b35';
function st() {
  return { lang: 'ru', goal: 'str', days: 5, next: 0, prof: { goal: 'str', sex: 'm', level: 'adv', days: 5, len: 90, place: 'g', prio: [], lim: [] },
    workouts: [], custom: [], body: [], pg: {}, pgSince: now - 40 * DAY };
}
function plan(b, next) {
  b.run(`S.block={id:${JSON.stringify(BID)},next:${next}};S.next=${next};S.program=planFromBlock(getBlock(${JSON.stringify(BID)}),{goal:'str',level:'adv',days:5,place:'g',lim:[]}).days;save()`);
}
function hist(b, i, ago) {
  b.run(`(()=>{const d=S.program[${i}];S.workouts.push({id:'h${i}_'+${ago},start:Date.now()-${ago},dayIdx:${i},dayName:d.name,n:d.n,notes:'',items:JSON.parse(JSON.stringify(d.items)).map(it=>({exId:it.exId,ns:it.sets,sets:[{w:50,r:5,done:true}]}))})})()`);
}
const snap = (b, i) => b.run(`JSON.stringify(S.program[${i}])`);
const risky = (b, i) => b.run(`S.program[${i}].items.some(x=>blockLimConf(x.exId,{lim:S.prof.lim}).length&&!x.limAck)`);

test('tf2.1 done days: block — days before S.block.next are not changed by «Заменить безопасными»; upcoming days are fixed', () => {
  const b = boot({ state: st() });
  plan(b, 6);
  for (let i = 0; i < 6; i++) hist(b, i, (7 - i) * DAY);
  b.run(`S.prof.lim=['k'];save()`);
  const before = [0, 1, 2, 3, 4, 5].map(i => snap(b, i));
  assert.ok([0, 1, 2, 3, 4, 5].some(i => risky(b, i)), 'finished days do contain knee-risky exercises');
  const H = b.run('JSON.stringify(S.workouts)');
  const P = b.J('lgAuditPlan().map(x=>x.d)');
  assert.ok(P.length > 0 && P.every(d => d >= 6), 'the check lists upcoming days only: ' + P.join(','));
  b.run('lgFixAll()');
  [0, 1, 2, 3, 4, 5].forEach((i, k) => assert.equal(snap(b, i), before[k], 'finished day ' + i + ' unchanged'));
  assert.equal(b.run('JSON.stringify(S.workouts)'), H, 'history unchanged');
  const n = b.run('S.program.length');
  for (let i = 6; i < n; i++) assert.equal(risky(b, i), false, 'upcoming day ' + i + ' fixed');
  assert.deepEqual(b.J('lgAuditPlan()'), []);
  b.run('lgKeepAll()');
  [0, 1, 2, 3, 4, 5].forEach((i, k) => assert.equal(snap(b, i), before[k], 'keep-all does not touch finished days either'));
});

test('tf2.1 done days: skipped / moved (S.block.dueOn) day stays upcoming and is fixed; a day done out of order is kept', () => {
  const b = boot({ state: st() });
  plan(b, 2);
  hist(b, 0, 5 * DAY); hist(b, 1, 3 * DAY);
  b.run(`skipBlockWorkout(S)`); // day 2 moved, S.block.next stays 2
  assert.equal(b.run('S.block.next'), 2);
  hist(b, 4, 1 * DAY); // day 5 (index 4) done out of order today-1, block.next not advanced
  b.run(`S.prof.lim=['k'];save()`);
  const d4 = snap(b, 4), d0 = snap(b, 0);
  const P = b.J('lgAuditPlan().map(x=>x.d)');
  assert.ok(!P.includes(0) && !P.includes(1) && !P.includes(4), P.join(','));
  b.run('lgFixAll()');
  assert.equal(snap(b, 4), d4, 'out-of-order finished day unchanged');
  assert.equal(snap(b, 0), d0);
  assert.equal(risky(b, 2), false, 'skipped / moved day 2 is upcoming → fixed');
});

test('tf2.1 done days: the day of the open workout (partly done) is not changed; the open workout is handled by its own card', () => {
  const b = boot({ state: st() });
  plan(b, 0);
  const di = b.J(`(()=>{S.prof.lim=['k'];const i=S.program.findIndex(d=>lgAuditDay(d));S.prof.lim=[];S.block.next=i;return i})()`);
  assert.ok(di >= 0);
  b.run(`startW(${di})`); // no limitation yet → starts directly
  assert.ok(b.run('!!S.active'));
  b.run(`S.active.items[0].sets[0].done=true;S.prof.lim=['k'];save()`);
  assert.ok(b.J(`lgAuditDay(S.program[${di}])`), 'the plan day has knee-risky exercises');
  const d0 = snap(b, di);
  b.run('lgFixAll()');
  assert.equal(snap(b, di), d0, 'day under the open workout unchanged');
  assert.ok(b.J('lgAuditPlan().every(x=>x.d!==' + di + ')'));
});

test('tf2.1 done days: repeating a finished day applies the fix to that workout only, the plan day stays as it was', () => {
  const b = boot({ state: st() });
  plan(b, 3);
  for (let i = 0; i < 3; i++) hist(b, i, (4 - i) * DAY);
  b.run(`S.prof.lim=['k'];save()`);
  const pick = b.J(`[0,1,2].find(i=>lgAuditDay(S.program[i]))`);
  assert.ok(pick != null);
  const d = snap(b, pick);
  b.run(`lgStartFix(${pick})`);
  assert.ok(b.run('!!S.active'));
  assert.equal(snap(b, pick), d, 'finished plan day unchanged');
  assert.equal(b.run(`S.active.items.some(x=>blockLimConf(x.exId,{lim:['k']}).length)`), false, 'the started workout is safe');
});

test('tf2.1 done days: plain (old generator, cyclic S.next) plan — days are templates of coming sessions: fixed, history copy kept; old data without fields works', () => {
  const b = boot({ state: st() });
  b.run(`S.program=[{name:'A',items:[{exId:'sq',sets:3,min:5,max:8,rest:120}]},{name:'B',items:[{exId:'lp',sets:3,min:8,max:12,rest:90}]},{name:'C',items:[{exId:'bss',sets:3,min:8,max:12,rest:90}]}];
    delete S.block;S.next=1;S.workouts=[{id:'o1',start:Date.now()-2*864e5,dayIdx:0,dayName:'A',items:[{exId:'sq',sets:[{w:60,r:5,done:true}]}]},{id:'o0',start:Date.now()-20*864e5,dayIdx:1,dayName:'B',items:[]},{id:'x',start:Date.now()-864e5,items:[]}];
    S.prof.lim=['k'];save()`);
  const H = b.run('JSON.stringify(S.workouts)');
  assert.deepEqual(b.J('lgAuditPlan().map(x=>x.d)'), [0, 1, 2]);
  b.run('lgFixAll()');
  assert.equal(b.run('JSON.stringify(S.workouts)'), H, 'history (the done session of A) unchanged');
  assert.equal(b.J('S.workouts[0].items[0].exId'), 'sq');
  [0, 1, 2].forEach(i => assert.equal(risky(b, i), false));
});

test('tf2.1 done days: plain plan with an open workout — its day is not changed, the other days are', () => {
  const b = boot({ state: st() });
  b.run(`S.program=[{name:'A',items:[{exId:'sq',sets:3,min:5,max:8,rest:120}]},{name:'B',items:[{exId:'lp',sets:3,min:8,max:12,rest:90}]}];delete S.block;
    S.active={id:'a',start:Date.now(),dayIdx:1,dayName:'B',notes:'',items:[{exId:'lp',ns:3,min:8,max:12,rest:90,sets:[{w:50,r:10,done:true},{w:50,r:10,done:false}]}]};S.prof.lim=['k'];save()`);
  const B = snap(b, 1);
  assert.deepEqual(b.J('lgAuditPlan().map(x=>x.d)'), [0]);
  b.run('lgFixAll()');
  assert.equal(snap(b, 1), B);
  assert.equal(risky(b, 0), false);
  assert.deepEqual(b.J('S.active.items[0].sets[0]'), { w: 50, r: 10, done: true });
});
