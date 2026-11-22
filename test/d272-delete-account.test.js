'use strict';
// D-272: public delete-account.html (RU/EN/LV) — no sign-in, no forms, not cached by the service worker.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

test('D-272: delete-account.html is a static public page like privacy.html — no scripts, SW, or sign-in', () => {
  const h = read('delete-account.html');
  for (const l of ['ru', 'en', 'lv']) assert.match(h, new RegExp(`<section id="${l}" lang="${l}">`));
  assert.match(h, /href="#ru"/);
  assert.match(h, /href="#en"/);
  assert.match(h, /href="#lv"/);
  assert.doesNotMatch(h, /<script|serviceWorker|sw\.js|supabase-config|vendor\/supabase|#mzemail|#mzgate|password/i);
  assert.doesNotMatch(h, /<form[\s>]/i);
  assert.doesNotMatch(h, /<input[\s>]/i);
  assert.match(h, /mailto:support@gymcaptain\.app/);
  assert.equal((h.match(/support@gymcaptain\.app/g) || []).length >= 3, true);
});

test('D-272: wording matches 24-play-forms-deletion.md; in-app path uses real UI labels', () => {
  const h = read('delete-account.html');
  assert.match(h, /<h1>Удаление аккаунта GymCaptain<\/h1>/);
  assert.match(h, /Удалить аккаунт и все данные можно двумя способами\./);
  assert.match(h, /Профиль → Данные → «Удалить все данные»/);
  assert.match(h, /тема «Удаление аккаунта»/);
  assert.match(h, /Мы удалим аккаунт в течение 30 дней и ответим письмом\./);
  assert.match(h, /журнал согласий/);
  assert.match(h, /удаляются через 13 месяцев;/);
  assert.match(h, /по сроку хранения Sentry;/);
  assert.match(h, /политику конфиденциальности<\/a>, раздел 7/);
  assert.match(h, /кнопкой «Удалить все данные»/);

  assert.match(h, /<h1>Delete your GymCaptain account<\/h1>/);
  assert.match(h, /You can delete your account and all your data in two ways\./);
  assert.match(h, /Profile → Data → “Delete all data”/);
  assert.match(h, /subject “Account deletion”/);
  assert.match(h, /We will delete the account within 30 days and confirm by email\./);
  assert.match(h, /the consent log/);
  assert.match(h, /deleted after 13 months;/);
  assert.match(h, /Sentry’s retention period;/);
  assert.match(h, /with “Delete all data”/);

  assert.match(h, /<h1>GymCaptain konta dzēšana<\/h1>/);
  assert.match(h, /Kontu un visus datus vari dzēst divos veidos\./);
  assert.match(h, /Profils → Dati → “Dzēst visus datus”/);
  assert.match(h, /tēmu “Konta dzēšana”/);
  assert.match(h, /Mēs dzēsīsim kontu 30 dienu laikā un nosūtīsim apstiprinājumu e-pastā\./);
  assert.match(h, /piekrišanas žurnāls/);
  assert.match(h, /pēc 13 mēnešiem;/);
  assert.match(h, /Sentry glabāšanas termiņā;/);
  assert.match(h, /pogu “Dzēst visus datus”/);

  // Brief said «Удалить аккаунт», but the real button is «Удалить все данные» — page follows the UI.
  assert.doesNotMatch(h, /→ «Удалить аккаунт»/);
  assert.doesNotMatch(h, /→ “Delete account”/);
  assert.doesNotMatch(h, /→ “Dzēst kontu”/);
  const feat = read('features.js');
  assert.match(feat, /id="wipe"[^>]*>🗑 Удалить все данные/);
  const d2 = read('i18n/dict2.js');
  assert.match(d2, /\['🗑 Удалить все данные','🗑 Delete all data','🗑 Dzēst visus datus'\]/);
  const d3 = read('i18n/dict3.js');
  assert.match(d3, /\['Профиль','Profile','Profils'\]/);
  assert.match(d3, /\['Данные','Data','Dati'\]/);
});

test('D-272: delete-account.html is excluded from the service worker cache, like privacy/terms', () => {
  const sw = read('sw.js');
  assert.match(sw, /\(privacy\|terms\|auth-callback\|delete-account\)\\\.html\$\/\.test\(u\.pathname\)\)return;/);
  const precache = sw.slice(0, sw.indexOf('self.addEventListener'));
  assert.doesNotMatch(precache, /delete-account/);
  assert.match(read('cache-ver.js'), /var SW_CACHE='moyzal-v146'/);
  assert.match(read('sw.js'), /const C=SW_CACHE/);
  // GitHub Pages / Play Console link; not bundled into the Android www copy (same as privacy.html).
  const build = read('scripts/build-web.js');
  assert.doesNotMatch(build, /delete-account/);
  assert.doesNotMatch(build, /privacy\.html/);
});
