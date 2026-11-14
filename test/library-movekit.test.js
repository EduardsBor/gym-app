'use strict';
// D-215 (C-109): library only with MoveKit clips; 28 cards hidden but keep names; no «Анимация в разработке».
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
  if (withFeatures) files.push('features.js');
  for (const f of files) vm.runInContext(read(f), ctx, { filename: f });
  return { run: code => vm.runInContext(code, ctx), store };
}

const arr = x => JSON.parse(JSON.stringify(x));
const NO_CLIP_OK = new Set(['walk-brisk', 'cd_breath']);
const C109 = JSON.parse(read('test/fixtures/c109-decisions.json'));
const HIDE = C109.hide.concat(['cd_lat', 'cd_quad', 'cd_xbody']);

test('every visible library card has a MoveKit clip for each of its places (except brisk walk and lying breath)', () => {
  const { run } = boot();
  const ex = arr(run('EX.map(e => e.id)'));
  const meta = arr(run('META'));
  assert.equal(ex.length, 170);
  for (const id of ex) {
    if (NO_CLIP_OK.has(id)) continue;
    const places = (meta[id] || 'gdb|').split('|')[0];
    for (const p of places) assert.match(run(`movekitFile(${JSON.stringify(id)}, ${JSON.stringify(p)})`), /\.mp4$/, id + ' ' + p);
  }
});

test('ALT and generator slot lists contain only visible cards with a clip', () => {
  const { run } = boot();
  const ex = new Set(arr(run('EX.map(e => e.id)')));
  const alt = arr(run('ALT'));
  for (const [k, list] of Object.entries(alt)) {
    assert.equal(ex.has(k), true, 'key ' + k);
    for (const v of list) {
      assert.equal(ex.has(v), true, k + ' -> ' + v);
      if (!NO_CLIP_OK.has(v)) assert.match(run(`movekitFile(${JSON.stringify(v)})`), /\.mp4$/, k + ' -> ' + v);
    }
  }
  const slot = arr(run('SLOT'));
  for (const [k, lists] of Object.entries(slot)) for (const list of lists) for (const v of list) assert.equal(HIDE.includes(v), false, k + ' ' + v);
});

test('hidden cards are gone from the library but keep their names, metas and texts', () => {
  const { run } = boot();
  assert.equal(HIDE.length, 28);
  for (const id of HIDE) {
    assert.equal(run(`EX.some(e => e.id === ${JSON.stringify(id)})`), false, id);
    assert.equal(run(`isHidden(${JSON.stringify(id)})`), true, id);
    assert.notEqual(run(`exBy(${JSON.stringify(id)}).name`), '?', id);
    assert.ok(run(`META[${JSON.stringify(id)}]`), id);
    assert.equal(run(`altCands("pu").some(e => e.id === ${JSON.stringify(id)})`), false);
  }
  assert.equal(run('exBy("stretch-hamstring").name'), 'Растяжка задней поверхности бедра');
});

test('the 11 C-109 cards have clips and places as decided', () => {
  const { run } = boot();
  const meta = arr(run('META'));
  for (const [id, files] of Object.entries(C109.show)) {
    assert.equal(meta[id].split('|')[0], Object.keys(files).join(''), id);
    for (const [p, f] of Object.entries(files)) assert.equal(run(`movekitFile(${JSON.stringify(id)}, ${JSON.stringify(p)})`), f, id + ' ' + p);
  }
  assert.equal(meta['push-press'], 'gd|sp');
  assert.equal(meta['ankle-knee-to-wall'], 'gd|');
  assert.equal(run('exBy("push-press").name'), 'Жимовой швунг с гантелями');
  assert.equal(run('exBy("ankle-knee-to-wall").name'), 'Мобилизация голеностопа с резинкой');
  assert.equal(run('tr("Жимовой швунг с гантелями")'), 'Жимовой швунг с гантелями'); // ru UI
});

