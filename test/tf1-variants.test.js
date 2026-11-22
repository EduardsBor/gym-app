'use strict';
// tech-fix-1: program variants of the pilot (pilot-rework-3) have their own ids and files; the base block, the catalog,
// blocks-index, active plans, history and progression are not touched. Variants are used only with the pilot switch.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { boot, root, read, DAY } = require('./fixtures/tf1-boot.js');

const VDIR = path.join(root, 'data/blocks/variants');
const vfiles = fs.readdirSync(VDIR).filter(f => f.endsWith('.json')).sort();
const index = () => { const c = vm.createContext({}); vm.runInContext(read('data/blocks-index.js') + ';this.I=BLOCK_INDEX', c); return c.I; };

test('variants: 6 files, id = file name, unique, not in BLOCK_INDEX; base exists in the index; 244 base blocks unchanged in number', () => {
  const I = index();
  assert.equal(I.length, 244);
  assert.equal(fs.readdirSync(path.join(root, 'data/blocks')).filter(f => f.endsWith('.json')).length, 244);
  assert.equal(vfiles.length, 6);
  const ids = new Set(I.map(x => x.id));
  const seen = new Set();
  for (const f of vfiles) {
    const d = JSON.parse(fs.readFileSync(path.join(VDIR, f), 'utf8'));
    assert.equal(d.id + '.json', f);
    assert.ok(!ids.has(d.id), d.id + ' must not be a catalog id');
    assert.ok(ids.has(d.variant_of), d.variant_of);
    assert.ok(!seen.has(d.id)); seen.add(d.id);
  }
  // pilot = 5 unique base programs (loss_nov_4_g_b36 included) → 244 − 5 = 239 not reworked
  const bases = new Set(vfiles.map(f => JSON.parse(fs.readFileSync(path.join(VDIR, f), 'utf8')).variant_of));
  assert.deepEqual([...bases].sort(), ['loss_mid_4_g_pr_abs_b36', 'loss_nov_4_g_b36', 'loss_nov_6_g_b36', 'mass_nov_3_g_b36', 'str_adv_5_g_b35']);
  assert.equal(244 - bases.size, 239);
});

test('variants: both str variants and A/B coexist in the app registry with different ids; base blocks load their own file', () => {
  const b = boot();
  const r = b.J(`['str_adv_5_g_b35','str_adv_5_g_b35_voe','str_adv_5_g_b35_vfree','loss_nov_6_g_b36','loss_nov_6_g_b36_va','loss_nov_4_g_b36','loss_nov_4_g_b36_vb'].map(id=>{const x=getBlock(id);return x&&[x.id,x.variant_of||null,x.workouts.length]})`);
  assert.deepEqual(r.map(x => x[0]), ['str_adv_5_g_b35', 'str_adv_5_g_b35_voe', 'str_adv_5_g_b35_vfree', 'loss_nov_6_g_b36', 'loss_nov_6_g_b36_va', 'loss_nov_4_g_b36', 'loss_nov_4_g_b36_vb']);
  const base = JSON.parse(read('data/blocks/str_adv_5_g_b35.json'));
  assert.equal(b.run(`JSON.stringify(getBlock('str_adv_5_g_b35').workouts)`), JSON.stringify(base.workouts));
  assert.equal(b.run(`blockFileUrl('str_adv_5_g_b35_voe')`), 'data/blocks/variants/str_adv_5_g_b35_voe.json');
  assert.equal(b.run(`blockFileUrl('str_adv_5_g_b35')`), 'data/blocks/str_adv_5_g_b35.json');
});

test('variants: switch off (default) → questionnaire gives the base blocks as before', () => {
  const b = boot();
  const q = a => b.run(`blockIdForProfile(${JSON.stringify(a)})`);
  assert.equal(b.run('blockVariantsOn()'), false);
  assert.equal(q({ goal: 'str', level: 'adv', days: 5, place: 'g' }), 'str_adv_5_g_b35');
  assert.equal(q({ goal: 'loss', level: 'nov', days: 6, place: 'g' }), 'loss_nov_6_g_b36');
  assert.equal(q({ goal: 'str', level: 'adv', days: 5, place: 'g', variant: 'str_adv_5_g_b35_vfree' }), 'str_adv_5_g_b35');
});

