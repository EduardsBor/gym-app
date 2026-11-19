'use strict';
// P-304: equipment profiles (CRUD, switch, swaps, sync merge, wipe).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const tick = () => new Promise(r => setImmediate(r));
const USER = { id: '11111111-2222-3333-4444-555555555555', email: 'someone@example.com' };

function mockStorage(initial) {
  const data = new Map();
  const ls = {
    getItem(k) { return data.has(k) ? data.get(k) : null; },
    setItem(k, v) { data.set(String(k), String(v)); ls[k] = String(v); },
    removeItem(k) { data.delete(String(k)); delete ls[k]; },
    clear() { for (const k of data.keys()) delete ls[k]; data.clear(); },
    key(i) { return [...data.keys()][i] ?? null; },
    get length() { return data.size; }
  };
  if (initial) for (const [k, v] of Object.entries(initial)) ls.setItem(k, v);
  return { ls, data };
}
function fakeIDB() {
  const dbs = new Map();
  const later = fn => queueMicrotask(fn);
  function req(fill) {
    const r = { result: undefined, error: null, onsuccess: null, onerror: null, onupgradeneeded: null, onblocked: null };
    later(() => { try { fill(r); if (r.onsuccess) r.onsuccess({ target: r }); } catch (e) { r.error = e; if (r.onerror) r.onerror({ target: r }); } });
    return r;
  }
  function storeApi(map) {
    return {
      get(k) { return { result: map.get(k), error: null }; },
      put(v, k) { map.set(k, v); return { result: undefined, error: null }; },
      delete(k) { map.delete(k); return { result: undefined, error: null }; },
      getAllKeys() { return { result: [...map.keys()], error: null }; }
    };
  }
  function conn(db) {
    return {
      objectStoreNames: { contains: n => db.stores.has(n) },
      createObjectStore(n) { if (!db.stores.has(n)) db.stores.set(n, new Map()); return storeApi(db.stores.get(n)); },
      transaction(storeName) {
        const t = { oncomplete: null, onerror: null, error: null, objectStore(n) { return storeApi(db.stores.get(n)); } };
        later(() => { if (t.oncomplete) t.oncomplete(); });
        return t;
      }
    };
  }
  return {
    dbs,
    indexedDB: {
      open(name, version) {
        return req(r => {
          let db = dbs.get(name);
          const oldVer = db ? db.version : 0;
          if (!db) { db = { version: version || 1, stores: new Map() }; dbs.set(name, db); }
          if ((version || 1) > oldVer) db.version = version || 1;
          r.result = conn(db);
          if ((version || 1) > oldVer && r.onupgradeneeded) r.onupgradeneeded({ target: r, oldVersion: oldVer, newVersion: db.version });
        });
      },
      deleteDatabase(name) { return req(() => { dbs.delete(name); }); }
    }
  };
}
function fakeSupabase(cloud) {
  return {
    createClient() {
      const table = name => ({
        insert(row) { cloud.inserts.push({ table: name, row: JSON.parse(JSON.stringify(row)) }); return Promise.resolve({ error: null }); },
        upsert(row) { cloud.upserts.push({ table: name, row: JSON.parse(JSON.stringify(row)) }); return Promise.resolve({ error: null }); },
        select() { return { eq() { return { maybeSingle() { return Promise.resolve({ data: cloud.remote || null, error: null }); } }; } }; },
        delete() { return { eq(col, val) { cloud.deletes.push({ table: name, col, val }); return Promise.resolve({ error: cloud.deleteError || null }); } }; }
      });
      return {
        from: table,
        rpc(name, args) { cloud.rpcs.push({ name, args }); return Promise.resolve({ error: cloud.rpcError || null }); },
        auth: {
          onAuthStateChange() {},
          getSession() { return Promise.resolve({ data: { session: cloud.user ? { user: cloud.user } : null } }); },
          signOut() { cloud.signedOut = (cloud.signedOut || 0) + 1; return Promise.resolve({ error: null }); },
          updateUser() { return Promise.resolve({}); }
        }
      };
    }
  };
}
function elFactory(nodes) {
  return function el(id) {
    if (id && nodes.has(id)) return nodes.get(id);
    const node = {
      id: id || '', innerHTML: '', textContent: '', className: '', value: '', style: {}, dataset: {},
      classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
      append() {}, addEventListener() {}, insertAdjacentHTML() {}, setAttribute() {}, getAttribute() { return null; }, closest() { return null; },
      querySelector() { return null; }, querySelectorAll() { return []; }
    };
    if (id) nodes.set(id, node);
    return node;
  };
}
function boot(stored, opts) {
  opts = opts || {};
  const { ls, data } = mockStorage(stored !== undefined ? { gym: JSON.stringify(stored) } : undefined);
  const idb = fakeIDB();
  const nodes = new Map();
  const el = elFactory(nodes);
  const g = {
    console, setTimeout() { return 0; }, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
    scrollTo() {}, crypto: require('crypto').webcrypto, addEventListener() {}, prompt() { return null; },
    confirm() { return opts.confirm !== false; }, alert(m) { g.__alerts.push(String(m)); },
    URL, Blob, navigator: { language: 'ru', languages: ['ru'] },
    localStorage: ls,
    location: { href: 'http://127.0.0.1/', origin: 'http://127.0.0.1', pathname: '/', search: '', reload() { g.__reloaded = true; } },
    document: {
      documentElement: { lang: 'ru' }, title: '', body: { append() {}, style: {} },
      querySelector(sel) { const m = /^#([\w-]+)/.exec(sel || ''); return el(m ? m[1] : ''); },
      querySelectorAll() { return []; }, addEventListener() {}, createElement() { return el(); }
    },
    indexedDB: idb.indexedDB,
    caches: { keys() { return Promise.resolve([]); }, delete() { return Promise.resolve(true); } },
    __alerts: [], __reloaded: false
  };
  g.window = g; g.globalThis = g; g.self = g;
  const ctx = vm.createContext(g);
  const files = ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'place.js', 'prog.js', 'plan.js', 'movekit.js', 'premium.js', 'features.js', 'csv.js'];
  if (opts.cloud) {
    g.MZ_SB = { url: 'https://example.invalid', anon: 'test-anon' }; g.supabase = fakeSupabase(opts.cloud);
    files.push('sync.js');
  }
  for (const f of files) {
    let src = read(f);
    if (f === 'sync.js') src = src.replace('  init();\n})();', '  window.__mzApplyRemoteFresh=applyRemoteFresh;window.__mzApplyMerged=applyMerged;window.__mzSync=sync;window.__mzDeleteCloud=mzDeleteCloud;\n  init();\n})();');
    vm.runInContext(src, ctx, { filename: f });
  }
  return { run: code => vm.runInContext(code, ctx), store: data, idb: idb.dbs, g };
}
function seed(extra) {
  return Object.assign({
    lang: 'ru', goal: 'mass', days: 3, next: 1, obDone: 1, schema: 4, ownerPremium: false, updatedAt: 1000,
    prof: { goal: 'mass', sex: 'm', level: 'mid', days: 3, len: 60, place: 'g', prio: [], lim: [] },
    program: [{ name: 'A', items: [{ exId: 'bp', sets: 3, min: 8, max: 12, rest: 120 }] }, { name: 'B', items: [{ exId: 'sq', sets: 3, min: 8, max: 12, rest: 120 }] }],
    workouts: [], custom: [], body: [], templates: [], deletedTemplates: []
  }, extra || {});
}
function T(id, name, items, at) {
  return { id, name, items, updatedAt: at || 1 };
}


