'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

// 68 каталожных id + 12 разминочных. Порядок и состав не должны меняться правками текстов.
const EXPECTED = [
  'bp','dbp','ibp','idb','fly','mk-cable-pec-fly','mk-parralel-bar-dips','pu',
  'mk-barbell-deadlift','pull','lat','row','dbr','cr','hyp','mk-dumbbell-shrug',
  'sq','fsq','lp','rdl','lun','bss','le','lc','ht','mk-standing-calf-raise-machine','gsq',
  'ohp','dsp','lr','mk-dumbbell-rear-delt-fly','mk-cable-seated-rope-face-pull','mk-barbell-upright-row',
  'bc','dbc','hc','mk-ez-bar-preacher-curl',
  'cgb','mk-cable-bar-pushdown','mk-ez-bar-skullcrusher','mk-dumbbell-seated-overhead-tricep-extension',
  'mk-front-plank','mk-crunches','mk-hanging-knee-raises','mk-rkc-plank','rt',
  'mk-treadmill-run','mk-indoor-cycling-spin','mk-elliptical','mk-rowing-machine-steady-state','stair',
  'bwsq','mk-dumbbell-step-up-low','mk-dumbbell-stiff-leg-deadlift','inv','chin','ppu','bd','mk-diamond-push-ups','mch','dbug','bdog','mk-prone-y-t-raises','nlc','sglb','bpl','jump','mk-incline-treadmill-walk',
  'mk-walking-knee-hugs','w_hip','w_legsw','w_glb','mk-hip-hinge-drill','mk-arm-circles-front-back','mk-broomstick-pass-throughs','mk-band-high-face-pull','mk-cat-camel','w_scpull','mk-band-row'
];

function idsIn(src) {
  return [...src.matchAll(/\[['"]([a-z0-9_-]+)['"],\s*['"]/g)].map(m => m[1]);
}

test('catalog keeps the same 80 exercise ids', () => {
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const warm = fs.readFileSync(path.join(root, 'warm.js'), 'utf8');
  const main = idsIn(app.slice(app.indexOf('const EX='), app.indexOf('.map(([id,name,group])')));
  const extra = idsIn(app.slice(app.indexOf("[['bwsq'"), app.indexOf('].forEach(([id,name,group])=>EX.push')));
  const warmIds = idsIn(warm.slice(0, warm.indexOf('].forEach(([id,name,group])=>EX.push')));
  const ids = main.concat(extra, warmIds);
  assert.equal(EXPECTED.length, 79);
  assert.deepEqual(ids, EXPECTED);
  assert.equal(new Set(ids).size, 79);
  assert.equal(ids.includes('mk-barbell-upright-row'), true);
  assert.equal(ids.includes('w_scpu'), false);
  assert.equal(ids.includes('dl'), false);
});
