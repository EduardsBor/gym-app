'use strict';
// D-218: Supabase auth emails via Brevo SMTP — trilingual templates with the 6-digit code; signup shows the code field.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

test('D-218: code templates (signup, magic link) — big {{ .Token }}, link fallback, RU/EN/LV, support address', () => {
  for (const f of ['confirm_signup.html', 'magic_link.html']) {
    const h = read('supabase/templates/' + f);
    assert.equal((h.match(/\{\{ \.Token \}\}/g) || []).length, 1, f);
    assert.match(h, /font-size:34px[^"]*">\{\{ \.Token \}\}</, f);
    assert.match(h, /href="\{\{ \.ConfirmationURL \}\}"/, f);
    for (const l of ['ru', 'en', 'lv']) assert.match(h, new RegExp(`lang="${l}"`), f);
    assert.match(h, /6-значный код[\s\S]*6-digit code[\s\S]*6 ciparu kodu/, f);
    assert.match(h, /mailto:support@gymcaptain\.app/, f);
  }
});

test('D-218: reset template is link-only (the app resets by link); no secrets in templates/docs', () => {
  const r = read('supabase/templates/reset_password.html');
  assert.match(r, /href="\{\{ \.ConfirmationURL \}\}"/);
  assert.doesNotMatch(r, /\.Token/);
  const all = ['supabase/templates/confirm_signup.html', 'supabase/templates/magic_link.html', 'supabase/templates/reset_password.html', 'docs/D-218-SMTP-BREVO.md'].map(read).join('\n');
  assert.doesNotMatch(all, /xsmtpsib-|xkeysib-|sk_live|service_role/i);
  assert.match(read('docs/D-218-SMTP-BREVO.md'), /no-reply@gymcaptain\.app[\s\S]*smtp-relay\.brevo\.com[\s\S]*587/);
});

test('D-218: after sign-up without a session the code field opens (verifyOtp type email)', () => {
  const s = read('sync.js');
  const su = s.slice(s.indexOf('async function doSignup(){'), s.indexOf('async function doLogin(){'));
  assert.match(su, /else\{const box=\$\('#mzotpbox'\);if\(box\) box\.classList\.remove\('hidden'\);msg\('Письмо отправлено\. Нажми ссылку или введи код из письма'\)\}/);
  assert.match(s, /sb\.auth\.verifyOtp\(\{email,token,type:'email'\}\)/);
});
