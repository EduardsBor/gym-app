'use strict';
// GC-163-01: five r2 programs can be switched on one by one (R2_ACTIVE) — prepared, NOT active (owner approval pending).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { boot, root, read } = require('./fixtures/tf1-boot.js');
const DAY = 864e5, now = Date.now();
const FIVE = ['mass_nov_4_g_b36', 'mass_nov_4_b_nobar_b36', 'mass_nov_5_g_b35', 'mass_nov_6_g_b36', 'fit_nov_6_g_b36'];
const TWO = ['fit_nov_6_b_nobar_b36', 'loss_nov_6_b_nobar_b36'];
const BLOCKED = ['mass_nov_5_b_bar_b35', 'mass_nov_6_b_bar_b36', 'loss_nov_6_b_bar_b36'];
// SHA256 of the audited files (GC-163 report). r2 = what would be switched on; base = what existing / non-r2 users keep.
const SHA_R2 = {
  mass_nov_4_g_b36: '1af598b4fb744e826b356505c72caefb6e76b0989fa489ccb2027f1f762be88d', mass_nov_4_b_nobar_b36: 'abbc7df786ced23456fcbedca7794a8a4733e03e41d40a14173c02750ee2ae99',
  mass_nov_5_g_b35: 'a1b93aca06386f3cf163decbdcfbeb4ddfdd4f8de4adfa69c024d6a990ba6787', mass_nov_6_g_b36: '41a27f19483533b9d3b3806dce722a83cadd93c81f804a15ff89104d062425b8',
  fit_nov_6_g_b36: '004522f3e35322f9124a81d2b540c9460bd6aece46b0730ab32020b775cbd8d6', fit_nov_6_b_nobar_b36: 'cb4ecf2f79452b1b9cf3008d04991a39ce05a015322736527f35095ed0a49c80',
  loss_nov_6_b_nobar_b36: 'ecf56e2b660053b2e166943e00b7d249ac8c4fdda4db4936a2684c79c633d323' };
const SHA_BASE = {
  mass_nov_4_g_b36: '92663054273579f37bb7f1ba674be3edcf526deaae2b65657ee34e144e1f11e9', mass_nov_4_b_nobar_b36: '8845a62a5705e615585afa8efaad5dfe79743b736b1ddebbd4fddffcaf413768',
  mass_nov_5_g_b35: 'ea4ab502b46cf8079c0519f9085811b1deccd14abe93f746813cd6d6986a06df', mass_nov_6_g_b36: '46f8a33d043da25be2ff7ca2143cb51e41f480c42639888302b27bdde9b97956',
  fit_nov_6_g_b36: '9e5810d16a784702ddeda14ef526a85c77514cf2dea0c69bdfe1899d6985d322', fit_nov_6_b_nobar_b36: '9f3dca07eb94710f500cd3887a589035279e6cbf2908c3f98ca0cff11e39fe6c',
  loss_nov_6_b_nobar_b36: '19243bed6dd35aa253fb8cd285a11d57dedd5662b4e28e4f9aceaa0f5d236e13' };
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, f))).digest('hex');
const prof = id => { const [goal, level, days, place, bar] = id.match(/^(\w+?)_(nov|mid|adv)_(\d)_(g|d|b)(?:_(bar|nobar))?_/).slice(1); return { goal, level, days: +days, place, bar: bar === 'bar' ? '1' : place === 'b' ? '0' : undefined, sex: 'm', prio: [], lim: [] }; };

test('GC-163-01: exact files — SHA256 of the 7 r2 and the 7 base programs are the audited ones', () => {
  for (const id of Object.keys(SHA_R2)) {
    assert.equal(sha('data/blocks/r2/' + id + '_r2.json'), SHA_R2[id], 'r2 ' + id);
    assert.equal(sha('data/blocks/' + id + '.json'), SHA_BASE[id], 'base ' + id);
  }
});

test('GC-163-01: LIVE default — R2_ON=false, R2_ACTIVE empty → every new assignment gets the old program', () => {
  const b = boot();
  assert.equal(b.run('R2_ON'), false);
  assert.equal(b.run('R2_ACTIVE.length'), 0);
  for (const id of [...FIVE, ...TWO, ...BLOCKED]) assert.equal(b.run(`blockIdForProfile(${JSON.stringify(prof(id))})`), id, id);
});

