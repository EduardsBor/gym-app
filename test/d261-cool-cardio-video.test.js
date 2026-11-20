'use strict';
// D-261: cool-down «Лёгкое кардио» — gym: incline-treadmill-walk + caption; home (b_bar/b_nobar/d): no clip, walk on the spot.
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
const NOTE = 'последние 2–3 мин кардио-блока — в лёгком темпе (это часть заминки)';
const CAP_G = 'Без наклона или с малым наклоном, в лёгком темпе; можно на том же тренажёре, что в кардио-блоке';
const CAP_H = 'Ходьба на месте в лёгком темпе';

test('D-261: gym cool-down row shows incline-treadmill-walk with the exact caption', () => {
  const b = boot();
  const r = JSON.parse(b.run(`JSON.stringify(cdRows({note:${JSON.stringify(NOTE)},pl:'g',stretch:[]})[0])`));
  assert.deepEqual(r, { id: 'mk-incline-treadmill-walk', n: 'Лёгкое кардио', d: '', x: NOTE, c: CAP_G });
  assert.equal(b.run('movekitFile("mk-incline-treadmill-walk")'), 'incline-treadmill-walk.mp4');
  assert.ok(b.run(`cdHTML({note:${JSON.stringify(NOTE)},pl:'g',stretch:[]})`).includes(CAP_G));
});

test('D-261: home rows (b / d) — no clip, «Ходьба на месте в лёгком темпе»; no w_march, walk-brisk unchanged', () => {
  const b = boot();
  for (const pl of ['b', 'd']) {
    const r = JSON.parse(b.run(`JSON.stringify(cdRows({note:${JSON.stringify(NOTE)},pl:'${pl}',stretch:[]})[0])`));
    assert.deepEqual(r, { id: '', n: 'Лёгкое кардио', d: '', x: NOTE, c: CAP_H }, pl);
  }
  assert.ok(!b.run('movekitFile("walk-brisk")'));
  assert.doesNotMatch(read('plan.js'), /w_march/);
});

test('D-261: generated gym/home programs carry the place on cd; blocks b_bar/b_nobar resolve to home; strings RU/EN/LV', () => {
  const b = boot();
  b.run(`S.prof={goal:'mass',level:'nov',days:3,len:60,place:'g',sex:'m',prio:[],lim:[]}`);
  const g = JSON.parse(b.run(`JSON.stringify(planFromTemplate({goal:'mass',level:'nov',days:3,len:60,place:'g',sex:'m',prio:[],lim:[]}).days.map(d=>d.cd&&d.cd.pl))`));
  assert.ok(g.every(x => x === 'g'));
  const h = JSON.parse(b.run(`JSON.stringify(planFromTemplate({goal:'mass',level:'nov',days:3,len:60,place:'b',sex:'m',prio:[],lim:[]}).days.map(d=>d.cd&&d.cd.pl))`));
  assert.ok(h.every(x => x === 'b'));
  const d3 = read('i18n/dict3.js');
  assert.ok(d3.includes("'Bez slīpuma vai ar nelielu slīpumu, vieglā tempā; var izmantot to pašu trenažieri, kas kardio blokā'"));
  assert.ok(d3.includes("['Ходьба на месте в лёгком темпе','Walking on the spot at an easy pace','Soļošana uz vietas vieglā tempā']"));
  assert.match(read('exscreen.js'), /e\.r\.c\?`<p class="mut excap">/);
});
