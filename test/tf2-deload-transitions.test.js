'use strict';
// tech-fix-2 P2: awDeload(noSchedule) — an active calendar deload is closed when the program block has its own deloads
// (no calendar + block deload overlap); block → block transitions; the manual early deload (button) stays.
const test = require('node:test');
const assert = require('node:assert/strict');
const { boot, DAY } = require('./fixtures/tf1-boot.js');

const now = Date.now();
function st(level, goal) {
  return { lang: 'ru', goal: goal || 'str', days: 5, next: 0, prof: { goal: goal || 'str', sex: 'm', level: level || 'adv', days: 5, len: 90, place: 'g', prio: [], lim: [] },
    workouts: [{ id: 'old', start: now - 40 * DAY, end: now - 40 * DAY + 3600e3, dayIdx: 0, dayName: 'x', notes: '', items: [] }], custom: [], body: [], pg: {}, pgSince: now - 36 * DAY };
}
function toBlock(b, id, next) { b.run(`S.block={id:${JSON.stringify(id)},next:${next}};S.program=planFromBlock(getBlock(${JSON.stringify(id)}),S.prof).days;S.next=${next};save()`); }
function seed(b, idx) {
  b.run(`(()=>{const d=S.program[${idx}];const t=Date.now()-3*864e5;S.workouts.push({id:'h${idx}',start:t,end:t+3600e3,dayIdx:${idx},dayName:d.name,notes:'',
    items:d.items.filter(i=>!i.cardio).map(i=>({exId:i.exId,ns:i.sets,min:i.min,max:i.max,rest:i.rest,sets:Array.from({length:i.sets},()=>({w:100,r:i.max,done:true}))}))});
    d.items.filter(i=>!i.cardio).forEach(i=>{S.pg[i.exId]={st:{success:1,miss:0},next:{weight:100,sets:i.sets,target:i.max,note:'top1'},first:t-30*864e5,last:t}});save()})()`);
}
const sets = b => b.J('S.active.items.filter(i=>i.sug&&!i.sug.cal).map(i=>[i.sets.length,i.ns])');

test('tf2 awDeload: calendar deload started under a plan without deloads → switch to a block with its own deloads → closed, no overlap', () => {
  const b = boot({ state: st('adv', 'loss') });
  toBlock(b, 'loss_nov_4_g_b36', 2); seed(b, 2);
  b.run('S.dlLast=0;S.dl=null;startW(2)');
  assert.equal(b.run('S.active.dl'), 'scheduled', 'calendar deload under the block without own deloads');
  b.run('S.active=null;S.prof.goal="str";save()');
  toBlock(b, 'str_adv_5_g_b35', 3); seed(b, 3);
  b.run('startW(3)');
  assert.equal(b.run('S.active.dl'), null, 'regular block workout is not a deload');
  assert.equal(b.run('!!S.dl'), false);
  assert.equal(b.run('S.dlEnded.why'), 'block');
  for (const [n, ns] of sets(b)) assert.equal(n, ns, 'sets not halved');
});

test('tf2 awDeload: calendar deload active + block deload workout → only the block deload (sets as in the block)', () => {
  const b = boot({ state: st('adv') });
  toBlock(b, 'str_adv_5_g_b35', 25); seed(b, 25);
  b.run('S.dl={type:"scheduled",start:Date.now()-2*864e5};S.dlLast=S.dl.start;save();startW(25)');
  assert.equal(b.run('S.active.dl'), 'block');
  assert.equal(b.run('!!S.dl'), false, 'calendar deload closed');
  for (const [n, ns] of sets(b)) assert.equal(n, ns);
});

test('tf2 awDeload: back to a block without own deloads — the calendar does not restart right after the closed deload', () => {
  const b = boot({ state: st('adv', 'loss') });
  toBlock(b, 'str_adv_5_g_b35', 3); seed(b, 3);
  b.run('S.dl={type:"scheduled",start:Date.now()-2*864e5};S.dlLast=S.dl.start;save();startW(3)');
  assert.equal(b.run('S.active.dl'), null);
  b.run('S.active=null;save()');
  toBlock(b, 'loss_nov_4_g_b36', 2); seed(b, 2);
  b.run('startW(2)');
  assert.equal(b.run('S.active.dl'), null, 'next calendar deload counts from the last one (S.dlLast), not now');
  b.run('S.active=null;S.dlLast=Date.now()-36*864e5;save();startW(2)');
  assert.equal(b.run('S.active.dl'), 'scheduled', 'and returns on schedule');
});

test('tf2 awDeload: manual early deload stays inside a block with own deloads; on the block deload day only the block deload applies', () => {
  const b = boot({ state: st('adv') });
  toBlock(b, 'str_adv_5_g_b35', 3); seed(b, 3);
  b.run('S.dl={type:"early",start:Date.now()-1*864e5};S.dlLast=S.dl.start;save();startW(3)');
  assert.equal(b.run('S.active.dl'), 'early');
  assert.equal(b.run('S.dl.type'), 'early');
  b.run('S.active=null;save()');
  toBlock(b, 'str_adv_5_g_b35', 25); seed(b, 25);
  b.run('startW(25)');
  assert.equal(b.run('S.active.dl'), 'block');
  for (const [n, ns] of sets(b)) assert.equal(n, ns, 'no second cut on top of the block deload');
});

test('tf2 awDeload: the «Начать разгрузку» button is still offered in a block with own deloads (novice, no sets done)', () => {
  const b = boot({ state: st('nov') });
  toBlock(b, 'str_adv_5_g_b35', 3); seed(b, 3);
  b.run('S.dl=null;startW(3)');
  b.run(`globalThis.__ins='';app.querySelector=s=>s==='[data-rm]'?{closest:()=>({insertAdjacentHTML:(p,h)=>{globalThis.__ins+=h},querySelector:()=>null})}:null;awDecorate()`);
  assert.match(b.run('__ins'), /id="awdl"/);
  // tap = the same code as the button
  b.run(`S.dl={type:'early',start:Date.now()};S.dlLast=S.dl.start;S.active.dl='early';S.active.items.forEach(it=>awApply(it,'early'))`);
  assert.equal(b.run('S.active.dl'), 'early');
});
