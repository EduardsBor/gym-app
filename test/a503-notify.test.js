'use strict';
// A-503: Android local notifications — rest timer + workout reminders. Plugin mocked; web is a no-op.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const N = require('../notify.js');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

function mockPlugin(display = 'granted', after = 'granted') {
  const log = [];
  const p = {
    log, display,
    checkPermissions: async () => (log.push(['check']), { display: p.display }),
    requestPermissions: async () => (log.push(['request']), (p.display = after), { display: after }),
    checkExactNotificationSetting: async () => ({ exact_alarm: 'denied' }),
    changeExactNotificationSetting: async () => (log.push(['exact']), { exact_alarm: 'granted' }),
    createChannel: async c => log.push(['channel', c.id, c.importance, c.vibration]),
    addListener: async (ev, fn) => { log.push(['listen', ev]); p.fire = fn; },
    schedule: async o => log.push(['schedule', o.notifications]),
    cancel: async o => log.push(['cancel', o.notifications.map(n => n.id)])
  };
  return p;
}
function env(plugin, o = {}) {
  const st = new Map(Object.entries(o.store || {}));
  const e = { opened: [], explained: 0,
    plugin: () => plugin, lang: () => o.lang || 'ru', sessions: () => o.days || 3,
    store: { get: k => (st.has(k) ? st.get(k) : null), set: (k, v) => st.set(k, v) },
    explain: () => (e.explained++, o.explain !== false), onOpen: k => e.opened.push(k), st };
  return e;
}
const settle = () => new Promise(r => setTimeout(r, 0));
const kinds = (log, k) => log.filter(x => x[0] === k);

test('rest notification: wall-clock end time, channel, text by language', () => {
  const now = Date.UTC(2026, 10, 16, 10, 0, 0);
  const n = N.restNotification(now + 90000, 'ru', now);
  assert.equal(n.id, N.REST_ID);
  assert.equal(n.schedule.at.getTime(), now + 90000);
  assert.equal(n.schedule.allowWhileIdle, true);
  assert.equal(n.channelId, N.CH_REST);
  assert.equal(n.title, 'Отдых закончен — следующий подход');
  assert.equal(N.restNotification(now + 90000, 'en', now).title, 'Rest is over — next set');
  assert.equal(N.restNotification(now + 90000, 'lv', now).title, 'Atpūta beigusies — nākamais piegājiens');
  assert.equal(N.restNotification(now + 90000, 'xx', now).title, 'Отдых закончен — следующий подход');
  assert.equal(N.restNotification(now + 100, 'ru', now), null, 'already over -> nothing');
  assert.equal(N.restNotification(0, 'ru', now), null);
  assert.equal(JSON.parse(JSON.stringify(n)).schedule.at, new Date(now + 90000).toISOString(), 'serializes to plugin date format');
});

test('weekday mapping JS getDay -> Capacitor Weekday (1=Sun..7=Sat)', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(N.capWeekday), [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(N.capWeekday(7), 1);
  assert.equal(N.capWeekday(-1), 7);
});

