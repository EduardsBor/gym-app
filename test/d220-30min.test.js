'use strict';
// D-220 (C-111): 30-minute workouts. Strength mid/adv: no 30 min (-> 45); Mass mid/adv 30 min: "Express" note.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const NOTE = 'Экспресс: рост медленнее, для максимума — 45+ мин';
const MIN45 = 'Для «Силы» минимум 45 мин';

function boot(stored) {
  const data = new Map();
  if (stored) data.set('gym', JSON.stringify(stored));
  const ls = { getItem: k => data.has(k) ? data.get(k) : null, setItem: (k, v) => data.set(String(k), String(v)), removeItem: k => data.delete(k), key: i => [...data.keys()][i] ?? null, get length() { return data.size; } };
  const nodes = new Map();
  function el(id) {
    if (id && nodes.has(id)) return nodes.get(id);
    const node = {
      id: id || '', innerHTML: '', textContent: '', className: '', value: '', style: {}, dataset: {},
      classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
      append() {}, addEventListener() {}, insertAdjacentHTML() {}, setAttribute() {}, getAttribute() { return null; }, closest() { return null; },
      querySelector() { return null; }, querySelectorAll() { return []; }, focus() {}, scrollIntoView() {}
    };
    if (id) nodes.set(id, node);
    return node;
  }
  const g = {
    console, setTimeout() { return 0; }, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
    scrollTo() {}, crypto: crypto.webcrypto, addEventListener() {}, prompt() { return null; }, confirm() { return true; }, alert() {},
    URL, Blob, navigator: { language: 'ru', languages: ['ru'] }, localStorage: ls,
    location: { href: 'http://127.0.0.1/', origin: 'http://127.0.0.1', pathname: '/', search: '', reload() {} },
    document: {
      documentElement: { lang: 'ru' }, title: '', body: { append() {}, style: {} },
      querySelector(sel) { const m = /^#([\w-]+)/.exec(sel || ''); return el(m ? m[1] : ''); },
      querySelectorAll() { return []; }, addEventListener() {}, createElement() { return el(); }
    }
  };
  g.window = g; g.globalThis = g; g.self = g;
  const ctx = vm.createContext(g);
  const files = ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'place.js', 'prog.js', 'plan.js', 'csv.js', 'premium.js', 'features.js'];
  for (const f of files) vm.runInContext(read(f), ctx, { filename: f });
  return { run: code => vm.runInContext(code, ctx), store: data, el };
}
const J = v => JSON.parse(JSON.stringify(v));

test('packed C-111 data: Strength mid/adv have no 30 min (-> 45), Mass mid/adv have the Express note, others untouched', () => {
  const { run } = boot();
  const T = J(run('PROG.T')), V = J(run('PROG.V'));
  let fb = 0, nt = 0;
  for (const [k, t] of Object.entries(T)) {
    const [goal, level] = k.split('_');
    const ext = t[3] || {};
    if (goal === 'str' && level !== 'nov') {
      fb++; assert.deepEqual(ext.f, { 30: 45 }, k);
      for (const day of t[2]) for (const it of day[1]) assert.equal(+String(it[3]).padStart(5, '0')[0], 0, k + ' still has sets at 30');
    } else assert.equal(ext.f, undefined, k);
    if (goal === 'mass' && level !== 'nov') { nt++; assert.equal(V[ext.n[30]], NOTE, k); }
    else assert.equal(ext.n, undefined, k);
  }
  assert.equal(fb, 30); assert.equal(nt, 30);
});

test('trainer file (if present) matches md5 685cf844 and the packed flags', { skip: !fs.existsSync('/workspace/acsm/programs-c111.json') }, () => {
  const raw = fs.readFileSync('/workspace/acsm/programs-c111.json');
  assert.match(crypto.createHash('md5').update(raw).digest('hex'), /^685cf844/);
  const d = JSON.parse(raw);
  const { run } = boot();
  const T = J(run('PROG.T'));
  for (const [k, t] of Object.entries(d.templates)) {
    assert.deepEqual((T[k][3] || {}).f || {}, t.duration_fallback, k);
    assert.equal(Object.keys((T[k][3] || {}).n || {}).join(), Object.keys(t.duration_notes).join(), k);
    assert.deepEqual(t.durations_available, k.startsWith('str_') && !k.startsWith('str_nov') ? [45, 60, 75, 90] : [30, 45, 60, 75, 90]);
  }
});

test('new Strength mid/adv program with 30 min is built as 45; novice Strength and Mass mid keep 30', () => {
  const { run } = boot();
  const P = a => J(run('planFromTemplate(' + JSON.stringify({ sex: 'm', prio: [], lim: [], ...a }) + ')'));
  for (const level of ['mid', 'adv']) for (const place of ['g', 'd', 'b']) {
    const a = { goal: 'str', level, days: 3, place };
    assert.deepEqual(P({ ...a, len: 30 }), P({ ...a, len: 45 }));
    assert.equal(run('effLen(' + JSON.stringify({ ...a, len: 30 }) + ')'), 45);
    assert.equal(run('generate(' + JSON.stringify({ ...a, len: 30 }) + ').days.every(d=>d.items.length>=2)'), true);
  }
  const nov = P({ goal: 'str', level: 'nov', days: 3, place: 'g', len: 30 });
  assert.ok(nov.days.every(d => d.items.length >= 2 && d.est <= 30.05));
  assert.notDeepEqual(nov, P({ goal: 'str', level: 'nov', days: 3, place: 'g', len: 45 }));
  assert.equal(run('effLen({goal:"str",level:"nov",days:3,place:"g",len:30})'), 30);
  const mass = P({ goal: 'mass', level: 'mid', days: 3, place: 'g', len: 30 });
  assert.ok(mass.days.every(d => d.items.length >= 2 && d.est <= 30.05));
  assert.equal(run('lenNote({goal:"mass",level:"mid",days:3,place:"g"},30)'), NOTE);
  assert.equal(run('lenNote({goal:"mass",level:"mid",days:3,place:"g"},45)'), '');
  assert.equal(run('lenNote({goal:"mass",level:"nov",days:3,place:"g"},30)'), '');
});

