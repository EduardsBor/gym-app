'use strict';
// v1.2c (D-214): trainer programs only with MoveKit clips, home without a pull-up bar, one-time plan migration.
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
    console, setTimeout, clearTimeout, setInterval() { return 0; }, clearInterval() {},
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
  for (const f of files) vm.runInContext(read(f), ctx, { filename: f });
  return { run: code => vm.runInContext(code, ctx), store };
}

const arr = x => JSON.parse(JSON.stringify(x));
const NO_CLIP_OK = new Set(['walk-brisk', 'cd_breath']); // Eduards' exceptions: brisk walk at home / bodyweight, lying breath
const BAR = ['pull', 'chin', 'inv', 'scap-pullup', 'w_scpull', 'dead-hang', 'assisted-pullup', 'mk-hanging-knee-raises', 'hanging-knee-raise'];
const GOALS = ['mass', 'str', 'loss', 'fit'], LEVELS = ['nov', 'mid', 'adv'], DAYS = [2, 3, 4, 5, 6], PLACES = ['g', 'd', 'b'], LENS = [30, 45, 60, 75, 90];
const LIMS = [[], ['s'], ['k'], ['p'], ['s', 'k', 'p']];

function planIds(p) {
  const out = [];
  for (const d of p.days) {
    for (const it of d.items) out.push(it.exId);
    if (d.wu) { if (d.wu.cardio) out.push(d.wu.cardio.id); for (const m of d.wu.mob || []) out.push(m.id); for (const r of d.wu.ramp || []) out.push(r.exId); }
    if (d.cd) { if (d.cd.cardio) out.push(d.cd.cardio.id); for (const m of d.cd.stretch || []) out.push(m.id); }
  }
  return out;
}

test('packed programs: every id is a library card with a MoveKit clip (except brisk walk and lying breath)', () => {
  const { run } = boot();
  const ids = new Set(arr(run('EX.map(e => e.id)')));
  const I = arr(run('PROG.I'));
  assert.equal(new Set(I).size, I.length);
  for (const id of I) {
    assert.equal(ids.has(id), true, 'card ' + id);
    if (!NO_CLIP_OK.has(id)) assert.match(run(`movekitFile(${JSON.stringify(id)})`), /\.mp4$/, 'clip ' + id);
  }
  // Trainer v1.2c names for the new place ids.
  assert.equal(run('exBy("step-bw").name'), 'Спуск со ступеньки на одной ноге');
  assert.equal(run('exBy("band-pulldown").group'), 'Спина');
  assert.equal(run('movekitFile("band-pulldown")'), 'band-kneeling-pulldown.mp4');
  assert.equal(run('movekitFile("rdl-db")'), 'kickstand-dumbbell-romanian-deadlift.mp4');
  assert.equal(run('movekitFile("ht-bw")'), 'glute-bridge.mp4');
  const meta = arr(run('META'));
  assert.deepEqual(['step-bw', 'rdl-db', 'rdl-band', 'rdl-kb', 'bwsq', 'mk-rkc-plank', 'ht', 'pull', 'chin', 'inv'].map(id => meta[id]),
    ['gdb|', 'gd|s', 'gd|s', 'g|s', 'gdb|k', 'gdb|s', 'g|', 'gb|', 'gb|', 'b|']);
  assert.equal(run('PROG.X["rdl-db"]'), 1);
});

test('every generated plan (all answers and limitations) uses only cards with a clip; home has no pull-up bar', () => {
  const { run } = boot();
  run('globalThis.__p = a => planFromTemplate(a)');
  let n = 0;
  for (const goal of GOALS) for (const level of LEVELS) for (const days of DAYS) for (const place of PLACES) for (const len of LENS) for (const lim of LIMS) {
    const p = arr(run(`__p(${JSON.stringify({ goal, level, days, len, place, sex: 'm', prio: [], lim })})`));
    const key = [goal, level, days, place, len, lim.join('')].join('_');
    for (const id of planIds(p)) {
      if (!NO_CLIP_OK.has(id)) assert.match(run(`movekitFile(${JSON.stringify(id)})`), /\.mp4$/, key + ' ' + id);
      if (place === 'd') assert.equal(BAR.includes(id), false, key + ' bar ' + id);
      if (place !== 'g') assert.equal(id === 'mk-incline-treadmill-walk', false, key + ' treadmill');
    }
    n++;
  }
  assert.equal(n, 4 * 3 * 5 * 3 * 5 * 5);
  // Raw templates and pools for home have no bar exercises either.
  const bad = arr(run(`(() => { const out = []; const I = PROG.I; const bar = ${JSON.stringify(BAR)};
    for (const [k, t] of Object.entries(PROG.T)) { if (!k.endsWith('_d')) continue;
      for (const day of t[2]) for (const it of day[1]) if (bar.includes(I[it[0]])) out.push(k + ' ' + I[it[0]]); }
    for (const list of Object.values(PROG.P.d)) for (const i of list) if (bar.includes(I[i])) out.push('pool ' + I[i]);
    return out; })()`));
  assert.deepEqual(bad, []);
});

