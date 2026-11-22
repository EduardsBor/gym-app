'use strict';
// Urgent fixes 21.11.2026 (Claude audit, docs/21-claude-audit-21-11.md):
// warm-up hints translated, code-only sign-in, no «ИИ-советы скоро», no top «Завершить», «Профиль» by screens, wrong backup text.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const CYR = /[А-Яа-яЁё]/;

function i18nCtx(lang) {
  const g = {
    console, localStorage: { getItem: k => (k === 'gym' ? JSON.stringify({ lang }) : null), setItem() {}, removeItem() {} },
    navigator: { language: lang, languages: [lang] },
    document: { documentElement: { lang: '' }, addEventListener() {}, title: '' },
    MutationObserver: function () { this.observe = () => {}; },
    confirm: () => true, alert: () => {}
  };
  g.window = g; g.globalThis = g;
  const ctx = vm.createContext(g);
  for (const f of ['i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js']) vm.runInContext(read(f), ctx, { filename: f });
  return ctx;
}

test('warm-up hints (WMOV) are fully translated in EN and LV — no mixed RU words', () => {
  const m = /const WMOV=(\{[\s\S]*?\});/.exec(read('app.js'));
  assert.ok(m, 'WMOV found');
  for (const lang of ['en', 'lv']) {
    const ctx = i18nCtx(lang);
    const W = vm.runInContext('(' + m[1] + ')', ctx);
    const bad = [];
    for (const [k, arr] of Object.entries(W)) for (const s of arr) { const t = vm.runInContext('tr(' + JSON.stringify(s) + ')', ctx); if (CYR.test(t)) bad.push(`${lang} ${k}: ${t}`); }
    assert.deepEqual(bad, [], bad.join('\n'));
  }
});

test('sign-in: only Google and an email code — no password, sign-up or «forgot password»', () => {
  const s = read('sync.js');
  const acc = s.slice(s.indexOf('function accountHTML(){'), s.indexOf('function bindAccount(){'));
  assert.match(acc, /id="mzcode"/);
  assert.match(acc, /id="mzotp"/);
  assert.doesNotMatch(acc, /mzpass|mzin"|mzup|mzreset|mzmagic|iPhone/);
  assert.doesNotMatch(acc, /☁️ Аккаунт и синхронизация<\/b>\s*<p class="mut" style="margin:4px 0">Войди или создай аккаунт/, 'no second sign-in block repeating the gate text');
  assert.match(s, /\$\('#mzcode'\)\.onclick=doMagic/);
  assert.doesNotMatch(s, /Выход не удаляет данные на этом устройстве/, 'old wrong sign-out text removed');
});

test('no «ИИ-советы скоро» card; top «Завершить» hidden, bottom «Завершить тренировку» stays', () => {
  assert.doesNotMatch(read('features.js'), /ИИ-советы/);
  const a = read('app.js');
  assert.match(a, /<button class="ok hidden" id="fin" aria-hidden="true" tabindex="-1">Завершить<\/button>/);
  assert.match(a, /id="fin2"[^>]*>Завершить тренировку</);
  assert.doesNotMatch(a, /Все данные хранятся только на этом телефоне/);
});

test('«Профиль» by screens: profile.js loads last (site, offline cache, Android build) with the sections', () => {
  const html = read('index.html');
  assert.match(html, /<script src="notify\.js"><\/script><script src="profile\.js"><\/script>/);
  assert.match(read('sw.js'), /'profile\.js'/);
  assert.match(read('scripts/build-web.js'), /'profile\.js'/);
  const p = read('profile.js');
  for (const t of ['Аккаунт', 'Программа', 'Оборудование', 'Настройки тренировки', 'Уведомления', 'Данные', 'Язык и оформление', 'Справка']) assert.match(p, new RegExp("t:'" + t + "'"));
  const d3 = read('i18n/dict3.js');
  for (const t of ['Аккаунт', 'Данные', 'Язык и оформление', '← Профиль']) assert.match(d3, new RegExp("\\['" + t + "','[^']+','[^']+'\\]"));
});

test('transfer card: background sync is held while the choice is open', () => {
  const s = read('sync.js');
  const dlg = s.slice(s.indexOf('function showTransferDialog(){'), s.indexOf('async function afterAuth(){'));
  assert.match(dlg, /protectGuestOnAuth=true/);
  assert.match(s, /if\(protectGuestOnAuth&&isUnboundGuest\(\)\)\{return 'held'\}/);
  assert.match(s, /if\(r!=='held'&&S\.ownerUid!==user\.id\)/);
});

test('LV: sign-in wording is «pieteikties / pieteikšanās», never «ieiet / ieej / ieiešana»', () => {
  const ctx = i18nCtx('lv');
  const vals = vm.runInContext('DICT.concat(DICT2,DICT3).map(r=>r[2]).filter(Boolean)', ctx);
  // D-276 (Claude, 21.11): the login prompt for clips is the approved exception «Ieej, lai skatītos video».
  const allowed = new Set(['Ieej, lai skatītos video']);
  const bad = Array.from(vals).filter(v => /(?<![\p{L}])(ieiet|ieej|ieiešan|iegāj)/iu.test(v) && !allowed.has(v));
  assert.equal(bad.length, 0, bad.join('\n'));
  assert.ok(vals.length > 500, 'dictionaries loaded');
});
