'use strict';
// tech-fix-1: every new UI string has EN and LV; the live translation engine renders the notes in EN and LV.
const test = require('node:test');
const assert = require('node:assert/strict');
const { boot } = require('./fixtures/tf1-boot.js');

const NEW = ['Упражнение вернулось по плану программы: вес прежний, начни с нижней границы повторов', 'Разгрузка по программе: вес тот же, запас +2 повтора',
  'Разгрузка по программе: подходов меньше (уже в плане), вес тот же.', 'Ограничение', 'убрано из тренировки: безопасной замены нет',
  'Если хочешь вернуть упражнение — сначала посоветуйся с врачом или тренером.', 'Вариант программы', 'Вариант B — 4 тренировки в неделю',
  'Рекомендуем: между тренировками есть дни отдыха.', 'Вариант A — 6 тренировок в неделю',
  'Дополнительный вариант: шесть тренировок в неделю без дня отдыха — только при хорошем восстановлении.', 'Исходное оборудование (Смит)',
  'Рекомендуем: жим и присед в Смите, можно без страхующего.', 'Свободная штанга', 'Для опытных: нужен уверенный жим и присед со штангой и страхующий.', 'Доработанная версия'];

test('tech-fix-1 i18n: new strings are in the dictionary with EN and LV', () => {
  const b = boot();
  const rows = b.J('DICT.concat(DICT2,DICT3)');
  const m = new Map(rows.map(r => [r[0], r]));
  for (const s of NEW) {
    const r = m.get(s);
    assert.ok(r, 'missing: ' + s);
    assert.ok(r[1] && r[2] && !/[А-Яа-яЁё]/.test(r[1] + r[2]), s);
  }
  // AW_NOTE / banner texts used by the code are exactly these keys
  assert.equal(b.run('AW_NOTE.return_planned'), NEW[0]);
  assert.equal(b.run('AW_NOTE.deload_block'), NEW[1]);
  assert.equal(b.run("BLOCK_VARIANT_RU.loss_nov_6_g_b36_va[1]"), NEW[10]);
});

for (const [lang, word, removed] of [['en', 'Limitation', 'removed from the workout: no safe replacement'], ['lv', 'Ierobežojums', 'izņemts no treniņa: nav drošas aizstāšanas']]) {
  test(`tech-fix-1 i18n: limitation note is translated in ${lang.toUpperCase()}`, () => {
    const b = boot({ lang, state: { lang } });
    assert.equal(b.run('LANG'), lang);
    const t = b.J(`[tr('Ограничение'),tr('убрано из тренировки: безопасной замены нет'),tr('колени'),tr(AW_NOTE.return_planned),tr(AW_NOTE.deload_block)]`);
    assert.equal(t[0], word);
    assert.equal(t[1], removed);
    assert.ok(t.every(x => !/[А-Яа-яЁё]/.test(x)), t.join(' | '));
  });
}
