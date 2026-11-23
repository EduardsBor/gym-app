'use strict';
// D-284: library exercise cards must open (exHist name collision), no duplicate globals,
// template entry points hidden, saved template data kept.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

const SITE_JS = [...read('index.html').matchAll(/src="([^"]+\.js)"/g)]
  .map(m => m[1])
  .filter(f => f !== 'vendor/supabase.js' && f !== 'supabase-config.js');

function hydrate(node, html) {
  node._html = html;
  node.children = [];
  const re = /<([a-zA-Z][\w-]*)([^>]*)>/g;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[1].toLowerCase();
    const attrs = m[2] || '';
    const child = makeEl();
    child.tagName = tag.toUpperCase();
    child.parentNode = node;
    child.isConnected = true;
    const idm = /\sid=["']([^"']+)["']/.exec(attrs);
    if (idm) { child.id = idm[1]; node._ids = node._ids || new Map(); }
    const mk = /\sdata-mk=["']([^"']+)["']/.exec(attrs);
    if (mk) child.dataset.mk = mk[1];
    const poster = /\sdata-mk-poster=["']([^"']+)["']/.exec(attrs);
    if (poster) child.dataset.mkPoster = poster[1];
    if (/\bclass=["']([^"']+)["']/.exec(attrs)) child.className = /\bclass=["']([^"']+)["']/.exec(attrs)[1];
    node.children.push(child);
  }
}

function makeEl(id) {
  const node = {
    id: id || '',
    textContent: '',
    className: '',
    value: '',
    style: {},
    dataset: {},
    children: [],
    parentNode: null,
    isConnected: false,
    tagName: 'DIV',
    classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
    onclick: null,
    muted: false,
    playsInline: false,
    preload: '',
    referrerPolicy: '',
    src: '',
    onerror: null,
    appendChild(c) {
      c.parentNode = node;
      c.isConnected = true;
      node.children.push(c);
      return c;
    },
    append(...cs) { cs.forEach(c => c && node.appendChild(c)); },
    insertBefore(c, ref) {
      c.parentNode = node;
      c.isConnected = true;
      const i = node.children.indexOf(ref);
      if (i < 0) node.children.push(c);
      else node.children.splice(i, 0, c);
      return c;
    },
    remove() {
      const p = node.parentNode;
      if (p && Array.isArray(p.children)) p.children = p.children.filter(x => x !== node);
      node.parentNode = null;
      node.isConnected = false;
    },
    querySelector(sel) { return findOne(node, sel); },
    querySelectorAll(sel) { return findAll(node, sel); },
    setAttribute() {},
    getAttribute() { return null; },
    closest() { return null; },
    addEventListener() {},
    insertAdjacentHTML() {},
    play() { return Promise.resolve(); },
    pause() {},
    load() {},
    removeAttribute() {}
  };
  let html = '';
  Object.defineProperty(node, 'innerHTML', {
    get() { return html; },
    set(v) { html = String(v); hydrate(node, html); }
  });
  return node;
}

