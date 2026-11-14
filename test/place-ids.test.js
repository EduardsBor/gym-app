'use strict';
// D-214: separate exercise ids per place (gym / home with dumbbells / bodyweight).
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

const BASES = {
  'mk-standing-calf-raise-machine': { d: 'calf-db', b: 'calf-bw' },
  'mk-dumbbell-step-up-low': { b: 'step-bw' },
  'mk-ez-bar-skullcrusher': { d: 'skull-db' },
  'mk-incline-treadmill-walk': { d: 'walk-brisk', b: 'walk-brisk' }
};
const NEW = ['calf-db', 'calf-bw', 'step-bw', 'skull-db', 'walk-brisk'];
// v1.2c: clips from movekit-by-place.json; brisk walk at home / bodyweight stays without a clip (Eduards' exception).
const CLIP = { 'calf-db': 'dumbbell-single-leg-calf-raise.mp4', 'calf-bw': 'single-leg-standing-calf-raise.mp4', 'step-bw': 'single-leg-step-down.mp4', 'skull-db': 'dumbbell-skullcrusher.mp4', 'walk-brisk': '' };
const arr = x => JSON.parse(JSON.stringify(x));

test('per-place ids exist with the right place labels, cards and their v1.2c clips', () => {
  const { run } = boot();
  const ids = arr(run('EX.map(e => e.id)'));
  assert.equal(new Set(ids).size, ids.length);
  const meta = arr(run('META'));
  assert.deepEqual(NEW.map(id => meta[id]), ['gd|', 'gdb|', 'gdb|', 'gd|p', 'gdb|']);
  assert.equal(meta['mk-standing-calf-raise-machine'], 'g|');
  assert.equal(meta['mk-dumbbell-step-up-low'], 'gd|');
  assert.equal(meta['mk-ez-bar-skullcrusher'], 'g|p');
  assert.equal(meta['mk-incline-treadmill-walk'], 'g|');
  assert.equal(meta['mk-band-high-face-pull'], 'gd|');
  for (const id of NEW) {
    assert.equal(ids.includes(id), true, id);
    assert.equal(run(`NO_ANIM.has(${JSON.stringify(id)})`), true, id);
    assert.equal(run(`movekitFile(${JSON.stringify(id)})`), CLIP[id], id);
    for (const T of ['LIB', 'LIB_EN', 'LIB_LV']) assert.equal(run(`${T}[${JSON.stringify(id)}].length`), 3, T + ' ' + id);
    for (const T of ['TECH', 'TECH_EN', 'TECH_LV']) assert.ok(run(`${T}[${JSON.stringify(id)}][0].length`) >= 3, T + ' ' + id);
  }
  // Старые id остаются в каталоге и со своими роликами.
  for (const base of Object.keys(BASES)) {
    assert.equal(ids.includes(base), true, base);
    assert.ok(run(`movekitFile(${JSON.stringify(base)})`).endsWith('.mp4'), base);
  }
  assert.equal(run('exBy("walk-brisk").name'), 'Быстрая ходьба (улица или на месте)');
  assert.equal(run('exBy("calf-bw").group'), 'Ноги');
});

test('placeVariant maps only where the old id does not fit the place', () => {
  const { run } = boot();
  for (const [base, v] of Object.entries(BASES)) {
    assert.equal(run(`placeVariant(${JSON.stringify(base)}, 'g')`), null, base);
    for (const p of ['d', 'b']) assert.equal(run(`placeVariant(${JSON.stringify(base)}, ${JSON.stringify(p)})`), v[p] || null, base + ' ' + p);
  }
  assert.equal(run("placeVariant('bp', 'd')"), null);
});