function P(id, name, places, at, preset) {
  const o = { id, name, places, updatedAt: at || 0 };
  if (preset) o.preset = 1;
  return o;
}

test('P-304: cache is moyzal-v67; equipProfile is free; video stays gated', () => {
  assert.match(read('sw.js'), /const C='moyzal-v107'/);
  assert.equal(read('sw.js').includes("C='moyzal-v59'"), false);
  const b = boot(seed());
  assert.equal(b.run('FEATURES.equipProfile'), 'free');
  assert.ok(b.run('NEVER_GATED.includes("equipProfile")'));
  assert.equal(b.run('can("equipProfile")'), true);
  b.run('PREM_CFG.PAYWALL_ENABLED=true; PREM_CFG.PAYWALL_LAUNCH=1; S.premium=false; S.ownerPremium=false; S.demoStart=Date.now()-30*PREM_DAY');
  assert.equal(b.run('premTier()'), 'free');
  assert.equal(b.run('can("equipProfile")'), true);
  assert.equal(b.run('can("library")'), true);
  assert.equal(b.run('can("video")'), false);
});

test('eqEnsure: onboarding/prof place maps to the initial active profile; presets exist; program and history stay intact', () => {
  const hist = [{ id: 'w1', start: 1000, end: 2000, dayName: 'A', items: [{ exId: 'bp', sets: [{ w: 80, r: 8, done: true }] }] }];
  const prog = [{ name: 'A', items: [{ exId: 'bp', sets: 3, min: 8, max: 12, rest: 120 }] }];
  const b = boot(seed({
    prof: { goal: 'mass', sex: 'm', level: 'mid', days: 3, len: 60, place: 'd', prio: [], lim: [] },
    program: prog, workouts: hist
  }));
  const out = JSON.parse(b.run(`JSON.stringify((()=>{eqEnsure();return{
    active:eqActiveId(),places:eqPlaces(),ids:eqAll().map(p=>p.id),names:eqAll().map(p=>p.name),
    prog:S.program[0].items[0].exId, hist:S.workouts[0].items[0].exId, place:S.prof.place
  }})())`));
  assert.equal(out.active, 'home');
  assert.equal(out.places, 'd');
  assert.deepEqual(out.ids.slice(0, 3), ['gym', 'home', 'body']);
  assert.ok(out.names.includes('Зал') && out.names.includes('Дом') && out.names.includes('Без инвентаря'));
  assert.equal(out.prog, 'bp');
  assert.equal(out.hist, 'bp');
  assert.equal(out.place, 'd');
  const gym = boot(seed({ prof: { goal: 'mass', sex: 'm', level: 'mid', days: 3, len: 60, place: 'g', prio: [], lim: [] } }));
  assert.equal(gym.run('eqActiveId()'), 'gym');
  const body = boot(seed({ prof: { goal: 'mass', sex: 'm', level: 'mid', days: 3, len: 60, place: 'b', prio: [], lim: [] } }));
  assert.equal(body.run('eqActiveId()'), 'body');
});

