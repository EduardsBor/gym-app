'use strict';
// P-301: auto-weight wired into the app (startW prefill, finish -> S.pg, equipment profile). History is not rewritten.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

function boot(stored, withFeatures) {
  const store = new Map();
  if (stored !== undefined) store.set('gym', JSON.stringify(stored));
  const nodes = new Map();
  function el(id) {
    if (id && nodes.has(id)) return nodes.get(id);
    const node = {
      id: id || '', innerHTML: '', textContent: '', className: '', value: '', style: {}, dataset: {},
      classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
      append() {}, addEventListener() {}, insertAdjacentHTML() {}, setAttribute() {}, getAttribute() { return null; }, closest() { return null; },
      querySelector() { return null; }, querySelectorAll() { return []; }
    };
    if (id) nodes.set(id, node);
    return node;
  }
  const g = {
    console, setTimeout, clearTimeout, setInterval() { return 0; }, clearInterval() {}, scrollTo() {}, scrollY: 0,
    URL, Blob, navigator: { language: 'ru', languages: ['ru'] },
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
    location: { href: 'http://127.0.0.1/', origin: 'http://127.0.0.1', pathname: '/' },
    document: {
      documentElement: { lang: 'ru' }, title: '', body: { append() {}, style: {} },
      querySelector(sel) { const m = /^#([\w-]+)/.exec(sel || ''); return el(m ? m[1] : ''); },
      querySelectorAll() { return []; }, addEventListener() {}, createElement() { return el(); }
    }
  };
  g.window = g; g.globalThis = g; g.self = g;
  const ctx = vm.createContext(g);
  const files = ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'place.js', 'prog.js', 'plan.js', 'movekit.js'];
  if (withFeatures) files.push('premium.js', 'features.js');
  files.push('progress.js', 'autow.js');
  for (const f of files) vm.runInContext(read(f), ctx, { filename: f });
  return { run: code => vm.runInContext(code, ctx), store };
}

const DAY = 864e5;
function seed(extra) {
  return Object.assign({
    lang: 'ru', goal: 'mass', days: 3, next: 0,
    prof: { goal: 'mass', sex: 'm', level: 'mid', days: 3, len: 60, place: 'g', prio: [], lim: [] },
    program: [{ name: 'A', items: [{ exId: 'bp', sets: 3, min: 8, max: 12, rest: 120 }, { exId: 'mk-front-plank', sets: 3, min: 20, max: 45, rest: 60, sec: 1 }] }],
    workouts: [], custom: [], body: []
  }, extra || {});
}
function hist(start, w, reps) {
  return { id: 'w' + start, start, end: start + 3600e3, dayIdx: 0, dayName: 'A', notes: '', items: [{ exId: 'bp', ns: 3, min: 8, max: 12, rest: 120, sets: reps.map(r => ({ w, r, done: true })) }] };
}
function finish(b, reps, feel, pain) {
  b.run(`(()=>{const A=S.active,it=A.items[0];it.sets.forEach((s,k)=>{s.r=${JSON.stringify(reps)}[k];s.done=true});it.feel=${JSON.stringify(feel || null) || 'undefined'};it.pain=${!!pain};
   A.items[1].sets.forEach(s=>{s.done=true});
   const d=A.items.map(it=>({...it,sets:it.sets.filter(s=>s.done)}));A.items=d;S.workouts.push(A);S.active=null;awFinish(A);save()})()`);
}

test('history before P-301 + «легко» at the top -> next workout prefilled with +2.5 kg, history untouched', () => {
  const now = Date.now();
  const b = boot(seed({ workouts: [hist(now - 3 * DAY, 60, [10, 10, 9])] }));
  const before = JSON.stringify(b.run('S.workouts'));
  b.run('startW(0)');
  assert.deepEqual(JSON.parse(b.run('JSON.stringify(S.active.items[0].sets.map(s=>s.w))')), [60, 60, 60]);
  finish(b, [12, 12, 12], 'easy');
  assert.equal(JSON.stringify(b.run('S.workouts.slice(0,1)')), before);
  assert.equal(b.run('S.workouts[1].items[0].feel'), 'easy');
  assert.equal(b.run('S.pg.bp.next.weight'), 62.5);
  b.run('startW(0)');
  const it = JSON.parse(b.run('JSON.stringify(S.active.items[0])'));
  assert.deepEqual(it.sets.map(s => s.w), [62.5, 62.5, 62.5]);
  assert.deepEqual(it.sets.map(s => s.r), [8, 8, 8]);
});