function matches(node, sel) {
  if (!sel) return false;
  if (sel[0] === '#') return node.id === sel.slice(1);
  if (sel[0] === '.') return String(node.className || '').split(/\s+/).includes(sel.slice(1));
  const tag = sel.split(/[\.#\[]/)[0];
  if (tag && node.tagName === tag.toUpperCase()) return true;
  return false;
}

function walk(node, acc) {
  acc.push(node);
  (node.children || []).forEach(c => walk(c, acc));
  return acc;
}

function findOne(root, sel) {
  return findAll(root, sel)[0] || null;
}

function findAll(root, sel) {
  const all = [];
  (root.children || []).forEach(c => walk(c, all));
  if (sel && sel[0] === '#') {
    const id = sel.slice(1).split(/\s/)[0];
    const hit = all.find(n => n.id === id);
    return hit ? [hit] : [];
  }
  return all.filter(n => matches(n, sel));
}

function boot(opts) {
  opts = opts || {};
  const store = new Map();
  const saved = {
    lang: 'ru',
    workouts: Array.isArray(opts.workouts) ? opts.workouts : [],
    templates: Array.isArray(opts.templates) ? opts.templates : [{ id: 't1', name: 'Жим день', items: [{ exId: 'bp', sets: 3, min: 8, max: 12, rest: 90 }] }],
    program: opts.program || [],
    goal: opts.goal || '',
    premium: !!opts.premium
  };
  store.set('gym', JSON.stringify(saved));
  const nodes = new Map();
  const body = makeEl();
  body.tagName = 'BODY';
  body.isConnected = true;
  const byId = id => {
    if (id && nodes.has(id)) return nodes.get(id);
    const fromBody = findOne(body, '#' + id);
    if (fromBody) { nodes.set(id, fromBody); return fromBody; }
    return null;
  };
  const ensure = id => {
    let n = byId(id);
    if (!n) { n = makeEl(id); n.id = id; nodes.set(id, n); }
    return n;
  };
  ['app', 'title', 'nav', 'modal'].forEach(ensure);
  const g = {
    console, setTimeout, clearTimeout, setInterval() { return 0; }, clearInterval() {},
    URL, Blob, Map, Promise, JSON, encodeURIComponent, Date, Uint8Array, Response,
    navigator: { language: 'ru', languages: ['ru'] },
    localStorage: {
      getItem: k => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: k => store.delete(k)
    },
    location: { href: 'http://127.0.0.1/', origin: 'http://127.0.0.1', pathname: '/', search: '' },
    MZ_SB: { url: 'https://example.test', anon: 'anon-test' },
    mzAccessToken: opts.signedIn ? (async () => 'sess-test') : (async () => ''),
    Audio: function () { this.play = () => ({ catch() {} }); this.pause = () => {}; this.addEventListener = () => {}; this.load = () => {}; this.setAttribute = () => {}; this.volume = 1; this.src = ''; this.currentTime = 0; this.paused = true; },
    confirm() { return true; }, prompt() { return null; }, scrollTo() {}, scrollY: 0,
    innerWidth: 390, innerHeight: 844, requestAnimationFrame(fn) { return setTimeout(fn, 0); },
    document: {
      documentElement: { lang: 'ru' },
      title: '',
      body,
      hidden: false,
      getElementById: id => ensure(id),
      querySelector(sel) {
        if (sel && sel[0] === '#') return ensure(sel.slice(1).split(/[\s\[]/)[0]);
        return findOne(body, sel) || (sel === 'body' ? body : null);
      },
      querySelectorAll(sel) {
        const a = findAll(body, sel);
        if (sel && sel[0] === '#') {
          const n = byId(sel.slice(1));
          return n ? [n] : a;
        }
        return a;
      },
      createElement() { return makeEl(); },
      addEventListener() {},
      createTreeWalker() { return { nextNode() { return null; } }; }
    },
    caches: {
      async open() {
        return { async match() { return null; }, async put() {} };
      }
    }
  };
  g.window = g;
  g.globalThis = g;
  g.self = g;
  g.fetch = async () => ({ ok: false, status: 401, json: async () => ({}) });
  const ctx = vm.createContext(g);
  const files = [
    'alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js',
    'stats.js', 'app.js', 'health.js', 'tech.js', 'lib.js',
    'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js',
    'cards.js', 'warm.js', 'cd.js', 'place.js', 'prog.js', 'plan.js',
    'premium.js', 'features.js', 'movekit.js', 'exscreen.js'
  ];
  for (const f of files) vm.runInContext(read(f), ctx, { filename: f });
  // document.querySelector('#exc') must see body-appended overlay
  const origQS = g.document.querySelector.bind(g.document);
  g.document.querySelector = function (sel) {
    if (sel === '#exc' || sel === '#exb' || (sel && sel[0] === '#')) {
      const fromBody = findOne(body, sel);
      if (fromBody) return fromBody;
      if (sel[0] === '#' && nodes.has(sel.slice(1))) return nodes.get(sel.slice(1));
    }
    return origQS(sel);
  };
  // Keep #exc lookups in sync after appendChild
  const origAppend = body.appendChild.bind(body);
  body.appendChild = function (c) {
    origAppend(c);
    if (c && c.id) nodes.set(c.id, c);
    c.isConnected = true;
    return c;
  };
  return {
    run: code => vm.runInContext(code, ctx),
    body,
    nodes,
    store,
    ctx
  };
}

function textOf(node) {
  const parts = [node.innerHTML || '', node.textContent || ''];
  (node.children || []).forEach(c => parts.push(textOf(c)));
  return parts.join('\n');
}

async function flush() {
  for (let i = 0; i < 8; i++) await new Promise(r => setImmediate(r));
}

test('no global function name is defined in two different site JS files', () => {
  const pat = /^function\s+([A-Za-z_$][\w$]*)\s*\(/gm;
  const found = new Map();
  for (const f of SITE_JS) {
    const src = read(f);
    let m;
    const re = new RegExp(pat);
    while ((m = re.exec(src))) {
      const name = m[1];
      if (!found.has(name)) found.set(name, []);
      found.get(name).push(f);
    }
  }
  const dups = [...found.entries()].filter(([, files]) => new Set(files).size > 1);
  assert.deepEqual(dups, [], dups.map(([n, fs]) => n + ' in ' + fs.join(', ')).join('\n'));
  // The library vs exercise-screen collision that caused the white screen is gone.
  assert.equal(found.get('exHist') && found.get('exHist').join(), 'lib.js');
  assert.equal(found.get('exHistHTML') && found.get('exHistHTML').join(), 'exscreen.js');
});

test('every library exercise card opens without errors when signed out and when signed in', async () => {
  for (const signedIn of [false, true]) {
    const { run, body } = boot({ signedIn });
    assert.equal(run('typeof exHist'), 'function');
    assert.equal(run('typeof exHistHTML'), 'function');
    assert.equal(run('exHist === exHistHTML'), false);
    const sample = run('Array.isArray(exHist("bp"))');
    assert.equal(sample, true, 'lib exHist must keep returning an array, not HTML');
    const ids = JSON.parse(run('JSON.stringify(EX.map(e=>e.id))'));
    assert.ok(ids.length > 100, 'expected a full library, got ' + ids.length);
    const bad = [];
    for (const id of ids) {
      try {
        run('exCard(' + JSON.stringify(id) + ')');
        await flush();
        const exc = run('document.querySelector("#exc")');
        if (!exc) {
          bad.push(id + ': no #exc overlay');
          continue;
        }
        const html = String(exc.innerHTML || '');
        if (!html.trim()) bad.push(id + ': empty #exc (white screen)');
        const name = run('exBy(' + JSON.stringify(id) + ').name');
        if (name && !html.includes(name) && !textOf(exc).includes(name)) {
          bad.push(id + ': missing name ' + name);
        }
        if (!signedIn && run('typeof movekitFile==="function"&&!!movekitFile(' + JSON.stringify(id) + ')')) {
          const blob = html + '\n' + textOf(exc);
          if (!blob.includes('Войди, чтобы смотреть ролики') && !blob.includes('data-mk-login')) {
            // login node may be a child after async loadMovekit
            const login = walk(exc, []).find(n => (n.dataset && n.dataset.mkLogin === '1') || (n.textContent || '').includes('Войди, чтобы смотреть ролики'));
            if (!login) bad.push(id + ': signed-out card missing login message');
          }
        }
      } catch (e) {
        bad.push(id + ': ' + (e && e.stack || e));
      }
    }
    assert.equal(bad.length, 0, (signedIn ? 'signed-in' : 'signed-out') + ' failures (' + bad.length + '):\n' + bad.slice(0, 12).join('\n'));
  }
});

test('Library hides «Мои шаблоны» entry points and does not delete saved templates or history links', () => {
  const templates = [{ id: 't1', name: 'Жим день', items: [{ exId: 'bp', sets: 3, min: 8, max: 12, rest: 90 }] }];
  const workouts = [{
    id: 'w1', start: Date.now(), end: Date.now(), dayName: 'Своя тренировка', fromTemplate: true,
    items: [{ exId: 'bp', sets: [{ w: 40, r: 8, done: true }] }]
  }];
  const { run, store } = boot({ templates, workouts, signedIn: false });
  assert.equal(run('typeof tplUiEnabled==="function"&&tplUiEnabled()'), false);
  assert.equal(run('tplBarHTML()'), '');
  run('libView()');
  const html = run('app.innerHTML');
  assert.doesNotMatch(html, /Мои шаблоны|id="tplbox"|Новый шаблон/);
  run('if(typeof premFreeToday==="function")premFreeToday()');
  const diary = run('app.innerHTML');
  assert.doesNotMatch(diary, /Мои шаблоны|id="tplbox"|Новый шаблон/);
  assert.equal(run('tplAll().length'), 1);
  assert.equal(run('tplAll()[0].name'), 'Жим день');
  assert.equal(run('tplGet("t1").name'), 'Жим день');
  const saved = JSON.parse(store.get('gym'));
  assert.equal(saved.templates[0].name, 'Жим день');
  assert.equal(run('S.workouts[0].fromTemplate'), true);
  const hist = run('historyLabel(S.workouts[0])');
  assert.equal(hist, 'Своя тренировка');
  assert.match(read('cache-ver.js'), /var SW_CACHE='moyzal-v167'/);
  assert.match(read('sw.js'), /const C=SW_CACHE/);
});
