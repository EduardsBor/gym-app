'use strict';
// v160 — LIVE development v159 tasks: back from the gravitron clears the old penalty (1/5), honest top-of-range note (4),
// seconds columns for holds (6), shoulder caution on vertical pulls (2), knee removals → sets added to the safe exercise
// already in the workout (3), local confirmation of limitations after signing in on a new device (7).
const test = require('node:test');
const assert = require('node:assert/strict');
const { boot, read } = require('./fixtures/tf1-boot.js');
const DAY = 864e5, now = Date.now();

function gym(extra) {
  const b = boot({ state: Object.assign({ lang: 'ru', goal: 'mass', days: 3, next: 0, obDone: 1, custom: [], body: [], pgSince: now - 10 * DAY,
    prof: { goal: 'mass', sex: 'm', level: 'nov', days: 3, len: 60, place: 'g', prio: [], lim: [] },
    workouts: [{ id: 'w0', start: now - 2 * DAY, end: now - 2 * DAY + 1, dayIdx: 0, dayName: 'A', items: [{ exId: 'chin', ns: 3, min: 5, max: 8, sets: [{ w: '', r: 1, done: true }] }] }],
    pg: { chin: { st: { success: 0, miss: 2, cut: 1 }, next: { weight: null, sets: 2, target: 5, note: 'miss2', down: 'assisted-pullup' }, first: 1, last: now - 2 * DAY } },
    program: [{ name: 'A', items: [{ exId: 'chin', sets: 3, min: 5, max: 8, rest: 120 }] }] }, extra || {}) });
  b.run('globalThis.confirm=()=>true;startTimer=()=>{}');
  return b;
}
const finish = b => { b.run(`go('today');$('#fin').onclick()`); assert.equal(b.run('!!S.active'), false); };

// ---------- 1 / 5
test('1/5: chin → gravitron → 0 kg → «Пора усложнить»: back on chin, old miss / cut / note cleared, history and weights kept', () => {
  const b = gym();
  b.run('startW(0);workoutView();awDownSwap(S.active,0)');
  b.run('S.active.items[0].sets.forEach(s=>{s.w=5;s.r=8;s.done=true})');
  finish(b);
  assert.equal(b.J('S.pg["assisted-pullup"]').next.id, 'chin');
  const hist = b.run('JSON.stringify(S.workouts)');
  b.run('startW(0);workoutView()');
  assert.equal(b.run('awLadderSwap(S.active,0)'), true);
  assert.equal(b.run('S.active.items[0].exId'), 'chin');
  assert.equal(b.run('"downFrom" in S.program[0].items[0]'), false);
  const st = b.J('S.pg.chin.st');
  assert.equal(st.miss, 0); assert.equal('cut' in st, false);
  assert.equal(b.J('S.pg.chin.next').note, 'same');
  assert.equal(b.run('"down" in S.pg.chin.next'), false);
  assert.equal(b.run('S.active.items[0].sets.length'), 3, 'no «one set less» after the return');
  assert.equal(b.run('JSON.stringify(S.workouts)'), hist, 'history untouched');
});

test('1/5: an ordinary ladder step (not a way back) does not touch the target state', () => {
  const b = gym({ pg: { 'scap-pullup': { st: { success: 1, miss: 0 }, next: { weight: null, sets: 3, target: 8, note: 'ladder', id: 'pull' }, first: 1, last: now - DAY },
    pull: { st: { success: 0, miss: 1 }, next: { weight: null, sets: 3, target: 5, note: 'miss1' }, first: 1, last: now - 9 * DAY } },
    prof: { goal: 'mass', sex: 'm', level: 'nov', days: 3, len: 60, place: 'b', bar: '1', prio: [], lim: [] },
    program: [{ name: 'A', items: [{ exId: 'scap-pullup', sets: 3, min: 5, max: 8, rest: 120 }] }] });
  b.run('startW(0);workoutView()');
  assert.equal(b.run('S.active.items[0].sug.to'), 'pull');
  b.run('awLadderSwap(S.active,0)');
  assert.deepEqual(b.J('S.pg.pull.st'), { success: 0, miss: 1 });
});

// ---------- 4
test('4: towel-leg-curl with knees — top of the range gives «держи этот уровень», never the promise of a step; pu keeps top1', () => {
  const mk = (lim, ex, min, max) => boot({ state: { lang: 'ru', goal: 'fit', days: 3, next: 0, obDone: 1, workouts: [], custom: [], body: [], pg: {}, pgSince: now - 10 * DAY,
    prof: { goal: 'fit', sex: 'm', level: 'nov', days: 3, len: 60, place: 'b', prio: [], lim },
    program: [{ name: 'A', items: [{ exId: ex, sets: 3, min, max, rest: 60 }] }] } });
  const run = (b, ex, max) => { b.run('startTimer=()=>{};startW(0);workoutView();S.active.items[0].sets.forEach(s=>{s.w="";s.r=' + max + ';s.done=true})'); finish(b); return b.J(`S.pg[${JSON.stringify(ex)}].next.note`); };
  const k = mk(['k'], 'towel-leg-curl', 12, 20);
  assert.equal(run(k, 'towel-leg-curl', 20), 'top_hold');
  assert.equal(run(k, 'towel-leg-curl', 20), 'no_heavier', 'the second one changes nothing — as announced');
  const p = mk([], 'pu', 8, 15);
  assert.equal(run(p, 'pu', 15), 'top1', 'a real next step still announced');
  assert.match(read('autow.js'), /top_hold:'Верх диапазона во всех подходах — дальше усложнять не будем, держи этот уровень'/);
});

