'use strict';
// GC-162 / GC-163-03: band-assisted pull-ups — draft algorithm (NOT active in the app): transitions and edge cases,
// plus guards that home D2 stays off, the draft is not shipped and R2 stays off.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const { BAND_CARD, bandAssistNext } = require(path.join(root, 'docs/drafts/band-assisted-pullup/band-assist.js'));
const P = require(path.join(root, 'progress.js'));

const base = { range: [5, 8], sets_plan: 3, state: {} };
const run = (x, bands) => bandAssistNext(Object.assign({}, base, x), bands || [1, 3, 5]);
const top = [8, 8, 8];

test('1. band level must be one of the user’s own bands; empty / 0 / no bands → need_w (never «0»)', () => {
  assert.equal(run({ weight: null, results: top }).note, 'need_w');
  assert.equal(run({ weight: 0, results: top }).note, 'need_w');
  assert.equal(run({ weight: 3, results: top }, []).note, 'need_w');
  const o = run({ weight: 2, results: top });   // 2 is not in [1,3,5]
  assert.deepEqual([o.note, o.reason, o.weight], ['need_w', 'not_owned', null]);
  assert.equal(run({ weight: 2.5, results: top }, [1, 2.5, 5]).note, 'need_w', 'non-integer levels are ignored');
});

test('2. less help step by step over the user’s bands: 5 → 3 → 1 (2 top sessions each)', () => {
  let st = {}, w = 5;
  const seen = [];
  for (let i = 0; i < 4; i++) { const o = run({ weight: w, results: top, state: st }); st = o.state; if (o.note === 'inc') { seen.push(o.weight); w = o.weight; } }
  assert.deepEqual(seen, [3, 1]);
});

test('3/4. lightest band mastered → unassisted test first; test ≥ bottom of the range → pull (or chin); test below → stay, retest later', () => {
  const a = run({ weight: 1, results: top, state: { success: 1 } });
  assert.deepEqual([a.note, a.id, a.weight, a.state.test], ['test_pull', 'band-assisted-pullup', 1, 1]);
  // no test logged → the request stays
  const a2 = run({ weight: 1, results: top, state: a.state });
  assert.deepEqual([a2.note, a2.state.test], ['test_pull', 1]);
  // test 5 reps (= bottom of 5–8) → pull
  const b = run({ weight: 1, results: top, state: a.state, test_reps: 5 });
  assert.deepEqual([b.note, b.id, b.weight], ['ladder', 'pull', null]);
  assert.equal(run({ weight: 1, results: top, state: a.state, test_reps: 6, from: 'chin' }).id, 'chin');
  // test 3 reps → stays on the band, success from zero, test again after 2 more top sessions
  const c = run({ weight: 1, results: top, state: a.state, test_reps: 3 });
  assert.deepEqual([c.note, c.id, c.weight, 'test' in c.state], ['test_fail', 'band-assisted-pullup', 1, false]);
  const d = run({ weight: 1, results: top, state: c.state });
  assert.equal(d.note, 'test_pull', 'second top session after a failed test → test again');
});

test('5. zero reps: counted as a miss; nothing logged → nothing changes', () => {
  const z = run({ weight: 3, results: [0, 0, 0] });
  assert.deepEqual([z.note, z.weight], ['miss1', 3]);
  const e = run({ weight: 3, results: [], state: { success: 1, miss: 1 } });
  assert.deepEqual([e.note, e.state], ['same', { success: 1, miss: 1 }]);
});

test('6. three failed sessions in a row → stronger band; on the strongest own band → easier home step (scap-pullup)', () => {
  let st = {};
  const m1 = run({ weight: 3, results: [4, 5, 5], state: st }); assert.equal(m1.note, 'miss1');
  const m2 = run({ weight: 3, results: [4, 4, 5], state: m1.state }); assert.deepEqual([m2.note, m2.sets], ['miss2', 2]);
  const m3 = run({ weight: 3, results: [3, 3], state: m2.state }); assert.deepEqual([m3.note, m3.weight, m3.state.miss], ['miss3', 5, 0]);
  const s = run({ weight: 5, results: [0, 0, 0], state: { miss: 2 } }); assert.deepEqual([s.note, s.weight, s.down], ['miss3', 5, 'scap-pullup']);
  // a good session in between resets the count
  const ok = run({ weight: 3, results: [6, 6, 6], state: { miss: 2, cut: 1 } }); assert.deepEqual([ok.state.miss, 'cut' in ok.state], [0, false]);
});

