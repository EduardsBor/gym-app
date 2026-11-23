'use strict';
// D-236: blocks-v2d — 180 blocks (g, b_bar, b_nobar), Home = b only, equipment note, home strength label.
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
  const files = ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'place.js', 'prog.js', 'plan.js', 'blocks.js'];
  for (const f of files) vm.runInContext(read(f), ctx, { filename: f });
  return { run: code => vm.runInContext(code, ctx), store };
}

test('D-236: BLOCK_MAP is exactly blocks-v2d — 180 keys, g/b_bar/b_nobar only, every file validates and matches its key', () => {
  const { run } = boot();
  const map = run('BLOCK_MAP');
  const keys = Object.keys(map);
  assert.equal(keys.length, 180);
  const by = { g: 0, b_bar: 0, b_nobar: 0 };
  for (const k of keys) { const m = /_(g|b_bar|b_nobar)$/.exec(k); assert.ok(m, k); by[m[1]]++; }
  assert.deepEqual(by, { g: 60, b_bar: 60, b_nobar: 60 });
  for (const [k, id] of Object.entries(map)) {
    const b = JSON.parse(read('data/blocks/' + id + '.json'));
    assert.equal(b.key, k);
    assert.equal(b.id, id);
    const r = run(`validateBlock(getBlock(${JSON.stringify(id)}))`);
    assert.equal(r.ok, true, id + ': ' + (r.errors || []).join('; '));
    if (b.place === 'b') {
      assert.equal(b.pullup_bar, k.endsWith('_b_bar'), k);
      assert.ok(b.equipment_note_ru, k);
      assert.ok(!JSON.stringify(b.workouts).includes('"dips"'), k + ' has dips');
      if (b.goal === 'str') assert.equal(b.show_pct1rm, false, k);
    }
  }
});

test('D-236: Home = b only — questionnaire offers g/b, b maps by bar answer; old place-d profiles still resolve via LEGACY_D_BLOCK_MAP', () => {
  const { run } = boot();
  const src = read('app.js');
  assert.ok(src.includes("grp('Где тренируешься','place',[['g','🏢 Тренажёрный зал'],['b','🏠 Дом']])"));
  assert.equal(run('blockIdForProfile({goal:"mass",level:"mid",days:3,place:"b",bar:"1"})'), 'mass_mid_3_b_bar_b36');
  assert.equal(run('blockIdForProfile({goal:"mass",level:"mid",days:3,place:"b",bar:"0"})'), 'mass_mid_3_b_nobar_b36');
  assert.equal(Object.keys(run('LEGACY_D_BLOCK_MAP')).length, 60);
  assert.ok(Object.values(run('BLOCK_MAP')).every(id => !/_d_/.test(id)));
  assert.equal(run('blockIdForProfile({goal:"str",level:"nov",days:3,place:"d"})'), 'str_nov_3_d_b36');
  const g = run('generate({goal:"str",level:"nov",days:3,place:"b",bar:"0",sex:"m",len:60,prio:[],lim:[]})');
  assert.equal(g.advice, 'Нужен стул или скамья для обратных отжиманий.');
});

test('D-236: home strength label lives in one constant and has an EN/LV triple', () => {
  const { run } = boot();
  assert.equal(run('HOME_STR_LABEL'), 'Сила и контроль тела');
  assert.equal(run('goalName("str","b")'), 'Сила и контроль тела');
  assert.equal(run('goalName("str","g")'), 'Сила');
  assert.equal(run('goalName("mass","b")'), 'Масса');
  assert.equal((read('app.js').match(/Сила и контроль тела/g) || []).length, 1);
  assert.ok(read('i18n/dict3.js').includes("['Сила и контроль тела','Strength & Body Control','Spēks un ķermeņa kontrole']"));
  assert.ok(read('docs/LV-NEW-BLOCKS-V2D.md').includes('Spēks un ķermeņa kontrole'));
});

test('D-236 / C-114: SW cache is moyzal-v166; BLOCK_MAP keys stay at 180', () => {
  assert.match(read('cache-ver.js'), /var SW_CACHE='moyzal-v166'/);
  assert.equal(Object.keys(boot().run('BLOCK_MAP')).length, 180);
});
