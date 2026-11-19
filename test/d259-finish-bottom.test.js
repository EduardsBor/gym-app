'use strict';
// D-259 (Eduards: «Завершить тренировку в конце должна быть.»).
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
      append() {}, remove() {}, play() { return null; }, pause() {}, addEventListener() {}, insertAdjacentHTML() {}, setAttribute() {}, getAttribute() { return null; },
      closest() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; },
      onclick: null
    };
    if (id) nodes.set(id, node);
    return node;
  }
  const search = (opts && opts.search) || '';
  const g = {
    console, setTimeout() { return 0; }, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {}, scrollTo() {}, scrollY: 0, Audio: function () { this.play = () => ({ catch() {} }); this.pause = () => {}; this.addEventListener = () => {}; this.load = () => {}; }, confirm: () => true, prompt: () => null,
    URL, Blob, navigator: { language: 'ru', languages: ['ru'] },
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
    location: { href: 'http://127.0.0.1/' + search, origin: 'http://127.0.0.1', pathname: '/', search },
    document: {
      documentElement: { lang: 'ru' }, title: '', body: { append() {}, style: {} },
      querySelector(sel) { const m = /^#([\w-]+)/.exec(sel || ''); return el(m ? m[1] : ''); },
      querySelectorAll() { return []; }, getElementById(id) { return el(id); }, addEventListener() {}, createElement() { return el(); }
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
  const files = ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'place.js', 'prog.js', 'plan.js', 'blocks.js', 'legal.js', 'premium.js', 'features.js', 'movekit.js', 'progress.js', 'autow.js', 'exscreen.js'];
  for (const f of files) vm.runInContext(read(f), ctx, { filename: f });
  return { run: code => vm.runInContext(code, ctx), app: () => vm.runInContext('app.innerHTML', ctx) };
}
function withProgram() {
  const r = boot();
  r.run('armAudio=function(){};S.weightAsked=1;S.goal=null;S.program=null;preview(CATALOG[0],"catalog");$("#pstart").onclick();view="today";render()');
  return r;
}

test('D-259: big «Завершить тренировку» at the end, above «Отменить тренировку»; top «Завершить» kept', () => {
  const b = withProgram();
  b.run('startW(0);go("today")');
  const h = b.app();
  assert.match(h, /id="fin"/);
  const i2 = h.indexOf('id="fin2"'), ic = h.indexOf('id="cancel"'), in_ = h.indexOf('id="notes"');
  assert.ok(i2 > in_ && i2 < ic, 'after notes, before cancel');
  assert.match(h, /class="pri full" id="fin2"[^>]*>Завершить тренировку</);
  assert.ok(read('i18n/dict3.js').includes("['Завершить тренировку','Finish workout','Pabeigt treniņu']"));
});

test('D-259: bottom button uses the same finish flow (saves, confirm when nothing done)', () => {
  const b = withProgram();
  b.run('globalThis._cf=0;confirm=()=>{_cf++;return false};startW(0);go("today");$("#fin2").onclick()');
  assert.equal(b.run('_cf'), 1);
  assert.notEqual(b.run('S.active'), null, 'declined → workout continues');
  b.run('S.active.items[0].sets[0].w=50;S.active.items[0].sets[0].done=true;const n=S.workouts.length;globalThis._n=n;go("today");$("#fin2").onclick()');
  assert.equal(b.run('S.active'), null);
  assert.equal(b.run('S.workouts.length'), b.run('_n') + 1);
  assert.equal(b.run('view'), 'history');
});
