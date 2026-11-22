'use strict';
// tech-fix-1 GC-02 / GC-03: with a limitation (back s / knees k / shoulders p) no risky exercise stays in a block plan silently.
// Safe replacement (trainer ALT chain, available at the place, has a MoveKit clip) or the exercise is left out with a visible note.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { boot, root } = require('./fixtures/tf1-boot.js');

const LIMS = [['s'], ['k'], ['p'], ['s', 'k'], ['s', 'p'], ['k', 'p'], ['s', 'k', 'p']];
const PILOT = ['loss_nov_6_g_b36', 'loss_nov_4_g_b36', 'mass_nov_3_g_b36', 'str_adv_5_g_b35', 'loss_mid_4_g_pr_abs_b36',
  'loss_nov_6_g_b36_va', 'loss_nov_4_g_b36_vb', 'mass_nov_3_g_b36_v3', 'str_adv_5_g_b35_voe', 'str_adv_5_g_b35_vfree', 'loss_mid_4_g_pr_abs_b36_v3'];
const b = boot();
b.run(`globalThis.__prof=function(B,lim){const pl=String(B.place||'g');return{goal:B.goal,level:B.level,days:B.days_per_week,place:pl.startsWith('b')?'b':pl,bar:pl==='b_bar',sex:'m',lim}};
globalThis.__check=function(id,lim){const B=getBlock(id);const a=__prof(B,lim);const p=planFromBlock(B,a);const bad=[],silent=[],warn=[],empty=[];
  p.days.forEach((d,di)=>{const W=d.limWarn||[];warn.push(...W);
    d.items.forEach(it=>{if(!blockLimOk(it.exId,a)){bad.push(d.n+':'+it.exId);if(!W.some(w=>w.to===it.exId||w.from===it.exId))silent.push(d.n+':'+it.exId)}});
    if(!d.items.some(it=>!it.cardio))empty.push(d.n);
    W.forEach(w=>{if(w.to){const ok=eqAvail(w.to,a.place)&&blockHasClip(w.to)&&blockLimOk(w.to,a)&&(isCardio(w.from)?isCardio(w.to):((BLOCK_LIM_FALLBACK[w.from]||[]).includes(w.to)||eqSameMuscle(w.from,w.to)));if(!ok)bad.push('badswap '+w.from+'->'+w.to)}})});
  return{bad,silent,warn:warn.length,removed:warn.filter(w=>!w.to).length,empty}}`);

test('GC-02/03: pilot programs and their variants — no risky exercise left in the plan, every change has a note (all limitation sets)', () => {
  for (const id of PILOT) for (const lim of LIMS) {
    const r = b.J(`__check(${JSON.stringify(id)},${JSON.stringify(lim)})`);
    assert.deepEqual(r.bad, [], id + ' ' + lim.join(''));
    assert.deepEqual(r.silent, [], id + ' ' + lim.join(''));
    assert.deepEqual(r.empty, [], id + ' ' + lim.join('') + ': a day without strength exercises');
  }
});

test('GC-02: str_adv_5_g_b35 orig-equipment with knees — 0 silent risky positions (was 14), smith-squat gets a knee-safe swap with a clip', () => {
  const r = b.J(`(()=>{const B=getBlock('str_adv_5_g_b35_voe');const a=__prof(B,['k']);const p=planFromBlock(B,a);
    const all=p.days.flatMap(d=>d.items.map(i=>i.exId));const W=p.days.flatMap(d=>d.limWarn||[]);
    return{smith:all.filter(x=>x==='smith-squat').length,fsq:all.filter(x=>x==='fsq').length,sw:W.filter(w=>w.from==='smith-squat').map(w=>w.to),clip:W.filter(w=>w.to).every(w=>blockHasClip(w.to))}})()`);
  assert.equal(r.smith, 0);
  assert.equal(r.fsq, 0);
  assert.ok(r.sw.length >= 8, 'smith-squat positions are replaced: ' + r.sw.length);
  assert.ok(r.sw.every(x => x && x !== 'smith-squat'));
  assert.equal(r.clip, true);
});

test('GC-02: no safe replacement → the exercise is left out with a visible note (RU text), not kept silently', () => {
  const r = b.J(`(()=>{const W=[];const out=blockLimSwap([{exId:'jump',cardio:1,sets:1,min:10,max:12,rest:0},{exId:'pu',sets:3,min:8,max:12,rest:60}],{lim:['k'],place:'b',bar:false},W);
    return{out:out.map(i=>i.exId),W,html:blockLimWarnHTML({limWarn:W})}})()`);
  assert.deepEqual(r.out, ['pu']);
  assert.deepEqual(r.W, [{ from: 'jump', to: null, lim: ['k'] }]);
  assert.match(r.html, /Ограничение/);
  assert.match(r.html, /колени/);
  assert.match(r.html, /убрано из тренировки: безопасной замены нет/);
  assert.match(r.html, /посоветуйся с врачом или тренером/);
});

