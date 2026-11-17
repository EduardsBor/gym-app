'use strict';
// C-112: program-block engine — validator, order, skip, repeat/next_level, flag off = old generator.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const samplePath = path.join(root, 'data/blocks/mass_nov_3_g_b36.json');
const sample = JSON.parse(read('data/blocks/mass_nov_3_g_b36.json'));

function boot(opts) {
  const store = new Map();
  if (opts && opts.ls) for (const [k, v] of Object.entries(opts.ls)) store.set(k, String(v));
  const nodes = new Map();
  function el(id) {
    if (id && nodes.has(id)) return nodes.get(id);
    const node = {
      id: id || '', innerHTML: '', textContent: '', className: '', value: '', style: {}, dataset: {},
      classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
      append() {}, addEventListener() {}, insertAdjacentHTML() {}, setAttribute() {}, getAttribute() { return null; },
      closest() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; },
      onclick: null
    };
    if (id) nodes.set(id, node);
    return node;
  }
  const search = (opts && opts.search) || '';
  const g = {
    console, setTimeout, clearTimeout, setInterval() { return 0; }, clearInterval() {},
    URL, Blob, navigator: { language: 'ru', languages: ['ru'] },
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
    location: { href: 'http://127.0.0.1/' + search, origin: 'http://127.0.0.1', pathname: '/', search },
    document: {
      documentElement: { lang: 'ru' }, title: '', body: { append() {}, style: {} },
      querySelector(sel) { const m = /^#([\w-]+)/.exec(sel || ''); return el(m ? m[1] : ''); },
      querySelectorAll() { return []; }, addEventListener() {}, createElement() { return el(); }
    }
  };
  g.window = g; g.globalThis = g; g.self = g;
  g.XMLHttpRequest = function () {
    this.status = 0; this.responseText = '';
    this.open = function (method, url) { this._url = url; };
    this.send = function () {
      const rel = String(this._url || '').replace(/^\.\//, '');
      const fp = path.join(root, rel);
      if (fs.existsSync(fp)) { this.status = 200; this.responseText = fs.readFileSync(fp, 'utf8'); }
      else { this.status = 404; this.responseText = ''; }
    };
  };
  const ctx = vm.createContext(g);
  const files = ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'place.js', 'prog.js', 'plan.js', 'blocks.js'];
  for (const f of files) vm.runInContext(read(f), ctx, { filename: f });
  return { run: code => vm.runInContext(code, ctx), store };
}

test('C-112: validator accepts the v2 sample; all exercise ids and the warmup template exist', () => {
  const { run } = boot();
  run(`this._sample = ${JSON.stringify(sample)}`);
  const r = run('validateBlock(_sample)');
  assert.equal(r.ok, true, (r.errors || []).join('; '));
  assert.equal(r.block.id, 'mass_nov_3_g_b36');
  assert.equal(r.block.workouts.length, 36);
  assert.equal(r.warmup.template, 'mass_nov_3_g');
  assert.equal(r.warmup.len, 75);
  assert.equal(r.end_actions.repeat, true);
  assert.equal(r.end_actions.next_level, null);
});

test('C-112: validator rejects a missing field, an unknown exercise id, and a missing template', () => {
  const { run } = boot();
  const badId = JSON.parse(JSON.stringify(sample));
  badId.block.workouts[0].items[0].exId = 'not-a-real-exercise';
  run(`this._bad = ${JSON.stringify(badId)}`);
  const a = run('validateBlock(_bad)');
  assert.equal(a.ok, false);
  assert.ok(a.errors.some(e => /not-a-real-exercise/.test(e)), a.errors.join('; '));

  const noItems = JSON.parse(JSON.stringify(sample));
  noItems.block.workouts[0].items = [];
  run(`this._empty = ${JSON.stringify(noItems)}`);
  const b = run('validateBlock(_empty)');
  assert.equal(b.ok, false);
  assert.ok(b.errors.some(e => /items/.test(e)), b.errors.join('; '));

  const noT = JSON.parse(JSON.stringify(sample));
  noT.block.warmup_cooldown_from = 'templates.does_not_exist_xyz (len 75)';
  run(`this._nt = ${JSON.stringify(noT)}`);
  const c = run('validateBlock(_nt)');
  assert.equal(c.ok, false);
  assert.ok(c.errors.some(e => /template not found/.test(e)), c.errors.join('; '));
});

