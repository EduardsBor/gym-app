'use strict';
// tech-fix-2 P2: pilot variants — B (4 days) is not tied back to the 6-day base; frequency labels; A → B → A; questionnaire
// reopened; save / restore; S.days = S.prof.days = real workouts per week of the chosen block.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { boot, root } = require('./fixtures/tf1-boot.js');

const Q6 = { goal: 'loss', level: 'nov', days: 6, place: 'g', sex: 'm', lim: [], prio: [], len: 75 };
const Q4 = Object.assign({}, Q6, { days: 4 });
const pilot = extra => boot(Object.assign({ ls: { gc_pilot: '1' }, state: { lang: 'ru', workouts: [], custom: [], body: [], pg: {} } }, extra || {}));
// real workouts per week of a block file: workouts of week 1
const perWeek = b => { const w1 = b.workouts.filter(w => +w.week === 1).length; return w1 || b.days_per_week; };
function previewOf(b, a) {
  b.run(`preview({name:'Похудение',desc:'',a:${JSON.stringify(a)}},'catalog')`);
  return b.J(`({id:PV.gen.blockId,opts:PV.gen.variantOpts||[],base:PV.gen.variantBase,html:app.innerHTML,ask:PV.pr.a.days})`);
}
function pick(b, id) { b.run(`PV.pr.a=Object.assign({},PV.pr.a,{variant:${JSON.stringify(id)}});PV.gen=generate(PV.pr.a);renderPreview()`); return b.J(`({id:PV.gen.blockId,html:app.innerHTML,ask:PV.pr.a.days})`); }
function startPlan(b) { b.run(`globalThis.confirm=()=>true;$('#pstart').onclick()`); return b.J(`({days:S.days,pdays:S.prof.days,asked:S.prof.daysAsked,variant:S.prof.variant,block:S.block&&S.block.id,n:S.program.length})`); }

test('tf2 variants: home base of every variant = variant_of of its file; days = days_per_week = workouts per week', () => {
  const b = pilot();
  const of = b.J('BLOCK_VARIANT_OF'), days = b.J('BLOCK_VARIANT_DAYS');
  const dir = path.join(root, 'data/blocks/variants');
  for (const f of fs.readdirSync(dir)) {
    const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    assert.equal(of[j.id], j.variant_of, j.id);
    assert.equal(days[j.id], j.days_per_week, j.id);
    assert.equal(perWeek(j), j.days_per_week, j.id + ' real frequency');
  }
  assert.equal(of.loss_nov_4_g_b36_vb, 'loss_nov_4_g_b36', 'B is the 4-day program, not the 6-day one');
});

test('tf2 variants: 4 days asked → B only (no 6-day A offered), label 4×/нед, S.days = S.prof.days = 4', () => {
  const b = pilot();
  const p = previewOf(b, Q4);
  assert.equal(p.id, 'loss_nov_4_g_b36_vb');
  assert.deepEqual(p.opts, ['loss_nov_4_g_b36_vb']);
  assert.equal(p.opts.length, 1, 'no chooser with one option (renderPreview inserts it only for 2+)');
  assert.match(p.html, />4×\/нед</);
  const s = startPlan(b);
  assert.deepEqual([s.days, s.pdays, s.variant, s.block], [4, 4, 'loss_nov_4_g_b36_vb', 'loss_nov_4_g_b36_vb']);
});

test('tf2 variants: 6 days asked → B by default with A offered; the label shows the real 4×/нед, not 6', () => {
  const b = pilot();
  const p = previewOf(b, Q6);
  assert.equal(p.id, 'loss_nov_4_g_b36_vb');
  assert.equal(p.base, 'loss_nov_6_g_b36');
  assert.deepEqual(p.opts, ['loss_nov_4_g_b36_vb', 'loss_nov_6_g_b36_va']);
  assert.match(p.html, />4×\/нед</);
  assert.doesNotMatch(p.html, />6×\/нед</);
  assert.equal(p.ask, 6, 'the questionnaire answer is kept for the next choice');
});

