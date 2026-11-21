'use strict';
// Section 3 LV decisions: count forms, day names without «diena», «Sastādīt savu programmu».
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

function lvTreninWord() {
  const src = read('i18n/i18n.js');
  const m = src.match(/function lvTreninWord\(n\)\{[^}]+\}/);
  assert.ok(m, 'lvTreninWord in i18n.js');
  return vm.runInNewContext(m[0] + ';lvTreninWord');
}

test('D-267: LV count word — treniņš / treniņi / treniņu', () => {
  const fn = lvTreninWord();
  const expect = {
    1: 'treniņš', 21: 'treniņš', 31: 'treniņš', 101: 'treniņš',
    2: 'treniņi', 3: 'treniņi', 5: 'treniņi', 9: 'treniņi', 22: 'treniņi', 24: 'treniņi',
    10: 'treniņu', 11: 'treniņu', 12: 'treniņu', 19: 'treniņu', 20: 'treniņu',
    30: 'treniņu', 100: 'treniņu', 110: 'treniņu', 111: 'treniņu'
  };
  for (const [n, w] of Object.entries(expect)) assert.equal(fn(+n), w, n);
  assert.match(read('app.js'), /lvTreninWord\(wk\[w\]\.length\)/);
});

test('D-267: LV day names without «diena»; button Sastādīt savu programmu', () => {
  const d = read('i18n/dict.js') + read('i18n/dict3.js');
  const want = [
    ['Фулбоди A', 'Visa ķermeņa A'],
    ['Фулбоди B', 'Visa ķermeņa B'],
    ['Фулбоди C', 'Visa ķermeņa C'],
    ['Верх A', 'Augšdaļas A'],
    ['Низ A', 'Apakšdaļas A'],
    ['Верх B', 'Augšdaļas B'],
    ['Низ B', 'Apakšdaļas B'],
    ['Жимовая A', 'Spiešanas A'],
    ['Жимовая B', 'Spiešanas B'],
    ['Тяговая A', 'Vilkšanas A'],
    ['Тяговая B', 'Vilkšanas B'],
    ['Верх тела A', 'Ķermeņa augšdaļas A'],
    ['Верх тела B', 'Ķermeņa augšdaļas B'],
    ['Низ тела A', 'Ķermeņa apakšdaļas A'],
    ['Низ тела B', 'Ķermeņa apakšdaļas B'],
    ['Всё тело A', 'Visa ķermeņa A'],
    ['Всё тело B', 'Visa ķermeņa B'],
    ['Всё тело C', 'Visa ķermeņa C'],
    ['Ноги A', 'Kāju A'],
    ['Ноги B', 'Kāju B'],
  ];
  for (const [ru, lv] of want) {
    assert.ok(d.includes("'" + ru + "'") && d.includes("'" + lv + "'"), ru + ' → ' + lv);
    assert.equal(d.includes("'" + ru + "','") || d.includes("['" + ru + "'"), true);
  }
  // no «diena» on these lettered titles
  for (const lv of ['Spiešanas A', 'Vilkšanas A', 'Ķermeņa augšdaļas A', 'Visa ķermeņa A', 'Kāju A']) {
    assert.equal(d.includes(lv + " diena") || d.includes('diena ' + lv), false, lv);
  }
  assert.match(d, /\['🧩 Подобрать программу самому','🧩 Build my own program','🧩 Sastādīt savu programmu'\]/);
  assert.equal(d.includes('🧩 Izveidot programmu pašam'), false);
  assert.match(read('cache-ver.js'), /var SW_CACHE='moyzal-v137'/);
  assert.match(read('sw.js'), /const C=SW_CACHE/);
  // place.js warmup cues: atsildīšanā → iesildīšanās laikā (D-268)
  assert.doesNotMatch(read('place.js'), /atsildīšanā/);
  assert.match(read('place.js'), /iesildīšanās laikā/);
});
