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
      documentElement: {lang: 'ru'}, title: '', body: {append(){}, style: {}},
      querySelector(sel){ const m = /^#([\w-]+)/.exec(sel || ''); return el(m ? m[1] : ''); },
      querySelectorAll(){ return []; }, addEventListener(){}, createElement(){ return el(); }
    }
  };
  g.window = g; g.globalThis = g; g.self = g;
  const ctx = vm.createContext(g);
  const files = ['alt.js','i18n/dict.js','i18n/dict2.js','i18n/dict3.js','i18n/i18n.js','app.js','tech.js','lib.js','i18n/lib.en.js','i18n/lib.lv.js','i18n/tech.en.js','i18n/tech.lv.js','cards.js','warm.js','cd.js','place.js','prog.js','plan.js'];
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, {filename: f});
  ctx.__nodes = nodes;
  return ctx;
}

const ctx = boot();
const run = code => vm.runInContext(code, ctx);
const plan = a => run('planFromTemplate(' + JSON.stringify(a) + ')');
const ids = new Set(run('EX.map(e => e.id)'));
const E = run('LIB_ONLY');

test('packed programs cover every goal, level, days and place', () => {
  const keys = run('Object.keys(PROG.T)');
  assert.equal(keys.length, 180);
  const goals = ['mass','str','loss','fit'], levels = ['nov','mid','adv'], places = ['g','d','b'];
  for (const goal of goals) for (const level of levels) for (const days of [2,3,4,5,6]) for (const place of places) {
    assert.equal(keys.includes(goal + '_' + level + '_' + days + '_' + place), true);
  }
});

test('every template id exists and every duration stays within the chosen time', () => {
  const goals = ['mass','str','loss','fit'], levels = ['nov','mid','adv'], places = ['g','d','b'], lens = [30,45,60,75,90];
  const shorter = [];
  for (const goal of goals) for (const level of levels) for (const days of [2,3,4,5,6]) for (const place of places) for (const len of lens) {
    const p = plan({goal, level, days, len, place, sex: 'm', prio: [], lim: []});
    assert.ok(p, goal + level + days + place);
    assert.equal(p.days.length, days);
    if (p.shorter) shorter.push(goal + '_' + level + '_' + days + '_' + place + ' ' + len);
    for (const d of p.days) {
      assert.ok(d.est <= len + 0.05, d.est + ' > ' + len);
      assert.ok(d.wu && d.wu.mob && d.cd && d.cd.stretch);
      assert.ok(d.items.length >= 2);
      for (const it of d.items) {
        assert.equal(ids.has(it.exId), true, it.exId);
        assert.equal(E.has(it.exId), false, it.exId);
      }
      for (const m of d.wu.mob) assert.equal(ids.has(m.id), true, m.id);
      for (const m of d.cd.stretch) assert.equal(ids.has(m.id), true, m.id);
    }
  }
  assert.equal(shorter.length, 31); // v1.2c: shorter_than_selected in programs.json
});

test('sample days include the trainer warm-up and cool-down', () => {
  const mass = plan({goal: 'mass', level: 'mid', days: 4, len: 60, place: 'g', sex: 'm', prio: [], lim: []});
  const d = mass.days[0];
  assert.equal(d.name, 'Верх A');
  assert.equal(Array.from(d.items, i => i.exId).join(','), 'bp,row,dsp,pull,lr,bc');
  assert.equal(mass.timeLabel, '≈54–57 мин');
  assert.equal(d.wu.cardio.id, 'mk-rowing-machine-steady-state');
  assert.equal(Array.from(d.wu.mob, m => m.id).join(','), 'mk-arm-circles-front-back,mk-cat-camel,mk-broomstick-pass-throughs,w_scpull');
  assert.equal(d.wu.ramp[0].exId, 'bp');
  assert.equal(d.cd.cardio.id, 'mk-indoor-cycling-spin');
  assert.equal(Array.from(d.cd.stretch, m => m.id).join(','), 'chest-wall-stretch,dead-hang,shoulder-rolls');
  const loss = plan({goal: 'loss', level: 'nov', days: 3, len: 30, place: 'd', sex: 'm', prio: [], lim: []});
  const e = loss.days[0];
  assert.equal(e.name, 'Фулбоди A');
  assert.equal(Array.from(e.items, i => i.exId).join(','), 'gsq,dbp,dbr,jump');
  assert.equal(e.items[3].max, 8);
  assert.equal(e.wu.cardio.id, 'jump');
  assert.equal(e.wu.mob.length, 3);
  assert.equal(e.cd.cardio, null);
  assert.match(e.cd.note, /заминки/);
  assert.equal(Array.from(e.cd.stretch, m => m.id).join(','), 'hamstring-sweep');
  const nov = plan({goal: 'fit', level: 'nov', days: 5, len: 90, place: 'g', sex: 'f', prio: [], lim: []});
  assert.match(nov.advice, /3–4/);
  assert.equal(nov.shorter, false); // v1.2c: fit_nov_5_g at 90 min is no longer shorter
});

test('cool-down cards are in the library without video', () => {
  for (const id of ['cd_lat','cd_quad','cd_xbody','cd_breath']) {
    assert.equal(ids.has(id), true);
    assert.equal(run('TECH["' + id + '"][0].length >= 3'), true);
    assert.equal(run('NO_ANIM.has("' + id + '")'), true);
    assert.equal(run('hasAnim("' + id + '")'), false);
    assert.equal(run('exBy("' + id + '").group'), 'Заминка');
  }
});

test('preview and today show warm-up and cool-down for a new plan only', () => {
  const gen = run('generate(' + JSON.stringify({goal:'mass',level:'mid',days:4,len:60,place:'g',sex:'m',prio:[],lim:[]}) + ')');
  ctx.PV = {pr: {name: 'Тест', desc: 'd', a: {goal:'mass',level:'mid',days:4,len:60,place:'g',sex:'m',prio:[],lim:[]}}, back: 'quiz', gen};
  // PV is lexical; assign inside the vm.
  run('PV={pr:{name:"Тест",desc:"d",a:{goal:"mass",level:"mid",days:4,len:60,place:"g",sex:"m",prio:[],lim:[]}},back:"quiz",gen:generate({goal:"mass",level:"mid",days:4,len:60,place:"g",sex:"m",prio:[],lim:[]})}');
  run('renderPreview()');
  const html = ctx.__nodes.get('app').innerHTML;
  assert.match(html, /Разминка/);
  assert.match(html, /Заминка/);
  assert.match(html, /≈54–57 мин/);
  assert.match(html, /Жим штанги лёжа/);
  run('S.goal="mass";S.days=4;S.prof={goal:"mass",level:"mid",days:4,len:60,place:"g",sex:"m",prio:[],lim:[]};S.program=PV.gen.days;S.next=0;S.workouts=[];today(0)');
  const today = ctx.__nodes.get('app').innerHTML;
  assert.match(today, /Разминка/);
  assert.match(today, /Заминка/);
  assert.match(today, /Растяжка груди и плеча у стены/);
});
