'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

function loadSync(opts) {
  const store = (opts && opts.store) || new Map();
  const toasts = [];
  const g = {
    console, Date, JSON, TextEncoder, Promise, URL, Uint8Array,
    crypto: { getRandomValues(a) { for (let i = 0; i < a.length; i++) a[i] = (i * 17 + 3) & 255; return a; } },
    S: { workouts: [], body: [], updatedAt: Date.now() },
    localStorage: {
      getItem(k) { return store.has(k) ? store.get(k) : null; },
      setItem(k, v) { store.set(k, String(v)); },
      removeItem(k) { store.delete(k); }
    },
    location: { href: 'https://eduardsbor.github.io/gym-app/' },
    document: { hidden: true, visibilityState: 'hidden', addEventListener() {}, querySelector() { return null; } },
    navigator: { onLine: true },
    MZ_SB: { url: 'https://krrhwuldkwkkcegxhyqq.supabase.co', anon: 'test-anon' },
    supabase: {
      createClient() {
        return {
          auth: {
            onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; },
            getSession: async () => ({ data: { session: null } })
          },
          from() { return { upsert: async () => ({ error: null }), select() { return { eq() { return { maybeSingle: async () => ({ data: null, error: null }) }; } }; } }; }
        };
      }
    },
    toasts,
    toast(msg) { toasts.push(msg); },
    view: 'home',
    render() {},
    setInterval() { return 0; },
    clearInterval() {},
    addEventListener() {}
  };
  g.window = g;
  g.self = g;
  g.globalThis = g;
  vm.runInNewContext(read('sync.js').replace(/\n  init\(\);\n\}\)\(\);\s*$/, '\n})();'), g);
  return g;
}

