'use strict';
// tech-fix-1 UI RIR: rir_target of the block / phase is shown with the role of the exercise and the user's level;
// programs without the field fall back to PR_RIR of the level, now with the right role (accessory ≠ main lift).
const test = require('node:test');
const assert = require('node:assert/strict');
const { boot, DAY } = require('./fixtures/tf1-boot.js');

const now = Date.now();
function st(blockId, level, next) {
  return { lang: 'ru', goal: 'str', days: 5, next, prof: { goal: 'str', sex: 'm', level, days: 5, len: 90, place: 'g', prio: [], lim: [] },
    workouts: [], custom: [], body: [], pg: {}, pgSince: now - 20 * DAY, dlLast: now - 5 * DAY, block: { id: blockId, next } };
}
function rirAt(blockId, level, idx, exFilter) {
  const b = boot({ state: st(blockId, level, idx) });
  b.run(`S.program=planFromBlock(getBlock(${JSON.stringify(blockId)}),S.prof).days;save()`);
  b.run(`(()=>{const d=S.program[${idx}];const t=Date.now()-3*864e5;S.workouts.push({id:'h',start:t,end:t,dayIdx:${idx},dayName:'x',notes:'',items:d.items.filter(i=>!i.cardio).map(i=>({exId:i.exId,ns:i.sets,min:i.min,max:i.max,rest:i.rest,sets:[{w:50,r:i.max,done:true}]}))});
    d.items.forEach(i=>{if(!i.cardio)S.pg[i.exId]={st:{success:0,miss:0},next:{weight:50,sets:i.sets,target:i.min,note:'same'},first:t,last:t}});save()})()`);
  b.run(`startW(${idx})`);
  return b.J(`S.active.items.filter(i=>i.sug).map(i=>({ex:i.exId,role:awRole(i),rir:i.sug.rir,html:awSugHTML(i,0)}))`);
}

test('UI RIR: str_adv_5 orig-equipment — phase 1 → 2 → 3 for the main lift and an accessory (adv)', () => {
  const p1 = rirAt('str_adv_5_g_b35_voe', 'adv', 0), p2 = rirAt('str_adv_5_g_b35_voe', 'adv', 15), p3 = rirAt('str_adv_5_g_b35_voe', 'adv', 30);
  const main = L => L.find(x => x.role === 'c'), acc = L => L.find(x => x.role === 'a');
  assert.deepEqual(main(p1).rir, [2, 3]); assert.deepEqual(main(p2).rir, [1, 3]); assert.deepEqual(main(p3).rir, [1, 2]);
  assert.deepEqual(acc(p1).rir, [1, 3]); assert.deepEqual(acc(p2).rir, [1, 2]); assert.deepEqual(acc(p3).rir, [1, 2]);
  assert.match(main(p3).html, /Запас<\/span> 1–2 <span>повт\./);
});

test('UI RIR: phase boundary — last workout of phase 1 (n15) vs first of phase 2 (n16)', () => {
  const a = rirAt('str_adv_5_g_b35_voe', 'adv', 14), c = rirAt('str_adv_5_g_b35_voe', 'adv', 15);
  assert.deepEqual(a.find(x => x.role === 'c').rir, [2, 3]);
  assert.deepEqual(c.find(x => x.role === 'c').rir, [1, 3]);
});

test('UI RIR: deload week of the block → +2 on the phase target', () => {
  const d = rirAt('str_adv_5_g_b35_voe', 'adv', 25);
  assert.deepEqual(d.find(x => x.role === 'c').rir, [3, 4]); // n26 is in phase 3: c [1,2] + 2
});

test('UI RIR: level floor — a novice on an advanced block never gets less than 2 in reserve', () => {
  const p3 = rirAt('str_adv_5_g_b35_voe', 'nov', 30);
  for (const x of p3) assert.ok(x.rir[0] >= 2, x.ex + ' ' + x.rir);
});

test('UI RIR: block without rir_target (original) → PR_RIR of the level with the right role (adv accessory 0–2, main 2–3)', () => {
  const L = rirAt('str_adv_5_g_b35', 'adv', 0);
  assert.deepEqual(L.find(x => x.role === 'c').rir, [2, 3]);
  assert.deepEqual(L.find(x => x.role === 'a').rir, [0, 2]);
  const M = rirAt('mass_nov_3_g_b36', 'mid', 0);
  assert.ok(M.some(x => x.role === 'a' && x.rir[0] === 1 && x.rir[1] === 3));
});

test('UI RIR: roles — main multi-joint lifts c, single-joint / arms / abs a; JSON role wins', () => {
  const b = boot();
  const r = b.J(`['bp','smith-squat','rdl','pull','lc','lr','dbc','tpd','mk-front-plank','cgb','fly','calf'].map(id=>blockRole({exId:id})).join('')`);
  assert.equal(r, 'ccccaaaaacaa');
  assert.equal(b.run(`blockRole({exId:'bp',role:'a'})`), 'a');
});

test('UI RIR: blockRirTarget picks the phase by workout number; invalid values are ignored', () => {
  const b = boot();
  const r = b.J(`(()=>{const B={rir_target:{c:[2,3],a:[1,3]},phases:[{workouts:[1,10],rir_target:{c:[3,4],a:[2,3]}},{workouts:[11,20],rir_target:{c:['x',1],a:[1]}}]};
    return[blockRirTarget(B,{n:5}),blockRirTarget(B,{n:12}),blockRirTarget({},{n:1})]})()`);
  assert.deepEqual(r, [{ c: [3, 4], a: [2, 3] }, { c: [2, 3], a: [1, 3] }, null]);
});

test('UI RIR: without auto-weight the target reserve is still shown on the card', () => {
  const b = boot({ state: st('str_adv_5_g_b35_voe', 'adv', 30) });
  b.run(`S.program=planFromBlock(getBlock('str_adv_5_g_b35_voe'),S.prof).days;S.autoW=false;save()`);
  b.run("localStorage.setItem(PREM_DEMO_KEY,'free')");
  assert.equal(b.run('awOn()'), false);
  b.run('startW(30)');
  const L = b.J(`S.active.items.filter(i=>!isCardio(i.exId)).map(i=>({rs:i.rirShow,html:awSugHTML(i,0)}))`);
  assert.ok(L.length > 0);
  assert.deepEqual(L[0].rs, [1, 2]);
  assert.match(L[0].html, /Запас<\/span> 1–2/);
});
