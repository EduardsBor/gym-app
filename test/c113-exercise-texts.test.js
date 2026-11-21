'use strict';
// C-113: corrected exercise texts (RU/EN/LV) — errors, safety, glossary, headings.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

function boot(stored) {
  const store = new Map();
  if (stored !== undefined) store.set('gym', JSON.stringify(stored));
  const nodes = new Map();
  function el(id) {
    if (id && nodes.has(id)) return nodes.get(id);
    const node = {
      id: id || '', innerHTML: '', textContent: '', className: '', value: '', style: {}, dataset: {},
      classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
      append() {}, addEventListener() {}, insertAdjacentHTML() {}, setAttribute() {}, getAttribute() { return null; }, closest() { return null; },
      querySelector() { return null; }, querySelectorAll() { return []; }
    };
    if (id) nodes.set(id, node);
    return node;
  }
  const g = {
    console, setTimeout, clearTimeout, setInterval() { return 0; }, clearInterval() {},
    URL, Blob, navigator: { language: 'ru', languages: ['ru'] },
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
    location: { href: 'http://127.0.0.1/', origin: 'http://127.0.0.1', pathname: '/' },
    document: {
      documentElement: { lang: 'ru' }, title: '', body: { append() {}, style: {} },
      querySelector(sel) { const m = /^#([\w-]+)/.exec(sel || ''); return el(m ? m[1] : ''); },
      querySelectorAll() { return []; }, addEventListener() {}, createElement() { return el(); }
    }
  };
  g.window = g; g.globalThis = g; g.self = g;
  const ctx = vm.createContext(g);
  const files = ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'place.js', 'prog.js', 'plan.js', 'movekit.js'];
  for (const f of files) vm.runInContext(read(f), ctx, { filename: f });
  return { run: code => vm.runInContext(code, ctx), store };
}

const arr = x => JSON.parse(JSON.stringify(x));

const FORBIDDEN_LV = [
  'apdrošināt', 'plekšņveida', 'četrstūrain', 'korpus',
  'lendmain', 'svaru bumb', 'svara bumb', 'Ahileja cīpsl',
  'knābjveida–pleca', 'virsaizsmailes', 'zemaizsmailes',
  'jostas kvadrātmuskul', 'jostas kvadrātmuskul'
];
// Allowed leftovers: plekstveida, ceturtdaļpietupiens, kardio, rumpja muskuļi, augšstilba kvadrātmuskulis.
const SERVICE = [
  'Флаги', 'тяга ≥ жим', 'флага ограничений', 'Flags s/p',
  'pull ≥ push', 'limitation flag', 'karodziņ', 'vilkme ≥'
];

function pack(tech) {
  if (!tech) return { steps: [], errors: [], safety: '' };
  return {
    steps: Array.isArray(tech[0]) ? tech[0].map(s => String(s).trim()) : [],
    errors: Array.isArray(tech[1]) ? tech[1].map(s => String(s).trim()).filter(Boolean) : [],
    safety: String(tech[2] == null ? '' : tech[2]).trim()
  };
}

test('C-113: every visible exercise has ≥ 2 errors (not a copy of the steps) and non-empty safety in RU/EN/LV', () => {
  const { run } = boot();
  const ids = arr(run('EX.map(e => e.id)'));
  assert.ok(ids.length >= 170, 'visible catalog size ' + ids.length);
  const problems = [];
  for (const id of ids) {
    const ru = pack(arr(run('TECH[' + JSON.stringify(id) + ']')));
    const en = pack(arr(run('TECH_EN[' + JSON.stringify(id) + ']')));
    const lv = pack(arr(run('TECH_LV[' + JSON.stringify(id) + ']')));
    for (const [lang, t] of [['ru', ru], ['en', en], ['lv', lv]]) {
      if (t.errors.length < 2) problems.push(id + ' ' + lang + ' errors=' + t.errors.length);
      if (!t.safety) problems.push(id + ' ' + lang + ' empty safety');
      if (t.errors.length && t.steps.length && t.errors.join('\n') === t.steps.join('\n')) {
        problems.push(id + ' ' + lang + ' errors copy steps');
      }
      for (const e of t.errors) {
        if (t.steps.includes(e)) problems.push(id + ' ' + lang + ' error equals a step: ' + e);
      }
    }
    if (ru.steps.length !== en.steps.length || ru.steps.length !== lv.steps.length) {
      problems.push(id + ' step counts ru/en/lv ' + [ru.steps.length, en.steps.length, lv.steps.length].join('/'));
    }
    if (ru.errors.length !== en.errors.length || ru.errors.length !== lv.errors.length) {
      problems.push(id + ' error counts ru/en/lv ' + [ru.errors.length, en.errors.length, lv.errors.length].join('/'));
    }
  }
  assert.deepEqual(problems, []);
});