test('default reminder days from program sessions per week; time parsing', () => {
  assert.deepEqual(N.defaultDays(2), [1, 4]);
  assert.deepEqual(N.defaultDays(3), [1, 3, 5]);
  assert.deepEqual(N.defaultDays(4), [1, 2, 4, 5]);
  assert.deepEqual(N.defaultDays(5), [1, 2, 3, 4, 5]);
  assert.deepEqual(N.defaultDays(6), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(N.defaultDays(undefined), [1, 3, 5]);
  const d = N.normRemind(null, 4);
  assert.deepEqual(d, { on: false, days: [1, 2, 4, 5], time: '18:00' }, 'off by default');
  assert.deepEqual(N.parseTime('7:05'), { hour: 7, minute: 5 });
  assert.deepEqual(N.parseTime('25:00'), { hour: 18, minute: 0 });
  assert.deepEqual(N.normRemind({ on: true, days: [5, 1, 1, 9, 'x'], time: '6:30' }).days, [1, 5]);
  assert.equal(N.normRemind({ on: true, time: '6:30' }).time, '06:30');
});

test('reminders: one weekly notification per chosen day, ids stable, language', () => {
  const l = N.reminderNotifications({ on: true, days: [1, 3, 0], time: '07:30' }, 'en');
  assert.deepEqual(l.map(n => n.id), [2001, 2002, 2004]);
  assert.deepEqual(l.map(n => n.schedule.on.weekday), [1, 2, 4]);
  l.forEach(n => { assert.equal(n.schedule.on.hour, 7); assert.equal(n.schedule.on.minute, 30); assert.equal(n.channelId, N.CH_REM); assert.equal(n.title, 'Workout time'); });
  assert.ok(l.every(n => N.REM_IDS.includes(n.id)));
  assert.deepEqual(N.reminderNotifications({ on: false, days: [1] }, 'ru'), []);
  assert.deepEqual(N.reminderNotifications({ on: true, days: [] }, 'ru'), []);
});

test('web: no plugin -> everything is a no-op, no errors', async () => {
  const e = env(null);
  const n = N.makeNotifier(e);
  assert.equal(n.native(), false);
  await n.restStart(Date.now() + 60000); await n.restCancel(); await n.setRemind({ on: true }, true); await n.init();
  assert.equal(await n.status(), null);
  assert.equal(e.explained, 0);
});

test('rest timer: first start asks permission once with explanation, schedules; skip cancels; extend reschedules', async () => {
  const p = mockPlugin('prompt', 'granted'); const e = env(p);
  const n = N.makeNotifier(e);
  const end = Date.now() + 90000;
  await n.restStart(end);
  assert.equal(e.explained, 1);
  assert.equal(kinds(p.log, 'request').length, 1);
  assert.deepEqual(kinds(p.log, 'channel').map(x => x.slice(1)), [[N.CH_REST, 5, true], [N.CH_REM, 4, true]]);
  let s = kinds(p.log, 'schedule');
  assert.equal(s.length, 1); assert.equal(s[0][1][0].schedule.at.getTime(), end);
  await n.restStart(end + 30000); // +30 s
  s = kinds(p.log, 'schedule');
  assert.equal(s.length, 2); assert.equal(s[1][1][0].schedule.at.getTime(), end + 30000);
  assert.equal(e.explained, 1, 'not asked again');
  assert.ok(kinds(p.log, 'cancel').length >= 2, 'cancel before each reschedule');
  await n.restCancel();
  assert.deepEqual(p.log[p.log.length - 1], ['cancel', [N.REST_ID]]);
  // tap opens the workout
  p.fire({ notification: { extra: { kind: 'rest' } } });
  assert.deepEqual(e.opened, ['rest']);
});

test('rest timer: permission denied -> no schedule, asked only once, no throw', async () => {
  const p = mockPlugin('prompt', 'denied'); const e = env(p);
  const n = N.makeNotifier(e);
  await n.restStart(Date.now() + 60000);
  await n.restStart(Date.now() + 60000);
  assert.equal(kinds(p.log, 'schedule').length, 0);
  assert.equal(kinds(p.log, 'request').length, 1);
  assert.equal(e.st.get(N.ASKED_KEY), '1');
  // explanation declined -> system dialog not shown
  const p2 = mockPlugin('prompt'); const e2 = env(p2, { explain: false });
  await N.makeNotifier(e2).restStart(Date.now() + 60000);
  assert.equal(kinds(p2.log, 'request').length, 0);
  assert.equal(kinds(p2.log, 'schedule').length, 0);
});

test('reminders: enable schedules, change reschedules, disable cancels all; stored device-only', async () => {
  const p = mockPlugin('granted'); const e = env(p, { lang: 'lv', days: 2 });
  const n = N.makeNotifier(e);
  assert.deepEqual(n.getRemind(), { on: false, days: [1, 4], time: '18:00' });
  await n.setRemind({ on: true, days: [1, 4], time: '19:15' }, true);
  let s = kinds(p.log, 'schedule');
  assert.deepEqual(s[0][1].map(x => x.id), [2002, 2005]);
  assert.equal(s[0][1][0].title, 'Laiks treniņam');
  await n.setRemind({ on: true, days: [2], time: '08:00' }, false);
  s = kinds(p.log, 'schedule');
  assert.deepEqual(s[1][1].map(x => [x.id, x.schedule.on.hour]), [[2003, 8]]);
  const before = kinds(p.log, 'cancel').length;
  await n.setRemind({ on: false, days: [2], time: '08:00' }, false);
  const c = kinds(p.log, 'cancel');
  assert.equal(c.length, before + 1);
  assert.deepEqual(c[c.length - 1][1], N.REM_IDS);
  assert.equal(kinds(p.log, 'schedule').length, 2);
  assert.equal(JSON.parse(e.st.get(N.REM_KEY)).on, false);
  // init (app start) re-applies saved reminders without asking
  e.st.set(N.REM_KEY, JSON.stringify({ on: true, days: [6], time: '10:00' }));
  await N.makeNotifier(e).init();
  assert.deepEqual(kinds(p.log, 'schedule').pop()[1].map(x => x.id), [2007]);
  await settle();
});

test('status reports notifications off and inexact alarms', async () => {
  const p = mockPlugin('denied');
  const st = await N.makeNotifier(env(p)).status();
  assert.deepEqual(st, { notif: 'denied', exact: 'denied' });
});

test('wiring: native-only, loaded on web without UI, packaged, cached', () => {
  const nt = read('notify.js');
  assert.match(nt, /isNativePlatform\(\)/);
  assert.match(nt, /if \(typeof NTF === 'undefined' \|\| !NTF\.native\(\)\) return ''/);
  assert.match(read('index.html'), /<script src="notify.js"><\/script>/);
  assert.match(read('sw.js'), /'notify.js'/);
  assert.match(read('scripts/build-web.js'), /'notify.js'/);
  const app = read('app.js');
  assert.match(app, /NTF\.restStart\(tEnd\)\}\n/);
  assert.equal((app.match(/NTF\.restStart\(tEnd\)/g) || []).length, 2, 'start + extend');
  assert.match(app, /NTF\.restCancel\(\)/);
  assert.match(app, /ntfCardHTML\(\)/);
  const man = read('android/app/src/main/AndroidManifest.xml');
  assert.match(man, /POST_NOTIFICATIONS/);
  assert.match(man, /SCHEDULE_EXACT_ALARM/);
  assert.doesNotMatch(man, /uses-permission[^>]*USE_EXACT_ALARM/);
  const pkg = JSON.parse(read('package.json'));
  assert.ok(pkg.devDependencies['@capacitor/local-notifications']);
});

