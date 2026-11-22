'use strict';
// tech-fix-2.2 (defect 2): a block day done out of order BEFORE day 1 of the current pass was not treated as finished
// (the pass start was the last day-1 workout) → «Заменить безопасными» changed it. Now the pass start is stored
// (S.block.passAt: block start, repeat, next level; kept by migrateBlockState); old data without it → derived from history.
const test = require('node:test');
const assert = require('node:assert/strict');
const { boot, DAY } = require('./fixtures/tf1-boot.js');

const now = Date.now();
const BID = 'str_adv_5_g_b35';
function st() {
  return { lang: 'ru', goal: 'str', days: 5, next: 0, prof: { goal: 'str', sex: 'm', level: 'adv', days: 5, len: 90, place: 'g', prio: [], lim: [] },
    workouts: [], custom: [], body: [], pg: { sq: { st: { success: 1, miss: 0 }, next: { weight: 100 } } }, pgSince: now - 40 * DAY };
}
function plan(b, next, passAt) {
  b.run(`S.block={id:${JSON.stringify(BID)},next:${next}${passAt != null ? ',passAt:' + passAt : ''}};S.next=${next};S.program=planFromBlock(getBlock(${JSON.stringify(BID)}),{goal:'str',level:'adv',days:5,place:'g',lim:[]}).days;save()`);
}
function hist(b, i, at) {
  b.run(`(()=>{const d=S.program[${i}];S.workouts.push({id:'h${i}_${at}',start:${at},dayIdx:${i},dayName:d.name,n:d.n,notes:'',items:[{exId:'sq',ns:3,sets:[{w:50,r:5,done:true}]}]})})()`);
}
const snap = (b, i) => b.run(`JSON.stringify(S.program[${i}])`);
// first day index ≥ from that has knee-risky exercises
const riskyDay = (b, from) => b.J(`(()=>{const l=S.prof.lim;S.prof.lim=['k'];const i=S.program.findIndex((d,j)=>j>=${from}&&lgAuditDay(d));S.prof.lim=l;return i})()`);

for (const stored of [true, false]) {
  const tag = stored ? 'S.block.passAt' : 'old data without passAt';
  test(`tf2.2 out of order (${tag}): day №4 done, then day №1, then knees → day №4 is not changed; history and S.pg kept`, () => {
    const b = boot({ state: st() });
    const t0 = now - 10 * DAY;
    plan(b, 0, stored ? t0 : null);
    const d4 = riskyDay(b, 3);
    assert.ok(d4 >= 3, 'a later day with knee-risky exercises');
    hist(b, d4, now - 5 * DAY);            // future day done first (S.block.next not advanced)
    hist(b, 0, now - 4 * DAY);             // then day 1 → next = 1
    b.run(`finishBlockWorkout(S,getBlock(${JSON.stringify(BID)}));S.prof.lim=['k'];save()`);
    assert.equal(b.run('S.block.next'), 1);
    const before = snap(b, d4), H = b.run('JSON.stringify({w:S.workouts,pg:S.pg})');
    assert.equal(b.J(`lgDayLocked(${d4})`), 'done');
    assert.ok(!b.J('lgAuditPlan().map(x=>x.d)').includes(d4));
    b.run('lgFixAll()');
    assert.equal(snap(b, d4), before, 'day №' + (d4 + 1) + ' unchanged');
    assert.equal(b.run('JSON.stringify({w:S.workouts,pg:S.pg})'), H);
  });
}

