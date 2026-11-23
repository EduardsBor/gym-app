'use strict';
// P-302: library filters, own workout templates (CRUD, start, sync merge, wipe).
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

test('P-302: cache is moyzal-v67; templates are free; video stays gated', () => {
  assert.match(read('cache-ver.js'), /var SW_CACHE='moyzal-v151'/);
  assert.match(read('sw.js'), /const C=SW_CACHE/);
  assert.equal(read('sw.js').includes("C='moyzal-v59'"), false);
  const b = boot(seed());
  assert.equal(b.run('FEATURES.templates'), 'free');
  assert.ok(b.run('NEVER_GATED.includes("templates")'));
  assert.equal(b.run('can("templates")'), true);
  b.run('PREM_CFG.PAYWALL_ENABLED=true; PREM_CFG.PAYWALL_LAUNCH=1; S.premium=false; S.ownerPremium=false; S.demoStart=Date.now()-30*PREM_DAY');
  assert.equal(b.run('premTier()'), 'free');
  assert.equal(b.run('can("templates")'), true);
  assert.equal(b.run('can("library")'), true);
  assert.equal(b.run('can("warmup")'), true);
  assert.equal(b.run('can("video")'), false);
});

test('libFilter: muscle group, equipment place, search, and combinations; session LQ; missing META defaults to gdb', () => {
  const b = boot(seed());
  const chest = JSON.parse(b.run('JSON.stringify(libFilter(EX,{g:"Грудь"}).map(e=>e.id))'));
  assert.ok(chest.includes('bp') && chest.includes('pu') && !chest.includes('sq'));
  const gymOnly = JSON.parse(b.run('JSON.stringify(libFilter(EX,{p:"g"}).map(e=>e.id))'));
  assert.ok(gymOnly.includes('bp')); // META bp is g
  const body = JSON.parse(b.run('JSON.stringify(libFilter(EX,{p:"b"}).map(e=>e.id))'));
  assert.ok(body.includes('pu'));
  assert.equal(body.includes('mch'), false); // machine press is gym-only (g|)
  const both = JSON.parse(b.run('JSON.stringify(libFilter(EX,{g:"Грудь",p:"b"}).map(e=>e.id))'));
  assert.ok(both.includes('pu') && !both.includes('mch'));
  const q = JSON.parse(b.run('JSON.stringify(libFilter(EX,{q:"жим штанги лёжа"}).map(e=>e.id))'));
  assert.deepEqual(q, ['bp']);
  const combo = JSON.parse(b.run('JSON.stringify(libFilter(EX,{q:"жим",g:"Грудь",p:"g"}).map(e=>e.id))'));
  assert.ok(combo.includes('bp') && !combo.includes('ohp'));
  // session object is the default state
  b.run('LQ.g="Спина";LQ.p="d";LQ.q=""');
  const sess = JSON.parse(b.run('JSON.stringify(libFilter(EX).map(e=>e.id))'));
  assert.ok(sess.includes('dbr') && !sess.includes('lat')); // lat is gym-only, dbr is gd
  const missing = b.run('EX.filter(e=>!META[e.id]).map(e=>e.id).join(",")');
  assert.equal(missing, '');
  assert.equal(b.run('libPlace("no-such-id")'), 'gdb');
  assert.ok(b.run('libMatch({id:"no-such-id",name:"X",group:"Грудь"},{p:"b"})'));
  assert.ok(b.run('libMatch({id:"no-such-id",name:"X",group:"Грудь"},{p:"g"})'));
});

test('template CRUD: save, edit, reject empty, delete tombstone', () => {
  const b = boot(seed());
  assert.equal(b.run('tplSave({name:"",items:[{exId:"bp",sets:3,min:8,max:12,rest:120}]})'), null);
  assert.equal(b.run('tplSave({name:"Жим",items:[]})'), null);
  const id = b.run('tplSave({name:"  Жим день  ",items:[{exId:"bp",sets:3,min:8,max:12,rest:90},{exId:"fly",sets:3,min:10,max:15,rest:60}]}).id');
  assert.ok(id);
  assert.equal(b.run('S.templates.length'), 1);
  assert.equal(b.run('tplGet(S.templates[0].id).name'), 'Жим день');
  assert.equal(b.run('tplGet(S.templates[0].id).items.length'), 2);
  assert.ok(b.run('tplGet(S.templates[0].id).updatedAt>0'));
  b.run(`tplSave({id:${JSON.stringify(id)},name:"Жим+",items:[{exId:"bp",sets:4,min:6,max:10,rest:120}]})`);
  assert.equal(b.run('S.templates.length'), 1);
  assert.equal(b.run('S.templates[0].name'), 'Жим+');
  assert.equal(b.run('S.templates[0].items[0].sets'), 4);
  b.run(`tplDelete(${JSON.stringify(id)})`);
  assert.equal(b.run('S.templates.length'), 0);
  assert.ok(b.run(`S.deletedTemplates.includes(${JSON.stringify(id)})`));
});

