'use strict';
// P-301: auto-weight wired into the app (startW prefill, finish -> S.pg, equipment profile). History is not rewritten.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

function boot(stored, withFeatures) {
  const store = new Map();
  if (stored !== undefined) store.set('gym', JSON.stringify(stored));
  const nodes = new Map();
  function el(id) {
    if (id && nodes.has(id)) return nodes.get(id);
    const node = {
      id: id || '', innerHTML: '', textContent: '', className: '', value: '', style: {}, dataset: {},
      classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
      append() {}, addEventListener() {}, insertAdjacentHTML() {}, setAttribute() {}, getAttribute() { return null; }, closest() { return null; },
      querySelector() { return null; }, querySelectorAll() { return []; }
    };
    if (id) nodes.set(id, node);
    return node;
  }
  const g = {
    console, setTimeout, clearTimeout, setInterval() { return 0; }, clearInterval() {}, scrollTo() {}, scrollY: 0,
    URL, Blob, navigator: { language: 'ru', languages: ['ru'] },
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
    location: { href: 'http://127.0.0.1/', origin: 'http://127.0.0.1', pathname: '/' },
    document: {
      documentElement: { lang: 'ru' }, title: '', body: { append() {}, style: {} },
      querySelector(sel) { const m = /^#([\w-]+)/.exec(sel || ''); return el(m ? m[1] : ''); },
      querySelectorAll() { return []; }, addEventListener() {}, createElement() { return el(); }
    }
  };
  g.window = g; g.globalThis = g; g.self = g;
  const ctx = vm.createContext(g);
  const files = ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'place.js', 'prog.js', 'plan.js', 'movekit.js'];
  files.push('premium.js', 'features.js', 'progress.js', 'autow.js');
  for (const f of files) vm.runInContext(read(f), ctx, { filename: f });
  return { run: code => vm.runInContext(code, ctx), store };
}
const DAY = 864e5;
function seed(extra) {
  return Object.assign({
    lang: 'ru', goal: 'mass', days: 3, next: 0, schema: 4, ownerPremium: false, obDone: 1,
    prof: { goal: 'mass', sex: 'm', level: 'mid', days: 3, len: 60, place: 'g', prio: [], lim: [] },
    program: [{ name: 'A', items: [{ exId: 'bp', sets: 3, min: 8, max: 12, rest: 120 }, { exId: 'mk-front-plank', sets: 3, min: 20, max: 45, rest: 60, sec: 1 }] }],
    workouts: [], custom: [], body: []
  }, extra || {});
}
function hist(start, w, reps) {
  return { id: 'w' + start, start, end: start + 3600e3, dayIdx: 0, dayName: 'A', notes: '', items: [{ exId: 'bp', ns: 3, min: 8, max: 12, rest: 120, sets: reps.map(r => ({ w, r, done: true })) }] };
}
function finish(b, reps, feel, pain) {
  b.run(`(()=>{const A=S.active,it=A.items[0];it.sets.forEach((s,k)=>{s.r=${JSON.stringify(reps)}[k];s.done=true});it.feel=${JSON.stringify(feel || null) || 'undefined'};it.pain=${!!pain};
   A.items[1].sets.forEach(s=>{s.done=true});
   const d=A.items.map(it=>({...it,sets:it.sets.filter(s=>s.done)}));A.items=d;S.workouts.push(A);S.active=null;awFinish(A);save()})()`);
}
const demo = (b, t) => b.run(`setDemoTier(${JSON.stringify(t)})`);
const PREMIUM_ONLY = ['autoWeightExact', 'deload', 'breakReturn', 'programDays6', 'programsAll', 'programSwitch', 'customTemplate', 'chartsFull', 'prHistory', 'muscleVolume', 'equipProfiles', 'bodyGirths'];
const NEVER = ['pain', 'limitations', 'painSwap', 'warmup', 'cooldown', 'sync', 'exportCsv', 'video', 'library', 'journal', 'prevInField', 'prBanner'];

