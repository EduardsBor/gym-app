'use strict';
// A-504: Sentry is Android-only; beforeSend scrubs PII; no init on web or without DSN.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const S = require('../sentry.js');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const FAKE = 'https://abcde12345@o123.ingest.de.sentry.io/456';

test('validateDsn accepts a https ingest URL and rejects junk', () => {
  assert.equal(S.validateDsn(FAKE), FAKE);
  assert.equal(S.validateDsn('  ' + FAKE + '  '), FAKE);
  assert.equal(S.validateDsn(''), '');
  assert.equal(S.validateDsn(null), '');
  assert.equal(S.validateDsn('http://abcde12345@o123.ingest.de.sentry.io/456'), '');
  assert.equal(S.validateDsn('https://abcde12345@o123.ingest.de.sentry.io/456\nexport'), '');
  assert.equal(S.validateDsn('not-a-dsn'), '');
});

test('makeConfigJs never embeds an invalid DSN and defaults environment to debug', () => {
  const js = S.makeConfigJs({ dsn: FAKE, environment: 'production', release: '1.0+moyzal-v65' });
  assert.match(js, /^window\.GC_SENTRY=/);
  const cfg = Function('window', js + '; return window.GC_SENTRY;')({});
  assert.equal(cfg.dsn, FAKE);
  assert.equal(cfg.environment, 'production');
  assert.equal(cfg.release, '1.0+moyzal-v65');
  const off = Function('window', S.makeConfigJs({ dsn: 'secret-but-not-a-dsn', environment: 'staging' }) + '; return window.GC_SENTRY;')({});
  assert.equal(off.dsn, '');
  assert.equal(off.environment, 'debug');
});

test('shouldInit / start skip web and missing DSN; start calls init only when native+dsn', () => {
  const calls = [];
  const Sentry = { init: o => calls.push(o) };
  assert.equal(S.shouldInit({ native: false, dsn: FAKE }), false);
  assert.equal(S.shouldInit({ native: true, dsn: '' }), false);
  assert.equal(S.shouldInit({ native: true, dsn: 'nope' }), false);
  assert.equal(S.shouldInit({ native: true, dsn: FAKE }), true);
  assert.equal(S.start(Sentry, { native: false, dsn: FAKE, release: '1.0+x', environment: 'debug' }), false);
  assert.equal(S.start(Sentry, { native: true, dsn: '', release: '1.0+x', environment: 'debug' }), false);
  assert.equal(S.start(null, { native: true, dsn: FAKE }), false);
  assert.equal(calls.length, 0);
  const g = {};
  assert.equal(S.start(Sentry, { native: true, dsn: FAKE, release: '1.0+moyzal-v65', environment: 'debug', root: g }), true);
  assert.equal(calls.length, 1);
  const o = calls[0];
  assert.equal(o.dsn, FAKE);
  assert.equal(o.release, '1.0+moyzal-v65');
  assert.equal(o.environment, 'debug');
  assert.equal(o.sendDefaultPii, false);
  assert.equal(o.dataCollection.userInfo, false);
  assert.equal(o.dataCollection.cookies, false);
  assert.equal(o.tracesSampleRate, 0);
  assert.equal(o.profilesSampleRate, 0);
  assert.equal(o.replaysSessionSampleRate, 0);
  assert.equal(o.replaysOnErrorSampleRate, 0);
  assert.equal(o.enableLogs, false);
  assert.equal(typeof o.beforeSend, 'function');
  assert.equal(typeof o.beforeBreadcrumb, 'function');
  assert.equal(typeof g.__gcSentryTestCrash, 'function');
});

test('debug-only test crash hooks are not registered in production', () => {
  const g = {};
  S.start({ init() {} }, { native: true, dsn: FAKE, environment: 'production', release: '1.0+x', root: g });
  assert.equal(g.__gcSentryTestCrash, undefined);
  assert.equal(g.__gcSentryTestNativeCrash, undefined);
});