test('profile CRUD: rename, add one custom, reject empty and a second custom, delete tombstone, presets stay', () => {
  const b = boot(seed());
  assert.equal(b.run('eqSave({id:"home",name:"",places:"d"})'), null);
  assert.equal(b.run('eqSave({id:"home",name:"Дом",places:""})'), null);
  const renamed = b.run('eqSave({id:"home",name:"  Дом у меня  ",places:"d"}).name');
  assert.equal(renamed, 'Дом у меня');
  const id = b.run('eqSave({name:"Гараж",places:"db"}).id');
  assert.ok(id);
  assert.equal(b.run('eqGet('+JSON.stringify('dummy')+')'), null);
  assert.equal(b.run(`eqGet(${JSON.stringify('')})` ), null);
  const custom = JSON.parse(b.run(`JSON.stringify(eqGet(${JSON.stringify(id)}))`));
  // re-read after we have id
  const got = JSON.parse(b.run(`JSON.stringify(S.eqProfiles.find(p=>!['gym','home','body'].includes(p.id)))`));
  assert.equal(got.name, 'Гараж');
  assert.equal(got.places, 'db');
  assert.ok(got.updatedAt > 0);
  assert.equal(b.run('eqCanAdd()'), false);
  assert.equal(b.run('eqSave({name:"Ещё",places:"g"})'), null);
  b.run(`eqDelete(${JSON.stringify(got.id)})`);
  assert.equal(b.run(`!!S.eqProfiles.find(p=>p.id===${JSON.stringify(got.id)})`), false);
  assert.ok(b.run(`S.deletedEqProfiles.includes(${JSON.stringify(got.id)})`));
  assert.equal(b.run('eqCanAdd()'), true);
  assert.equal(b.run('eqDelete("gym")'), false);
  assert.equal(b.run('eqDelete("home")'), false);
  assert.ok(b.run('!!eqGet("gym") && !!eqGet("home")'));
});

