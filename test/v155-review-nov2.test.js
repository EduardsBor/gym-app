'use strict';
// v155 — review-nov-2-final-check, tasks for the programmer:
//  1) progression classes for towel-row, backpack-row, towel-leg-curl, towel-iso-curl, superman (RIR line, safe auto-weight);
//  2) pull / chin easier step on misses below the range (prepared, OFF: PR_DOWN_ON=false until the owner decides);
//  3) knees: jump → walk-brisk at home (allowed without a clip), never in the gym, never against another limitation.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { boot, root, read } = require('./fixtures/tf1-boot.js');
const P = require('../progress.js');
const DAY = 864e5, now = Date.now();
const FIVE = ['towel-row', 'backpack-row', 'towel-leg-curl', 'towel-iso-curl', 'superman'];

// ---------- 1. classes
test('P1: every non-cardio exercise of data/blocks has a progression class; unit "sec" items are time classes', () => {
  const b = boot();
  const miss = [];
  for (const f of fs.readdirSync(path.join(root, 'data/blocks')).filter(f => f.endsWith('.json'))) {
    const j = JSON.parse(fs.readFileSync(path.join(root, 'data/blocks', f), 'utf8'));
    for (const w of j.workouts || []) for (const it of w.items || []) {
      if (it.cardio) continue;
      const eq = b.run(`(()=>{const c=awCls(${JSON.stringify(it.exId)});return c?c.eq:null})()`);
      if (!eq) miss.push(it.exId);
      if (it.unit === 'sec' && FIVE.includes(it.exId)) assert.equal(eq, 'time', it.exId + ' is logged in seconds');
    }
  }
  assert.deepEqual([...new Set(miss)], []);
});

test('P1: the five classes — equipment, region and risk letters match the cards / META', () => {
  const c = id => P.prCls(id);
  assert.deepEqual([c('towel-row').eq, c('towel-row').region, c('towel-row').risk], ['bodyweight', 'upper', '']);
  assert.deepEqual([c('backpack-row').eq, c('backpack-row').region, c('backpack-row').risk], ['dumbbell', 'upper', 's']);
  assert.deepEqual([c('towel-leg-curl').eq, c('towel-leg-curl').region, c('towel-leg-curl').risk], ['bodyweight', 'lower', '']);
  assert.deepEqual([c('towel-iso-curl').eq, c('towel-iso-curl').region], ['time', 'upper']);
  assert.deepEqual([c('superman').eq, c('superman').region, c('superman').risk], ['bodyweight', 'core', 's']);
  // risk letters agree with META (owner question 8: towel-leg-curl stays without «k»)
  const b = boot();
  for (const id of FIVE) assert.equal(P.prCls(id).risk, b.run(`blockRisk(${JSON.stringify(id)})`), id);
});

test('P1: RIR line is shown for towel-row (was missing), with a knee limitation towel-leg-curl gets +1', () => {
  const b = boot({ state: { lang: 'ru', goal: 'fit', days: 3, next: 0, obDone: 1, workouts: [], custom: [], body: [], pg: {},
    prof: { goal: 'fit', sex: 'm', level: 'nov', days: 3, len: 60, place: 'b', prio: [], lim: ['k'] },
    program: [{ name: 'A', items: [{ exId: 'towel-row', sets: 3, min: 8, max: 15, rest: 60 }, { exId: 'towel-leg-curl', sets: 3, min: 12, max: 20, rest: 60 }] }] } });
  b.run(`startTimer=()=>{};S.active={id:'a1',start:Date.now(),dayIdx:0,dayName:'A',notes:'',items:[
    {exId:'towel-row',ns:3,rest:60,min:8,max:15,sets:[0,1,2].map(()=>({w:'',r:15,done:false}))},
    {exId:'towel-leg-curl',ns:3,rest:60,min:12,max:20,sets:[0,1,2].map(()=>({w:'',r:20,done:false}))}]};save();workoutView()`);
  const h0 = b.run('awSugHTML(S.active.items[0],0)'), h1 = b.run('awSugHTML(S.active.items[1],1)');
  assert.match(h0, /Запас<\/span> 2–3/);
  assert.match(h1, /Запас<\/span> 3–4/, 'knee limitation applies to the lower-body curl');
});