test('C-112: workouts are taken from the block in order and are not generated', () => {
  const { run } = boot({ ls: { gc_blocks: '1' } });
  const plan = run('planFromBlock(getBlock("mass_nov_3_g_b36"), {goal:"mass",level:"nov",days:3,place:"g",len:75})');
  assert.equal(plan.days.length, 36);
  assert.equal(plan.blockId, 'mass_nov_3_g_b36');
  const firstSample = sample.block.workouts[0].items.map(it => it.exId);
  const resolved = run(`(${JSON.stringify(firstSample)}).map(resolveExId)`);
  assert.deepEqual(plan.days[0].items.map(it => it.exId), resolved);
  assert.equal(plan.days[0].name, 'Тренировка 1');
  assert.equal(plan.days[35].name, 'Тренировка 36');
  const w12 = sample.block.workouts[11].items.map(it => it.exId);
  assert.deepEqual(plan.days[11].items.map(it => it.exId), run(`(${JSON.stringify(w12)}).map(resolveExId)`));
  // Sets come from the file, not from the weekly template generator.
  assert.equal(plan.days[0].items[0].sets, sample.block.workouts[0].items[0].sets);
  assert.equal(plan.days[0].items[0].min, sample.block.workouts[0].items[0].min);
  assert.ok(plan.days[0].wu, 'warmup from the 75-min template');
  assert.ok(plan.days[0].cd, 'cooldown from the 75-min template');
});

test('C-112: skip only moves the date; the next-workout index does not change; finish increments it', () => {
  const { run } = boot({ ls: { gc_blocks: '1' } });
  const out = run(`(() => {
    const Sx = { block: { id: 'mass_nov_3_g_b36', next: 0 }, next: 0 };
    migrateBlockState(Sx);
    const b = getBlock('mass_nov_3_g_b36');
    const before = Sx.block.next;
    skipBlockWorkout(Sx);
    const afterSkip = Sx.block.next;
    const due = Sx.block.dueOn;
    finishBlockWorkout(Sx, b);
    const afterFin = Sx.block.next;
    // finish the rest through the last workout
    while (Sx.block.next < blockWorkoutCount(b)) finishBlockWorkout(Sx, b);
    return { before, afterSkip, due, afterFin, last: Sx.block.next, n: blockWorkoutCount(b), complete: blockIsComplete(Sx, b) };
  })()`);
  assert.equal(out.before, 0);
  assert.equal(out.afterSkip, 0);
  assert.ok(out.due && /^\d{4}-\d{2}-\d{2}$/.test(out.due), 'skip sets a date');
  assert.equal(out.afterFin, 1);
  assert.equal(out.last, out.n);
  assert.equal(out.complete, true);
});

test('C-112: repeat resets the index; next_level switches only when an id is set, and only on user action', () => {
  const { run } = boot({ ls: { gc_blocks: '1' } });
  const out = run(`(() => {
    const b = JSON.parse(JSON.stringify(getBlock('mass_nov_3_g_b36')));
    const Sx = { block: { id: b.id, next: blockWorkoutCount(b) }, next: blockWorkoutCount(b) };
    // v2 lists next_level without an id — must not switch
    const noId = goNextLevel(Sx, b);
    const still = Sx.block.id;
    repeatBlock(Sx);
    const afterRepeat = Sx.block.next;
    b.end_actions = { repeat: true, next_level: 'mass_mid_3_g_b36' };
    Sx.block.next = blockWorkoutCount(b);
    const switched = goNextLevel(Sx, b);
    return { noId, still, afterRepeat, switched, id: Sx.block.id, next: Sx.block.next };
  })()`);
  assert.equal(out.noId, false);
  assert.equal(out.still, 'mass_nov_3_g_b36');
  assert.equal(out.afterRepeat, 0);
  assert.equal(out.switched, true);
  assert.equal(out.id, 'mass_mid_3_g_b36');
  assert.equal(out.next, 0);
});