test('7. calibration never makes it harder at once: top → same band, counts as the first top session; all below → stronger band', () => {
  const c = run({ weight: 3, results: top, calibration: true });
  assert.deepEqual([c.note, c.weight, c.state.success], ['cal_ok', 3, 1]);
  const n = run({ weight: 3, results: top, state: c.state });
  assert.deepEqual([n.note, n.weight], ['inc', 1], 'lighter only after the second top session');
  assert.deepEqual((o => [o.note, o.weight])(run({ weight: 3, results: [3, 3, 3], calibration: true })), ['cal_down', 5]);
  assert.deepEqual((o => [o.note, o.down])(run({ weight: 5, results: [2, 2, 2], calibration: true })), ['cal_down', 'scap-pullup']);
});

test('8. history: the input state is not changed; the function never returns pull / chin state (their S.pg stays as is)', () => {
  const st = Object.freeze({ success: 1, miss: 0 });
  const o = run({ weight: 3, results: top, state: st });
  assert.deepEqual(st, { success: 1, miss: 0 });
  assert.equal(o.id, 'band-assisted-pullup');
  assert.deepEqual(Object.keys(o).sort().filter(k => !['caution', 'down', 'reason'].includes(k)), ['id', 'note', 'sets', 'state', 'weight']);
});

test('9. shoulder limitation: allowed with the technique hint (decision C), progression unchanged', () => {
  const o = run({ weight: 3, results: top, state: { success: 1 }, lim: ['p'] });
  assert.deepEqual([o.caution, o.note, o.weight], ['p', 'inc', 1]);
  assert.equal(run({ weight: 3, results: top }).caution, undefined);
  assert.equal(BAND_CARD.shoulderCaution, true);
});

test('10. card: RU / EN / LV incl. safe anchoring of the loop band; no pain wording (D-257); clip name only', () => {
  for (const l of ['ru', 'en', 'lv']) for (const k of ['name', 'how', 'safety', 'needBand', 'notOwned', 'testPull']) assert.ok(BAND_CARD[k][l], k + ' ' + l);
  assert.match(BAND_CARD.safety.ru, /надрыв/); assert.match(BAND_CARD.safety.ru, /не съезжает/); assert.match(BAND_CARD.safety.ru, /не прыгай/);
  assert.doesNotMatch(JSON.stringify(BAND_CARD), /бол[ьи]|pain|sāp/i);
  assert.equal(BAND_CARD.clip, 'band-assisted-pull-up.mp4');
});

test('r2: switching R2 off keeps users already on r2 — the r2 file path does not depend on the switch; R2 stays off', () => {
  const src = read('blocks.js');
  assert.match(src, /let R2_ON=false/);
  assert.match(src, /let R2_ACTIVE=\['mass_nov_4_g_b36','mass_nov_4_b_nobar_b36','mass_nov_5_g_b35','mass_nov_6_g_b36','fit_nov_6_g_b36'\];/);
  assert.match(src, /function blockFilePath\(id\)\{return R2_OF\[id\]\?\('data\/blocks\/r2\/'\+id\+'\.json'\)/);
  assert.match(src, /function blockR2For\(id\)\{return r2On\(id\)\?id\+'_r2':id\}/);
});

test('home D2 stays OFF and the draft is not shipped: PR_DOWN_PLACE.b=false, no band-assisted in the app or the SW cache', () => {
  assert.equal(P.PR_DOWN_PLACE.b, false);
  for (const f of ['index.html', 'sw.js', 'cards.js', 'progress.js', 'place.js', 'lib.js']) assert.doesNotMatch(read(f), /band-assisted|drafts\//, f);
});
