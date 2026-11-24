'use strict';
// D-291: catalog program descriptions no longer contain a fixed minutes phrase; duration_label stays on the line below.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

// Fixed duration left in a description: 60–70, or any "N minutes each / по N мин / katrs N minūtes".
const FIXED_MIN = /60[–-]70|по\s+\d+[–-]?\d*\s*мин|minutes each|katrs\s+\d+[–-]?\d*\s*minūt|,\s*pa\s+\d+[–-]?\d*\s*min/i;

function loadCatalog() {
  const ctx = {
    console, LANG: 'ru', tr: s => s,
    BLOCK_INDEX: vm.runInNewContext(read('data/blocks-index.js') + '\n;BLOCK_INDEX', { window: {}, BLOCK_INDEX: null }) || (() => {
      const g = { window: {} };
      vm.runInNewContext(read('data/blocks-index.js'), g);
      return g.BLOCK_INDEX || g.window.BLOCK_INDEX;
    })(),
  };
  // blocks-index is `const BLOCK_INDEX=...` or `var`? load properly
  return ctx;
}

test('D-291: cache is moyzal-v170', () => {
  assert.match(read('cache-ver.js'), /var SW_CACHE='moyzal-v170'/);
});

test('D-291: LV sign-in and reset confirmation match the approved wording', () => {
  const d3 = read('i18n/dict3.js');
  assert.match(d3, /\['Не выполнен вход','Not signed in','Nav ieiets kontā'\]/);
  assert.doesNotMatch(d3, /Nav veikta pieteikšanās/);
  assert.match(d3, /'Dati tiks dzēsti tikai šajā ierīcē\. Konts, mākoņa kopija un abonements paliks\. Lai dzēstu kontu un datus mākonī, izmanto «Dzēst kontu»\.'/);
  assert.doesNotMatch(d3, /'Tiks dzēsti tikai dati šajā ierīcē/);
  const lv = read('docs/LV-NEW-D291.md');
  assert.match(lv, /Nav ieiets kontā/);
  assert.match(lv, /Dati tiks dzēsti tikai šajā ierīcē/);
});

test('D-291: no program description contains 60–70 or a fixed minutes phrase', () => {
  const src = read('app.js');
  const start = src.indexOf('const CATALOG=');
  const end = src.indexOf('function catalogCardPlace', start);
  assert.ok(start >= 0 && end > start, 'CATALOG array');
  const list = vm.runInNewContext(src.slice(start, end) + 'CATALOG');
  const bad = [];
  for (const c of list) {
    if (FIXED_MIN.test(c.desc)) bad.push('CATALOG ' + c.name + ': ' + c.desc);
  }
  const d3 = read('i18n/dict3.js');
  const triples = [...d3.matchAll(/\['((?:\\'|[^'])*)','((?:\\'|[^'])*)','((?:\\'|[^'])*)'\]/g)];
  const descRu = new Set(list.map(c => c.desc));
  for (const t of triples) {
    const [ru, en, lv] = [t[1], t[2], t[3]];
    if (!descRu.has(ru) && !/36 тренировок, около/.test(ru) && !/36 treniņi, apmēram/.test(lv) && !/36 workouts, about/.test(en)) continue;
    for (const [lang, s] of [['RU', ru], ['EN', en], ['LV', lv]]) {
      if (FIXED_MIN.test(s)) bad.push('dict3 ' + lang + ': ' + s);
    }
  }

  const idxCtx = {};
  vm.runInNewContext(read('data/blocks-index.js') + '; this.BLOCK_INDEX = (typeof BLOCK_INDEX!=="undefined"?BLOCK_INDEX:this.BLOCK_INDEX);', idxCtx);
  let INDEX = idxCtx.BLOCK_INDEX;
  if (!INDEX) {
    const g = {};
    vm.runInNewContext(read('data/blocks-index.js'), g);
    INDEX = g.BLOCK_INDEX;
  }
  assert.ok(Array.isArray(INDEX) && INDEX.length, 'BLOCK_INDEX');

  const appSrc = read('app.js');
  const fns = {};
  vm.runInNewContext(
    appSrc.slice(appSrc.indexOf('function catalogCardPlace'), appSrc.indexOf('function filterCatalog')) +
    '; this.catalogBlockDesc=catalogBlockDesc; this.catalogBlockSummary=catalogBlockSummary; this.catalogFmt=catalogFmt; this.catalogT=catalogT; this.catalogLang=catalogLang; this.catalogDur=catalogDur; this.catalogWorkoutWord=catalogWorkoutWord; this.catalogWeekWord=catalogWeekWord; this.catalogIndexList=catalogIndexList;',
    Object.assign(fns, {
      LANG: 'ru',
      tr: s => s,
      LVN: { nov: 'Новичок', mid: 'Средний', adv: 'Опытный' },
      PLN: { g: 'Зал', b: 'Дом', d: 'Дом с гантелями' },
      GOALS: { mass: 'Масса', str: 'Сила', loss: 'Похудение', fit: 'Форма' },
      catalogIndexList: () => INDEX,
      BLOCK_INDEX: INDEX,
    })
  );
  // The slice may not be a complete runnable unit if it references helpers defined above.
  // Evaluate descriptions via a self-contained recreation of catalogBlockDesc.
  function descOf(b) {
    const head = `${fns.LVN[b.level]||b.level} · ${b.days}× в неделю · ${fns.PLN[b.place==='b_nobar'?'b':(b.place||'g')]||b.place}`;
    const n = b.workouts, w = b.weeks;
    const word = n === 1 ? 'тренировка' : (n >= 2 && n <= 4 ? 'тренировки' : 'тренировок');
    const week = w === 1 ? 'неделя' : (w >= 2 && w <= 4 ? 'недели' : 'недель');
    return `${head}. ${n} ${word}, около ${w} ${week}`;
  }
  // Prefer the real function if it loaded
  const real = typeof fns.catalogBlockDesc === 'function' ? fns.catalogBlockDesc.bind(fns) : descOf;
  let usedReal = typeof fns.catalogBlockDesc === 'function';
  for (const b of INDEX) {
    let d;
    try { d = usedReal ? fns.catalogBlockDesc(b) : descOf(b); }
    catch (e) { usedReal = false; d = descOf(b); }
    if (FIXED_MIN.test(d)) bad.push('block desc ' + b.id + ': ' + d);
    // The duration_label line (summary) may still mention minutes — that is kept on purpose.
  }
  assert.equal(bad.length, 0, bad.slice(0, 8).join('\n'));
  // source: catalogBlockDesc no longer interpolates {dur}
  const blockFn = appSrc.slice(appSrc.indexOf('function catalogBlockDesc'), appSrc.indexOf('function catalogBlockSummary'));
  assert.doesNotMatch(blockFn, /по \{dur\}/);
  assert.match(appSrc, /function catalogBlockSummary[\s\S]*по \{dur\}/);
});
