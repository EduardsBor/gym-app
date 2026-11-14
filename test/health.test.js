'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');

function loadHealth() {
  const g = {
    console, setTimeout, clearTimeout, setInterval() { return 0; }, clearInterval() {},
    Date, Math, URL, navigator: {}
  };
  g.window = g;
  g.globalThis = g;
  g.self = g;
  const ctx = vm.createContext(g);
  vm.runInContext(fs.readFileSync(path.join(root, 'health.js'), 'utf8'), ctx, { filename: 'health.js' });
  return ctx;
}

const ctx = loadHealth();
const run = (code) => vm.runInContext(code, ctx);

test('Keytel 2005 matches the published equations', () => {
  const male = run('keytelKcalPerMin({bpm:140, kg:80, age:30, sex:"m"})');
  const female = run('keytelKcalPerMin({bpm:140, kg:65, age:30, sex:"f"})');
  // Men: (−55.0969 + 0.6309×140 + 0.1988×80 + 0.2017×30) / 4.184
  assert.ok(Math.abs(male - 13.1897) < 0.02, male);
  // Women: (−20.4022 + 0.4472×140 − 0.1263×65 + 0.074×30) / 4.184
  assert.ok(Math.abs(female - 8.6559) < 0.02, female);
  assert.equal(run('keytelKcalPerMin({bpm:40, kg:50, age:18, sex:"m"})'), 0);
  assert.equal(run('keytelKcalPerMin({bpm:140, kg:80, age:30, sex:null})'), 0);
});

test('MET calories use weight, duration, block intensity and sex when known', () => {
  assert.equal(run('metOf("sq")'), 6);
  assert.equal(run('metOf("bp")'), 6);
  assert.equal(run('metOf("fly")'), 3.5);
  assert.equal(run('metOf("bc")'), 3.5);
  assert.equal(run('metOf("pl")'), 3.5);
  assert.equal(run('metOf("tm")'), 8);
  assert.equal(run('metOf("bike")'), 6.8);
  assert.equal(run('metOf("ell")'), 5);
  assert.equal(run('metOf("rowm")'), 7);
  assert.equal(run('metOf("stair")'), 9);
  assert.equal(run('metOf("jump")'), 8);
  assert.equal(run('metOf("wlk")'), 4.3);
  assert.equal(run('metOf("custom-x", "Кардио")'), 6);
  assert.equal(run('MET_WARM'), 3);
  assert.equal(run('MET_COOL'), 2.3);
  assert.ok(run('MET_COOL < MET_WARM && MET_WARM < metOf("fly") && metOf("fly") < metOf("sq")'));
  assert.equal(run('metKcal({kg:70, minutes:30, met:6, sex:"m"})'), 210);
  assert.equal(run('metKcal({kg:70, minutes:30, met:6, sex:"f"})'), 189);
  assert.equal(run('metKcal({kg:70, minutes:60, met:1, sex:null})'), 70);
  assert.ok(run('metKcal({kg:80, minutes:30, met:metOf("stair"), sex:"m"}) > metKcal({kg:80, minutes:30, met:metOf("bike"), sex:"m"})'));
  assert.ok(run('metKcal({kg:80, minutes:30, met:metOf("bike"), sex:"m"}) > metKcal({kg:80, minutes:30, met:metOf("wlk"), sex:"m"})'));
});

test('blocks scale to the real duration and keep warm-up and cool-down low', () => {
  const blocks = run(`sessionBlocks({
    elapsedMin: 40, warmMin: 5, coolMin: 4,
    items: [
      {exId:'sq', sets:3, rest:90, min:6, max:10},
      {exId:'tm', min:10, max:15, sets:1, rest:0}
    ]
  })`);
  const sum = blocks.reduce((s, b) => s + b.minutes, 0);
  assert.ok(Math.abs(sum - 40) < 1e-6, sum);
  assert.equal(blocks[0].kind, 'warmup');
  assert.equal(blocks[0].met, 3);
  assert.equal(blocks[1].kind, 'strength');
  assert.equal(blocks[1].met, 6);
  assert.equal(blocks[2].kind, 'cardio');
  assert.equal(blocks[2].met, 8);
  assert.equal(blocks[3].kind, 'cooldown');
  assert.equal(blocks[3].met, 2.3);
});

