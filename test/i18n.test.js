'use strict';
// D-209: every UI dictionary entry has EN and LV; stale library count / version strings are gone.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

function loadDicts() {
  const ctx = vm.createContext({ console });
  const load = (f, exp) => vm.runInContext('void function(){\n' + read(f) + '\n' + exp + '\n}.call(this)', ctx, { filename: f });
  load('i18n/dict.js', 'this.DICT=DICT;this.DICT_EXACT=DICT_EXACT');
  load('i18n/dict2.js', 'this.DICT2=DICT2');
  load('i18n/dict3.js', 'this.DICT3=DICT3');
  return [...ctx.DICT, ...ctx.DICT2, ...ctx.DICT3, ...ctx.DICT_EXACT];
}

test('D-209: every i18n key has non-empty en and lv', () => {
  const rows = loadDicts();
  assert.ok(rows.length > 100, 'dictionary should be loaded');
  const missing = rows.filter(r => !Array.isArray(r) || r[1] == null || r[2] == null || String(r[1]).trim() === '' || String(r[2]).trim() === '');
  assert.deepEqual(missing.map(r => r && r[0]), []);
});

test('D-209: APP_VERSION is 1.0; stale 68 / version 30 texts are gone', () => {
  const app = read('app.js');
  const feat = read('features.js');
  const sw = read('sw.js');
  const lib = read('lib.js');
  const gradle = read('android/app/build.gradle');
  const legal = read('legal.js');
  assert.match(app, /const APP_VERSION='1\.0'/);
  assert.match(app, /Версия \$\{APP_VERSION\}/);
  assert.match(app, /libCountText\(\)/);
  assert.equal(app.includes('68 упражнений'), false);
  assert.equal(app.includes('Версия 30'), false);
  assert.equal(feat.includes('Версия 30'), false);
  assert.match(feat, /textContent='Версия '\+APP_VERSION/);
  assert.match(sw, /const C='moyzal-v77'/);
  assert.equal(sw.includes("C='moyzal-v59'"), false);
  assert.equal(lib.includes('20 базовых упражнений'), false);
  assert.match(gradle, /versionName "1\.0"/);
  assert.equal(legal.includes('eu-west-1'), false);
  assert.equal(legal.includes('Ireland'), false);
  assert.match(legal, /eu-central-1/);
});