test('every trainer template uses only exercises valid for its place', () => {
  const { run } = boot();
  const keys = arr(run('Object.keys(PROG.T)'));
  assert.equal(keys.length, 180);
  const meta = arr(run('META'));
  let plans = 0;
  for (const k of keys) {
    const [goal, level, days, place] = k.split('_');
    for (const lim of [[], ['k'], ['s'], ['p']]) for (const len of [45, 60, 90]) {
      const p = arr(run(`planFromTemplate(${JSON.stringify({ goal, level, days: +days, place, len, lim, prio: ['Ноги', 'Трицепс'] })})`));
      plans++;
      for (const d of p.days) {
        const ids = d.items.map(i => i.exId);
        if (d.wu && d.wu.cardio) ids.push(d.wu.cardio.id);
        if (d.cd && d.cd.cardio) ids.push(d.cd.cardio.id);
        for (const id of ids) {
          const m = meta[id];
          assert.ok(!m || m.split('|')[0].includes(place), `${k} ${id}`);
          if (place === 'g') assert.equal(NEW.includes(id), false, `${k} gym got ${id}`);
          if (place !== 'g' && BASES[id] && BASES[id][place]) assert.fail(`${k} kept ${id}`);
        }
        assert.equal(new Set(d.items.map(i => i.exId)).size, d.items.length, k);
      }
    }
  }
  assert.equal(plans, 2160);
});

test('onboarding for each place gives the right calf, step-up, skullcrusher and walk ids', () => {
  const { run } = boot();
  const pick = (place, goal, days, level) => {
    const p = arr(run(`planFromTemplate(${JSON.stringify({ goal, level, days, place, len: 60, lim: [], prio: [] })})`));
    const ids = new Set();
    p.days.forEach(d => { d.items.forEach(i => ids.add(i.exId)); if (d.wu.cardio) ids.add(d.wu.cardio.id); if (d.cd.cardio) ids.add(d.cd.cardio.id); });
    return ids;
  };
  const all = place => { const s = new Set(); for (const goal of ['mass', 'str', 'loss', 'fit']) for (const level of ['nov', 'mid', 'adv']) for (const days of [2, 3, 4, 5]) pick(place, goal, days, level).forEach(x => s.add(x)); return s; };
  const g = all('g'), d = all('d'), b = all('b');
  assert.equal(g.has('mk-standing-calf-raise-machine'), true);
  assert.equal(d.has('calf-db'), true);
  assert.equal(d.has('skull-db'), true);
  assert.equal(d.has('walk-brisk'), true);
  assert.equal(d.has('mk-dumbbell-step-up-low'), true);
  assert.equal(b.has('calf-bw'), true);
  assert.equal(b.has('step-bw'), true);
  assert.equal(b.has('walk-brisk'), true);
});

test('a saved home plan migrates once; history and the active workout keep old ids', () => {
  const day = {
    name: 'Ноги', items: [
      { exId: 'gsq', sets: 3, min: 8, max: 12, rest: 90 },
      { exId: 'mk-standing-calf-raise-machine', sets: 2, min: 12, max: 15, rest: 60 },
      { exId: 'mk-ez-bar-skullcrusher', sets: 2, min: 10, max: 15, rest: 60 },
      { exId: 'mk-incline-treadmill-walk', sets: 1, min: 10, max: 15, rest: 0 }
    ],
    wu: { min: 8, cardio: { id: 'mk-incline-treadmill-walk', min: 3, note: '' }, mob: [{ id: 'mk-band-row', dose: '10' }], ramp: [] },
    cd: { cardio: { id: 'mk-incline-treadmill-walk', min: 3, note: '' }, stretch: [] }
  };
  const hist = [{ id: 'w1', start: 1, end: 2, items: [{ exId: 'mk-standing-calf-raise-machine', sets: [{ w: 0, r: 15, done: true }] }, { exId: 'calf', sets: [{ w: 0, r: 12, done: true }] }] }];
  const active = { items: [{ exId: 'mk-standing-calf-raise-machine', sets: [{ w: 0, r: 0, done: false }] }] };
  const seed = { custom: [], workouts: hist, next: 0, body: [], prof: { goal: 'fit', sex: 'm', level: 'nov', days: 3, len: 60, place: 'd', prio: [], lim: [] }, program: [day], active };
  const { run, store } = boot(seed);
  assert.deepEqual(arr(run('S.program[0].items.map(i => i.exId)')), ['gsq', 'calf-db', 'skull-db', 'walk-brisk']);
  assert.equal(run('S.program[0].wu.cardio.id'), 'walk-brisk');
  assert.equal(run('S.program[0].cd.cardio.id'), 'walk-brisk');
  assert.equal(run('S.program[0].wu.mob[0].id'), 'mk-band-row');
  assert.deepEqual(arr(run('S.workouts[0].items.map(i => i.exId)')), ['mk-standing-calf-raise-machine', 'calf']);
  assert.equal(run('S.active.items[0].exId'), 'mk-standing-calf-raise-machine');
  assert.equal(run('S.placeIds'), 1);
  assert.equal(run('exHist("mk-standing-calf-raise-machine").length'), 1);
  const saved = JSON.parse(store.get('gym'));
  assert.equal(saved.placeIds, 1);
  assert.equal(saved.program[0].items[1].exId, 'calf-db');
  // Пользователь сам вернул тренажёр через замену — второй запуск его выбор не трогает.
  saved.program[0].items[1].exId = 'mk-standing-calf-raise-machine';
  const again = boot(saved);
  assert.equal(again.run('S.program[0].items[1].exId'), 'mk-standing-calf-raise-machine');
});

