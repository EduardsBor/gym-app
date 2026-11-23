'use strict';
// D-221: walk-brisk is not available for gym (place g); stays for home (d) and bodyweight (b).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const arr = x => JSON.parse(JSON.stringify(x));

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
  return { run: code => vm.runInContext(code, ctx), store, el, nodes };
}

function swapIds(run, cur, a) {
  run(`swapModal(${JSON.stringify(cur)}, ${JSON.stringify(a)}, function(){})`);
  const html = run('document.querySelector("#modal").innerHTML');
  return { html, ids: [...html.matchAll(/data-p="([^"]+)"/g)].map(m => m[1]) };
}

const NAME = 'Быстрая ходьба (улица или на месте)';
const gymProf = { goal: 'fit', sex: 'm', level: 'nov', days: 3, len: 60, place: 'g', prio: [], lim: [] };

test('D-221: walk-brisk is not in the gym library, gym swaps or the gym equipment profile; home and bodyweight still have it', () => {
  const { run } = boot(undefined, true);
  assert.equal(run('META["walk-brisk"]'), 'db|');
  assert.equal(run('placeHas("walk-brisk", "g")'), false);
  assert.equal(run('placeHas("walk-brisk", "d")'), true);
  assert.equal(run('placeHas("walk-brisk", "b")'), true);
  assert.equal(run('walkBriskPlaceOk("g")'), false);
  assert.equal(run('walkBriskPlaceOk("d")'), true);
  assert.equal(run('walkBriskPlaceOk("b")'), true);

  const libG = arr(run('libFilter(EX, {p: "g"}).map(e => e.id)'));
  const libD = arr(run('libFilter(EX, {p: "d"}).map(e => e.id)'));
  const libB = arr(run('libFilter(EX, {p: "b"}).map(e => e.id)'));
  assert.equal(libG.includes('walk-brisk'), false);
  assert.equal(libD.includes('walk-brisk'), true);
  assert.equal(libB.includes('walk-brisk'), true);

  assert.equal(run('eqAvail("walk-brisk", "g")'), false);
  assert.equal(run('eqAvail("walk-brisk", "d")'), true);
  assert.equal(run('eqAvail("walk-brisk", "b")'), true);
  assert.equal(run('okEx("walk-brisk", {place: "g", lim: []})'), false);
  assert.equal(run('okEx("walk-brisk", {place: "d", lim: []})'), true);
  assert.equal(run('okEx("walk-brisk", {place: "b", lim: []})'), true);

  run('eqSetActive("gym", {silent: true})');
  assert.equal(run('eqPlaces()'), 'g');
  assert.equal(arr(run('libFilter(EX, {p: eqPlaces()}).map(e => e.id)')).includes('walk-brisk'), false);
  run('eqSetActive("home", {silent: true})');
  assert.equal(arr(run('libFilter(EX, {p: eqPlaces()}).map(e => e.id)')).includes('walk-brisk'), true);

  // features.js wraps swapModal and fills place from the active equipment profile unless places is set.
  const gymSwap = swapIds(run, 'mk-incline-treadmill-walk', { place: 'g', places: 'g', lim: [] });
  const homeSwap = swapIds(run, 'mk-incline-treadmill-walk', { place: 'd', places: 'd', lim: [] });
  const bwSwap = swapIds(run, 'mk-incline-treadmill-walk', { place: 'b', places: 'b', lim: [] });
  assert.equal(gymSwap.ids.includes('walk-brisk'), false);
  assert.equal(homeSwap.ids.includes('walk-brisk'), true);
  assert.equal(bwSwap.ids.includes('walk-brisk'), true);
  assert.equal(gymSwap.html.includes(NAME), false);
  assert.equal(homeSwap.html.includes(NAME), true);
});

test('D-221: a history entry with walk-brisk still renders the name', () => {
  const seed = {
    custom: [], next: 0, body: [], prof: gymProf, program: [],
    workouts: [{
      id: 'w-walk', start: Date.now() - 3600000, end: Date.now() - 1800000, dayName: 'Кардио',
      items: [{ exId: 'walk-brisk', sets: [{ w: 0, r: 20, done: true }] }]
    }]
  };
  const { run } = boot(seed);
  assert.equal(run('S.workouts[0].items[0].exId'), 'walk-brisk');
  assert.equal(run('exBy("walk-brisk").name'), NAME);
  run('showW("w-walk")');
  const html = run('document.querySelector("#modal").innerHTML');
  assert.match(html, /Быстрая ходьба \(улица или на месте\)/);
  assert.equal(run('S.workouts[0].items[0].exId'), 'walk-brisk');
});

test('D-221: a saved gym-place program with walk-brisk loads unchanged and still opens with the name', () => {
  const day = {
    name: 'День с ходьбой',
    items: [
      { exId: 'gsq', sets: 3, min: 8, max: 12, rest: 90 },
      { exId: 'walk-brisk', sets: 1, min: 10, max: 15, rest: 0 }
    ],
    wu: { min: 8, cardio: { id: 'walk-brisk', min: 3, note: '' }, mob: [], ramp: [] },
    cd: { cardio: { id: 'walk-brisk', min: 3, note: '' }, stretch: [] }
  };
  const seed = { custom: [], workouts: [], next: 0, body: [], prof: gymProf, program: [day], placeIds: 1, planV12c: 1 };
  const { run, store } = boot(seed);
  assert.deepEqual(arr(run('S.program[0].items.map(i => i.exId)')), ['gsq', 'walk-brisk']);
  assert.equal(run('S.program[0].wu.cardio.id'), 'walk-brisk');
  assert.equal(run('S.program[0].cd.cardio.id'), 'walk-brisk');
  run('program()');
  const html = run('document.querySelector("#app").innerHTML');
  assert.match(html, /Быстрая ходьба \(улица или на месте\)/);
  const saved = JSON.parse(store.get('gym'));
  assert.deepEqual(saved.program[0].items.map(i => i.exId), ['gsq', 'walk-brisk']);
  assert.equal(saved.program[0].wu.cardio.id, 'walk-brisk');
  assert.equal(saved.program[0].cd.cardio.id, 'walk-brisk');
});

test('D-221: gym trainer templates do not use walk-brisk; home and bodyweight programs still may; no-clip exception is walk-brisk only d/b', () => {
  const { run } = boot();
  const gymHits = arr(run(`(() => {
    const W = PROG.I.indexOf('walk-brisk');
    const hits = [];
    for (const [k, t] of Object.entries(PROG.T)) {
      if (!k.endsWith('_g')) continue;
      for (const [di, day] of t[2].entries()) {
        for (const it of day[1] || []) if (it[0] === W) hits.push(k + ' item ' + di);
        if (day[3] && day[3][0] === W) hits.push(k + ' wu ' + di);
        if (Array.isArray(day[3] && day[3][1]) && day[3][1].includes(W)) hits.push(k + ' wu-sub ' + di);
        if (day[4] && day[4][0] === W) hits.push(k + ' cd ' + di);
        if (Array.isArray(day[4] && day[4][1]) && day[4][1].includes(W)) hits.push(k + ' cd-sub ' + di);
      }
    }
    return hits;
  })()`));
  assert.deepEqual(gymHits, []);
  const homeHas = run(`(() => { const W = PROG.I.indexOf('walk-brisk');
    return Object.keys(PROG.T).some(k => k.endsWith('_d') && PROG.T[k][2].some(day =>
      (day[1]||[]).some(it => it[0] === W) || (day[3] && day[3][0] === W) || (day[4] && day[4][0] === W))); })()`);
  const bodyHas = run(`(() => { const W = PROG.I.indexOf('walk-brisk');
    return Object.keys(PROG.T).some(k => k.endsWith('_b') && PROG.T[k][2].some(day =>
      (day[1]||[]).some(it => it[0] === W) || (day[3] && day[3][0] === W) || (day[4] && day[4][0] === W))); })()`);
  assert.equal(homeHas, true);
  assert.equal(bodyHas, true);
  assert.equal(run('clipOk("walk-brisk", "g")'), false);
  assert.equal(run('clipOk("walk-brisk", "d")'), true);
  assert.equal(run('clipOk("cd_breath", "g")'), true);
  assert.equal(run('workOk("walk-brisk", {place: "g", level: "nov", lim: [], gear: []}, new Set())'), false);
  assert.equal(run('workOk("walk-brisk", {place: "d", level: "nov", lim: [], gear: []}, new Set())'), true);
});

test('D-221: sw is moyzal-v67 and changelog mentions D-221', () => {
  assert.match(read('cache-ver.js'), /var SW_CACHE='moyzal-v163'/);
  assert.match(read('sw.js'), /const C=SW_CACHE/);
  assert.match(read('CHANGELOG.md'), /D-221/);
  assert.equal(read('sw.js').includes("C='moyzal-v64'"), false);
});
