'use strict';
// Hold / countdown timer on the exercise screen for time-based items (v143).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

function boot() {
  const store = new Map();
  const nodes = new Map();
  function el(id) {
    if (id && nodes.has(id)) return nodes.get(id);
    const node = {
      id: id || '', innerHTML: '', textContent: '', className: '', value: '', style: {}, dataset: {},
      classList: { _s: new Set(), toggle(c, on) { if (on === undefined) { if (this._s.has(c)) this._s.delete(c); else this._s.add(c); } else if (on) this._s.add(c); else this._s.delete(c); }, add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, contains(c) { return this._s.has(c); } },
      append() {}, remove() {}, play() { return null; }, pause() {}, addEventListener() {}, insertAdjacentHTML() {}, setAttribute() {}, getAttribute() { return null; },
      closest() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; },
      onclick: null, parentElement: null
    };
    if (id) nodes.set(id, node);
    return node;
  }
  const g = {
    console, setTimeout() { return 0; }, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {}, scrollTo() {}, scrollY: 0,
    Audio: function () { this.play = () => ({ catch() {} }); this.pause = () => {}; this.addEventListener = () => {}; this.load = () => {}; this.paused = true; },
    confirm: () => true, prompt: () => null,
    URL, Blob, navigator: { language: 'ru', languages: ['ru'], vibrate() { g._vibrated = true; } },
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
    location: { href: 'http://127.0.0.1/', origin: 'http://127.0.0.1', pathname: '/', search: '' },
    document: {
      documentElement: { lang: 'ru' }, title: '', body: { append() {}, style: {}, classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } } },
      hidden: false,
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
  return { run: code => vm.runInContext(code, ctx), app: () => vm.runInContext('app.innerHTML', ctx), g };
}

function withProgram() {
  const r = boot();
  r.run('armAudio=function(){};S.weightAsked=1;S.goal=null;S.program=null;preview(CATALOG[0],"catalog");$("#pstart").onclick();view="today";render()');
  return r;
}

test('hold timer: duration parsing — ranges, min/s, RU/EN/LV, upper bound', () => {
  const { run } = boot();
  const cases = [
    ['2–3 мин', { sets: 1, val: '2–3', unit: 'min' }, 180],
    ['2-3 min', { sets: 1, val: '2–3', unit: 'min' }, 180],
    ['the last 2–3 min of the cardio block — easy pace', { sets: 1, val: '2–3', unit: 'min' }, 180],
    ['последние 2–3 мин кардио-блока — в лёгком темпе (это часть заминки)', { sets: 1, val: '2–3', unit: 'min' }, 180],
    ['pēdējās 2–3 min kardio bloka — vieglā tempā', { sets: 1, val: '2–3', unit: 'min' }, 180],
    ['17–22 min', { sets: 1, val: '17–22', unit: 'min' }, 1320],
    ['5 мин', { sets: 1, val: '5', unit: 'min' }, 300],
    ['5 min', { sets: 1, val: '5', unit: 'min' }, 300],
    ['2 × 20–45 с', { sets: 2, val: '20–45', unit: 'sec' }, 45],
    ['2×20-45 s', { sets: 2, val: '20–45', unit: 'sec' }, 45],
    ['30 с на каждую ногу', { sets: 1, val: '30', unit: 'sec' }, 30],
    ['20–45 sec', { sets: 1, val: '20–45', unit: 'sec' }, 45],
    ['45s hold', { sets: 1, val: '45', unit: 'sec' }, 45],
  ];
  for (const [text, dose, sec] of cases) {
    const got = JSON.parse(run(`JSON.stringify(exDose(${JSON.stringify(text)}))`));
    assert.deepEqual(got, dose, 'exDose ' + text);
    assert.equal(run(`exHi(${JSON.stringify(dose.val)})`) * (dose.unit === 'min' ? 60 : 1), sec, 'upper ' + text);
  }
  // rep-based stays reps
  assert.deepEqual(JSON.parse(run('JSON.stringify(exDose("8–12"))')), { sets: 1, val: '8–12', unit: 'reps' });
  assert.equal(run('exShort("2 × 20–30 с")'), '2×20–30 с');
  assert.equal(run('exShort("5 мин")'), '5 мин');
  assert.equal(run('exHoldClock(180)'), '3:00');
  assert.equal(run('exHoldClock(45)'), '0:45');
});

