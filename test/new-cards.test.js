'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const OLD = [
  'bp','dbp','ibp','idb','fly','mk-cable-pec-fly','mk-parralel-bar-dips','pu',
  'mk-barbell-deadlift','pull','lat','row','dbr','cr','hyp','mk-dumbbell-shrug',
  'sq','fsq','lp','rdl','lun','bss','le','lc','ht','mk-standing-calf-raise-machine','gsq',
  'ohp','dsp','lr','mk-dumbbell-rear-delt-fly','mk-cable-seated-rope-face-pull','mk-barbell-upright-row',
  'bc','dbc','hc','mk-ez-bar-preacher-curl',
  'cgb','mk-cable-bar-pushdown','mk-ez-bar-skullcrusher','mk-dumbbell-seated-overhead-tricep-extension',
  'mk-front-plank','mk-crunches','mk-hanging-knee-raises','mk-rkc-plank','rt',
  'mk-treadmill-run','mk-indoor-cycling-spin','mk-elliptical','mk-rowing-machine-steady-state','stair',
  'bwsq','mk-dumbbell-step-up-low','mk-dumbbell-stiff-leg-deadlift','inv','chin','ppu','bd','mk-diamond-push-ups','mch','dbug','bdog','mk-prone-y-t-raises','nlc','sglb','bpl','jump','mk-incline-treadmill-walk',
  'mk-walking-knee-hugs','w_hip','w_legsw','w_glb','mk-hip-hinge-drill','mk-arm-circles-front-back','mk-broomstick-pass-throughs','mk-band-high-face-pull','mk-cat-camel','w_scpull','mk-band-row'
];

function el(){
  return {innerHTML:'', textContent:'', className:'', style:{}, dataset:{},
    classList:{toggle(){},add(){},remove(){}}, append(){}, addEventListener(){},
    querySelector(){return null}, querySelectorAll(){return []}, setAttribute(){}, getAttribute(){return null}, closest(){return null}};
}
function boot(){
  const g = {
    console, setTimeout, clearTimeout, setInterval(){return 0}, clearInterval(){}, URL, Blob, navigator:{language:'ru',languages:['ru']},
    localStorage:{getItem(){return null}, setItem(){}},
    location:{href:'http://127.0.0.1/', origin:'http://127.0.0.1', pathname:'/'},
    document:{
      documentElement:{lang:'ru'}, title:'', body:{append(){}, style:{}},
      querySelector(){return el()}, querySelectorAll(){return []},
      addEventListener(){}, createElement(){return el()}
    }
  };
  g.window = g; g.globalThis = g; g.self = g;
  const ctx = vm.createContext(g);
  const files = ['i18n/dict.js','i18n/dict2.js','i18n/dict3.js','i18n/i18n.js','app.js','tech.js','lib.js','i18n/lib.en.js','i18n/lib.lv.js','i18n/tech.en.js','i18n/tech.lv.js','cards.js','warm.js'];
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'), ctx, {filename:f});
  return ctx;
}

const ctx = boot();
const get = name => vm.runInContext(name, ctx);
const NEW_CARDS = get('NEW_CARDS');
const EX = get('EX');
const LIB = get('LIB'), LIB_EN = get('LIB_EN'), LIB_LV = get('LIB_LV');
const TECH = get('TECH'), TECH_EN = get('TECH_EN'), TECH_LV = get('TECH_LV');
const DICT = get('DICT');
const NO_ANIM = get('NO_ANIM');
const E = get('LIB_ONLY');
const SLOT = get('SLOT');
const EXTRA_CARDIO = get('EXTRA_CARDIO');
const FINISHER = get('FINISHER');
const NEW = NEW_CARDS.map(c => c.id);

test('93 new ids are present, unique, and do not collide with the old 80', () => {
  assert.equal(NEW.length, 93);
  assert.equal(new Set(NEW).size, 93);
  assert.equal(NEW.includes('mch-incline'), true);
  assert.equal(NEW.includes('smith-inverted-row'), false);
  for (const id of OLD) {
    assert.equal(NEW.includes(id), false, id);
    assert.ok(EX.some(e => e.id === id), 'missing old '+id);
  }
  assert.equal(EX.filter(e => e.id === 'mch').length, 1);
});

