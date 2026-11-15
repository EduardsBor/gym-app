'use strict';
// D-217b ACSM v1.3: trainer programs v1.3 + progression rules v2, labels «ACSM 2009 + дополнения», saved programs and history untouched.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

function boot(stored, withFeatures) {
  const store = new Map();
  if (stored !== undefined) store.set('gym', JSON.stringify(stored));
  const nodes = new Map();
  function el(id) {
    if (id && nodes.has(id)) return nodes.get(id);
    const node = {
      id: id || '', innerHTML: '', textContent: '', className: '', value: '', style: {}, dataset: {},
      classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
      append() {}, addEventListener() {}, insertAdjacentHTML() {}, setAttribute() {}, getAttribute() { return null; }, closest() { return null; },
      querySelector() { return null; }, querySelectorAll() { return []; }
    };
    if (id) nodes.set(id, node);
    return node;
  }
  const g = {
    console, setTimeout, clearTimeout, setInterval() { return 0; }, clearInterval() {}, scrollTo() {}, scrollY: 0,
    URL, Blob, navigator: { language: 'ru', languages: ['ru'] },
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
    location: { href: 'http://127.0.0.1/', origin: 'http://127.0.0.1', pathname: '/' },
    document: {
      documentElement: { lang: 'ru' }, title: '', body: { append() {}, style: {} },
      querySelector(sel) { const m = /^#([\w-]+)/.exec(sel || ''); return el(m ? m[1] : ''); },
      querySelectorAll() { return []; }, addEventListener() {}, createElement() { return el(); }
    }
  };
  g.window = g; g.globalThis = g; g.self = g;
  const ctx = vm.createContext(g);
  const files = ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'place.js', 'prog.js', 'plan.js', 'movekit.js'];
  if (withFeatures) files.push('premium.js', 'features.js');
  files.push('progress.js', 'autow.js');
  for (const f of files) vm.runInContext(read(f), ctx, { filename: f });
  return { run: code => vm.runInContext(code, ctx), store };
}

const DAY = 864e5;
const arr = x => JSON.parse(JSON.stringify(x));
const A0 = { sex: 'm', days: 3, len: 60, place: 'g', prio: [], lim: [] };
const CORE = new Set(['sq', 'bp', 'dl', 'rdl', 'ohp', 'row', 'cr', 'fsq', 'ibp', 'dbp', 'gsq', 'pull', 'lp']);

test('PRM in app.js equals params.sets_reps_rest of programs.json v1.3 (PROG.Q)', () => {
  const b = boot(undefined);
  assert.deepEqual(arr(b.run('PRM')), arr(b.run('PROG.Q')));
  assert.deepEqual(arr(b.run('prmOf("str","nov").c')), [3, 8, 12, 150]);
  assert.deepEqual(arr(b.run('prmOf("str","adv").c')), [5, 3, 6, 180]);
  assert.deepEqual(arr(b.run('prmOf("mass","mid").c')).slice(1, 3), [6, 12]);
  for (const g of ['str', 'mass', 'loss', 'fit']) assert.ok(b.run(`prmOf("${g}","nov").c[1]`) >= 8, g); // novice: never heavy
});

test('generated programs: novice Strength 8–12 on compound lifts, advanced Strength 3–6, mass rest 1–2 min for novices', () => {
  const b = boot(undefined);
  const nov = arr(b.run(`generate(${JSON.stringify({ ...A0, goal: 'str', level: 'nov' })})`));
  const novCore = nov.days.flatMap(d => d.items).filter(i => CORE.has(i.exId) && i.exId !== 'pull');
  assert.ok(novCore.length >= 3);
  for (const it of novCore) assert.deepEqual([it.min, it.max], [8, 12], it.exId);
  const adv = arr(b.run(`generate(${JSON.stringify({ ...A0, goal: 'str', level: 'adv' })})`));
  const heavy = adv.days.flatMap(d => d.items).filter(i => i.min === 3 && i.max === 6);
  assert.ok(heavy.length >= 3, 'advanced strength has 3–6 on core lifts');
  assert.ok(heavy.every(i => i.rest === 180), 'advanced strength core rest 180 s');
  const all = adv.days.flatMap(d => d.items).concat(nov.days.flatMap(d => d.items));
  assert.ok(all.every(i => i.sec || i.min >= 3), 'no 1–2 rep sets');
  const mass = arr(b.run(`generate(${JSON.stringify({ ...A0, goal: 'mass', level: 'nov' })})`));
  for (const it of mass.days.flatMap(d => d.items).filter(i => CORE.has(i.exId) && i.exId !== 'pull')) assert.ok(it.rest <= 120, it.exId + ' ' + it.rest);
});