// ---------- 6
test('6: plank / towel-iso-curl rows show «Доп. вес, кг | Секунды» and «прошлый раз: 30 с» also without it.sec; reps unchanged', () => {
  const b = boot({ state: { lang: 'ru', goal: 'fit', days: 3, next: 0, obDone: 1, custom: [], body: [], pg: {}, prof: { goal: 'fit', sex: 'm', level: 'nov', days: 3, len: 60, place: 'g', prio: [], lim: [] },
    workouts: [{ id: 'w0', start: now - DAY, end: now - DAY + 1, dayIdx: 0, items: [{ exId: 'mk-front-plank', sets: [{ w: '', r: 30, done: true }] }, { exId: 'pu', sets: [{ w: '', r: 12, done: true }] }] }],
    program: [{ name: 'A', items: [{ exId: 'mk-front-plank', sets: 1, min: 20, max: 40, rest: 60 }, { exId: 'pu', sets: 1, min: 8, max: 15, rest: 60 }] }] } });
  b.run('startTimer=()=>{};startW(0);S.active.items.forEach(it=>delete it.sec);workoutView()');
  const h = b.run('app.innerHTML');
  assert.match(h, /<span>Доп\. вес, кг<\/span><span>Секунды<\/span>/);
  assert.match(h, /Цель: 1 × 20–40 с/);
  assert.match(h, /<span>прошлый раз:<\/span> 30 <span>с<\/span>/);
  assert.match(h, /<span>Вес, кг<\/span><span>Повторы<\/span>/);
  assert.match(h, /<span>прошлый раз:<\/span> 12 <span>повт\.<\/span>/);
  assert.equal(b.run('JSON.stringify(S.workouts[0].items[0].sets)'), JSON.stringify([{ w: '', r: 30, done: true }]), 'data unchanged');
  assert.match(read('exscreen.js'), /const sec=!c&&\(!!it\.sec\|\|\(typeof isSecEx==='function'&&isSecEx\(e\.id\)\)\);/);
});

// ---------- 2
test('2: shoulder limitation — vertical pulls show the technique caution (no ban, no pain wording); others and no-limitation do not', () => {
  const b = gym({ prof: { goal: 'mass', sex: 'm', level: 'nov', days: 3, len: 60, place: 'g', prio: [], lim: ['p'] } });
  b.run('startW(0);workoutView()');
  const h = b.run('awSugHTML(S.active.items[0],0)');
  assert.match(h, /⚠ Плечи: хват на ширине плеч или нейтральный, без рывков, амплитуда — комфортная/);
  assert.doesNotMatch(h, /\bбол(ь|и|ью)\b|без боли/);
  assert.equal(b.run('blockLimOk("chin",{lim:["p"]})'), true, 'decision C: not removed');
  assert.doesNotMatch(b.run('awSugHTML({exId:"bp",ns:3,min:8,max:12,sets:[{w:40,r:10,done:false}]},1)'), /Плечи:/);
  const c = gym();
  c.run('startW(0);workoutView()');
  assert.doesNotMatch(c.run('awSugHTML(S.active.items[0],0)'), /Плечи:/);
});