test('startTemplate: logs like own workout, keeps S.next, copies last sets, warm/cool present', () => {
  const hist = {
    id: 'w1', start: 1000, end: 2000, dayName: 'A',
    items: [{ exId: 'bp', sets: [{ w: 80, r: 8, done: true }, { w: 80, r: 8, done: true }, { w: 80, r: 8, done: true }] }]
  };
  const b = boot(seed({ next: 1, workouts: [hist] }));
  b.run('tplSave({id:"t1",name:"Мой жим",items:[{exId:"bp",sets:3,min:8,max:12,rest:90},{exId:"fly",sets:3,min:10,max:15,rest:60}]})');
  const out = JSON.parse(b.run(`JSON.stringify((()=>{const A=startTemplate("t1");return{
    name:A.dayName,from:A.fromTemplate,n:A.items.length,ids:A.items.map(i=>i.exId),
    w:A.items[0].sets[0].w,r:A.items[0].sets[0].r,pf:A.items[0].sets[0].pf,
    dayIdx:A.dayIdx,next:S.next,warm:!!(A.warm&&A.warm.c),cool:!!(A.cool&&A.cool.c),
    diary:isDiaryWorkout(A)
  }})())`));
  assert.equal(out.name, 'Мой жим');
  assert.equal(out.from, 't1');
  assert.deepEqual(out.ids, ['bp', 'fly']);
  assert.equal(out.w, 80);
  assert.equal(out.r, 8);
  assert.equal(out.pf, true);
  assert.equal(out.next, 1);
  // dayIdx is the day before planned, so finish would keep S.next
  assert.equal(out.dayIdx, 0); // next was 1, program length 2 → day before is 0
  assert.equal(out.warm, true);
  assert.equal(out.cool, true);
  assert.equal(out.diary, true);
});

test('applyMerged: templates merge by updatedAt; deletions stick; both sides kept', () => {
  const cloud = { inserts: [], upserts: [], deletes: [], rpcs: [], user: USER };
  const local = seed({
    updatedAt: 5000,
    templates: [
      T('t-old', 'Local old', [{ exId: 'bp', sets: 3, min: 8, max: 12, rest: 90 }], 100),
      T('t-local', 'Only local', [{ exId: 'sq', sets: 3, min: 8, max: 12, rest: 90 }], 200),
      T('t-gone', 'Will delete', [{ exId: 'fly', sets: 3, min: 8, max: 12, rest: 60 }], 150)
    ],
    deletedTemplates: ['t-del']
  });
  const b = boot(local, { cloud });
  const out = JSON.parse(b.run(`JSON.stringify((()=>{
    __mzApplyMerged({
      lang:'en', updatedAt:9000,
      templates:[
        {id:'t-old',name:'Remote new',updatedAt:300,items:[{exId:'bp',sets:4,min:6,max:10,rest:120}]},
        {id:'t-remote',name:'Only remote',updatedAt:350,items:[{exId:'row',sets:3,min:8,max:12,rest:90}]},
        {id:'t-del',name:'Should not return',updatedAt:400,items:[{exId:'lp',sets:3,min:8,max:12,rest:90}]}
      ],
      deletedTemplates:['t-gone'],
      workouts:[], custom:[], body:[], prof:S.prof, program:S.program, consentHealth:null
    }, 9000);
    return {
      ids:S.templates.map(x=>x.id).sort(),
      oldName:S.templates.find(x=>x.id==='t-old').name,
      local:S.templates.find(x=>x.id==='t-local').name,
      remote:S.templates.find(x=>x.id==='t-remote').name,
      deleted:(S.deletedTemplates||[]).slice().sort()
    };
  })())`));
  assert.deepEqual(out.ids, ['t-local', 't-old', 't-remote']);
  assert.equal(out.oldName, 'Remote new');
  assert.equal(out.local, 'Only local');
  assert.equal(out.remote, 'Only remote');
  assert.deepEqual(out.deleted, ['t-del', 't-gone']);
});

test('local wipe clears templates together with gym data', async () => {
  const b = boot(seed({
    templates: [T('t1', 'Жим', [{ exId: 'bp', sets: 3, min: 8, max: 12, rest: 90 }], 10)]
  }));
  assert.ok(b.store.has('gym'));
  assert.equal(b.run('S.templates.length'), 1);
  await b.run('wipeAll()');
  for (let i = 0; i < 6; i++) await tick();
  assert.equal(b.store.has('gym'), false);
  assert.equal(b.g.__reloaded, true);
});
