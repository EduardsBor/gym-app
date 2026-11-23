'use strict';
// tech-fix-2.1 P1 (defect 1): a partly done exercise was left out of the limitation check — one done set hid the remaining ones.
// Now: done sets / weights / exId stay as they are; the remaining sets are checked; the user is warned before going on and can
// stop the remaining sets or move them into a separate replacement exercise.
const test = require('node:test');
const assert = require('node:assert/strict');
const { boot, DAY } = require('./fixtures/tf1-boot.js');

const now = Date.now();
function st() {
  return { lang: 'ru', goal: 'str', days: 3, next: 0, prof: { goal: 'str', sex: 'm', level: 'mid', days: 3, len: 60, place: 'g', prio: [], lim: ['k'] },
    workouts: [], custom: [], body: [], pg: {}, pgSince: now - 40 * DAY };
}
const DONE = [{ w: 80, r: 8, done: true }, { w: 82.5, r: 7, done: true }];
function withActive(b) {
  b.run(`S.program=[{name:'x',items:[{exId:'sq',sets:4,min:5,max:8,rest:120}]}];
    S.active={id:'a1',start:Date.now(),dayIdx:0,dayName:'x',notes:'',items:[
      {exId:'sq',ns:4,min:5,max:8,rest:120,sets:[{w:80,r:8,done:true},{w:82.5,r:7,done:true},{w:82.5,r:8,done:false},{w:82.5,r:8,done:false}]},
      {exId:'lc',ns:3,min:8,max:12,rest:90,sets:[{w:'',r:12,done:true},{w:'',r:12,done:true},{w:'',r:12,done:true}]}]};save()`);
}

test('tf2.1 partial: an exercise with done sets and sets left is still checked (remaining sets flagged)', () => {
  const b = boot({ state: st() });
  withActive(b);
  const L = b.J('lgAuditActive()');
  assert.equal(L.length, 1, 'sq has 2 of 4 sets left and conflicts with knees');
  assert.equal(L[0].exId, 'sq');
  assert.deepEqual(L[0].partial, { done: 2, left: 2 });
  assert.match(b.run('lgActiveHTML(lgAuditActive())'), /выполнено[\s\S]*Заменить остаток[\s\S]*Остановить[\s\S]*Оставить/);
});

test('tf2.1 partial: a fully done exercise is not flagged (nothing left to continue)', () => {
  const b = boot({ state: st() });
  withActive(b);
  b.run(`S.active.items[0].sets.forEach(s=>s.done=true)`);
  assert.deepEqual(b.J('lgAuditActive()'), []);
});

test('tf2.1 partial: «Остановить» drops only the remaining sets; done sets, weights and exId unchanged', () => {
  const b = boot({ state: st() });
  withActive(b);
  b.run(`lgActiveFix(0,'stop')`);
  const it = b.J('S.active.items[0]');
  assert.equal(it.exId, 'sq');
  assert.deepEqual(it.sets, DONE);
  assert.equal(it.ns, 4, 'planned sets kept → auto-weight sees the exercise as not completed (no weight increase)');
  assert.deepEqual(b.J('lgAuditActive()'), []);
  assert.equal(b.J('S.limLog.slice(-1)[0].kind'), 'stop');
});

test('tf2.1 partial: «Заменить остаток» — remaining sets go into a separate replacement exercise, exId of done sets unchanged', () => {
  const b = boot({ state: st() });
  withActive(b);
  const x = b.J('lgAuditActive()[0]');
  assert.ok(x.to, 'a safe replacement exists for sq at the gym');
  b.run(`lgActiveFix(0,'split')`);
  const items = b.J('S.active.items');
  assert.equal(items.length, 3);
  assert.equal(items[0].exId, 'sq');
  assert.deepEqual(items[0].sets, DONE);
  assert.equal(items[1].exId, x.to);
  assert.equal(items[1].sets.length, 2);
  assert.ok(items[1].sets.every(s => !s.done));
  assert.equal(items[1].ns, 2);
  assert.equal(items[1].limFrom, 'sq');
  assert.equal(b.run(`blockLimConf(${JSON.stringify(x.to)},{lim:['k']}).length`), 0);
  assert.deepEqual(b.J('lgAuditActive()'), []);
  // the plain «swap» on a partly done item never rewrites the done sets
  const b2 = boot({ state: st() });
  withActive(b2);
  b2.run(`lgActiveFix(0,'swap')`);
  assert.equal(b2.J('S.active.items[0].exId'), 'sq');
  assert.deepEqual(b2.J('S.active.items[0].sets'), DONE);
});

test('tf2.1 partial: going on with a flagged exercise asks first; «Отмена» keeps the set not done; yes → acknowledgement', () => {
  const b = boot({ state: st() });
  withActive(b);
  b.run(`startTimer=()=>{};checkPR=()=>{};globalThis.__ask=0;globalThis.confirm=()=>{__ask++;return false}`); // no timer / sound in node
  b.run(`setDone(S.active.items[0],2)`);
  assert.equal(b.run('__ask'), 1);
  assert.equal(b.run('S.active.items[0].sets[2].done'), false);
  b.run(`globalThis.confirm=()=>{__ask++;return true}`);
  b.run(`setDone(S.active.items[0],2)`);
  assert.equal(b.run('S.active.items[0].sets[2].done'), true);
  assert.equal(b.run('S.active.items[0].limAck'), 'k');
  b.run(`setDone(S.active.items[0],3)`);
  assert.equal(b.run('__ask'), 2, 'asked once per exercise');
  assert.deepEqual(b.J('S.active.items[0].sets.slice(0,2)'), DONE);
});

test('tf2.1 partial: after finishing, history keeps the done sets of the original exercise and the replacement separately', () => {
  const b = boot({ state: st() });
  withActive(b);
  const to = b.J('lgAuditActive()[0].to');
  b.run(`lgActiveFix(0,'split');S.active.items[1].sets.forEach(s=>{s.w=20;s.r=10;s.done=true});
    const A=S.active;S.workouts.push(JSON.parse(JSON.stringify(A)));S.active=null;save()`);
  const w = b.J('S.workouts[0].items');
  assert.equal(w[0].exId, 'sq');
  assert.deepEqual(w[0].sets, DONE);
  assert.equal(w[1].exId, to);
  assert.equal(b.J('lastSets("sq")').length, 2);
});
