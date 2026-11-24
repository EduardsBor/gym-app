'use strict';
// v158 — r2 revisions (prepared, R2_ON=false), gravitron only in the gym (decision D), D2 easier step checks (PR_DOWN_ON=false).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { boot, root, read } = require('./fixtures/tf1-boot.js');
const P = require('../progress.js');
const DAY = 864e5, now = Date.now();
const READY = ['mass_nov_4_g_b36', 'mass_nov_4_b_nobar_b36', 'mass_nov_5_g_b35', 'mass_nov_6_g_b36', 'fit_nov_6_g_b36', 'fit_nov_6_b_nobar_b36', 'loss_nov_6_b_nobar_b36'];
const BLOCKED = ['mass_nov_5_b_bar_b35', 'mass_nov_6_b_bar_b36', 'loss_nov_6_b_bar_b36'];
// md5 of the r2 files = review-nov-2-final-check drafts (md5.txt) with only "id" changed to <id>_r2 (scripts check in the report)
const MD5 = { mass_nov_4_g_b36: 'ac74257eaf5bde2ded0180c87ce9f622', mass_nov_4_b_nobar_b36: '61f287ec602113970f3e38de314519c7', mass_nov_5_g_b35: '322345579702e5b26b53a6faf592462d',
  mass_nov_6_g_b36: '5a5595a888e82ebde1813bec9191a9c4', fit_nov_6_g_b36: 'd73c9480511652bca4682a9c0098327b', fit_nov_6_b_nobar_b36: '69bad915363a03f8701e0993b417d6cc', loss_nov_6_b_nobar_b36: '14d296df6814b12b9ab75764c71b779a' };
const prof = id => { const [goal, level, days, place, bar] = id.match(/^(\w+?)_(nov|mid|adv)_(\d)_(g|d|b)(?:_(bar|nobar))?_/).slice(1); return { goal, level, days: +days, place, bar: bar === 'bar' ? '1' : place === 'b' ? '0' : undefined, sex: 'm', prio: [], lim: [] }; };

// ---------- r2
test('r2 files: exactly the 7 accepted programs, locked by md5, own id <id>_r2, old block files untouched by the mechanism', () => {
  const files = fs.readdirSync(path.join(root, 'data/blocks/r2')).sort();
  assert.deepEqual(files, READY.map(id => id + '_r2.json').sort());
  for (const id of READY) {
    const raw = fs.readFileSync(path.join(root, 'data/blocks/r2', id + '_r2.json'));
    assert.equal(crypto.createHash('md5').update(raw).digest('hex'), MD5[id], id);
    assert.equal(JSON.parse(raw).id, id + '_r2');
  }
  for (const id of BLOCKED) assert.ok(!fs.existsSync(path.join(root, 'data/blocks/r2', id + '_r2.json')), id + ' blocked until D2 at home');
  assert.equal(fs.readdirSync(path.join(root, 'data/blocks')).filter(f => f.endsWith('.json')).length, 244, 'old blocks: same files');
});

test('R2_ON=false (LIVE): with R2_ACTIVE empty every new assignment gets the current block (GC-164: five are active by R2_ACTIVE)', () => {
  const b = boot();
  assert.equal(b.run('R2_ON'), false);
  b.run('R2_ACTIVE=[]');
  for (const id of READY) assert.equal(b.run(`blockIdForProfile(${JSON.stringify(prof(id))})`), id, id);
});

test('R2_ON=true: only a NEW assignment (questionnaire / catalog → blockIdForProfile → generate) picks <id>_r2; 3 b_bar stay old', () => {
  const b = boot();
  b.run('R2_ON=true');
  for (const id of READY) {
    assert.equal(b.run(`blockIdForProfile(${JSON.stringify(prof(id))})`), id + '_r2', id);
    assert.equal(b.run(`getBlock(${JSON.stringify(id + '_r2')}).id`), id + '_r2');
    assert.equal(b.run(`blockFilePath(${JSON.stringify(id + '_r2')})`), 'data/blocks/r2/' + id + '_r2.json');
  }
  for (const id of BLOCKED) assert.equal(b.run(`blockIdForProfile(${JSON.stringify(prof(id))})`), id, id);
  // loading r2 never replaces the old block in memory
  const old = JSON.parse(read('data/blocks/fit_nov_6_g_b36.json'));
  assert.equal(b.run('JSON.stringify(getBlock("fit_nov_6_g_b36").workouts)'), JSON.stringify(old.workouts));
  // generate() of a new profile builds the plan from the r2 file
  const r2 = JSON.parse(read('data/blocks/r2/fit_nov_6_g_b36_r2.json'));
  assert.equal(b.run(`generate(${JSON.stringify(prof('fit_nov_6_g_b36'))}).days[0].items.map(x=>x.exId).join(',')`), r2.workouts[0].items.map(x => x.exId).join(','));
});

