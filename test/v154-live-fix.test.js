'use strict';
// v154: live hotfix of the v153 QA (Grok). N1 extra sets after a replacement, O1 S.pg conflict of two devices,
// N2 / N4 horizontal overflow at 320 px (legal pages, science), N3 «Назад» of the legal screen.
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('vm');
const { boot, read } = require('./fixtures/tf1-boot.js');
const DAY = 864e5;
const now = Date.now();

// ---------- N1: replacement keeps exactly the remaining sets
const pgE = (w, sets, last) => ({ st: { success: 0, miss: 0 }, next: { weight: w, sets, target: 10, note: 'same' }, first: now - 30 * DAY, last });
function app(state) {
  const b = boot({ state: Object.assign({ lang: 'ru', goal: 'mass', days: 3, next: 0, obDone: 1, weightAsked: 1, workouts: [], custom: [], body: [],
    pg: { bp: pgE(50, 3, now - 5 * DAY), 'smith-bench': pgE(40, 3, now - 6 * DAY) }, pgSince: now - 40 * DAY,
    prof: { goal: 'mass', sex: 'f', level: 'mid', days: 3, len: 60, place: 'g', prio: [], lim: [] },
    program: [{ name: 'A', items: [{ exId: 'bp', sets: 3, min: 8, max: 12, rest: 90 }] }] }, state || {}) });
  assert.deepEqual(b.failed, []);
  b.run('globalThis.confirm=()=>true;toast=m=>{globalThis.__t=m};startTimer=()=>{}');
  return b;
}
const open3 = (b, done) => b.run(`S.active={id:'a1',start:Date.now(),dayIdx:0,dayName:'A',notes:'',items:[{exId:'bp',ns:3,rest:90,min:8,max:12,
  sets:[0,1,2].map(j=>({w:50,r:10,done:j<${done}}))}]};save();workoutView()`);
const total = b => b.run('S.active.items.reduce((n,it)=>n+it.sets.length,0)');

for (const done of [1, 2]) {
  test(`N1: manual ⇄ after ${done} of 3 done — replacement gets ${3 - done} sets (ns = sets.length), total stays 3`, () => {
    const b = app();
    open3(b, done);
    assert.equal(b.run('swapActiveItem(S.active,0,"smith-bench")'), 'split');
    b.run('workoutView()');                       // awDecorate → awApply on the new item (the v153 path that padded to 3)
    const it = b.J('S.active.items[1]');
    assert.equal(it.ns, 3 - done);
    assert.equal(it.sets.length, 3 - done);
    assert.equal(total(b), 3);
    assert.equal(it.sug && it.sug.sets, 3 - done, 'suggestion planned for the real volume');
    assert.deepEqual(b.J('S.active.items[0].sets').map(s => [s.w, s.done]), Array.from({ length: done }, () => [50, true]), 'source keeps done sets and weights');
  });
}

test('N1: ⇄ before any set → whole item replaced, 3 sets; fully done → no change', () => {
  const b = app();
  open3(b, 0);
  assert.equal(b.run('swapActiveItem(S.active,0,"smith-bench")'), 'replace');
  b.run('workoutView()');
  assert.equal(b.run('S.active.items.length'), 1);
  assert.equal(b.run('S.active.items[0].sets.length'), 3);
  open3(b, 3);
  assert.equal(b.run('swapActiveItem(S.active,0,"smith-bench")'), 'done');
  assert.equal(total(b), 3);
});

test('N1: auto-weight off — the replacement still has only the remaining sets', () => {
  const b = app({ autoW: false });
  open3(b, 1);
  b.run('swapActiveItem(S.active,0,"smith-bench");workoutView()');
  assert.equal(b.run('S.active.items[1].sets.length'), 2);
  assert.equal(total(b), 3);
});

test('N1: survives reload (saved state → new start of the app → workout view)', () => {
  const b = app();
  open3(b, 1);
  b.run('swapActiveItem(S.active,0,"smith-bench");save()');
  const saved = JSON.parse(b.run(`localStorage.getItem('gym')`));
  const b2 = boot({ state: saved });
  b2.run('startTimer=()=>{};workoutView()');
  assert.equal(b2.J('S.active.items[1]').ns, 2);
  assert.equal(b2.run('S.active.items[1].sets.length'), 2);
  assert.equal(total(b2), 3);
});

test('N1: finish — source S.pg unchanged; replacement progresses on its 2 planned sets; history has 1 + 2 sets', () => {
  const b = app();
  const bp0 = b.J('S.pg.bp');
  open3(b, 1);
  b.run('swapActiveItem(S.active,0,"smith-bench");workoutView();S.active.items[1].sets.forEach(s=>{s.w=40;s.r=12;s.done=true})');
  b.run(`go('today');$('#fin').onclick()`);
  assert.equal(b.run('!!S.active'), false);
  const W = b.J('S.workouts[S.workouts.length-1]');
  assert.deepEqual(W.items.map(it => [it.exId, it.sets.length]), [['bp', 1], ['smith-bench', 2]]);
  assert.deepEqual(b.J('S.pg.bp'), bp0, 'source neutral (no miss, no false success)');
  assert.equal(b.J('S.pg["smith-bench"]').next.sets, 2, 'progression of the replacement uses the real volume');
});

