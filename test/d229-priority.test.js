'use strict';
// D-229: accent blocks (blocks-priority-v2): {base}_pr_{muscle}, fallback to the base block, sex does not matter.
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

const P = '{goal:"mass",level:"mid",days:4,place:"g"';
const prof = (extra) => P + (extra ? ',' + extra : '') + '}';

test('D-229: accent picks the accent block; every accent block file validates', () => {
  const { run } = boot();
  assert.equal(run(`blockIdForProfile(${prof('acc:"back"')})`), 'mass_mid_4_g_pr_back_b36');
  assert.equal(run(`blockIdForProfile(${prof('acc:"glutes"')})`), 'mass_mid_4_g_pr_glutes_b36');
  assert.equal(run('blockIdForProfile({goal:"mass",level:"mid",days:5,place:"g",acc:"arms"})'), 'mass_mid_5_g_pr_arms_b35');
  assert.equal(run('blockIdForProfile({goal:"loss",level:"mid",days:4,place:"g",acc:"abs"})'), 'loss_mid_4_g_pr_abs_b36');
  assert.equal(run(`blockIdForProfile(${prof('acc:"none"')})`), 'mass_mid_4_g_b36');
  assert.equal(run(`blockIdForProfile(${prof()})`), 'mass_mid_4_g_b36');
  const map = run('PRIO_BLOCK_MAP');
  assert.equal(Object.keys(map).length, 4);
  assert.equal(Object.keys(run('BLOCK_MAP')).length, 180);
  for (const [k, id] of Object.entries(map)) {
    assert.ok(fs.existsSync(path.join(root, 'data/blocks', id + '.json')), id);
    const r = run(`validateBlock(getBlock(${JSON.stringify(id)}))`);
    assert.equal(r.ok, true, id + ': ' + (r.errors || []).join('; '));
    assert.equal(r.block.key, k);
  }
  const g = run(`generate(${prof('acc:"back"')})`);
  assert.equal(g.blockId, 'mass_mid_4_g_pr_back_b36');
  assert.equal(g.days.length, 36);
  assert.equal(g.advice, null);
});

test('D-229: no accent block for the combination → base block without error, with a note', () => {
  const { run } = boot();
  assert.equal(run('blockIdForProfile({goal:"mass",level:"mid",days:3,place:"g",acc:"back"})'), 'mass_mid_3_g_b36');
  assert.equal(run('blockIdForProfile({goal:"str",level:"nov",days:4,place:"d",acc:"abs"})'), 'str_nov_4_d_b36');
  assert.equal(run('blockIdForProfile({goal:"mass",level:"mid",days:4,place:"b",bar:"1",acc:"glutes"})'), 'mass_mid_4_b_bar_b36');
  assert.equal(run(`blockIdForProfile(${prof('acc:"weird"')})`), 'mass_mid_4_g_b36');
  const g = run('generate({goal:"mass",level:"mid",days:3,place:"g",acc:"back"})');
  assert.equal(g.blockId, 'mass_mid_3_g_b36');
  assert.match(g.advice, /^Акцент «Спина» пока есть только для/);
});

test('D-229: sex does not change the block (glutes block is one for everyone)', () => {
  const { run } = boot();
  for (const acc of ['none', 'back', 'arms', 'glutes', 'abs']) for (const days of [4, 5]) for (const goal of ['mass', 'loss']) {
    const m = run(`blockIdForProfile({goal:"${goal}",level:"mid",days:${days},place:"g",acc:"${acc}",sex:"m"})`);
    const f = run(`blockIdForProfile({goal:"${goal}",level:"mid",days:${days},place:"g",acc:"${acc}",sex:"f"})`);
    assert.equal(m, f, acc + days + goal);
  }
  assert.ok(!fs.existsSync(path.join(root, 'data/blocks/mass_mid_4_g_pr_glutes_f_b36.json')));
});

test('D-229: next_level of an accent block is the base advanced block (accent dropped)', () => {
  const { run } = boot();
  const exp = { mass_mid_4_g_pr_back_b36: 'mass_adv_4_g_b36', mass_mid_5_g_pr_arms_b35: 'mass_adv_5_g_b35', mass_mid_4_g_pr_glutes_b36: 'mass_adv_4_g_b36', loss_mid_4_g_pr_abs_b36: 'loss_adv_4_g_b36' };
  for (const [id, nl] of Object.entries(exp)) {
    assert.equal(run(`normalizeEndActions(getBlock(${JSON.stringify(id)}).end_actions).next_level`), nl);
    assert.ok(Object.values(run('BLOCK_MAP')).includes(nl));
    const st = run(`(() => { const s = {block:{id:${JSON.stringify(id)},next:36}}; goNextLevel(s, getBlock(${JSON.stringify(id)})); return s.block.id; })()`);
    assert.equal(st, nl);
  }
});

test('D-229: questionnaire strings have RU/EN/LV and LV follows D-216', () => {
  const d3 = read('i18n/dict3.js');
  for (const s of ['Акцент', 'Руки', 'Акцент «Пресс» пока есть только для']) assert.ok(d3.includes("['" + s), s);
  const lv = read('docs/LV-NEW-BLOCKS-PRIORITY.md');
  assert.doesNotMatch(lv, /sērij/i);
  assert.doesNotMatch(lv.replace(/atspiedien|asinsspiedien/gi, ''), /spiedien/i);
});

test('D-229 / C-114: SW cache is moyzal-v145; four accent blocks still validate', () => {
  assert.match(read('cache-ver.js'), /var SW_CACHE='moyzal-v145'/);
  assert.equal(Object.keys(boot().run('PRIO_BLOCK_MAP')).length, 4);
});
