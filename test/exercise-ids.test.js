'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

// 68 каталожных id + 12 разминочных. Порядок и состав не должны меняться правками текстов.
const EXPECTED = [
  'bp','dbp','ibp','idb','fly','cc','dip','pu',
  'dl','pull','lat','row','dbr','cr','hyp','shr',
  'sq','fsq','lp','rdl','lun','bss','le','lc','ht','calf','gsq',
  'ohp','dsp','lr','rfly','fp','ur',
  'bc','dbc','hc','pc',
  'cgb','tpd','skull','ote',
  'pl','cru','hlr','abw','rt',
  'tm','bike','ell','rowm','stair',
  'bwsq','step','dbrdl','inv','chin','ppu','bd','dpu','mch','dbug','bdog','yr','nlc','sglb','bpl','jump','wlk',
  'w_march','w_hip','w_legsw','w_glb','w_gm','w_armc','w_dislo','w_pa','w_scpu','w_catcow','w_scpull','w_bandrow'
];

function idsIn(src) {
  return [...src.matchAll(/\[['"]([a-z0-9_]+)['"],\s*['"]/g)].map(m => m[1]);
}

test('catalog keeps the same 80 exercise ids', () => {
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const warm = fs.readFileSync(path.join(root, 'warm.js'), 'utf8');
  const main = idsIn(app.slice(app.indexOf('const EX='), app.indexOf('.map(([id,name,group])')));
  const extra = idsIn(app.slice(app.indexOf("[['bwsq'"), app.indexOf('].forEach(([id,name,group])=>EX.push')));
  const warmIds = idsIn(warm.slice(0, warm.indexOf('].forEach(([id,name,group])=>EX.push')));
  const ids = main.concat(extra, warmIds);
  assert.equal(EXPECTED.length, 80);
  assert.deepEqual(ids, EXPECTED);
  assert.equal(new Set(ids).size, 80);
  assert.equal(ids.includes('ur'), true);
});
