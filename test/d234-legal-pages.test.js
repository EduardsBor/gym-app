'use strict';
// D-234: public privacy.html / terms.html from legal.js (RU/EN/LV), no app scripts / SW / sign-in gate; links on the sign-in screen.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const { build } = require('../scripts/build-legal-pages.js');

test('D-234: privacy.html and terms.html are up to date with legal.js', () => {
  const out = build();
  for (const f of ['privacy.html', 'terms.html']) assert.equal(read(f), out[f], f + ' is stale: run node scripts/build-legal-pages.js');
});

test('D-234: pages have all three languages, no scripts, no service worker, no sign-in', () => {
  for (const f of ['privacy.html', 'terms.html']) {
    const h = read(f);
    for (const l of ['ru', 'en', 'lv']) assert.match(h, new RegExp(`<section id="${l}" lang="${l}">`));
    assert.doesNotMatch(h, /<script|serviceWorker|sw\.js|supabase-config|vendor\/supabase/i);
  }
  assert.match(read('privacy.html'), /Политика конфиденциальности[\s\S]*Privacy Policy[\s\S]*Privātuma politika/);
  assert.match(read('terms.html'), /Условия использования[\s\S]*Terms of Use[\s\S]*Lietošanas noteikumi/);
  assert.match(read('sw.js'), /\(privacy\|terms\)\\\.html\$\/\.test\(u\.pathname\)\)return;/);
});

test('D-234: Google sign-in clause (name, email, profile photo) in all three languages', () => {
  const h = read('privacy.html');
  assert.match(h, /войти через Google: тогда Google передаёт нам только имя, адрес электронной почты и фото профиля/);
  assert.match(h, /sign in with Google: in that case Google shares with us only your name, email address and profile photo/);
  assert.match(h, /ieiet arī ar Google: tad Google mums nodod tikai vārdu, e-pasta adresi un profila foto/);
  assert.match(read('legal.js'), /фото профиля/);
});

test('D-234: sign-in screen has small «Конфиденциальность · Условия» links; LV per D-216', () => {
  const s = read('sync.js');
  assert.match(s, /id="mzlegal"[^`]*href="privacy\.html"[^`]*>Конфиденциальность<\/a> · <a href="terms\.html"[^`]*>Условия<\/a>/);
  const d3 = read('i18n/dict3.js');
  assert.ok(d3.includes("['Конфиденциальность','Privacy','Privātums']"));
  assert.ok(d3.includes("['Условия','Terms','Noteikumi']"));
  const lv = read('docs/LV-NEW-LEGAL-PAGES.md');
  assert.doesNotMatch(lv, /sērij/i);
  assert.doesNotMatch(lv.replace(/atspiedien|asinsspiedien/gi, ''), /spiedien/i);
});

test('D-235: owner and email filled in, no placeholders or draft marks, account sentence is current', () => {
  const legal = read('legal.js');
  for (const f of ['legal.js', 'privacy.html', 'terms.html']) {
    const h = read(f);
    assert.doesNotMatch(h, /\[\.\.\]|\[email\]|\[e-mail\]|\[e-pasts\]|\[Владелец\]|\[Owner\]|\[Īpašnieks\]|ПРОВЕРИТЬ|ЧЕРНОВИК|MELNRAKSTS|\bDRAFT\b/, f);
    assert.ok(h.includes('gymcaptain.app@gmail.com'), f);
  }
  assert.ok(legal.includes('Eduards Boroda (частное лицо, Латвия)'));
  assert.ok(legal.includes('Eduards Boroda (private individual, Latvia)'));
  assert.ok(legal.includes('Eduards Boroda (privātpersona, Latvija)'));
  assert.doesNotMatch(legal, /Аккаунт не обязателен|An account is not required|Konts nav obligāts/);
  assert.match(legal, /Для использования Приложения нужен аккаунт \(вход по почте или через Google\)/);
  assert.match(read('privacy.html'), /https:\/\/eduardsbor\.github\.io\/gym-app\/privacy\.html/);
  assert.doesNotMatch(read('privacy.html'), /class="note"/);
  assert.ok(fs.existsSync(path.join(root, 'docs/LEGAL-TODO.md')));
});