test('gate is off until the Android build: every real user (fresh or old) gets everything', () => {
  for (const st of [undefined, seed(), seed({ ownerPremium: true })]) {
    const b = boot(st);
    assert.equal(b.run('PREM_CFG.PAYWALL_ENABLED'), false);
    assert.equal(b.run('isPremium()'), true);
    assert.equal(b.run('isPrem()'), true);
    for (const f of PREMIUM_ONLY.concat(NEVER)) assert.equal(b.run(`can(${JSON.stringify(f)})`), true, f);
    assert.equal(b.run('chartFrom()'), 0);
  }
});

test('one feature table: premium-only flags and never-gated flags (incl. P-302/P-303 placeholders)', () => {
  const b = boot(seed());
  for (const f of PREMIUM_ONLY) assert.equal(b.run(`FEATURES[${JSON.stringify(f)}]`), 'premium', f);
  for (const f of NEVER) { assert.equal(b.run(`FEATURES[${JSON.stringify(f)}]`), 'free', f); assert.ok(b.run(`NEVER_GATED.includes(${JSON.stringify(f)})`), f); }
});

test('demo Free: premium features closed, never-gated features stay open', () => {
  const b = boot(seed());
  demo(b, 'free');
  assert.equal(b.run('isPremium()'), false);
  for (const f of PREMIUM_ONLY) assert.equal(b.run(`can(${JSON.stringify(f)})`), false, f);
  for (const f of NEVER) assert.equal(b.run(`can(${JSON.stringify(f)})`), true, f);
  // library and every video stay open
  assert.equal(b.run('exOk("bp") && exOk("mk-front-plank") && exOk("sglb")'), true);
  demo(b, 'premium');
  assert.equal(b.run('isPremium()'), true);
  demo(b, 'off');
  assert.equal(b.run('isPremium()'), true);
});

test('demo tier via ?demo=free in the URL, stored outside user data', () => {
  const b = boot(seed());
  const s = b.run('localStorage.getItem("gym")');
  assert.equal(b.run('premUrl("?x=1&demo=free")'), 'free');
  assert.equal(b.store.get('gymDemoTier'), 'free');
  assert.equal(b.run('localStorage.getItem("gym")'), s);
});

test('paywall enabled: entitlement decides; demo overrides only on this device', () => {
  const b = boot(seed());
  b.run('PREM_CFG.PAYWALL_ENABLED=true');
  assert.equal(b.run('isPremium()'), false);
  b.run('S.premium=true'); assert.equal(b.run('isPremium()'), true);
  b.run('S.premium=false;S.ownerPremium=true'); assert.equal(b.run('isPremium()'), true);
  b.run('S.ownerPremium=false'); demo(b, 'premium'); assert.equal(b.run('isPremium()'), true);
  demo(b, 'off'); assert.equal(b.run('isPremium()'), false);
});

test('toggling the demo tier and checking access never changes user data', () => {
  const now = Date.now();
  const b = boot(seed({ workouts: [hist(now - 3 * DAY, 60, [10, 10, 9])], body: [{ id: 'b1', date: '2026-11-01', weight: 80, waist: 85 }], consentHealth: { v: 1, at: '2026-11-01' } }));
  const before = b.run('JSON.stringify(S)'), stored = b.store.get('gym');
  for (const t of ['free', 'premium', 'off', 'free']) {
    demo(b, t);
    b.run('isPremium();can("chartsFull");can("bodyGirths");chartFrom();premProgLock(S.prof,"quiz");blockEnded()');
  }
  assert.equal(b.run('JSON.stringify(S)'), before);
  assert.equal(b.store.get('gym'), stored);
});

