'use strict';
// tech-fix-2.1: workout duration after limitation swaps / removals (before: est_min of the block was shown unchanged)
// and the RIR line for cardio (checked: no RIR for cardio, time-based work keeps none either).
const test = require('node:test');
const assert = require('node:assert/strict');
const { boot, DAY } = require('./fixtures/tf1-boot.js');

const now = Date.now();
function st(lim) {
  return { lang: 'ru', goal: 'loss', days: 3, next: 0, prof: { goal: 'loss', sex: 'f', level: 'nov', days: 3, len: 60, place: 'b', bar: '1', prio: [], lim: lim || [] },
    workouts: [], custom: [], body: [], pg: {}, pgSince: now - 40 * DAY };
}
const BID = 'fit_nov_3_b_bar_b36';

test('tf2.1 duration: without limitations the minutes are est_min of the block, as before', () => {
  const b = boot({ state: st() });
  const r = b.J(`planFromBlock(getBlock('${BID}'),{goal:'loss',level:'nov',days:3,place:'b',bar:'1',lim:[]}).days.map(d=>[d.est,dayMin(d)])`);
  assert.ok(r.length > 0);
  r.forEach(([e, m]) => assert.equal(m, Math.round(e)));
});

test('tf2.1 duration: an exercise removed for the limitation shortens the shown minutes (by its sets × (40 s + rest))', () => {
  const b = boot({ state: st(['k']) });
  const r = b.J(`(()=>{const B=getBlock('${BID}');const P=planFromBlock(B,{goal:'loss',level:'nov',days:3,place:'b',bar:'1',lim:['k']}).days;
    return P.map((d,i)=>{const w=B.workouts[i];const rm=(w.items||[]).map(itemFromBlock).reduce((t,x)=>t+itemTime(x),0)-d.items.reduce((t,x)=>t+itemTime(x),0);return{est:d.est,min:dayMin(d),rm:rm/60,removed:(d.limWarn||[]).some(x=>!x.to&&!x.part)}})})()`);
  const R = r.filter(x => x.removed);
  assert.ok(R.length > 0, 'the block has removals with knees');
  R.forEach(x => { assert.ok(x.min < Math.round(x.est), JSON.stringify(x)); assert.ok(Math.abs(x.min - (x.est - x.rm)) <= 1, JSON.stringify(x)) });
});

test('tf2.1 duration: an old saved plan (no est0) fixed later — the minutes follow the change (base from the block file)', () => {
  const b = boot({ state: st() });
  b.run(`S.block={id:'${BID}',next:0};S.program=planFromBlock(getBlock('${BID}'),{goal:'loss',level:'nov',days:3,place:'b',bar:'1',lim:[]}).days;S.program.forEach(d=>delete d.est0);S.prof.lim=['k'];save()`);
  const before = b.J('S.program.map(d=>dayMin(d))');
  b.run('lgFixAll()');
  const after = b.J('S.program.map(d=>[dayMin(d),(d.limWarn||[]).some(x=>!x.to&&!x.part),d.est])');
  after.forEach(([m, rm, e], i) => { if (rm) assert.ok(m < before[i], 'day ' + i); else assert.ok(Math.abs(m - Math.round(e)) <= 1) });
  assert.ok(after.some(x => x[1]));
});

test('tf2.1 RIR: cardio and time-based items never show «Запас … повт.»; strength items still do', () => {
  const b = boot({ state: st() });
  b.run(`S.program=[{name:'x',items:[{exId:'jump',sets:1,min:10,max:15,rest:0},{exId:'walk-brisk',sets:1,min:10,max:20,rest:0},{exId:'mk-treadmill-run',sets:1,min:10,max:20,rest:0},{exId:'mk-front-plank',sets:3,min:20,max:40,rest:60,sec:1},{exId:'gsq',sets:3,min:8,max:12,rest:90}]}];save();startW(0)`);
  const html = b.J('S.active.items.map((it,i)=>{awPrev(it);return [it.exId,it.rirShow||null,awSugHTML(it,i)]})');
  for (const [id, rir, h] of html.slice(0, 4)) { assert.equal(rir && id !== 'mk-front-plank' ? rir : null, null, id); assert.doesNotMatch(h, /Запас/, id) }
  assert.ok(html[4][1], 'gsq has an RIR target');
  assert.match(html[4][2], /Запас/);
});
