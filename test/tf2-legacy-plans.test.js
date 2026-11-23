'use strict';
// tech-fix-2 P1: plans saved by older versions (fixtures of old S) — the plan check finds conflicts, changes nothing on its own,
// fixes only after consent; history (S.workouts) and working weights (S.pg) never change.
const test = require('node:test');
const assert = require('node:assert/strict');
const { boot, DAY } = require('./fixtures/tf1-boot.js');

const now = Date.now();
const hist = [{ id: 'w1', start: now - 5 * DAY, end: now - 5 * DAY + 3600e3, dayIdx: 0, dayName: 'День A', notes: '', items: [
  { exId: 'sq', ns: 3, min: 6, max: 10, rest: 120, sets: [{ w: 80, r: 8, done: true }, { w: 80, r: 8, done: true }] },
  { exId: 'bp', ns: 3, min: 6, max: 10, rest: 120, sets: [{ w: 60, r: 10, done: true }] }] }];
const pg = { sq: { st: { success: 1, miss: 0 }, next: { weight: 82.5, sets: 3, target: 6, note: 'top1' }, first: now - 30 * DAY, last: now - 5 * DAY } };
// F1: plan of the old generator (no blocks, no warm-up shell), very old profile without «lim» key → limitation added later
const F1 = { lang: 'ru', goal: 'mass', days: 3, next: 1, prof: { goal: 'mass', sex: 'm', level: 'mid', days: 3, len: 60, place: 'g', prio: [] },
  program: [{ name: 'День A', items: [{ exId: 'sq', sets: 3, min: 6, max: 10, rest: 120 }, { exId: 'bp', sets: 3, min: 6, max: 10, rest: 120 }, { exId: 'jump', sets: 1, min: 10, max: 15, rest: 0 }] },
    { name: 'День B', items: [{ exId: 'ohp', sets: 3, min: 8, max: 12, rest: 90 }, { exId: 'lat', sets: 3, min: 8, max: 12, rest: 90 }] }],
  workouts: hist, custom: [], body: [], pg };
// F3: workout left open by an old version (no limAck, warm-up of the plain generator)
const F3 = Object.assign({}, F1, { prof: Object.assign({}, F1.prof, { lim: ['p'] }), active: { id: 'a0', start: now - 600e3, dayIdx: 1, dayName: 'День B', notes: '',
  items: [{ exId: 'ohp', ns: 3, min: 8, max: 12, rest: 90, sets: [{ w: '', r: 12, done: false }] }, { exId: 'lat', ns: 3, min: 8, max: 12, rest: 90, sets: [{ w: '', r: 12, done: false }] }] } });

const snap = b => b.run('JSON.stringify({p:S.program,w:S.workouts,pg:S.pg})');

test('tf2 legacy F1: old generator plan, profile without lim → boots, no check; limitation added → check finds, nothing changes by itself', () => {
  const b = boot({ state: F1 });
  assert.deepEqual(b.failed, []);
  b.run('today()');
  assert.deepEqual(b.J('lgAuditPlan()'), []);
  b.run(`S.prof.lim=['k'];save()`);
  const before = snap(b);
  b.run('today()');
  const P = b.J('lgAuditPlan()');
  assert.deepEqual(P.map(x => x.d), [0]);
  // jump is home equipment: in the gym the equipment swap already gives a knee-safe cardio (filter of eqSwapFor), sq stays risky
  assert.deepEqual(P[0].items.map(x => x.exId).sort(), ['sq']);
  assert.equal(b.run(`blockLimOk(eqAdaptDay(S.program[0]).items[2].exId,{lim:['k']})`), true);
  b.run('startW(0)');
  assert.equal(b.run('!!S.active'), false);
  assert.equal(snap(b), before, 'nothing changed without consent');
  b.run('lgFixAll()');
  const after = b.J('{p:S.program,w:S.workouts,pg:S.pg}');
  assert.deepEqual(after.w, hist);
  assert.deepEqual(after.pg, pg);
  assert.equal(after.p[0].items.some(i => i.exId === 'sq'), false);
  assert.ok(after.p[0].limWarn.length >= 1);
  assert.deepEqual(after.p[1], F1.program[1], 'other day untouched');
});

test('tf2 legacy F2: block plan saved before tech-fix-1 (no limWarn / deload / rirTarget), knees set at that time → check + consent', () => {
  const b0 = boot();
  const prog = b0.J(`planFromBlock(getBlock('str_adv_5_g_b35'),{goal:'str',level:'adv',days:5,place:'g',lim:[]}).days`)
    .map(d => { const x = Object.assign({}, d); delete x.deload; delete x.rirTarget; delete x.limWarn; return x; });
  const F2 = { lang: 'ru', goal: 'str', days: 5, next: 2, prof: { goal: 'str', sex: 'm', level: 'adv', days: 5, len: 90, place: 'g', prio: [], lim: ['k'] },
    block: { id: 'str_adv_5_g_b35', next: 2 }, program: prog, workouts: hist, custom: [], body: [], pg };
  const b = boot({ state: F2 });
  assert.deepEqual(b.failed, []);
  const before = snap(b);
  b.run('today()');
  assert.equal(snap(b), before);
  const P = b.J('lgAuditPlan()');
  assert.ok(P.length > 0);
  assert.ok(P.some(x => x.items.some(i => i.exId === 'smith-squat')));
  assert.ok(P.some(x => x.wucd.length > 0), 'warm-up / cool-down of the saved plan are checked too');
  const di = P[0].d;
  b.run(`lgStartFix(${di})`);
  assert.equal(b.run(`S.active.items.every(i=>blockLimOk(i.exId,{lim:['k']}))`), true);
  assert.equal(b.run('S.active.dl'), b.run(`blockDayCtx(${di})&&blockDayCtx(${di}).deload?'block':S.active.dl`), 'block deload context still read from the block file');
  assert.deepEqual(b.J('S.workouts'), hist);
  assert.deepEqual(b.J('S.pg.sq'), pg.sq);
});

test('tf2 legacy F3: workout left open by an old version — resumed, flagged with consent buttons, done sets and weights untouched', () => {
  const b = boot({ state: F3 });
  assert.deepEqual(b.failed, []);
  const L = b.J('lgAuditActive()');
  assert.deepEqual(L.map(x => x.exId), ['ohp']);
  assert.match(b.run('lgActiveHTML(lgAuditActive())'), /data-lgaw="0"|data-lgar="0"/);
  assert.equal(b.run('S.active.items[0].exId'), 'ohp', 'not changed before consent');
  b.run(`lgActiveFix(0,'swap')`);
  assert.equal(b.run(`blockLimOk(S.active.items[0].exId,{lim:['p']})`), true);
  assert.deepEqual(b.J('S.pg'), pg);
});

test('tf2 legacy: broken / unknown limitation values in old data do not break the check', () => {
  for (const lim of [null, 'k', ['x', 'k'], [1, 'p'], {}]) {
    const b = boot({ state: Object.assign({}, F1, { prof: Object.assign({}, F1.prof, { lim }) }) });
    assert.deepEqual(b.failed, []);
    b.run('today()');
    const L = b.J('lgLim()');
    assert.ok(Array.isArray(L) && L.every(x => ['s', 'k', 'p'].includes(x)), JSON.stringify(lim));
    b.J('lgAuditPlan()');
  }
});