test('variants: switch on → defaults orig-equipment and B; A / free only by choice; unknown choice → default', () => {
  const b = boot({ ls: { gc_pilot: '1' } });
  const q = a => b.run(`blockIdForProfile(${JSON.stringify(a)})`);
  assert.equal(q({ goal: 'str', level: 'adv', days: 5, place: 'g' }), 'str_adv_5_g_b35_voe');
  assert.equal(q({ goal: 'str', level: 'adv', days: 5, place: 'g', variant: 'str_adv_5_g_b35_vfree' }), 'str_adv_5_g_b35_vfree');
  assert.equal(q({ goal: 'loss', level: 'nov', days: 6, place: 'g' }), 'loss_nov_4_g_b36_vb');
  assert.equal(q({ goal: 'loss', level: 'nov', days: 6, place: 'g', variant: 'loss_nov_6_g_b36_va' }), 'loss_nov_6_g_b36_va');
  assert.equal(q({ goal: 'loss', level: 'nov', days: 6, place: 'g', variant: 'str_adv_5_g_b35_vfree' }), 'loss_nov_4_g_b36_vb');
  assert.equal(q({ goal: 'mass', level: 'nov', days: 3, place: 'g' }), 'mass_nov_3_g_b36_v3');
  assert.equal(q({ goal: 'loss', level: 'mid', days: 4, place: 'g', acc: 'abs' }), 'loss_mid_4_g_pr_abs_b36_v3');
  assert.equal(q({ goal: 'mass', level: 'mid', days: 4, place: 'g' }), 'mass_mid_4_g_b36'); // other 239 programs: no variants
  const gen = b.J(`(()=>{const g=generate({goal:'loss',level:'nov',days:6,place:'g',sex:'m',lim:[],prio:[],len:75});return{id:g.blockId,of:g.variantOf,base:g.variantBase,opts:g.variantOpts,days:g.variantDays,html:blockVariantHTML(g)}})()`);
  assert.equal(gen.id, 'loss_nov_4_g_b36_vb');
  // tech-fix-2: home base of B is loss_nov_4 (file variant_of); the 6-day questionnaire base only offers it
  assert.equal(gen.of, 'loss_nov_4_g_b36');
  assert.equal(gen.base, 'loss_nov_6_g_b36');
  assert.deepEqual(gen.opts, ['loss_nov_4_g_b36_vb', 'loss_nov_6_g_b36_va']);
  assert.equal(gen.days, 4);
  assert.match(gen.html, /Вариант B — 4 тренировки в неделю/);
  assert.match(gen.html, /Вариант A — 6 тренировок в неделю/);
});

test('variants: an active plan stays on its block — no regeneration, history and progression untouched after the switch is on', () => {
  const now = Date.now();
  const hist = [{ id: 'w1', start: now - 3 * DAY, end: now - 3 * DAY + 3600e3, dayIdx: 0, dayName: 'x', notes: '', items: [{ exId: 'smith-bench', ns: 5, min: 3, max: 6, rest: 180, sets: [{ w: 80, r: 5, done: true }] }] }];
  const b0 = boot();
  const prog = b0.J(`planFromBlock(getBlock('str_adv_5_g_b35'),{goal:'str',level:'adv',days:5,place:'g',lim:[]}).days`);
  // a plan saved by the old code: no limWarn / deload / rirTarget fields
  const old = prog.map(d => { const x = Object.assign({}, d); delete x.deload; delete x.rirTarget; delete x.limWarn; return x; });
  const pg = { 'smith-bench': { st: { success: 1, miss: 0 }, next: { weight: 82.5, sets: 5, target: 3, note: 'inc' }, first: now - 30 * DAY, last: now - 3 * DAY } };
  const state = { lang: 'ru', goal: 'str', days: 5, next: 1, prof: { goal: 'str', level: 'adv', days: 5, place: 'g', sex: 'm', lim: [], prio: [] }, program: old,
    block: { id: 'str_adv_5_g_b35', next: 1 }, workouts: hist, custom: [], body: [], pg, pgSince: now - 30 * DAY, dlLast: now - 3 * DAY };
  const b = boot({ state, ls: { gc_pilot: '1' } });
  b.run('today()');
  assert.equal(b.run('S.block.id'), 'str_adv_5_g_b35');
  assert.equal(b.run('JSON.stringify(S.program)'), JSON.stringify(old));
  assert.equal(b.run('JSON.stringify(S.workouts)'), JSON.stringify(hist));
  assert.equal(b.run('JSON.stringify(S.pg)'), JSON.stringify(pg));
  assert.equal(b.run('blockActive()'), true);
});

test('variants: every variant passes validateBlock, uses only known ids with a MoveKit clip, available in the gym', () => {
  const b = boot();
  for (const f of vfiles) {
    const id = f.slice(0, -5);
    const r = b.J(`(()=>{const B=getBlock(${JSON.stringify(id)});const v=validateBlock(B);const bad=[];
      B.workouts.forEach(w=>w.items.forEach(i=>{const x=resolveExId(i.exId);if(!catalogHasEx(x))bad.push('unknown '+x);else if(!movekitFile(x))bad.push('noclip '+x);else if(!eqAvail(x,'g'))bad.push('place '+x)}));
      return{ok:v.ok,errors:v.errors,bad}})()`);
    assert.equal(r.ok, true, id + ' ' + r.errors.join('; '));
    assert.deepEqual(r.bad, [], id);
  }
});
