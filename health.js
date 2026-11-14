'use strict';
// Calories and heart rate. No watch required: MET estimate from body weight,
// duration and block intensity. If a heart-rate source is connected, calories
// use Keytel et al. 2005 and fall back to MET where the signal has gaps.
//
// Sources plug in behind `hr` (connect / onSample / disconnect, source
// 'ble' | 'manual' | 'healthkit' | 'healthconnect'). See docs/health-integration.md.
//
// MET: Ainsworth et al. 2011 Compendium of Physical Activities.
//   kcal = MET × kg × hours × sexFactor. sexFactor is 1 (male) or 0.9 (female)
//   when sex is known; unknown sex stays 1 (no guessed sex).
//   Warm-up 3.0 and cool-down 2.3 are low. Strength is 6.0 vigorous for
//   multi-joint compounds and 3.5 moderate for isolation and core (02052 / 02054).
//   Cardio METs are per exercise type.
// Keytel LR et al. (2005) J Sports Sci 23(3):289–297. kJ/min, ÷ 4.184 → kcal/min.
//   Men:   −55.0969 + 0.6309×HR + 0.1988×kg + 0.2017×age
//   Women: −20.4022 + 0.4472×HR − 0.1263×kg + 0.074×age
// Zones: Tanaka et al. 2001, HRmax = 208 − 0.7×age. Five zones at 60/70/80/90%.
//   Zone 1 is everything under 60%.

var MET_WARM = 3;
var MET_COOL = 2.3;
var MET_MODERATE = 3.5;
var MET_VIGOROUS = 6;
var HR_GAP_MS = 20000;
var HR_SOURCES = ['ble', 'manual', 'healthkit', 'healthconnect'];
var KCAL_LABEL = '≈ ккал, примерно';
// D-208: the Bluetooth heart-rate monitor UI is removed (no connect button, no store-version promise).
// The hr module stays dormant so old workouts with heart-rate summaries still display; nothing is deleted.

var CARDIO_MET = {
  tm: 8, bike: 6.8, ell: 5, rowm: 7, stair: 9, jump: 8, wlk: 4.3,
  'mk-treadmill-run': 8, 'mk-indoor-cycling-spin': 6.8, 'mk-elliptical': 5, 'mk-rowing-machine-steady-state': 7, 'mk-incline-treadmill-walk': 4.3,
  'jump-rope': 11, 'air-bike': 8.8, 'ski-erg': 7
};
var VIGOROUS = {
  bp: 1, dbp: 1, ibp: 1, idb: 1, dip: 1, pu: 1, mch: 1, dpu: 1, cgb: 1, 'mk-parralel-bar-dips': 1, 'mk-diamond-push-ups': 1,
  'mk-barbell-deadlift': 1, dl: 1, pull: 1, lat: 1, row: 1, dbr: 1, cr: 1, inv: 1, chin: 1,
  sq: 1, fsq: 1, lp: 1, rdl: 1, lun: 1, bss: 1, ht: 1, gsq: 1, bwsq: 1, step: 1, dbrdl: 1, nlc: 1, sglb: 1, 'mk-dumbbell-step-up-low': 1, 'mk-dumbbell-stiff-leg-deadlift': 1,
  ohp: 1, dsp: 1, ppu: 1, ur: 1, 'mk-barbell-upright-row': 1
};

