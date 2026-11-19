'use strict';
// D-244: right after the planned sets the next exercise opens (rest timer keeps running); last one -> workout with «Завершить»; sets-done circle shows the number.
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

test('D-244: sets-done circle shows «1/N» and does not use the .ok button class (number was invisible)', () => {
  const { run, app } = withProgram();
  run('exOpen("m",0);$("#exw").value="20";$("#exr").value="10";exLog()');
  const plan = run('S.active.items[0].ns');
  assert.match(app(), new RegExp('<div class="excirc " id="exsets"><b>1/' + plan + '</b>'));
  assert.doesNotMatch(app(), /class="excirc ok"/);
  assert.match(read('style.css'), /\.excirc\{color:var\(--txt\)\}\.excirc\.exdone\{border-color:var\(--ok\)\}/);
});

test('D-244: right after the last planned set the next exercise opens; the rest timer keeps running', () => {
  const { run } = withProgram();
  run('exOpen("m",0)');
  const plan = run('exDay().d.items[0].sets');
  const pos = run('EXS.pos');
  for (let k = 0; k < plan - 1; k++) run('$("#exw").value="20";$("#exr").value="10";exLog()');
  assert.equal(run('EXS.pos'), pos, 'stays while sets remain');
  run('$("#exw").value="20";$("#exr").value="10";exLog()');
  assert.equal(run('S.active.items[0].sets.filter(s=>s.done).length'), plan);
  assert.equal(run('view'), 'ex');
  assert.equal(run('EXS.pos'), pos + 1);
  assert.equal(run('JSON.stringify([exList()[EXS.pos].src,exList()[EXS.pos].i])'), '["m",1]');
  assert.ok(run('tEnd') > Date.now(), 'rest timer still running on the next exercise');
});

test('D-244: warm-up row moves on too; the last exercise returns to the workout with «Завершить»', () => {
  const { run } = withProgram();
  run('exOpen("w",0)');
  run('exLog()'); // warm-up row: 1 planned set
  assert.equal(run('JSON.stringify([exList()[EXS.pos].src,exList()[EXS.pos].i])'), '["w",1]');
  const last = run('exList().length-1');
  run(`EXS.pos=${last};exView()`);
  assert.equal(run('exList()[EXS.pos].src'), 'c');
  const n = run('exInfo(exList()[EXS.pos]).plan');
  for (let k = 0; k < n; k++) run('exLog()');
  assert.equal(run('view'), 'today');
  assert.equal(run('EXS'), null);
  assert.ok(run('!!S.active'), 'workout stays open for «Завершить»');
});
