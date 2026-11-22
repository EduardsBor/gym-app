'use strict';
// tech-fix-2: every RU phrase of the new UI (plan check card, start modal, open workout card, swap / add) has EN and LV.
const test = require('node:test');
const assert = require('node:assert/strict');
const { boot, read } = require('./fixtures/tf1-boot.js');

const CYR = /[А-Яа-яЁё]/;
function phrases() {
  const src = read('limguard.js');
  const out = new Set();
  for (const m of src.matchAll(/>([^<>`${}]*[А-Яа-яЁё][^<>`${}]*)</g)) { const t = m[1].trim(); if (t && !/^[(\s]*$/.test(t)) out.add(t.replace(/^⚠\s*/, '')); }
  for (const m of src.matchAll(/lgT\('([^']+)'\)/g)) out.add(m[1]);
  out.add(src.match(/const LG_KEEP_Q='([^']+)'/)[1]);
  ['Другое оборудование:', 'Не подходит при твоих ограничениях:'].forEach(x => out.add(x));
  return [...out].filter(x => CYR.test(x));
}

test('tf2 i18n: all new phrases are in the dictionary with EN and LV (no Cyrillic left)', () => {
  const b = boot();
  const m = new Map(b.J('DICT.concat(DICT2,DICT3)').map(r => [r[0], r]));
  const P = phrases();
  assert.ok(P.length >= 18, P.join(' | '));
  for (const p of P) {
    const r = m.get(p);
    assert.ok(r, 'missing: ' + p);
    assert.ok(r[1] && r[2] && !CYR.test(r[1] + r[2]), p);
  }
});

for (const lang of ['en', 'lv']) {
  test(`tf2 i18n: plan check card and start modal texts translate in ${lang.toUpperCase()}`, () => {
    const b = boot({ lang, state: { lang } });
    const t = b.J(`[tr('Проверка ограничений'),tr('Заменить безопасными'),tr('Оставить как есть'),tr('Заменить и начать'),tr('Начать без изменений'),tr('безопасной замены нет — будет убрано'),tr('Разминка'),tr('Заминка'),tr('колени'),tr(LG_KEEP_Q)]`);
    assert.ok(t.every(x => x && !CYR.test(x)), t.join(' | '));
  });
}
