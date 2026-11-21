'use strict';
// D-287 (Eduards: «Kā gāja? (nav obligāti) убирай вообще, во всех языках»):
// no optional «Как прошло?» / «How did it go?» / «Kā gāja?» row on the workout exercise card.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

const FEEL_UI = /Как прошло\?|How did it go\?|Kā gāja\?|data-awfeel|awFeelHTML|AW_FEELS|class="[^"]*awfeel/;
const DAY = 864e5;

test('D-287: feel row is gone from UI code and dictionaries in RU/EN/LV', () => {
  for (const f of ['autow.js', 'app.js', 'exscreen.js', 'blocks.js', 'features.js', 'plan.js', 'progress.js', 'csv.js']) {
    assert.doesNotMatch(read(f), /data-awfeel|awFeelHTML|AW_FEELS|class="[^"]*awfeel|Как прошло\?/, f);
  }
  const d = read('i18n/dict.js') + read('i18n/dict2.js') + read('i18n/dict3.js');
  assert.doesNotMatch(d, /\['Как прошло\?'/);
  assert.doesNotMatch(d, /How did it go\?/);
  assert.doesNotMatch(d, /Kā gāja\?/);
  assert.doesNotMatch(d, /\['\(необязательно\)'/);
  // Button-word translations stay: CSV still prints old saved feel values.
  assert.match(d, /\['легко','easy','viegli'\]/);
  assert.match(d, /\['нормально','normal','normāli'\]/);
  assert.match(d, /\['тяжело','hard','grūti'\]/);
  assert.match(read('csv.js'), /CSV_FEEL/);
  assert.match(read('autow.js'), /it\.feel&&PR_FEEL\[it\.feel\]/);
});

function boot(lang) {
  const store = new Map();
  const now = Date.now();
  store.set('gym', JSON.stringify({
    lang, goal: 'mass', weightAsked: 1, days: 3, next: 0,
    prof: { goal: 'mass', sex: 'm', level: 'mid', days: 3, len: 60, place: 'g', prio: [], lim: [] },
    program: [{ name: 'A', items: [{ exId: 'bp', sets: 3, min: 8, max: 12, rest: 120 }] }],
    workouts: [{
      id: 'w0', start: now - 2 * DAY, end: now - 2 * DAY + 3600e3, dayIdx: 0, dayName: 'A', notes: '',
      items: [{ exId: 'bp', ns: 3, min: 8, max: 12, rest: 120, feel: 'easy', sets: [12, 12, 12].map(r => ({ w: 60, r, done: true })) }]
    }],
    custom: [], body: [], templates: []
  }));
  const nodes = new Map();
  function el(id) {
    if (id && nodes.has(id)) return nodes.get(id);
    const node = {
      id: id || '', innerHTML: '', textContent: '', className: '', value: '', style: {}, dataset: {},
      classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
      append() {}, remove() {}, play() { return null; }, pause() {}, addEventListener() {},
      insertAdjacentHTML(pos, html) { node.innerHTML += String(html || ''); },
      setAttribute() {}, getAttribute() { return null; }, closest() { return null; },
      querySelector() { return null; }, querySelectorAll() { return []; }, onclick: null
    };
    if (id) nodes.set(id, node);
    return node;
  }
  const g = {
    console, setTimeout() { return 0; }, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
    scrollTo() {}, scrollY: 0,
    Audio: function () { this.play = () => ({ catch() {} }); this.pause = () => {}; this.addEventListener = () => {}; this.load = () => {}; },
    confirm: () => true, alert() {}, prompt: () => null, URL, Blob,
    MutationObserver: function () { this.observe = function () {}; },
    NodeFilter: { SHOW_TEXT: 4 },
    navigator: { language: lang, languages: [lang] },
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
    location: { href: 'http://127.0.0.1/', origin: 'http://127.0.0.1', pathname: '/', search: '' },
    document: {
      documentElement: { lang }, title: '', body: { append() {}, style: {}, classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } } },
      querySelector(sel) { const m = /^#([\w-]+)/.exec(sel || ''); return el(m ? m[1] : ''); },
      querySelectorAll() { return []; }, getElementById(id) { return el(id); }, addEventListener() {}, createElement() { return el(); }, createTreeWalker() { return { nextNode() { return null; } }; }
    }
  };
  g.window = g; g.globalThis = g; g.self = g;
  const ctx = vm.createContext(g);
  const files = ['cache-ver.js', 'alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'place.js', 'prog.js', 'plan.js', 'blocks.js', 'legal.js', 'premium.js', 'features.js', 'movekit.js', 'progress.js', 'autow.js', 'exscreen.js'];
  for (const f of files) vm.runInContext(read(f), ctx, { filename: f });
  return { run: code => vm.runInContext(code, ctx), app: () => vm.runInContext('app.innerHTML', ctx), store, g };
}

function rendered(lang) {
  const b = boot(lang);
  b.run('armAudio=function(){};S.weightAsked=1;startW(0);S.active.items[0].sets.forEach(s=>{s.done=true;s.w=60;s.r=12});workoutView()');
  return { html: b.app(), lang: b.run('LANG'), feelKept: b.run('S.workouts[0].items[0].feel'), typeofFeelHTML: b.run('typeof awFeelHTML') };
}

test('D-287: started workout in RU/EN/LV has no feel row; previously saved feel is left untouched', () => {
  for (const lang of ['ru', 'en', 'lv']) {
    const r = rendered(lang);
    assert.equal(r.lang, lang, lang);
    assert.equal(r.typeofFeelHTML, 'undefined', lang);
    assert.equal(FEEL_UI.test(r.html), false, lang + ' html: ' + r.html.slice(0, 400));
    assert.equal(r.html.includes('data-awfeel'), false, lang);
    assert.equal(r.feelKept, 'easy', 'old feel in history must stay (' + lang + ')');
  }
});

test('D-287: without a feel mark, two sessions at the top of the range still add weight; history feel is not stripped', () => {
  const b = boot('lv');
  b.run('armAudio=function(){};S.weightAsked=1;startW(0)');
  b.run(`(()=>{const A=S.active,it=A.items[0];it.sets.forEach(s=>{s.w=60;s.r=12;s.done=true});
    const d=A.items.map(it=>({...it,sets:it.sets.filter(s=>s.done)}));A.items=d;S.workouts.push(A);S.active=null;awFinish(A);save()})()`);
  assert.equal(b.run('S.workouts[S.workouts.length-1].items[0].feel'), undefined);
  assert.equal(b.run('S.workouts[0].items[0].feel'), 'easy');
  assert.equal(b.run('S.pg.bp.next.weight'), 60);
  assert.equal(b.run('S.pg.bp.next.note'), 'top1');
  b.run('startW(0)');
  b.run(`(()=>{const A=S.active,it=A.items[0];it.sets.forEach(s=>{s.w=60;s.r=12;s.done=true});
    const d=A.items.map(it=>({...it,sets:it.sets.filter(s=>s.done)}));A.items=d;S.workouts.push(A);S.active=null;awFinish(A);save()})()`);
  assert.equal(b.run('S.pg.bp.next.weight'), 62.5);
  assert.equal(b.run('S.workouts[0].items[0].feel'), 'easy');
});
