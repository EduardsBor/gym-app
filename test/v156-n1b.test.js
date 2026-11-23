'use strict';
// v156 — N1b (Grok QA v154, P1): after a replacement the remaining sets (ns) were saved as S.pg[new].next.sets and the next
// ordinary workout with that exercise got 1–2 rows instead of the 3 of its plan («Цель 3 ×», rows 1). Rule now: the number of
// rows = the plan of the day (it.ns); only «2 misses in a row → one set less» (st.cut) shortens it, from this day's plan.
const test = require('node:test');
const assert = require('node:assert/strict');
const { boot } = require('./fixtures/tf1-boot.js');
const DAY = 864e5, now = Date.now();
const pgE = (w, sets, extra) => Object.assign({ st: { success: 0, miss: 0 }, next: { weight: w, sets, target: 10, note: 'same' }, first: now - 30 * DAY, last: now - 5 * DAY }, extra || {});

function app(state) {
  const b = boot({ state: Object.assign({ lang: 'ru', goal: 'mass', days: 3, next: 0, obDone: 1, weightAsked: 1, workouts: [], custom: [], body: [], pgSince: now - 10 * DAY,
    prof: { goal: 'mass', sex: 'm', level: 'mid', days: 3, len: 60, place: 'g', prio: [], lim: [] },
    pg: { bp: pgE(50, 3), 'smith-bench': pgE(40, 3), 'seated-calf': pgE(30, 1) },
    program: [{ name: 'A', items: [{ exId: 'bp', sets: 3, min: 8, max: 12, rest: 90 }, { exId: 'seated-calf', sets: 1, min: 10, max: 15, rest: 60 }] },
      { name: 'B', items: [{ exId: 'smith-bench', sets: 3, min: 8, max: 12, rest: 90 }, { exId: 'seated-calf', sets: 2, min: 10, max: 15, rest: 60 }] }] }, state || {}) });
  assert.deepEqual(b.failed, []);
  b.run('globalThis.confirm=()=>true;toast=()=>{};startTimer=()=>{}');
  return b;
}
const rows = (b, id) => b.run(`(S.active.items.find(x=>x.exId===${JSON.stringify(id)})||{sets:[]}).sets.length`);
const ns = (b, id) => b.run(`(S.active.items.find(x=>x.exId===${JSON.stringify(id)})||{}).ns`);
const finish = b => { b.run(`go('today');$('#fin').onclick()`); assert.equal(b.run('!!S.active'), false); };

test('N1b: Grok scenario — ⇄ after 2 of 3, finish; next day with the new exercise in its plan has 3 rows (was 1)', () => {
  const b = app();
  b.run('startW(0);workoutView();S.active.items[0].sets.forEach((s,k)=>{if(k<2){s.w=50;s.r=10;s.done=true}})');
  assert.equal(b.run('swapActiveItem(S.active,0,"smith-bench")'), 'split');
  b.run('workoutView()');
  assert.equal(rows(b, 'smith-bench'), 1, 'replacement in this workout: remaining set only (N1 unchanged)');
  b.run('S.active.items.forEach(it=>it.sets.forEach(s=>{if(!s.done){s.w=s.w||40;s.r=10;s.done=true}}))');
  finish(b);
  b.run('startW(1);workoutView()');
  assert.equal(ns(b, 'smith-bench'), 3);
  assert.equal(rows(b, 'smith-bench'), 3, 'plan of day B: 3 rows');
  assert.equal(b.run('S.active.items[0].sug.sets'), 3);
});