test('GC-163-01: R2_ACTIVE = the five → only these five get r2; the two home programs and the 3 b_bar stay old', () => {
  const b = boot();
  b.run(`R2_ACTIVE=${JSON.stringify(FIVE)}`);
  for (const id of FIVE) assert.equal(b.run(`blockIdForProfile(${JSON.stringify(prof(id))})`), id + '_r2', id);
  for (const id of [...TWO, ...BLOCKED]) assert.equal(b.run(`blockIdForProfile(${JSON.stringify(prof(id))})`), id, id);
  // one by one
  b.run(`R2_ACTIVE=["mass_nov_6_g_b36"]`);
  assert.equal(b.run(`blockIdForProfile(${JSON.stringify(prof('mass_nov_6_g_b36'))})`), 'mass_nov_6_g_b36_r2');
  assert.equal(b.run(`blockIdForProfile(${JSON.stringify(prof('fit_nov_6_g_b36'))})`), 'fit_nov_6_g_b36');
  // a blocked id in the list is ignored
  b.run(`R2_ACTIVE=["mass_nov_5_b_bar_b35","nonsense"]`);
  assert.equal(b.run(`blockIdForProfile(${JSON.stringify(prof('mass_nov_5_b_bar_b35'))})`), 'mass_nov_5_b_bar_b35');
});

test('GC-163-01: instant rollback — emptying R2_ACTIVE keeps a plan already started on r2 (file loads, plan / history / S.pg unchanged)', () => {
  const id = 'mass_nov_4_g_b36';
  const b0 = boot({ state: { lang: 'ru', goal: 'mass', days: 4, next: 5, obDone: 1, custom: [], body: [], prof: prof(id),
    pg: { bp: { st: { success: 1, miss: 0 }, next: { weight: 42.5, sets: 3 }, first: 1, last: now - DAY } },
    workouts: [{ id: 'w1', start: now - DAY, end: now - DAY + 1, dayIdx: 0, dayName: 'A', items: [{ exId: 'bp', sets: [{ w: 40, r: 10, done: true }] }] }] } });
  b0.run(`R2_ACTIVE=${JSON.stringify(FIVE)};S.block={id:blockIdForProfile(S.prof),next:5};S.program=planFromBlock(getBlock(S.block.id),S.prof).days;save()`);
  const saved = JSON.parse(b0.run(`localStorage.getItem('gym')`));
  assert.equal(saved.block.id, id + '_r2');
  const b = boot({ state: saved });   // R2_ACTIVE back to [] (rollback build)
  assert.equal(b.run('R2_ACTIVE.length'), 0);
  assert.equal(b.run('S.block.id'), id + '_r2');
  assert.equal(b.run('getBlock(S.block.id).id'), id + '_r2', 'r2 file still loads after rollback');
  assert.equal(b.run('blockActive()'), true);
  for (const k of ['program', 'workouts', 'pg']) assert.equal(b.run(`JSON.stringify(S.${k})`), JSON.stringify(saved[k]), k);
  assert.equal(b.run(`blockIdForProfile(${JSON.stringify(prof(id))})`), id, 'new assignments are old again');
});

test('GC-163-01: enabling never migrates an existing plan on the old program', () => {
  const id = 'fit_nov_6_g_b36';
  const b0 = boot({ state: { lang: 'ru', goal: 'fit', days: 6, next: 2, obDone: 1, custom: [], body: [], prof: prof(id), block: { id, next: 2 }, workouts: [], pg: {} } });
  b0.run(`S.program=planFromBlock(getBlock('${id}'),S.prof).days;save()`);
  const saved = JSON.parse(b0.run(`localStorage.getItem('gym')`));
  const b = boot({ state: saved });
  b.run(`R2_ACTIVE=${JSON.stringify(FIVE)}`);
  if (b.run('typeof migrateLegacyPlans') === 'function') b.run('migrateLegacyPlans()');
  assert.equal(b.run('S.block.id'), id);
  assert.equal(b.run('JSON.stringify(S.program)'), JSON.stringify(saved.program));
});
