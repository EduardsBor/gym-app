import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

function idsIn(src,start,end){
  const i=src.indexOf(start),j=src.indexOf(end,i+start.length);
  assert.ok(i>=0&&j>i,`markers not found: ${start}`);
  return [...src.slice(i,j).matchAll(/\[\s*['"]([a-z0-9_]+)['"]/g)].map(m=>m[1]);
}

const EXPECTED=[
  'bp','dbp','ibp','idb','fly','cc','dip','pu','dl','pull','lat','row','dbr','cr','hyp','shr','sq','fsq','lp','rdl','lun','bss','le','lc','ht','calf','gsq','ohp','dsp','lr','rfly','fp','ur','bc','dbc','hc','pc','cgb','tpd','skull','ote','pl','cru','hlr','abw','rt','tm','bike','ell','rowm','stair',
  'bwsq','step','dbrdl','inv','chin','ppu','bd','dpu','mch','dbug','bdog','yr','nlc','sglb','bpl','jump','wlk',
  'w_march','w_hip','w_legsw','w_glb','w_gm','w_armc','w_dislo','w_pa','w_scpu','w_catcow','w_scpull','w_bandrow'
];

test('all 80 catalog exercise ids are unchanged',()=>{
  const app=read('app.js'),warm=read('warm.js');
  const main=idsIn(app,'const EX=','.map(([id,name,group])');
  const extra=idsIn(app,'// Доп. упражнения','.forEach(([id,name,group])=>EX.push');
  const warmup=idsIn(warm,'[["w_march"','.forEach(([id,name,group])=>EX.push');
  const ids=[...main,...extra,...warmup];
  assert.deepEqual(ids,EXPECTED);
  assert.equal(new Set(ids).size,80);
  assert.equal(main.length,51);
  assert.equal(extra.length,17);
  assert.equal(warmup.length,12);
});

test('free tier, program slots, and warmup links still point at those ids',()=>{
  const app=read('app.js'),features=read('features.js');
  const free=[...features.match(/const FREE_EX=new Set\(\[([^\]]+)\]\)/)[1].matchAll(/'([a-z0-9_]+)'/g)].map(m=>m[1]);
  assert.equal(free.length,20);
  for(const id of free) assert.ok(EXPECTED.includes(id),id);
  const slot=app.slice(app.indexOf('const SLOT='),app.indexOf('const SLOTG='));
  const slotIds=[...slot.matchAll(/'([a-z0-9_]+)'/g)].map(m=>m[1]);
  assert.ok(slotIds.length>20);
  for(const id of slotIds) assert.ok(EXPECTED.includes(id),`SLOT ${id}`);
  const wmov=app.slice(app.indexOf('const WMOV={'),app.indexOf('};',app.indexOf('const WMOV={')));
  const keys=[...wmov.matchAll(/^([a-z0-9_]+):/gm)].map(m=>m[1]);
  assert.equal(keys.length,12);
  for(const key of keys){
    const id=key==='bwsq'?'bwsq':'w_'+key;
    assert.ok(EXPECTED.includes(id),`WMOV ${key} -> ${id}`);
  }
});

test('each catalog id still has its existing clip and poster, and no extras',()=>{
  const names=fs.readdirSync(path.join(root,'anim3d'));
  const mp4=names.filter(n=>n.endsWith('.mp4')).map(n=>n.slice(0,-4)).sort();
  const jpg=names.filter(n=>n.endsWith('.jpg')).map(n=>n.slice(0,-4)).sort();
  const ids=[...EXPECTED].sort();
  assert.deepEqual(mp4,ids);
  assert.deepEqual(jpg,ids);
});

test('service worker keeps the existing cache names and does not list clips to prefetch',()=>{
  const sw=read('sw.js');
  assert.match(sw,/const C\s*=\s*'moyzal-v29'/);
  assert.match(sw,/A3\s*=\s*'moyzal-anim3d-v7'/);
  assert.match(sw,/x\s*!==\s*C\s*&&\s*x\s*!==\s*A3/);
  assert.equal(sw.includes('moyzal-v30'),false);
  assert.equal(sw.includes('moyzal-anim3d-v8'),false);
  assert.equal(sw.includes('localStorage'),false);
  assert.equal(sw.includes('.mp4'),false);
  assert.equal(sw.includes('caches.delete(A3)'),false);
});
