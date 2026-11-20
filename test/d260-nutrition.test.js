'use strict';
// D-260: nutrition article in «Профиль» → «Справка» → «🥗 Питание под цель»; RU verbatim, EN/LV translations.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
function load() { const c = { LANG: 'ru' }; vm.createContext(c); vm.runInContext(read('nutrition.js'), c); return c; }

test('D-260: RU article is byte-identical to the approved source (md5)', () => {
  const c = load();
  assert.equal(crypto.createHash('md5').update(vm.runInContext('NUT_MD.ru', c)).digest('hex'), '1f7b8c8f20ecd4f7a9129809eedc5592');
});

test('D-260: EN and LV have the same structure and no Cyrillic; rendered as headings/lists', () => {
  const c = load();
  const shape = l => vm.runInContext(`NUT_MD.${l}`, c).split('\n').map(x => (/^(#+|-|\d+\.) /.exec(x) || [''])[0]).join('|');
  assert.equal(shape('en'), shape('ru'));
  assert.equal(shape('lv'), shape('ru'));
  for (const l of ['en', 'lv']) assert.doesNotMatch(vm.runInContext(`NUT_MD.${l}`, c), /[\u0400-\u04FF]/, l);
  const h = vm.runInContext('nutMd(NUT_MD.en)', c);
  assert.match(h, /^<h2>Nutrition for your goal<\/h2>/);
  assert.equal((h.match(/<h3>/g) || []).length, 10);
  assert.match(h, /<b>1\.4–2\.0 g of protein per kg of body weight a day<\/b>/);
  assert.ok(read('docs/LV-NEW-NUTRITION.md').includes(vm.runInContext('NUT_MD.lv', c).trim().split('\n')[0]));
});

test('D-260: wired into Профиль/Справка, nav, render, SW cache and index; strings RU/EN/LV', () => {
  const a = read('app.js');
  assert.match(a, /id="nut"[^>]*>🥗 Питание под цель</);
  assert.match(a, /\$\('#nut'\)\.onclick=\(\)=>go\('nutrition'\)/);
  assert.match(a, /NAV_OF.nutrition='more'/);
  assert.match(a, /library,nutrition:\(\)=>nutrition\(\),quiz/);
  assert.match(read('sw.js'), /'nutrition\.js'/);
  assert.match(read('index.html'), /<script src="nutrition\.js"><\/script>/);
  assert.ok(read('i18n/dict3.js').includes("['🥗 Питание под цель','🥗 Nutrition for your goal','🥗 Uzturs atbilstoši mērķim']"));
});

test('D-260b: Android build copies nutrition.js into www/ (APK)', () => {
  assert.match(read('scripts/build-web.js'), /'nutrition\.js'/);
});
