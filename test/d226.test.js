'use strict';
// D-226: §3.5 lists first_workout in RU/EN/LV; LV uses 1RM, not 1AM.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

test('D-226: §3.5 names the first completed workout in RU, EN and LV; LV has 1RM, not 1AM', () => {
  const legal = read('legal.js');
  const ru = legal.slice(legal.indexOf('ru:{privacy:'), legal.indexOf('en:{privacy:'));
  const en = legal.slice(legal.indexOf('en:{privacy:'), legal.indexOf('lv:{privacy:'));
  const lv = legal.slice(legal.indexOf('lv:{privacy:'));

  assert.match(ru, /<h4>3\.5\. Аналитика \(только если вы её включили\)<\/h4>/);
  assert.match(ru, /нажатие «попробовать», первая завершённая тренировка \(только место и цель\)/);

  assert.match(en, /<h4>3\.5\. Analytics \(only if you turn it on\)<\/h4>/);
  assert.match(en, /a “try” tap, first completed workout \(training place and goal only\)/);

  assert.match(lv, /<h4>3\.5\. Analītika \(tikai ja to ieslēdzat\)<\/h4>/);
  assert.match(lv, /pieskāriens “izmēģināt”, pirmais pabeigtais treniņš \(tikai treniņu vieta un mērķis\)/);
  assert.match(lv, /aptuvenu 1RM \(viena atkārtojuma maksimumu\)/);
  assert.equal(/\b1AM\b/.test(lv), false);
});

test('D-226: first_workout stays in code; sw is moyzal-v74; changelog', () => {
  assert.match(read('sync.js'), /mzTrack\('first_workout'/);
  assert.match(read('sw.js'), /const C='moyzal-v126'/);
  const log = read('CHANGELOG.md');
  assert.match(log, /D-226/);
  assert.match(log, /moyzal-v74/);
});
