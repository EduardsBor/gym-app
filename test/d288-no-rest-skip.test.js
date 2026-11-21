'use strict';
// D-288 (Eduards: «Убери вообще кнопку эту»): no ✕ skip/stop on the rest timer
// (exercise-screen circle and the bottom «Отдых» bar). Rest still ends on its own;
// logging the next set restarts it.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

const SKIP = /id="tstop"|id="exskip"|Пропустить отдых|Skip rest|Izlaist atpūtu|exrestc|#exrc|\$\('#tstop'\)/;

test('D-288: no rest-skip button in the app, CSS or dictionaries', () => {
  for (const f of ['index.html', 'app.js', 'exscreen.js', 'style.css', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js']) {
    assert.doesNotMatch(read(f), SKIP, f);
  }
  assert.match(read('app.js'), /function startTimer\(/);
  assert.match(read('app.js'), /function stopTimer\(/);
  assert.match(read('app.js'), /if\(l<=0\)\{[^}]*stopTimer\(true\)/);
  assert.match(read('app.js'), /if\(it\.rest&&!isCardio\(it\.exId\)\)startTimer\(/);
});

function boot() {
  const store = new Map();
  const nodes = new Map();
  function el(id) {
    if (id && nodes.has(id)) return nodes.get(id);
    const node = {
      id: id || '', innerHTML: '', textContent: '', className: '', value: '', style: {}, dataset: {},
      classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
      append() {}, remove() {}, play() { return null; }, pause() {}, addEventListener() {},
      insertAdjacentHTML() {}, setAttribute() {}, getAttribute() { return null; },
      closest() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; },
      onclick: null
    };
    if (id) nodes.set(id, node);
    return node;
  }
  const g = {
    console, setTimeout() { return 0; }, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
    scrollTo() {}, scrollY: 0,
    Audio: function () { this.play = () => ({ catch() {} }); this.pause = () => {}; this.addEventListener = () => {}; this.load = () => {}; this.setAttribute = () => {}; },
    confirm: () => true, prompt: () => null, URL, Blob,
    navigator: { language: 'ru', languages: ['ru'], vibrate() {} },
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
    location: { href: 'http://127.0.0.1/', origin: 'http://127.0.0.1', pathname: '/', search: '' },
    document: {
      documentElement: { lang: 'ru' }, title: '', hidden: false,
      body: { append() {}, style: {}, classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } } },
      querySelector(sel) { const m = /^#([\w-]+)/.exec(sel || ''); return el(m ? m[1] : ''); },
      querySelectorAll() { return []; }, getElementById(id) { return el(id); }, addEventListener() {}, createElement() { return el(); }
    }
  };
  g.window = g; g.globalThis = g; g.self = g;
  const ctx = vm.createContext(g);
  const files = ['cache-ver.js', 'alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'place.js', 'prog.js', 'plan.js', 'blocks.js', 'legal.js', 'premium.js', 'features.js', 'movekit.js', 'progress.js', 'autow.js', 'exscreen.js'];
  for (const f of files) vm.runInContext(read(f), ctx, { filename: f });
  return { run: code => vm.runInContext(code, ctx) };
}

test('D-288: rest still ends on its own; logging a set restarts a running timer', () => {
  const { run } = boot();
  run('armAudio=function(){};S.sound=false;S.weightAsked=1;S.goal="mass";S.prof={goal:"mass",sex:"m",level:"mid",days:3,len:60,place:"g",prio:[],lim:[]};S.program=[{name:"A",items:[{exId:"bp",sets:3,min:8,max:12,rest:90}]}];S.workouts=[];S.active={id:"w1",start:Date.now(),dayIdx:0,dayName:"A",notes:"",items:[{exId:"bp",ns:3,rest:90,min:8,max:12,sets:[{w:40,r:8,done:false},{w:40,r:8,done:false},{w:40,r:8,done:false}]}]}');
  run('startTimer(90)');
  assert.ok(run('tEnd') > Date.now());
  run('tEnd-=5000;S.tEnd=tEnd'); // pretend 5s of rest have already elapsed
  const first = run('tEnd');
  run('setDone(S.active.items[0],0);save()');
  const second = run('tEnd');
  assert.ok(second > Date.now(), 'timer must still be running after logging a set');
  assert.ok(second > first, 'logging a set must restart rest, not leave a stuck timer');
  assert.equal(run('S.active.items[0].sets[0].done'), true);
  // natural end: countdown reached zero
  run('tEnd=Date.now()-200;S.tEnd=tEnd;tt()');
  assert.equal(run('tEnd'), 0);
  assert.equal(run('S.tEnd'), 0);
});