test('C-112: without the flag the current program generator is unchanged; the flag uses the v2 sample for mass/nov/3/g', () => {
  const off = boot();
  const on = boot({ ls: { gc_blocks: '1' } });
  const q = '{goal:"mass",level:"nov",days:3,place:"g",len:75,sex:"m",prio:[],lim:[]}';
  const a = off.run(`generate(${q})`);
  const b = on.run(`generate(${q})`);
  const tpl = off.run(`planFromTemplate(${q})`);
  assert.equal(a.days.length, tpl.days.length);
  assert.deepEqual(a.days.map(d => d.name), tpl.days.map(d => d.name));
  assert.ok(!a.blockId);
  assert.equal(off.run('blocksEnabled()'), false);
  assert.equal(b.days.length, 36);
  assert.equal(b.blockId, 'mass_nov_3_g_b36');
  assert.equal(b.days[0].name, 'Тренировка 1');
  // A profile with no mapping still uses the generator even with the flag on.
  const other = on.run('generate({goal:"fit",level:"nov",days:3,place:"g",len:60,sex:"m",prio:[],lim:[]})');
  assert.ok(!other.blockId);
  assert.ok(other.days.length < 36);
  // ?blocks=1 also turns the flag on
  const qon = boot({ search: '?blocks=1' });
  assert.equal(qon.run('blocksEnabled()'), true);
  assert.equal(qon.store.get('gc_blocks'), '1');
});

test('C-112: default migration keeps old state; block fields travel with the program in the sync payload', () => {
  const { run } = boot();
  const mig = run(`(() => {
    const old = { program: [{ name: 'Фулбоди A', items: [{ exId: 'lp', sets: 3, min: 8, max: 12, rest: 90 }] }], next: 1, goal: 'mass' };
    migrateBlockState(old);
    const bad = { block: 'oops', program: old.program };
    migrateBlockState(bad);
    const ok = { block: { id: 'mass_nov_3_g_b36', next: 'x' } };
    migrateBlockState(ok);
    return { hasBlock: !!old.block, programKept: old.program[0].name, badCleared: bad.block === undefined, next: ok.block.next, id: ok.block.id };
  })()`);
  assert.equal(mig.hasBlock, false);
  assert.equal(mig.programKept, 'Фулбоди A');
  assert.equal(mig.badCleared, true);
  assert.equal(mig.next, 0);
  assert.equal(mig.id, 'mass_nov_3_g_b36');
  const sync = read('sync.js');
  assert.match(sync, /S\.block\|\|null/);
  assert.match(sync, /'block'\]\.forEach/);
});

test('C-112: cache is moyzal-v74; blocks.js and the sample JSON are precached; changelog and LV doc exist', () => {
  assert.match(read('sw.js'), /const C='moyzal-v74'/);
  assert.match(read('sw.js'), /blocks\.js/);
  assert.match(read('sw.js'), /data\/blocks\/mass_nov_3_g_b36\.json/);
  assert.match(read('index.html'), /<script src="blocks\.js"><\/script>/);
  assert.match(read('CHANGELOG.md'), /moyzal-v74/);
  assert.match(read('CHANGELOG.md'), /C-112/);
  assert.ok(fs.existsSync(path.join(root, 'docs/LV-NEW-C112.md')));
  assert.ok(fs.existsSync(samplePath));
  const dict3 = read('i18n/dict3.js');
  for (const s of ['Повторить блок', 'Следующий уровень', 'Блок завершён', 'Пропустить тренировку', 'Atkārtot bloku', 'Nākamais līmenis']) {
    assert.ok(dict3.includes(s), s);
  }
});
