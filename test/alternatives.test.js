'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');

function boot() {
  const nodes = new Map();
  function el(id) {
    if (id && nodes.has(id)) return nodes.get(id);
    const node = {
      id: id || '', innerHTML: '', textContent: '', className: '', value: '', style: {}, dataset: {},
      classList: {toggle(){}, add(){}, remove(){}, contains(){ return false; }},
      append(){}, addEventListener(){}, setAttribute(){}, getAttribute(){ return null; }, closest(){ return null; },
      querySelector(){ return null; }, querySelectorAll(){ return []; }
    };
    if (id) nodes.set(id, node);
    return node;
  }
  const g = {
    console, setTimeout, clearTimeout, setInterval(){ return 0; }, clearInterval(){},
    URL, Blob, navigator: {language: 'ru', languages: ['ru']},
    localStorage: {getItem(){ return null; }, setItem(){}},
    location: {href: 'http://127.0.0.1/', origin: 'http://127.0.0.1', pathname: '/'},
    document: {
      documentElement: {lang: 'ru'}, title: '',
      body: {append(){}, style: {}},
      querySelector(sel){ const m = /^#([\w-]+)/.exec(sel || ''); return el(m ? m[1] : ''); },
      querySelectorAll(){ return []; },
      addEventListener(){}, createElement(){ return el(); }
    }
  };
  g.window = g; g.globalThis = g; g.self = g;
  const ctx = vm.createContext(g);
  const files = ['alt.js','i18n/dict.js','i18n/dict2.js','i18n/dict3.js','i18n/i18n.js','app.js','tech.js','lib.js','i18n/lib.en.js','i18n/lib.lv.js','i18n/tech.en.js','i18n/tech.lv.js','cards.js','warm.js'];
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, {filename: f});
  ctx.__nodes = nodes;
  return ctx;
}

const ctx = boot();
const get = name => vm.runInContext(name, ctx);
const EX = get('EX');
const ALT = get('ALT');
const ids = new Set(EX.map(e => e.id));

function modalHtml(cur, a) {
  vm.runInContext(`swapModal(${JSON.stringify(cur)}, ${JSON.stringify(a)}, function(){})`, ctx);
  return ctx.__nodes.get('modal').innerHTML;
}
function parts(html) {
  const cut = html.indexOf('Другое оборудование');
  const head = cut < 0 ? html : html.slice(0, cut);
  const tail = cut < 0 ? '' : html.slice(cut);
  const take = s => [...s.matchAll(/data-p="([^"]+)"/g)].map(m => m[1]);
  return {good: take(head), other: take(tail), all: take(html)};
}
function listed(cur, a) {
  const raw = (ALT[cur] || []).filter(id => ids.has(id));
  const ok = id => get('okEx')(id, a);
  return {good: raw.filter(ok), other: raw.filter(id => !ok(id)), all: raw};
}

const prof = {goal: 'mass', sex: 'm', level: 'mid', days: 3, len: 60, place: 'g', prio: [], lim: []};
const nameOf = id => EX.find(e => e.id === id).name;

test('every ALT key and value is a real exercise id', () => {
  assert.equal(Object.keys(ALT).length, 154);
  for (const [k, list] of Object.entries(ALT)) {
    assert.equal(ids.has(k), true, k);
    assert.equal(list.includes(k), false, 'self '+k);
    assert.equal(new Set(list).size, list.length, 'dup '+k);
    for (const v of list) {
      assert.equal(ids.has(v), true, k+' -> '+v);
      assert.equal(v === 'smith-inverted-row', false);
    }
  }
  assert.equal(ALT['smith-inverted-row'], undefined);
  for (const id of ['w_march','ankle-knee-to-wall']) assert.equal(Object.prototype.hasOwnProperty.call(ALT, id), false);
  for (const id of ['sq','lp','gsq']) assert.equal(ALT[id][ALT[id].length-1], 'mk-dumbbell-step-up-low', id);
});