function metOf(exId, group) {
  if (Object.prototype.hasOwnProperty.call(CARDIO_MET, exId)) return CARDIO_MET[exId];
  if (VIGOROUS[exId]) return MET_VIGOROUS;
  if (group === 'Кардио') return 6;
  return MET_MODERATE;
}
function sexFactor(sex) { return sex === 'f' ? 0.9 : 1; }
function metKcal(o) {
  o = o || {};
  if (!(o.kg > 0) || !(o.minutes > 0) || !(o.met > 0)) return 0;
  return o.met * o.kg * (o.minutes / 60) * sexFactor(o.sex);
}
function keytelKcalPerMin(o) {
  o = o || {};
  if (!(o.bpm > 0) || !(o.kg > 0) || !(o.age > 0)) return 0;
  var kj;
  if (o.sex === 'm') kj = -55.0969 + 0.6309 * o.bpm + 0.1988 * o.kg + 0.2017 * o.age;
  else if (o.sex === 'f') kj = -20.4022 + 0.4472 * o.bpm - 0.1263 * o.kg + 0.074 * o.age;
  else return 0;
  return Math.max(0, kj / 4.184);
}
function hrMaxAge(age) { return 208 - 0.7 * age; }
function zoneIndex(bpm, age) {
  if (!(age > 0) || !(bpm > 0)) return 0;
  var p = bpm / hrMaxAge(age);
  if (p < 0.6) return 0;
  if (p < 0.7) return 1;
  if (p < 0.8) return 2;
  if (p < 0.9) return 3;
  return 4;
}
function itemBlockMin(it) {
  it = it || {};
  if (Object.prototype.hasOwnProperty.call(CARDIO_MET, it.exId) || it.group === 'Кардио') {
    var m = +it.max || +it.min || 0;
    return m > 0 ? m : 0;
  }
  var n = 0;
  if (Array.isArray(it.sets)) n = it.sets.length;
  else if (+it.sets > 0) n = +it.sets;
  if (!(n > 0)) return 0;
  var rest = it.rest != null && it.rest !== '' ? +it.rest : 90;
  var work = it.sec ? (((+it.min || 0) + (+it.max || 0)) / 2 || 30) : 40;
  return n * (work + (rest || 0)) / 60;
}
function sessionBlocks(session) {
  session = session || {};
  var parts = [];
  var warm = Math.max(0, +session.warmMin || 0);
  var cool = Math.max(0, +session.coolMin || 0);
  if (warm) parts.push({ kind: 'warmup', minutes: warm, met: MET_WARM });
  (session.items || []).forEach(function (it) {
    var minutes = itemBlockMin(it);
    if (!(minutes > 0)) return;
    var cardio = Object.prototype.hasOwnProperty.call(CARDIO_MET, it.exId) || it.group === 'Кардио';
    parts.push({ kind: cardio ? 'cardio' : 'strength', exId: it.exId, minutes: minutes, met: metOf(it.exId, it.group) });
  });
  if (cool) parts.push({ kind: 'cooldown', minutes: cool, met: MET_COOL });
  var planned = parts.reduce(function (s, p) { return s + p.minutes; }, 0);
  var elapsed = +session.elapsedMin || 0;
  if (!(elapsed > 0)) return parts;
  if (!(planned > 0)) return [{ kind: 'strength', minutes: elapsed, met: MET_MODERATE }];
  var k = elapsed / planned;
  return parts.map(function (p) {
    var n = {};
    for (var key in p) n[key] = p[key];
    n.minutes = p.minutes * k;
    return n;
  });
}
function cleanSamples(samples) {
  return (samples || []).filter(function (s) { return s && s.bpm > 0 && s.t != null && isFinite(+s.t); })
    .map(function (s) { return { t: +s.t, bpm: +s.bpm }; })
    .sort(function (a, b) { return a.t - b.t; });
}
function hrStats(samples, age) {
  var s = cleanSamples(samples);
  if (!s.length) return null;
  var max = s[0].bpm, wsum = 0, w = 0, zones = [0, 0, 0, 0, 0], i, dt;
  for (i = 1; i < s.length; i++) {
    if (s[i].bpm > max) max = s[i].bpm;
    dt = s[i].t - s[i - 1].t;
    if (dt <= 0 || dt > HR_GAP_MS) continue;
    wsum += s[i - 1].bpm * dt;
    w += dt;
    if (age > 0) zones[zoneIndex(s[i - 1].bpm, age)] += dt / 1000;
  }
  if (s[0].bpm > max) max = s[0].bpm;
  var avg = w ? wsum / w : s.reduce(function (a, x) { return a + x.bpm; }, 0) / s.length;
  return { avg: avg, max: max, zones: age > 0 ? zones.map(function (n) { return Math.round(n); }) : null };
}
function estimateKcal(session, profile) {
  session = session || {};
  profile = profile || {};
  var blocks = sessionBlocks(session);
  var met = 0;
  blocks.forEach(function (b) { met += metKcal({ kg: profile.kg, minutes: b.minutes, met: b.met, sex: profile.sex }); });
  if (!(profile.kg > 0)) return { kcal: null, kcalSource: 'met', blocks: blocks };
  var elapsedMs = Math.max(0, (+session.elapsedMin || 0) * 60000);
  var samples = cleanSamples(session.samples);
  var sexOk = profile.sex === 'm' || profile.sex === 'f';
  if (!sexOk || !(profile.age > 0) || samples.length < 2 || !(elapsedMs > 0)) return { kcal: Math.round(met), kcalSource: 'met', blocks: blocks };
  var start = session.start != null ? +session.start : samples[0].t;
  var end = session.end != null ? +session.end : start + elapsedMs;
  var span = Math.max(0, end - start) || elapsedMs;
  var pts = samples.filter(function (s) { return s.t >= start && s.t <= end; });
  var hrKcal = 0, covered = 0, i, dt;
  for (i = 1; i < pts.length; i++) {
    dt = pts[i].t - pts[i - 1].t;
    if (dt <= 0 || dt > HR_GAP_MS) continue;
    hrKcal += keytelKcalPerMin({ bpm: pts[i - 1].bpm, kg: profile.kg, age: profile.age, sex: profile.sex }) * (dt / 60000);
    covered += dt;
  }
  var uncovered = Math.max(0, span - covered);
  var kcal = hrKcal + (span > 0 ? met / span : 0) * uncovered;
  return { kcal: Math.max(0, Math.round(kcal)), kcalSource: covered > 0 ? 'hr' : 'met', blocks: blocks };
}
function summarizeHealth(session, profile) {
  profile = profile || {};
  var est = estimateKcal(session, profile);
  var out = {};
  if (est.kcal != null) { out.kcal = est.kcal; out.kcalSource = est.kcalSource; }
  var stats = hrStats(session && session.samples, profile.age || 0);
  if (stats) {
    var hrOut = { avg: Math.round(stats.avg), max: Math.round(stats.max) };
    if (HR_SOURCES.indexOf(session && session.hrSource) >= 0) hrOut.source = session.hrSource;
    if (stats.zones) {
      hrOut.zones = stats.zones;
      hrOut.hrMax = Math.round(hrMaxAge(profile.age) * 10) / 10;
    }
    out.hr = hrOut;
  }
  return out;
}
function applyHealthFields(workout, summary) {
  if (!workout || !summary) return workout;
  if (summary.kcal != null && isFinite(+summary.kcal)) workout.kcal = Math.round(+summary.kcal);
  if (summary.kcalSource === 'hr' || summary.kcalSource === 'met') workout.kcalSource = summary.kcalSource;
  if (summary.hr && typeof summary.hr === 'object') {
    var hrOut = {};
    if (HR_SOURCES.indexOf(summary.hr.source) >= 0) hrOut.source = summary.hr.source;
    if (isFinite(+summary.hr.avg)) hrOut.avg = Math.round(+summary.hr.avg);
    if (isFinite(+summary.hr.max)) hrOut.max = Math.round(+summary.hr.max);
    if (Array.isArray(summary.hr.zones) && summary.hr.zones.length === 5) hrOut.zones = summary.hr.zones.map(function (n) { return Math.max(0, Math.round(+n || 0)); });
    if (isFinite(+summary.hr.hrMax)) hrOut.hrMax = Math.round(+summary.hr.hrMax * 10) / 10;
    workout.hr = hrOut;
  }
  return workout;
}
function readWorkoutHealth(w) {
  w = w || {};
  var hrIn = w.hr && typeof w.hr === 'object' ? w.hr : null;
  return {
    kcal: w.kcal == null || !isFinite(+w.kcal) ? null : Math.round(+w.kcal),
    kcalSource: w.kcalSource === 'hr' || w.kcalSource === 'met' ? w.kcalSource : null,
    hr: hrIn ? {
      source: HR_SOURCES.indexOf(hrIn.source) >= 0 ? hrIn.source : null,
      avg: isFinite(+hrIn.avg) ? Math.round(+hrIn.avg) : null,
      max: isFinite(+hrIn.max) ? Math.round(+hrIn.max) : null,
      zones: Array.isArray(hrIn.zones) && hrIn.zones.length === 5 ? hrIn.zones.map(function (n) { return Math.max(0, Math.round(+n || 0)); }) : null,
      hrMax: isFinite(+hrIn.hrMax) ? +hrIn.hrMax : null
    } : null
  };
}
function historyKcalText(w) {
  var h = readWorkoutHealth(w);
  if (h.kcal == null) return '';
  return ' · ≈ ' + h.kcal + ' ккал, примерно';
}
function kcalPhrase(kcal) {
  if (kcal == null || !isFinite(+kcal)) return '';
  return '≈ ' + Math.round(+kcal) + ' ккал, примерно';
}
function hrConnectOffer(hasBluetooth, source) {
  return 'none'; // D-208: no heart-rate connection offered
}