test('heart-rate calories use Keytel and fall back to MET when the signal drops or age is missing', () => {
  const per = run('keytelKcalPerMin({bpm:140, kg:80, age:30, sex:"m"})');
  const base = `{
    start: 0, end: ${30 * 60 * 1000}, elapsedMin: 30, warmMin: 0, coolMin: 0, hrSource: 'ble',
    items: [{exId:'sq', sets:3, rest:560, min:6, max:10}]
  }`;
  const metOnly = run(`estimateKcal(${base}, {kg:80, age:30, sex:'m'})`);
  assert.equal(metOnly.kcal, 240);
  assert.equal(metOnly.kcalSource, 'met');

  const full = run(`(function(){
    var samples=[];
    for (var t=0;t<=${30 * 60 * 1000};t+=5000) samples.push({t:t,bpm:140});
    return estimateKcal(Object.assign(${base}, {samples:samples}), {kg:80, age:30, sex:'m'});
  })()`);
  assert.equal(full.kcal, Math.round(per * 30));
  assert.equal(full.kcalSource, 'hr');
  assert.notEqual(full.kcal, 240);

  const mixed = run(`(function(){
    var samples=[];
    for (var t=0;t<=${15 * 60 * 1000};t+=5000) samples.push({t:t,bpm:140});
    return estimateKcal(Object.assign(${base}, {samples:samples}), {kg:80, age:30, sex:'m'});
  })()`);
  assert.equal(mixed.kcalSource, 'hr');
  assert.equal(mixed.kcal, Math.round(per * 15 + 120));

  const noAge = run(`(function(){
    var samples=[];
    for (var t=0;t<=${30 * 60 * 1000};t+=5000) samples.push({t:t,bpm:140});
    return estimateKcal(Object.assign(${base}, {samples:samples}), {kg:80, age:0, sex:'m'});
  })()`);
  assert.equal(noAge.kcal, 240);
  assert.equal(noAge.kcalSource, 'met');
  assert.equal(run(`estimateKcal(${base}, {kg:0, age:30, sex:'m'}).kcal`), null);
});

test('five heart-rate zones use 208 − 0.7×age and ignore long gaps', () => {
  assert.ok(Math.abs(run('hrMaxAge(40)') - 180) < 1e-6);
  assert.ok(Math.abs(run('hrMaxAge(34)') - 184.2) < 1e-6);
  const zones = run(`(function(){
    var samples=[], t=0, plan=[[100,60],[120,60],[140,60],[160,60],[175,60]];
    plan.forEach(function(p){ for (var i=0;i<p[1];i++){ samples.push({t:t,bpm:p[0]}); t+=1000; } });
    samples.push({t:t,bpm:175});
    return hrStats(samples, 30).zones;
  })()`);
  // age 30 → HRmax 187. 100 z1, 120 z2, 140 z3, 160 z4, 175 z5. Each held 60s at 1 Hz (gap limit is 20s).
  assert.equal(JSON.stringify(zones), JSON.stringify([60, 60, 60, 60, 60]));
  const gapped = run('hrStats([{t:0,bpm:100},{t:10000,bpm:100},{t:70000,bpm:100}], 30).zones');
  assert.equal(JSON.stringify(gapped), JSON.stringify([10, 0, 0, 0, 0]));
});

test('history keeps old records and only adds optional health fields', () => {
  const old = {
    id: 'w1', start: 10, end: 20, dayIdx: 0, dayName: 'День', notes: 'спина', warmDone: 3,
    items: [{ exId: 'bp', sets: [{ w: 40, r: 8, done: true }] }]
  };
  const raw = JSON.stringify(old);
  assert.equal(run('historyKcalText(' + raw + ')'), '');
  const read = run('readWorkoutHealth(' + raw + ')');
  assert.equal(read.kcal, null);
  assert.equal(read.hr, null);
  assert.equal(JSON.stringify(old), raw);

  const saved = JSON.parse(raw);
  ctx.workout = saved;
  run('applyHealthFields(workout, {kcal:210.4, kcalSource:"met"})');
  assert.equal(saved.notes, 'спина');
  assert.equal(saved.items[0].exId, 'bp');
  assert.equal(saved.items[0].sets[0].w, 40);
  assert.equal(saved.warmDone, 3);
  assert.equal(saved.kcal, 210);
  assert.equal(saved.kcalSource, 'met');
  assert.equal(saved.hr, undefined);
  assert.equal(JSON.parse(raw).kcal, undefined);

  run('applyHealthFields(workout, {kcal:300, kcalSource:"hr", hr:{source:"ble", avg:128.2, max:161.6, zones:[10,20,30,40,50], hrMax:184.2}})');
  assert.equal(saved.hr.source, 'ble');
  assert.equal(saved.hr.avg, 128);
  assert.equal(saved.hr.max, 162);
  assert.equal(JSON.stringify(saved.hr.zones), JSON.stringify([10, 20, 30, 40, 50]));
  assert.equal(saved.hr.hrMax, 184.2);
  assert.equal(saved.items.length, 1);
  assert.equal(run('historyKcalText(workout)'), ' · ≈ 300 ккал');
  assert.match(run('kcalPhrase(workout.kcal)'), /≈ 300 ккал, оценка/);

  const bad = { id: 'x', items: [] };
  ctx.bad = bad;
  run('applyHealthFields(bad, {hr:{source:"fitbit", avg:80, max:100, zones:[1,2,3]}})');
  assert.equal(bad.hr.source, undefined);
  assert.equal(bad.hr.avg, 80);
  assert.equal(bad.hr.zones, undefined);
  assert.deepEqual(Object.keys(bad).sort(), ['hr', 'id', 'items']);
});