test('R2_ON=true: a saved plan (old S.block.id, S.program, history, S.pg) is kept exactly after the update / reload', () => {
  const st0 = { lang: 'ru', goal: 'fit', days: 6, next: 3, obDone: 1, custom: [], body: [], prof: prof('fit_nov_6_g_b36'),
    block: { id: 'fit_nov_6_g_b36', next: 3 }, pg: { bp: { st: { success: 1, miss: 0 }, next: { weight: 40, sets: 3 }, first: 1, last: 2 } },
    workouts: [{ id: 'w1', start: now - DAY, end: now - DAY + 1, dayIdx: 0, dayName: 'A', items: [{ exId: 'bp', sets: [{ w: 40, r: 10, done: true }] }] }] };
  const b0 = boot({ state: st0 });
  b0.run(`S.program=planFromBlock(getBlock('fit_nov_6_g_b36'),S.prof).days;save()`);
  const saved = JSON.parse(b0.run(`localStorage.getItem('gym')`));
  const b = boot({ state: saved });
  b.run('R2_ON=true');
  assert.equal(b.run('S.block.id'), 'fit_nov_6_g_b36');
  assert.equal(b.run('JSON.stringify(S.program)'), JSON.stringify(saved.program));
  assert.equal(b.run('JSON.stringify(S.workouts)'), JSON.stringify(saved.workouts));
  assert.equal(b.run('JSON.stringify(S.pg)'), JSON.stringify(saved.pg));
  assert.equal(b.run('blockActive()'), true);
  assert.equal(b.run('getBlock(S.block.id).id'), 'fit_nov_6_g_b36', 'the active plan reads the old file');
});

test('r2 with health limitations: nothing risky left silently, no day without strength, cardio not lost (all 7 × 7 sets)', () => {
  const b = boot();
  const LIMS = [['s'], ['k'], ['p'], ['s', 'k'], ['s', 'p'], ['k', 'p'], ['s', 'k', 'p']];
  for (const id of READY) for (const lim of LIMS) {
    const r = b.J(`(()=>{const R=getBlock(${JSON.stringify(id + '_r2')});const pl=String(R.place);const a={goal:R.goal,level:R.level,days:R.days_per_week,place:pl.startsWith('b')?'b':pl,bar:false,sex:'m',lim:${JSON.stringify(lim)}};
      const isC=x=>x.cardio||isCardio(x.exId);const cm=Q=>Q.reduce((t,d)=>t+d.items.filter(isC).reduce((s,x)=>s+(x.min+x.max)/2*(x.sets||1),0),0);
      const Q=planFromBlock(R,a).days,Q0=planFromBlock(R,Object.assign({},a,{lim:[]})).days;
      return{silent:Q.reduce((n,d)=>n+d.items.filter(x=>!blockLimOk(x.exId,a)).length,0),empty:Q.filter(d=>!d.items.some(x=>!isC(x))).length,lost:cm(Q0)-cm(Q),
        rir:Q.every(d=>d.rirTarget),cls:Q.every(d=>d.items.every(x=>isC(x)||prCls(x.exId)))}})()`);
    assert.deepEqual(r, { silent: 0, empty: 0, lost: 0, rir: true, cls: true }, id + ' ' + lim.join(''));
  }
});

// ---------- gravitron only in the gym (decision D)
test('decision D: the gravitron is not offered at home (⇄ list, place check), still in the gym', () => {
  const b = boot();
  assert.equal(b.run('eqAvail("assisted-pullup","b")'), false);
  assert.equal(b.run('eqAvail("assisted-pullup","d")'), false);
  assert.equal(b.run('eqAvail("assisted-pullup","g")'), true);
  // the app passes the place of the equipment profile (features.js wraps swapModal with places)
  const list = place => b.run(`(()=>{swapModal('pull',{place:${JSON.stringify(place)},places:${JSON.stringify(place)},lim:[]},()=>{});return $('#modal').innerHTML})()`);
  assert.doesNotMatch(list('b'), /data-p="assisted-pullup"/);
  assert.doesNotMatch(list('d'), /data-p="assisted-pullup"/);
  assert.match(list('g'), /data-p="assisted-pullup"/);
  // no gym block lost it, no home block has it
  for (const f of fs.readdirSync(path.join(root, 'data/blocks')).filter(f => f.endsWith('.json'))) {
    const j = JSON.parse(fs.readFileSync(path.join(root, 'data/blocks', f), 'utf8'));
    if (JSON.stringify(j.workouts).includes('"assisted-pullup"')) assert.equal(j.place, 'g', f);
  }
});