var hr = {
  source: 'ble',
  status: 'idle',
  bpm: null,
  lastSampleAt: 0,
  connected: false,
  deviceName: '',
  _samples: new Set(),
  _statuses: new Set(),
  _adapter: null,
  onSample: function (fn) { this._samples.add(fn); return function () { hr._samples.delete(fn); }; },
  onStatus: function (fn) { this._statuses.add(fn); return function () { hr._statuses.delete(fn); }; },
  ingest: function (bpm, t, source) {
    var sample = { t: t == null ? Date.now() : +t, bpm: Math.round(+bpm), source: source || this.source };
    if (!(sample.bpm >= 30) || sample.bpm > 230) return null;
    this.bpm = sample.bpm;
    this.lastSampleAt = sample.t;
    this._samples.forEach(function (fn) { try { fn(sample); } catch (e) {} });
    return sample;
  },
  connect: function () { return bleConnect(); },
  disconnect: function () { return bleDisconnect(); },
  use: function (adapter) {
    if (adapter && HR_SOURCES.indexOf(adapter.source) < 0) throw new Error('bad-source');
    bleDisconnect();
    if (!adapter) { this._adapter = null; this.source = 'ble'; return; }
    this._adapter = adapter;
    this.source = adapter.source;
  },
  ready: function (name) {
    this.connected = true;
    this.status = 'live';
    if (name) this.deviceName = name;
    emitStatus();
  },
  fail: function () {
    this.connected = false;
    this.status = 'disconnected';
    emitStatus();
  }
};
function emitStatus() { hr._statuses.forEach(function (fn) { try { fn(hr.status); } catch (e) {} }); }

