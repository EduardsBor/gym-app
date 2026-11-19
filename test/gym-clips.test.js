'use strict';
// Gym catalog and gym programs must not use an exercise without a MoveKit clip mapping.
// Clips are checked by movekitFile() in the repo; video files are never opened.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const arr = x => JSON.parse(JSON.stringify(x));

function boot() {
  const store = new Map();
  const nodes = new Map();
  function el(id) {
    if (id && nodes.has(id)) return nodes.get(id);
    const node = {
      id: id || '', innerHTML: '', textContent: '', className: '', value: '', style: {}, dataset: {},
      classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
      append() {}, addEventListener() {}, insertAdjacentHTML() {}, setAttribute() {}, getAttribute() { return null; },
      closest() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; }
    };
    if (id) nodes.set(id, node);
    return node;
  }
  const g = {
    console, setTimeout, clearTimeout, setInterval() { return 0; }, clearInterval() {},
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
  for (const f of files) vm.runInContext(read(f), ctx, { filename: f });
  return { run: code => vm.runInContext(code, ctx) };
}

function planIds(p) {
  const out = [];
  for (const d of p.days) {
    for (const it of d.items) out.push(it.exId);
    if (d.wu) {
      if (d.wu.cardio) out.push(d.wu.cardio.id);
      for (const m of d.wu.mob || []) out.push(m.id);
      for (const r of d.wu.ramp || []) out.push(r.exId);
    }
    if (d.cd) {
      if (d.cd.cardio) out.push(d.cd.cardio.id);
      for (const m of d.cd.stretch || []) out.push(m.id);
    }
  }
  return out;
}

test('gym catalog and gym programs have no exercise without a MoveKit clip (walk-brisk is absent; cd_breath is the only known exception)', () => {
  const { run } = boot();
  const hasClip = id => !!run(`movekitFile(${JSON.stringify(id)}, 'g')`);
  const ids = new Set();

  for (const id of arr(run('libFilter(EX, {p: "g"}).map(e => e.id)'))) ids.add(id);

  const raw = arr(run(`(() => {
    const out = [];
    const add = id => { if (id) out.push(id); };
    for (const [k, t] of Object.entries(PROG.T)) {
      if (!k.endsWith('_g')) continue;
      for (const day of t[2]) {
        for (const it of day[1] || []) add(PROG.I[it[0]]);
        if (day[2]) { add(PROG.I[day[2][0]]); for (const s of day[2][1] || []) add(PROG.I[s]); }
        const wu = day[3];
        if (wu) {
          add(PROG.I[wu[0]]);
          for (const s of wu[1] || []) add(PROG.I[s]);
          for (const e of wu[4] || []) { add(PROG.I[e[0]]); if (e[4] >= 0) add(PROG.I[e[4]]); }
        }
        const cd = day[4];
        if (cd) {
          if (cd[0] >= 0) add(PROG.I[cd[0]]);
          for (const s of cd[1] || []) add(PROG.I[s]);
          for (const e of cd[5] || []) { add(PROG.I[e[0]]); if (e[4] >= 0) add(PROG.I[e[4]]); }
        }
      }
    }
    for (const list of Object.values(PROG.P.g || {})) for (const i of list) add(PROG.I[i]);
    return out;
  })()`));
  for (const id of raw) ids.add(id);

  run('globalThis.__p = a => planFromTemplate(a)');
  const gymKeys = arr(run('Object.keys(PROG.T).filter(k => k.endsWith("_g"))'));
  const lens = [30, 45, 60, 75, 90];
  const lims = [[], ['s'], ['k'], ['p'], ['s', 'k', 'p']];
  for (const k of gymKeys) {
    const m = /^(.*)_([a-z]+)_([0-9]+)_g$/.exec(k);
    assert.ok(m, k);
    const goal = m[1], level = m[2], days = +m[3];
    for (const len of lens) for (const lim of lims) {
      const p = arr(run(`__p(${JSON.stringify({ goal, level, days, len, place: 'g', sex: 'm', prio: [], lim })})`));
      for (const id of planIds(p)) ids.add(id);
    }
  }

  assert.equal(ids.has('walk-brisk'), false);

  const noClip = [...ids].filter(id => !hasClip(id)).sort();
  // cd_breath (lying breathing) is a long-standing no-clip exception in cool-downs and the library; do not delete it.
  assert.deepEqual(noClip, ['cd_breath']);
});

test('gym-clips: sw is moyzal-v72; changelog mentions it', () => {
  assert.match(read('sw.js'), /const C='moyzal-v83'/);
  assert.match(read('CHANGELOG.md'), /moyzal-v72/);
});