test('beforeSend strips user, request headers/cookies, server_name, and sets ip to null', () => {
  const ev = S.beforeSend({
    user: { id: 'u1', email: 'a@b.c', username: 'ed', ip_address: '1.2.3.4' },
    server_name: 'pixel-phone',
    request: {
      url: 'https://xyz.supabase.co/storage/v1/object/sign/movekit/clip.mp4?token=secret-token',
      headers: { Cookie: 'sid=abc', Authorization: 'Bearer x', 'User-Agent': 'X' },
      cookies: { sid: 'abc' },
      data: { weight: 80, notes: 'secret' },
      env: { REMOTE_ADDR: '1.2.3.4' },
      query_string: 'token=secret-token'
    },
    breadcrumbs: [
      { category: 'console', message: 'workout 80kg' },
      { category: 'ui.input', message: '80' },
      { type: 'navigation', category: 'navigation', timestamp: 1, data: { from: 'today', to: 'program', extra: 'keep-out' } }
    ]
  });
  assert.deepEqual(ev.user, { ip_address: null });
  assert.equal('id' in ev.user, false);
  assert.equal('email' in ev.user, false);
  assert.equal(ev.server_name, undefined);
  assert.equal(ev.request.headers, undefined);
  assert.equal(ev.request.cookies, undefined);
  assert.equal(ev.request.data, undefined);
  assert.equal(ev.request.env, undefined);
  assert.equal(ev.request.query_string, undefined);
  assert.equal(ev.request.url.includes('token='), false);
  assert.equal(ev.request.url.includes('secret-token'), false);
  assert.equal(ev.breadcrumbs.length, 1);
  assert.deepEqual(ev.breadcrumbs[0].data, { from: 'today', to: 'program' });
});

test('beforeBreadcrumb drops console and ui.input, keeps navigation minimal, scrubs signed URLs', () => {
  assert.equal(S.beforeBreadcrumb({ category: 'console', message: 'log' }), null);
  assert.equal(S.beforeBreadcrumb({ type: 'console', message: 'log' }), null);
  assert.equal(S.beforeBreadcrumb({ category: 'ui.input', message: 'typed weight' }), null);
  const nav = S.beforeBreadcrumb({ type: 'navigation', category: 'navigation', timestamp: 2, message: 'go', data: { from: '/a', to: '/b', form: { kg: 10 } } });
  assert.deepEqual(nav, { type: 'navigation', category: 'navigation', timestamp: 2, data: { from: '/a', to: '/b' } });
  const xhr = S.beforeBreadcrumb({
    type: 'http', category: 'xhr', timestamp: 3,
    data: { url: 'https://abc.supabase.co/path?token=sekrit', method: 'GET', headers: { Authorization: 'x' }, body: 'payload' }
  });
  assert.equal(xhr.data.url.includes('sekrit'), false);
  assert.equal(xhr.data.method, 'GET');
  assert.equal(xhr.data.headers, undefined);
  assert.equal(xhr.data.body, undefined);
});

test('integrationsFilter drops Replay, Feedback, tracing and HttpContext', () => {
  const kept = S.integrationsFilter([
    { name: 'Breadcrumbs' }, { name: 'Replay' }, { name: 'Feedback' },
    { name: 'BrowserTracing' }, { name: 'HttpContext' }, { name: 'GlobalHandlers' }
  ]);
  assert.deepEqual(kept.map(i => i.name), ['Breadcrumbs', 'GlobalHandlers']);
});

test('site files do not load Sentry and do not contain a DSN-like ingest URL', () => {
  const index = read('index.html');
  const sw = read('sw.js');
  assert.equal(index.includes('sentry.js'), false);
  assert.equal(index.includes('sentry-config.js'), false);
  assert.equal(index.includes('sentry-sdk.js'), false);
  assert.equal(sw.includes('sentry.js'), false);
  assert.equal(sw.includes('sentry-config'), false);
  assert.match(read('cache-ver.js'), /var SW_CACHE='moyzal-v138'/);
  assert.match(sw, /const C=SW_CACHE/);
  assert.equal(/https:\/\/[A-Za-z0-9._-]+@[^'"\s]+sentry\.io/.test(index + sw + read('sentry.js') + read('scripts/build-web.js')), false);
});

test('gitignore covers sentry-config.js; ANDROID-BUILD.md documents GC_SENTRY_DSN without a value', () => {
  const gi = read('.gitignore');
  assert.match(gi, /^sentry-config\.js$/m);
  const doc = read('docs/ANDROID-BUILD.md');
  assert.match(doc, /GC_SENTRY_DSN/);
  assert.match(doc, /GC_SENTRY_ENV/);
  assert.equal(/https:\/\/[A-Za-z0-9._-]+@[^'"\s]+sentry\.io/.test(doc), false);
});

test('scrubUrl strips sign-in code from auth-callback and otp query params', () => {
  assert.equal(S.scrubUrl('app.gymcaptain://auth-callback?code=SECRET-CODE').includes('SECRET-CODE'), false);
  assert.equal(S.scrubUrl('https://eduardsbor.github.io/gym-app/auth-callback.html?code=SECRET-CODE').includes('SECRET-CODE'), false);
  assert.equal(S.scrubUrl('https://example.invalid/?otp=123456').includes('123456'), false);
  const ev = S.beforeSend({ user: { ip_address: '9.9.9.9' }, request: { url: 'app.gymcaptain://auth-callback?code=SECRET-CODE' } });
  assert.deepEqual(ev.user, { ip_address: null });
  assert.equal(String(ev.request.url).includes('SECRET-CODE'), false);
});
