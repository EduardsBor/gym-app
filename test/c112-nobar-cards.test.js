'use strict';
// C-112: 5 карточек для блоков b_nobar (дом и свой вес без турника), ролики MoveKit по именам файлов.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const IDS = { 'towel-row': 'towel-doorframe-row.mp4', 'backpack-row': 'backpack-row.mp4', superman: 'supermans.mp4', 'towel-iso-curl': 'towel-isometric-curls.mp4', 'towel-leg-curl': 'towel-slide-leg-curl.mp4' };

test('each b_nobar card is in place.js for home and bodyweight only, with RU/EN/LV texts', () => {
  const src = read('place.js');
  for (const id of Object.keys(IDS)) {
    const line = src.split('\n').find(l => l.startsWith('["' + id + '",'));
    assert.ok(line, id + ' card missing');
    const row = JSON.parse(line.replace(/,\s*$/, ''));
    assert.match(row[3], /^db\|s?$/, id + ' places');
    assert.equal(row.length, 12);
    for (const k of [6, 7, 8]) assert.equal(row[k].length, 3);
    for (const k of [9, 10, 11]) { assert.equal(row[k][0].length, 3); assert.equal(row[k][1].length, 3); assert.ok(row[k][2]); }
  }
  assert.match(src, /^\["backpack-row", [^\n]*"db\|s"/m);
  assert.match(src, /^\["superman", [^\n]*"db\|s"/m);
});

test('each b_nobar card maps to its MoveKit file name, never a URL', () => {
  const src = read('movekit.js');
  for (const [id, f] of Object.entries(IDS)) assert.ok(src.includes('"' + id + '": "' + f + '"'), id);
  assert.equal(/https?:\/\/[^\s'"]*\.mp4/.test(src), false);
});

test('towel isometric curl is logged in seconds', () => {
  assert.match(read('features.js'), /id==='towel-iso-curl'\|\|\/plank\|планка\/i/);
});

test('Claude text fixes: no technical unit note, LV muscle name and core wording', () => {
  const src = read('place.js');
  assert.equal(src.includes('unit sec'), false);
  assert.equal(src.includes('puspleveņainais'), false);
  assert.ok(src.includes('pusplēvainais muskulis'));
  assert.ok(src.includes('līdzsvaro vēdera preses'));
});