test('tf2.2 second pass: after «Повторить блок» the days of the first pass are upcoming again; a day done out of order in the 2nd pass (before its day 1) is kept', () => {
  const b = boot({ state: st() });
  plan(b, 0, now - 30 * DAY);
  const n = b.run('S.program.length');
  for (let i = 0; i < n; i++) hist(b, i, now - 30 * DAY + (i + 1) * 3600e3); // whole first pass
  b.run(`S.block.next=${n};repeatBlock(S);save()`);
  assert.equal(b.run('S.block.next'), 0);
  assert.ok(b.run('S.block.passAt') >= now - 60e3, 'repeat stores the start of the new pass');
  b.run(`S.block.passAt=${now - 3 * DAY}`); // the repeat happened 3 days ago
  const d4 = riskyDay(b, 3), d2 = riskyDay(b, 1);
  hist(b, d4, now - 2 * DAY);
  hist(b, 0, now - 1 * DAY);
  b.run(`finishBlockWorkout(S,getBlock(${JSON.stringify(BID)}));S.prof.lim=['k'];save()`);
  assert.equal(b.J(`lgDayLocked(${d4})`), 'done');
  assert.equal(b.J(`lgDayLocked(${d2 === d4 ? d4 + 1 : d2})`), false, 'a day done only in the 1st pass is upcoming');
  const before = snap(b, d4);
  b.run('lgFixAll()');
  assert.equal(snap(b, d4), before);
});

test('tf2.2 second pass, old data without passAt: the end of the 1st pass (its last day) bounds the history', () => {
  const b = boot({ state: st() });
  plan(b, 0, null);
  const n = b.run('S.program.length');
  for (let i = 0; i < n; i++) hist(b, i, now - 30 * DAY + (i + 1) * 3600e3);
  const d4 = riskyDay(b, 3);
  hist(b, d4, now - 2 * DAY); hist(b, 0, now - 1 * DAY);
  b.run(`S.block={id:${JSON.stringify(BID)},next:1};S.prof.lim=['k'];save()`);
  assert.equal(b.J(`lgDayLocked(${d4})`), 'done');
  const d5 = riskyDay(b, d4 + 1);
  if (d5 > 0) assert.equal(b.J(`lgDayLocked(${d5})`), false, 'done only in the 1st pass → upcoming');
});

test('tf2.2 skip and repeat: a skipped day stays upcoming; repeating a finished day (i < next) keeps it locked; new block → nothing locked', () => {
  const b = boot({ state: st() });
  plan(b, 0, now - 10 * DAY);
  hist(b, 0, now - 5 * DAY); b.run(`finishBlockWorkout(S,getBlock(${JSON.stringify(BID)}))`);
  b.run('skipBlockWorkout(S)');
  hist(b, 0, now - 1 * DAY); // day 1 repeated
  b.run(`S.prof.lim=['k'];save()`);
  assert.equal(b.J('lgDayLocked(0)'), 'done');
  assert.equal(b.J('lgDayLocked(1)'), false, 'skipped day is upcoming');
  b.run(`blockOnApplied({blockId:${JSON.stringify(BID)}})`);
  assert.ok(b.run('S.block.passAt') >= now - 60e3);
  assert.equal(b.J('S.program.map((d,i)=>lgDayLocked(i)).filter(Boolean).length'), 0, 'new block: history of the old one does not lock');
});

test('tf2.2 reload: S.block.passAt survives save → restart (migrateBlockState); locked day stays locked after the restart', () => {
  const b = boot({ state: st() });
  plan(b, 0, now - 10 * DAY);
  const d4 = riskyDay(b, 3);
  hist(b, d4, now - 5 * DAY); hist(b, 0, now - 4 * DAY);
  b.run(`finishBlockWorkout(S,getBlock(${JSON.stringify(BID)}));S.prof.lim=['k'];save()`);
  const saved = JSON.parse(b.run(`localStorage.getItem('gym')`));
  const b2 = boot({ state: saved });
  assert.equal(b2.run('S.block.passAt'), now - 10 * DAY);
  assert.equal(b2.J(`lgDayLocked(${d4})`), 'done');
  const before = b2.run(`JSON.stringify(S.program[${d4}])`);
  b2.run('lgFixAll()');
  assert.equal(b2.run(`JSON.stringify(S.program[${d4}])`), before);
});