var _device = null, _char = null, _userStop = false, _reconnectTimer = null, _attempt = 0, _valueHandler = null;
function parseHeartRateMeasurement(view) {
  if (!view || view.byteLength < 2) return null;
  var flags = view.getUint8(0);
  var bpm = (flags & 1) ? (view.byteLength >= 3 ? view.getUint16(1, true) : null) : view.getUint8(1);
  if (bpm == null || bpm < 30 || bpm > 230) return null;
  return bpm;
}
function onHrValue(ev) {
  try {
    var bpm = parseHeartRateMeasurement(ev.target.value);
    if (bpm) hr.ingest(bpm, Date.now(), 'ble');
  } catch (e) {}
}
async function bleAttach(device) {
  var server = await device.gatt.connect();
  var service = await server.getPrimaryService('heart_rate');
  var ch = await service.getCharacteristic('heart_rate_measurement');
  _char = ch;
  if (_valueHandler) { try { ch.removeEventListener('characteristicvaluechanged', _valueHandler); } catch (e) {} }
  _valueHandler = onHrValue;
  ch.addEventListener('characteristicvaluechanged', _valueHandler);
  await ch.startNotifications();
  hr.connected = true;
  hr.status = 'live';
  hr.source = hr._adapter ? hr.source : 'ble';
  _attempt = 0;
  emitStatus();
}
function scheduleReconnect() {
  if (_userStop || !_device) return;
  clearTimeout(_reconnectTimer);
  var wait = Math.min(15000, 1000 * Math.pow(2, _attempt));
  _attempt++;
  hr.status = 'reconnecting';
  emitStatus();
  _reconnectTimer = setTimeout(function () { bleReconnect(); }, wait);
}
async function bleReconnect() {
  if (_userStop || !_device) return;
  try { await bleAttach(_device); }
  catch (e) { hr.connected = false; hr.status = 'disconnected'; emitStatus(); if (!_userStop) scheduleReconnect(); }
}
function onGattGone() {
  hr.connected = false;
  if (_userStop) { hr.status = 'disconnected'; emitStatus(); return; }
  scheduleReconnect();
}
async function bleConnect() {
  if (hr._adapter && typeof hr._adapter.connect === 'function') {
    _userStop = false;
    hr.status = 'connecting';
    emitStatus();
    return hr._adapter.connect();
  }
  if (typeof navigator === 'undefined' || !navigator.bluetooth || !navigator.bluetooth.requestDevice) {
    hr.status = 'error';
    emitStatus();
    throw new Error('bluetooth-unavailable');
  }
  _userStop = false;
  hr.status = 'connecting';
  emitStatus();
  try {
    var device = await navigator.bluetooth.requestDevice({ filters: [{ services: ['heart_rate'] }] });
    _device = device;
    hr.deviceName = device.name || 'Пульсометр';
    if (!device._hrListen) {
      device.addEventListener('gattserverdisconnected', onGattGone);
      device._hrListen = 1;
    }
    await bleAttach(device);
  } catch (e) {
    hr.connected = false;
    var name = e && e.name;
    hr.status = (name === 'NotFoundError' || name === 'AbortError' || name === 'NotAllowedError') ? 'idle' : 'error';
    emitStatus();
    throw e;
  }
}
function bleDisconnect() {
  _userStop = true;
  clearTimeout(_reconnectTimer);
  try { if (_char && _char.stopNotifications) _char.stopNotifications(); } catch (e) {}
  try { if (_device && _device.gatt && _device.gatt.connected) _device.gatt.disconnect(); } catch (e) {}
  if (hr._adapter && typeof hr._adapter.disconnect === 'function') { try { hr._adapter.disconnect(); } catch (e) {} }
  hr.connected = false;
  hr.status = 'idle';
  hr.bpm = null;
  emitStatus();
}

