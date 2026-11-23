'use strict';
// D-290: Profile menu order and texts — every card belongs to a section; nothing hangs under the menu.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

const PROFILE_HOOKS = [
  ['#mzacc', 'acc'],
  ['#pwopen', 'acc'],
  ['#progrow', 'prog'],
  ['#obre', 'prog'],
  ['#awequip', 'equip'],
  ['#eqdb', 'equip'],
  ['#snd', 'train'],
  ['#aw', 'train'],
  ['#ro', 'train'],
  ['#bwkg', 'train'],
  ['#ntfc', 'ntf'],
  ['#expcsv', 'data'],
  ['#privdata', 'data'],
  ['#pfdanger', 'data'],
  ['[data-theme]', 'look'],
  ['[data-lang]', 'look'],
  ['#helpc', 'help'],
];

function sections() {
  const src = read('profile.js');
  const m = src.match(/const SECTIONS=(\[[\s\S]*?\n  \]);/);
  assert.ok(m, 'SECTIONS array');
  return vm.runInNewContext('(' + m[1] + ')');
}

test('D-290: cache is moyzal-v166', () => {
  assert.match(read('cache-ver.js'), /var SW_CACHE='moyzal-v166'/);
});

test('D-290: profile.js sections — rename, notifications item, data danger block', () => {
  const S = sections();
  const by = Object.fromEntries(S.map(s => [s.k, s]));
  assert.equal(by.train.t, 'Настройки тренировки');
  assert.equal(by.train.sel.join(','), '#snd,#aw,#ro,#bwkg');
  assert.equal(by.ntf.t, 'Уведомления');
  assert.equal(by.ntf.ic, '🔔');
  assert.equal(by.ntf.sel.join(','), '#ntfc');
  assert.ok(S.findIndex(s => s.k === 'train') < S.findIndex(s => s.k === 'ntf'));
  assert.equal(by.data.sel.join(','), '#expcsv,#privdata,#pfdanger');
  // Empty sections are hidden — Notifications appears only when #ntfc is on the page.
  assert.match(read('profile.js'), /SECTIONS\.filter\(s=>by\[s\.k\]\.length\)/);
  // Nothing hangs under the menu.
  assert.doesNotMatch(read('profile.js'), /rest\.forEach\(c=>app\.append/);
  // Version stays at the bottom of the Profile menu (D-279).
  assert.match(read('profile.js'), /if\(ver\) app\.append\(ver\)/);
});

test('D-290: every Profile card hook belongs to a section', () => {
  const S = sections();
  const found = {};
  for (const s of S) for (const q of s.sel) found[q] = s.k;
  const missing = PROFILE_HOOKS.filter(([q]) => found[q] !== undefined ? false : true);
  assert.deepEqual(missing, [], 'hooks not in SECTIONS: ' + JSON.stringify(missing));
  for (const [q, k] of PROFILE_HOOKS) assert.equal(found[q], k, q);
});

test('D-290: Notifications card is Android-only (NTF.native); web has no item', () => {
  const n = read('notify.js');
  const fn = n.slice(n.indexOf('function ntfCardHTML'), n.indexOf('function ntfCardBind'));
  assert.match(fn, /!NTF\.native\(\)\) return ''/);
  assert.match(fn, /id="ntfc"/);
  // Web/browser build does not force a notifications row.
  assert.doesNotMatch(read('profile.js'), /NTF\.native\(\)/);
});

test('D-290: do not touch the «Тренировки» tab', () => {
  assert.match(read('index.html'), /<button data-v="today">🏋️<span>Тренировки<\/span><\/button>/);
  const a = read('app.js');
  assert.match(a, /\$\('#title'\)\.textContent='Тренировки'/);
  assert.doesNotMatch(a, /data-v="today"[^>]*>Настройки тренировки/);
});

