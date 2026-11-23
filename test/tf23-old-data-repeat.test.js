'use strict';
// tech-fix-2.3 (P2): old data without S.block.passAt. The whole block was done, the repeat began, the LAST day of the block
// was done first, then day 1, then a limitation → the last day must not be changed (2.2 took that last-day workout for the
// end of the previous pass). When the end of the previous pass is not certain (the stretch before it is not a full pass),
// the days of that stretch are 'unsure': never changed automatically, the user is asked; history and S.pg are never changed.
const test = require('node:test');
const assert = require('node:assert/strict');
const { boot, DAY } = require('./fixtures/tf1-boot.js');

const now = Date.now();
const BID = 'str_adv_5_g_b35';
function st() {
  return { lang: 'ru', goal: 'str', days: 5, next: 0, prof: { goal: 'str', sex: 'm', level: 'adv', days: 5, len: 90, place: 'g', prio: [], lim: [] },
    workouts: [], custom: [], body: [], pg: { sq: { st: { success: 2, miss: 0 }, next: { weight: 100 } } }, pgSince: now - 90 * DAY };
}
function plan(b, next) {
  b.run(`S.block={id:${JSON.stringify(BID)},next:${next}};S.next=${next};S.program=planFromBlock(getBlock(${JSON.stringify(BID)}),{goal:'str',level:'adv',days:5,place:'g',lim:[]}).days;save()`);
}
function hist(b, i, at) {
  b.run(`(()=>{const d=S.program[${i}];S.workouts.push({id:'h${i}_${at}',start:${at},dayIdx:${i},dayName:d.name,n:d.n,notes:'',items:[{exId:'sq',ns:3,sets:[{w:50,r:5,done:true}]}]})})()`);
}
const snap = (b, i) => b.run(`JSON.stringify(S.program[${i}])`);
const HP = b => b.run('JSON.stringify({w:S.workouts,pg:S.pg})');
// whole first pass (old data: no passAt), then «Повторить блок» on the old app (no passAt either)
function firstPassAndRepeat(b) {
  plan(b, 0);
  const n = b.run('S.program.length');
  for (let i = 0; i < n; i++) hist(b, i, now - 80 * DAY + i * DAY);
  b.run(`S.block.next=${n};repeatBlock(S);delete S.block.passAt;save()`);
  return n;
}
// GPT scenario: in the repeat the LAST day first, then day 1, then knees
function gptScenario(b) {
  const n = firstPassAndRepeat(b);
  hist(b, n - 1, now - 3 * DAY);
  hist(b, 0, now - 2 * DAY);
  b.run(`finishBlockWorkout(S,getBlock(${JSON.stringify(BID)}));S.prof.lim=['k'];save()`);
  return n;
}

test('tf2.3 P2: old data, repeat — last day done first, then day 1, then knees → the last day is not changed by «Заменить безопасными»', () => {
  const b = boot({ state: st() });
  const n = gptScenario(b);
  assert.equal(b.run('S.block.next'), 1);
  assert.equal(b.run('S.block.passAt'), undefined, 'old data: no passAt');
  assert.ok(b.J(`!!lgAuditDay(S.program[${n - 1}])`), 'the last day has knee-risky exercises');
  const before = snap(b, n - 1), H = HP(b);
  assert.ok(b.J(`lgDayLocked(${n - 1})`), 'last day treated as finished / unsure, not upcoming');
  assert.ok(!b.J('lgAuditPlan().map(x=>x.d)').includes(n - 1));
  const fixed = b.run('lgFixAll()');
  assert.ok(fixed > 0, 'upcoming days are still fixed');
  assert.equal(snap(b, n - 1), before, 'last day unchanged');
  assert.equal(HP(b), H, 'S.workouts and S.pg unchanged');
});