function hesc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function fmtDur(ms) {
  var s = Math.max(0, Math.round((+ms || 0) / 1000));
  var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  if (h) return h + ':' + String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
  return m + ':' + String(ss).padStart(2, '0');
}
function fmtZone(sec) {
  sec = Math.max(0, Math.round(+sec || 0));
  var m = Math.floor(sec / 60), s = sec % 60;
  return m + ':' + String(s).padStart(2, '0');
}
var ZONE_LABELS = ['Зона 1 · до 60%', 'Зона 2 · 60–70%', 'Зона 3 · 70–80%', 'Зона 4 · 80–90%', 'Зона 5 · 90–100%'];
function statusLine(status) {
  if (status === 'connecting') return 'Подключение…';
  if (status === 'reconnecting') return 'Снова подключаем пульсометр…';
  if (status === 'disconnected') return 'Пульсометр отключён';
  if (status === 'error') return 'Не удалось подключить пульсометр';
  return '';
}
function healthPanelHTML(s) {
  s = s || {};
  var phrase = s.kcal == null ? '—' : hesc(kcalPhrase(s.kcal));
  var hint = s.kcal == null ? '<div class="mut">Укажи вес в «Ещё»</div>' : '';
  return '<div class="card" id="healthcard"><div class="mut">Энергия</div><b id="kcal" style="font-size:18px">' + phrase + '</b>' + hint + '</div>';
}
function healthDetailHTML(w) {
  if (!w) return '';
  var h = readWorkoutHealth(w);
  var dur = w.end && w.start ? fmtDur(w.end - w.start) : '';
  var kcal = h.kcal == null ? '<b>—</b><div class="mut">Укажи вес в «Ещё»</div>' : '<b>' + hesc(kcalPhrase(h.kcal)) + '</b>';
  var why = h.kcalSource === 'hr'
    ? 'По пульсу (формула Keytel и др., 2005). Где сигнала не было — по MET.'
    : (h.kcal != null ? 'По длительности и типу нагрузки (MET), без пульса.' : '');
  var hrBlock = '';
  if (h.hr && (h.hr.avg != null || h.hr.max != null)) {
    hrBlock = '<div class="row" style="margin-top:10px"><div class="grow"><div class="mut">Средний пульс</div><b>' + (h.hr.avg == null ? '—' : h.hr.avg) + '</b> <span class="mut">уд/мин</span></div><div class="grow" style="text-align:right"><div class="mut">Максимальный пульс</div><b>' + (h.hr.max == null ? '—' : h.hr.max) + '</b> <span class="mut">уд/мин</span></div></div>';
    if (h.hr.zones) {
      var total = h.hr.zones.reduce(function (a, n) { return a + n; }, 0) || 1;
      hrBlock += '<h3 style="margin:12px 0 6px">Пульсовые зоны</h3>' + h.hr.zones.map(function (sec, i) {
        var pct = Math.round(sec / total * 100);
        return '<div class="zrow"><span class="zlab">' + ZONE_LABELS[i] + '</span><span class="zbar"><i class="z' + (i + 1) + '" style="width:' + pct + '%"></i></span><span class="mut">' + fmtZone(sec) + '</span></div>';
      }).join('') + (h.hr.hrMax ? '<div class="mut" style="margin-top:6px">Макс. пульс ' + h.hr.hrMax + ' = 208 − 0,7×возраст</div>' : '');
    } else {
      hrBlock += '<p class="mut">Укажи возраст в «Ещё», чтобы посчитать пять зон.</p>';
    }
  }
  if (!dur && h.kcal == null && !hrBlock) return '';
  return '<div class="card" id="healthsum"><div class="row"><div class="grow"><div class="mut">Длительность</div><b>' + hesc(dur || '—') + '</b></div><div class="grow" style="text-align:right"><div class="mut">Энергия</div>' + kcal + '</div></div>' + hrBlock + (why ? '<p class="mut" style="margin:8px 0 0">' + why + '</p>' : '') + '</div>';
}