const bw = (id, st, extra) => P.prNext(Object.assign({ id, level: 'nov', range: [8, 15], sets_plan: 3, weight: null, results: [15, 15, 15], state: st }, extra || {}));
test('P1: bodyweight modifier caps — towel-row up to pause, superman tempo only, never the backpack', () => {
  let st = { success: 1 }, out;
  const seen = [];
  for (let i = 0; i < 6; i++) { out = bw('towel-row', st); seen.push(out.modKey); st = Object.assign({}, out.state, { success: 1 }); }
  assert.ok(!seen.includes('load'), 'no backpack on the towel row: ' + seen);
  assert.equal(seen[seen.length - 1], 'pause');
  assert.equal(out.weight, null);
  st = { success: 1 }; const sm = [];
  for (let i = 0; i < 5; i++) { out = bw('superman', st); sm.push(out.modKey); st = Object.assign({}, out.state, { success: 1 }); }
  assert.deepEqual([...new Set(sm)], ['tempo']);
  assert.equal(out.weight, null);
  // other bodyweight exercises keep the trainer ladder (backpack included)
  st = { success: 1 }; const pu = [];
  for (let i = 0; i < 4; i++) { out = bw('pu', st); pu.push(out.modKey); st = Object.assign({}, out.state, { success: 1 }); }
  assert.deepEqual(pu, ['tempo', 'pause', 'load', 'load']);
});

test('P1: towel-leg-curl — up to pause without limitations; with a knee limitation no automatic step at all, 2 sessions, RIR +1', () => {
  let st = { success: 1 }, out; const seen = [];
  for (let i = 0; i < 5; i++) { out = bw('towel-leg-curl', st, { range: [12, 20], results: [20, 20, 20] }); seen.push(out.modKey); st = Object.assign({}, out.state, { success: 1 }); }
  assert.ok(!seen.includes('load'));
  assert.equal(seen[seen.length - 1], 'pause');
  const k1 = bw('towel-leg-curl', {}, { range: [12, 20], results: [20, 20, 20], flags: ['k'] });
  assert.equal(k1.note, 'same', 'one session at the top is not enough with a limitation');
  assert.deepEqual(k1.rir, [3, 4]);
  const k2 = bw('towel-leg-curl', { success: 1 }, { range: [12, 20], results: [20, 20, 20], flags: ['k'] });
  assert.equal(k2.mod, 0);
  assert.equal(k2.modKey, '');
  assert.equal(k2.weight, null);
  // a knee limitation does not cap the upper-body towel row
  assert.equal(bw('towel-row', { success: 1 }, { flags: ['k'] }).modKey, 'tempo');
});

test('P1: backpack-row progresses by backpack kg (next available weight), calibration without history, no bodyweight +5 kg', () => {
  const o = P.prNext({ id: 'backpack-row', level: 'nov', range: [8, 15], sets_plan: 3, weight: 8, results: [15, 15, 15], state: { success: 1 } });
  assert.equal(o.note, 'inc');
  assert.equal(o.weight, 9);
  const m = P.prNext({ id: 'backpack-row', level: 'nov', range: [8, 15], sets_plan: 3, weight: 8, results: [6, 5, 5], state: { miss: 2 } });
  assert.equal(m.note, 'miss3');
  assert.ok(m.weight < 8);
});

test('P1: towel-iso-curl — seconds: +1 s per workout up to 10 s, then hold (no ladder, no load)', () => {
  const t = (target, res) => P.prNext({ id: 'towel-iso-curl', level: 'nov', range: [5, 10], sets_plan: 3, weight: null, results: res, target });
  assert.deepEqual([t(5, [5, 5, 5]).target, t(5, [5, 5, 5]).note], [6, 'time_up']);
  assert.deepEqual([t(10, [10, 10, 10]).target, t(10, [10, 10, 10]).note], [10, 'hold_max']);
  assert.equal(t(10, [10, 10, 10]).weight, null);
});

test('P1: finishing a workout writes S.pg for the five; history unchanged; repeated finish keeps it', () => {
  const b = boot({ state: { lang: 'ru', goal: 'fit', days: 3, next: 0, obDone: 1, workouts: [], custom: [], body: [], pg: {}, pgSince: now - 40 * DAY,
    prof: { goal: 'fit', sex: 'm', level: 'nov', days: 3, len: 60, place: 'b', prio: [], lim: [] },
    program: [{ name: 'A', items: FIVE.map(id => ({ exId: id, sets: 3, min: id === 'towel-iso-curl' ? 5 : 8, max: id === 'towel-iso-curl' ? 10 : 15, rest: 60 })) }] } });
  b.run(`startTimer=()=>{};startW(0)`);
  b.run(`S.active.items.forEach(it=>it.sets.forEach(s=>{s.r=it.max;s.w=it.exId==='backpack-row'?8:'';s.done=true}))`);
  const items = b.J('S.active.items.map(it=>({exId:it.exId,sets:it.sets.map(s=>[s.w,s.r])}))');
  b.run(`go('today');$('#fin').onclick()`);
  assert.equal(b.run('!!S.active'), false);
  const W = b.J('S.workouts[0].items.map(it=>({exId:it.exId,sets:it.sets.map(s=>[s.w,s.r])}))');
  assert.deepEqual(W, items, 'history is the done sets as entered');
  for (const id of FIVE) assert.ok(b.J(`S.pg[${JSON.stringify(id)}]`).next, id + ' has S.pg');
  assert.equal(b.J('S.pg["towel-iso-curl"]').next.target, 6, 'first workout: target 5 s held → +1 s (time step), never above 10');
});