// ---------- D2 (still OFF on LIVE)
test('D2: ON in the gym (v159), home off on its own; decisions C (no «p») kept', () => {
  assert.equal(P.PR_DOWN_ON, true);
  assert.deepEqual(P.PR_DOWN_PLACE, { g: true, b: false });
  assert.equal(P.prCls('pull').risk, '');
  assert.equal(P.prCls('assisted-pullup').risk, '');
});

function gym(extra) {
  const b = boot({ state: Object.assign({ lang: 'ru', goal: 'mass', days: 3, next: 0, obDone: 1, custom: [], body: [], pgSince: now - 10 * DAY,
    prof: { goal: 'mass', sex: 'm', level: 'nov', days: 3, len: 60, place: 'g', prio: [], lim: [] },
    workouts: [{ id: 'w0', start: now - 2 * DAY, end: now - 2 * DAY + 1, dayIdx: 0, dayName: 'A', items: [{ exId: 'pull', ns: 3, min: 5, max: 8, sets: [{ w: '', r: 0, done: true }] }] }],
    pg: { pull: { st: { success: 0, miss: 2 }, next: { weight: null, sets: 3, target: 5, note: 'miss2', down: 'assisted-pullup' }, first: 1, last: now - 2 * DAY } },
    program: [{ name: 'A', items: [{ exId: 'pull', sets: 3, min: 5, max: 8, rest: 120 }] }] }, extra || {}) });
  b.run('PR_DOWN_ON=true;globalThis.confirm=()=>true;startTimer=()=>{}');
  return b;
}
const finish = b => { b.run(`go('today');$('#fin').onclick()`); assert.equal(b.run('!!S.active'), false); };

test('D2 (switched on in the test): «0 kg» typed on the gravitron = no help → back to the source exercise; empty field → stays', () => {
  const b = gym();
  b.run('startW(0);workoutView();awDownSwap(S.active,0);S.active.items[0].sets.forEach(s=>{s.w=0;s.r=8;s.done=true})');
  finish(b);
  assert.equal(b.J('S.pg["assisted-pullup"]').next.id, 'pull');
  const c = gym();
  c.run('startW(0);workoutView();awDownSwap(S.active,0);S.active.items[0].sets.forEach(s=>{s.w="";s.r=8;s.done=true})');
  finish(c);
  assert.equal(c.J('S.pg["assisted-pullup"]').next.note, 'need_w');
});

test('D2: not offered when the equipment profile has no gravitron, or when it conflicts with the limitations; only by the button', () => {
  const b = gym({ prof: { goal: 'mass', sex: 'm', level: 'nov', days: 3, len: 60, place: 'g', places: 'b', prio: [], lim: [] } });
  b.run('startW(0);workoutView()');
  assert.doesNotMatch(b.run('awSugHTML(S.active.items[0],0)'), /data-awdown/);
  assert.equal(b.run('awDownSwap(S.active,0)'), false);
  assert.equal(b.run('S.active.items[0].exId'), 'pull');
  const c = gym();
  c.run('lgConf=id=>id==="assisted-pullup"?["p"]:[];startW(0);workoutView()');
  assert.doesNotMatch(c.run('awSugHTML(S.active.items[0],0)'), /data-awdown/);
  assert.equal(c.run('awDownSwap(S.active,0)'), false);
  const d = gym();
  d.run('startW(0);workoutView()');
  assert.equal(d.run('S.active.items[0].exId'), 'pull', 'nothing switched without the button');
  assert.match(d.run('awSugHTML(S.active.items[0],0)'), /data-awdown="0"/);
});

test('D2: old data without down / downFrom works as before (need_w only for the D2 step)', () => {
  const b = gym({ pg: { 'assisted-pullup': { st: { success: 1, miss: 0 }, next: { weight: null, sets: 3, target: 5 }, first: 1, last: now - 2 * DAY } },
    program: [{ name: 'A', items: [{ exId: 'assisted-pullup', sets: 3, min: 5, max: 8, rest: 120 }] }] });
  b.run('startW(0);workoutView();S.active.items[0].sets.forEach(s=>{s.w="";s.r=8;s.done=true})');
  finish(b);
  assert.equal(b.J('S.pg["assisted-pullup"]').next.id, 'pull', 'a gym-program gravitron keeps the old rule');
});

test('v158: cache version', () => {
  assert.match(read('cache-ver.js'), /var SW_CACHE='moyzal-v170'/);
});
