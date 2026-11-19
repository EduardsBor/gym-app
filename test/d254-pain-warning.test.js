'use strict';
// D-254 (Eduards: «В описаниях упражнения, при боли упоминание нужно выделить»): pain warning is its own callout, source note stays grey.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

test('D-254: technique sheet and library page show the pain callout after «Безопасность», source note separate', () => {
  for (const f of ['tech.js', 'lib.js']) {
    const s = read(f);
    assert.match(s, /<h3>Безопасность<\/h3>[^]*?<p class="painw" role="note">🛑 <b>При боли прекрати упражнение\.<\/b><\/p>\n <p class="mut" style="font-size:12px">Общие рекомендации по технике \(ACSM 2009 \+ дополнения\)\.<\/p><\/div>`;/, f);
    assert.doesNotMatch(s, /дополнения\)\. При боли/, f);
  }
});

test('D-254: RU/EN/LV strings split; callout uses theme danger colours in every theme', () => {
  const d = read('i18n/dict.js');
  assert.ok(d.includes("['Общие рекомендации по технике (ACSM 2009 + дополнения).','General technique guidelines (ACSM 2009 + additions).','Vispārīgi tehnikas ieteikumi (ACSM 2009 + papildinājumi).']"));
  assert.ok(d.includes("['При боли прекрати упражнение.','Stop the exercise if you feel pain.','Ja ir sāpes, pārtrauc vingrinājumu.']"));
  assert.doesNotMatch(d, /дополнения\)\. При боли/);
  const css = read('style.css');
  assert.match(css, /\.painw\{background:var\(--danger-bg\);color:var\(--txt\);border-left:4px solid var\(--danger\)/);
  for (const t of ['captain', 'classic', 'light', 'ocean', 'berry']) {
    const m = new RegExp(`\\[data-theme=${t}\\]\\{([^}]*)\\}`).exec(css);
    assert.ok(m && /--danger-bg:#/.test(m[1]) && /--danger:#/.test(m[1]), t);
  }
  assert.ok(fs.existsSync(path.join(root, 'docs/LV-FIX-PAIN-WARNING.md')));
});