test('quiz: Strength advanced hides 30 min, auto-uses 45 and shows the note; Mass mid 30 shows the Express label', () => {
  const b = boot({ lang: 'ru', goal: 'mass', days: 3, next: 0, obDone: 1, workouts: [], custom: [], body: [] });
  b.run('localStorage.setItem("gc_blocks","0")'); // C-112: blocks show a fixed 60–70 min; the old length picker is behind gc_blocks=0
  b.run('Q={goal:"str",sex:"m",level:"adv",days:4,len:30,place:"g",prio:[],lim:[]};quiz()');
  let html = b.run('app.innerHTML');
  assert.equal(b.run('Q.len'), 45);
  assert.doesNotMatch(html, /data-k="len" data-v="30"/);
  assert.match(html, /data-k="len" data-v="45"/);
  assert.ok(html.includes(MIN45));
  b.run('Q={goal:"mass",sex:"m",level:"mid",days:3,len:30,place:"g",prio:[],lim:[]};quiz()');
  html = b.run('app.innerHTML');
  assert.equal(b.run('Q.len'), 30);
  assert.match(html, /data-k="len" data-v="30"/);
  assert.ok(html.includes(NOTE));
  assert.ok(!html.includes(MIN45));
  b.run('Q={goal:"str",sex:"m",level:"nov",days:3,len:30,place:"g",prio:[],lim:[]};quiz()');
  html = b.run('app.innerHTML');
  assert.equal(b.run('Q.len'), 30);
  assert.match(html, /data-k="len" data-v="30"/);
  assert.ok(!html.includes(MIN45) && !html.includes(NOTE));
});

test('onboarding: Strength intermediate - 30 min is disabled with the note; recommendation never lands on 30', () => {
  const b = boot({ lang: 'ru', goal: 'str', days: 3, next: 0, workouts: [], custom: [], body: [] });
  b.run('OB={step:OBS.findIndex(x=>x[0]==="len"),goal:"str",level:"mid",days:6,place:"g",len:30,lenTouched:1};onb()');
  const html = b.run('app.innerHTML');
  assert.equal(b.run('OB.len'), 45);
  assert.doesNotMatch(html, /data-ob="30"/);
  assert.match(html, /disabled[^>]*><b>⏱ ~30 мин<\/b><br><span class="mut">Для «Силы» минимум 45 мин/);
  b.run('OB={step:OBS.findIndex(x=>x[0]==="len"),goal:"mass",level:"adv",days:3,place:"g",len:30,lenTouched:1};onb()');
  assert.ok(b.run('app.innerHTML').includes(NOTE));
  assert.equal(b.run('OB.len'), 30);
});

test('saved Strength 30-min program keeps working unchanged: opens, shows workouts, logs a workout', () => {
  const program = [
    { name: 'День A', items: [{ exId: 'sq', sets: 3, min: 3, max: 6, rest: 180 }, { exId: 'bp', sets: 2, min: 3, max: 6, rest: 180 }] },
    { name: 'День B', items: [{ exId: 'mk-barbell-deadlift', sets: 2, min: 3, max: 6, rest: 180 }, { exId: 'lat', sets: 2, min: 6, max: 10, rest: 120 }] }
  ];
  const prof = { goal: 'str', sex: 'm', level: 'adv', days: 2, len: 30, place: 'g', prio: [], lim: [] };
  const stored = { lang: 'ru', goal: 'str', days: 2, next: 0, schema: 4, obDone: 1, prof, program, progName: 'Сила 30', workouts: [], custom: [], body: [] };
  const b = boot(J(stored));
  assert.deepEqual(J(b.run('S.program')), program);
  assert.deepEqual(J(b.run('S.prof')), prof);
  b.run('go("program")');
  assert.ok(b.run('app.innerHTML').includes('30 мин'));
  b.run('go("today")');
  b.run('startW(0)');
  assert.deepEqual(J(b.run('S.active.items.map(i=>[i.exId,i.ns])')), [['sq', 3], ['bp', 2]]);
  b.run('S.active.items[0].sets[0].w=100;S.active.items[0].sets[0].done=true;workoutView();$("#fin").onclick()');
  assert.equal(b.run('S.workouts.length'), 1);
  assert.deepEqual(J(b.run('S.workouts[0].items.map(i=>i.exId)')), ['sq']);
  const saved = JSON.parse(b.store.get('gym'));
  assert.deepEqual(saved.program, program);
  assert.deepEqual(saved.prof, prof);
  assert.equal(saved.next, 1);
});

test('D-220: sw moyzal-v67, changelog, LV strings only in docs/LV-NEW-D220.md, no Helms/Refalo/Bell', () => {
  assert.match(read('sw.js'), /const C='moyzal-v81'/);
  assert.match(read('CHANGELOG.md'), /D-220/);
  const lv = read('docs/LV-NEW-D220.md');
  assert.ok(lv.includes(NOTE) && lv.includes(MIN45));
  assert.ok(!read('LV-REVIEW.md').includes(NOTE));
  for (const f of ['app.js', 'plan.js', 'features.js', 'tech.js', 'lib.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js']) assert.doesNotMatch(read(f), /Helms|Refalo|\bBell\b/, f);
});
