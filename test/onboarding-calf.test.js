'use strict';
// Regressions from PR #13: an id auto-replace renamed OB.step (onboarding) and the «calf» body measurement.
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
  const files = ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'prog.js', 'plan.js'];
  if (withFeatures) files.push('features.js');
  for (const f of files) vm.runInContext(read(f), ctx, { filename: f });
  return { run: code => vm.runInContext(code, ctx), store };
}

test('onboarding state keeps its step counter', () => {
  const src = read('features.js');
  assert.equal(src.includes('"mk-dumbbell-step-up-low":0'), false);
  assert.equal((src.match(/OB=\{step:0,/g) || []).length, 2);
  const { run } = boot(undefined, true);
  assert.equal(run('OB.step'), 0);
  assert.equal(run('typeof OB.step'), 'number');
});

test('calf measurement uses the calf key again', () => {
  const { run } = boot();
  assert.equal(run('BM.some(b => b[0] === "calf")'), true);
  assert.equal(run('BM.some(b => String(b[0]).startsWith("mk-"))'), false);
  assert.deepEqual(Array.from(run('TP.calf')), [83, 338, 12]);
  assert.equal(run('Object.keys(TP).some(k => k.startsWith("mk-"))'), false);
});

test('calf values saved under the wrong key move back to calf', () => {
  const { run, store } = boot({ custom: [], workouts: [], next: 0, body: [
    { id: 'b1', date: '2026-11-13', 'mk-standing-calf-raise-machine': 38 },
    { id: 'b2', date: '2026-11-12', calf: 37, 'mk-standing-calf-raise-machine': 99 }
  ] });
  assert.equal(run('S.body[0].calf'), 38);
  assert.equal(run('S.body[1].calf'), 37);
  assert.equal(run('S.body.some(b => "mk-standing-calf-raise-machine" in b)'), false);
  assert.equal(JSON.parse(store.get('gym')).body[0].calf, 38);
});

test('a fresh user does not get Premium and stays free on the second launch', () => {
  const first = boot(undefined, true);
  assert.equal(first.run('isPrem()'), false);
  assert.equal(first.run('S.ownerPremium'), false);
  first.run('S.workouts.push({id:"w1",date:"2026-11-13",ex:[]}); save()');
  const second = boot(JSON.parse(first.store.get('gym')), true);
  assert.equal(second.run('isPrem()'), false);
  assert.equal(second.run('ownerUI()'), false);
});

test('existing pre-Premium data keeps owner access and workout history', () => {
  const { run } = boot({ custom: [], next: 0, workouts: [{ id: 'w1', date: '2026-01-01', ex: [] }] }, true);
  assert.equal(run('S.ownerPremium'), true);
  assert.equal(run('isPrem()'), true);
  assert.equal(run('S.workouts.length'), 1);
});
