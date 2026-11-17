'use strict';
// B-410: approved privacy policy includes a Sentry section in RU/EN/LV; the old “not connected” line is gone.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

test('B-410: privacy policy has a Sentry section in RU, EN and LV; “Sentry не подключено” is absent', () => {
  const legal = read('legal.js');
  assert.match(legal, /<h4>3\.6\. Сбор ошибок \(Sentry\)<\/h4>/);
  assert.match(legal, /<h4>3\.6\. Crash reporting \(Sentry\)<\/h4>/);
  assert.match(legal, /<h4>3\.6\. Kļūdu vākšana \(Sentry\)<\/h4>/);
  assert.match(legal, /Functional Software, Inc\./);
  assert.equal(legal.includes('Sentry не подключено'), false);
  assert.equal(/Sentry сейчас не подключено|Sentry is not connected today|Sentry nav pieslēgts/i.test(legal), false);
});

test('B-410: sw is moyzal-v71; changelog mentions it; policy date is 17.11.2026', () => {
  assert.match(read('sw.js'), /const C='moyzal-v72'/);
  const log = read('CHANGELOG.md');
  assert.match(log, /B-410/);
  assert.match(log, /moyzal-v71/);
  const legal = read('legal.js');
  assert.match(legal, /Редакция от 17\.11\.2026/);
  assert.match(legal, /Version of 17\.11\.2026/);
  assert.match(legal, /Redakcija no 17\.11\.2026/);
});