test('i18n: new UI strings have EN/LV', () => {
  const ctx = {}; require('vm').runInNewContext(read('i18n/dict3.js') + ';this.D=DICT3', ctx);
  const m = new Map(ctx.D.map(r => [r[0], r]));
  ['Уведомления', 'Напоминать о тренировке', 'Разрешить точное время'].forEach(k => { assert.ok(m.get(k) && m.get(k)[1] && m.get(k)[2], k); });
  for (const L of ['ru', 'en', 'lv']) for (const k of ['restT', 'restB', 'remT', 'remB', 'chRest', 'chRem']) assert.ok(N.TXT[L][k], L + k);
});

test('rest timer on Android 14+: if exact alarms are denied, ask once and open settings; schedule still happens', async () => {
  const p = mockPlugin('granted'); const e = env(p);
  e.explainedExact = 0;
  e.explainExact = () => (e.explainedExact++, true);
  const n = N.makeNotifier(e);
  await n.restStart(Date.now() + 90000);
  assert.equal(kinds(p.log, 'schedule').length, 1, 'inexact/exact schedule still requested');
  assert.equal(e.explainedExact, 1);
  assert.equal(kinds(p.log, 'exact').length, 1, 'opens exact-alarm settings');
  assert.equal(e.st.get(N.EXACT_ASKED_KEY), '1');
  await n.restStart(Date.now() + 90000);
  assert.equal(e.explainedExact, 1, 'asked only once');
  assert.equal(kinds(p.log, 'exact').length, 1);
});

test('rest timer: no exact-alarm prompt when the hook is absent (existing callers)', async () => {
  const p = mockPlugin('granted'); const e = env(p);
  await N.makeNotifier(e).restStart(Date.now() + 90000);
  assert.equal(kinds(p.log, 'schedule').length, 1);
  assert.equal(kinds(p.log, 'exact').length, 0);
  assert.equal(e.st.get(N.EXACT_ASKED_KEY), '1');
});