function warmMinutes(A) {
  if (!A || !A.warm) return 0;
  if (A.warm.wu && A.warm.wu.min != null && A.warm.wu.min !== '') return +A.warm.wu.min || 0;
  if (A.warm.P && A.warm.P.min != null) return +A.warm.P.min || 0;
  return 5;
}
function coolMinutes(A) {
  if (!A || !A.cool) return 0;
  var cd = A.cool.cd;
  if (!cd) return 3;
  var m = 0;
  if (cd.cardio && +cd.cardio.min) m += +cd.cardio.min;
  m += (cd.stretch || []).length;
  if (!m && cd.note) m = 2;
  return m || 3;
}
function healthProfile() {
  var sex = null;
  if (typeof S !== 'undefined' && S && S.prof && (S.prof.sex === 'm' || S.prof.sex === 'f')) sex = S.prof.sex;
  return {
    kg: typeof S !== 'undefined' && S && +S.weightKg > 0 ? +S.weightKg : 0,
    age: typeof S !== 'undefined' && S && +S.age > 0 ? +S.age : 0,
    sex: sex
  };
}
function healthSnap(A) {
  var end = A && A.end ? A.end : Date.now();
  var start = A && A.start ? A.start : end;
  var items = (A && A.items || []).map(function (it) {
    var group = it.group;
    if (!group && typeof exBy === 'function') group = exBy(it.exId).group;
    return { exId: it.exId, group: group, sets: it.sets, rest: it.rest, min: it.min, max: it.max, sec: it.sec };
  });
  return {
    start: start, end: end, elapsedMin: Math.max(0, (end - start) / 60000),
    warmMin: warmMinutes(A), coolMin: coolMinutes(A), items: items,
    samples: (A && A.hrSamples || []).slice(),
    hrSource: (A && A.hrSource) || hr.source
  };
}
function healthPanel() {
  var summary = {};
  if (typeof S !== 'undefined' && S && S.active) summary = summarizeHealth(healthSnap(S.active), healthProfile());
  return healthPanelHTML({ kcal: summary.kcal });
}
function healthTick() {
  if (typeof document === 'undefined') return;
  var b = document.querySelector('#bpm');
  var k = document.querySelector('#kcal');
  if (!b && !k) return;
  var fresh = hr.bpm && (hr.status === 'live' || (hr.lastSampleAt && Date.now() - hr.lastSampleAt < 8000));
  if (b) {
    b.textContent = fresh ? String(hr.bpm) : '—';
    b.classList.toggle('on', !!fresh);
  }
  if (k && typeof S !== 'undefined' && S && S.active) {
    var est = summarizeHealth(healthSnap(S.active), healthProfile());
    k.textContent = est.kcal == null ? '—' : kcalPhrase(est.kcal);
  }
}
function healthBind() {
  if (typeof document === 'undefined') return;
  var c = document.querySelector('#hrconn');
  if (c) c.onclick = function () { hr.connect().catch(function () {}); };
  var d = document.querySelector('#hrdisc');
  if (d) d.onclick = function () { hr.disconnect(); };
  maybeAskWeight();
}

