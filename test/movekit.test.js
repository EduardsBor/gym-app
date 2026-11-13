'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');

function boot() {
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
    console, setTimeout, clearTimeout, setInterval() { return 0; }, clearInterval() {},
    URL, Blob, navigator: { language: 'ru', languages: ['ru'] },
    localStorage: { getItem() { return null; }, setItem() {} },
    location: { href: 'http://127.0.0.1/', origin: 'http://127.0.0.1', pathname: '/' },
    document: {
      documentElement: { lang: 'ru' }, title: '', body: { append() {}, style: {} },
      querySelector(sel) { const m = /^#([\w-]+)/.exec(sel || ''); return el(m ? m[1] : ''); },
      querySelectorAll() { return []; }, addEventListener() {}, createElement() { return el(); }
    }
  };
  g.window = g; g.globalThis = g; g.self = g;
  const ctx = vm.createContext(g);
  const files = ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'prog.js', 'plan.js', 'movekit.js'];
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
  return ctx;
}

const ctx = boot();
const run = code => vm.runInContext(code, ctx);

test('movekit.js stores file names only', () => {
  const src = fs.readFileSync(path.join(root, 'movekit.js'), 'utf8');
  assert.equal(/https?:\/\//i.test(src), false);
  assert.equal(src.includes('token='), false);
  assert.equal(src.includes('.supabase.co'), false);
  assert.equal(src.includes('anim3d/'), false);
});

test('map covers known exercises and leaves the rest on the old clip', () => {
  const report = run(`(() => {
    const ids = new Set(EX.map(e => e.id));
    const keys = Object.keys(MOVEKIT);
    const files = Object.values(MOVEKIT);
    const unmatched = keys.filter(k => !ids.has(k)).sort();
    const mapped = keys.filter(k => ids.has(k)).sort();
    const oldAnim = EX.map(e => e.id).filter(id => hasAnim(id) && !MOVEKIT[id]).sort();
    const placeholder = EX.map(e => e.id).filter(id => !hasAnim(id) && !MOVEKIT[id]).sort();
    return { keys: keys.length, files: new Set(files).size, mapped, unmatched, oldAnim, placeholder };
  })()`);
  assert.equal(report.keys, 100);
  assert.equal(report.files, 100);
  assert.equal(run('movekitFile("bp")'), 'barbell-bench-press.mp4');
  assert.equal(run('movekitFile("pu")'), 'push-up.mp4');
  assert.equal(run('movekitFile("dl")'), '');
  assert.equal(run('movekitFile("no-such")'), '');
  assert.ok(report.mapped.includes('bp'));
  assert.ok(report.mapped.includes('pu'));
  assert.equal(report.unmatched.includes('bp'), false);
  assert.ok(report.oldAnim.includes('dl'));
  assert.equal(report.oldAnim.includes('bp'), false);
  assert.equal(report.mapped.length + report.unmatched.length, 100);
  const bp = run('animMedia("bp")');
  const pu = run('animMedia("pu")');
  const dl = run('animMedia("dl")');
  const soon = run('animMedia("cd_lat")');
  assert.match(bp, /data-mk="bp"/);
  assert.match(bp, /class="a3d mk"/);
  assert.equal(bp.includes('src='), false);
  assert.equal(/https?:/.test(bp), false);
  assert.match(pu, /data-mk="pu"/);
  assert.match(dl, /src="anim3d\/dl\.mp4"/);
  assert.equal(dl.includes('data-mk'), false);
  assert.match(soon, /Анимация в разработке/);
  assert.equal(run('hasAnim("bp")'), true);
  assert.equal(run('hasAnim("chest-supported-2db")'), false);
  assert.match(run('animMedia("chest-supported-2db")'), /data-mk="chest-supported-2db"/);
  console.log('MOVEKIT_REPORT ' + JSON.stringify({
    mappedCount: report.mapped.length,
    mapped: report.mapped,
    unmatched: report.unmatched,
    oldAnim: report.oldAnim,
    placeholder: report.placeholder
  }));
});

test('signed url is requested once and reused until near expiry', async () => {
  const calls = [];
  const g = {
    console, URL, Blob, Map, Promise, JSON, encodeURIComponent, Date,
    setTimeout, clearTimeout,
    MZ_SB: { url: 'https://example.test', anon: 'anon-test' }
  };
  g.window = g;
  g.globalThis = g;
  g.self = g;
  g.fetch = async (url, opt) => {
    calls.push({ url, opt });
    const file = url.split('/').pop();
    return {
      ok: true,
      status: 200,
      json: async () => ({ signedURL: '/object/sign/movekit/' + file + '?token=fixture' })
    };
  };
  const signCtx = vm.createContext(g);
  vm.runInContext(fs.readFileSync(path.join(root, 'movekit.js'), 'utf8'), signCtx, { filename: 'movekit.js' });
  const go = code => vm.runInContext(code, signCtx);
  assert.equal(await go('movekitSignedUrl("missing")'), null);
  assert.equal(calls.length, 0);
  const first = await go('movekitSignedUrl("bp")');
  const second = await go('movekitSignedUrl("bp")');
  assert.equal(calls.length, 1);
  assert.equal(first, second);
  assert.equal(first, 'https://example.test/storage/v1' + '/object/sign/movekit/barbell-bench-press.mp4?token=fixture');
  assert.equal(calls[0].url, 'https://example.test/storage/v1/object/sign/movekit/barbell-bench-press.mp4');
  assert.equal(calls[0].opt.method, 'POST');
  assert.equal(calls[0].opt.headers.apikey, 'anon-test');
  assert.equal(calls[0].opt.headers.Authorization, 'Bearer anon-test');
  assert.deepEqual(JSON.parse(calls[0].opt.body), { expiresIn: 3600 });
  const pair = await Promise.all([go('movekitSignedUrl("pu")'), go('movekitSignedUrl("pu")')]);
  assert.equal(pair[0], pair[1]);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].url, 'https://example.test/storage/v1/object/sign/movekit/push-up.mp4');
  const now = Date.now;
  try {
    Date.now = () => now() + 3500 * 1000;
    await go('movekitSignedUrl("bp")');
    assert.equal(calls.length, 3);
  } finally {
    Date.now = now;
  }
});
