'use strict';
// A-503: Android (Capacitor) local notifications — rest-timer end + workout reminders.
// Web/PWA: every call is a no-op (no Capacitor native platform), nothing is rendered or requested.
(function (root) {
  const REST_ID = 1001, REM_BASE = 2000; // reminders: 2001..2007 (Capacitor weekday 1=Sun..7=Sat)
  const REM_IDS = [1, 2, 3, 4, 5, 6, 7].map(w => REM_BASE + w);
  const CH_REST = 'gc_rest', CH_REM = 'gc_remind';
  const REM_KEY = 'gc_remind', ASKED_KEY = 'gc_ntf_asked'; // device-only (not synced, not in history)
  const TXT = {
    ru: { restT: 'Отдых закончен — следующий подход', restB: 'Вернись к тренировке в GymCaptain', remT: 'Время тренировки', remB: 'Сегодня по плану тренировка в GymCaptain', chRest: 'Таймер отдыха', chRem: 'Напоминания о тренировке' },
    en: { restT: 'Rest is over — next set', restB: 'Back to your workout in GymCaptain', remT: 'Workout time', remB: 'A workout is planned for today in GymCaptain', chRest: 'Rest timer', chRem: 'Workout reminders' },
    lv: { restT: 'Atpūta beigusies — nākamais piegājiens', restB: 'Atgriezies pie treniņa GymCaptain', remT: 'Laiks treniņam', remB: 'Šodien plānā ir treniņš GymCaptain', chRest: 'Atpūtas taimeris', chRem: 'Treniņu atgādinājumi' }
  };
  const txt = (lang, k) => (TXT[lang] || TXT.ru)[k];
  // JS Date.getDay() (0=Sun..6=Sat) -> Capacitor Weekday (1=Sun..7=Sat)
  const capWeekday = d => ((Math.trunc(+d) % 7) + 7) % 7 + 1;
  // default weekdays from the program's sessions per week (JS getDay numbers)
  const DEF_DAYS = { 1: [3], 2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5], 6: [1, 2, 3, 4, 5, 6], 7: [0, 1, 2, 3, 4, 5, 6] };
  const defaultDays = n => (DEF_DAYS[+n] || DEF_DAYS[3]).slice();
  function parseTime(s) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || '').trim());
    if (!m || +m[1] > 23 || +m[2] > 59) return { hour: 18, minute: 0 };
    return { hour: +m[1], minute: +m[2] };
  }
  const normDays = a => [...new Set((Array.isArray(a) ? a : []).map(Number).filter(d => Number.isInteger(d) && d >= 0 && d <= 6))].sort((x, y) => x - y);
  function normRemind(c, sessions) {
    c = c && typeof c === 'object' ? c : {};
    const t = parseTime(c.time);
    return { on: c.on === true, days: Array.isArray(c.days) ? normDays(c.days) : defaultDays(sessions), time: String(t.hour).padStart(2, '0') + ':' + String(t.minute).padStart(2, '0') };
  }
  // one-shot rest notification at the wall-clock end time; null if already over
  function restNotification(endAt, lang, now) {
    endAt = +endAt; now = now == null ? Date.now() : +now;
    if (!endAt || endAt <= now + 500) return null;
    return { id: REST_ID, title: txt(lang, 'restT'), body: txt(lang, 'restB'), channelId: CH_REST, autoCancel: true,
      schedule: { at: new Date(endAt), allowWhileIdle: true }, extra: { kind: 'rest' } };
  }
  // weekly repeating reminders, one per chosen weekday
  function reminderNotifications(cfg, lang) {
    const c = normRemind(cfg);
    if (!c.on || !c.days.length) return [];
    const t = parseTime(c.time);
    return c.days.map(d => ({ id: REM_BASE + capWeekday(d), title: txt(lang, 'remT'), body: txt(lang, 'remB'), channelId: CH_REM, autoCancel: true,
      schedule: { on: { weekday: capWeekday(d), hour: t.hour, minute: t.minute, second: 0 }, allowWhileIdle: true }, extra: { kind: 'remind' } }));
  }
  const ids = a => ({ notifications: a.map(id => ({ id })) });

  // env: { plugin():LocalNotifications|null, lang():'ru'|'en'|'lv', sessions():n, store:{get,set}, explain(msg):bool, onOpen(kind) }
  function makeNotifier(env) {
    let q = Promise.resolve(), readyP = null;
    const P = () => { try { return env.plugin() || null; } catch (e) { return null; } };
    const run = fn => (q = q.then(() => (P() ? fn(P()) : undefined)).catch(() => undefined));
    function ready(p) {
      if (!readyP) readyP = (async () => {
        const L = env.lang();
        try { await p.createChannel({ id: CH_REST, name: txt(L, 'chRest'), importance: 5, visibility: 1, vibration: true }); } catch (e) {}
        try { await p.createChannel({ id: CH_REM, name: txt(L, 'chRem'), importance: 4, visibility: 1, vibration: true }); } catch (e) {}
        try { await p.addListener('localNotificationActionPerformed', a => { const k = a && a.notification && a.notification.extra && a.notification.extra.kind; env.onOpen && env.onOpen(k || ''); }); } catch (e) {}
      })();
      return readyP;
    }
    async function perm(p, ask) {
      let s = 'denied';
      try { s = (await p.checkPermissions()).display; } catch (e) { return 'denied'; }
      if (s === 'granted' || !ask) return s;
      if (s !== 'prompt' && s !== 'prompt-with-rationale') return s;
      env.store.set(ASKED_KEY, '1');
      if (!env.explain()) return s;
      try { s = (await p.requestPermissions()).display; } catch (e) {}
      return s;
    }
    const remind = () => { let c = null; try { c = JSON.parse(env.store.get(REM_KEY) || 'null'); } catch (e) {} return normRemind(c, env.sessions()); };
    return {
      native: () => !!P(),
      init: () => run(async p => { await ready(p); await applyReminders(p, false); }),
      restStart: endAt => run(async p => {
        await ready(p);
        const s = await perm(p, !env.store.get(ASKED_KEY));
        try { await p.cancel(ids([REST_ID])); } catch (e) {}
        const n = restNotification(endAt, env.lang());
        if (s === 'granted' && n) await p.schedule({ notifications: [n] });
      }),
      restCancel: () => run(async p => { await p.cancel(ids([REST_ID])); }),
      getRemind: remind,
      setRemind: (c, ask) => { const n = normRemind(c, env.sessions()); env.store.set(REM_KEY, JSON.stringify(n)); return run(async p => { await ready(p); return applyReminders(p, ask); }); },
      status: () => (P() ? (async () => {
        const p = P(); let n = 'denied', exact = 'granted';
        try { n = (await p.checkPermissions()).display; } catch (e) {}
        try { if (p.checkExactNotificationSetting) exact = (await p.checkExactNotificationSetting()).exact_alarm || 'granted'; } catch (e) {}
        return { notif: n, exact };
      })() : Promise.resolve(null)),
      askExact: () => run(async p => { if (p.changeExactNotificationSetting) await p.changeExactNotificationSetting(); })
    };
    async function applyReminders(p, ask) {
      try { await p.cancel(ids(REM_IDS)); } catch (e) {}
      const c = remind();
      if (!c.on) return 'off';
      const s = await perm(p, ask);
      if (s !== 'granted') return s;
      const list = reminderNotifications(c, env.lang());
      if (list.length) await p.schedule({ notifications: list });
      return s;
    }
  }

  const api = { REST_ID, REM_BASE, REM_IDS, CH_REST, CH_REM, REM_KEY, ASKED_KEY, TXT, txt, capWeekday, defaultDays, parseTime, normRemind, restNotification, reminderNotifications, makeNotifier };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; return; }
  root.NTF_LIB = api;
  root.NTF = makeNotifier({
    plugin: () => { const C = root.Capacitor; if (!C || typeof C.isNativePlatform !== 'function' || !C.isNativePlatform()) return null; return (C.Plugins && C.Plugins.LocalNotifications) || null; },
    lang: () => (typeof LANG !== 'undefined' ? LANG : 'ru'),
    sessions: () => (typeof S !== 'undefined' && S && +S.days) || 3,
    store: { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } },
    explain: () => confirm('GymCaptain покажет уведомление, когда закончится отдых (даже при выключенном экране), и напомнит о тренировке, если ты включишь напоминания. Разрешить уведомления?'),
    onOpen: () => { try { if (typeof go === 'function') go('today'); } catch (e) {} }
  });
  if (root.NTF.native()) root.NTF.init();
})(typeof window !== 'undefined' ? window : globalThis);
// A-503 settings card (Android build only; on the web ntfCardHTML() returns '' so «Ещё» is unchanged)
function ntfCardHTML() {
  if (typeof NTF === 'undefined' || !NTF.native()) return '';
  const c = NTF.getRemind(), W = [[1, 'Пн'], [2, 'Вт'], [3, 'Ср'], [4, 'Чт'], [5, 'Пт'], [6, 'Сб'], [0, 'Вс']];
  return `<div class="card" id="ntfc"><b>Уведомления</b>
 <label class="li"><span class="grow">🔔 Напоминать о тренировке</span><input type="checkbox" id="rmon" style="width:28px;min-height:28px" ${c.on ? 'checked' : ''}></label>
 <div id="rmbox" class="${c.on ? '' : 'hidden'}"><div class="row" style="flex-wrap:wrap;gap:6px">${W.map(([d, n]) => `<label class="mut" style="display:inline-flex;align-items:center;gap:2px"><input type="checkbox" data-rmd="${d}" ${c.days.includes(d) ? 'checked' : ''}>${n}</label>`).join('')}</div>
 <div class="row"><input type="time" id="rmt" value="${c.time}"></div></div>
 <p class="mut" id="ntfst"></p><button class="full sm hidden" id="ntfex">Разрешить точное время</button></div>`;
}
function ntfCardBind() {
  const box = document.querySelector('#ntfc'); if (!box || typeof NTF === 'undefined') return;
  const $q = s => box.querySelector(s);
  const status = () => NTF.status().then(st => {
    if (!st || !document.body.contains(box)) return;
    const off = st.notif !== 'granted', inex = !off && st.exact !== 'granted';
    $q('#ntfst').textContent = off ? 'Уведомления выключены в настройках Android. Таймер отдыха работает только в открытом приложении.' : inex ? 'Точное время выключено в Android: сигнал отдыха может прийти с опозданием.' : '';
    $q('#ntfex').classList.toggle('hidden', !inex);
  });
  const save = ask => {
    const days = [...box.querySelectorAll('[data-rmd]')].filter(i => i.checked).map(i => +i.dataset.rmd);
    NTF.setRemind({ on: $q('#rmon').checked, days, time: $q('#rmt').value }, ask).then(status);
  };
  $q('#rmon').onchange = e => { $q('#rmbox').classList.toggle('hidden', !e.target.checked); save(e.target.checked); };
  box.querySelectorAll('[data-rmd]').forEach(i => i.onchange = () => save(false));
  $q('#rmt').onchange = () => save(false);
  $q('#ntfex').onclick = () => NTF.askExact().then(status);
  status();
}
