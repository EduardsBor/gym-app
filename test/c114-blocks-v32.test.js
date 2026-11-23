'use strict';
// C-114: programs blocks-v3.2 — duration_label in the questionnaire, experienced+2-day hint, hide mk-hanging-knee-raises.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

function boot(opts) {
  const store = new Map();
  if (opts && opts.ls) for (const [k, v] of Object.entries(opts.ls)) store.set(k, String(v));
  const nodes = new Map();
  function el(id) {
    if (id && nodes.has(id)) return nodes.get(id);
    const node = {
      id: id || '', innerHTML: '', textContent: '', className: '', value: '', style: {}, dataset: {},
      classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
      append() {}, addEventListener() {}, insertAdjacentHTML() {}, setAttribute() {}, getAttribute() { return null; },
      closest() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; },
      onclick: null
    };
    if (id) nodes.set(id, node);
    return node;
  }
  const search = (opts && opts.search) || '';
  const g = {
    console, setTimeout, clearTimeout, setInterval() { return 0; }, clearInterval() {},
    URL, Blob, navigator: { language: 'ru', languages: ['ru'] },
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
    location: { href: 'http://127.0.0.1/' + search, origin: 'http://127.0.0.1', pathname: '/', search },
    document: {
      documentElement: { lang: 'ru' }, title: '', body: { append() {}, style: {} },
      querySelector(sel) { const m = /^#([\w-]+)/.exec(sel || ''); return el(m ? m[1] : ''); },
      querySelectorAll() { return []; }, addEventListener() {}, createElement() { return el(); }
    }
  };
  g.window = g; g.globalThis = g; g.self = g;
  g.XMLHttpRequest = function () {
    this.status = 0; this.responseText = '';
    this.open = function (method, url) { this._url = url; };
    this.send = function () {
      const rel = String(this._url || '').replace(/^\.\//, '');
      const fp = path.join(root, rel);
      if (fs.existsSync(fp)) { this.status = 200; this.responseText = fs.readFileSync(fp, 'utf8'); }
      else { this.status = 404; this.responseText = ''; }
    };
  };
  const ctx = vm.createContext(g);
  const files = ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'place.js', 'prog.js', 'plan.js', 'data/blocks-index.js', 'blocks.js'];
  for (const f of files) vm.runInContext(read(f), ctx, { filename: f });
  return { run: code => vm.runInContext(code, ctx), store };
}

test('C-114: BLOCK_MAP still has the same 180 keys; every mapped and accent file validates', () => {
  const { run } = boot();
  const map = run('BLOCK_MAP');
  assert.equal(Object.keys(map).length, 180);
  assert.ok(!read('blocks.js').includes("BLOCK_MAP={") || Object.keys(map).every(k => read('blocks.js').includes('"'+k+'"') || read('blocks.js').includes("'"+k+"'") || read('blocks.js').includes(k)));
  for (const [k, id] of Object.entries(map)) {
    const b = JSON.parse(read('data/blocks/' + id + '.json'));
    assert.equal(b.key, k);
    assert.equal(b.id, id);
    assert.ok(b.duration_label, id);
    const r = run('validateBlock(getBlock(' + JSON.stringify(id) + '))');
    assert.equal(r.ok, true, id + ': ' + (r.errors || []).join('; '));
  }
  const prio = run('PRIO_BLOCK_MAP');
  assert.equal(Object.keys(prio).length, 4);
  for (const [k, id] of Object.entries(prio)) {
    const r = run('validateBlock(getBlock(' + JSON.stringify(id) + '))');
    assert.equal(r.ok, true, id + ': ' + (r.errors || []).join('; '));
  }
  assert.equal(Object.keys(run('LEGACY_D_BLOCK_MAP')).length, 60);
});

test('C-114: questionnaire uses the block duration_label, not a fixed 60–70 min', () => {
  const { run } = boot();
  const src = read('app.js');
  assert.match(src, /function quizDurationLabel\(/);
  assert.doesNotMatch(src, /Q\.lenLabel='60–70 мин'/);
  const label = run('quizDurationLabel({goal:"mass",level:"adv",days:2,place:"g"})');
  assert.equal(label, JSON.parse(read('data/blocks/mass_adv_2_g_b32.json')).duration_label);
  assert.notEqual(label, '60–70 мин');
  assert.equal(label, '80–85 мин');
  const nov = run('quizDurationLabel({goal:"fit",level:"nov",days:3,place:"g"})');
  assert.equal(nov, JSON.parse(read('data/blocks/fit_nov_3_g_b36.json')).duration_label);
  const shown = run('(() => { Q={goal:"mass",level:"adv",days:2,place:"g",bar:"0",prio:[],lim:[]}; return quizLen(() => ""); })()');
  assert.match(shown, /80–85 мин \(с разминкой и заминкой\)/);
  assert.doesNotMatch(shown, />60–70 мин \(с разминкой и заминкой\)</);
  const home = run('quizDurationLabel({goal:"mass",level:"mid",days:3,place:"b",bar:"0"})');
  const hid = JSON.parse(read('data/blocks/mass_mid_3_b_nobar_b36.json')).duration_label;
  assert.equal(home, hid);
});

test('C-114: experienced + 2 days shows the growth hint in RU/EN/LV', () => {
  const { run } = boot();
  assert.equal(run('quizGrowthHint({level:"adv",days:2})'), true);
  assert.equal(run('quizGrowthHint({level:"adv",days:3})'), false);
  assert.equal(run('quizGrowthHint({level:"mid",days:2})'), false);
  const d3 = read('i18n/dict3.js');
  assert.ok(d3.includes("['Для роста выбери 3–4 дня','For growth, choose 3–4 days','Izaugsmei izvēlies 3–4 dienas']"));
  assert.ok(read('docs/LV-NEW-C114.md').includes('Izaugsmei izvēlies 3–4 dienas'));
  assert.ok(read('docs/LV-NEW-C114.md').includes('На ревью Claude'));
});

test('C-114: mk-hanging-knee-raises is hidden; hanging-knee-raise stays; no block file references the hidden id', () => {
  const { run } = boot();
  assert.equal(run('isHidden("mk-hanging-knee-raises")'), true);
  assert.equal(run('isHidden("hanging-knee-raise")'), false);
  const ids = run('EX.map(e => e.id)');
  assert.equal(ids.includes('mk-hanging-knee-raises'), false);
  assert.equal(ids.includes('hanging-knee-raise'), true);
  const dir = path.join(root, 'data', 'blocks');
  const hits = [];
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.json'))) {
    const t = fs.readFileSync(path.join(dir, f), 'utf8');
    if (t.includes('mk-hanging-knee-raises')) hits.push(f);
  }
  assert.deepEqual(hits, []);
});

test('C-114: blocks-index duration_label matches the JSON files; SW cache is moyzal-v167', () => {
  const { run } = boot();
  const idx = run('BLOCK_INDEX');
  assert.equal(idx.length, 244);
  const sample = idx.find(b => b.id === 'mass_adv_2_g_b32');
  assert.ok(sample);
  assert.equal(sample.duration_label, '80–85 мин');
  const file = JSON.parse(read('data/blocks/mass_adv_2_g_b32.json'));
  assert.equal(sample.duration_label, file.duration_label);
  assert.match(read('cache-ver.js'), /var SW_CACHE='moyzal-v167'/);
  assert.match(read('CHANGELOG.md'), /C-114 программы v3\.2 \(v145\)/);
});