test('N1: limitation split (lgActiveFix «split») — replacement with its own 3-set S.pg gets 2 sets', () => {
  const b = boot({ state: { lang: 'ru', goal: 'str', days: 3, next: 0, workouts: [], custom: [], body: [], pgSince: now - 40 * DAY,
    prof: { goal: 'str', sex: 'm', level: 'mid', days: 3, len: 60, place: 'g', prio: [], lim: ['k'] },
    pg: { sq: { st: { success: 1, miss: 0 }, next: { weight: 80, sets: 4, target: 5, note: 'top1' }, first: now - 30 * DAY, last: now - 3 * DAY },
      'mk-dumbbell-step-up-low': { st: { success: 0, miss: 0 }, next: { weight: 12, sets: 3, target: 8 }, first: 1, last: 2 } } } });
  b.run(`startTimer=()=>{};S.program=[{name:'x',items:[{exId:'sq',sets:4,min:5,max:8,rest:120}]}];
    S.active={id:'a1',start:Date.now(),dayIdx:0,dayName:'x',notes:'',items:[
      {exId:'sq',ns:4,min:5,max:8,rest:120,sets:[{w:80,r:8,done:true},{w:80,r:8,done:true},{w:80,r:8,done:false},{w:80,r:8,done:false}]}]};save()`);
  b.run(`lgActiveFix(0,'split');workoutView()`);
  const it = b.J('S.active.items[1]');
  assert.equal(it.limFrom, 'sq');
  assert.equal(it.ns, 2);
  assert.equal(it.sets.length, 2);
  assert.equal(total(b), 4);
});

// ---------- O1: mergePg — the later finished workout wins (upd), old entries fall back to last
function mergePgFn() {
  const m = read('sync.js').match(/function mergePg\(a,b\)\{[\s\S]*?\n  \}\n/);
  assert.ok(m, 'mergePg in sync.js');
  return vm.runInNewContext('(' + m[0] + ')');
}
const e = (w, last, upd) => Object.assign({ st: { success: 1, miss: 0 }, next: { weight: w, sets: 3 }, first: 1, last }, upd ? { upd } : {});

test('O1: overlapping workouts — entry finished later (upd) wins even if its workout started earlier', () => {
  const mergePg = mergePgFn();
  // A started 10:00 finished 11:30; B started 10:30 finished 11:00 → A is the newer state
  const A = e(52.5, 1000, 5400), B = e(50, 1800, 3600);
  assert.equal(mergePg({ bp: A }, { bp: B }).bp.next.weight, 52.5);
  assert.equal(mergePg({ bp: B }, { bp: A }).bp.next.weight, 52.5);
});

test('O1: backward compatible — without upd the old rule (last) applies; mixed old/new compares upd||last', () => {
  const mergePg = mergePgFn();
  assert.equal(mergePg({ bp: e(25, 2000) }, { bp: e(20, 1000) }).bp.next.weight, 25);
  assert.equal(mergePg({ bp: e(25, 1000) }, { bp: e(20, 2000) }).bp.next.weight, 20);
  assert.equal(mergePg({ bp: e(25, 1000, 3000) }, { bp: e(20, 2000) }).bp.next.weight, 25);
  assert.equal(mergePg({ bp: e(25, 2000) }, { bp: e(20, 1000, 1500) }).bp.next.weight, 25, 'old entry finished 2000+ is newer than upd 1500');
  assert.equal(mergePg({ bp: e(25, 1000, 3000) }, { bp: e(20, 1000, 3000) }).bp.next.weight, 25, 'tie keeps local');
});

test('O1: awFinish stamps upd (finish time) next to last (start time); last is unchanged', () => {
  const b = app();
  b.run(`awFinish({id:'w9',start:1000,end:5000,dayIdx:0,items:[{exId:'bp',ns:3,min:8,max:12,sets:[0,1,2].map(()=>({w:50,r:12,done:true}))}]})`);
  const p = b.J('S.pg.bp');
  assert.equal(p.last, 1000);
  assert.ok(p.upd >= 5000, 'upd = moment of the update, not before the end of the workout');
});

// ---------- N2 / N3 / N4 (CSS / markup rules; the real widths are checked in Chrome)
test('N2: legal pages (in the app and static privacy/terms) — table cells, links and code wrap instead of widening the page', () => {
  const css = read('style.css');
  assert.match(css, /\.legal th,\.legal td\{[^}]*overflow-wrap:anywhere/);
  assert.match(css, /\.legal a,\.legal code\{overflow-wrap:anywhere\}/);
  for (const f of ['privacy.html', 'terms.html', 'scripts/build-legal-pages.js']) {
    const s = read(f);
    assert.match(s, /th,td\{[^}]*overflow-wrap:anywhere/, f);
    assert.match(s, /a,code\{overflow-wrap:anywhere\}/, f);
  }
});

test('N3: scrolling into view keeps elements above the fixed bottom nav and the rest timer bar', () => {
  const css = read('style.css');
  assert.match(css, /html\{scroll-padding-bottom:calc\(72px \+ env\(safe-area-inset-bottom\)\)\}/);
  assert.match(css, /html:has\(body\.tmr\)\{scroll-padding-bottom:calc\(132px \+ env\(safe-area-inset-bottom\)\)\}/);
});

test('N4: tab rows (science goal tabs) wrap on narrow screens', () => {
  assert.match(read('style.css'), /\.tabs\{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0\}/);
});

test('v154: cache version', () => {
  assert.match(read('cache-ver.js'), /var SW_CACHE='moyzal-v157'/);
});