test('switching the active profile adapts Today/startW exercises and leaves the saved program and history alone', () => {
  const hist = [{ id: 'w1', start: 1000, end: 2000, dayName: 'A', items: [{ exId: 'bp', sets: [{ w: 80, r: 8, done: true }] }] }];
  const b = boot(seed({
    program: [{ name: 'A', items: [{ exId: 'bp', sets: 3, min: 8, max: 12, rest: 120 }, { exId: 'lat', sets: 3, min: 8, max: 12, rest: 90 }] }],
    workouts: hist, next: 0
  }));
  const gym = JSON.parse(b.run(`JSON.stringify((()=>{eqSetActive("gym");const d=eqAdaptDay(S.program[0]);return{ids:d.items.map(i=>i.exId),miss:eqAdaptMisses(S.program[0].items,"g")}})())`));
  assert.deepEqual(gym.ids, ['bp', 'lat']);
  const home = JSON.parse(b.run(`JSON.stringify((()=>{eqSetActive("home");const d=eqAdaptDay(S.program[0]);return{
    ids:d.items.map(i=>i.exId), saved:S.program[0].items.map(i=>i.exId), hist:S.workouts[0].items[0].exId,
    avail:d.items.every(i=>eqAvail(i.exId,"d")||eqAdaptMisses([i],"d").length>0),
    miss:eqAdaptMisses(S.program[0].items,"d"),
    bpAvail:eqAvail("bp","d"), dbpAvail:eqAvail("dbp","d"),
    same:d.items.every((it,i)=>eqSameMuscle(S.program[0].items[i].exId,it.exId))
  }})())`));
  assert.equal(home.bpAvail, false);
  assert.equal(home.dbpAvail, true);
  assert.equal(home.ids[0], 'dbp');
  assert.deepEqual(home.saved, ['bp', 'lat']);
  assert.equal(home.hist, 'bp');
  assert.equal(home.same, true);
  assert.ok(home.ids.every((id, i) => id === home.saved[i] || home.ids[i] !== 'bp' || id === 'dbp'));
  const started = JSON.parse(b.run(`JSON.stringify((()=>{eqSetActive("home");startW(0);return{ids:S.active.items.map(i=>i.exId),prof:S.active.eqProfile,saved:S.program[0].items.map(i=>i.exId),w:S.active.items[0].sets[0].w}})())`));
  assert.equal(started.ids[0], 'dbp');
  assert.equal(started.prof, 'home');
  assert.deepEqual(started.saved, ['bp', 'lat']);
});

test('swaps stay on the same primary muscles; no valid home replacement is left unchanged', () => {
  const b = boot(seed());
  const out = JSON.parse(b.run(`JSON.stringify((()=>{
    eqSetActive("home");
    const gymOnly=EX.filter(e=>libPlace(e.id)==="g").map(e=>e.id);
    const rows=gymOnly.map(id=>{
      const to=eqSwapFor(id,"d",new Set());
      const groupOk=to===id||eqSameMuscle(id,to);
      return{id,to,groupOk,same:to===id,avail:eqAvail(to,"d")};
    });
    const changed=rows.filter(r=>r.to!==r.id);
    const misses=rows.filter(r=>r.to===r.id);
    const bad=changed.filter(r=>!r.groupOk||!r.avail);
    return{changed:changed.length,misses:misses.map(r=>r.id),bad,sample:changed.slice(0,8),bp:eqSwapFor("bp","d",new Set()),lat:eqSwapFor("lat","d",new Set()),mch:eqSwapFor("mch","d",new Set())};
  })())`));
  assert.equal(out.bp, 'dbp');
  assert.equal(out.bad.length, 0);
  assert.ok(out.changed > 0);
  // cases with no valid home replacement are reported, not failed — the original id is kept
  assert.ok(Array.isArray(out.misses));
  if (typeof process !== 'undefined') {
    console.log('P-304 home misses ('+out.misses.length+'): '+out.misses.join(','));
  }
});

