'use strict';
// v157 — review-nov-2 closeout, D2 fixes before switching it on for the gym (PR_DOWN_ON stays false on LIVE):
//  1) the gravitron taken as the easier step with no counterweight written does not send the user back to pull-ups;
//  2) the way back leads to the exercise the user came from (chin stays chin), then the plan item is the original again.
const test = require('node:test');
const assert = require('node:assert/strict');
const { boot, read } = require('./fixtures/tf1-boot.js');
const P = require('../progress.js');
const DAY = 864e5, now = Date.now();

test('v159: ON in the gym only (Eduards, decision A); home off', () => {
  assert.equal(P.PR_DOWN_ON, true);
  assert.deepEqual(P.PR_DOWN_PLACE, { g: true, b: false });
  assert.equal(P.prDownStep('pull', 'g', []), 'assisted-pullup');
  assert.equal(P.prDownStep('pull', 'b', []), null);
});

test('fix 1: need_w + empty counterweight → stays on the gravitron (need_w), also on calibration; with kg → normal steps', () => {
  const a = (w, extra) => P.prNext(Object.assign({ id: 'assisted-pullup', level: 'nov', range: [5, 8], sets_plan: 3, weight: w, results: [8, 8, 8], state: { success: 1 }, place: 'g', need_w: true }, extra || {}));
  assert.deepEqual([a(null).note, a(null).id], ['need_w', 'assisted-pullup']);
  assert.deepEqual([a(null, { calibration: true }).note, a(null, { calibration: true }).id], ['need_w', 'assisted-pullup']);
  assert.deepEqual([a(20).note, a(20).weight], ['inc', 15], 'counterweight −5 kg');
  assert.deepEqual([a(5).note, a(5).id], ['ladder', 'pull'], 'counterweight reached 0 → ladder');
  // gravitron of a gym program (not from the D2 button) keeps the old rule
  const old = P.prNext({ id: 'assisted-pullup', level: 'nov', range: [5, 8], sets_plan: 3, weight: null, results: [8, 8, 8], state: { success: 1 }, place: 'g' });
  assert.equal(old.note, 'ladder');
});

function gym(fromId) {
  const b = boot({ state: { lang: 'ru', goal: 'mass', days: 3, next: 0, obDone: 1, custom: [], body: [], pgSince: now - 10 * DAY,
    prof: { goal: 'mass', sex: 'm', level: 'nov', days: 3, len: 60, place: 'g', prio: [], lim: [] },
    workouts: [{ id: 'w0', start: now - 2 * DAY, end: now - 2 * DAY + 1, dayIdx: 0, dayName: 'A', items: [{ exId: fromId, ns: 3, min: 5, max: 8, sets: [{ w: '', r: 0, done: true }, { w: '', r: 1, done: true }] }] }],
    pg: { [fromId]: { st: { success: 0, miss: 2 }, next: { weight: null, sets: 3, target: 5, note: 'miss2', down: 'assisted-pullup' }, first: 1, last: now - 2 * DAY } },
    program: [{ name: 'A', items: [{ exId: fromId, sets: 3, min: 5, max: 8, rest: 120 }] }] } });
  b.run('PR_DOWN_ON=true;globalThis.confirm=()=>true;startTimer=()=>{}');
  return b;
}
const finish = b => { b.run(`go('today');$('#fin').onclick()`); assert.equal(b.run('!!S.active'), false); };

test('fix 2: chin → gravitron by the button → counterweight to 0 → «Пора усложнить» leads back to chin (not pull)', () => {
  const b = gym('chin');
  b.run('startW(0);workoutView()');
  assert.equal(b.run('awDownSwap(S.active,0)'), true);
  assert.equal(b.run('S.active.items[0].exId'), 'assisted-pullup');
  assert.equal(b.run('S.program[0].items[0].downFrom'), 'chin');
  // session 1: no counterweight written → stays (need_w), no ladder
  b.run('S.active.items[0].sets.forEach(s=>{s.w="";s.r=8;s.done=true})');
  finish(b);
  assert.equal(b.J('S.pg["assisted-pullup"]').next.note, 'need_w');
  assert.equal(b.run('"id" in S.pg["assisted-pullup"].next'), false);
  assert.equal(b.run('S.program[0].items[0].exId'), 'assisted-pullup');
  // sessions with 5 kg help at the top of the range → 0 kg → back to chin
  for (let i = 0; i < 3; i++) {
    b.run('startW(0);workoutView();S.active.items[0].sets.forEach(s=>{s.w=5;s.r=8;s.done=true})');
    finish(b);
    if (b.J('S.pg["assisted-pullup"]').next.id) break;
  }
  assert.equal(b.J('S.pg["assisted-pullup"]').next.id, 'chin');
  // the ladder button puts chin back into the plan and forgets downFrom; history of both stays
  b.run('startW(0);workoutView()');
  assert.equal(b.run('S.active.items[0].sug.to'), 'chin');
  b.run(`(()=>{const it=S.active.items[0],from=it.exId,to=it.sug.to;it.exId=to;delete it.downFrom;const pi=S.program[0].items.find(x=>x.exId===from);pi.exId=to;delete pi.downFrom})()`);
  assert.equal(b.run('S.program[0].items[0].exId'), 'chin');
  assert.equal(b.run('"downFrom" in S.program[0].items[0]'), false);
  assert.ok(b.J('S.workouts.filter(w=>w.items.some(i=>i.exId==="chin")).length') >= 1, 'chin history kept');
  assert.ok(b.J('S.workouts.filter(w=>w.items.some(i=>i.exId==="assisted-pullup")).length') >= 2, 'gravitron history kept');
  assert.deepEqual(b.J('S.pg.chin.st'), { success: 0, miss: 2 }, 'S.pg of chin untouched while on the gravitron');
});

test('fix 2: the ladder button code also clears downFrom (source check)', () => {
  const src = read('autow.js');
  // v160: the button logic is in awLadderSwap (tested by behaviour in v160-live.test.js)
  assert.match(src, /\[data-awlad\]'\)\.forEach\(b=>b\.onclick=\(\)=>\{if\(awLadderSwap\(A,\+b\.dataset\.awlad\)\)workoutView\(\)\}\)/);
  assert.match(src, /it\.exId=to;delete it\.downFrom;if\(pi\)\{pi\.exId=to;delete pi\.downFrom\}/);
  assert.match(src, /if\(to&&o\.note==='ladder'&&df\)to=df;/);
});

test('pull → gravitron → back to pull; need_w note has RU/EN/LV', () => {
  const b = gym('pull');
  b.run('startW(0);workoutView();awDownSwap(S.active,0)');
  assert.equal(b.run('S.program[0].items[0].downFrom'), 'pull');
  b.run('S.active.items[0].sets.forEach(s=>{s.w=5;s.r=8;s.done=true})');
  finish(b);  // calibration at the top with 5 kg help → trainer rule cal_up: 5 − 5 = 0 kg → ladder
  assert.equal(b.J('S.pg["assisted-pullup"]').next.id, 'pull');
  assert.match(read('i18n/dict3.js'), /\['Запиши противовес в кг — без него прогрессию не посчитать','Log the assistance weight in kg[^']*(\\'[^']*)*','Ieraksti pretsvaru \(kg\) — bez tā progresiju nevar aprēķināt'\]/);
});

test('v157: cache version', () => {
  assert.match(read('cache-ver.js'), /var SW_CACHE='moyzal-v164'/);
});
