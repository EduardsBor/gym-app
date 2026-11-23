'use strict';
// tech-fix-1: boots the whole app (script order of index.html) in node:vm for the GC-01/02/03/07, awDeload, UI RIR and variant tests.
// Block files are read from disk through a fake synchronous XMLHttpRequest. No network, no MoveKit clips are opened.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

function boot(opts) {
  opts = opts || {};
  const store = new Map();
  if (opts.state) store.set('gym', JSON.stringify(opts.state));
  if (opts.ls) for (const k of Object.keys(opts.ls)) store.set(k, String(opts.ls[k]));
  const nodes = new Map();
  function el(id) {
    if (id && nodes.has(id)) return nodes.get(id);
    const n = { id: id || '', innerHTML: '', textContent: '', className: '', value: '', style: {}, dataset: {},
      classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } }, append() {}, appendChild() {}, addEventListener() {},
      insertAdjacentHTML() {}, setAttribute() {}, getAttribute() { return null; }, closest() { return null; }, querySelector() { return null; },
      querySelectorAll() { return []; }, remove() {}, onclick: null };
    if (id) nodes.set(id, n);
    return n;
  }
  const search = opts.search || '';
  const lang = opts.lang || 'ru';
  const quiet = { log() {}, warn() {}, error() {}, info() {} };
  const g = {
    console: quiet, scrollTo() {}, scrollY: 0, setTimeout() { return 0; }, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {}, URL, Blob,
    navigator: { language: lang, languages: [lang] },
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
    location: { href: 'http://127.0.0.1/' + search, origin: 'http://127.0.0.1', pathname: '/', search, hash: '' },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    document: { documentElement: { lang, dataset: {}, style: { setProperty() {} }, classList: { add() {}, remove() {}, toggle() {} }, setAttribute() {} },
      title: '', body: { append() {}, appendChild() {}, style: {}, classList: { add() {}, remove() {}, toggle() {} } }, head: { appendChild() {} },
      querySelector(s) { const m = /^#([\w-]+)/.exec(s || ''); return el(m ? m[1] : ''); }, querySelectorAll() { return []; }, addEventListener() {},
      createElement() { return el(); }, getElementById(i) { return el(i); }, createTreeWalker() { return { nextNode() { return null; } }; } },
    addEventListener() {}, fetch: () => Promise.reject(new Error('offline')), MutationObserver: function () { this.observe = () => {}; }
  };
  g.window = g; g.globalThis = g; g.self = g;
  g.XMLHttpRequest = function () {
    this.status = 0; this.responseText = '';
    this.open = (m, u) => { this._u = u; };
    this.send = () => { const fp = path.join(root, String(this._u || '').replace(/^\.\//, '')); if (fs.existsSync(fp)) { this.status = 200; this.responseText = fs.readFileSync(fp, 'utf8'); } else this.status = 404; };
  };
  const ctx = vm.createContext(g);
  const html = read('index.html');
  const files = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m => m[1]).filter(f => !/vendor|supabase|sentry|sync\.js|notify|health|theme\.js/.test(f));
  const failed = [];
  for (const f of files) {
    if (!fs.existsSync(path.join(root, f))) { failed.push(f + ': missing'); continue; }
    try { vm.runInContext(read(f), ctx, { filename: f }); } catch (e) { failed.push(f + ': ' + String((e && e.message) || e).slice(0, 160)); }
  }
  const run = c => vm.runInContext(c, ctx);
  const J = c => JSON.parse(run('JSON.stringify(' + c + ')'));
  return { run, J, failed, store, ctx };
}
const blockJson = f => JSON.parse(read(f));
const DAY = 864e5;
module.exports = { boot, read, root, blockJson, DAY };