test('D-290: reset is local-only clear; danger block also has account deletion', () => {
  const a = read('app.js');
  assert.match(a, /id="pfdanger"/);
  assert.match(a, /id="reset">Очистить данные на этом телефоне</);
  assert.doesNotMatch(a, /Сбросить все данные/);
  assert.match(a, /confirm\('Удалятся данные только на этом устройстве\. Аккаунт, копия в облаке и подписка останутся\. Чтобы удалить аккаунт и данные в облаке — «Удалить аккаунт»\.'\)/);
  const f = read('features.js');
  assert.doesNotMatch(f, /#reset'\)\;if\(r\)r\.remove/);
  assert.doesNotMatch(f, /r\.remove\(\)/);
  assert.match(f, /id="privdata"/);
  assert.match(f, /id="wipe"[^>]*>Удалить аккаунт</);
  assert.match(f, /priv\.after\(danger\)/);
  // Account deletion (D-271/D-272) is still wipeAll / mzDeleteCloud.
  assert.match(f, /\$\('#wipe'\)\.onclick=wipeAll/);
  assert.match(read('sync.js'), /window\.mzDeleteCloud=mzDeleteCloud/);
});

test('D-290: Premium shows the demo line until A-502, on the screen and in the menu row', () => {
  const f = read('features.js');
  assert.match(f, /id="pwdemo">Демо — оплата ещё не подключена</);
  assert.match(f, /id="pwrow">Демо — оплата ещё не подключена</);
});

test('D-290: Аккаунт row status — email or «Не выполнен вход», plus short sync status', () => {
  const s = read('sync.js');
  assert.match(s, /window\.mzAccountRowStatus=mzAccountRowStatus/);
  const fn = s.slice(s.indexOf('function mzAccountRowStatus(){'), s.indexOf('window.mzAccountRowStatus'));
  const ctx = { user: null, status: 'off' };
  const run = () => vm.runInNewContext('mzAccountRowStatus()', Object.assign(ctx, { mzAccountRowStatus: vm.runInNewContext('(' + fn + ')', ctx) }));
  // Re-eval with a shared context so `user`/`status` closures work.
  const bag = { user: null, status: 'off' };
  vm.runInNewContext(fn + '; this.fn = mzAccountRowStatus;', bag);
  bag.user = null; bag.status = 'off';
  assert.equal(bag.fn(), 'Не выполнен вход');
  bag.status = 'offline';
  assert.equal(bag.fn(), 'Не выполнен вход · Нет сети');
  bag.status = 'err';
  assert.equal(bag.fn(), 'Не выполнен вход · Ошибка синхронизации');
  bag.user = { email: 'a@b.c' }; bag.status = 'ok';
  assert.equal(bag.fn(), 'a@b.c · Синхронизировано');
  bag.status = 'syncing';
  assert.equal(bag.fn(), 'a@b.c · Синхронизация…');
  bag.status = 'offline';
  assert.equal(bag.fn(), 'a@b.c · Нет сети');
  bag.status = 'err';
  assert.equal(bag.fn(), 'a@b.c · Ошибка синхронизации');
  assert.match(read('profile.js'), /mzAccountRowStatus\(\)/);
});

test('D-290: RU/EN/LV triples and LV-NEW file; LV-проверка / LV-REVIEW untouched', () => {
  const d3 = read('i18n/dict3.js');
  const rows = [
    "['Настройки тренировки','Workout settings','Treniņa iestatījumi']",
    "['Напоминания о тренировке и таймер отдыха','Workout reminders and the rest timer','Atgādinājumi par treniņu un atpūtas taimeris']",
    "['Очистить данные на этом телефоне','Clear data on this phone','Notīrīt datus šajā tālrunī']",
    "['Удалить аккаунт','Delete account','Dzēst kontu']",
    "['Демо — оплата ещё не подключена','Demo — payments are not connected yet','Demo — maksājumi vēl nav pieslēgti']",
    "['Не выполнен вход','Not signed in','Nav ieiets kontā']",
    "['Нет сети','No network','Nav tīkla']",
    "['Ошибка синхронизации','Sync error','Sinhronizācijas kļūda']",
  ];
  for (const r of rows) assert.match(d3, new RegExp(r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(d3, /Удалятся данные только на этом устройстве/);
  const lv = read('docs/LV-NEW-D290.md');
  for (const s of ['Treniņa iestatījumi', 'Notīrīt datus šajā tālrunī', 'Dzēst kontu', 'Demo — maksājumi vēl nav pieslēgti', 'Nav ieiets kontā', 'Nav tīkla', 'Sinhronizācijas kļūda']) {
    assert.match(lv, new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.ok(fs.existsSync(path.join(root, 'docs/LV-NEW-D290.md')));
});