test('provider exposes connect, onSample, disconnect and the four sources', async () => {
  const got = [];
  ctx.bucket = got;
  const stop = run(`hr.onSample(function(s){ bucket.push(s); })`);
  run('hr.source = "manual"');
  run('hr.ingest(118, 5000)');
  assert.equal(got.length, 1);
  assert.equal(got[0].bpm, 118);
  assert.equal(got[0].t, 5000);
  assert.equal(got[0].source, 'manual');
  stop();
  run('hr.ingest(119, 6000)');
  assert.equal(got.length, 1);
  assert.equal(typeof run('hr.connect'), 'function');
  assert.equal(typeof run('hr.disconnect'), 'function');
  assert.equal(JSON.stringify(run('HR_SOURCES')), JSON.stringify(['ble', 'manual', 'healthkit', 'healthconnect']));
  assert.equal(run('hrConnectOffer(false, "ble")'), 'note');
  assert.equal(run('hrConnectOffer(true, "ble")'), 'button');
  assert.equal(run('hrConnectOffer(false, "healthkit")'), 'button');
  assert.equal(run('hrConnectOffer(false, "healthconnect")'), 'button');
  assert.throws(() => run('hr.use({source:"fitbit", connect:function(){}, disconnect:function(){}})'), /bad-source/);

  let stopped = 0;
  ctx.adapter = {
    source: 'healthconnect',
    connect() { return 'up'; },
    disconnect() { stopped++; }
  };
  assert.equal(run('hr.use(adapter); hr.source'), 'healthconnect');
  assert.equal(await run('hr.connect()'), 'up');
  run('hr.disconnect()');
  assert.equal(stopped, 1);
  run('hr.use(null)');
  assert.equal(run('hr.source'), 'ble');

  const u8 = new DataView(Uint8Array.from([0x00, 72]).buffer);
  const u16 = new DataView(Uint8Array.from([0x01, 0xb4, 0x00]).buffer);
  const bad = new DataView(Uint8Array.from([0x01, 0x2c, 0x01]).buffer);
  ctx.u8 = u8; ctx.u16 = u16; ctx.badView = bad;
  assert.equal(run('parseHeartRateMeasurement(u8)'), 72);
  assert.equal(run('parseHeartRateMeasurement(u16)'), 180);
  assert.equal(run('parseHeartRateMeasurement(badView)'), null);

  const note = run('healthPanelHTML({kcal:null,bpm:null,status:"idle",offer:"note",deviceName:""})');
  const button = run('healthPanelHTML({kcal:12,bpm:null,status:"idle",offer:"button",deviceName:""})');
  const live = run('healthPanelHTML({kcal:186,bpm:132,status:"live",offer:"note",deviceName:"Polar H10"})');
  assert.match(note, /Пульсометр будет доступен в версии из магазина приложений/);
  assert.equal(note.includes('Подключить пульсометр'), false);
  assert.match(button, /Подключить пульсометр/);
  assert.equal(button.includes('магазина приложений'), false);
  assert.match(live, /132/);
  assert.match(live, /≈ 186 ккал, оценка/);
  assert.match(live, /Polar H10/);
  assert.equal(live.includes('Подключить пульсометр'), false);
});

test('service worker cache is v44 and precaches health.js and movekit.js', () => {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(sw, /moyzal-v49/);
  assert.equal(sw.includes('moyzal-v42'), false);
  assert.equal(sw.charCodeAt(0) === 0xfeff, false);
  assert.match(sw, /moyzal-anim3d-v14/);
  assert.equal(sw.includes('moyzal-anim3d-v13'), false);
  assert.match(sw, /x!=='moyzal-movekit-v1'/);
  assert.match(sw, /endsWith\('\.supabase\.co'\)/);
  assert.equal(sw.includes('object/sign'), false);
  assert.match(sw, /health\.js/);
  assert.match(sw, /movekit\.js/);
  assert.match(html, /health\.js/);
  assert.match(html, /movekit\.js/);
});

