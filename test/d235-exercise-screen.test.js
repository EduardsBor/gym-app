'use strict';
// D-235: exercise screen (set logging into S.active history), warm-up rows like main ones, no equipment/template blocks on «Сегодня», «Программа» card order.
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

test('D-235: «Сегодня» rows open the exercise screen; no «Профиль оборудования» / «Мои шаблоны» blocks', () => {
  const { run, app } = withProgram();
  assert.ok(run('S.program.length') > 0);
  const h = app();
  assert.match(h, /data-exo="m,0"/);
  assert.match(h, /data-exo="w,0"/);
  assert.doesNotMatch(h, /Профиль оборудования|id="eqbar"/);
  assert.doesNotMatch(h, /Мои шаблоны|id="tplbox"/);
  assert.ok(run('S.eqActive'), 'stored equipment profile kept');
  assert.doesNotMatch(read('features.js'), /id="eqmore"/); // «Ещё» card removed too
  assert.doesNotMatch(read('features.js'), /_ptoday\(sel\);if\(typeof tplMount/);
});

test('D-235: warm-up and cool-down rows look like main rows (poster thumbnail, compact dose) and open the same screen', () => {
  const { run, app } = withProgram();
  run('document.querySelector("details")');
  const wu = run('(()=>{const d=S.program[0];return d.wu?wuHTML(d.wu):""})()');
  assert.match(wu, /<div class="li wu exo" data-exo="w,1"><span class="athumb mkposter" data-mk-poster="/);
  assert.equal(run('exShort("2 × 20–30 с")'), '2×20–30 с');
  assert.equal(run('exShort("5 мин")'), '5 мин');
  assert.equal(run('exShort("10 повторов")'), '1×10');
  assert.deepEqual(JSON.parse(run('JSON.stringify(exDose("30 с на каждую ногу"))')), { sets: 1, val: '30', unit: 'sec' });
  run('exOpen("w",1)');
  assert.equal(run('view'), 'ex');
  const h = app();
  assert.match(h, /Подходов выполнено/);
  assert.match(h, /Разминка/);
  assert.match(h, /00:20/); // default warm-up rest
  assert.doesNotMatch(h, /id="exw"/); // no weight input for warm-up
  run('exLog()'); // starts the workout and logs one warm-up set
  assert.ok(run('!!S.active'));
  assert.equal(run('S.active.warm.n[1]'), 1);
  assert.equal(run('S.active.warm.c[1]'), true);
  const cd = run('exList().filter(e=>e.src==="c").length');
  assert.ok(cd > 0);
});

test('D-235: logging a set on the exercise screen writes into S.active.items[].sets and reaches history unchanged', () => {
  const { run, app } = withProgram();
  const id0 = run('exDay().d.items[0].exId');
  run('exOpen("m",0)');
  assert.match(app(), /id="exadd"/);
  assert.match(app(), /Подбери вес, с которым последние 2 повтора даются тяжело/);
  run('$("#exw").value="42";$("#exr").value="9";exLog()');
  assert.equal(run('S.active.items[0].exId'), id0);
  const s = JSON.parse(run('JSON.stringify(S.active.items[0].sets[0])'));
  assert.equal(s.w, 42); assert.equal(s.r, 9); assert.equal(s.done, true);
  assert.ok(run('tEnd') > Date.now(), 'rest timer auto-started');
  assert.match(app(), /1\/\d+<\/b><span>Подходов выполнено/);
  run('exStop();view="today";render();$("#fin").onclick()');
  const w = JSON.parse(run('JSON.stringify(S.workouts[S.workouts.length-1])'));
  assert.equal(w.items[0].exId, id0);
  assert.equal(w.items[0].sets[0].w, 42);
  assert.equal(w.items[0].sets[0].r, 9);
  // next time the screen recommends the logged weight
  run('exOpen("m",0)');
  assert.match(app(), /Рекомендуемый вес/);
});

test('D-235: «Программа» card — catalog first (primary), own program second (secondary)', () => {
  const { run, app } = withProgram();
  run('program()');
  const h = app();
  assert.ok(h.indexOf('id="cat"') < h.indexOf('id="chg"'));
  assert.match(h, /class="pri full big"[^>]*id="cat">📚 Каталог готовых программ</);
  assert.match(h, /class="full"[^>]*id="chg">🧩 Собрать свою программу</);
  assert.doesNotMatch(h, /Подобрать заново \(анкета\)/);
});
