'use strict';
// v153: live bugfix of the v152 QA (Grok, qa-live-v152): D1 S.pg merge, D2 partial ⇄, D3 catalog keeps limitations,
// D4 LV volume name, D5 textarea placeholder translation, D6 room under the rest timer bar.
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('vm');
const { boot, read } = require('./fixtures/tf1-boot.js');
const DAY = 864e5;

// ---------- D1: mergePg (pure function from sync.js)
function mergePgFn() {
  const src = read('sync.js');
  const m = src.match(/function mergePg\(a,b\)\{[\s\S]*?\n  \}\n/);
  assert.ok(m, 'mergePg in sync.js');
  return vm.runInNewContext('(' + m[0] + ')');
}
const pgE = (w, last, note) => ({ st: { success: 1, miss: 0 }, next: { weight: w, sets: 3, target: null, note: note || 'top1' }, first: 1, last });

test('D1: newer local S.pg entry (by last) is not rolled back by an older cloud copy', () => {
  const mergePg = mergePgFn();
  const local = { bp: pgE(25, 2000, 'inc') }, cloud = { bp: pgE(20, 1000, 'same') };
  assert.equal(mergePg(local, cloud).bp.next.weight, 25);
});

test('D1: newer cloud entry (other device trained later) wins; per exercise; union of keys', () => {
  const mergePg = mergePgFn();
  const r = mergePg({ bp: pgE(25, 2000), sq: pgE(80, 3000) }, { bp: pgE(27.5, 5000), sq: pgE(70, 1000), dl: pgE(100, 4000) });
  assert.equal(r.bp.next.weight, 27.5);
  assert.equal(r.sq.next.weight, 80);
  assert.equal(r.dl.next.weight, 100);
});

test('D1: equal or missing timestamps keep the local entry; repeated sync does not bring old weights back', () => {
  const mergePg = mergePgFn();
  assert.equal(mergePg({ bp: pgE(25, 2000) }, { bp: pgE(20, 2000) }).bp.next.weight, 25);
  assert.equal(mergePg({ bp: { next: { weight: 25 } } }, { bp: { next: { weight: 20 } } }).bp.next.weight, 25);
  assert.equal(mergePg({ bp: pgE(25, 2000) }, { bp: null }).bp.next.weight, 25);
  assert.equal(mergePg({ bp: pgE(25, 2000) }, { bp: 'x' }).bp.next.weight, 25);
  // A pushes the merged state, B (stale) syncs again: still the newest
  let A = { bp: pgE(25, 2000) }, cloud = { bp: pgE(20, 1000) };
  for (let i = 0; i < 3; i++) { A = mergePg(A, cloud); cloud = JSON.parse(JSON.stringify(A)); }
  assert.equal(A.bp.next.weight, 25);
  assert.equal(mergePg({}, null).bp, undefined);
});

// ---------- app in node:vm
function app(state) {
  const b = boot({ state: Object.assign({ lang: 'ru', goal: 'mass', days: 3, next: 0, obDone: 1, weightAsked: 1, workouts: [], custom: [], body: [], pg: {},
    prof: { goal: 'mass', sex: 'f', level: 'mid', days: 3, len: 60, place: 'g', prio: [], lim: [] },
    program: [{ name: 'A', items: [{ exId: 'bp', sets: 3, min: 8, max: 12, rest: 90 }] }] }, state || {}) });
  assert.deepEqual(b.failed, []);
  b.run('globalThis.confirm=()=>true;toast=m=>{globalThis.__t=m}');
  return b;
}
const active = sets => `S.active={id:'a1',start:Date.now(),dayIdx:0,dayName:'A',notes:'',items:[{exId:'bp',ns:${sets.length},rest:90,min:8,max:12,sets:${JSON.stringify(sets)}}]}`;

test('D2: ⇄ on a partly done exercise — done sets stay with the original, only the rest moves to the new one', () => {
  const b = app({ workouts: [{ id: 'w0', start: Date.now() - 3 * DAY, end: Date.now() - 3 * DAY + 1, dayIdx: 0, dayName: 'A', items: [{ exId: 'smith-bench', sets: [{ w: 40, r: 10, done: true }] }] }] });
  b.run(active([{ w: 50, r: 10, done: true }, { w: 50, r: 10, done: false }, { w: 50, r: 10, done: false }]));
  assert.equal(b.run('swapActiveItem(S.active,0,"smith-bench")'), 'split');
  const it = b.J('S.active.items');
  assert.equal(it.length, 2);
  assert.equal(it[0].exId, 'bp'); assert.deepEqual(it[0].sets.map(s => [s.w, s.r, s.done]), [[50, 10, true]]); assert.equal(it[0].swStop, 1);
  assert.equal(it[1].exId, 'smith-bench'); assert.equal(it[1].swFrom, 'bp'); assert.equal(it[1].ns, 2);
  assert.ok(it[1].sets.every(s => !s.done)); assert.equal(it[1].sets[0].w, 40, 'prefilled from the history of the new exercise');
});