function bootApp() {
  const nodes = new Map();
  function el(id) {
    if (id && nodes.has(id)) return nodes.get(id);
    const node = {
      id: id || '', innerHTML: '', textContent: '', className: '', value: '', style: {}, dataset: {},
      classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
      append() {}, addEventListener() {}, setAttribute() {}, getAttribute() { return null; }, closest() { return null; },
      querySelector() { return null; }, querySelectorAll() { return []; }
    };
    if (id) nodes.set(id, node);
    return node;
  }
  const g = {
    console, setTimeout() { return 0; }, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
    URL, Blob, navigator: { language: 'ru', languages: ['ru'] },
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    location: { href: 'http://127.0.0.1/', origin: 'http://127.0.0.1', pathname: '/' },
    confirm() { return true; }, alert() {}, scrollTo() {},
    document: {
      documentElement: { lang: 'ru' }, title: '', hidden: false,
      body: { append() {}, style: {} },
      querySelector(sel) { const m = /^#([\w-]+)/.exec(sel || ''); return el(m ? m[1] : ''); },
      querySelectorAll() { return []; }, addEventListener() {}, createElement() { return el(); }
    }
  };
  g.window = g; g.globalThis = g; g.self = g;
  const appCtx = vm.createContext(g);
  const files = ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'health.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'place.js', 'prog.js', 'plan.js'];
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), appCtx, { filename: f });
  appCtx.__nodes = nodes;
  return appCtx;
}

test('a finished workout stores optional health fields and an old workout stays intact', () => {
  const appCtx = bootApp();
  const go = (code) => vm.runInContext(code, appCtx);
  const old = { id: 'old', start: Date.now() - 864e5, end: Date.now() - 864e5 + 36e5, dayName: 'Старая', notes: 'как было', items: [{ exId: 'bp', sets: [{ w: 40, r: 8, done: true }] }] };
  go('S.goal="mass";S.days=3;S.weightKg=80;S.age=30;S.weightAsked=1;S.ageAsked=1;S.next=0;S.custom=[];S.body=[];');
  go('S.prof=' + JSON.stringify({ sex: 'm', goal: 'mass', level: 'mid', days: 3, len: 60, place: 'g', prio: [], lim: [] }));
  go('S.program=' + JSON.stringify([{ name: 'День 1', items: [{ exId: 'sq', sets: 3, min: 6, max: 10, rest: 120 }, { exId: 'bike', sets: 1, min: 8, max: 12, rest: 0 }] }]));
  go('S.workouts=' + JSON.stringify([old]));
  go('startW(0)');
  let html = appCtx.__nodes.get('app').innerHTML;
  assert.match(html, /Пульсометр будет доступен в версии из магазина приложений/);
  assert.equal(html.includes('Подключить пульсометр'), false);

  go(`
    S.active.start = Date.now() - 10*60*1000;
    S.active.hrSource = 'manual';
    S.active.hrSamples = [];
    var t0 = S.active.start;
    for (var t = t0; t <= t0 + 10*60*1000; t += 5000) S.active.hrSamples.push({t:t, bpm:140});
    hr.source = 'manual';
    hr.status = 'live';
    hr.bpm = 140;
    hr.deviceName = 'Polar H10';
    S.active.items[0].sets[0].done = true;
    S.active.items[0].sets[0].w = 60;
    S.active.items[0].sets[0].r = 8;
  `);
  go('workoutView()');
  html = appCtx.__nodes.get('app').innerHTML;
  assert.match(html, /Polar H10/);
  assert.match(html, /140/);
  assert.match(html, /ккал, оценка/);
  assert.equal(html.includes('Подключить пульсометр'), false);
  appCtx.navigator.bluetooth = { requestDevice() { return Promise.resolve(); } };
  go('hr.status="idle"; hr.bpm=null; workoutView()');
  html = appCtx.__nodes.get('app').innerHTML;
  assert.match(html, /Подключить пульсометр/);
  assert.equal(html.includes('магазина приложений'), false);

  const programIds = go('S.program[0].items.map(function(it){return it.exId}).join(",")');
  go('hr.status="live"; hr.bpm=140;');
  appCtx.__nodes.get('fin').onclick();
  assert.equal(go('S.active'), null);
  assert.equal(go('S.workouts.length'), 2);
  assert.equal(go('S.workouts[0].notes'), 'как было');
  assert.equal(go('S.workouts[0].kcal'), undefined);
  assert.equal(go('S.workouts[0].hr'), undefined);
  assert.equal(go('S.workouts[0].items[0].exId'), 'bp');
  const saved = go('S.workouts[1]');
  assert.equal(saved.hrSamples, undefined);
  assert.equal(typeof saved.kcal, 'number');
  assert.ok(saved.kcal > 0);
  assert.equal(saved.kcalSource, 'hr');
  assert.equal(saved.hr.source, 'manual');
  assert.equal(saved.hr.avg, 140);
  assert.equal(saved.hr.max, 140);
  assert.equal(saved.hr.zones.length, 5);
  assert.ok(saved.hr.zones[2] > 0);
  assert.equal(saved.items[0].exId, 'sq');
  assert.equal(programIds, 'sq,bike');
  go('history()');
  const list = appCtx.__nodes.get('app').innerHTML;
  assert.match(list, /Старая/);
  assert.match(list, new RegExp('≈ ' + saved.kcal + ' ккал'));
});
