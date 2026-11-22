'use strict';
// tech-fix-1 GC-07 + awDeload: deload workouts of the block are deloads for auto-weight (no double cut of sets),
// their results never change progression; blocks with their own deloads get no calendar deload on top.
const test = require('node:test');
const assert = require('node:assert/strict');
const { boot, DAY } = require('./fixtures/tf1-boot.js');

const now = Date.now();
function blockState(blockId, next, level, extra) {
  return Object.assign({ lang: 'ru', goal: 'str', days: 5, next, prof: { goal: 'str', sex: 'm', level: level || 'adv', days: 5, len: 90, place: 'g', prio: [], lim: [] },
    workouts: [], custom: [], body: [], pg: {}, pgSince: now - 40 * DAY, block: { id: blockId, next } }, extra || {});
}
function bootBlock(blockId, next, level, extra, gen) {
  const b = boot({ state: blockState(blockId, next, level, extra) });
  b.run(`S.program=${gen || 'planFromBlock'}(getBlock(${JSON.stringify(blockId)}),S.prof).days;save()`);
  return b;
}
// history with one earlier workout of every exercise of day idx (weight 100, all reps at the top) → auto-weight has a state
function seedHistory(b, idx, daysAgo) {
  b.run(`(()=>{const d=S.program[${idx}];const t=Date.now()-${daysAgo}*864e5;S.workouts.push({id:'h${idx}',start:t,end:t+3600e3,dayIdx:${idx},dayName:d.name,notes:'',
    items:d.items.filter(i=>!i.cardio).map(i=>({exId:i.exId,ns:i.sets,min:i.min,max:i.max,rest:i.rest,sets:Array.from({length:i.sets},()=>({w:100,r:i.max,done:true}))}))});
    d.items.filter(i=>!i.cardio).forEach(i=>{S.pg[i.exId]={st:{success:1,miss:0},next:{weight:100,sets:i.sets,target:i.max,note:'top1'},first:t-30*864e5,last:t}});save()})()`);
}
function finishActive(b, repsOf) {
  b.run(`(()=>{const A=S.active;A.items.forEach(it=>it.sets.forEach(s=>{s.w=s.w===''?100:s.w;s.r=(${repsOf})(it);s.done=true}));A.end=Date.now();S.workouts.push(A);awFinish(A);S.active=null;save()})()`);
}

test('GC-07: deload workout of the block → dl=block, sets as in the block (not halved again), RIR +2', () => {
  const b = bootBlock('str_adv_5_g_b35', 25);
  seedHistory(b, 25, 40); // same exercises, earlier
  b.run('S.dlLast=Date.now()-10*864e5');
  b.run('startW(25)');
  const A = b.J('{dl:S.active.dl,items:S.active.items.map(i=>({ex:i.exId,n:i.sets.length,ns:i.ns,sug:i.sug}))}');
  assert.equal(A.dl, 'block');
  for (const it of A.items) {
    if (!it.sug) continue;
    assert.equal(it.n, it.ns, it.ex + ': sets = block sets');
    assert.equal(it.sug.note, 'deload_block');
    assert.equal(it.sug.dl, 'block');
  }
  const main = A.items[0];
  assert.equal(main.n, 3); // ceil(5/2) in the block JSON, not ceil(3/2)=2
  assert.deepEqual(main.sug.rir, [4, 5]); // adv main [2,3] + 2
});

test('GC-07: results of a block deload do not add weight or count misses; first workout after → misses not counted', () => {
  const b = bootBlock('str_adv_5_g_b35', 25);
  seedHistory(b, 25, 40);
  b.run('S.dlLast=Date.now()-10*864e5');
  const before = b.J('S.pg');
  b.run('startW(25)');
  finishActive(b, 'it=>it.max'); // all reps = min = max → was «top» → weight up twice in a row before the fix
  const id = b.J('S.workouts[S.workouts.length-1].items[0].exId');
  b.run('startW(25)');
  finishActive(b, 'it=>it.max');
  const after = b.J('S.pg');
  assert.deepEqual(after[id].st, before[id].st);
  assert.deepEqual(after[id].next, before[id].next);
  assert.equal(after[id].afterDl, 1);
  // next normal workout of the same exercise with a miss → after_deload: no miss counted
  b.run('S.block.next=30;startW(30)');
  const ex = b.J('S.active.items.map(i=>i.exId)');
  assert.ok(ex.includes(id));
  assert.equal(b.J(`S.active.items.find(i=>i.exId==='${id}').sug.after`), 1);
  finishActive(b, 'it=>Math.max(1,it.min-1)');
  assert.equal(b.J(`S.pg['${id}'].st.miss|0`), 0);
  assert.equal(b.run(`S.pg['${id}'].afterDl===undefined`), true);
});

