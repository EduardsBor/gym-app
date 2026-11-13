'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');

function boot(stored) {
  const nodes = new Map();
  function el(id) {
    if (id && nodes.has(id)) return nodes.get(id);
    const node = {
      id: id || '', innerHTML: '', textContent: '', className: '', value: '', style: {}, dataset: {},
      classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
      append() {}, addEventListener() {}, setAttribute() {}, getAttribute() { return null; }, closest() { return null; },
      querySelector() { return null; }, querySelectorAll() { return []; }
    };
    if (id) nodes.set(id, node);
    return node;
  }
  const saved = stored ? JSON.stringify(stored) : null;
  const mem = { gym: saved };
  const g = {
    console, setTimeout, clearTimeout, setInterval() { return 0; }, clearInterval() {},
    URL, Blob, navigator: { language: 'ru', languages: ['ru'] },
    localStorage: {
      getItem(k) { return mem[k] == null ? null : mem[k]; },
      setItem(k, v) { mem[k] = String(v); }
    },
    location: { href: 'http://127.0.0.1/', origin: 'http://127.0.0.1', pathname: '/' },
    document: {
      documentElement: { lang: 'ru' }, title: '', body: { append() {}, style: {} },
      querySelector(sel) { const m = /^#([\w-]+)/.exec(sel || ''); return el(m ? m[1] : ''); },
      querySelectorAll() { return []; }, addEventListener() {}, createElement() { return el(); }
    }
  };
  g.window = g; g.globalThis = g; g.self = g;
  const ctx = vm.createContext(g);
  const files = ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'prog.js', 'plan.js', 'movekit.js'];
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
  ctx.__nodes = nodes;
  ctx.__mem = mem;
  return ctx;
}

test('library and programs use the new deadlift, history keeps the old name', () => {
  const stored = {
    goal: 'mass', days: 4, next: 0, custom: [], body: [],
    prof: { goal: 'mass', sex: 'm', level: 'mid', days: 4, len: 60, place: 'g', prio: [], lim: [] },
    program: [{
      name: 'Тяга',
      items: [{ exId: 'dl', sets: 3, min: 5, max: 8, rest: 180 }, { exId: 'w_scpu', sets: 2, min: 8, max: 12, rest: 45 }],
      wu: { min: 8, cardio: { id: 'rowm', min: 3 }, mob: [{ id: 'w_armc', dose: '10' }, { id: 'w_scpu', dose: '8' }], ramp: [{ exId: 'dl', pct: 50, reps: '5' }] },
      cd: { cardio: { id: 'bike', min: 3 }, stretch: [] }
    }],
    workouts: [{ id: 'old1', start: 1, end: 2, dayName: 'Старая', notes: '', items: [{ exId: 'dl', sets: [{ w: 100, r: 5, done: true }] }] }]
  };
  const ctx = boot(stored);
  const run = code => vm.runInContext(code, ctx);
  assert.equal(run('EX.some(e => e.id === "dl" || e.id === "w_scpu")'), false);
  assert.equal(run('EX.some(e => e.id === "mk-barbell-deadlift")'), true);
  assert.equal(run('exBy("dl").name'), 'Становая тяга');
  assert.equal(run('exBy("w_scpu").name'), 'Отжимания лопатками');
  assert.equal(run('exBy("mk-barbell-deadlift").name'), 'Становая тяга со штангой');
  assert.equal(run('S.program[0].items.map(it => it.exId).join(",")'), 'mk-barbell-deadlift');
  assert.equal(run('S.program[0].wu.cardio.id'), 'mk-rowing-machine-steady-state');
  assert.equal(run('S.program[0].wu.mob.map(m => m.id).join(",")'), 'mk-arm-circles-front-back');
  assert.equal(run('S.program[0].wu.ramp[0].exId'), 'mk-barbell-deadlift');
  assert.equal(run('S.program[0].cd.cardio.id'), 'mk-indoor-cycling-spin');
  assert.equal(run('S.workouts[0].items[0].exId'), 'dl');
  run('showW("old1")');
  const html = ctx.__nodes.get('modal').innerHTML;
  assert.match(html, /Становая тяга/);
  assert.equal(html.includes('Становая тяга со штангой'), false);
  assert.equal(run('EX.filter(e => e.name === "Становая тяга" || e.id === "dl").length'), 0);
  const plan = run('planFromTemplate({goal:"mass",level:"mid",days:4,len:60,place:"g",sex:"m",prio:[],lim:[]})');
  assert.equal(plan.days[0].items.some(it => it.exId === 'dl' || it.exId === 'w_scpu'), false);
  assert.equal(plan.days[0].items.some(it => it.exId === 'mk-cable-bar-pushdown'), true);
  assert.equal(plan.days[0].wu.mob.some(m => m.id === 'w_scpu'), false);
  assert.match(run('animMedia("mk-barbell-deadlift")'), /data-mk="mk-barbell-deadlift"/);
  assert.equal(run('movekitFile("mk-barbell-deadlift")'), 'barbell-deadlift.mp4');
});

test('a second load does not rewrite history or an already migrated plan', () => {
  const ctx = boot(null);
  const run = code => vm.runInContext(code, ctx);
  run('S.program=[{name:"День",items:[{exId:"mk-barbell-deadlift",sets:1,min:5,max:5,rest:60}]}];S.workouts=[{id:"h",start:1,items:[{exId:"dl",sets:[{w:80,r:3,done:true}]}]}]');
  assert.equal(run('migrateLegacyPlans()'), false);
  assert.equal(run('S.workouts[0].items[0].exId'), 'dl');
  assert.equal(run('S.program[0].items[0].exId'), 'mk-barbell-deadlift');
});
