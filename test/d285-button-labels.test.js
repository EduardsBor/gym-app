'use strict';
// D-285: visible RU/EN/LV labels on five actions; accessible name matches the visible text.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

const LABELS = [
  ['Записать подход', 'Log set', 'Saglabāt piegājienu'],
  ['Начать тренировку', 'Start workout', 'Sākt treniņu'],
  ['Техника упражнения', 'Exercise technique', 'Vingrinājuma tehnika'],
  ['Заменить упражнение', 'Replace exercise', 'Aizstāt vingrinājumu'],
  ['Посмотреть программу', 'View program', 'Skatīt programmu'],
];

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
      documentElement: { lang: 'ru' }, title: '', body: { append() {}, style: {}, classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } } },
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
  const files = ['cache-ver.js', 'alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'place.js', 'prog.js', 'plan.js', 'blocks.js', 'legal.js', 'premium.js', 'features.js', 'movekit.js', 'progress.js', 'autow.js', 'exscreen.js'];
  for (const f of files) vm.runInContext(read(f), ctx, { filename: f });
  return { run: code => vm.runInContext(code, ctx), app: () => vm.runInContext('app.innerHTML', ctx) };
}
function withProgram() {
  const r = boot();
  r.run('armAudio=function(){};S.weightAsked=1;S.goal=null;S.program=null;preview(CATALOG[0],"catalog");$("#pstart").onclick();view="today";render()');
  return r;
}

test('D-285: cache-ver stays on the v138 line', () => {
  assert.match(read('cache-ver.js').trim(), /^var SW_CACHE='moyzal-v170';$/);
});

test('D-285: RU/EN/LV triples for the five button labels', () => {
  const d = read('i18n/dict.js') + read('i18n/dict2.js') + read('i18n/dict3.js');
  for (const [ru, en, lv] of LABELS) {
    const row = `['${ru}','${en}','${lv}']`;
    assert.ok(d.includes(row), row);
  }
  assert.equal(d.includes('Pierakstīt piegājienu'), false);
});

test('Ready-program list labels buttons by the program name and opens the program preview', () => {
  const b = boot();
  b.run('catalog()');
  const h = b.app();
  assert.match(h, /data-c="c0" aria-describedby="cf-info-c0"><span>Старт в зале<\/span><\/button>/);
  assert.match(h, /id="cf-info-c0"/);
  assert.doesNotMatch(h, />Подробнее</);
  const id = /data-c="([^"]+)"/.exec(h)[1];
  b.run(`preview(catalogFind(${JSON.stringify(id)}),'catalog')`);
  const p = b.app();
  assert.match(p, /id="pstart"/);
  assert.match(p, /Начать программу/);
});

test('D-285: today card and exercise-header start buttons use «Начать тренировку»', () => {
  const b = withProgram();
  b.run('S.active=null;go("today")');
  assert.match(b.app(), /id="start"[^>]*>▶ Начать тренировку</);
  b.run('const L=exList();const e=L.find(x=>x.src==="m");exOpen(e.src,e.i)');
  const h = b.app();
  assert.match(h, /id="exgo" aria-label="Начать тренировку">Начать тренировку</);
  assert.doesNotMatch(h, /id="exgo">Начать</);
});

test('D-285: exercise screen shows technique, replace and log-set labels; aria-label matches', () => {
  const src = read('exscreen.js');
  assert.match(src, /aria-label="Записать подход">Записать подход</);
  assert.match(src, /aria-label="Техника упражнения">[\s\S]*Техника упражнения</);
  assert.match(src, /aria-label="Заменить упражнение">[\s\S]*Заменить упражнение</);
  assert.doesNotMatch(src, /aria-label="Записать подход">\+</);
  assert.doesNotMatch(src, /aria-label="Техника">ⓘ/);
  assert.doesNotMatch(src, /aria-label="Заменить">⇄/);
  const b = withProgram();
  b.run('startW(0);const L=exList();const e=L.find(x=>x.src==="m");exOpen(e.src,e.i)');
  const h = b.app();
  assert.match(h, /id="exadd"[^>]*>Записать подход</);
  assert.match(h, /aria-label="Записать подход"/);
  // Technique is present for barbell bench press in the first catalog program.
  assert.match(h, /aria-label="Техника упражнения"/);
  assert.match(h, /Техника упражнения</);
});

test('D-285: «Записать подход» saves one set with the entered weight and reps', () => {
  const b = withProgram();
  b.run(`
    startW(0);
    const L=exList();
    const e=L.find(x=>x.src==="m");
    exOpen(e.src,e.i);
    const it=S.active.items[e.i];
    const before=it.sets.filter(s=>s.done).length;
    $('#exw').value=42.5;
    $('#exr').value=8;
    $('#exadd').onclick();
    globalThis._log={before, after:S.active.items[e.i].sets.filter(s=>s.done).length, w:S.active.items[e.i].sets[0].w, r:S.active.items[e.i].sets[0].r, done:S.active.items[e.i].sets[0].done};
  `);
  const log = b.run('_log');
  assert.equal(log.before, 0);
  assert.equal(log.after, 1);
  assert.equal(log.done, true);
  assert.equal(+log.w, 42.5);
  assert.equal(+log.r, 8);
});