test('GC-07: plans saved before the fix (no day.deload) still get dl=block from the block file', () => {
  const b = boot({ state: blockState('str_adv_5_g_b35', 25) });
  b.run(`S.program=planFromBlock(getBlock('str_adv_5_g_b35'),S.prof).days.map(d=>{const x=Object.assign({},d);delete x.deload;delete x.rirTarget;return x});S.dlLast=Date.now()-10*864e5;save()`);
  b.run('startW(25)');
  assert.equal(b.J('S.active.dl'), 'block');
});

test('awDeload: block with its own deloads — no calendar deload on top (36 days since start, adv)', () => {
  const b = bootBlock('str_adv_5_g_b35', 3);
  seedHistory(b, 3, 3);
  b.run('S.pgSince=Date.now()-36*864e5;S.dlLast=0;S.dl=null;S.workouts.unshift({id:"old",start:Date.now()-40*864e5,end:0,dayIdx:0,dayName:"x",notes:"",items:[]})');
  b.run('startW(3)');
  assert.equal(b.J('S.active.dl'), null);
  assert.equal(b.J('S.dl||null'), null);
  assert.equal(b.J('S.active.items[0].sets.length'), b.J('S.program[3].items[0].sets'));
});

test('awDeload: block without deloads keeps the calendar deload (regression), halving as before', () => {
  const b = bootBlock('loss_nov_4_g_b36', 2, 'adv', { goal: 'loss' });
  seedHistory(b, 2, 3);
  b.run('S.pgSince=Date.now()-36*864e5;S.dlLast=0;S.dl=null;S.workouts.unshift({id:"old",start:Date.now()-40*864e5,end:0,dayIdx:0,dayName:"x",notes:"",items:[]})');
  b.run('startW(2)');
  assert.equal(b.J('S.active.dl'), 'scheduled');
  const it = b.J('S.active.items.find(i=>i.sug&&!i.sug.cal)');
  assert.equal(it.sets.length, Math.ceil(it.ns / 2));
});

test('awDeload: manual early deload still works inside a block that has its own deloads', () => {
  const b = bootBlock('str_adv_5_g_b35', 3);
  seedHistory(b, 3, 3);
  b.run('S.dl={type:"early",start:Date.now()};S.dlLast=S.dl.start');
  b.run('startW(3)');
  assert.equal(b.J('S.active.dl'), 'early');
});

test('GC-07: prNext ctx.deload=block — sets not halved; scheduled still halves (unit)', () => {
  const b = boot();
  const e = b.J('awEq()');
  const pn = inp => b.J(`prNext(${JSON.stringify(inp)},${JSON.stringify(e)})`);
  const blk = pn({ id: 'bp', level: 'adv', range: [3, 3], sets_plan: 3, weight: 100, state: {}, flags: [], ctx: { deload: 'block' } });
  assert.equal(blk.sets, 3); assert.equal(blk.note, 'deload_block'); assert.equal(blk.weight, 100); assert.deepEqual(blk.rir, [4, 5]);
  const sch = pn({ id: 'bp', level: 'adv', range: [3, 6], sets_plan: 5, weight: 100, state: {}, flags: [], ctx: { deload: 'scheduled' } });
  assert.equal(sch.sets, 3); assert.equal(sch.note, 'deload_scheduled');
});

test('GC-07: without auto-weight (sug = null) a block deload still does not change progression', () => {
  const b = bootBlock('str_adv_5_g_b35', 25);
  seedHistory(b, 25, 40);
  b.run('S.dlLast=Date.now()-10*864e5;S.autoW=false');
  const before = b.J('S.pg');
  b.run('startW(25)');
  b.run('S.active.items.forEach(it=>{it.sug=null})');
  finishActive(b, 'it=>it.max');
  const id = b.J('S.workouts[S.workouts.length-1].items[0].exId');
  assert.deepEqual(b.J(`S.pg['${id}'].st`), before[id].st);
});
