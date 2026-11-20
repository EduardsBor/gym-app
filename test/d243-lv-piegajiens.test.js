'use strict';
// D-243: LV «подход» = «piegājiens» (Claude 19.11); «Заминка» = «Atdzišana». «pieejams/pieejama» (= available) stays.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const files = ['i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'place.js', 'features.js', 'notify.js', 'cards.js', 'warm.js', 'cd.js', 'lib.js', 'i18n/lib.lv.js', 'i18n/tech.lv.js', 'exscreen.js', 'app.js'];

test('D-243: no «pieeja» in the meaning of a set left in app strings', () => {
  for (const f of files) {
    const s = fs.readFileSync(path.join(root, f), 'utf8');
    const bad = (s.match(/[Pp]ieej(?!am)[a-zāēīūčšžņļķģ]*/g) || []);
    assert.deepEqual(bad, [], f);
  }
  const d3 = fs.readFileSync(path.join(root, 'i18n/dict3.js'), 'utf8');
  for (const lv of ['Pierakstīt piegājienu', 'Pievienot komentāru piegājienam', 'Komentārs piegājienam', 'Piegājiens izpildīts', 'iepriekšējo piegājienu', 'Izpildītie piegājieni', 'Iesildošais piegājiens: ']) assert.ok(d3.includes(lv), lv);
  assert.match(fs.readFileSync(path.join(root, 'notify.js'), 'utf8'), /Atpūta beigusies — nākamais piegājiens/);
});

test('D-243: «Заминка» has one LV translation — Atdzišana', () => {
  const all = files.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
  assert.doesNotMatch(all, /Atsildīšanās/);
  assert.match(all, /\['Заминка','Cooldown','Atdzišana'\]/);
});