var _prompt = null, _hrSaveAt = 0;
function closeHealthPrompt() {
  _prompt = null;
  var m = document.querySelector('#modal');
  if (m) m.classList.add('hidden');
  if (typeof healthTick === 'function') healthTick();
}
function suggestedWeight() {
  if (typeof S === 'undefined' || !S) return '';
  if (+S.weightKg > 0) return S.weightKg;
  var rows = (S.body || []).filter(function (e) { return +e.weight > 0; }).slice().sort(function (a, b) { return String(a.date || '').localeCompare(String(b.date || '')); });
  return rows.length ? rows[rows.length - 1].weight : '';
}
function maybeAskWeight() {
  if (typeof S === 'undefined' || !S || !S.active || typeof document === 'undefined') return;
  if (+S.weightKg > 0 || S.weightAsked || _prompt) return;
  var m = document.querySelector('#modal');
  if (!m) return;
  _prompt = 'weight';
  m.classList.remove('hidden');
  m.innerHTML = '<div class="sheet"><div class="row"><h2 class="grow" style="margin:0">Вес для оценки калорий</h2><button id="hclose" type="button">✕</button></div><p class="mut">Один раз и необязательно. Килограммы, можно пропустить. Потом вес меняется в «Ещё».</p><label class="mut">Вес тела, кг<input id="hkg" type="number" inputmode="decimal" step="0.1" min="30" max="300" value="' + hesc(suggestedWeight()) + '"></label><button class="pri full" id="hsave" type="button">Сохранить</button><button class="full" id="hskip" type="button" style="margin-top:8px">Пропустить</button></div>';
  var saveBtn = m.querySelector('#hsave'), skip = m.querySelector('#hskip'), close = m.querySelector('#hclose');
  if (saveBtn) saveBtn.onclick = function () {
    var v = m.querySelector('#hkg') ? m.querySelector('#hkg').value : '';
    if (v === '') { S.weightAsked = 1; if (typeof save === 'function') save(); closeHealthPrompt(); return; }
    var n = +v;
    if (!(n >= 30 && n <= 300)) { if (typeof toast === 'function') toast('Вес: от 30 до 300 кг'); return; }
    S.weightKg = Math.round(n * 10) / 10; S.weightAsked = 1; if (typeof save === 'function') save(); closeHealthPrompt();
  };
  var skipFn = function () { S.weightAsked = 1; if (typeof save === 'function') save(); closeHealthPrompt(); };
  if (skip) skip.onclick = skipFn;
  if (close) close.onclick = skipFn;
}
function maybeAskAge() {
  if (typeof S === 'undefined' || !S || !S.active || typeof document === 'undefined') return;
  if (+S.age > 0 || S.ageAsked || _prompt) return;
  if (!S.active.hrSamples || !S.active.hrSamples.length) return;
  var m = document.querySelector('#modal');
  if (!m) return;
  _prompt = 'age';
  m.classList.remove('hidden');
  m.innerHTML = '<div class="sheet"><div class="row"><h2 class="grow" style="margin:0">Возраст для пульса</h2><button id="hclose" type="button">✕</button></div><p class="mut">Нужен для калорий по пульсу и пяти зон (макс. пульс = 208 − 0,7×возраст). Можно пропустить. Потом возраст меняется в «Ещё».</p><label class="mut">Возраст<input id="hage" type="number" inputmode="numeric" min="14" max="100"></label><button class="pri full" id="hsave" type="button">Сохранить</button><button class="full" id="hskip" type="button" style="margin-top:8px">Пропустить</button></div>';
  var saveBtn = m.querySelector('#hsave'), skip = m.querySelector('#hskip'), close = m.querySelector('#hclose');
  if (saveBtn) saveBtn.onclick = function () {
    var v = m.querySelector('#hage') ? m.querySelector('#hage').value : '';
    if (v === '') { S.ageAsked = 1; if (typeof save === 'function') save(); closeHealthPrompt(); return; }
    var n = Math.round(+v);
    if (!(n >= 14 && n <= 100)) { if (typeof toast === 'function') toast('Возраст: от 14 до 100 лет'); return; }
    S.age = n; S.ageAsked = 1; if (typeof save === 'function') save(); closeHealthPrompt();
  };
  var skipFn = function () { S.ageAsked = 1; if (typeof save === 'function') save(); closeHealthPrompt(); };
  if (skip) skip.onclick = skipFn;
  if (close) close.onclick = skipFn;
}
function rememberSample(sample) {
  if (typeof S === 'undefined' || !S || !S.active) return;
  if (!S.active.hrSamples) S.active.hrSamples = [];
  S.active.hrSamples.push({ t: sample.t, bpm: sample.bpm });
  S.active.hrSource = sample.source || hr.source;
  var now = Date.now();
  if (now - _hrSaveAt > 5000) { _hrSaveAt = now; if (typeof save === 'function') save(); }
  healthTick();
  maybeAskAge();
}
function showWorkoutSummary(A) {
  if (typeof document === 'undefined' || !A) return;
  var m = document.querySelector('#modal');
  if (!m) return;
  var prs = [];
  (A.items || []).forEach(function (it) {
    (it.sets || []).forEach(function (s) {
      if (s && s.pr && s.prInfo && typeof exBy === 'function') prs.push([exBy(it.exId).name, s.prInfo]);
    });
  });
  var prHtml = prs.length && typeof PHR !== 'undefined' ? '<h2>🏆 Рекорды тренировки: ' + prs.length + '</h2>' + prs.map(function (pair) {
    return '<div class="li"><div class="grow"><b>' + hesc(pair[0]) + '</b><br><span class="mut">' + hesc(pair[1].t) + '</span></div><span class="mut"><s>' + hesc(pair[1].o) + '</s></span>&nbsp;→&nbsp;<b class="pr">' + hesc(pair[1].n) + '</b></div>';
  }).join('') + '<p>' + PHR[Math.floor(Math.random() * PHR.length)] + '</p>' : '';
  m.classList.remove('hidden');
  m.innerHTML = '<div class="sheet" id="wsum"><div class="row"><h2 class="grow" style="margin:0">Итог тренировки</h2><button id="mc" type="button">✕</button></div><h3 style="margin-top:8px">' + hesc(A.dayName || '') + '</h3>' + healthDetailHTML(A) + prHtml + '<button class="pri full" id="sumok" type="button" style="margin-top:12px">Готово</button></div>';
  var close = function () { m.classList.add('hidden'); };
  var x = m.querySelector('#mc'), ok = m.querySelector('#sumok');
  if (x) x.onclick = close;
  if (ok) ok.onclick = close;
}

if (typeof document !== 'undefined') {
  hr.onSample(rememberSample);
  hr.onStatus(function () {
    if (typeof S === 'undefined' || !S || !S.active || typeof view === 'undefined' || view !== 'today' || typeof document === 'undefined') return;
    var card = document.querySelector('#healthcard');
    if (!card) return;
    card.outerHTML = healthPanel();
    healthBind();
  });
  document.addEventListener('visibilitychange', function () {
    if (typeof document.hidden === 'boolean' && document.hidden) return;
    if (!_userStop && _device && hr.status !== 'live' && hr.status !== 'idle') bleReconnect();
  });
  if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('pagehide', function () {
    if (typeof S !== 'undefined' && S && S.active && S.active.hrSamples && S.active.hrSamples.length && typeof save === 'function') save();
  });
}
if (typeof globalThis !== 'undefined') globalThis.hr = hr;