test('plans without limitations follow the trainer template exactly', () => {
  const { run } = boot();
  const diff = arr(run(`(() => { const out = [];
    for (const [k, t] of Object.entries(PROG.T)) { const [goal, level, days, place] = k.split('_');
      for (let li = 0; li < 5; li++) { const p = planFromTemplate({ goal, level, days: +days, place, len: PROG.L[li], sex: 'm', prio: [], lim: [] });
        t[2].forEach((day, di) => { const want = day[1].filter(it => setsAt(it[3], li) > 0).map(it => PROG.I[it[0]]);
          const got = p.days[di].items.filter(it => !isCardio(it.exId) || want.includes(it.exId)).map(it => it.exId);
          if (want.join() !== got.join()) out.push(k + ' ' + PROG.L[li] + ' ' + di + ': ' + want.join() + ' / ' + got.join()); }); } }
    return out.slice(0, 5); })()`));
  assert.deepEqual(diff, []);
});

test('v1.2c migration: saved home plan is remapped once, history keeps old ids and names', () => {
  const stored = {
    goal: 'mass', days: 3, next: 0, custom: [], body: [], placeIds: 1,
    prof: { goal: 'mass', sex: 'm', level: 'mid', days: 3, len: 60, place: 'd', prio: [], lim: ['s'] },
    program: [{
      name: 'День A',
      items: [{ exId: 'pull', sets: 3, min: 6, max: 10, rest: 120 }, { exId: 'chin', sets: 2, min: 6, max: 10, rest: 120 },
        { exId: 'ht', sets: 3, min: 8, max: 12, rest: 90 }, { exId: 'inv', sets: 3, min: 8, max: 12, rest: 90 },
        { exId: 'plank-advanced', sets: 2, min: 20, max: 40, rest: 60, sec: 1 }, { exId: 'dbp', sets: 4, min: 8, max: 12, rest: 90 }],
      wu: { min: 8, cardio: { id: 'jump', min: 3 }, mob: [{ id: 'wrist-mobility', dose: '10' }, { id: 'ankle-knee-to-wall', dose: '8' }], ramp: [] },
      cd: { cardio: null, stretch: [{ id: 'stretch-hamstring', dose: '30 с' }, { id: 'cd_lat', dose: '30 с' }, { id: 'cd_breath', dose: '1 мин' }] }
    }],
    workouts: [{ id: 'h1', start: 1, end: 2, dayName: 'Старая', notes: '', items: [{ exId: 'pull', sets: [{ w: 0, r: 8, done: true }] }, { exId: 'stretch-hamstring', sets: [] }] }],
    active: { id: 'a1', start: 1, dayIdx: 0, dayName: 'День A', items: [{ exId: 'pull', sets: [] }] }
  };
  const { run, store } = boot(stored);
  assert.equal(run('S.planV12c'), 1);
  assert.equal(run('S.program[0].items.map(it => it.exId).join(",")'), 'band-pulldown,mk-band-row,ht-db,dbr,mk-front-plank,dbp');
  const second = run('S.program[0].items[1].exId');
  assert.equal(second, 'mk-band-row');
  assert.equal(['pull', 'chin', 'inv', 'band-pulldown'].includes(second), false, second);
  assert.match(run(`META[${JSON.stringify(second)}]`), /^[gb]*d/);
  assert.equal(run('S.program[0].items[0].sets'), 3);
  assert.equal(run('S.program[0].items[4].sec'), 1);
  assert.equal(run('S.program[0].wu.mob.map(m => m.id).join(",")'), 'wrist-flexor-stretch,tibialis-raise');
  assert.equal(run('S.program[0].cd.stretch.map(m => m.id).join(",")'), 'hamstring-sweep,thoracic-rotation,cd_breath');
  // History and the started workout are not touched; old cards still show their names.
  assert.equal(run('S.workouts[0].items.map(it => it.exId).join(",")'), 'pull,stretch-hamstring');
  assert.equal(run('S.active.items[0].exId'), 'pull');
  assert.equal(run('exBy("pull").name'), 'Подтягивания');
  assert.notEqual(run('exBy("stretch-hamstring").name'), '?');
  assert.equal(JSON.parse(store.get('gym')).planV12c, 1);
  // Runs only once: a plan saved after the flag is left alone.
  const again = JSON.parse(store.get('gym'));
  again.program[0].items[0].exId = 'pull';
  const b = boot(again);
  assert.equal(b.run('S.program[0].items[0].exId'), 'pull');
});

test('v1.2c migration: gym keeps its ids, bodyweight gets bridge and step-down variants', () => {
  const day = ids => ({ name: 'A', items: ids.map(exId => ({ exId, sets: 3, min: 8, max: 12, rest: 90 })), wu: { cardio: null, mob: [], ramp: [] }, cd: { cardio: null, stretch: [{ id: 'cd_lat', dose: '' }] } });
  const g = boot({ goal: 'mass', days: 1, next: 0, custom: [], body: [], workouts: [], placeIds: 1,
    prof: { goal: 'mass', sex: 'm', level: 'mid', days: 1, len: 60, place: 'g', prio: [], lim: [] }, program: [day(['pull', 'ht', 'negative-pullup', 'reverse-lunge-supported'])] });
  assert.equal(g.run('S.program[0].items.map(it => it.exId).join(",")'), 'pull,ht,scap-pullup,reverse-lunge-db');
  assert.equal(g.run('S.program[0].cd.stretch[0].id'), 'dead-hang');
  const b = boot({ goal: 'mass', days: 1, next: 0, custom: [], body: [], workouts: [], placeIds: 1,
    prof: { goal: 'mass', sex: 'm', level: 'nov', days: 1, len: 60, place: 'b', prio: [], lim: [] }, program: [day(['pull', 'ht', 'mk-dumbbell-step-up-low', 'plank-advanced'])] });
  assert.equal(b.run('S.program[0].items.map(it => it.exId).join(",")'), 'pull,ht-bw,step-bw,mk-rkc-plank');
});