// ---------- 3
test('3: knees at home — removed squat / lunge sets go to the safe exercise already in the day (≤ 5 sets), with a note; nothing risky', () => {
  const b = boot();
  const r = b.J(`(()=>{const B=getBlock('fit_nov_6_b_nobar_b36');const a={goal:B.goal,level:B.level,days:B.days_per_week,place:'b',bar:false,sex:'m',lim:['k']};
    const P=planFromBlock(B,a).days,P0=planFromBlock(B,Object.assign({},a,{lim:[]})).days;const d=P[4],d0=P0[4];
    return{items:d.items.map(x=>x.exId+':'+x.sets),m:[dayMin(d0),dayMin(d)],warn:(d.limWarn||[]).filter(w=>!w.part),html:blockLimWarnHTML({limWarn:(d.limWarn||[]).filter(w=>!w.part)}),
      risky:d.items.filter(x=>!blockLimOk(x.exId,a)).length,orig:B.workouts[4].items.find(x=>x.exId==='step-bw').sets}})()`);
  assert.ok(r.items.includes('step-bw:4'), r.items.join(' '));
  assert.ok(!r.items.some(x => x.startsWith('bwsq')));
  assert.deepEqual(r.m, [59, 59]);
  assert.deepEqual(r.warn.find(w => w.from === 'bwsq'), { from: 'bwsq', to: 'step-bw', lim: ['k'], add: 2 });
  assert.match(r.html, /<b>Приседания[^<]*<\/b> → <b>[^<]+<\/b> <span>\(подходы добавлены:<\/span> \+2\)/);
  assert.equal(r.risky, 0);
  assert.equal(r.orig, 2, 'the block itself is not changed');
  // cap 5 sets per exercise; all blocks with knees: nothing risky, no item above 5 sets from merging
  const big = b.J(`(()=>{const out=blockLimSwap([{exId:'reverse-lunge',sets:5,min:8,max:12,rest:90},{exId:'step-bw',sets:4,min:8,max:12,rest:90}],{lim:['k'],place:'b',bar:false},[]);return out.map(x=>x.exId+':'+x.sets)})()`);
  assert.deepEqual(big, ['step-bw:5']);
});

test('3: a saved plan fixed later (lgFixAll) follows the same rule — sets added, note, no risky item, history untouched', () => {
  const b = boot({ state: { lang: 'ru', goal: 'fit', days: 6, next: 0, obDone: 1, custom: [], body: [], pg: {}, workouts: [{ id: 'w', start: now - DAY, end: now - DAY + 1, items: [] }],
    prof: { goal: 'fit', sex: 'm', level: 'nov', days: 6, len: 60, place: 'b', bar: false, prio: [], lim: [] } } });
  b.run(`S.block={id:'fit_nov_6_b_nobar_b36',next:0};S.program=planFromBlock(getBlock('fit_nov_6_b_nobar_b36'),S.prof).days;S.prof.lim=['k'];save()`);
  const hist = b.run('JSON.stringify(S.workouts)');
  b.run('lgFixAll()');
  const d = b.J('(()=>{const d=S.program[4];return{items:d.items.map(x=>x.exId+":"+x.sets),warn:(d.limWarn||[]).filter(w=>!w.part&&w.from==="bwsq")}})()');
  assert.ok(d.items.includes('step-bw:4'), d.items.join(' '));
  assert.ok(!d.items.some(x => x.startsWith('bwsq')));
  assert.equal(d.warn[0].to, 'step-bw'); assert.equal(d.warn[0].add, 2);
  assert.equal(b.run('S.program.every(d=>d.items.every(x=>blockLimOk(x.exId,{lim:["k"]})))'), true);
  assert.equal(b.run('JSON.stringify(S.workouts)'), hist);
});

// ---------- 7
test('7: signed in on a device without confirmed limitations → catalog pick asks first (local only); quiz marks them confirmed; sync strips it', () => {
  // the chips start from the local S.prof.lim (here «k», e.g. typed on this device before); «Продолжить» confirms
  const b = boot({ state: { lang: 'ru', goal: 'mass', days: 3, next: 0, obDone: 1, workouts: [], custom: [], body: [], prof: { goal: 'mass', sex: 'm', level: 'mid', days: 3, len: 60, place: 'g', prio: [], lim: ['k'] } } });
  b.run('globalThis.confirm=()=>true;window.mzSignedIn=()=>true');
  b.run('preview(CATALOG[0],"catalog")');
  const mh = b.run('$("#modal").innerHTML');
  assert.match(mh, /Ограничения хранятся только на этом устройстве/);
  assert.match(mh, /class="opt chip sel" data-lim="k"/);
  assert.match(mh, /class="opt chip " data-lim="s"/);
  b.run('$("#limok").onclick()');
  assert.equal(b.run('S.limSeen'), 1);
  assert.deepEqual(b.J('S.prof.lim'), ['k']);
  assert.ok(b.J('PV.pr.a.lim').includes('k'), 'the program is built with the confirmed limitation');
  b.run('$("#modal").innerHTML="";preview(CATALOG[0],"catalog")');
  assert.equal(b.run('$("#modal").innerHTML'), '', 'asked once per device');
  const c = boot({ state: { lang: 'ru', goal: 'mass', days: 3, next: 0, obDone: 1, workouts: [], custom: [], body: [] } });
  c.run('preview(CATALOG[0],"catalog")');
  assert.equal(c.run('view'), 'preview', 'not signed in: as before');
  assert.match(read('app.js'), /S\.prof=a;if\(PV\.back==='quiz'\)S\.limSeen=1;/);
  assert.match(read('sync.js'), /delete p\.limSeen;/);
  assert.match(read('sync.js'), /delete it\.limStop;delete it\.merged\}\}/);
});

test('v160: cache version', () => {
  assert.match(read('cache-ver.js'), /var SW_CACHE='moyzal-v164'/);
});