test('N1b: limitation split («Заменить остаток») — next plan workout of the replacement keeps its planned sets', () => {
  const b = boot({ state: { lang: 'ru', goal: 'str', days: 3, next: 0, workouts: [], custom: [], body: [], pgSince: now - 10 * DAY,
    prof: { goal: 'str', sex: 'm', level: 'mid', days: 3, len: 60, place: 'g', prio: [], lim: ['k'] },
    pg: { sq: pgE(80, 3), 'mk-dumbbell-step-up-low': pgE(12, 3) },
    program: [{ name: 'x', items: [{ exId: 'sq', sets: 3, min: 5, max: 8, rest: 120 }] }, { name: 'y', items: [{ exId: 'mk-dumbbell-step-up-low', sets: 3, min: 8, max: 12, rest: 90 }] }] } });
  b.run(`startTimer=()=>{};S.active={id:'a1',start:Date.now(),dayIdx:0,dayName:'x',notes:'',items:[{exId:'sq',ns:3,min:5,max:8,rest:120,
    sets:[{w:80,r:8,done:true},{w:80,r:8,done:true},{w:80,r:8,done:false}]}]};save()`);
  b.run(`lgActiveFix(0,'split');workoutView()`);
  const to = b.run('S.active.items[1].exId');
  assert.equal(rows(b, to), 1);
  b.run('S.active.items[1].sets.forEach(s=>{s.w=12;s.r=12;s.done=true})');
  finish(b);
  if (to === 'mk-dumbbell-step-up-low') {
    b.run('startW(1);workoutView()');
    assert.equal(rows(b, 'mk-dumbbell-step-up-low'), 3);
  } else {
    b.run(`S.program[1].items[0].exId=${JSON.stringify(to)};startW(1);workoutView()`);
    assert.equal(rows(b, to), 3);
  }
});

test('N1b: legacy data — next.sets=1 written by v153/v154 does not cut a 3-set plan', () => {
  const b = app({ pg: { bp: pgE(50, 1), 'smith-bench': pgE(40, 1), 'seated-calf': pgE(30, 1) } });
  b.run('startW(0);workoutView()');
  assert.equal(rows(b, 'bp'), 3);
  assert.equal(b.run('S.active.items[0].sug.weight'), 50, 'weight of the progression still used');
});

test('N1b: an exercise in two days with different plans (1 and 2 sets) follows the plan of the day', () => {
  const b = app();
  b.run('startW(0);workoutView()');
  assert.equal(rows(b, 'seated-calf'), 1);
  b.run('S.active=null;startW(1);workoutView()');
  assert.equal(rows(b, 'seated-calf'), 2);
  assert.equal(ns(b, 'seated-calf'), 2);
});

test('N1b: «2 misses → one set less» still works, counted from the plan of the day; then back to the plan', () => {
  const b = app({ pg: { bp: pgE(50, 2, { st: { success: 0, miss: 2, cut: 1 } }), 'smith-bench': pgE(40, 3), 'seated-calf': pgE(30, 1) } });
  b.run('startW(0);workoutView()');
  assert.equal(rows(b, 'bp'), 2, 'cut: 3 → 2');
  b.run('S.active.items[0].sets.forEach(s=>{s.w=50;s.r=12;s.done=true});S.active.items[1].sets.forEach(s=>{s.w=30;s.r=15;s.done=true})');
  finish(b);
  assert.equal(b.run('!!S.pg.bp.st.cut'), false, 'success clears the cut');
  b.run('startW(0);workoutView()');
  assert.equal(rows(b, 'bp'), 3);
});

test('N1b: all planned rows at the top → top1 (was «same» when a row was missing)', () => {
  const b = app({ pg: { bp: pgE(50, 2), 'smith-bench': pgE(40, 3), 'seated-calf': pgE(30, 1) } });
  b.run('startW(0);workoutView();S.active.items.forEach(it=>it.sets.forEach(s=>{s.w=it.exId==="bp"?50:30;s.r=it.max;s.done=true}))');
  finish(b);
  assert.equal(b.J('S.pg.bp').next.note, 'top1');
});

test('v156: cache version', () => {
  assert.match(require('./fixtures/tf1-boot.js').read('cache-ver.js'), /var SW_CACHE='moyzal-v156'/);
});