test('tf2.3 P2: the ambiguous day is shown with a question; it changes only after the user confirms; history and S.pg kept', () => {
  const b = boot({ state: st() });
  const n = gptScenario(b);
  assert.equal(b.J(`lgDayLocked(${n - 1})`), 'unsure');
  assert.deepEqual(b.J('lgAuditUnsure().map(x=>x.d)'), [n - 1]);
  const html = b.J(`lgPlanCardHTML(lgAuditPlan(),lgAuditUnsure())`);
  assert.match(html, /Не удалось точно определить/);
  assert.match(html, /id="lgfixunsure"/);
  b.run('lgFixAll()');
  const before = snap(b, n - 1), H = HP(b);
  // after «Заменить безопасными» the card still shows the question only (no fix-all buttons)
  const html2 = b.J(`lgPlanCardHTML(lgAuditPlan(),lgAuditUnsure())`);
  assert.equal(b.J('lgAuditPlan().length'), 0);
  assert.doesNotMatch(html2, /id="lgfixall"/);
  assert.match(html2, /id="lgfixunsure"/);
  assert.equal(snap(b, n - 1), before);
  assert.ok(b.run('lgFixUnsure()') > 0, 'user confirmed → the day is fixed');
  assert.notEqual(snap(b, n - 1), before);
  assert.equal(b.J(`!!lgAuditDay(S.program[${n - 1}])`), false);
  assert.equal(HP(b), H, 'S.workouts and S.pg unchanged');
});

test('tf2.3 P2: starting the ambiguous day («Заменить и начать») changes only that workout, the plan day stays', () => {
  const b = boot({ state: st() });
  const n = gptScenario(b);
  const d = snap(b, n - 1);
  b.run(`lgStartFix(${n - 1})`);
  assert.ok(b.run('!!S.active'));
  assert.equal(snap(b, n - 1), d);
  assert.equal(b.run(`S.active.items.some(x=>blockLimConf(x.exId,{lim:['k']}).length)`), false);
});

test('tf2.3 P2: first pass, old data — last day done before day 1 (no earlier history) → not changed (unsure)', () => {
  const b = boot({ state: st() });
  plan(b, 0);
  const n = b.run('S.program.length');
  hist(b, n - 1, now - 3 * DAY);
  hist(b, 0, now - 2 * DAY);
  b.run(`finishBlockWorkout(S,getBlock(${JSON.stringify(BID)}));S.prof.lim=['k'];save()`);
  const before = snap(b, n - 1);
  assert.equal(b.J(`lgDayLocked(${n - 1})`), 'unsure');
  b.run('lgFixAll()');
  assert.equal(snap(b, n - 1), before);
});

test('tf2.3 non-regression: old data, repeat done in order (day 1, day 2) → no question; days done only in the 1st pass are upcoming and fixed', () => {
  const b = boot({ state: st() });
  const n = firstPassAndRepeat(b);
  hist(b, 0, now - 3 * DAY);
  hist(b, 1, now - 2 * DAY);
  b.run(`finishBlockWorkout(S,getBlock(${JSON.stringify(BID)}));finishBlockWorkout(S,getBlock(${JSON.stringify(BID)}));S.prof.lim=['k'];save()`);
  assert.equal(b.run('S.block.next'), 2);
  assert.equal(b.J('lgAuditUnsure().length'), 0);
  assert.equal(b.J(`lgDayLocked(${n - 1})`), false, 'last day was done only in the 1st pass → upcoming');
  assert.equal(b.J('lgDayLocked(2)'), false);
  const H = HP(b);
  b.run('lgFixAll()');
  assert.equal(b.J(`!!lgAuditDay(S.program[${n - 1}])`), false, 'upcoming last day fixed');
  assert.equal(b.J('!!lgAuditDay(S.program[2])'), false);
  assert.equal(HP(b), H);
});

test('tf2.3 migration: saved old state (no passAt) → restart keeps the lock; after «Повторить блок» on the new app passAt is set, no question', () => {
  const b = boot({ state: st() });
  const n = gptScenario(b);
  const saved = b.run(`localStorage.getItem('gym')`);
  const b2 = boot({ ls: { gym: saved } });
  assert.equal(b2.run('S.block.passAt'), undefined);
  assert.equal(b2.J(`lgDayLocked(${n - 1})`), 'unsure');
  const before = snap(b2, n - 1);
  b2.run('lgFixAll()');
  assert.equal(snap(b2, n - 1), before);
  // later the user repeats the block on the new app → passAt stored → boundaries are exact
  b2.run(`S.block.next=${n};repeatBlock(S);save()`);
  assert.ok(b2.run('S.block.passAt') > 0);
  assert.equal(b2.J('lgAuditUnsure().length'), 0);
  assert.equal(b2.J(`lgDayLocked(${n - 1})`), false);
});
