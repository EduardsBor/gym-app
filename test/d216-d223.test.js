'use strict';
// D-216: Latvian C-108 fixes. D-223: legal bases for analytics and Sentry in RU/EN/LV.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

const LV_SOURCES = [
  'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js',
  'i18n/lib.lv.js', 'i18n/tech.lv.js',
  'cards.js', 'place.js', 'cd.js', 'warm.js', 'legal.js',
  'docs/LV-NEW-P303.md', 'docs/LV-NEW-ACSM.md', 'docs/LV-NEW-D223.md'
];

test('D-216: leftover typo patterns are gone from LV sources', () => {
  const forbidden = [
    [/slīpa sola/, 'slīpa sola'],
    [/\b1AM\b/, '1AM'],
    [/\b1MA\b/, '1MA'],
    [/purngal/, 'purngal'],
    [/[Pp]leznas muskul/, 'pleznas muskulis'],
    [/ķE/, 'ķE'],
    [/Elipsoīds/, 'Elipsoīds'],
    [/\bStepers\b/, 'Stepers'],
    [/Krosovera satuvināšana/, 'Krosovera satuvināšana'],
    [/Austrālie[sš]u pievilkšanās/, 'Austrāliešu pievilkšanās'],
    [/Sēžas tilts/, 'Sēžas tilts'],
    [/[Ss]ērij(?:a|as|u|ām|ās)\b/, 'sērija'],
    [/[Aa]tspiedien/, 'atspiedien'],
    [/apakštvērien/, 'apakštvērien'],
    [/[Vv]ilkme no grīdas/, 'vilkme no grīdas'],
    [/bloka vilkme/, 'bloka vilkme'],
    [/uztaisi pauzi/, 'uztaisi pauzi'],
    [/\bneatraujo\b/, 'neatraujo'],
    [/Frontālie pietupieni/, 'Frontālie pietupieni'],
    [/[Čč]etrgalvu/, 'Četrgalvu']
  ];
  for (const f of LV_SOURCES) {
    const text = read(f);
    for (const [re, label] of forbidden) {
      const m = text.match(re);
      assert.equal(m, null, `${label} in ${f}: ${m && m[0]}`);
    }
    // "Spiediens" may remain only as "pressure" (not a press): elbow-joint cue in cd.js
    const pressureOk = /Spiediens uz elkoņa locītavu/;
    const cleaned = f === 'cd.js' ? text.replace(pressureOk, '') : text;
    assert.equal(/(?<![Aa]t)[Ss]piedien/.test(cleaned), false, 'unexpected spiedien in ' + f);
  }
});

test('D-216: key approved terms are present in LV', () => {
  const dict = read('i18n/dict.js');
  assert.match(dict, /Stieņa spiešana uz slīpā sola/);
  assert.match(dict, /Vilkme no zemes/);
  assert.match(dict, /Augšējā bloka vilkšana/);
  assert.match(dict, /Eliptiskais trenažieris/);
  assert.match(dict, /Steperis/);
  assert.match(dict, /Horizontālā pievilkšanās/);
  assert.match(dict, /Tricepsa atspiešanās no soliņa/);
  assert.match(dict, /Atspiešanās līdztekās/);
  assert.match(dict, /Pietupiens ar stieni uz krūtīm/);
  assert.match(dict, /Kāju celšana kārienā/);
  assert.match(dict, /Vēdera pagriezieni sēdus/);
  assert.match(dict, /Pievilkšanās ar apakšējo tvērienu/);
  assert.match(dict, /Atspiešanās mājiņā/);
  assert.match(dict, /Gūžas pacelšana pie sola/);
  assert.match(dict, /Gūžas pacelšana guļus uz vienas kājas/);
  assert.match(dict, /Pacelšanās uz pirkstgaliem/);
  assert.match(dict, /\['Подходы','Sets','Piegājieni'\]/);
  assert.match(read('i18n/dict2.js'), /Gūžas pacelšana guļus/);
  assert.match(read('cd.js'), /Platā muguras muskuļa stiepšana pie balsta/);
  assert.match(read('cd.js'), /Četrgalvainā muskuļa stiepšana stāvus/);
  assert.match(read('cd.js'), /Spiediens uz elkoņa locītavu/);
});

test('D-223: §6 legal bases mention analytics consent and Sentry legitimate interest in RU, EN and LV', () => {
  const legal = read('legal.js');
  assert.match(legal, /<h3>6\. Правовые основания \(GDPR\)<\/h3>/);
  assert.match(legal, /Анонимная аналитика — на основании вашего согласия \(ст\. 6\(1\)\(a\)\)\. Согласие можно отозвать в «Ещё»\./);
  assert.match(legal, /Отчёты об ошибках Sentry в Android-приложении — законный интерес: исправлять сбои \(ст\. 6\(1\)\(f\)\)\./);

  assert.match(legal, /<h3>6\. Legal bases \(GDPR\)<\/h3>/);
  assert.match(legal, /Anonymous analytics — on the basis of your consent \(Art\. 6\(1\)\(a\)\)\. You can withdraw consent under “More”\./);
  assert.match(legal, /Sentry error reports in the Android app — legitimate interest: fixing crashes \(Art\. 6\(1\)\(f\)\)\./);

  assert.match(legal, /<h3>6\. Tiesiskais pamats \(VDAR\)<\/h3>/);
  assert.match(legal, /Anonīmā analītika — pamatojoties uz jūsu piekrišanu \(6\. panta 1\. punkta a\) apakšpunkts\)\. Piekrišanu var atsaukt sadaļā “Vēl”\./);
  assert.match(legal, /Sentry kļūdu ziņojumi Android lietotnē — leģitīmās intereses: avāriju labošana \(6\. panta 1\. punkta f\) apakšpunkts\)\./);
});

test('D-216/D-223: sw is moyzal-v67; changelog; new LV strings only in docs/LV-NEW-D223.md', () => {
  assert.match(read('sw.js'), /const C='moyzal-v67'/);
  const log = read('CHANGELOG.md');
  assert.match(log, /D-216, D-223/);
  assert.match(log, /moyzal-v67/);

  const lv = read('docs/LV-NEW-D223.md');
  assert.match(lv, /Anonīmā analītika/);
  assert.match(lv, /leģitīmās intereses/);
  const review = read('LV-REVIEW.md');
  assert.equal(review.includes('D-223'), false);
  assert.equal(review.includes('Anonīmā analītika'), false);
});