test('C-113: LV has no forbidden glossary terms; no service phrases in RU/EN/LV technique texts', () => {
  const { run } = boot();
  const ids = arr(run('EX.map(e => e.id)'));
  const hits = [];
  for (const id of ids) {
    const libLv = arr(run('LIB_LV[' + JSON.stringify(id) + ']')) || [];
    const nameLv = run('exBy(' + JSON.stringify(id) + ').nameLv || ""');
    const tech = pack(arr(run('TECH_LV[' + JSON.stringify(id) + ']')));
    const lvBlob = [nameLv, ...libLv, ...tech.steps, ...tech.errors, tech.safety].join('\n');
    for (const term of FORBIDDEN_LV) {
      if (term === 'korpus') {
        if (/korpus/i.test(lvBlob)) hits.push(id + ' LV ' + term);
        continue;
      }
      if (lvBlob.includes(term)) hits.push(id + ' LV ' + term);
    }
    // dorsālā/plantārā fleksija must not remain in steps
    const steps = tech.steps.join('\n');
    if (/dorsāl|plantār/.test(steps)) hits.push(id + ' LV fleksija in steps');
    for (const [lang, key] of [['ru', 'TECH'], ['en', 'TECH_EN'], ['lv', 'TECH_LV']]) {
      const t = pack(arr(run(key + '[' + JSON.stringify(id) + ']')));
      const blob = [...t.steps, ...t.errors, t.safety].join('\n');
      for (const p of SERVICE) if (blob.includes(p)) hits.push(id + ' ' + lang + ' service: ' + p);
    }
  }
  assert.deepEqual(hits, []);
});

test('C-113: 45 ids use the Amplitude and safety heading; dictionary has RU/EN/LV', () => {
  const { run } = boot();
  assert.equal(run('AMPLITUDE_SAFETY.size'), 45);
  assert.equal(run('safetyH("kettlebell-swing")'), 'Амплитуда и безопасность');
  assert.equal(run('safetyH("bp")'), 'Безопасность');
  const dict = read('i18n/dict.js');
  assert.match(dict, /\['Амплитуда и безопасность','Range and safety','Amplitūda un drošība'\]/);
});

test('C-113: upright-row rename is in the catalog and DICT; hanging-knee-raises stay visible; no Forearms group', () => {
  const { run } = boot();
  const ids = arr(run('EX.map(e => e.id)'));
  assert.equal(ids.includes('mk-barbell-upright-row'), true);
  assert.equal(ids.includes('mk-hanging-knee-raises'), true);
  assert.equal(ids.includes('hanging-knee-raise'), true);
  assert.equal(run('exBy("mk-barbell-upright-row").name'), 'Тяга штанги к груди широким хватом');
  const dict = read('i18n/dict.js');
  assert.match(dict, /Тяга штанги к груди широким хватом/);
  assert.match(dict, /Wide-grip barbell upright row/);
  assert.match(dict, /Stieņa vilkme pie krūtīm ar platu tvērienu/);
  const groups = arr(run('GROUPS'));
  assert.equal(groups.includes('Предплечья'), false);
  assert.equal(groups.includes('Бицепс'), true);
});

test('C-113: kettlebell-swing error and broomstick safety use the Claude wording', () => {
  const { run } = boot();
  const sw = pack(arr(run('TECH["kettlebell-swing"]')));
  const swEn = pack(arr(run('TECH_EN["kettlebell-swing"]')));
  const swLv = pack(arr(run('TECH_LV["kettlebell-swing"]')));
  assert.equal(sw.errors.includes('подъём гири выше плеч'), true);
  assert.equal(sw.errors.some(e => e.includes('выше головы')), false);
  assert.equal(swEn.errors.includes('swinging the bell above shoulder height'), true);
  assert.equal(swLv.errors.includes('svarbumbas pacelšana virs pleciem'), true);
  const br = pack(arr(run('TECH["mk-broomstick-pass-throughs"]')));
  const brEn = pack(arr(run('TECH_EN["mk-broomstick-pass-throughs"]')));
  const brLv = pack(arr(run('TECH_LV["mk-broomstick-pass-throughs"]')));
  assert.match(br.safety, /если беспокоят плечи — малая амплитуда/);
  assert.match(brEn.safety, /if your shoulders bother you, keep the range small/);
  assert.match(brLv.safety, /ja traucē pleci — maza amplitūda/);
});