test('why-notes follow the new numbers; no %1RM for novices', () => {
  const b = boot(undefined);
  const why = a => arr(b.run(`generate(${JSON.stringify(a)}).why`)).map(x => x[0]).join('\n');
  const n = why({ ...A0, goal: 'str', level: 'nov' });
  assert.match(n, /Повторы 8–12 в базовых/);
  assert.match(n, /2 тренировки подряд/);
  assert.match(n, /~6–12 подходов/);
  assert.equal(/1ПМ|80%/.test(n), false);
  const a = why({ ...A0, goal: 'str', level: 'adv' });
  assert.match(a, /Повторы 3–6 в базовых/);
  assert.match(a, /10–20 подходов/);
  assert.equal(/2,5–5%/.test(a), false);
});

test('labels: «ACSM 2009 + дополнения» in tech/lib and RU/EN/LV, no NSCA anywhere in the app', () => {
  for (const f of ['tech.js', 'lib.js']) assert.match(read(f), /Общие рекомендации по технике \(ACSM 2009 \+ дополнения\)/, f);
  const d = read('i18n/dict.js');
  assert.ok(d.includes('ACSM 2009 + additions'));
  assert.ok(d.includes('ACSM 2009 + papildinājumi'));
  const files = fs.readdirSync(root).filter(f => /\.(js|html|json)$/.test(f) && f !== 'package-lock.json')
    .concat(fs.readdirSync(path.join(root, 'i18n')).map(f => 'i18n/' + f), ['test/fixtures/progression-rules.json']);
  for (const f of files) assert.equal(/nsca/i.test(read(f)), false, f);
  assert.equal(JSON.parse(read('test/fixtures/progression-rules.json')).label, 'ACSM 2009 + дополнения');
});

test('existing saved program, why-notes, history and auto-weight state stay unchanged on load', () => {
  const old = {
    lang: 'ru', goal: 'str', days: 2, next: 1, planV12c: 1, progName: 'Моя программа: Сила',
    prof: { goal: 'str', sex: 'm', level: 'nov', days: 2, len: 60, place: 'g', prio: [], lim: [] },
    program: [
      { name: 'Фулбоди A', items: [{ exId: 'sq', sets: 3, min: 3, max: 6, rest: 180 }, { exId: 'bp', sets: 3, min: 3, max: 6, rest: 180 }, { exId: 'lr', sets: 2, min: 6, max: 10, rest: 120 }] },
      { name: 'Фулбоди B', items: [{ exId: 'rdl', sets: 3, min: 3, max: 6, rest: 180 }, { exId: 'mk-front-plank', sets: 3, min: 20, max: 45, rest: 60, sec: 1 }] }
    ],
    why: [['Повторы 3–6 в базовых и 6–10 в изолирующих, отдых 3 мин / 120 с: сила лучше растёт при весах >80% 1ПМ и длинном отдыхе.', ['l', 'a', 'r']]],
    pg: { bp: { st: { success: 0, miss: 1 }, next: { weight: 60, sets: 3, target: 3, note: 'miss1' }, first: 1, last: 2 } },
    workouts: [{ id: 'w1', start: Date.now() - 2 * DAY, end: Date.now() - DAY, dayIdx: 0, dayName: 'Фулбоди A', notes: '', items: [{ exId: 'bp', ns: 3, min: 3, max: 6, rest: 180, sets: [{ w: 60, r: 6, done: true }, { w: 60, r: 5, done: true }] }] }],
    custom: [], body: []
  };
  const b = boot(arr(old), true);
  for (const k of ['program', 'why', 'pg', 'workouts', 'prof', 'progName', 'next']) assert.deepEqual(arr(b.run('S.' + k)), old[k], k);
  b.run('save()');
  const stored = JSON.parse(b.store.get('gym'));
  for (const k of ['program', 'why', 'pg', 'prof']) assert.deepEqual(stored[k], old[k], 'stored ' + k);
  // A new program is only built when the user asks for it
  const fresh = arr(b.run(`generate(${JSON.stringify({ ...A0, goal: 'str', level: 'nov', days: 2 })})`));
  assert.ok(fresh.days[0].items.some(i => i.min === 8 && i.max === 12));
  assert.deepEqual(arr(b.run('S.program')), old.program);
});
