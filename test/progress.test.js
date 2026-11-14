'use strict';
// P-301: progression rules. The 15 examples from progression-rules.json (copied to test/fixtures) must pass verbatim.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const P = require('../progress.js');

const rules = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'progression-rules.json'), 'utf8'));

function pick(out, exp) {
  const r = {};
  for (const k of Object.keys(exp)) {
    if (k === 'state') { r.state = {}; for (const s of Object.keys(exp.state)) r.state[s] = out.state[s] | 0; }
    else r[k] = out[k];
  }
  return r;
}

test('fixture has 15 trainer examples', () => {
  assert.equal(rules.tests.length, 15);
});

for (const t of rules.tests) {
  test(`${t.id} ${t.title}`, () => {
    const out = P.prNext(JSON.parse(JSON.stringify(t.input)));
    assert.deepEqual(pick(out, t.expected), t.expected, t.text);
  });
}

test('every exercise class from the rules is in progress.js', () => {
  const items = rules.exercise_classes.items;
  assert.equal(Object.keys(P.PR_CLS).length, Object.keys(items).length);
  for (const [id, v] of Object.entries(items)) {
    const c = P.prCls(id);
    assert.ok(c, id);
    assert.equal(c.eq, v.equipment, id);
    assert.equal(c.region, v.region, id);
    assert.equal(c.uni, v.unilateral, id);
    assert.equal(c.risk, v.risk, id);
  }
});

test('rounding: up and down per equipment', () => {
  const e = P.prEquip();
  const bp = P.prCls('bp'), sq = P.prCls('sq'), cr = P.prCls('cr'), kb = P.prCls('rdl-kb');
  assert.equal(P.prUp(60, bp, e), 62.5);
  assert.equal(P.prUp(30, sq, e), 32.5);       // lower body under 40 kg: +2.5
  assert.equal(P.prUp(100, sq, e), 105);
  assert.equal(P.prUp(50, cr, e), 55);
  assert.equal(P.prUp(16, kb, e), 20);
  assert.equal(P.prUp(50, P.prCls('ht-db'), e), null); // no heavier dumbbell
  assert.equal(P.prDown(60, 0.9, bp, e), 52.5);
  assert.equal(P.prDown(22.5, 0.9, bp, e), 20);
  assert.equal(P.prDown(20, 0.9, bp, e), 20);  // empty bar is the floor
});

test('custom equipment profile changes steps', () => {
  const out = P.prNext({ id: 'ht-db', level: 'nov', range: [12, 15], sets_plan: 2, weight: 9, results: [15, 15] }, { db: [5, 7.5, 10, 12.5] });
  assert.equal(out.weight, 12.5);
  const one = P.prNext({ id: 'mk-band-row', level: 'mid', range: [8, 15], sets_plan: 3, weight: 1, results: [15, 15, 15] }, { bands: [1] });
  assert.equal(one.weight, 1);
  assert.equal(one.modKey, 'shorter');
  assert.equal(one.target, 8);
});

test('calibration: first workout', () => {
  const base = { id: 'bp', level: 'adv', range: [8, 12], sets_plan: 3, weight: 60, calibration: true };
  assert.equal(P.prNext({ ...base, results: [12, 12, 12] }).weight, 62.5);
  const d = P.prNext({ ...base, results: [7, 6, 6] });
  assert.equal(d.weight, 52.5);
  assert.equal(d.state.miss, 0);
  assert.equal(P.prNext({ ...base, results: [10, 9, 9] }).weight, 60);
});

test('pain: no increase, -10 %', () => {
  const out = P.prNext({ id: 'bp', level: 'mid', range: [8, 12], sets_plan: 3, weight: 60, results: [12, 12, 12], pain: true });
  assert.equal(out.weight, 52.5);
  assert.equal(out.note, 'pain');
  assert.equal(out.state.success, 0);
});

test('feel button maps to RIR of the last set', () => {
  const r = f => [null, null, P.PR_FEEL[f]];
  const base = { id: 'bp', level: 'mid', range: [8, 12], sets_plan: 3, weight: 60, results: [12, 12, 12] };
  assert.equal(P.prNext({ ...base, rir: r('easy') }).weight, 62.5);
  assert.equal(P.prNext({ ...base, rir: r('ok') }).weight, 62.5);
  assert.equal(P.prNext({ ...base, rir: r('hard') }).weight, 60);
});

