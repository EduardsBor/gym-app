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
const S0 = sample.block || sample; // blocks-v2c files are the block itself

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

test('C-112: validator accepts the v2c block; all exercise ids and the warmup template exist', () => {
  const { run } = boot();
  run(`this._sample = ${JSON.stringify(sample)}`);
  const r = run('validateBlock(_sample)');
  assert.equal(r.ok, true, (r.errors || []).join('; '));
  assert.equal(r.block.id, 'mass_nov_3_g_b36');
  assert.equal(r.block.workouts.length, 36);
  assert.equal(r.warmup.template, 'mass_nov_3_g');
  assert.equal(r.warmup.len, 75);
  assert.equal(r.end_actions.repeat, true);
  assert.equal(r.end_actions.next_level, 'mass_mid_3_g_b36');
  assert.ok(Object.values(run('BLOCK_MAP')).includes(r.end_actions.next_level));
});

test('C-112: validator rejects a missing field, an unknown exercise id, and a missing template', () => {
  const { run } = boot();
  const badId = JSON.parse(JSON.stringify(sample));
  (badId.block||badId).workouts[0].items[0].exId = 'not-a-real-exercise';
  run(`this._bad = ${JSON.stringify(badId)}`);
  const a = run('validateBlock(_bad)');
  assert.equal(a.ok, false);
  assert.ok(a.errors.some(e => /not-a-real-exercise/.test(e)), a.errors.join('; '));

  const noItems = JSON.parse(JSON.stringify(sample));
  (noItems.block||noItems).workouts[0].items = [];
  run(`this._empty = ${JSON.stringify(noItems)}`);
  const b = run('validateBlock(_empty)');
  assert.equal(b.ok, false);
  assert.ok(b.errors.some(e => /items/.test(e)), b.errors.join('; '));

  const noT = JSON.parse(JSON.stringify(sample));
  (noT.block||noT).warmup = { template: 'does_not_exist_xyz', len: 75 };
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
  const firstSample = S0.workouts[0].items.map(it => it.exId);
  const resolved = run(`(${JSON.stringify(firstSample)}).map(resolveExId)`);
  assert.deepEqual(plan.days[0].items.map(it => it.exId), resolved);
  assert.match(plan.days[0].name, /^Неделя 1 · (Всё тело|Верх тела|Низ тела|Жимовая|Тяговая|Ноги) [ABC]/);
  assert.match(plan.days[35].name, /^Неделя \d+ · /);
  const w12 = S0.workouts[11].items.map(it => it.exId);
  assert.deepEqual(plan.days[11].items.map(it => it.exId), run(`(${JSON.stringify(w12)}).map(resolveExId)`));
  // Sets come from the file, not from the weekly template generator.
  assert.equal(plan.days[0].items[0].sets, S0.workouts[0].items[0].sets);
  assert.equal(plan.days[0].items[0].min, S0.workouts[0].items[0].min);
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
    // without a next_level id it must not switch
    b.end_actions = { repeat: true };
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

test('C-112: blocks are on by default and cover every questionnaire key; gc_blocks=0 keeps the old generator', () => {
  const on = boot();
  const off = boot({ ls: { gc_blocks: '0' } });
  const q = '{goal:"mass",level:"nov",days:3,place:"g",len:75,sex:"m",prio:[],lim:[]}';
  const a = off.run(`generate(${q})`);
  const tpl = off.run(`planFromTemplate(${q})`);
  assert.equal(off.run('blocksEnabled()'), false);
  assert.ok(!a.blockId);
  assert.deepEqual(a.days.map(d => d.name), tpl.days.map(d => d.name));
  assert.equal(on.run('blocksEnabled()'), true);
  const b = on.run(`generate(${q})`);
  assert.equal(b.blockId, 'mass_nov_3_g_b36');
  assert.equal(b.days.length, 36);
  const keys = Object.keys(on.run('BLOCK_MAP'));
  assert.equal(keys.length, 180); // blocks-v2d: g, b_bar, b_nobar (D-236)
  for (const g of ['mass', 'str', 'loss', 'fit']) for (const l of ['nov', 'mid', 'adv']) for (const d of [2, 3, 4, 5, 6])
    for (const pl of ['g', 'd', 'b_bar', 'b_nobar']) {
      const k = [g, l, d, pl].join('_');
      const map = pl === 'd' ? on.run('LEGACY_D_BLOCK_MAP') : on.run('BLOCK_MAP');
      assert.ok(map[k], k);
      assert.ok(fs.existsSync(path.join(root, 'data/blocks', map[k] + '.json')), k);
    }
  // bodyweight: «Есть турник?» picks b_bar / b_nobar; default is no bar
  assert.match(on.run('blockIdForProfile({goal:"fit",level:"mid",days:4,place:"b",bar:"1"})'), /^fit_mid_4_b_bar_/);
  assert.match(on.run('blockIdForProfile({goal:"fit",level:"mid",days:4,place:"b",bar:"0"})'), /^fit_mid_4_b_nobar_/);
  assert.match(on.run('blockIdForProfile({goal:"fit",level:"mid",days:4,place:"b"})'), /^fit_mid_4_b_nobar_/);
  const qoff = boot({ search: '?blocks=0' });
  assert.equal(qoff.run('blocksEnabled()'), false);
  assert.equal(qoff.store.get('gc_blocks'), '0');
});

test('C-112: every block validates, next_level points to a real block, warmup by day_code, cardio finish in minutes', () => {
  const { run } = boot();
  const ids = Object.values(run('BLOCK_MAP'));
  const bad = run(`(() => { const out = []; for (const id of Object.values(BLOCK_MAP)) { const b = getBlock(id); const r = validateBlock(b);
    if (!r.ok) out.push(id + ': ' + r.errors.slice(0, 2).join('; ')); const nl = normalizeEndActions(b.end_actions).next_level; if (nl && !getBlock(nl)) out.push(id + ' next ' + nl); } return out; })()`);
  assert.deepEqual(JSON.parse(JSON.stringify(bad)), []);
  assert.ok(ids.length === 180);
  const r = run(`(() => { const b = getBlock(BLOCK_MAP.mass_mid_4_g); const idx = blockDayIndex(b); const p = planFromBlock(b, {goal:'mass',level:'mid',days:4,place:'g'});
    const w = b.workouts; const i5 = w.findIndex((x, i) => i > 0 && x.day_code === w[0].day_code);
    return { idx, codes: w.slice(0, 4).map(x => x.day_code), same: JSON.stringify(p.days[0].cd) === JSON.stringify(p.days[i5].cd), wu: !!p.days[0].wu, cd: !!p.days[0].cd }; })()`);
  assert.deepEqual([...r.codes], ['U1', 'L1', 'U2', 'L2']);
  assert.deepEqual(JSON.parse(JSON.stringify(r.idx)), { U1: 0, L1: 1, U2: 2, L2: 3 });
  assert.equal(r.wu, true); assert.equal(r.cd, true); assert.equal(r.same, true);
  const c = run(`(() => { for (const id of Object.values(BLOCK_MAP)) { const b = getBlock(id); for (const w of b.workouts) { const it = w.items.find(i => i.cardio); if (it) { const row = itemFromBlock(it); return { row, txt: setTxt(row) }; } } } })()`);
  assert.equal(c.row.cardio, 1); assert.equal(c.row.sets, 1); assert.equal(c.row.rest, 0);
  assert.match(c.txt, /мин$/);
});

test('C-112: limitations swap inside the block to a same-muscle alternative without the risk flag', () => {
  const { run } = boot();
  const out = run(`(() => { const b = getBlock(BLOCK_MAP.mass_mid_3_g); const p0 = planFromBlock(b, {goal:'mass',level:'mid',days:3,place:'g',lim:[]});
    const p1 = planFromBlock(b, {goal:'mass',level:'mid',days:3,place:'g',lim:['s']});
    let risky0 = 0, risky1 = 0, swapped = 0, sameGroup = true;
    p0.days.forEach((d, i) => d.items.forEach((it, j) => { const ok0 = blockLimOk(it.exId, {lim:['s']}); if (!ok0) risky0++;
      const it1 = p1.days[i].items[j]; if (!blockLimOk(it1.exId, {lim:['s']})) risky1++; if (it1.swapped) { swapped++; if (exBy(it1.exId).group !== exBy(it.exId).group) sameGroup = false; } }));
    return { risky0, risky1, swapped, sameGroup }; })()`);
  assert.ok(out.risky0 > 0, 'sample has back-risky exercises');
  assert.ok(out.swapped > 0);
  assert.ok(out.risky1 < out.risky0);
  assert.equal(out.sameGroup, true);
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
  assert.match(read('cache-ver.js'), /var SW_CACHE='moyzal-v135'/);
  assert.match(read('sw.js'), /const C=SW_CACHE/);
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
