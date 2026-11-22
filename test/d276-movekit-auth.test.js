'use strict';
// D-276: MoveKit clips only for a signed-in user; cached clips still play offline.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

test('D-276: sw cache is moyzal-v144; movekit.js and sync.js are in the precache', () => {
  const sw = read('sw.js');
  assert.match(read('cache-ver.js'), /var SW_CACHE='moyzal-v144'/);
  assert.match(sw, /const C=SW_CACHE/);
  assert.match(sw, /'movekit\.js'/);
  assert.match(sw, /'sync\.js'/);
});

test('D-276: no direct storage sign remains in the client', () => {
  const src = read('movekit.js');
  assert.equal(src.includes('/storage/v1/object/sign'), false);
  assert.equal(src.includes('expiresIn'), false);
  assert.equal(src.includes('mkFnOffUntil'), false);
  assert.equal(src.includes('signedURL'), false);
  assert.match(src, /movekit auth/);
  assert.match(src, /Войди, чтобы смотреть ролики/);
  assert.match(src, /mzAccessToken/);
  assert.match(read('sync.js'), /window\.mzAccessToken\s*=/);
});

test('D-276: login prompt has EN and LV dictionary entries', () => {
  const ctx = vm.createContext({ console });
  vm.runInContext(read('i18n/dict3.js') + '\nthis.DICT3=DICT3;', ctx, { filename: 'i18n/dict3.js' });
  const row = ctx.DICT3.find(r => r[0] === 'Войди, чтобы смотреть ролики');
  assert.ok(row, 'dict3 row missing');
  assert.deepEqual(Array.from(row), [
    'Войди, чтобы смотреть ролики',
    'Sign in to watch the videos',
    'Ieej, lai skatītos video'
  ]);
});

