'use strict';
// D-238: «Тренировки» tab — next workout card + all program workouts by week (✓ done), tap opens that workout; «Программа» without «Почему программа построена так».
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

test('D-238: tab and screen are «Тренировки»; block program shows the card and all workouts by week', () => {
  const { run, app } = withProgram();
  assert.match(read('index.html'), /<button data-v="today">🏋️<span>Тренировки<\/span><\/button>/);
  assert.doesNotMatch(read('index.html'), /Сегодня/);
  assert.ok(run('blockActive()'));
  assert.equal(run('$("#title").textContent'), 'Тренировки');
  const h = app();
  assert.match(h, /id="start"/);
  assert.match(h, /id="blk-skip"/);
  assert.match(h, /<h2>Все тренировки программы<\/h2>/);
  assert.match(h, /<summary><b>Неделя 1<\/b>/);
  assert.equal((h.match(/data-i="\d+"/g) || []).length, run('S.program.length'));
  assert.ok(h.indexOf('id="start"') < h.indexOf('Все тренировки программы'));
});

test('D-238: done workouts get ✓; tapping another workout opens it and it can be started', () => {
  const { run, app } = withProgram();
  run('S.block.next=2;today()');
  let h = app();
  assert.match(h, /class="full dayb done"[^>]*data-i="0">✓ /);
  assert.match(h, /class="full dayb done"[^>]*data-i="1">✓ /);
  // D-239: no eye icon; the open workout is the whole accent-coloured button
  assert.doesNotMatch(h, /👁/);
  assert.match(h, /class="full dayb pri sel"[^>]*data-i="2" aria-current="true">3\. Всё тело/);
  assert.equal((h.match(/dayb[^"]*pri sel/g) || []).length, 1);
  assert.match(read('style.css'), /\.dayb\.pri\.sel\{background:var\(--acc\);color:var\(--on-acc\);font-weight:800/);
  assert.match(h, /<span class="mut">2\/3 трен\./);
  run('today(5)');
  h = app();
  assert.match(h, /Выбранный день/);
  assert.match(h, /id="tback"/);
  assert.match(h, /class="full dayb pri sel"[^>]*data-i="5"/);
  assert.doesNotMatch(h, /id="blk-skip"/);
  assert.equal(run('TSEL'), 5);
  assert.equal(run('exDay().sel'), 5); // exercise screen follows the opened workout
  run('$("#start").onclick()');
  assert.equal(run('S.active.dayIdx'), 5);
  assert.equal(run('S.active.dayName'), run('S.program[5].name'));
});

test('D-238: plain (non-block) program — same list, ✓ from this week history', () => {
  const { run, app } = withProgram();
  run('delete S.block;S.workouts.push({id:"w1",start:Date.now()-3600e3,end:Date.now(),dayIdx:1,dayName:S.program[1].name,items:[]});today(0)');
  const h = app();
  assert.match(h, /Все тренировки программы/);
  assert.match(h, /data-i="1">✓ /);
  assert.doesNotMatch(h, /data-i="0">✓ /);
});

test('D-238: «Программа» has no «Почему программа построена так»; S.why kept; free state still renders', () => {
  const { run, app } = withProgram();
  assert.ok(run('Array.isArray(S.why)&&S.why.length>0'));
  run('program()');
  assert.doesNotMatch(app(), /Почему программа построена так/);
  run('can=()=>false;today()');
  assert.equal(run('$("#title").textContent'), 'Тренировки');
  assert.match(app(), /Мой дневник/);
});

test('D-269: main workout card has no «Неделя N ·» title and no this-week / program counters; list weeks and stored names stay', () => {
  const { run, app } = withProgram();
  const stored = run('S.program[S.block.next|0].name');
  assert.match(stored, /^Неделя \d+ · /);
  const title = run('workoutLabel(S.program[S.block.next|0], S.block.next|0)');
  assert.doesNotMatch(title, /^Неделя /);
  assert.match(title, /^\d+\. /);
  const h = app();
  const re = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.match(h, new RegExp('<h2 style="margin-top:6px">' + re(title) + '</h2>'));
  assert.doesNotMatch(h, /<h2 style="margin-top:6px">Неделя /);
  assert.match(h, /× в неделю<\/div><h2 style="margin-top:6px">/);
  assert.doesNotMatch(h, /на этой неделе/);
  assert.doesNotMatch(h, / · \d+\/\d+<\/div><h2/);
  assert.match(h, /<summary><b>Неделя 1<\/b>/);
  run('$("#start").onclick()');
  assert.equal(run('S.active.dayName'), stored);
  run('S.active=null;delete S.block;today(0)');
  const h2 = app();
  assert.doesNotMatch(h2, /на этой неделе/);
  assert.doesNotMatch(h2, /<h2 style="margin-top:6px">Неделя /);
  assert.match(h2, /× в неделю<\/div><h2 style="margin-top:6px">/);
});
