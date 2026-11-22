'use strict';
// tech-fix-2: validation of rir_target ranges (block / phase) and of the shown RIR: never below the level floor, deload +2.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { boot, root } = require('./fixtures/tf1-boot.js');

test('tf2 RIR: invalid rir_target is rejected (inverted, out of 0–6, wrong shape) → level fallback', () => {
  const b = boot();
  const ok = t => b.run(`blockRirOk(${JSON.stringify(t)})`);
  assert.equal(ok({ c: [2, 3], a: [1, 2] }), true);
  for (const t of [{ c: [3, 1], a: [1, 2] }, { c: [2, 3], a: [2, 1] }, { c: [2, 7], a: [1, 2] }, { c: [-1, 2], a: [1, 2] }, { c: [2], a: [1, 2] }, { c: ['2', 3], a: [1, 2] }, { c: [2, 3] }, null])
    assert.equal(ok(t), false, JSON.stringify(t));
  assert.equal(b.run(`blockRirTarget({phases:[{workouts:[1,10],rir_target:{c:[3,1],a:[1,2]}}]},{n:2})`), null);
});

test('tf2 RIR: every block / variant file with rir_target is valid; shown RIR stays within the level floor and 0–8', () => {
  const b = boot();
  const files = fs.readdirSync(path.join(root, 'data/blocks/variants')).map(f => 'data/blocks/variants/' + f);
  let n = 0;
  for (const f of files) {
    const j = JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
    const ts = [j.rir_target, ...(j.phases || []).map(p => p.rir_target)].filter(Boolean);
    for (const t of ts) { n++; assert.equal(b.run(`blockRirOk(${JSON.stringify(t)})`), true, f); }
  }
  assert.ok(n >= 6);
  const r = b.J(`(()=>{const o=[];for(const lv of ['nov','mid','adv'])for(const role of ['c','a'])for(const t of [null,{c:[0,1],a:[0,1]},{c:[2,3],a:[1,3]}])for(const plus of [0,2])for(const fl of [[],['k']]){const x=prRir(lv,role,fl,plus,t||undefined);o.push([lv,role,!!t,plus,fl.length,x])}return o})()`);
  const floor = { nov: 2, mid: 1, adv: 0 };
  for (const [lv, , , plus, fl, x] of r) {
    assert.ok(x[0] <= x[1] && x[0] >= 0 && x[1] <= 8, JSON.stringify(x));
    assert.ok(x[0] >= floor[lv] + plus || (fl && x[0] >= 2), lv + ' ' + JSON.stringify(x));
  }
});