test('«тяжело» (RIR 0) blocks the increase for a compound lift', () => {
  const b = boot(seed({ workouts: [hist(Date.now() - 2 * DAY, 60, [10, 10, 10])] }));
  b.run('startW(0)');
  finish(b, [12, 12, 12], 'hard');
  assert.equal(b.run('S.pg.bp.next.weight'), 60);
});

test('pain: no increase, next suggestion -10 % (free, no Premium check)', () => {
  const b = boot(seed({ workouts: [hist(Date.now() - 2 * DAY, 60, [10, 10, 10])] }));
  b.run('startW(0)');
  finish(b, [12, 12, 12], 'easy', true);
  assert.equal(b.run('S.pg.bp.next.weight'), 52.5);
  assert.equal(b.run('S.workouts[S.workouts.length-1].items[0].pain'), true);
});

test('first time with an exercise: calibration, no weight prefilled', () => {
  const b = boot(seed());
  b.run('startW(0)');
  assert.equal(b.run('S.active.items[0].sug.cal'), 1);
  assert.deepEqual(JSON.parse(b.run('JSON.stringify(S.active.items[0].sets.map(s=>s.w))')), ['', '', '']);
  assert.equal(b.run('S.active.items[1].sets[0].r'), 20); // plank starts at the min hold
});

test('plank hold progression is stored under the app id', () => {
  const b = boot(seed({ workouts: [hist(Date.now() - 2 * DAY, 60, [10, 10, 10])] }));
  b.run('startW(0)');
  b.run('S.active.items[1].sets.forEach(s=>s.r=20)');
  finish(b, [10, 10, 10]);
  assert.equal(b.run('S.pg["mk-front-plank"].next.target'), 25);
});

test('20-day break: weight x0.9 rounded down on start', () => {
  const b = boot(seed({ workouts: [hist(Date.now() - 20 * DAY, 60, [10, 10, 10])] }));
  b.run('startW(0)');
  assert.equal(b.run('S.active.items[0].sets[0].w'), 52.5);
});

test('scheduled deload: 6th week since auto-weight start, half the sets, results do not count', () => {
  const now = Date.now();
  const b = boot(seed({ pgSince: now - 36 * DAY, workouts: [hist(now - 40 * DAY, 60, [10, 10, 10]), hist(now - 2 * DAY, 80, [10, 10, 10])] }));
  b.run('startW(0)');
  assert.equal(b.run('S.active.dl'), 'scheduled');
  assert.equal(b.run('S.active.items[0].sets.length'), 2);
  assert.equal(b.run('S.active.items[0].sets[0].w'), 80);
  finish(b, [12, 12]);
  assert.equal(b.run('S.pg.bp.next'), undefined);
});

test('equipment profile is used for steps', () => {
  const b = boot(seed({ equip: { db: [5, 7.5, 10, 12.5] }, program: [{ name: 'A', items: [{ exId: 'ht-db', sets: 2, min: 12, max: 15, rest: 90 }] }],
    workouts: [{ id: 'w1', start: Date.now() - 2 * DAY, dayIdx: 0, items: [{ exId: 'ht-db', sets: [{ w: 10, r: 15, done: true }, { w: 10, r: 15, done: true }] }] }] }));
  b.run('startW(0)');
  b.run(`(()=>{const A=S.active;A.items[0].sets.forEach(s=>{s.r=15;s.done=true});S.workouts.push(A);S.active=null;awFinish(A)})()`);
  assert.equal(b.run('S.pg["ht-db"].next.weight'), 12.5);
});