test('tf2 variants: A → B → A in the preview; labels follow; start A → S.days 6, start B → 4', () => {
  const b = pilot();
  previewOf(b, Q6);
  let x = pick(b, 'loss_nov_6_g_b36_va');
  assert.equal(x.id, 'loss_nov_6_g_b36_va'); assert.match(x.html, />6×\/нед</); assert.equal(x.ask, 6);
  x = pick(b, 'loss_nov_4_g_b36_vb');
  assert.equal(x.id, 'loss_nov_4_g_b36_vb'); assert.match(x.html, />4×\/нед</); assert.equal(x.ask, 6);
  // the chooser is inserted with insertAdjacentHTML (not in the fake innerHTML): check its options and its markup
  assert.deepEqual(b.J('PV.gen.variantOpts'), ['loss_nov_4_g_b36_vb', 'loss_nov_6_g_b36_va'], 'A still offered after B');
  assert.match(b.run('blockVariantHTML(PV.gen)'), /data-bv="loss_nov_6_g_b36_va"/);
  x = pick(b, 'loss_nov_6_g_b36_va');
  assert.equal(x.id, 'loss_nov_6_g_b36_va');
  const sA = startPlan(b);
  assert.deepEqual([sA.days, sA.pdays, sA.variant, sA.block, sA.asked], [6, 6, 'loss_nov_6_g_b36_va', 'loss_nov_6_g_b36_va', 6]);
  const b2 = pilot();
  previewOf(b2, Q6);
  const sB = startPlan(b2);
  assert.deepEqual([sB.days, sB.pdays, sB.variant, sB.block, sB.asked], [4, 4, 'loss_nov_4_g_b36_vb', 'loss_nov_4_g_b36_vb', 6]);
});

test('tf2 variants: questionnaire reopened after B (asked 6) → days 6 in the form, same base, B kept, A still available', () => {
  const b = pilot();
  previewOf(b, Q6);
  startPlan(b);
  b.run('Q=null;quiz()');
  assert.equal(b.run('Q.days'), 6);
  assert.equal(b.run('Q.variant'), 'loss_nov_4_g_b36_vb');
  const g = b.J('(()=>{const g=generate(Q);return{id:g.blockId,opts:g.variantOpts}})()');
  assert.equal(g.id, 'loss_nov_4_g_b36_vb');
  assert.deepEqual(g.opts, ['loss_nov_4_g_b36_vb', 'loss_nov_6_g_b36_va']);
});

test('tf2 variants: save and restore — the app reloads on the variant block; S.days, S.prof.days and the block frequency match', () => {
  const b = pilot();
  previewOf(b, Q6);
  startPlan(b);
  const saved = b.store.get('gym');
  const b2 = boot({ ls: { gc_pilot: '1' }, state: JSON.parse(saved) });
  const r = b2.J(`(()=>{today();const B=getBlock(S.block.id);return{id:B&&B.id,days:S.days,pdays:S.prof.days,w1:B.workouts.filter(w=>+w.week===1).length,dpw:B.days_per_week,n:S.program.length,path:blockFilePath(S.block.id)}})()`);
  assert.equal(r.id, 'loss_nov_4_g_b36_vb');
  assert.equal(r.path, 'data/blocks/variants/loss_nov_4_g_b36_vb.json');
  assert.deepEqual([r.days, r.pdays, r.w1, r.dpw], [4, 4, 4, 4]);
  // pilot switch turned off later: the active plan stays on its block (no regeneration)
  const b3 = boot({ state: JSON.parse(saved) });
  assert.equal(b3.run('(today(),S.block.id)'), 'loss_nov_4_g_b36_vb');
  assert.equal(b3.run('S.program.length'), r.n);
});

test('tf2 variants: str free / orig-equipment and the single-variant programs keep their own base; unknown choice → default', () => {
  const b = pilot();
  const r = b.J(`[['str_adv_5_g_b35_vfree','str_adv_5_g_b35'],['str_adv_5_g_b35_voe','str_adv_5_g_b35'],['mass_nov_3_g_b36_v3','mass_nov_3_g_b36'],['loss_mid_4_g_pr_abs_b36_v3','loss_mid_4_g_pr_abs_b36']].map(([v,base])=>[blockVariantBase(v,base),blockVariantOpts(v,base).length,blockVariantBase(v,null)])`);
  assert.deepEqual(r, [['str_adv_5_g_b35', 2, 'str_adv_5_g_b35'], ['str_adv_5_g_b35', 2, 'str_adv_5_g_b35'], ['mass_nov_3_g_b36', 1, 'mass_nov_3_g_b36'], ['loss_mid_4_g_pr_abs_b36', 1, 'loss_mid_4_g_pr_abs_b36']]);
  assert.equal(b.run(`blockVariantBase('loss_nov_4_g_b36_vb','loss_nov_6_g_b36')`), 'loss_nov_6_g_b36');
  assert.equal(b.run(`blockVariantBase('loss_nov_6_g_b36_va','loss_nov_4_g_b36')`), 'loss_nov_6_g_b36', 'the 4-day base does not offer A');
  assert.equal(b.run(`blockVariantFor('loss_nov_4_g_b36',{variant:'loss_nov_6_g_b36_va'})`), 'loss_nov_4_g_b36_vb');
});