test('auto-weight Free: previous weight in the field, only an arrow, no number; feel still recorded', () => {
  const now = Date.now();
  const mk = () => boot(seed({ workouts: [hist(now - 3 * DAY, 60, [10, 10, 9])] }));
  const free = mk(); demo(free, 'free');
  const hist0 = free.run('JSON.stringify(S.workouts)');
  free.run('startW(0)');
  finish(free, [12, 12, 12], 'easy');
  assert.equal(free.run('JSON.stringify(S.workouts.slice(0,1))'), hist0);
  assert.equal(free.run('S.workouts[1].items[0].feel'), 'easy');
  assert.equal(free.run('S.pg.bp.next.weight'), 62.5); // progression state keeps running
  free.run('startW(0)');
  assert.deepEqual(JSON.parse(free.run('JSON.stringify(S.active.items[0].sets.map(s=>s.w))')), [12, 12, 12].map(() => 60));
  assert.deepEqual(JSON.parse(free.run('JSON.stringify(S.active.items[0].sets.map(s=>s.r))')), [12, 12, 12]);
  const h = free.run('awSugHTML(S.active.items[0],0)');
  assert.match(h, /Пора прибавить ↑/);
  assert.equal(/62[.,]5|кг/.test(h), false);
  assert.match(free.run('awFeelHTML(Object.assign({},S.active.items[0],{sets:[{done:true}]}),0)'), /легко/);

  const prem = mk(); demo(prem, 'premium');
  prem.run('startW(0)'); finish(prem, [12, 12, 12], 'easy'); prem.run('startW(0)');
  assert.deepEqual(JSON.parse(prem.run('JSON.stringify(S.active.items[0].sets.map(s=>s.w))')), [62.5, 62.5, 62.5]);
  assert.match(prem.run('awSugHTML(S.active.items[0],0)'), /62\.5/);
});

test('auto-weight arrow directions: up / hold / down', () => {
  const b = boot(seed());
  assert.equal(b.run('awDir({note:"inc",weight:62.5},60)'), 'up');
  assert.equal(b.run('awDir({note:"same",weight:60},60)'), 'hold');
  assert.equal(b.run('awDir({note:"miss3",weight:55},60)'), 'down');
  assert.equal(b.run('awDir({note:"same",weight:55},60)'), 'down');
  assert.equal(b.run('AW_DIR.down'), 'Сбавь ↓');
});

test('deload is Premium: Free gets no deload week and S.dl is not written', () => {
  const now = Date.now();
  const st = seed({ pgSince: now - 36 * DAY, workouts: [hist(now - 40 * DAY, 60, [10, 10, 10]), hist(now - 2 * DAY, 80, [10, 10, 10])] });
  const f = boot(st); demo(f, 'free'); f.run('startW(0)');
  assert.equal(f.run('S.active.dl'), null);
  assert.equal(f.run('S.dl'), undefined);
  assert.equal(f.run('S.active.items[0].sets.length'), 3);
  const p = boot(st); demo(p, 'premium'); p.run('startW(0)');
  assert.equal(p.run('S.active.dl'), 'scheduled');
});

test('pain stays free: Free still records pain and lowers the next weight; warning shown', () => {
  const b = boot(seed({ workouts: [hist(Date.now() - 2 * DAY, 60, [10, 10, 10])] }));
  demo(b, 'free'); b.run('startW(0)');
  finish(b, [12, 12, 12], 'easy', true);
  assert.equal(b.run('S.workouts[S.workouts.length-1].items[0].pain'), true);
  assert.equal(b.run('S.pg.bp.next.weight'), 52.5);
  b.run('startW(0)');b.run('S.active.items[0].pain=true');
  assert.match(b.run('awSugHTML(S.active.items[0],0)'), /Боль/);
});

test('charts: Free 90 days, Premium full history', () => {
  const b = boot(seed()); demo(b, 'free');
  const cf = b.run('chartFrom()');
  assert.ok(Math.abs(Date.now() - 90 * DAY - cf) < 5000);
  demo(b, 'premium'); assert.equal(b.run('chartFrom()'), 0);
});

