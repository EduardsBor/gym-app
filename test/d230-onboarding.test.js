'use strict';
// D-230: first run shows ready programs first; «Подобрать программу самому» opens the questionnaire; «Тренажёрный зал».
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
      append() {}, addEventListener() {}, insertAdjacentHTML() {}, setAttribute() {}, getAttribute() { return null; },
      closest() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; },
      onclick: null
    };
    if (id) nodes.set(id, node);
    return node;
  }
  const search = (opts && opts.search) || '';
  const g = {
    console, setTimeout, clearTimeout, setInterval() { return 0; }, clearInterval() {},
    URL, Blob, navigator: { language: 'ru', languages: ['ru'] },
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
    location: { href: 'http://127.0.0.1/' + search, origin: 'http://127.0.0.1', pathname: '/', search },
    document: {
      documentElement: { lang: 'ru' }, title: '', body: { append() {}, style: {} },
      querySelector(sel) { const m = /^#([\w-]+)/.exec(sel || ''); return el(m ? m[1] : ''); },
      querySelectorAll() { return []; }, addEventListener() {}, createElement() { return el(); }
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
  const files = ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'data/blocks-index.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'place.js', 'prog.js', 'plan.js', 'blocks.js', 'legal.js', 'premium.js', 'features.js'];
  for (const f of files) vm.runInContext(read(f), ctx, { filename: f });
  return { run: code => vm.runInContext(code, ctx), app: () => vm.runInContext('app.innerHTML', ctx) };
}

test('D-230: first run (no profile, no program) opens the ready-program catalog with a big «build my own» button', () => {
  const { run, app } = boot();
  run('S.goal=null;S.program=null;S.obDone=0;view="today";render()');
  assert.equal(run('view'), 'catalog');
  const h = app();
  assert.match(h, /id="catfirst"/);
  // D-234: own program only at the bottom, after all ready programs, as a secondary button
  assert.match(h, /class="full" id="toq"[^>]*>🧩 Подобрать программу под себя</);
  assert.ok(h.indexOf('id="toq"') > h.lastIndexOf('data-c="'));
  assert.equal((h.match(/id="toq/g) || []).length, 1);
  assert.match(h, /<h3 class="catn">/);
  assert.match(h, /Не нашёл подходящую\?<\/p><button class="full" id="toq"[^>]*>🧩 Подобрать программу под себя</); // D-236
  assert.doesNotMatch(h, /Ответьте на несколько вопросов|btncap/); // D-237
  assert.equal(run('CATALOG.length'), 13); // curated cards unchanged; «Дом с гантелями» hidden (Eduards 19.11)
  assert.equal((h.match(/data-c="c\d+"/g) || []).length, 13);
  assert.ok((h.match(/data-c="/g) || []).length === run('catalogCards().length'));
  assert.ok(run('catalogCards().length') > 13);
});

test('D-230: questionnaire from the first run can go back to the catalog; picking a program starts it', () => {
  const { run, app } = boot();
  run('S.goal=null;S.program=null;S.obDone=0;Q=null;view="quiz";quiz()');
  assert.match(app(), /id="qcat"[^>]*>← Готовые программы</);
  assert.match(app(), /id="tocat"/);
  run('preview(CATALOG[1],"catalog");S.program=null;PV.gen.days.length>0');
  run('this.confirm=()=>true;this.scrollTo=()=>{};this.save=()=>{};this.toast=()=>{};');
  run('document.querySelector("#pstart").onclick()');
  assert.equal(run('S.goal'), 'mass');
  assert.equal(run('S.progName'), run('CATALOG[1].name'));
  assert.ok(run('S.program.length') > 0);
  assert.equal(run('S.prof.level'), 'mid');
});

test('D-230: existing user with a program keeps the normal screens and old button', () => {
  const { run, app } = boot();
  run('S.goal="mass";S.days=4;S.program=[{name:"A",items:[]}];catalog()');
  assert.doesNotMatch(app(), /catfirst/);
  assert.match(app(), /Подобрать программу под себя/);
});

test('D-230: «Зал» → «Тренажёрный зал» with RU/EN/LV; LV follows D-216', () => {
  const { run } = boot();
  assert.equal(run('PLN.g'), 'Тренажёрный зал');
  assert.equal(run('EQN.g'), '🏢 Тренажёрный зал');
  assert.match(read('app.js'), /\['g','Тренажёрный зал'\]/);
  const d3 = read('i18n/dict3.js');
  assert.ok(d3.includes("['Тренажёрный зал','Gym','Trenažieru zāle']"));
  assert.ok(d3.includes("['🏢 Тренажёрный зал','🏢 Gym','🏢 Trenažieru zāle']"));
  const lv = read('docs/LV-NEW-ONBOARDING.md');
  assert.doesNotMatch(lv, /sērij/i);
  assert.doesNotMatch(lv.replace(/atspiedien|asinsspiedien/gi, ''), /spiedien/i);
});

test('D-230: home is bodyweight only — questionnaire has g and b, no d; catalog has no «Дом с гантелями»; d blocks stay', () => {
  const { run, app } = boot();
  run('S.goal=null;S.program=null;S.prof=null;Q={goal:"mass",sex:"m",level:"mid",days:4,len:70,place:"d",bar:"0",prio:[],lim:[]};quiz()');
  const h = app();
  const place=h.match(/<select[^>]*data-qfilter="place">([\s\S]*?)<\/select>/);
  assert.ok(place,'native equipment-place selector');
  assert.match(place[1], /<option value="g">Тренажёрный зал</);
  assert.match(place[1], /<option value="b" selected>Дом</);
  assert.doesNotMatch(place[1], /<option value="d"/);
  assert.equal(run('Q.place'), 'b');
  run('Q.place="b";quiz()');
  assert.match(app(), /Есть турник\?/);
  assert.ok(!run('CATALOG.some(c=>c.a.place==="d")'));
  run('catF={};catalog()');
  assert.doesNotMatch(app(), /data-fk="place" data-fv="d"/);
  // old profile with place d keeps working
  assert.equal(run('blockIdForProfile({goal:"mass",level:"mid",days:4,place:"d"})'), 'mass_mid_4_d_b36');
  assert.ok(fs.existsSync(path.join(root, 'data/blocks/mass_mid_4_d_b36.json')));
  assert.equal(run('PLN.d'), 'Дом с гантелями');
});

test('questionnaire weight/age reload from independent state without changing the selected program or consent', () => {
  const prof={goal:'mass',sex:'f',level:'mid',days:3,len:70,place:'g',lim:['k']};
  const program=[{name:'My active plan',items:[]}];
  const initial={lang:'ru',goal:'mass',days:3,obDone:1,progName:'My active plan',prof,program,consentHealth:null,workouts:[],custom:[],templates:[],body:[]};
  const b=boot({ls:{gym:JSON.stringify(initial)}});
  b.run('this.scrollTo=()=>{};openQuestionnaire("catalog");$("#bwkg").value="77.3";$("#bwkg").onchange({target:$("#bwkg")});$("#agey").value="42";$("#agey").onchange({target:$("#agey")});');
  const persisted=b.run('localStorage.getItem("gym")'), saved=JSON.parse(persisted);
  assert.equal(saved.weightKg,77.3);
  assert.equal(saved.age,42);
  assert.equal(saved.prof.weightKg,undefined);
  assert.equal(saved.prof.age,undefined);
  assert.deepEqual(saved.program,program);
  assert.equal(saved.consentHealth,null);
  const after=boot({ls:{gym:persisted}});
  after.run('this.scrollTo=()=>{};openQuestionnaire("catalog")');
  assert.match(after.app(),/id="bwkg"[^>]*value="77.3"/);
  assert.match(after.app(),/id="agey"[^>]*value="42"/);
  assert.equal(after.run('Q.sex'),'f');
  assert.equal(after.run('Q.lim.includes("k")'),true);
});