// ---------- 2. pull-up easier step (prepared, OFF)
test('P2 (v159: ON in the gym) — pull with 0 reps: gym offers the gravitron, home with a bar offers nothing', () => {
  assert.equal(P.PR_DOWN_ON, true);
  const q = place => P.prNext({ id: 'pull', level: 'nov', range: [5, 8], sets_plan: 3, weight: null, results: [0, 0, 0], state: { miss: 1 }, place });
  assert.deepEqual([q('g').note, q('g').down], ['miss2', 'assisted-pullup']);
  assert.deepEqual([q('b').note, q('b').down], ['miss2', undefined]);
});

test('P2: when switched on — gym → gravitron, home with a bar → scap pull-ups (never the gravitron at home); not on the first miss', () => {
  const b = boot();
  b.run('PR_DOWN_ON=true');
  const q = (place, st, res, extra) => b.J(`prNext(Object.assign({id:'pull',level:'nov',range:[5,8],sets_plan:3,weight:null,results:${JSON.stringify(res)},state:${JSON.stringify(st)},place:${JSON.stringify(place)}},${JSON.stringify(extra || {})}))`);
  // v157 (closeout, decision B): home with a bar is off on its own until negative pull-ups exist
  assert.deepEqual(b.J('PR_DOWN_PLACE'), { g: true, b: false });
  assert.equal(q('b', { miss: 1 }, [0, 0, 0]).down, undefined, 'home: off by default');
  b.run('PR_DOWN_PLACE.b=true');
  assert.equal(q('g', { miss: 1 }, [0, 0, 0]).down, 'assisted-pullup');
  assert.equal(q('b', { miss: 1 }, [0, 1, 0]).down, 'scap-pullup');
  assert.equal(q('d', { miss: 1 }, [0, 0, 0]).down, undefined, 'no bar at home with dumbbells: no step');
  assert.equal(q('g', {}, [0, 0, 0]).down, undefined, 'first miss: no offer yet');
  assert.equal(q('g', { miss: 1 }, [5, 3, 2]).down, undefined, 'lower bound reached in a set: no offer');
  assert.equal(q('b', {}, [0, 0, 0], { calibration: true }).down, 'scap-pullup', 'calibration below the range');
  assert.equal(q('g', { miss: 2 }, [0, 0, 0]).down, 'assisted-pullup', 'miss3 still offers');
  // the way back is the existing ladder
  assert.equal(b.J('PR_LADDER["assisted-pullup"].to'), 'pull');
  assert.equal(b.J('PR_LADDER["scap-pullup"].to'), 'pull');
  // card + clip exist for each step at its place
  assert.equal(b.run('movekitFile("assisted-pullup")!==""&&movekitFile("scap-pullup")!==""'), true);
  assert.equal(b.run('eqAvail("scap-pullup","b")'), true);
});