test('swapModal offers only the trainer list, same muscles, trainer order', () => {
  const a = {place: 'g', lim: []};
  for (const cur of ['sq','lc','le','bp','lat']) {
    const html = modalHtml(cur, a);
    const got = parts(html);
    const exp = listed(cur, a);
    assert.match(html, /Альтернативы на те же мышцы/);
    assert.equal(html.includes('Альтернативы ('), false, cur);
    const arr = xs => Array.from(xs, x => String(x));
    assert.deepEqual(arr(got.good), arr(exp.good), cur+' good');
    assert.deepEqual(arr(got.other), arr(exp.other), cur+' other');
    for (const id of got.all) assert.equal(exp.all.includes(id), true, cur+' extra '+id);
  }
  assert.equal(parts(modalHtml('lc', a)).all.includes('le'), false);
  assert.equal(parts(modalHtml('le', a)).all.includes('lc'), false);
  const bp = parts(modalHtml('bp', a)).all;
  if (!ALT.bp.includes('fly')) assert.equal(bp.includes('fly'), false);
  else assert.equal(bp.includes('fly'), true);
  const home = {place: 'b', lim: []};
  const split = parts(modalHtml('bp', home));
  const expHome = listed('bp', home);
  const arr = xs => Array.from(xs, x => String(x));
  assert.deepEqual(arr(split.good), arr(expHome.good));
  assert.deepEqual(arr(split.other), arr(expHome.other));
  assert.ok(split.other.length > 0);
  assert.match(modalHtml('bp', home), /Другое оборудование или риск при ограничениях:/);
  assert.match(modalHtml('bp', home), /opacity:\.6/);
});

test('swap button is hidden when the trainer list is empty or missing', () => {
  const items = [
    {exId: 'bdog', sets: 2, min: 8, max: 12, rest: 60},
    {exId: 'bp', sets: 3, min: 6, max: 10, rest: 120},
    {exId: 'ankle-knee-to-wall', sets: 2, min: 8, max: 12, rest: 45}
  ];
  vm.runInContext(`S.prof=${JSON.stringify(prof)};S.goal='mass';S.days=3;S.progName='Тест';S.why=null;S.program=${JSON.stringify([{name:'День 1', items}])};`, ctx);
  get('program')();
  const editor = ctx.__nodes.get('app').innerHTML;
  assert.equal(editor.includes('data-swp="0,0"'), false);
  assert.equal(editor.includes('data-swp="0,1"'), true);
  assert.equal(editor.includes('data-swp="0,2"'), false);
  const bdogRow = editor.slice(editor.indexOf(nameOf('bdog')), editor.indexOf(nameOf('bp')));
  assert.equal(bdogRow.includes('⇄'), false);
  assert.equal(bdogRow.includes('data-up="0,0"'), true);

  vm.runInContext(`PV=${JSON.stringify({pr:{name:'Тест', desc:'d', a:prof}, back:'quiz', gen:{days:[{name:'День 1', items}], why:[['Почему',[]]]}})};`, ctx);
  get('renderPreview')();
  const preview = ctx.__nodes.get('app').innerHTML;
  assert.equal(preview.includes('data-sw="0,0"'), false);
  assert.equal(preview.includes('data-sw="0,1"'), true);
  assert.equal(preview.includes('data-sw="0,2"'), false);
  const warm = preview.slice(preview.indexOf('class="wud"'), preview.indexOf('</details>'));
  assert.equal(warm.includes('⇄'), false);
  assert.equal(warm.includes('data-sw'), false);

  vm.runInContext(`S.active=${JSON.stringify({id:'w1', start:Date.now(), dayIdx:0, dayName:'День 1', notes:'', items: items.map(it => ({
    exId: it.exId, ns: it.sets, rest: it.rest, min: it.min, max: it.max, sets: [{w:'', r:it.max, pf:false, done:false}]
  }))})};`, ctx);
  get('workoutView')();
  const workout = ctx.__nodes.get('app').innerHTML;
  assert.equal(workout.includes('data-ws="0"'), false);
  assert.equal(workout.includes('data-ws="1"'), true);
  assert.equal(workout.includes('data-ws="2"'), false);
  const wdog = workout.slice(workout.indexOf(nameOf('bdog')), workout.indexOf(nameOf('bp')));
  assert.equal(wdog.includes('⇄'), false);
  assert.equal(wdog.includes('data-rm="0"'), true);
});