test('bodyweight and gym plans migrate correctly', () => {
  const mk = place => ({ custom: [], workouts: [], next: 0, body: [], prof: { goal: 'fit', sex: 'm', level: 'nov', days: 3, len: 60, place, prio: [], lim: [] },
    program: [{ name: 'A', items: [{ exId: 'mk-standing-calf-raise-machine', sets: 2, min: 12, max: 15, rest: 60 }, { exId: 'mk-dumbbell-step-up-low', sets: 2, min: 10, max: 12, rest: 60 }, { exId: 'mk-ez-bar-skullcrusher', sets: 2, min: 10, max: 12, rest: 60 }], wu: { cardio: { id: 'mk-incline-treadmill-walk', min: 3 }, mob: [], ramp: [] }, cd: { stretch: [] } }] });
  const b = boot(mk('b'));
  // Для своего веса у EZ-грифа нет варианта: id остаётся, приложение предложит замену как раньше.
  assert.deepEqual(arr(b.run('S.program[0].items.map(i => i.exId)')), ['calf-bw', 'step-bw', 'mk-ez-bar-skullcrusher']);
  assert.equal(b.run('S.program[0].wu.cardio.id'), 'walk-brisk');
  const g = boot(mk('g'));
  assert.deepEqual(arr(g.run('S.program[0].items.map(i => i.exId)')), ['mk-standing-calf-raise-machine', 'mk-dumbbell-step-up-low', 'mk-ez-bar-skullcrusher']);
  assert.equal(g.run('S.placeIds'), 1);
});

test('legacy ids still resolve: old «calf» plan goes to the home variant after the legacy map', () => {
  const seed = { custom: [], workouts: [], next: 0, body: [], prof: { goal: 'fit', sex: 'm', level: 'nov', days: 3, len: 60, place: 'b', prio: [], lim: [] },
    program: [{ name: 'A', items: [{ exId: 'calf', sets: 2, min: 12, max: 15, rest: 60 }, { exId: 'step', sets: 2, min: 10, max: 12, rest: 60 }, { exId: 'wlk', sets: 1, min: 10, max: 15, rest: 0 }], wu: { mob: [], ramp: [] }, cd: { stretch: [] } }] };
  const { run } = boot(seed);
  assert.deepEqual(arr(run('S.program[0].items.map(i => i.exId)')), ['calf-bw', 'step-bw', 'walk-brisk']);
  assert.equal(run('exBy("calf").name'), 'Подъём на носки');
});

test('swap list offers the place variant next to the old id', () => {
  const { run } = boot();
  assert.deepEqual(arr(run('ALT["mk-standing-calf-raise-machine"].slice(0, 2)')), ['calf-db', 'calf-bw']);
  assert.equal(run('ALT["calf-db"][0]'), 'mk-standing-calf-raise-machine');
  assert.equal(run('ALT["mk-ez-bar-skullcrusher"][0]'), 'skull-db');
  assert.equal(run('ALT["walk-brisk"][0]'), 'mk-incline-treadmill-walk');
  assert.equal(run('okEx("calf-db", {place: "d", lim: []})'), true);
  assert.equal(run('okEx("mk-standing-calf-raise-machine", {place: "d", lim: []})'), false);
});

test('place.js is loaded after cd.js and before the plan builder, and is precached', () => {
  const html = read('index.html');
  const i = n => html.indexOf(`<script src="${n}">`);
  assert.ok(i('cd.js') >= 0 && i('cd.js') < i('place.js') && i('place.js') < i('prog.js') && i('place.js') < i('plan.js'));
  const sw = read('sw.js');
  assert.match(sw, /'place\.js'/);
  assert.match(sw, /const C='moyzal-v52'/);
});