test('GC-02: swap note names both exercises; no note and no change without limitations', () => {
  const r = b.J(`(()=>{const W=[];const out=blockLimSwap([{exId:'smith-squat',sets:3,min:6,max:8,rest:120}],{lim:['k'],place:'g'},W);
    const W0=[];const same=blockLimSwap([{exId:'smith-squat',sets:3,min:6,max:8,rest:120}],{lim:[],place:'g'},W0);
    return{out:out[0],W,html:blockLimWarnHTML({limWarn:W}),same:same[0].exId,W0}})()`);
  assert.equal(r.out.swapped, 1);
  assert.equal(r.out.sets, 3);
  assert.notEqual(r.out.exId, 'smith-squat');
  assert.match(r.html, /Приседания в Смите/);
  assert.equal(r.same, 'smith-squat');
  assert.deepEqual(r.W0, []);
});

test('GC-02: all 244 blocks × 7 limitation sets — 0 silent risky positions, no day without strength exercises', () => {
  const ids = fs.readdirSync(path.join(root, 'data/blocks')).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5));
  assert.equal(ids.length, 244);
  let silent = 0, empty = 0, badswap = 0;
  for (const id of ids) for (const lim of LIMS) {
    const r = b.J(`__check(${JSON.stringify(id)},${JSON.stringify(lim)})`);
    silent += r.silent.length; empty += r.empty.length; badswap += r.bad.filter(x => x.startsWith('badswap')).length;
  }
  assert.equal(silent, 0);
  assert.equal(empty, 0);
  assert.equal(badswap, 0);
});

test('GC-02: without limitations the plan of every block is exactly the block (no swap, no note)', () => {
  const ids = fs.readdirSync(path.join(root, 'data/blocks')).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5));
  for (const id of ids) {
    const r = b.J(`(()=>{const B=getBlock(${JSON.stringify(id)});const p=planFromBlock(B,__prof(B,[]));
      return{eq:p.days.every((d,i)=>JSON.stringify(d.items)===JSON.stringify((B.workouts[i].items||[]).map(itemFromBlock))),warn:p.days.some(d=>d.limWarn)}})()`);
    assert.equal(r.eq, true, id);
    assert.equal(r.warn, false, id);
  }
});

test('GC-03: knees ≠ no cardio — treadmill run → non-impact cardio with a clip, same minutes; elliptical / bike stay', () => {
  const r = b.J(`(()=>{const W=[];const out=blockLimSwap([{exId:'mk-treadmill-run',cardio:1,sets:1,min:20,max:23,rest:0},{exId:'mk-elliptical',cardio:1,sets:1,min:10,max:12,rest:0},{exId:'mk-indoor-cycling-spin',cardio:1,sets:1,min:10,max:12,rest:0}],{lim:['k'],place:'g'},W);
    return{out,W,impact:['mk-treadmill-run','jump','jump-rope'].map(blockRisk),clip:blockHasClip(out[0].exId),isC:isCardio(out[0].exId)}})()`);
  assert.equal(r.out.length, 3);
  assert.notEqual(r.out[0].exId, 'mk-treadmill-run');
  assert.equal(r.out[0].cardio, 1);
  assert.equal(r.out[0].min, 20);
  assert.equal(r.out[0].max, 23);
  assert.equal(r.clip, true);
  assert.equal(r.isC, true);
  assert.equal(r.out[1].exId, 'mk-elliptical');
  assert.equal(r.out[2].exId, 'mk-indoor-cycling-spin');
  assert.deepEqual(r.impact.map(x => x.includes('k')), [true, true, true]);
  assert.equal(r.W.length, 1);
});

test('GC-03: back only → running stays (cardio is checked per activity, not banned); gym jumps with knees → non-impact', () => {
  const r = b.J(`(()=>{const a=blockLimSwap([{exId:'mk-treadmill-run',cardio:1,sets:1,min:20,max:23,rest:0}],{lim:['s'],place:'g'},[]);
    const W=[];const j=blockLimSwap([{exId:'jump',cardio:1,sets:1,min:10,max:12,rest:0}],{lim:['k'],place:'g'},W);
    return{a:a[0].exId,j:j.map(x=>x.exId),jr:j.length?blockRisk(j[0].exId):null,W}})()`);
  assert.equal(r.a, 'mk-treadmill-run');
  assert.equal(r.j.length, 1);
  assert.notEqual(r.j[0], 'jump');
  assert.equal(r.jr.includes('k'), false);
});