test('D-276: function source requires a user, keys only from env, deploy without --no-verify-jwt', () => {
  const src = read('supabase/functions/movekit-sign/index.ts');
  const cfg = read('supabase/config.toml');
  assert.match(src, /auth\.getUser/);
  assert.match(src, /user\.is_anonymous/);
  assert.match(src, /deleted_accounts/);
  assert.match(src, /status: 401/);
  assert.match(src, /status: 403/);
  assert.match(src, /hits\.get\(user\.id\)/);
  assert.match(src, /Deno\.env\.get/);
  assert.match(src, /НЕ указывать --no-verify-jwt/);
  assert.equal(/eyJ[A-Za-z0-9_-]{20,}/.test(src), false);
  assert.equal(src.includes('sb_secret'), false);
  assert.match(src, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.equal(src.includes('service_role'), false);
  assert.match(cfg, /\[functions\.movekit-sign\]/);
  assert.match(cfg, /verify_jwt\s*=\s*true/);
  assert.match(cfg, /WITHOUT --no-verify-jwt/);
  assert.doesNotMatch(cfg, /functions deploy movekit-sign --no-verify-jwt/);
});

function clipWorld(opts) {
  const bag = new Map();
  const parent = {
    children: [],
    insertBefore(node, ref) {
      node.parentNode = parent;
      const i = this.children.indexOf(ref);
      if (i < 0) this.children.push(node);
      else this.children.splice(i, 0, node);
    }
  };
  function URLShim(a, b) { return new URL(a, b); }
  URLShim.createObjectURL = blob => 'blob:clip-' + (blob && blob.size);
  URLShim.revokeObjectURL = () => {};
  const g = {
    console, URL: URLShim, Blob, Map, Promise, JSON, encodeURIComponent, Date, Uint8Array, Response,
    setTimeout, clearTimeout,
    location: { href: 'http://127.0.0.1/' },
    MZ_SB: { url: 'https://example.test', anon: 'anon-test' },
    mzAccessToken: (opts && opts.mzAccessToken) || (async () => ''),
    document: {
      createElement(tag) {
        return {
          tagName: String(tag || 'P').toUpperCase(),
          className: '',
          textContent: '',
          dataset: {},
          parentNode: null,
          setAttribute(k, v) { if (k === 'data-mk-login') this.dataset.mkLogin = String(v); }
        };
      }
    },
    caches: {
      async open() {
        return {
          async match(u) { return bag.get(u) || null; },
          async put(u, res) { bag.set(u, res); }
        };
      }
    }
  };
  g.window = g;
  g.globalThis = g;
  g.self = g;
  const calls = [];
  g.fetch = async (url, opt) => {
    calls.push({ url, opt });
    return { ok: false, status: 401, json: async () => ({}) };
  };
  const ctx = vm.createContext(g);
  vm.runInContext(read('movekit.js'), ctx, { filename: 'movekit.js' });
  const go = code => vm.runInContext(code, ctx);
  ctx.__parent = parent;
  return { go, bag, parent, calls, ctx };
}

function makeVideo(parent) {
  const video = {
    isConnected: true,
    dataset: { mk: 'bp' },
    style: {},
    classList: { contains() { return false; } },
    muted: false,
    playsInline: false,
    src: '',
    played: false,
    parentNode: parent,
    play() { this.played = true; return Promise.resolve(); },
    removeAttribute() {},
    load() {},
    pause() {},
    remove() {
      this.removed = true;
      parent.children = parent.children.filter(c => c !== this);
      this.parentNode = null;
    }
  };
  parent.children.push(video);
  return video;
}

test('D-276: a cached clip plays without a session and without a signature request', async () => {
  const { go, bag, parent, calls, ctx } = clipWorld({ mzAccessToken: async () => '' });
  const bytes = new Uint8Array([0, 1, 2, 3, 4]);
  const key = go('movekitCacheUrl("barbell-bench-press.mp4")');
  bag.set(key, new Response(new Blob([bytes], { type: 'video/mp4' }), { headers: { 'Content-Type': 'video/mp4' } }));
  ctx.__v = makeVideo(parent);
  await go('loadMovekit(__v)');
  assert.deepEqual(calls, []);
  assert.equal(ctx.__v.dataset.mkSrc, 'cache');
  assert.equal(ctx.__v.dataset.mkNeedAuth, undefined);
  assert.match(ctx.__v.src, /^blob:clip-/);
  assert.equal(ctx.__v.played, true);
  assert.equal(ctx.__v.removed, undefined);
});

test('D-276: without a session and without a cache the login message is shown, no sign request', async () => {
  const { go, parent, calls, ctx } = clipWorld({ mzAccessToken: async () => '' });
  ctx.__v = makeVideo(parent);
  await go('loadMovekit(__v)');
  assert.deepEqual(calls, []);
  assert.equal(ctx.__v.removed, true);
  const msg = parent.children.find(c => c && c.dataset && c.dataset.mkLogin === '1');
  assert.ok(msg, 'login message node missing');
  assert.equal(msg.textContent, 'Войди, чтобы смотреть ролики');
  assert.equal(msg.className, 'mut');
});

test('movekit-sign: auth (getUser, is_anonymous, deleted) runs before path whitelist', () => {
  const src = read('supabase/functions/movekit-sign/index.ts');
  const getUserAt = src.indexOf('auth.getUser');
  const anonAt = src.indexOf('user.is_anonymous');
  const goneAt = src.indexOf('deleted_accounts');
  const allowedAt = src.indexOf('!allowed(path)');
  const badPathAt = src.indexOf('bad path');
  assert.ok(getUserAt > 0 && anonAt > 0 && goneAt > 0 && allowedAt > 0 && badPathAt > 0);
  assert.ok(getUserAt < allowedAt, 'getUser must precede path validation');
  assert.ok(anonAt < allowedAt, 'is_anonymous must precede path validation');
  assert.ok(goneAt < allowedAt, 'deleted_accounts must precede path validation');
  assert.ok(getUserAt < badPathAt && anonAt < badPathAt && goneAt < badPathAt);
  assert.ok(src.indexOf('status: 401') > 0);
});
