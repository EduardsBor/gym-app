'use strict';
// QA regression test (Grok, independent QA, 23.11.2026) — defect found on tech-fix-2.3.2 (6cfd3c1), scenario of GPT.
// Old app: only DAY 2 of mass_nov_3_g_b36 done; old app assigns fit_nov_3_g_b36 (no S.block.passAt, records without w.blk);
// day 1 of fit done → S.block.next = 1; the user adds a limitation. Day 2 of fit was NOT done, but lgDayLocked(1) = 'done'
// (the mass record matches by dayIdx + name + n) → the day leaves lgAuditPlan() and is not checked.
// Expected (safe): false or 'unsure', never 'done'. Same with day 3 / days 2+3 of the old program and with next = 2.
// Runs from the repo's test/ folder (put the file there) or from anywhere with env REPO=<repo root>.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const local = path.join(__dirname, 'fixtures', 'tf1-boot.js');
const { boot, DAY } = require(fs.existsSync(local) ? local : path.join(process.env.REPO || '/workspace/qa-232/wt-232', 'test/fixtures/tf1-boot.js'));

const now = Date.now();
const OLD = 'mass_nov_3_g_b36', NEW = 'fit_nov_3_g_b36';
const PR = { goal: 'mass', sex: 'm', level: 'nov', days: 3, len: 60, place: 'g', prio: [], lim: [] };
function st() {
  return { lang: 'ru', goal: 'mass', days: 3, next: 0, prof: Object.assign({}, PR), workouts: [], custom: [], body: [],
    pg: { lp: { st: { success: 1, miss: 0 }, next: { weight: 80 } } }, pgSince: now - 60 * DAY };
}
function assign(b, id, next) {
  b.run(`S.block={id:${JSON.stringify(id)},next:${next}};S.next=${next};S.program=planFromBlock(getBlock(${JSON.stringify(id)}),${JSON.stringify(PR)}).days;save()`);
}
function hist(b, i, at, extra) {
  b.run(`(()=>{const d=S.program[${i}];S.workouts.push(Object.assign({id:'h${i}_${at}',start:${at},dayIdx:${i},dayName:d.name,n:d.n,notes:'',items:[{exId:'lp',ns:3,sets:[{w:80,r:10,done:true}]}]},${JSON.stringify(extra || {})}))})()`);
}
const HP = b => b.run('JSON.stringify({w:S.workouts,pg:S.pg})');
const fin = b => b.run(`finishBlockWorkout(S,getBlock(${JSON.stringify(NEW)}));save()`);
const lim = b => b.run(`S.prof.lim=['k'];save()`);

test('QA tf2.3.2 next=1 (GPT): only day 2 of mass done (old app) → fit assigned (old app) → fit day 1 done → limitation: fit day 2 is NOT done', () => {
  const b = boot({ state: st() });
  assert.deepEqual(b.failed, []);
  assign(b, OLD, 0); hist(b, 1, now - 10 * DAY);
  assign(b, NEW, 0); hist(b, 0, now - 5 * DAY); fin(b);
  lim(b);
  assert.equal(b.run('S.block.next'), 1);
  assert.equal(b.run('S.block.passAt'), undefined, 'old data: no passAt');
  assert.equal(b.run('S.workouts.filter(w=>w.blk).length'), 0, 'no record has w.blk');
  assert.equal(b.run('S.workouts[0].dayName'), b.run('S.program[1].name'), 'mass day 2 has the name of fit day 2');
  assert.ok(b.J('!!lgAuditDay(S.program[1])'), 'fit day 2 has knee-risky exercises');
  const H = HP(b);
  assert.equal(b.J('lgDayLocked(0)'), 'done', 'fit day 1 was really done');
  assert.notEqual(b.J('lgDayLocked(1)'), 'done', 'history of another program must not count fit day 2 as done');
  assert.ok(b.J('lgAuditPlan().map(x=>x.d).concat(lgAuditUnsure().map(x=>x.d))').includes(1), 'fit day 2 is checked (plan check or question)');
  b.run('lgFixAll()');
  assert.equal(HP(b), H, 'S.workouts and S.pg unchanged');
});

test('QA tf2.3.2 next=1: same with the new app after the update (fit day 1 has w.blk, the mass record has none) → fit day 2 is NOT done', () => {
  const b = boot({ state: st() });
  assign(b, OLD, 0); hist(b, 1, now - 10 * DAY);
  assign(b, NEW, 0); hist(b, 0, now - 5 * DAY, { blk: NEW }); fin(b);
  lim(b);
  assert.notEqual(b.J('lgDayLocked(1)'), 'done');
});

for (const [name, days] of [['day 3', [2]], ['days 2+3', [1, 2]]]) {
  test(`QA tf2.3.2 next=1: only ${name} of mass done → fit, fit day 1 done → those fit days are NOT done`, () => {
    const b = boot({ state: st() });
    assign(b, OLD, 0); days.forEach((d, k) => hist(b, d, now - (12 - k) * DAY));
    assign(b, NEW, 0); hist(b, 0, now - 5 * DAY); fin(b);
    lim(b);
    for (const d of days) assert.notEqual(b.J(`lgDayLocked(${d})`), 'done', `fit day ${d + 1}`);
  });
}

test('QA tf2.3.2 next=2: only day 3 of mass done → fit, fit days 1+2 done → fit day 3 is NOT done', () => {
  const b = boot({ state: st() });
  assign(b, OLD, 0); hist(b, 2, now - 10 * DAY);
  assign(b, NEW, 0); hist(b, 0, now - 5 * DAY); fin(b); hist(b, 1, now - 4 * DAY); fin(b);
  lim(b);
  assert.equal(b.run('S.block.next'), 2);
  assert.notEqual(b.J('lgDayLocked(2)'), 'done');
});

test('QA control (must pass before and after a fix): same switch on the new app (passAt) → fit day 2 upcoming, no question', () => {
  const b = boot({ state: st() });
  assign(b, OLD, 0); hist(b, 1, now - 10 * DAY);
  b.run(`blockOnApplied({blockId:${JSON.stringify(NEW)}});S.program=planFromBlock(getBlock(${JSON.stringify(NEW)}),${JSON.stringify(PR)}).days;save()`);
  hist(b, 0, Date.now() + 1000, { blk: NEW }); fin(b);
  lim(b);
  assert.equal(b.J('lgDayLocked(0)'), 'done');
  assert.equal(b.J('lgDayLocked(1)'), false);
  assert.ok(b.J('lgAuditPlan().map(x=>x.d)').includes(1));
});
