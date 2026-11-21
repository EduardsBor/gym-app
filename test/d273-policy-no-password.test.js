'use strict';
// D-273: policy §3.1 no longer describes password sign-in (Eduards 20.11 / 21.11).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

test('D-273: privacy.html and legal.js have no leftover password-sign-in wording in §3.1', () => {
  const banned = [
    'паролем (не короче 6',
    'password (at least 6',
    'ar paroli (vismaz 6',
    'сбросом пароля',
    'password-reset',
    'paroles atjaunošanas'
  ];
  for (const f of ['privacy.html', 'legal.js']) {
    const h = read(f);
    for (const s of banned) {
      assert.doesNotMatch(h, new RegExp(s.replace(/[()]/g, '\\$&')), `${f} still has «${s}»`);
    }
    assert.match(h, /Редакция от 21\.11\.2026/);
    assert.match(h, /Войти можно одноразовым кодом или ссылкой из письма — пароль не нужен\./);
    assert.match(h, /You sign in with a one-time code or link from an email — no password is needed\./);
    assert.match(h, /Pieteikties var ar vienreizēju kodu vai saiti no vēstules — parole nav nepieciešama\./);
  }
  assert.doesNotMatch(read('sync.js'), /PASSWORD_RECOVERY/);
});
