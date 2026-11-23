'use strict';
// Sequential program-wide workout numbers 1…N (e.g. 36), not a repeating A/B/C or 1/2/3 cycle.
// Plan view, current workout, and history labels. Stored dayName stays the old «Неделя N · …» form.
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
  const files = ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'place.js', 'prog.js', 'plan.js', 'blocks.js', 'legal.js', 'premium.js', 'features.js', 'movekit.js', 'progress.js', 'autow.js', 'exscreen.js', 'health.js'];
  for (const f of files) vm.runInContext(read(f), ctx, { filename: f });
  return { run: code => vm.runInContext(code, ctx), app: () => vm.runInContext('app.innerHTML', ctx), modal: () => vm.runInContext('document.getElementById("modal").innerHTML', ctx) };
}
function withProgram() {
  const r = boot();
  r.run('armAudio=function(){};S.weightAsked=1;S.goal=null;S.program=null;preview(CATALOG[0],"catalog");$("#pstart").onclick();view="today";render()');
  return r;
}

test('sequential labels: plan days are 1…36; stored names stay «Неделя N ·»', () => {
  const { run } = withProgram();
  assert.equal(run('S.program.length'), 36);
  const names = run('S.program.map(d=>d.name)');
  const nums = run('S.program.map((d,i)=>dayNum(d,i))');
  const labels = run('S.program.map((d,i)=>workoutLabel(d,i))');
  assert.equal(JSON.stringify(nums), JSON.stringify(Array.from({ length: 36 }, (_, i) => i + 1)));
  assert.equal(labels[0], '1. Всё тело');
  assert.equal(labels[35], '36. Всё тело');
  assert.equal(new Set(labels).size, 36);
  assert.ok(labels.every(l => !/ [A-E]( |$)/.test(l)));
  assert.match(names[0], /^Неделя 1 · Всё тело A/);
  assert.match(names[35], /^Неделя \d+ · Всё тело C/);
  assert.equal(run('dayTitle(S.program[0])'), 'Всё тело A');
  assert.equal(run('S.program[0].n'), 1);
  assert.equal(run('S.program[35].n'), 36);
  // Not a weekly 1/2/3 (or A/B/C-as-number) recycle: week 2 first workout is 4, not 1.
  assert.equal(nums[3], 4);
  assert.match(labels[3], /^4\. /);
});

test('plan view and current workout card show running numbers 1…36, not the week prefix', () => {
  const { run, app } = withProgram();
  let h = app();
  assert.doesNotMatch(h, /<h2 style="margin-top:6px">Неделя /);
  assert.match(h, /data-i="0"[^>]*>1\. /);
  assert.match(h, /data-i="3"[^>]*>4\. /);
  assert.match(h, /data-i="35"[^>]*>36\. /);
  assert.match(h, />1\. Всё тело/);
  assert.doesNotMatch(h, />\d+\. Всё тело [ABC]</);
  assert.doesNotMatch(h, /<summary><b>Неделя /);
  run('today(35)');
  h = app();
  assert.match(h, /<h2 style="margin-top:6px">36\. /);
  assert.match(h, /data-i="35"[^>]*>36\. /);
});

