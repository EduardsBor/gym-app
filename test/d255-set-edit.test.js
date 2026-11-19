'use strict';
// D-255: edit / delete a logged set on «Сегодня» of the exercise screen (harness from d244).
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


function logged(n) {
  const r = withProgram();
  r.run('exOpen("m",0)');
  const pos = r.run('EXS.pos');
  for (let k = 0; k < n; k++) r.run(`$("#exw").value="${60 + k * 10}";$("#exr").value="${10 + k}";exLog()`);
  r.run(`EXS.pos=${pos};exView()`); // 2 planned sets → auto-next moved on; come back to the exercise
  return r;
}

test('D-255: each logged set on «Сегодня» has an edit button; edit saves weight, reps, comment', () => {
  const { run, app } = logged(2);
  const h = app();
  assert.match(h, /<div class="li exsetr" data-es="0"><span class="mut">1<\/span><span class="grow">60 кг × 10<\/span><button class="sm" data-es="0" aria-label="Изменить подход">✏️<\/button><\/div>/);
  assert.match(h, /data-es="1"><span class="mut">2<\/span><span class="grow">70 кг × 11</);
  run('exEditSet(0,1)');
  const m = run('$("#modal").innerHTML');
  assert.match(m, /Подход 2/);
  assert.match(m, /id="esw"[^>]*value="70"/);
  assert.match(m, /id="esr"[^>]*value="11"/);
  assert.match(m, /id="essave"[^>]*>Сохранить</);
  assert.match(m, /id="esdel"[^>]*>🗑 Удалить подход</);
  run('$("#esw").value="72,5";$("#esr").value="9";$("#escm").value=" тяжело ";$("#essave").onclick()');
  assert.equal(run('JSON.stringify([S.active.items[0].sets[1].w,S.active.items[0].sets[1].r,S.active.items[0].sets[1].cm])'), '[72.5,9,"тяжело"]');
  assert.match(app(), /72\.5 кг × 9<\/span><span class="mut">тяжело<\/span>/);
  assert.equal(run('exSetSave(0,1,{w:"-5",r:"9",cm:""})'), false, 'negative weight rejected');
});

test('D-255: delete renumbers, updates the done counter, keeps the planned set count; history saves without it', () => {
  const { run, app } = logged(2);
  const plan = run('S.active.items[0].ns');
  run('exEditSet(0,0);$("#esdel").onclick()');
  assert.equal(run('S.active.items[0].sets.filter(s=>s.done).length'), 1);
  assert.equal(run('S.active.items[0].sets.length'), plan);
  const h = app();
  assert.match(h, new RegExp('id="exsets"><b>1/' + plan + '</b>'));
  assert.match(h, /data-es="0"><span class="mut">1<\/span><span class="grow">70 кг × 11</);
  assert.doesNotMatch(h, /60 кг × 10/);
  assert.equal(run('exSetDel(0,5)'), false, 'not a done set');
  run('workoutView();$("#fin").onclick()');
  const w = run('JSON.stringify(S.workouts[S.workouts.length-1].items[0].sets.filter(s=>s.done).map(s=>[s.w,s.r]))');
  assert.equal(w, '[[70,11]]');
});

test('D-255: strings RU/EN/LV; LV doc; S.active stays device-local (not synced)', () => {
  const d = read('i18n/dict3.js');
  for (const t of ["['Изменить подход','Edit set','Labot piegājienu']", "['🗑 Удалить подход','🗑 Delete set','🗑 Dzēst piegājienu']", "['Удалить подход?','Delete this set?','Dzēst šo piegājienu?']", "['Подход изменён','Set updated','Piegājiens labots']", "['Подход удалён','Set deleted','Piegājiens dzēsts']"]) assert.ok(d.includes(t), t);
  assert.ok(fs.existsSync(path.join(root, 'docs/LV-NEW-SET-EDIT.md')));
  assert.match(read('sync.js'), /delete p\.active;/);
});