test('no «Анимация в разработке» anywhere; cards without a clip show no placeholder', () => {
  for (const f of ['tech.js', 'cards.js', 'cd.js', 'lib.js', 'app.js', 'movekit.js', 'place.js', 'style.css', 'index.html', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js']) {
    const s = read(f);
    assert.equal(/Анимация в разработке|Animation in development|Animācija tiek izstrādāta|animsoon/.test(s), false, f);
  }
  const { run } = boot();
  assert.equal(run('animMedia("walk-brisk")'), '');
  assert.equal(run('animMedia("cd_breath")'), '');
});

test('safety line is filled in RU/EN/LV for the 9 v1.2c cards', () => {
  const { run } = boot();
  for (const id of ['calf-db', 'calf-bw', 'ht-db', 'ht-bw', 'band-pulldown', 'hamstring-sweep', 'hip-90-90', 'ankle-circles', 'wrist-flexor-stretch'])
    for (const T of ['TECH', 'TECH_EN', 'TECH_LV']) assert.ok(run(`${T}[${JSON.stringify(id)}][2]`).length > 20, T + ' ' + id);
  assert.equal(run('TECH["band-pulldown"][2]'), 'Перед подходом проверь резинку на надрывы; дверь закрыта и открывается от тебя.');
});

test('generator never picks a hidden card', () => {
  const { run } = boot();
  const bad = arr(run(`(() => { const out = [];
    for (const goal of ['mass','str','loss','fit']) for (const level of ['nov','mid','adv']) for (const days of [2,3,4,5,6]) for (const place of ['g','d','b']) for (const lim of [[], ['s','k','p']]) {
      const a = { goal, level, days, len: 90, place, sex: 'm', prio: ['Грудь','Спина'], lim };
      for (const p of [planFromTemplate(a), generateAuto(a)]) for (const d of (p && p.days) || []) for (const it of d.items) if (isHidden(it.exId)) out.push(goal+level+days+place+' '+it.exId); }
    return out.slice(0, 5); })()`));
  assert.deepEqual(bad, []);
});

test('D-215 migration: hidden ids in a saved plan move to cards with a clip once; history keeps names', () => {
  const stored = {
    goal: 'mass', days: 2, next: 0, custom: [], body: [], placeIds: 1, planV12c: 1,
    prof: { goal: 'mass', sex: 'm', level: 'mid', days: 2, len: 60, place: 'g', prio: [], lim: [] },
    program: [{ name: 'A', items: ['smith-hip-thrust', 'chest-supported-1db', 'smith-upright-row', 'standing-ab-wheel', 'band-chest-press', 'close-pulldown', 'med-ball-slam']
      .map(exId => ({ exId, sets: 3, min: 8, max: 12, rest: 90 })),
      wu: { cardio: { id: 'air-bike', min: 3 }, mob: [{ id: 'inchworm', dose: '5' }, { id: 'wall-slide', dose: '10' }], ramp: [] },
      cd: { cardio: null, stretch: [{ id: 'stretch-hip-flexor', dose: '' }, { id: 'cd_quad', dose: '' }, { id: 'cd_lat', dose: '' }, { id: 'cd_breath', dose: '' }] } }],
    workouts: [{ id: 'h1', start: 1, end: 2, dayName: 'Old', notes: '', items: [{ exId: 'smith-hip-thrust', sets: [{ w: 60, r: 10, done: true }] }, { exId: 'cd_lat', sets: [] }] }]
  };
  const { run, store } = boot(stored);
  assert.equal(run('S.planD215'), 1);
  assert.equal(run('S.program[0].items.map(it => it.exId).join(",")'), 'ht,chest-supported-2db,lr,mk-rkc-plank,dbp,close-pulldown,kettlebell-swing');
  assert.equal(run('S.program[0].items[0].sets'), 3);
  assert.equal(run('S.program[0].wu.cardio.id'), 'air-bike');
  assert.equal(run('S.program[0].wu.mob.map(m => m.id).join(",")'), 'worlds-greatest-stretch,mk-prone-y-t-raises');
  assert.equal(run('S.program[0].cd.stretch.map(m => m.id).join(",")'), 'hip-flexor-rock,dead-hang,cd_breath');
  assert.equal(run('S.workouts[0].items.map(it => it.exId).join(",")'), 'smith-hip-thrust,cd_lat');
  assert.equal(run('exBy("smith-hip-thrust").name'), run('exBy("smith-hip-thrust").name'));
  assert.notEqual(run('exBy("smith-hip-thrust").name'), '?');
  assert.notEqual(run('exBy("cd_lat").name'), '?');
  assert.equal(JSON.parse(store.get('gym')).planD215, 1);
  const again = JSON.parse(store.get('gym'));
  again.program[0].items[0].exId = 'smith-hip-thrust';
  assert.equal(boot(again).run('S.program[0].items[0].exId'), 'smith-hip-thrust');
  // Home: band chest press -> dumbbell press, negative pull-up -> band pulldown; spine limitation keeps RKC away.
  const home = boot({ goal: 'mass', days: 1, next: 0, custom: [], body: [], workouts: [], placeIds: 1, planV12c: 1,
    prof: { goal: 'mass', sex: 'm', level: 'mid', days: 1, len: 60, place: 'd', prio: [], lim: ['s'] },
    program: [{ name: 'A', items: ['band-chest-press', 'negative-pullup', 'standing-ab-wheel', 'smith-hip-thrust'].map(exId => ({ exId, sets: 2, min: 8, max: 12, rest: 60 })), wu: { cardio: null, mob: [], ramp: [] }, cd: { cardio: null, stretch: [] } }] });
  assert.equal(home.run('S.program[0].items.map(it => it.exId).join(",")'), 'dbp,band-pulldown,mk-front-plank,ht-db');
});