test('D-279: leftover password wording is gone from friendly() and the dictionary; Google policy sentence stays', () => {
  const sync = read('sync.js');
  const dict = read('i18n/dict3.js');
  const legal = read('legal.js');
  assert.match(sync, /function friendly\(/);
  assert.match(sync, /Неверная почта или код/);
  assert.equal(sync.includes('Неверная почта или пароль'), false);
  assert.equal(sync.includes('Пароль не короче 6 символов'), false);
  assert.equal(sync.includes('password should be at least'), false);
  assert.equal(dict.includes('Забыли пароль?'), false);
  assert.equal(dict.includes('Пароль (не короче 6 символов)'), false);
  assert.equal(dict.includes('Укажи почту и пароль'), false);
  assert.equal(dict.includes('Пароль не короче 6 символов'), false);
  assert.equal(dict.includes('письмо для смены пароля'), false);
  assert.equal(dict.includes('Неверная почта или пароль'), false);
  assert.equal(dict.includes('Новый пароль (не короче 6 символов)'), false);
  assert.equal(dict.includes('Пароль обновлён'), false);
  assert.match(legal, /Пароль от Google мы не получаем/);
  const g = loadSync();
  assert.equal(g.mzFriendly({ message: 'Invalid login credentials' }), 'Неверная почта или код');
  assert.equal(g.mzFriendly({ message: 'Password should be at least 6 characters' }).includes('парол'), false);
  assert.equal(g.mzFriendly({ message: 'Password should be at least 6 characters' }).includes('Парол'), false);
});

test('D-279: profile shows 1.0 (vNNN) from a single SW cache-version source', () => {
  const ver = read('cache-ver.js');
  const sw = read('sw.js');
  const app = read('app.js');
  const feat = read('features.js');
  const html = read('index.html');
  const build = read('scripts/build-web.js');
  assert.match(ver, /var SW_CACHE='moyzal-v162'/);
  assert.equal((ver.match(/moyzal-v\d+/g) || []).length, 1);
  assert.equal(app.includes("SW_CACHE='moyzal-"), false);
  assert.equal(sw.includes("const C='moyzal-"), false);
  assert.match(sw, /importScripts\('\.\/cache-ver\.js'\)/);
  assert.match(sw, /const C=SW_CACHE/);
  assert.match(sw, /'cache-ver\.js'/);
  assert.match(html, /src="cache-ver\.js"/);
  assert.match(build, /'cache-ver\.js'/);
  assert.match(app, /function swCacheVer\(/);
  assert.match(app, /function appVersionLabel\(/);
  assert.match(app, /Версия \$\{appVersionLabel\(\)\}/);
  assert.match(feat, /appVersionLabel\(\)/);
  const g = { SW_CACHE: 'moyzal-v137', APP_VERSION: '1.0' };
  vm.runInNewContext(
    read('app.js').split('function swCacheVer')[1]
      ? 'const APP_VERSION=\'1.0\';\n' +
        read('app.js').match(/function swCacheVer\(\)\{[^]*?function appVersionLabel\(\)\{[^}]+\}/)[0] +
        '\nthis.label=appVersionLabel();\nthis.ver=swCacheVer();'
      : '',
    g
  );
  // fallback if regex is brittle: evaluate helpers copied from source
  const helpers = read('app.js').match(/function swCacheVer\(\)\{[^}]+}\nfunction appVersionLabel\(\)\{[^}]+}/);
  assert.ok(helpers);
  const box = { SW_CACHE: 'moyzal-v137', APP_VERSION: '1.0', label: '', ver: '' };
  vm.runInNewContext(helpers[0] + ';label=appVersionLabel();ver=swCacheVer();', box);
  assert.equal(box.label, '1.0 (v137)');
  assert.equal(box.ver, 'v137');
  const missing = { SW_CACHE: undefined, APP_VERSION: '1.0', label: '' };
  vm.runInNewContext(helpers[0] + ';label=appVersionLabel();', missing);
  assert.equal(missing.label, '1.0');
});

test('D-280: after a program is applied, its block file is cached asynchronously', () => {
  const blocks = read('blocks.js');
  const sw = read('sw.js');
  assert.match(blocks, /function cacheBlockFile\(/);
  assert.match(blocks, /function blockFileUrl\(/);
  const cacheFn = blocks.match(/function cacheBlockFile\([\s\S]*?\n\}/)[0];
  assert.equal(cacheFn.includes('XMLHttpRequest'), false);
  assert.equal(/open\(['"]GET['"].*false/.test(cacheFn), false);
  assert.match(blocks, /postMessage\(\{type:'cache-block',url:url\}\)/);
  assert.match(blocks, /if\(S\.block&&S\.block\.id\)cacheBlockFile\(S\.block\.id\)/);
  assert.match(sw, /d\.type!=='cache-block'/);
  assert.match(sw, /\^data\\\/blocks\\\/\[a-z0-9_\]\+\\.json\$/);

  const posts = [];
  const g = {
    S: { block: null },
    navigator: { serviceWorker: { controller: { postMessage(msg) { posts.push(msg); } } } },
    caches: undefined
  };
  const fns = blocks.match(/function blockFileUrl\([\s\S]*?\nfunction blockOnApplied\([\s\S]*?\n}/)[0];
  vm.runInNewContext(fns + '\nthis.blockFileUrl=blockFileUrl;this.cacheBlockFile=cacheBlockFile;this.blockOnApplied=blockOnApplied;', g);
  assert.equal(g.blockFileUrl('mass_nov_3_g_b36'), 'data/blocks/mass_nov_3_g_b36.json');
  assert.equal(g.blockFileUrl('../evil'), null);
  assert.equal(g.blockFileUrl('mass nov'), null);
  g.blockOnApplied({ blockId: 'mass_nov_3_g_b36' });
  assert.equal(JSON.stringify(posts), JSON.stringify([{ type: 'cache-block', url: 'data/blocks/mass_nov_3_g_b36.json' }]));
  assert.equal(g.S.block.id, 'mass_nov_3_g_b36');

  const calls = [];
  const self = {
    addEventListener(type, fn) { self['on' + type] = fn; },
    clients: { claim() {} }
  };
  const cachesStore = new Map();
  const env = {
    SW_CACHE: 'moyzal-v137',
    C: 'moyzal-v137',
    self,
    importScripts() {},
    caches: {
      async open(name) { return { async put(url, r) { calls.push(['put', name, url, r && r.ok]); }, async match() { return undefined; } }; },
      async keys() { return []; },
      async delete() { return true; }
    },
    fetch: async (req) => {
      const url = typeof req === 'string' ? req : req.url;
      calls.push(['fetch', url]);
      return { ok: true, url, clone() { return this; } };
    },
    Request: class { constructor(u, init) { this.url = u; this.cache = init && init.cache; } },
    Promise, Map, JSON
  };
  env.self = self;
  // Run only the message listener extracted from sw.js (avoid install/fetch).
  const msg = sw.match(/self\.addEventListener\('message',[\s\S]*?\n\}\);/);
  assert.ok(msg);
  vm.runInNewContext(msg[0], env);
  env.self.onmessage({ data: { type: 'cache-block', url: 'data/blocks/mass_mid_4_d_b36.json' }, waitUntil() {} });
  env.self.onmessage({ data: { type: 'cache-block', url: 'https://evil.example/x.json' }, waitUntil() {} });
  env.self.onmessage({ data: { type: 'cache-block', url: 'data/blocks/../app.js' }, waitUntil() {} });
  return Promise.resolve().then(() => {
    const fetches = calls.filter(c => c[0] === 'fetch').map(c => c[1]);
    assert.deepEqual(fetches, ['data/blocks/mass_mid_4_d_b36.json']);
    assert.equal(calls.some(c => String(c).includes('evil') || String(c).includes('app.js')), false);
  });
});

test('D-281: SQL-APPLIED.md lists 001–004 on krrhwuldkwkkcegxhyqq and marks unconfirmed facts', () => {
  const doc = read('docs/SQL-APPLIED.md');
  assert.match(doc, /krrhwuldkwkkcegxhyqq/);
  assert.match(doc, /001_stage2\.sql/);
  assert.match(doc, /002_movekit_private\.sql/);
  assert.match(doc, /003_anon_analytics\.sql/);
  assert.match(doc, /004_preplay_consent_tombstone\.sql/);
  assert.match(doc, /не подтверждено/i);
  assert.match(doc, /14\.11\.2026 ~13:50/);
  assert.match(doc, /21\.11\.2026 16:24/);
  assert.match(doc, /purge-old-events/);
  assert.match(doc, /list_migrations/);
  assert.equal(/service_role|eyJ|sb_secret|BEGIN RSA/.test(doc), false);
});

test('D-282: anim3d leftovers are gone; legacy place d suggests Дом; user_state snapshot is capped; JS minify skipped with a reason', () => {
  const tech = read('tech.js');
  const sw = read('sw.js');
  const app = read('app.js');
  const feat = read('features.js');
  const build = read('scripts/build-web.js');
  assert.equal(tech.includes('anim3d'), false);
  assert.equal(sw.includes('anim3d'), false);
  assert.equal(sw.includes('moyzal-anim3d'), false);
  assert.match(tech, /function hasAnim\(id\)\{return false\}/);
  assert.match(sw, /x!==C&&x!=='moyzal-movekit-v1'/);
  assert.match(app, /Q\.place==='d'\?\(Q\.place='b',''\):''/);
  assert.match(feat, /if\(OB\.place==='d'\)OB\.place='b'/);
  assert.equal(app.includes("Q.place='g'"), false);
  assert.equal(feat.includes("OB.place='g'"), false);

  const sync = read('sync.js');
  assert.match(sync, /const USER_STATE_MAX=900\*1024/);
  assert.match(sync, /function payloadForUpload\(/);
  assert.match(sync, /Слишком много данных для облака\. На устройстве всё на месте\./);
  const g = loadSync();
  assert.equal(g.USER_STATE_MAX, 900 * 1024);
  const small = g.mzPayloadForUpload();
  assert.equal(small.trimmed, false);
  assert.ok(small.payload);
  g.S.workouts = [];
  for (let i = 0; i < 8; i++) g.S.workouts.push({ id: 'w' + i, sets: [{ note: 'x'.repeat(120000) }] });
  const over = g.mzPayloadForUpload();
  assert.equal(over.trimmed, true);
  assert.ok(over.payload);
  assert.ok(over.payload.workouts.length < 8);
  // Local S must keep all 8 workouts even though the upload copy was trimmed.
  assert.equal(g.S.workouts.length, 8);
  assert.equal(g.S.workouts[0].sets[0].note.length, 120000);
  g.S.workouts = [{ id: 'keep-local', sets: [{ note: 'short' }] }];
  g.S.body = [{ id: 'b1', photos: ['p'.repeat(2000)] }];
  g.S.templates = [{ id: 'huge', text: 'z'.repeat(950 * 1024) }];
  const refuse = g.mzPayloadForUpload();
  assert.equal(refuse.payload, null);
  assert.equal(refuse.trimmed, 'refuse');
  assert.equal(g.S.workouts[0].id, 'keep-local');
  assert.equal(g.S.body[0].photos[0].length, 2000);
  assert.equal(g.S.templates[0].text.length, 950 * 1024);

  assert.match(build, /D-282: JS minify is not applied/);
  assert.match(build, /unsafe for implicit globals|no release\/debug/i);
  assert.equal(/terser|uglify|esbuild.*minify/i.test(build.replace(/D-282[\s\S]*?\*\//, '')), false);

  const lv = read('docs/LV-NEW-D279-D282.md');
  assert.match(lv, /Nepareizs e-pasts vai kods/);
  assert.match(lv, /Datu ir par daudz mākonim\. Ierīcē viss ir saglabāts\./);
  assert.match(lv, /Mākonī nonāca saīsināta vēstures kopija\. Ierīcē visi dati ir saglabāti\./);
  assert.match(read('i18n/dict3.js'), /Datu ir par daudz mākonim\. Ierīcē viss ir saglabāts\./);
  assert.match(read('i18n/dict3.js'), /Mākonī nonāca saīsināta vēstures kopija\. Ierīcē visi dati ir saglabāti\./);
  assert.equal(read('docs/LV-NEW-D279-D282.md').includes('LV-проверка.xlsx'), true);
  assert.match(lv, /не менялись/);
});

test('D-282: shortened cloud-copy toast is shown at most once per launch and once per day', () => {
  const store = new Map();
  const msg = 'В облако ушла сокращённая копия истории. На устройстве все данные на месте.';
  const a = loadSync({ store });
  assert.equal(a.mzToastTrimmedCopy(), true);
  assert.deepEqual(a.toasts, [msg]);
  assert.equal(a.mzToastTrimmedCopy(), false);
  assert.deepEqual(a.toasts, [msg]);

  // New launch, same calendar day: still no toast.
  const b = loadSync({ store });
  assert.equal(b.mzToastTrimmedCopy(), false);
  assert.deepEqual(b.toasts, []);

  // Next day (stored key is in the past): toast once again.
  store.set('gc_trim_toast_day', '2000-01-01');
  const c = loadSync({ store });
  assert.equal(c.mzToastTrimmedCopy(), true);
  assert.deepEqual(c.toasts, [msg]);
  assert.equal(c.mzToastTrimmedCopy(), false);
  assert.deepEqual(c.toasts, [msg]);
});
