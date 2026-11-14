'use strict';
// P-305c: Premium v3 fixes — no ?demo= bypass when the paywall is on, demo start clamped to PAYWALL_LAUNCH.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

function boot(stored, extra) {
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
  Object.assign(g, extra || {});
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
const SUB = ['programs', 'autoWeight', 'deload', 'breakReturn', 'video', 'charts', 'prs', 'oneRM', 'muscleVolume', 'girths'];
const NEVER = ['diary', 'prevInField', 'history', 'library', 'pain', 'limitations', 'painSwap', 'disclaimer', 'sync', 'exportCsv', 'deleteAccount', 'bodyWeight', 'warmup', 'cooldown'];
const can = (b, f) => b.run(`can(${JSON.stringify(f)})`);
// launch long ago = no clamp; the empty-launch fallback is tested separately
const gateOn = b => b.run('PREM_CFG.PAYWALL_ENABLED=true; PREM_CFG.PAYWALL_LAUNCH=1');

test('gate is off until Play Billing: every real user (fresh, old, after 14 days) gets everything', () => {
  const now = Date.now();
  for (const st of [undefined, seed(), seed({ demoStart: now - 60 * DAY, workouts: [hist(now - 60 * DAY, 60, [10, 10, 10])] })]) {
    const b = boot(st);
    assert.equal(b.run('PREM_CFG.PAYWALL_ENABLED'), false);
    assert.equal(b.run('premTier()'), 'open');
    assert.equal(b.run('isPremium()'), true);
    for (const f of SUB.concat(NEVER)) assert.equal(can(b, f), true, f);
    assert.equal(b.run('premNextMoment()'), null); // no automatic paywall for real users
  }
});

test('one feature table: subscription vs free forever; v1 flags are gone', () => {
  const b = boot(seed());
  for (const f of SUB) assert.equal(b.run(`FEATURES[${JSON.stringify(f)}]`), 'sub', f);
  for (const f of NEVER) { assert.equal(b.run(`FEATURES[${JSON.stringify(f)}]`), 'free', f); assert.ok(b.run(`NEVER_GATED.includes(${JSON.stringify(f)})`), f); }
  for (const old of ['autoWeightArrow', 'programDays6', 'programSwitch', 'charts90', 'chartsFull', 'equipProfiles', 'bodyGirths']) assert.equal(b.run(`${JSON.stringify(old)} in FEATURES`), false, old);
  const p = read('premium.js') + read('features.js') + read('autow.js') + read('app.js');
  for (const gone of ['PREM_BLOCK_DAYS', 'blockEnded', 'awDir', 'AW_DIR', 'chartFrom', 'S.progStart=', 'Пора прибавить']) assert.equal(p.includes(gone), false, gone);
});

test('demo: 14 days from the FIRST COMPLETED workout; before it full access; then free', () => {
  const now = Date.now();
  const b = boot(seed()); gateOn(b);
  let st = b.run('premState()');
  assert.equal(st.tier, 'trial'); assert.equal(st.pre, true); // not started yet: full access
  assert.equal(can(b, 'programs'), true);
  b.run(`S.workouts=[${JSON.stringify(hist(now - 5 * DAY, 60, [10, 10, 10]))}]`);
  st = b.run('premState()');
  assert.equal(st.tier, 'trial'); assert.equal(st.left, 10);
  b.run(`S.workouts.unshift(${JSON.stringify(hist(now - 20 * DAY, 60, [10, 10, 10]))})`);
  assert.equal(b.run('premTier()'), 'free');
  for (const f of SUB) assert.equal(can(b, f), false, f);
  for (const f of NEVER) assert.equal(can(b, f), true, f);
  b.run('S.premium=true'); assert.equal(b.run('premTier()'), 'premium');
  b.run('S.premium=false;S.ownerPremium=true'); assert.equal(b.run('premTier()'), 'premium');
});

test('demo start is stored once (first completed workout) and only ever moves earlier', () => {
  const now = Date.now();
  const b = boot(seed());
  b.run(`premMarkDemo({start:${now - 2 * DAY},end:${now - 2 * DAY + 3600e3}})`);
  assert.equal(b.run('S.demoStart'), now - 2 * DAY + 3600e3);
  b.run(`premMarkDemo({start:${now},end:${now + 1}})`);
  assert.equal(b.run('S.demoStart'), now - 2 * DAY + 3600e3); // a later workout never moves it
  assert.equal(b.run(`premMergeStart(${now},${now - DAY})`), now - DAY);
  assert.equal(b.run(`premMergeStart(0,${now})`), now);
  assert.equal(b.run(`premMergeStart(undefined,null)`), 0);
  // stored date earlier than history (e.g. history deleted) still counts
  b.run(`S.demoStart=${now - 30 * DAY}`); gateOn(b);
  assert.equal(b.run('premTier()'), 'free');
});

test('sync keeps the earliest demo start (account and device), never a later one', () => {
  const s = read('sync.js');
  assert.match(s, /function keepEarliestDemo\(a,b\)\{const m=\[a,b\]\.filter\(x=>typeof x==='number'&&isFinite\(x\)&&x>0\);if\(m\.length\) S\.demoStart=Math\.min\(\.\.\.m\)\}/);
  assert.match(s, /ds=S\.demoStart;\n    Object\.keys\(R\)\.forEach\(k=>\{S\[k\]=R\[k\]\}\);\n    keepEarliestDemo\(ds,R\.demoStart\);/);
  assert.match(s, /keepEarliestDemo\(S\.demoStart,R\.demoStart\);/);
  // payload keeps demoStart (only owner/active/install/health fields are stripped)
  const pay = /function payloadOf\(src\)\{[\s\S]*?return p;\n  \}/.exec(s)[0];
  assert.equal(pay.includes('demoStart'), false);
  // run the merge helper itself
  const fn = /function keepEarliestDemo[^\n]*/.exec(s)[0];
  const ctx = vm.createContext({ S: { demoStart: 500 } });
  vm.runInContext(fn + ';keepEarliestDemo(S.demoStart,300)', ctx); assert.equal(ctx.S.demoStart, 300);
  vm.runInContext('keepEarliestDemo(S.demoStart,900)', ctx); assert.equal(ctx.S.demoStart, 300);
  vm.runInContext('S.demoStart=undefined;keepEarliestDemo(S.demoStart,700)', ctx); assert.equal(ctx.S.demoStart, 700);
  vm.runInContext('S.demoStart=undefined;keepEarliestDemo(undefined,undefined)', ctx); assert.equal(ctx.S.demoStart, undefined);
});

test('finishing a workout records the demo start; history and exercise ids unchanged', () => {
  const now = Date.now();
  const b = boot(seed({ workouts: [hist(now - 3 * DAY, 60, [10, 10, 9])] }));
  const hist0 = b.run('JSON.stringify(S.workouts)');
  b.run('startW(0)'); finish(b, [12, 12, 12], 'easy');
  b.run('awMoment(S.workouts[S.workouts.length-1])');
  assert.equal(b.run('S.demoStart'), now - 3 * DAY + 3600e3); // earliest completed workout wins
  assert.equal(b.run('JSON.stringify(S.workouts.slice(0,1))'), hist0);
  assert.deepEqual(JSON.parse(b.run('JSON.stringify(S.workouts.map(w=>w.items.map(i=>i.exId)))')), [['bp'], ['bp', 'mk-front-plank']]);
});

test('review modes ?demo=free|premium|trial|trialend|off live outside user data', () => {
  const now = Date.now();
  const b = boot(seed({ workouts: [hist(now - 3 * DAY, 60, [10, 10, 9])], body: [{ id: 'b1', date: '2026-11-01', weight: 80, waist: 85 }], consentHealth: { v: 1, at: '2026-11-01' } }));
  const before = b.run('JSON.stringify(S)'), stored = b.store.get('gym');
  assert.equal(b.run('premUrl("?x=1&demo=trialend")'), 'trialend'); assert.equal(b.store.get('gymDemoTier'), 'trialend');
  let st = b.run('premState()'); assert.equal(st.tier, 'trial'); assert.equal(st.left, 2);
  assert.equal(b.run('premUrl("?demo=trial")'), 'trial');
  st = b.run('premState()'); assert.equal(st.tier, 'trial'); assert.equal(st.left, 14);
  assert.equal(b.run('premUrl("?demo=free")'), 'free'); assert.equal(b.run('premTier()'), 'free');
  assert.equal(b.run('premUrl("?demo=premium")'), 'premium'); assert.equal(b.run('premTier()'), 'premium');
  assert.equal(b.run('premUrl("?demo=off")'), 'off'); assert.equal(b.store.has('gymDemoTier'), false); assert.equal(b.run('premTier()'), 'open');
  for (const t of ['free', 'trial', 'trialend', 'premium', 'off']) { demo(b, t); b.run('isPremium();can("girths");premState();premNextMoment();premProgLock()'); }
  assert.equal(b.run('JSON.stringify(S)'), before);
  assert.equal(b.store.get('gym'), stored);
});

test('production paywall ignores ?demo= and deletes the stored demo key', () => {
  const now = Date.now();
  const b = boot(seed({ demoStart: now - 30 * DAY, workouts: [hist(now - 30 * DAY, 60, [10, 10, 10])] }));
  b.run('localStorage.setItem("gymDemoTier","premium")');
  gateOn(b);
  assert.equal(b.run('premUrl("?demo=premium")'), null);
  assert.equal(b.store.has('gymDemoTier'), false);
  assert.equal(b.run('premTier()'), 'free');
  assert.equal(b.run('isPremium()'), false);
  // setDemoTier must also refuse and keep the key deleted
  assert.equal(b.run('setDemoTier("premium");localStorage.getItem("gymDemoTier")'), null);
  // TEST_BUILD still allows review modes when the paywall is on
  b.run('PREM_CFG.TEST_BUILD=true');
  assert.equal(b.run('premUrl("?demo=premium")'), 'premium');
  assert.equal(b.run('premTier()'), 'premium');
  assert.equal(b.store.get('gymDemoTier'), 'premium');
});

test('existing users get 14 days from PAYWALL_LAUNCH; new users count from the first workout', () => {
  const now = Date.now();
  const old = now - 90 * DAY;
  const b = boot(seed({ demoStart: old, workouts: [hist(old, 60, [10, 10, 10])] }));
  const hist0 = b.run('JSON.stringify(S.workouts)'), start0 = b.run('S.demoStart');
  gateOn(b);
  b.run(`PREM_CFG.PAYWALL_LAUNCH=${now}`);
  const st = b.run(`premState(${now})`);
  assert.equal(st.tier, 'trial');
  assert.equal(st.start, now);
  assert.equal(st.left, 14);
  assert.equal(b.run('S.demoStart'), start0); // stored value not rewritten
  assert.equal(b.run('JSON.stringify(S.workouts)'), hist0);

  // new user after launch: first workout after PAYWALL_LAUNCH
  const first = now - 2 * DAY - 3600e3;
  const n = boot(seed({ workouts: [hist(first, 60, [10, 10, 10])] }));
  gateOn(n);
  n.run(`PREM_CFG.PAYWALL_LAUNCH=${now - 5 * DAY}`);
  const st2 = n.run(`premState(${now})`);
  assert.equal(st2.tier, 'trial');
  assert.equal(st2.start, first + 3600e3);
  assert.equal(st2.left, 12);
  // launch unset with the paywall on (safeguard): launch = first run on this device, so old users still get 14 days
  const u = boot(seed({ demoStart: old, workouts: [hist(old, 60, [10, 10, 10])] }));
  u.run('PREM_CFG.PAYWALL_ENABLED=true');
  assert.equal(u.run('PREM_CFG.PAYWALL_LAUNCH'), null);
  assert.equal(u.run('premTier()'), 'trial');
  const fb = +u.store.get('gymPwLaunch');
  assert.ok(fb > 0 && Math.abs(fb - now) < 60e3);
  assert.equal(u.run(`premState(${fb + 15 * DAY}).tier`), 'free'); // the stored date is reused, not reset to "now"
  assert.equal(u.run('S.demoStart'), old);
});

test('without subscription movekit-sign is never called: no video, no poster, no direct sign', async () => {
  const calls = [];
  const b = boot(seed(), {
    MZ_SB: { url: 'https://example.test', anon: 'anon-test' },
    fetch: async (url) => { calls.push(String(url)); return { ok: true, status: 200, json: async () => ({ signedUrl: '/object/sign/movekit/x?token=t' }), blob: async () => new Blob(['x']) }; }
  });
  demo(b, 'free');
  // no markup that would start a load
  assert.equal(b.run('animMedia("bp")').includes('data-mk'), false);
  assert.match(b.run('animMedia("bp")'), /data-pw=/);
  assert.equal(b.run('animThumb("bp")').includes('data-mk-poster'), false);
  assert.equal(b.run('animPosterBox("bp")'), '');
  // and even if called directly, nothing is signed
  await assert.rejects(b.run('movekitSignPath("barbell-bench-press.mp4")'), /locked/);
  await b.run('movekitSignedUrl("bp").catch(()=>null)');
  const v = { isConnected: true, dataset: { mk: 'bp', mkPoster: 'bp' }, removed: 0, remove() { this.removed++; }, play() { return Promise.resolve(); } };
  b.run('globalThis.__v=null'); b.run('(v)=>{globalThis.__v=v}')(v);
  await b.run('loadMovekit(__v)'); assert.equal(v.removed, 1);
  const p = { isConnected: true, dataset: { mkPoster: 'bp' }, classList: { contains: () => false } };
  b.run('(p)=>{globalThis.__p=p}')(p);
  await b.run('loadMovekitPoster(__p)'); assert.equal(p.dataset.mkPosterState, 'fail');
  b.run('startAnim(__v)'); assert.equal(v.removed, 2);
  assert.deepEqual(calls, []);
  // trial and paid users do sign (sanity)
  demo(b, 'trial');
  assert.match(b.run('animMedia("bp")'), /data-mk="bp"/);
  const url = await b.run('movekitSignPath("barbell-bench-press.mp4")');
  assert.match(url, /sign/); assert.equal(calls.length, 1); assert.match(calls[0], /functions\/v1\/movekit-sign$/);
});

test('free forever after the demo: diary, sets, previous weight and reps, pain, history stay open', () => {
  const now = Date.now();
  const b = boot(seed({ workouts: [hist(now - 3 * DAY, 60, [10, 10, 9])] }));
  demo(b, 'free');
  const hist0 = b.run('JSON.stringify(S.workouts)'), next0 = b.run('S.next');
  b.run('premStartFree()');
  assert.equal(b.run('S.active.dayName'), 'Своя тренировка');
  assert.equal(b.run('!!S.active.warm && !!S.active.warm.P'), true); // P-307: warm-up/cool-down are free
  assert.equal(b.run('!!S.active.cool && !!S.active.cool.cd'), true);
  assert.ok(b.run('S.active.warm.c.length') > 0);
  assert.ok(b.run('S.active.cool.c.length') > 0);
  assert.equal(b.run('S.active.items.length'), 0);
  // own exercise from the list → previous weight and reps prefilled, no auto-weight suggestion
  b.run('S.active.items.push({exId:"bp",ns:3,rest:120,min:8,max:12,sets:[0,0,0].map(()=>({w:"",r:12,done:false}))});awApply(S.active.items[0],null)');
  assert.deepEqual(JSON.parse(b.run('JSON.stringify(S.active.items[0].sets.map(s=>[s.w,s.r]))')), [[60, 10], [60, 10], [60, 9]]);
  assert.equal(b.run('S.active.items[0].sug'), null);
  const h = b.run('awSugHTML(Object.assign(S.active.items[0],{pain:true}),0)');
  assert.match(h, /Боль/); assert.equal(/Авто-вес|↑|↓/.test(h), false);
  // finishing keeps the planned day and history
  b.run('const A=S.active;A.items[0].sets.forEach(s=>s.done=true);A.end=Date.now();S.workouts.push(A);S.next=(A.dayIdx+1)%S.program.length;S.active=null');
  assert.equal(b.run('S.next'), next0);
  assert.equal(b.run('JSON.stringify(S.workouts.slice(0,1))'), hist0);
});

test('subscription features after the demo: programs read-only, auto-weight, deload, charts, PRs, girths', () => {
  const now = Date.now();
  const st = seed({ pgSince: now - 36 * DAY, consentHealth: { v: 1, at: '2026-11-01' }, body: [{ id: 'b1', date: '2026-11-01', weight: 80, waist: 85 }], workouts: [hist(now - 40 * DAY, 60, [10, 10, 10]), hist(now - 2 * DAY, 80, [10, 10, 10])] });
  const f = boot(st); demo(f, 'free');
  assert.match(f.run('premProgLock()'), /по подписке/);
  f.run('startW(0)');
  assert.equal(f.run('S.active.dl'), null); // no deload
  assert.equal(f.run('S.active.items[0].sug'), null); // no auto-weight
  assert.deepEqual(JSON.parse(f.run('JSON.stringify(S.active.items[0].sets.map(s=>s.w))')), [80, 80, 80]); // previous weight only
  f.run('S.active=null');
  assert.match(f.run('volBadges()'), /по подписке/);
  f.run('globalThis.__app=0;document.body.append=function(){globalThis.__app++}');
  f.run('celebrate("x",{t:"",o:"",n:""})'); assert.equal(f.run('__app'), 0); // no PR celebration without subscription
  f.run('progress()'); assert.match(f.run('app.innerHTML'), /Графики и рекорды/);
  const body0 = f.run('JSON.stringify(S.body)');
  f.run('chart=function(){};bM="waist";body()'); assert.equal(f.run('bM'), 'weight'); assert.equal(f.run('JSON.stringify(S.body)'), body0);
  const p = boot(st); demo(p, 'premium');
  assert.equal(p.run('premProgLock()'), '');
  p.run('startW(0)'); assert.equal(p.run('S.active.dl'), 'scheduled');
  assert.match(p.run('volBadges()'), /badge/);
});

test('trial: programs, warm-up and auto-weight are open; sign-in offer before the first workout', () => {
  const b = boot(seed()); demo(b, 'trial');
  for (const f of SUB) assert.equal(can(b, f), true, f);
  const s = read('features.js');
  assert.match(s, /st\.tier==='trial'&&!premFirstWorkout\(\)&&!hide&&!\(typeof mzSignedIn==='function'&&mzSignedIn\(\)\)/);
  assert.match(read('sync.js'), /window\.mzSignedIn=\(\)=>!!user;/);
});

test('paywall moments: first increase, 3rd demo workout, 2 days before the end; once each; never mid-workout', () => {
  const now = Date.now();
  const b = boot(seed({ workouts: [hist(now - 3 * DAY, 60, [12, 12, 12])] })); demo(b, 'trial');
  b.run('startW(0)'); finish(b, [12, 12, 12], 'easy'); b.run('startW(0)');
  assert.equal(b.run('S.active.items[0].sug.note'), 'inc');
  assert.equal(b.run('premNextMoment()'), 'inc'); // auto-weight suggested +2.5 kg → pending
  assert.equal(b.run('paywall("x")'), false); assert.equal(b.run('premMoment()'), false); // never during the workout
  b.run('S.active=null');
  assert.equal(b.run('premMoment()'), true); assert.equal(b.run('premNextMoment()'), null);
  // 3rd workout of the demo
  const c = boot(seed()); demo(c, 'trial');
  c.run(`S.workouts=[1,2].map(i=>({id:'w'+i,start:Date.now()-i*1000,end:Date.now()-i*500,items:[]}))`);
  assert.equal(c.run('premNextMoment()'), null);
  c.run(`S.workouts.push({id:'w3',start:Date.now()-100,end:Date.now()-50,items:[]})`);
  assert.equal(c.run('premNextMoment()'), 'third'); assert.equal(c.run('premMoment()'), true); assert.equal(c.run('premMoment()'), false);
  // 2 days left
  const e = boot(seed()); demo(e, 'trialend');
  assert.equal(e.run('premNextMoment()'), 'ending'); assert.equal(e.run('premMoment()'), true); assert.equal(e.run('premMoment()'), false);
  // after the demo / premium: no automatic moments (only when opening a paid feature)
  for (const t of ['free', 'premium', 'off']) { const x = boot(seed()); demo(x, t); x.run('premFlagInc()'); assert.equal(x.run('premNextMoment()'), null, t); }
});

test('Premium screen v3: 14 days without card, yearly first ≈ €2,50/мес, no store trial, always-free list, RU/EN/LV', () => {
  const f = read('features.js');
  assert.match(f, /14 дней бесплатно, без карты/);
  assert.ok(f.indexOf('Год — €29,99') < f.indexOf('Месяц — €4,99'));
  assert.match(f, /≈ €2,50\/мес/); assert.match(f, /Всегда бесплатно:/); assert.match(f, /Восстановить покупки/);
  for (const gone of ['Попробовать 14 дней', 'Без пробного периода', 'После 14 дней', '−50%', '21']) assert.equal(f.includes(gone), false, gone);
  const b = boot(seed());
  b.run('paywall("")');
  const html = b.run('document.querySelector("#pw").innerHTML');
  assert.ok(html.indexOf('Год — €29,99') < html.indexOf('Месяц — €4,99'));
  assert.match(html, /Всегда бесплатно:[\s\S]*разминка и заминка/);
  assert.equal(/<li>Разминка и заминка<\/li>/.test(html), false);
  const D = b.run('DICT3');
  for (const ru of ['14 дней бесплатно, без карты', 'Дневник остаётся бесплатным', 'Всегда бесплатно:', '≈ €2,50/мес', 'Год — €29,99', 'Месяц — €4,99', 'Оформить подписку', '▶ Начать свою тренировку', 'Демо: осталось дней —']) {
    const r = D.find(x => x[0] === ru); assert.ok(r && r[1] && r[2], ru);
  }
  assert.equal(D.some(x => /Пора прибавить|Попробовать 14/.test(x[0])), false);
  assert.equal(b.run('PREM_NAME'), 'Мой Зал Premium');
  assert.match(html, /Мой Зал Premium/);
  // after the demo the subtitle changes; during/before it stays the 14-day line
  demo(b, 'free');
  b.run('paywall("")');
  const htmlFree = b.run('document.querySelector("#pw").innerHTML');
  assert.match(htmlFree, /Дневник остаётся бесплатным/);
  assert.equal(htmlFree.includes('<b>14 дней бесплатно, без карты</b>'), false);
  demo(b, 'off');
  b.run('paywall("")');
  assert.match(b.run('document.querySelector("#pw").innerHTML'), /<b>14 дней бесплатно, без карты<\/b>/);
  assert.match(read('LV-REVIEW.md'), /P-305b Premium model v3/);
  assert.match(read('LV-REVIEW.md'), /P-305c Premium screen subtitle/);
  const sw = read('sw.js');
  assert.match(sw, /const C='moyzal-v54'/); assert.match(sw, /'premium\.js','features\.js'/);
});
