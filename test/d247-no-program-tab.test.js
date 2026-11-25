'use strict';
// D-247: no «Программа» tab — program row + «Сменить» on «Тренировки», «✏️ Изменить» per workout, library/science in «Ещё».
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


test('D-247: bottom menu is Тренировки · Прогресс · История · Тело · Профиль (D-248)', () => {
  const nav = /<nav id="nav">([\s\S]*?)<\/nav>/.exec(read('index.html'))[1];
  assert.deepEqual([...nav.matchAll(/data-v="(\w+)"/g)].map(m => m[1]), ['today', 'progress', 'history', 'body', 'more']);
  assert.deepEqual([...nav.matchAll(/<span>([^<]+)<\/span>/g)].map(m => m[1]), ['Тренировки', 'Прогресс', 'История', 'Тело', 'Профиль']);
});

test('D-251: no «Программа / Сменить» card on «Тренировки» (block and plain); it lives at the top of «Профиль» and opens the catalog', () => {
  const { run, app } = withProgram();
  let h = app();
  assert.match(h, /id="start"/);
  assert.doesNotMatch(h, /id="progrow"|id="pchg"|Сменить/);
  run('delete S.block;today(0)');
  assert.match(app(), /id="start"/);
  assert.doesNotMatch(app(), /id="progrow"|id="pchg"/);
  const m = read('app.js'), more = m.slice(m.indexOf('function more(){'), m.indexOf('function library(){'));
  assert.match(more, /app\.innerHTML=`\$\{S\.program&&S\.program\.length\?progRowHTML\(\):''\}/);
  assert.match(more, /progRowBind\(\)/);
  assert.doesNotMatch(read('blocks.js'), /progRowHTML/);
  run('app.innerHTML=progRowHTML();progRowBind()');
  assert.match(app(), new RegExp('<b>' + run('S.progName').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '</b></span><button class="sm" id="pchg">Сменить</button>'));
  run('$("#pchg").onclick()');
  assert.equal(run('view'), 'catalog');
  h = app();
  assert.ok(h.indexOf('data-c="') > 0 && h.indexOf('data-c="') < h.indexOf('id="toq"'));
  assert.match(h, /id="toq"[^>]*>🧩 Подобрать программу под себя</);
});

test('D-247: no program yet → «Тренировки» shows the catalog choice', () => {
  const r = boot();
  r.run('S.weightAsked=1;S.goal=null;S.program=null;go("today")');
  assert.equal(r.run('view'), 'catalog');
  assert.match(r.app(), /id="toq"/);
  r.run('S.goal="mass";S.program=[];go("today")');
  assert.match(r.app(), /id="toq"/);
});

test('D-247: no «✏️ Изменить» on the workouts tab; editDay still opens that workout in the program editor', () => {
  const { run, app } = withProgram();
  run('today()');
  assert.doesNotMatch(app(), /id="tedit"/);
  run('today(2)');
  let h = app();
  assert.doesNotMatch(h, /id="tedit"/);
  assert.match(h, /id="start"/);
  run('editDay(2)');
  assert.equal(run('view'), 'program');
  assert.equal(run('$("#title").textContent'), 'Изменить тренировку');
  h = app();
  assert.deepEqual([...h.matchAll(/data-pd="(\d+)"/g)].map(m => m[1]), ['2']);
  assert.match(h, / open data-pd="2"/);
  assert.match(h, /data-ad="2"/);
  assert.match(h, /data-e="2,0,sets"/);
  run('$("#pback").onclick()');
  assert.equal(run('view'), 'today');
  assert.equal(run('TSEL'), 2);
});

test('D-247: old route to the program tab still works (full program, back to «Тренировки»); quiz «Назад» → catalog', () => {
  const { run, app } = withProgram();
  run('go("program")');
  assert.equal(run('$("#title").textContent'), 'Программа');
  assert.equal((app().match(/data-pd="/g) || []).length, run('S.program.length'));
  assert.doesNotMatch(app(), /Почему программа построена так/);
  run('$("#pback").onclick()');
  assert.equal(run('view'), 'today');
  run('openQuestionnaire("catalog");$("#qback").onclick()');
  assert.equal(run('view'),'catalog');
  run('app.querySelector=sel=>sel==="#helpc"?document.querySelector(sel):null; app.querySelectorAll=sel=>sel==="p.mut"?[document.querySelector("#version")]:[]; openQuestionnaire("more");$("#qback").onclick()');
  assert.equal(run('view'),'more');
  assert.match(read('app.js'), /NAV_OF=\{program:'today',catalog:'more',quiz:'more',preview:'more',library:'more',science:'more'\}/);
});

test('D-247: «Ещё» has the exercise library and science; free users can still view the program', () => {
  const { run, app } = withProgram();
  const m = read('app.js'), more = m.slice(m.indexOf('function more(){'), m.indexOf('function library(){'));
  assert.match(more, /id="lib"[\s\S]*Библиотека упражнений/);
  assert.match(more, /id="sci"[^>]*>🔬 Научная основа программ</);
  assert.match(more, /\$\('#sci'\)\.onclick=\(\)=>go\('science'\);\$\('#lib'\)\.onclick=\(\)=>go\('library'\)/);
  run('can=()=>false;go("today")');
  assert.match(app(), /id="fprog"[^>]*>📋 Посмотреть программу</);
  assert.doesNotMatch(app(), /в разделе «Программа»/);
  run('$("#fprog").onclick()');
  assert.equal(run('view'), 'program');
});

test('D-247: new strings have EN in the dictionary; LV doc exists', () => {
  const d = read('i18n/dict3.js');
  for (const [ru, en] of [['Сменить', 'Change'], ['✏️ Изменить', '✏️ Edit'], ['Изменить тренировку', 'Edit workout'], ['← Тренировки', '← Workouts'], ['📋 Посмотреть программу', '📋 View program']])
    assert.ok(d.includes(`['${ru}','${en}',`), ru);
  assert.ok(fs.existsSync(path.join(root, 'docs/LV-NEW-NO-PROGRAM-TAB.md')));
});

test('D-248: «Ещё» → «Профиль» 👤; library + science in the «Справка» block at the bottom; hints point to «Профиль»', () => {
  assert.match(read('index.html'), /<button data-v="more">👤<span>Профиль<\/span><\/button>/);
  const m = read('app.js'), more = m.slice(m.indexOf('function more(){'), m.indexOf('function library(){'));
  assert.match(more, /\$\('#title'\)\.textContent='Профиль'/);
  const help = more.indexOf('id="helpc"><b>Справка</b>');
  assert.ok(help > more.indexOf('id="reset"') && help < more.indexOf('id="lib"') && more.indexOf('id="lib"') < more.indexOf('id="sci"') && more.indexOf('id="sci"') < more.indexOf('Версия ${appVersionLabel()}'));
  assert.match(read('features.js'), /\(app\.querySelector\('#helpc'\)\|\|ver\)\.insertAdjacentHTML\('beforebegin',html\)/);
  const d = read('i18n/dict3.js');
  assert.ok(d.includes("['Профиль','Profile','Profils']") && d.includes("['Справка','Help & info','Uzziņas']"));
  assert.ok(d.includes("'Iesildīšanās un atdzišana'") && !d.includes('atsildīšanās'));
  for (const f of ['app.js', 'health.js', 'i18n/dict2.js', 'i18n/dict3.js', 'legal.js', 'privacy.html']) assert.doesNotMatch(read(f), /в «Ещё»|“More”|“Vēl”/, f);
  assert.doesNotMatch(read('features.js'), /в «Ещё»\./);
  assert.ok(fs.existsSync(path.join(root, 'docs/LV-NEW-PROFILE-TAB.md')));
});

test('D-252: «Звук и экран» has the two toggles and no iPhone silent-mode hint (all languages)', () => {
  const m = read('app.js'), more = m.slice(m.indexOf('function more(){'), m.indexOf('function library(){'));
  assert.match(more, /<b>Звук и экран<\/b>\s*<label class="li"><span class="grow">🔊 Звуковой сигнал таймера<\/span><input type="checkbox" id="snd"[^]*?<label class="li"><span class="grow">💡 Не гасить экран во время тренировки<\/span><input type="checkbox" id="wk"[^>]*><\/label><\/div>/);
  for (const f of ['app.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'notify.js', 'exscreen.js', 'index.html'])
    assert.doesNotMatch(read(f), /беззвучный режим|silent mode|kluso režīmu/, f);
});
