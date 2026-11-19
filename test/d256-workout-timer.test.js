'use strict';
// D-256: total workout timer in the header (harness from d238).
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


test('D-256: header has the hidden workout clock; format mm:ss then h:mm:ss', () => {
  assert.match(read('index.html'), /<header id="top"><h1 id="title">GymCaptain<\/h1><span id="wclock" class="wclock" role="timer" aria-label="Время тренировки" hidden><\/span><\/header>/);
  const { run } = withProgram();
  assert.equal(run('wclockFmt(0)'), '00:00');
  assert.equal(run('wclockFmt(65)'), '01:05');
  assert.equal(run('wclockFmt(3599)'), '59:59');
  assert.equal(run('wclockFmt(3725)'), '1:02:05');
  assert.equal(run('wclockFmt(36000)'), '10:00:00');
});

test('D-256: hidden without a workout; shown on every screen while it runs, from the stored start; hidden after finish', () => {
  const { run } = withProgram();
  run('render()');
  assert.equal(run('document.getElementById("wclock").hidden'), true);
  run('startW(0)');
  assert.equal(run('document.getElementById("wclock").hidden'), false);
  assert.match(run('document.getElementById("wclock").textContent'), /^⏱ 00:0\d$/);
  run('S.active.start=Date.now()-3725e3;go("progress")');
  assert.equal(run('document.getElementById("wclock").textContent'), '⏱ 1:02:05');
  run('go("history")');
  assert.equal(run('document.getElementById("wclock").hidden'), false);
  run('S.active.start=Date.now()-125e3;wclockTick()');
  assert.equal(run('document.getElementById("wclock").textContent'), '⏱ 02:05', 'recomputed from the start time, not ticks');
  run('go("today");$("#fin").onclick()');
  assert.equal(run('S.active'), null);
  assert.equal(run('document.getElementById("wclock").hidden'), true);
  assert.ok(run('S.workouts[S.workouts.length-1].end>=S.workouts[S.workouts.length-1].start'), 'duration saved as start/end');
});

test('D-256: style, string RU/EN/LV, LV doc', () => {
  assert.match(read('style.css'), /#top\{display:flex;align-items:center;gap:8px\}[^]*\.wclock\[hidden\]\{display:none\}/);
  assert.ok(read('i18n/dict3.js').includes("['Время тренировки','Workout time','Treniņa laiks']"));
  assert.ok(fs.existsSync(path.join(root, 'docs/LV-NEW-WORKOUT-TIMER.md')));
  assert.match(read('app.js'), /setInterval\(wclockTick,1000\)/);
});
