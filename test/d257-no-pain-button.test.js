'use strict';
// D-257 (Eduards: «Убери во всех случаях данное упоминание про боль»): no «🤕 Боль» button / pain notes on workout cards.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

test('D-257: no pain button, handler or pain notes in the app; strings removed RU/EN/LV', () => {
  for (const f of ['autow.js', 'app.js', 'exscreen.js', 'blocks.js', 'features.js']) assert.doesNotMatch(read(f), /🤕|data-awpain|В прошлый раз была боль|Боль две тренировки|Боль: без прибавки/, f);
  assert.match(read('autow.js'), /s\.note!=='pain'&&s\.note!=='pain2'/);
  const d = read('i18n/dict3.js');
  assert.doesNotMatch(d, /🤕|“Pain” and limitations|“Sāpes” un|В прошлый раз была боль|Боль две тренировки|Боль: без прибавки/);
  assert.ok(d.includes('full history, limitations, sync'));
});

test('D-257: the description warning «При боли прекрати упражнение» stays; CSV keeps the pain column for old data', () => {
  assert.match(read('tech.js'), /При боли прекрати упражнение/);
  assert.match(read('lib.js'), /При боли прекрати упражнение/);
  assert.match(read('csv.js'), /it\.pain\?T\('да'\):''/);
});