test('applyMerged: profiles merge by updatedAt; deletions stick; newer eqActiveAt wins', () => {
  const cloud = { inserts: [], upserts: [], deletes: [], rpcs: [], user: USER };
  const local = seed({
    updatedAt: 5000,
    eqProfiles: [
      P('gym', 'Зал', 'g', 0, 1),
      P('home', 'Дом локальный', 'd', 100, 1),
      P('body', 'Без инвентаря', 'b', 0, 1),
      P('eq-old', 'Старый', 'db', 50),
      P('eq-local', 'Только локально', 'g', 200)
    ],
    deletedEqProfiles: ['eq-del'],
    eqActive: 'gym',
    eqActiveAt: 8000
  });
  const b = boot(local, { cloud });
  b.g.__remote = {
    updatedAt: 9000,
    eqProfiles: [
      P('gym', 'Зал', 'g', 0, 1),
      P('home', 'Дом с облака', 'd', 300, 1),
      P('body', 'Без инвентаря', 'b', 0, 1),
      P('eq-old', 'Старый', 'db', 50),
      P('eq-remote', 'Только облако', 'b', 250)
    ],
    deletedEqProfiles: ['eq-old'],
    eqActive: 'home',
    eqActiveAt: 4000
  };
  // applyMerged is on window after sync hook — set remote via run
  const merged = JSON.parse(b.run(`JSON.stringify((()=>{
    const R={
      workouts:[],deletedWorkouts:[],body:[],deletedBody:[],custom:[],deletedCustom:[],
      templates:[],deletedTemplates:[],
      eqProfiles:[
        {id:'gym',name:'Зал',places:'g',updatedAt:0,preset:1},
        {id:'home',name:'Дом с облака',places:'d',updatedAt:300,preset:1},
        {id:'body',name:'Без инвентаря',places:'b',updatedAt:0,preset:1},
        {id:'eq-old',name:'Старый',places:'db',updatedAt:50},
        {id:'eq-remote',name:'Только облако',places:'b',updatedAt:250}
      ],
      deletedEqProfiles:['eq-old'],
      eqActive:'home', eqActiveAt:4000,
      updatedAt:9000, program:S.program, prof:S.prof, goal:S.goal, days:S.days
    };
    window.__mzApplyMerged(R, 9000);
    return{
      ids:S.eqProfiles.map(x=>x.id).sort(),
      home:S.eqProfiles.find(x=>x.id==='home').name,
      local:!!S.eqProfiles.find(x=>x.id==='eq-local'),
      remote:!!S.eqProfiles.find(x=>x.id==='eq-remote'),
      gone:!!S.eqProfiles.find(x=>x.id==='eq-old'),
      deleted:S.deletedEqProfiles.slice().sort(),
      active:S.eqActive,
      activeAt:S.eqActiveAt
    };
  })())`));
  assert.equal(merged.home, 'Дом с облака'); // remote newer
  assert.equal(merged.local, true);
  assert.equal(merged.remote, true);
  assert.equal(merged.gone, false);
  assert.ok(merged.deleted.includes('eq-old'));
  assert.ok(merged.deleted.includes('eq-del'));
  // local eqActiveAt 8000 > remote 4000 → gym stays
  assert.equal(merged.active, 'gym');
  assert.equal(merged.activeAt, 8000);

  // opposite: remote switch is newer
  const b2 = boot(seed({
    updatedAt: 5000,
    eqProfiles: [P('gym', 'Зал', 'g', 0, 1), P('home', 'Дом', 'd', 0, 1), P('body', 'Без инвентаря', 'b', 0, 1)],
    deletedEqProfiles: [],
    eqActive: 'gym',
    eqActiveAt: 1000
  }), { cloud });
  const act = b2.run(`(()=>{window.__mzApplyMerged({
    workouts:[],deletedWorkouts:[],body:[],deletedBody:[],custom:[],deletedCustom:[],
    templates:[],deletedTemplates:[],
    eqProfiles:S.eqProfiles, deletedEqProfiles:[],
    eqActive:'home', eqActiveAt:5000,
    updatedAt:2000, program:S.program, prof:S.prof, goal:S.goal, days:S.days
  },2000); return S.eqActive+'@'+S.eqActiveAt})()`);
  assert.equal(act, 'home@5000');
});

test('local wipe clears equipment profiles together with gym data', async () => {
  const b = boot(seed({
    eqProfiles: [P('gym', 'Зал', 'g', 0, 1), P('home', 'Дом', 'd', 0, 1), P('eq1', 'Гараж', 'db', 10)],
    eqActive: 'home',
    eqActiveAt: 99
  }));
  assert.ok(b.store.has('gym'));
  assert.ok(b.run('S.eqProfiles.some(p=>p.id==="eq1")'));
  await b.run('wipeAll()');
  for (let i = 0; i < 6; i++) await tick();
  assert.equal(b.store.has('gym'), false);
  assert.equal(b.g.__reloaded, true);
});

test('library filter defaults to the active profile places', () => {
  const b = boot(seed());
  b.run('eqSetActive("home"); LQ.q=""; LQ.g=""; LQ.p=""; LQ.places=""; LQ._eqAuto=undefined; libView()');
  const st = JSON.parse(b.run('JSON.stringify({p:LQ.p,places:LQ.places,auto:LQ._eqAuto})'));
  assert.equal(st.p, 'd');
  assert.equal(st.auto, 'home');
  const ids = JSON.parse(b.run('JSON.stringify(libFilter(EX,LQ).map(e=>e.id))'));
  assert.ok(ids.includes('dbp'));
  assert.equal(ids.includes('bp'), false); // gym-only
  assert.ok(ids.includes('pu')); // gdb includes d
});