test('break 28+ days: x0.8 and RIR +1 for 2 workouts', () => {
  const out = P.prNext({ id: 'bp', level: 'mid', range: [8, 12], sets_plan: 3, weight: 100, ctx: { days_since_last: 30 } });
  assert.equal(out.weight, 80);
  assert.deepEqual(out.rir, [3, 4]);
  assert.equal(out.state.rirPlus, 2);
});

test('early deload: -10 %, half the sets', () => {
  const out = P.prNext({ id: 'bp', level: 'mid', range: [8, 12], sets_plan: 3, weight: 80, ctx: { deload: 'early' } });
  assert.equal(out.weight, 70); // 80 × 0.9 = 72 → 70
  assert.equal(out.sets, 2);
  assert.equal(out.target, 8);
});

test('after deload: a miss does not count', () => {
  const out = P.prNext({ id: 'cr', level: 'mid', range: [8, 12], sets_plan: 3, weight: 50, results: [8, 7, 7], state: { miss: 2 }, ctx: { after_deload: true } });
  assert.equal(out.weight, 50);
  assert.equal(out.state.miss, 2);
});

test('assisted pull-up: -5 kg counterweight, at 0 -> pull', () => {
  const b = { id: 'assisted-pullup', level: 'nov', range: [6, 12], sets_plan: 3, results: [12, 12, 12] };
  assert.equal(P.prNext({ ...b, weight: 20 }).weight, 15);
  const z = P.prNext({ ...b, weight: 5 });
  assert.equal(z.id, 'pull');
  assert.equal(P.prNext({ ...b, weight: 20, results: [5, 5, 5], state: { miss: 2 } }).weight, 25);
});

test('bodyweight without a ladder: tempo -> pause -> backpack 5 kg -> +2.5', () => {
  const b = { id: 'pu', level: 'nov', range: [10, 20], sets_plan: 3, results: [20, 20, 20] };
  let st = {}, w = null; const keys = [];
  for (let i = 0; i < 4; i++) { const o = P.prNext({ ...b, weight: w, state: st }); keys.push(o.modKey); st = o.state; w = o.weight; }
  assert.deepEqual(keys, ['tempo', 'pause', 'load', 'load']);
  assert.equal(w, 7.5);
});

test('ladder restrictions: dbug needs gym/bar place and dead hang 30 s', () => {
  const b = { id: 'dbug', level: 'nov', range: [12, 15], sets_plan: 3, results: [15, 15, 15] };
  assert.equal(P.prNext({ ...b, place: 'd', hang: 40 }).id, 'dbug');
  assert.equal(P.prNext({ ...b, place: 'g', hang: 20 }).id, 'dbug');
  assert.equal(P.prNext({ ...b, place: 'g', hang: 30 }).id, 'hanging-knee-raise');
});

test('plank: ladder to RKC without a back flag, 3 short holds -> target down', () => {
  const o = P.prNext({ id: 'pl', level: 'mid', range: [20, 45], sets_plan: 3, target: 45, results: [45, 45, 45] });
  assert.equal(o.id, 'mk-rkc-plank');
  assert.equal(o.target, 10);
  let st = {};
  for (let i = 0; i < 3; i++) st = P.prNext({ id: 'pl', level: 'mid', range: [20, 45], sets_plan: 3, target: 30, results: [20, 30, 30], state: st }).state;
  const d = P.prNext({ id: 'pl', level: 'mid', range: [20, 45], sets_plan: 3, target: 30, results: [20, 30, 30], state: { tmiss: 2 } });
  assert.equal(d.target, 25);
});

test('app ids renamed by LEGACY_TO resolve to trainer classes', () => {
  global.LEGACY_TO = { pl: 'mk-front-plank', tpd: 'mk-cable-bar-pushdown' };
  try {
    assert.equal(P.prCls('mk-front-plank').id, 'pl');
    assert.equal(P.prCls('mk-cable-bar-pushdown').eq, 'cable');
    assert.equal(P.prCls('no-such-id'), null);
  } finally { delete global.LEGACY_TO; }
});