test('P2: when switched on — the user switches only with the button; history of pull stays; program day item follows', () => {
  const b = boot({ state: { lang: 'ru', goal: 'mass', days: 3, next: 0, obDone: 1, custom: [], body: [], pgSince: now - 40 * DAY,
    prof: { goal: 'mass', sex: 'm', level: 'nov', days: 3, len: 60, place: 'g', prio: [], lim: [] },
    workouts: [{ id: 'w0', start: now - 2 * DAY, end: now - 2 * DAY + 1, dayIdx: 0, dayName: 'A', items: [{ exId: 'pull', ns: 3, min: 5, max: 8, sets: [{ w: '', r: 0, done: true }, { w: '', r: 0, done: true }] }] }],
    pg: { pull: { st: { success: 0, miss: 2 }, next: { weight: null, sets: 2, target: 5, note: 'miss2', down: 'assisted-pullup' }, first: 1, last: now - 2 * DAY } },
    program: [{ name: 'A', items: [{ exId: 'pull', sets: 3, min: 5, max: 8, rest: 120 }] }] } });
  b.run('PR_DOWN_ON=true;startTimer=()=>{};startW(0);workoutView()');
  assert.equal(b.run('S.active.items[0].exId'), 'pull', 'not switched silently');
  const h = b.run('awSugHTML(S.active.items[0],0)');
  assert.match(h, /data-awdown="0"/);
  assert.match(h, /Нижняя граница пока не выходит/);
  assert.match(read('autow.js'), /\[data-awdown\]'\)\.forEach\(b=>b\.onclick=\(\)=>\{if\(awDownSwap\(A,\+b\.dataset\.awdown\)\)workoutView\(\)\}\)/);
  assert.equal(b.run('awDownSwap(S.active,0)'), true);
  assert.equal(b.run('S.active.items[0].exId'), 'assisted-pullup');
  assert.equal(b.run('S.program[0].items[0].exId'), 'assisted-pullup');
  assert.equal(b.J('S.workouts[0].items[0].exId'), 'pull', 'history unchanged');
  assert.equal(b.run('"down" in S.pg.pull.next'), false);
  assert.deepEqual(b.J('S.pg.pull.st'), { success: 0, miss: 2 });
});

test('P2: dict3 has RU/EN/LV for the offer', () => {
  assert.match(read('i18n/dict3.js'), /\['Нижняя граница пока не выходит — можно взять более лёгкий вариант','[^']*(\\'[^']*)*','Vēl nevari sasniegt apakšējo robežu — vari izvēlēties vieglāku variantu'\]/);
});

// ---------- 3. knees: jump → walk-brisk at home
test('P3: home + knees — jump becomes walk-brisk with the same minutes (work cardio and warm-up), with a note', () => {
  const b = boot();
  const r = b.J(`(()=>{const B=getBlock('fit_nov_6_b_nobar_b36');const a={goal:B.goal,level:B.level,days:B.days_per_week,place:'b',bar:false,sex:'m',lim:['k']};
    const p=planFromBlock(B,a);const B0=planFromBlock(B,Object.assign({},a,{lim:[]}));
    return p.days.map((d,i)=>({jump:d.items.filter(x=>x.exId==='jump').length,walk:d.items.filter(x=>x.exId==='walk-brisk').map(x=>[x.min,x.max]),
      jump0:B0.days[i].items.filter(x=>x.exId==='jump').map(x=>[x.min,x.max]),walk0:B0.days[i].items.filter(x=>x.exId==='walk-brisk').length,
      wu:d.wu&&d.wu.cardio&&d.wu.cardio.id,wu0:B0.days[i].wu&&B0.days[i].wu.cardio&&B0.days[i].wu.cardio.id,
      notes:(d.limWarn||[]).filter(w=>w.from==='jump').map(w=>w.to)}))})()`);
  let swapped = 0;
  r.forEach((d, i) => {
    assert.equal(d.jump, 0, 'day ' + i + ': no jump with knees');
    if (d.jump0.length) { swapped++; assert.deepEqual(d.walk.slice(-d.jump0.length), d.jump0, 'day ' + i + ': same minutes'); assert.ok(d.notes.includes('walk-brisk'), 'visible note'); }
    if (d.wu0 === 'jump') assert.equal(d.wu, 'walk-brisk', 'day ' + i + ': warm-up');
  });
  assert.ok(swapped >= 3, 'jump days: ' + swapped);
});

test('P3: walk-brisk is never picked in the gym; another limitation still blocks a conflicting pick; no limitation → no change', () => {
  const b = boot();
  const r = b.J(`(()=>{const it=[{exId:'jump',cardio:1,sets:1,min:7,max:12,rest:0}];
    const W1=[];const g=blockLimSwap(it,{lim:['k'],place:'g'},W1);
    const W2=[];const h=blockLimSwap(it,{lim:['k','s','p'],place:'b',bar:false},W2);
    const W3=[];const n=blockLimSwap(it,{lim:[],place:'b'},W3);
    return{g:g.map(x=>x.exId),h:h.map(x=>x.exId),hr:blockRisk('walk-brisk'),n:n.map(x=>x.exId),W3}})()`);
  assert.ok(!r.g.includes('walk-brisk'), 'gym: ' + r.g);
  assert.ok(!r.g.includes('jump'));
  assert.deepEqual(r.h, ['walk-brisk'], 'walk-brisk has no risk letter, so all three limitations allow it');
  assert.equal(r.hr, '');
  assert.deepEqual(r.n, ['jump']);
  assert.deepEqual(r.W3, []);
  // clip rule: a strength exercise without a clip is still never picked
  assert.equal(b.run('blockClipOk("negative-pullup",{place:"b"})'), false);
  assert.equal(b.run('blockClipOk("walk-brisk",{place:"g"})'), false);
  assert.equal(b.run('blockClipOk("walk-brisk",{place:"b"})'), true);
});

// ---------- 4. r2 revisions: not connected (data unchanged)
test('P4: r2 revisions are not connected — no *_r2 blocks in data/blocks, saved plans untouched', () => {
  const ids = fs.readdirSync(path.join(root, 'data/blocks')).filter(f => /_r2\.json$/.test(f));
  assert.deepEqual(ids, []);
});

test('v155: cache version', () => {
  assert.match(read('cache-ver.js'), /var SW_CACHE='moyzal-v170'/);
});