test('hold timer: empty cooldown dose + note «2–3 мин» is a 3:00 time item, no stray «.»', () => {
  const { run, app } = withProgram();
  run(`S.program[0].cd={note:'последние 2–3 мин кардио-блока — в лёгком темпе (это часть заминки)',stretch:[]};
      startW(0);const L=exList();const i=L.findIndex(e=>e.src==='c');EXS={pos:i,src:'c',i:L[i].i,id:L[i].id,cm:'',ret:{v:'today',y:0,sel:0,open:[]}};view='ex';exView()`);
  const inf = JSON.parse(run('JSON.stringify(exInfo(exList()[EXS.pos]))'));
  assert.equal(inf.unit, 'min');
  assert.equal(inf.rng, '2–3');
  assert.equal(run('exHoldSec(exList()[EXS.pos])'), 180);
  const h = app();
  assert.match(h, /id="exht"/);
  assert.match(h, />3:00</);
  assert.match(h, /id="exhold"/);
  assert.match(h, />Пуск</);
  assert.doesNotMatch(h, /id="exhold"[^>]*>\s*▶/);
  assert.match(h, /Подход выполнен|Записать подход/);
  assert.doesNotMatch(h, /\+\s*<span>Подход выполнен|\+\s*Подход выполнен/);
  // no empty-dose middle dot sitting on its own line under the name
  assert.doesNotMatch(h, /exrec"><span>\s*<\/span>\s*·/);
  assert.doesNotMatch(h, /exrec"><span>\.<\/span>/);
  assert.match(h, /последние 2–3 мин кардио-блока/);
});

test('hold timer: start → countdown from timestamp → auto-mark set done and start rest', () => {
  const { run, app } = withProgram();
  run(`startW(0);
      const it={exId:'mk-front-plank',ns:2,sets:[{w:0,r:45,done:false},{w:0,r:45,done:false}],min:20,max:45,rest:30,sec:1};
      S.active.items.push(it);S.program[0].items.push({exId:'mk-front-plank',sets:2,min:20,max:45,rest:30,sec:1});
      const L=exList();const pos=L.findIndex(e=>e.src==='m'&&e.id==='mk-front-plank');
      EXS={pos,src:'m',i:L[pos].i,id:'mk-front-plank',cm:'',ret:{v:'today',y:0,sel:0,open:[]}};view='ex';exView()`);
  assert.equal(run('exHoldSec(exList()[EXS.pos])'), 45);
  assert.match(app(), /id="exhold"/);
  assert.match(app(), />0:45</);
  run('exHoldToggle()');
  const endAt = run('S.exHold.endAt');
  assert.ok(endAt > Date.now() && endAt <= Date.now() + 45000 + 50);
  assert.equal(run('S.exHold.dur'), 45);
  assert.equal(run('S.exHold.paused'), false);
  // countdown is computed from the timestamp, not from how many ticks ran
  run('S.exHold.endAt=Date.now()+12000');
  assert.equal(run('exHoldLeft(S.exHold)'), 12);
  run('exHoldPaint()');
  assert.equal(run('document.getElementById("exht").textContent'), '0:12');
  // time is up → auto-done + rest
  run('S.exHold.endAt=Date.now()-200;exHoldTick()');
  assert.equal(run('S.active.items.find(x=>x.exId==="mk-front-plank").sets[0].done'), true);
  assert.equal(run('S.active.items.find(x=>x.exId==="mk-front-plank").sets[0].r'), 45);
  assert.equal(run('S.active.items.find(x=>x.exId==="mk-front-plank").sets[1].done'), false);
  assert.ok(run('tEnd') > Date.now(), 'rest starts after a timed set when the plan has rest');
  assert.equal(run('S.exHold'), null);
});

test('hold timer: survives backgrounding — remaining time comes from endAt, not tick count', () => {
  const { run } = withProgram();
  run(`startW(0);
      S.active.items.push({exId:'mk-front-plank',ns:1,sets:[{w:0,r:45,done:false}],min:20,max:45,rest:0,sec:1});
      S.program[0].items.push({exId:'mk-front-plank',sets:1,min:20,max:45,rest:0,sec:1});
      const L=exList();const pos=L.findIndex(e=>e.src==='m'&&e.id==='mk-front-plank');
      EXS={pos,src:'m',i:L[pos].i,id:'mk-front-plank',cm:'',ret:{v:'today',y:0,sel:0,open:[]}};view='ex';exView();
      exHoldToggle()`);
  const endAt = run('S.exHold.endAt');
  // pretend the tab was frozen for 20s (no interval ticks), then a single resume tick
  run(`S.exHold.endAt=${endAt}-20000;exHoldTick()`);
  const left = run('exHoldLeft(S.exHold)');
  assert.ok(left >= 24 && left <= 26, 'left should be ~25s after 20s in the background, got ' + left);
  // pause / resume keeps the leftover and writes a new endAt
  run('exHoldToggle()'); // pause
  assert.equal(run('S.exHold.paused'), true);
  const pausedLeft = run('S.exHold.left');
  run('exHoldToggle()'); // resume
  assert.equal(run('S.exHold.paused'), false);
  const resumeEnd = run('S.exHold.endAt');
  assert.ok(Math.abs((resumeEnd - Date.now()) / 1000 - pausedLeft) < 2);
  // expired while backgrounded → auto-done on the next tick
  run('S.exHold.endAt=Date.now()-5000;exHoldTick()');
  assert.equal(run('S.active.items.find(x=>x.exId==="mk-front-plank").sets[0].done'), true);
});

test('hold timer: no start button or countdown on a rep-based exercise', () => {
  const { run, app } = withProgram();
  run(`startW(0);
      const L=exList();const pos=L.findIndex(e=>e.src==='m'&&exHoldSec(e)===0);
      if(pos<0)throw new Error('no rep-based item');
      EXS={pos,src:'m',i:L[pos].i,id:L[pos].id,cm:'',ret:{v:'today',y:0,sel:0,open:[]}};view='ex';exView()`);
  const h = app();
  assert.doesNotMatch(h, /id="exhold"/);
  assert.doesNotMatch(h, /id="exht"/);
  assert.doesNotMatch(h, /▶ Пуск|id="exhold"/);
  assert.match(h, /Повторов|id="exadd"/);
  assert.equal(run('exHoldSec(exList()[EXS.pos])'), 0);
});

test('hold timer: manual «Set done» still works and cancels a running countdown', () => {
  const { run } = withProgram();
  run(`startW(0);
      S.active.items.push({exId:'mk-front-plank',ns:1,sets:[{w:0,r:'',done:false}],min:20,max:45,rest:20,sec:1});
      S.program[0].items.push({exId:'mk-front-plank',sets:1,min:20,max:45,rest:20,sec:1});
      const L=exList();const pos=L.findIndex(e=>e.src==='m'&&e.id==='mk-front-plank');
      EXS={pos,src:'m',i:L[pos].i,id:'mk-front-plank',cm:'',ret:{v:'today',y:0,sel:0,open:[]}};view='ex';exView();
      exHoldToggle();exLog()`);
  assert.equal(run('S.active.items.find(x=>x.exId==="mk-front-plank").sets[0].done'), true);
  assert.equal(run('S.active.items.find(x=>x.exId==="mk-front-plank").sets[0].r'), 45, 'manual log fills the planned upper bound when the field is empty');
  assert.equal(run('S.exHold'), null);
  assert.ok(run('tEnd') > Date.now());
});

test('hold timer: ticks do not rebuild the workout list (D-286)', () => {
  const src = read('exscreen.js');
  assert.match(src, /exHoldTick/);
  assert.match(src, /S\.exHold/);
  assert.match(src, /endAt/);
  assert.doesNotMatch(src, /function exHoldTick[\s\S]{0,400}workoutView\(/);
  assert.match(read('cache-ver.js').trim(), /^var SW_CACHE='moyzal-v160';$/);
  assert.doesNotMatch(read('exscreen.js'), /\+\s*<span>Подход выполнен/);
  assert.doesNotMatch(read('i18n/dict.js')+read('i18n/dict2.js')+read('i18n/dict3.js'), /\+\s*Подход выполнен|\+\s*Set done|\+\s*Piegājiens izpildīts/);
  assert.match(read('i18n/dict3.js'), /\['Пуск','Start','Sākt'\]/);
  assert.doesNotMatch(read('i18n/dict3.js'), /▶ Пуск/);
  assert.doesNotMatch(read('exscreen.js'), /▶ Пуск|id="exhold"[^>]*>[^<]*▶/);
  assert.match(read('i18n/dict3.js'), /Laiks beidzies/);
  assert.ok(fs.existsSync(path.join(root, 'docs/LV-NEW-TIMER.md')));
});