test('D2: nothing done → whole item replaced as before; everything done → no change', () => {
  const b = app();
  b.run(active([{ w: 50, r: 10, done: false }, { w: 50, r: 10, done: false }]));
  assert.equal(b.run('swapActiveItem(S.active,0,"smith-bench")'), 'replace');
  assert.equal(b.J('S.active.items').length, 1); assert.equal(b.run('S.active.items[0].exId'), 'smith-bench');
  b.run(active([{ w: 50, r: 10, done: true }, { w: 50, r: 10, done: true }]));
  assert.equal(b.run('swapActiveItem(S.active,0,"smith-bench")'), 'done');
  assert.equal(b.run('S.active.items[0].exId'), 'bp'); assert.equal(b.J('S.active.items').length, 1);
  assert.equal(b.run('__t'), 'Упражнение уже выполнено — замена не нужна');
  assert.equal(b.run('swapActiveItem(S.active,0,"bp")'), null);
});

test('D2: auto-weight — the source stays neutral; the new item counts only when all its sets are done', () => {
  const b = app({ pg: { bp: pgE(50, Date.now() - 5 * DAY) } });
  const before = b.J('S.pg.bp');
  const W = (n2done) => `({id:'w1',start:Date.now(),end:Date.now(),dayIdx:0,items:[{exId:'bp',ns:3,min:8,max:12,swStop:1,sets:[{w:50,r:10,done:true}]},{exId:'smith-bench',ns:2,min:8,max:12,swFrom:'bp',sets:${JSON.stringify(Array.from({ length: n2done }, () => ({ w: 40, r: 10, done: true })))}}]})`;
  b.run(`awFinish(${W(1)})`);
  assert.deepEqual(b.J('S.pg.bp'), before);
  assert.equal(b.run('S.pg["smith-bench"]'), undefined);
  b.run(`awFinish(${W(2)})`);
  assert.deepEqual(b.J('S.pg.bp'), before);
  assert.ok(b.J('S.pg["smith-bench"]').next);
  assert.match(read('app.js'), /swapActiveItem\(A,\+b\.dataset\.ws,id\)/);
  assert.match(read('exscreen.js'), /swapActiveItem\(A,e\.i,nid\)/);
});

test('D3: ready program from the catalog keeps the user limitations and sex; program is checked with them', () => {
  const b = app({ prof: { goal: 'mass', sex: 'f', level: 'mid', days: 3, len: 60, place: 'g', prio: [], lim: ['s', 'k', 'p'] } });
  b.run('preview(CATALOG.find(c=>/Старт/.test(c.name))||CATALOG[0],"catalog");$("#pstart").onclick()');
  assert.deepEqual(b.J('S.prof.lim').sort(), ['k', 'p', 's']);
  assert.equal(b.run('S.prof.sex'), 'f');
  const bad = b.run('(S.program||[]).reduce((n,d)=>n+(d.items||[]).filter(it=>!blockLimOk(it.exId,S.prof)).length,0)');
  assert.equal(bad, 0);
  assert.equal(b.run('lgAuditPlan().length'), 0);
  // the catalog card itself is not changed
  assert.equal(b.run('(CATALOG.find(c=>/Старт/.test(c.name))||CATALOG[0]).a.lim===undefined||(CATALOG.find(c=>/Старт/.test(c.name))||CATALOG[0]).a.lim.length===0'), true);
});

test('D3: the questionnaire still uses its own answer (removing a limitation there is the user choice)', () => {
  const b = app({ prof: { goal: 'mass', sex: 'm', level: 'mid', days: 3, len: 60, place: 'g', prio: [], lim: ['k'] } });
  b.run('preview({name:"Q",desc:"",a:{goal:"mass",sex:"m",level:"mid",days:3,len:60,place:"g",prio:[],lim:[]}},"quiz");$("#pstart").onclick()');
  assert.deepEqual(b.J('S.prof.lim'), []);
});

test('D4: volume group name wraps instead of being cut', () => {
  const css = read('style.css');
  const m = css.match(/\.volname\{([^}]*)\}/);
  assert.ok(m);
  assert.doesNotMatch(m[1], /text-overflow:ellipsis|white-space:nowrap/);
});

test('D5: a TEXTAREA added directly gets its placeholder translated (typed text untouched)', () => {
  const src = read('i18n/i18n.js');
  assert.match(src, /if\(SKIP\.has\(root\.nodeName\)\)\{if\(root\.nodeName==='TEXTAREA'\)trAttrs\(root\);return\}/);
  assert.match(read('i18n/dict.js'), /\['Самочувствие, что получилось…','How you felt, what went well…','Pašsajūta, kas izdevās…'\]/);
});

test('D6: rest timer bar adds bottom room (body.tmr) on start / resume, removed on stop', () => {
  const a = read('app.js');
  assert.match(a, /function tmrPad\(on\)/);
  assert.equal((a.match(/tmrPad\(1\)/g) || []).length, 2);
  assert.equal((a.match(/tmrPad\(0\)/g) || []).length, 1);
  assert.match(read('style.css'), /body\.tmr\{padding-bottom:calc\(160px \+ env\(safe-area-inset-bottom\)\)\}/);
});

test('v153: cache version and new RU/EN/LV string', () => {
  assert.match(read('cache-ver.js'), /var SW_CACHE='moyzal-v166'/);
  assert.match(read('i18n/dict3.js'), /\['Упражнение уже выполнено — замена не нужна','[^']+','[^']+'\]/);
});
