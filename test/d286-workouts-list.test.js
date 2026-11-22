'use strict';
// v139: flat program workout list; Start under the due row; no Edit; exercises after open/start.
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
function startBetween(h, due) {
  const startAt = h.indexOf('id="start"');
  const dueAt = h.indexOf('data-i="' + due + '"');
  const nextAt = h.indexOf('data-i="' + (due + 1) + '"');
  assert.ok(dueAt >= 0 && startAt > dueAt, 'Start should follow the due workout row');
  if (nextAt >= 0) assert.ok(startAt < nextAt, 'Start should sit before the next workout row');
}

test('v144: version is moyzal-v148; new LV back-string is in the dictionary', () => {
  assert.match(read('cache-ver.js'), /var SW_CACHE='moyzal-v148'/);
  assert.match(read('i18n/dict3.js'), /\['← К списку тренировок','← Back to the workout list','← Uz treniņu sarakstu'\]/);
  assert.ok(fs.existsSync(path.join(root, 'docs/LV-NEW-WORKOUTS-LIST.md')));
});

test('v139: Start is right under the due row; no week headers, no edit, no exercises until a workout is opened', () => {
  const { run, app } = withProgram();
  const n = run('S.program.length');
  let h = app();
  assert.equal((h.match(/data-i="\d+"/g) || []).length, n);
  assert.doesNotMatch(h, /<summary><b>Неделя /);
  assert.doesNotMatch(h, /<h3[^>]*>Неделя /);
  assert.doesNotMatch(h, /class="card dayc"/);
  assert.doesNotMatch(h, /id="tedit"/);
  assert.doesNotMatch(h, /✏️ Изменить/);
  assert.doesNotMatch(h, /class="li exo"/);
  assert.doesNotMatch(h, /Разминка/);
  assert.doesNotMatch(h, /Заминка/);
  startBetween(h, run('dayDue()'));
  assert.match(h, /id="start"[^>]*>▶ Начать тренировку</);
  assert.ok(run('TOPEN') === false);
});

test('v139: tapping a workout opens its exercises; Start and back are there, still no Edit', () => {
  const { run, app } = withProgram();
  run('today(3)');
  const h = app();
  assert.equal(run('TOPEN'), true);
  assert.equal(run('TSEL'), 3);
  assert.match(h, /class="li exo"/);
  assert.match(h, /Разминка/);
  assert.match(h, /id="tback"[^>]*>← К списку тренировок</);
  assert.match(h, /id="start"[^>]*>▶ Начать тренировку</);
  assert.doesNotMatch(h, /id="tedit"/);
  assert.match(h, /<h2 style="margin-top:6px">4\. /);
  run('$("#tback").onclick()');
  assert.equal(run('TOPEN'), false);
  assert.doesNotMatch(app(), /class="li exo"/);
  assert.doesNotMatch(app(), /Разминка/);
});

test('v139: starting from the list starts the due workout and shows the live exercise view', () => {
  const { run, app } = withProgram();
  run('S.block.next=2;today()');
  const h = app();
  startBetween(h, 2);
  assert.match(h, /class="full dayb pri sel"[^>]*data-i="2"/);
  run('$("#start").onclick()');
  assert.equal(run('S.active.dayIdx'), 2);
  assert.match(app(), /id="fin2"/);
  assert.match(app(), /Завершить тренировку/);
});

test('v139: starting an opened workout starts that day, not only the due one', () => {
  const { run } = withProgram();
  run('today(5);$("#start").onclick()');
  assert.equal(run('S.active.dayIdx'), 5);
});
