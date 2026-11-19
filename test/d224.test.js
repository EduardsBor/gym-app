'use strict';
// D-224: calf-raise errors in RU/EN/LV, LV pulldown name, analītika spelling.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

test('D-224: mk-standing-calf-raise-machine errors replaced in RU, EN and LV; technique unchanged', () => {
  const ru = read('tech.js');
  const en = read('i18n/tech.en.js');
  const lv = read('i18n/tech.lv.js');

  assert.match(ru, /"mk-standing-calf-raise-machine":\[\["Подушки на плечах, носки на краю платформы\.","Подъём до максимума на носки, пауза\.","Медленно опустить пятки ниже платформы, колени не сгибать\."\],\["Пружинить внизу вместо медленного движения\.","Неполная амплитуда: пятки не опускаются ниже платформы\.","Сгибать колени — работают бёдра, а не икры\."\],""\]/);
  assert.match(en, /"mk-standing-calf-raise-machine":\[\["Pads on the shoulders, balls of the feet on the edge of the platform\.","Rise as high as possible onto the toes and pause\.","Lower the heels slowly below the platform, do not bend the knees\."\],\["Bouncing at the bottom instead of moving slowly\.","Partial range: heels don't drop below the platform\.","Bending the knees, so the thighs work instead of the calves\."\],""\]/);
  assert.match(lv, /"mk-standing-calf-raise-machine":\[\["Polsteri uz pleciem, pirkstgali uz platformas malas\.","Pacelies maksimāli uz pirkstgaliem un izdari pauzi\.","Lēnām nolaid papēžus zem platformas, ceļus neliec\."\],\["Atsperošana apakšā lēnas kustības vietā\.","Nepilna amplitūda — papēži nenolaižas zem platformas\.","Ceļu saliekšana — strādā augšstilbi, nevis ikri\."\],""\]/);

  // the old one-item errors field must not remain
  assert.equal(ru.includes('],["Медленно опустить пятки ниже платформы, колени не сгибать."],""]'), false);
  assert.equal(en.includes('],["Lower the heels slowly below the platform, do not bend the knees."],""]'), false);
  assert.equal(lv.includes('],["Lēnām nolaid papēžus zem platformas, ceļus neliec."],""]'), false);
});

test('D-224: LV name of straight-arm-pulldown is Taisno roku vilkšana blokā; id unchanged', () => {
  const cards = read('cards.js');
  assert.match(cards, /"id":"straight-arm-pulldown"/);
  assert.match(cards, /"nameLv":"Taisno roku vilkšana blokā"/);
  assert.equal(cards.includes('Taisno roku vilkme uz bloka'), false);
  assert.match(cards, /"nameLv":"Vilkme ar krūšu atbalstu \(divas hanteles\)"/);
});

test('D-224: LV analītika spelling in legal.js and dict3.js; typo forms gone', () => {
  const legal = read('legal.js');
  const dict3 = read('i18n/dict3.js');
  assert.match(legal, /Analītika ir <b>pseidonimizēta<\/b>/);
  assert.equal(/[Aa]nalitik(?!ī)/.test(legal), false);
  assert.match(dict3, /Anonīma analītika/);
  assert.match(dict3, /Analītika ieslēgta/);
  assert.match(dict3, /Analītika izslēgta/);
  assert.match(dict3, /Anonīmo analītiku var ieslēgt atsevišķi sadaļā “Vēl”\./);
  assert.equal(/[Aa]nalitik(?!ī)/.test(dict3), false);
});

test('D-224: sw is moyzal-v70; changelog; new LV strings only in docs/LV-NEW-D224.md', () => {
  assert.match(read('sw.js'), /const C='moyzal-v82'/);
  const log = read('CHANGELOG.md');
  assert.match(log, /D-224/);
  assert.match(log, /moyzal-v69/);
  const lv = read('docs/LV-NEW-D224.md');
  assert.match(lv, /Taisno roku vilkšana blokā/);
  assert.match(lv, /Atsperošana apakšā lēnas kustības vietā/);
  assert.match(lv, /Analītika ieslēgta/);
  const review = read('LV-REVIEW.md');
  assert.equal(review.includes('D-224'), false);
  assert.equal(review.includes('Taisno roku vilkšana blokā'), false);
});
