'use strict';
// P-306: CSV export of the workout history (always free, offline, guests too).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, 'csv.js'), 'utf8'), ctx);
const run = c => vm.runInContext(c, ctx);
const csv = (w, names, cardio) => { ctx.W = w; ctx.N = names || {}; ctx.C = cardio || []; return run('workoutsCsv(W, id => N[id] || id, null, id => C.includes(id))'); };
const HEAD = 'Дата;Тренировка;Упражнение;ID упражнения;Подход;Вес, кг;Повторы;Секунды;Уровень/км;Минуты;Оценка;Боль;Заметки';

test('empty history: BOM + header only', () => {
  for (const w of [[], undefined, null]) assert.equal(csv(w), '\uFEFF' + HEAD + '\r\n');
});

test('one row per set; Cyrillic, decimals with comma, rating, pain, notes', () => {
  const start = new Date(2026, 10, 14, 9, 5).getTime();
  const out = csv([{ id: 'w1', start, end: start + 3600e3, dayName: 'День А', notes: 'Хорошо', items: [
    { exId: 'bp', feel: 'hard', pain: true, sets: [{ w: 62.5, r: 8, done: true }, { w: 60, r: 10, done: true }] },
    { exId: 'mk-front-plank', sec: 1, sets: [{ w: '', r: 45, done: true }] },
    { exId: 'bike', sets: [{ w: 5, r: 12, done: true }] }
  ] }], { bp: 'Жим лёжа', 'mk-front-plank': 'Планка', bike: 'Велотренажёр' }, ['bike']);
  assert.ok(out.startsWith('\uFEFF'));
  const L = out.slice(1).split('\r\n');
  assert.equal(L[0], HEAD);
  assert.equal(L[1], '2026-11-14 09:05;День А;Жим лёжа;bp;1;62,5;8;;;;тяжело;да;Хорошо');
  assert.equal(L[2], '2026-11-14 09:05;День А;Жим лёжа;bp;2;60;10;;;;тяжело;да;Хорошо');
  assert.equal(L[3], '2026-11-14 09:05;День А;Планка;mk-front-plank;1;;;45;;;;;Хорошо');
  assert.equal(L[4], '2026-11-14 09:05;День А;Велотренажёр;bike;1;;;;5;12;;;Хорошо');
  assert.equal(L.length, 6); // trailing CRLF
  for (const l of L.slice(0, 5)) assert.equal(l.split(';').length, 13);
});

test('escaping: separator, quotes, newlines, formula injection', () => {
  const out = csv([{ id: 'w', start: 0, dayName: '=HYPERLINK("x")', notes: 'a;b "c"\nd', items: [{ exId: 'x', sets: [{ w: 1, r: 1, done: true }] }] }], { x: '-Тяга, широко' });
  const row = out.slice(1).split('\r\n').slice(1).join('\r\n');
  assert.match(row, /;"'=HYPERLINK\(""x""\)";/);
  assert.match(row, /;'-Тяга, широко;|;"'-Тяга, широко";/);
  assert.ok(row.includes('"a;b ""c""\nd"'));
});

test('history is not modified and sorted by date; undone sets skipped', () => {
  const W = [{ id: 'b', start: 2e12, items: [{ exId: 'q', sets: [{ w: 1, r: 1, done: false }, { w: 2, r: 2, done: true }] }] }, { id: 'a', start: 1e12, items: [{ exId: 'p', sets: [{ w: 3, r: 3, done: true }] }] }];
  const before = JSON.stringify(W);
  const L = csv(W).slice(1).split('\r\n');
  assert.equal(JSON.stringify(W), before);
  assert.equal(L[1].split(';')[3], 'p');
  assert.equal(L[2].split(';')[3], 'q');
  assert.equal(L[2].split(';')[5], '2');
  assert.equal(L.length, 4);
});

test('CSV export is wired in «Ещё», never gated, precached for offline', () => {
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const prem = fs.readFileSync(path.join(root, 'premium.js'), 'utf8');
  assert.match(app, /id="expcsv"/);
  assert.match(app, /\$\('#expcsv'\)\.onclick=\(\)=>\{if\(typeof exportCsv==='function'\)exportCsv\(\)\}/);
  assert.match(sw, /'csv\.js'/);
  assert.match(html, /<script src="csv\.js"><\/script>/);
  assert.match(prem, /exportCsv:'free'/);
});