test('each new card has RU/EN/LV name and steps and no service fields', () => {
  const banned = /для ролика|в ролике|клип|\b3D\b|подсвет|нет в приложении|app_id_label/i;
  const latin = /[A-Za-z]{2,}/;
  const service = ['note','camera','model','prompt','en','app_id_label'];
  for (const c of NEW_CARDS) {
    assert.equal(typeof c.name, 'string');
    assert.ok(c.name.length > 1);
    assert.ok(c.nameEn && c.nameLv);
    assert.ok(Array.isArray(c.tech[0]) && c.tech[0].length >= 3, c.id+' ru steps');
    assert.ok(Array.isArray(c.techEn[0]) && c.techEn[0].length === c.tech[0].length, c.id+' en steps');
    assert.ok(Array.isArray(c.techLv[0]) && c.techLv[0].length === c.tech[0].length, c.id+' lv steps');
    assert.ok(LIB[c.id] && LIB_EN[c.id] && LIB_LV[c.id]);
    assert.ok(TECH[c.id] && TECH_EN[c.id] && TECH_LV[c.id]);
    assert.equal(DICT.some(r => r[0] === c.name && r[1] && r[2]), true, 'dict '+c.id);
    const ru = [c.name, ...c.lib, ...c.tech[0], ...c.tech[1], c.tech[2]].join('\n');
    assert.equal(latin.test(ru), false, c.id+' '+ru.match(latin));
    assert.equal(banned.test(ru), false, c.id);
    for (const k of service) assert.equal(Object.prototype.hasOwnProperty.call(c, k), false);
    assert.equal(NO_ANIM.has(c.id), true);
    assert.equal(get('hasAnim')(c.id), false);
  }
  assert.equal(NO_ANIM.has('bp'), false);
  assert.equal(NO_ANIM.has('mch'), false);
  assert.equal(get('hasAnim')('mk-barbell-deadlift'), true);
  assert.equal(EX.some(e => e.id === 'w_scpu' || e.id === 'dl'), false);
});

test('library-only cards never land in working sets or the warm-up block', () => {
  const goals = ['mass','str','loss','fit'];
  const levels = ['nov','mid','adv'];
  const days = [2,3,4,5,6];
  const places = ['g','d','b'];
  const lims = [[],['s'],['k'],['p'],['s','k','p']];
  const prios = [[],['Грудь','Спина','Ноги','Плечи','Бицепс','Трицепс','Пресс','Ягодицы']];
  for (const goal of goals) for (const level of levels) for (const d of days) for (const place of places) for (const lim of lims) for (const prio of prios) {
    for (const gear of [undefined, ['sled']]) {
      const gen = get('generate')({goal, level, days:d, len:90, place, lim, prio, sex:'m', gear});
      for (const day of gen.days) {
        for (const it of day.items) assert.equal(E.has(it.exId), false, it.exId+' in '+goal+level+place+d);
        const w = get('warmPlan')(day, {goal, level, days:d, len:90, place, lim, prio});
        for (const m of w.mob) assert.equal(E.has(m) || E.has('w_'+m), false);
        if (w.main) assert.equal(E.has(w.main), false);
      }
    }
  }
});

test('section E ids are not in auto-program pools and D ids are', () => {
  const pools = new Set();
  for (const slot of Object.values(SLOT)) for (const list of slot) for (const id of list) pools.add(id);
  for (const id of EXTRA_CARDIO) pools.add(id);
  for (const id of FINISHER) pools.add(id);
  for (const id of E) assert.equal(pools.has(id), false, id);
  const d = NEW.filter(id => !E.has(id));
  assert.equal(d.length, 60);
  for (const id of d) assert.equal(pools.has(id), true, 'not pooled '+id);
});
