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
// v155: with knees jump → walk-brisk at home (nothing removed in BID); removals are checked on a block that still drops exercises.
// v160: knee removals now give their sets to the safe exercise already in the day → removals are checked with shoulders (LIMR).
const BIDK = 'fit_mid_4_b_bar_b36';
const LIMR = ['p'];

test('tf2.1 duration: without limitations the minutes are est_min of the block, as before', () => {
  const b = boot({ state: st() });
  const r = b.J(`planFromBlock(getBlock('${BID}'),{goal:'loss',level:'nov',days:3,place:'b',bar:'1',lim:[]}).days.map(d=>[d.est,dayMin(d)])`);
  assert.ok(r.length > 0);
  r.forEach(([e, m]) => assert.equal(m, Math.round(e)));
});

test('tf2.1 duration: a limitation change (removal or v160 sets added to the safe exercise) — shown minutes follow the items', () => {
  for (const lim of [['k'], ['p'], ['s', 'k', 'p']]) {
    const b = boot({ state: st(lim) });
    const r = b.J(`(()=>{const B=getBlock('${BIDK}');const P=planFromBlock(B,{goal:'loss',level:'mid',days:4,place:'b',bar:'1',lim:${JSON.stringify(lim)}}).days;
      return P.map((d,i)=>{const w=B.workouts[i];const rm=(w.items||[]).map(itemFromBlock).reduce((t,x)=>t+itemTime(x),0)-d.items.reduce((t,x)=>t+itemTime(x),0);return{est:d.est,min:dayMin(d),rm:rm/60,changed:(d.limWarn||[]).some(x=>!x.part)}})})()`);
    const R = r.filter(x => x.changed);
    assert.ok(R.length > 0, 'the block has changes with ' + lim);
    R.forEach(x => assert.ok(Math.abs(x.min - (x.est - x.rm)) <= 1, lim + ' ' + JSON.stringify(x)));
  }
});

test('tf2.1 duration: an old saved plan (no est0) fixed later — the minutes follow the change (base from the block file)', () => {
  const b = boot({ state: st() });
  b.run(`S.block={id:'${BIDK}',next:0};S.program=planFromBlock(getBlock('${BIDK}'),{goal:'loss',level:'mid',days:4,place:'b',bar:'1',lim:[]}).days;S.program.forEach(d=>delete d.est0);S.prof.lim=['k'];save()`);
  const before = b.J('S.program.map(d=>d.items.reduce((t,x)=>t+itemTime(x),0))');
  const m0 = b.J('S.program.map(d=>dayMin(d))');
  b.run('lgFixAll()');
  const after = b.J('S.program.map(d=>[dayMin(d),d.items.reduce((t,x)=>t+itemTime(x),0),(d.limWarn||[]).some(x=>!x.part)])');
  after.forEach(([m, t, ch], i) => { if (!ch) assert.ok(Math.abs(m - m0[i]) <= 1, 'day ' + i); else assert.ok(Math.abs(m - (m0[i] + (t - before[i]) / 60)) <= 1, 'day ' + i + ' ' + JSON.stringify([m, m0[i], t, before[i]])) });
  assert.ok(after.some(x => x[2]));
});
test('tf2.1 RIR: cardio and time-based items never show «Запас … повт.»; strength items still do', () => {
  const b = boot({ state: st() });
  b.run(`S.program=[{name:'x',items:[{exId:'jump',sets:1,min:10,max:15,rest:0},{exId:'walk-brisk',sets:1,min:10,max:20,rest:0},{exId:'mk-treadmill-run',sets:1,min:10,max:20,rest:0},{exId:'mk-front-plank',sets:3,min:20,max:40,rest:60,sec:1},{exId:'gsq',sets:3,min:8,max:12,rest:90}]}];save();startW(0)`);
  const html = b.J('S.active.items.map((it,i)=>{awPrev(it);return [it.exId,it.rirShow||null,awSugHTML(it,i)]})');
  for (const [id, rir, h] of html.slice(0, 4)) { assert.equal(rir && id !== 'mk-front-plank' ? rir : null, null, id); assert.doesNotMatch(h, /Запас/, id) }
  assert.ok(html[4][1], 'gsq has an RIR target');
  assert.match(html[4][2], /Запас/);
});