test('startW stores n; in-progress title and history use the running number; old rows stay compatible', () => {
  const { run, app, modal } = withProgram();
  run('today(5);$("#start").onclick()');
  assert.equal(run('S.active.dayIdx'), 5);
  assert.equal(run('S.active.n'), 6);
  assert.match(run('S.active.dayName'), /^Неделя /);
  assert.equal(run('historyLabel(S.active)'), run('workoutLabel(S.program[5],5)'));
  assert.equal(run('$("#title").textContent'), run('historyLabel(S.active)'));
  assert.match(run('$("#title").textContent'), /^6\. /);

  run('S.workouts.push({id:"w-new",start:Date.now()-2e6,end:Date.now()-1e6,dayIdx:5,dayName:S.active.dayName,n:S.active.n,items:[]})');
  run('S.active=null;history()');
  assert.match(app(), /<b>6\. /);
  assert.doesNotMatch(app(), /<b>Неделя \d+ · /);

  // Old saved workout without n: recover the number from dayIdx + matching program name.
  run('S.workouts.push({id:"w-old",start:Date.now()-4e6,end:Date.now()-3e6,dayIdx:11,dayName:S.program[11].name,items:[]});history()');
  assert.match(app(), /<b>12\. /);
  run('showW("w-old")');
  assert.match(modal(), /<h2 class="grow" style="margin:0">12\. /);

  // Old row that no longer matches the program: strip the letter on display, do not rewrite storage.
  run('S.workouts.push({id:"w-orphan",start:Date.now()-6e6,end:Date.now()-5e6,dayIdx:99,dayName:"Неделя 2 · Всё тело A",items:[]});history()');
  assert.match(app(), /<b>Неделя 2 · Всё тело<\/b>/);
  assert.doesNotMatch(app(), /<b>Неделя 2 · Всё тело A<\/b>/);
  assert.equal(run('S.workouts.find(w=>w.id==="w-orphan").dayName'), 'Неделя 2 · Всё тело A');

  // Custom / template workouts must not pick up a program number from dayIdx.
  assert.equal(run('historyLabel({dayName:"Своя тренировка",dayIdx:0,n:1})'), 'Своя тренировка');
  assert.equal(run('historyLabel({dayName:"Шаблон",fromTemplate:"t1",dayIdx:0,n:2})'), 'Шаблон');
});

test('display strips the A/B/C letter and keeps «разгрузка»; RU/EN/LV; stored data unchanged', () => {
  const { run, app } = withProgram();
  assert.equal(run('stripDayLetter("Всё тело A")'), 'Всё тело');
  assert.equal(run('stripDayLetter("Верх тела B (разгрузка)")'), 'Верх тела (разгрузка)');
  assert.equal(run('stripDayLetter("Full body A")'), 'Full body');
  assert.equal(run('stripDayLetter("Full body C (deload)")'), 'Full body (deload)');
  assert.equal(run('stripDayLetter("Visa ķermeņa A")'), 'Visa ķermeņa');
  assert.equal(run('stripDayLetter("Visa ķermeņa B (atslodze)")'), 'Visa ķermeņa (atslodze)');
  assert.equal(run('stripDayLetter("Ноги A")'), 'Ноги');
  assert.equal(run('workoutLabel({name:"Неделя 6 · Всё тело A (разгрузка)",n:16})'), '16. Всё тело (разгрузка)');
  assert.equal(run('historyLabel({dayName:"Неделя 6 · Верх тела B (разгрузка)",n:21})'), '21. Верх тела (разгрузка)');
  const h = app();
  assert.match(h, /1\. Всё тело/);
  assert.doesNotMatch(h, /Всё тело [ABC]/);
  assert.match(run('S.program[0].name'), /Всё тело A/);
  const sum = run('progSummary(S.program)');
  assert.match(sum, /Всё тело/);
  assert.doesNotMatch(sum, /Всё тело [ABC]/);
});

test('preview and program editor use the same running numbers; SW cache is moyzal-v161', () => {
  const { run, app } = withProgram();
  run('preview(CATALOG[0],"catalog")');
  const prev = app();
  assert.match(prev, /<summary><b>1\. /);
  assert.match(prev, /<summary><b>36\. /);
  run('$("#pstart").onclick();program()');
  const pr = app();
  assert.match(pr, /<summary><b>1\. /);
  assert.match(pr, /<summary><b>36\. /);
  assert.match(read('cache-ver.js'), /var SW_CACHE='moyzal-v161'/);
  assert.match(read('sw.js'), /const C=SW_CACHE/);
});

test('D-275: standalone Верх / Низ have EN and LV dictionary entries', () => {
  const ctx = vm.createContext({ console });
  vm.runInContext(read('i18n/dict.js') + '\nthis.DICT=DICT;', ctx, { filename: 'i18n/dict.js' });
  const rows = ctx.DICT;
  const upper = rows.find(r => r[0] === 'Верх');
  const lower = rows.find(r => r[0] === 'Низ');
  assert.deepEqual(Array.from(upper), ['Верх', 'Upper', 'Augšdaļa']);
  assert.deepEqual(Array.from(lower), ['Низ', 'Lower', 'Apakšdaļa']);
});
