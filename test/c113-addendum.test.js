'use strict';
// External-audit addendum to C-113 (v146): RDL wording, no «(кардио)» in muscle fields.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

function boot() {
  const nodes = new Map();
  function el(id) {
    if (id && nodes.has(id)) return nodes.get(id);
    const node = {
      id: id || '', innerHTML: '', textContent: '', className: '', value: '', style: {}, dataset: {},
      classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
      append() {}, addEventListener() {}, setAttribute() {}, getAttribute() { return null; },
      closest() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; }
    };
    if (id) nodes.set(id, node);
    return node;
  }
  const g = {
    console, setTimeout, clearTimeout, setInterval() { return 0; }, clearInterval() {},
    URL, Blob, navigator: { language: 'ru', languages: ['ru'] },
    localStorage: { getItem() { return null; }, setItem() {} },
    location: { href: 'http://127.0.0.1/', origin: 'http://127.0.0.1', pathname: '/' },
    document: {
      documentElement: { lang: 'ru' }, title: '', body: { append() {}, style: {} },
      querySelector(sel) { const m = /^#([\w-]+)/.exec(sel || ''); return el(m ? m[1] : ''); },
      querySelectorAll() { return []; }, addEventListener() {}, createElement() { return el(); }
    }
  };
  g.window = g; g.globalThis = g; g.self = g;
  const ctx = vm.createContext(g);
  const files = ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'place.js'];
  for (const f of files) vm.runInContext(read(f), ctx, { filename: f });
  return { run: code => vm.runInContext(code, ctx) };
}

function muscleHits(run, re) {
  const hits = [];
  const packs = [
    ['LIB', run('LIB')],
    ['LIB_EN', run('LIB_EN')],
    ['LIB_LV', run('LIB_LV')]
  ];
  for (const [name, pack] of packs) {
    for (const [id, row] of Object.entries(pack || {})) {
      const primary = row && row[0] != null ? String(row[0]) : '';
      const secondary = row && row[1] != null ? String(row[1]) : '';
      if (re.test(primary)) hits.push(name + '.' + id + '.primary: ' + primary);
      if (re.test(secondary)) hits.push(name + '.' + id + '.secondary: ' + secondary);
    }
  }
  return hits;
}

test('C-113 addendum: rdl is called a Romanian deadlift, not a stiff-leg deadlift', () => {
  const { run } = boot();
  const why = run('LIB["rdl"][2]');
  assert.match(why, /^Румынская тяга/);
  assert.doesNotMatch(why, /Тяга на прямых ногах:/);
  // The addendum may mention the stiff-leg name only as a negation.
  const mentions = why.match(/тяга на прямых ногах/gi) || [];
  for (const _ of mentions) assert.match(why, /не тяга на прямых ногах/);
  const en = run('LIB_EN["rdl"][2]');
  const lv = run('LIB_LV["rdl"][2]');
  assert.match(en, /^Romanian deadlift/i);
  assert.doesNotMatch(en, /^A stiff-leg deadlift/i);
  assert.match(en, /not a stiff-leg deadlift/i);
  assert.match(lv, /Rumāņu vilkme/i);
  assert.doesNotMatch(why, /^Тяга на прямых ногах/);
});

test('C-113 addendum: no muscle field contains «(кардио)»', () => {
  const { run } = boot();
  assert.deepEqual(muscleHits(run, /\(кардио\)/i), []);
  assert.deepEqual(muscleHits(run, /\(cardio\)/i), []);
});

test('C-113 addendum: deadlift why uses the simpler quad clause; SW cache is moyzal-v166', () => {
  const { run } = boot();
  const ru = run('LIB["mk-barbell-deadlift"][2]');
  const en = run('LIB_EN["mk-barbell-deadlift"][2]');
  const lv = run('LIB_LV["mk-barbell-deadlift"][2]');
  assert.match(ru, /квадрицепс разгибает колени в начале подъёма с пола/);
  assert.doesNotMatch(ru, /разгибающий момент в колене/);
  assert.match(en, /the quadriceps extend the knees at the start of the pull from the floor/);
  assert.doesNotMatch(en, /knee-extending moment/);
  assert.match(lv, /četrgalvainais muskulis iztaisno ceļus vilkmes sākumā no zemes/);
  assert.doesNotMatch(lv, /iztaisnošanas momentu/);
  assert.match(read('cache-ver.js'), /var SW_CACHE='moyzal-v166'/);
  assert.ok(fs.existsSync(path.join(root, 'docs/LV-NEW-C113-ADD.md')));
});