test('programs: Free = 1 questionnaire program 2–5 days, new one after the block; Premium any time', () => {
  const now = Date.now();
  const b = boot(seed({ progStart: now - 10 * DAY })); demo(b, 'free');
  assert.match(b.run('premProgLock({days:3},"quiz")'), /после окончания блока/);
  assert.match(b.run('premProgLock({days:3},"catalog")'), /Premium/);
  assert.match(b.run('premProgLock({days:6},"quiz")'), /6 тренировок/);
  b.run(`S.progStart=${now - 57 * DAY}`);
  assert.equal(b.run('premProgLock({days:5},"quiz")'), '');
  b.run('delete S.progStart'); // older data without a block start: never locked out
  assert.equal(b.run('premProgLock({days:4},"onb")'), '');
  b.run('S.program=null;S.progStart=Date.now()');
  assert.equal(b.run('premProgLock({days:2},"quiz")'), '');
  demo(b, 'premium');
  b.run(`S.program=[{name:'A',items:[]}];S.progStart=${now}`);
  assert.equal(b.run('premProgLock({days:6},"catalog")'), '');
});

test('body: Free keeps only body weight (other values are hidden, not deleted), 90-day range', () => {
  const b = boot(seed({ consentHealth: { v: 1, at: '2026-11-01' }, body: [{ id: 'b1', date: '2026-11-01', weight: 80, waist: 85 }] }));
  const before = b.run('JSON.stringify(S.body)');
  b.run("chart=function(){}");
  demo(b, 'free'); b.run('bM="waist";bR=0;body()');
  assert.equal(b.run('bM'), 'weight'); assert.equal(b.run('bR'), 90);
  assert.equal(b.run('JSON.stringify(S.body)'), before);
  demo(b, 'premium'); b.run('bM="waist";bR=0;body()');
  assert.equal(b.run('bM'), 'waist'); assert.equal(b.run('bR'), 0);
});

test('no paywall in the middle of a workout; natural moments only after it', () => {
  const b = boot(seed({ workouts: [hist(Date.now() - 2 * DAY, 60, [10, 10, 10])] })); demo(b, 'free');
  b.run('startW(0)');
  assert.equal(b.run('paywall("x")'), false);
  assert.equal(b.run('premMoment("plateau")'), false);
  assert.equal(b.run('paywall("",{force:1})'), true);
  b.run('S.active=null');
  assert.equal(b.run('paywall("x")'), true);
  assert.equal(b.run('premMoment("block")'), true);
  assert.equal(b.run('premMoment("block")'), false); // at most once per 14 days
  demo(b, 'premium'); b.store.delete('gymPwMoment');
  assert.equal(b.run('premMoment("block")'), false); // Premium never sees it
});

test('never-gated features are not locked in the code (questionnaire, videos, history, export)', () => {
  const f = read('features.js');
  assert.equal(f.includes('chip[data-k="lim"]'), false);
  assert.equal(f.includes('🔒 3D-видео — Premium</span>'), false);
  assert.equal(/lockCard\('Графики и рекорды/.test(f), false);
  assert.equal(/lockCard\('Замеры тела/.test(f), false);
  const sw = read('sw.js');
  assert.match(sw, /const C='moyzal-v49'/);
  assert.match(sw, /'premium\.js','features\.js'/);
  const html = read('index.html');
  assert.ok(html.indexOf('premium.js') < html.indexOf('features.js') && html.indexOf('premium.js') > html.indexOf('app.js'));
});

test('Premium screen: prices, 14-day trial only on the yearly plan, restore stub, RU/EN/LV texts', () => {
  const f = read('features.js');
  assert.match(f, /Год — €29,99/); assert.match(f, /Месяц — €4,99/);
  assert.match(f, /≈ €2,50 в месяц · 14 дней бесплатно/);
  assert.match(f, /Без пробного периода · отмена в любой момент/);
  assert.match(f, /Восстановить покупки/); assert.equal(f.includes('7 дней'), false);
  const b = boot(seed());
  const D = b.run('DICT3');
  for (const ru of ['Попробовать 14 дней бесплатно', 'Без пробного периода · отмена в любой момент', 'Пора прибавить ↑', 'Держи вес', 'Сбавь ↓', 'Графики за всю историю']) {
    const r = D.find(x => x[0] === ru); assert.ok(r && r[1] && r[2], ru);
  }
});
