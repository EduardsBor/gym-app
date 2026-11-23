'use strict';
// GC-162 task 3: band-assisted pull-ups — draft algorithm (not active in the app) + guard that home D2 stays off.
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

test('band: empty band level or no bands in the profile → need_w (never «0»)', () => {
  assert.equal(run({ weight: null, results: [8, 8, 8] }).note, 'need_w');
  assert.equal(run({ weight: 0, results: [8, 8, 8] }).note, 'need_w');
  assert.equal(run({ weight: 3, results: [8, 8, 8] }, []).note, 'need_w');
});

test('band: top of the range 2 sessions in a row → next LIGHTER band the user owns (less help)', () => {
  const s1 = run({ weight: 5, results: [8, 8, 8] });
  assert.deepEqual([s1.note, s1.weight], ['same', 5]);
  const s2 = run({ weight: 5, results: [8, 8, 8], state: s1.state });
  assert.deepEqual([s2.note, s2.weight, s2.id], ['inc', 3, 'band-assisted-pullup']);
  assert.equal(s2.state.success, 0);
});

test('band: lightest band mastered → back to pull (or chin when the user came from chin); history kept apart', () => {
  const o = run({ weight: 1, results: [8, 8, 8], state: { success: 1 } });
  assert.deepEqual([o.id, o.note, o.weight], ['pull', 'ladder', null]);
  assert.equal(run({ weight: 1, results: [8, 8, 8], state: { success: 1 }, from: 'chin' }).id, 'chin');
});

test('band: misses — 1st same, 2nd one set less, 3rd stronger band (more help); never above 5', () => {
  let st = {};
  const m1 = run({ weight: 3, results: [4, 5, 5], state: st }); assert.equal(m1.note, 'miss1'); assert.equal(m1.weight, 3);
  const m2 = run({ weight: 3, results: [4, 4, 5], state: m1.state }); assert.deepEqual([m2.note, m2.sets], ['miss2', 2]);
  const m3 = run({ weight: 3, results: [3, 3], state: m2.state }); assert.deepEqual([m3.note, m3.weight], ['miss3', 5]);
  const top = run({ weight: 5, results: [2, 2, 2], state: { miss: 2 } }); assert.deepEqual([top.note, top.weight], ['miss3', 5]);
});

test('band: calibration — all at the top → lighter at once; all below → stronger', () => {
  assert.deepEqual((o => [o.note, o.weight])(run({ weight: 3, results: [8, 8, 8], calibration: true })), ['inc', 1]);
  assert.deepEqual((o => [o.note, o.weight])(run({ weight: 3, results: [3, 3, 3], calibration: true })), ['cal_down', 5]);
});

test('band: between the top and the bottom → same band, success reset', () => {
  const o = run({ weight: 3, results: [8, 7, 6], state: { success: 1 } });
  assert.deepEqual([o.note, o.weight, o.state.success], ['same', 3, 0]);
});

test('band card: RU / EN / LV present, technique without pain wording (D-257), clip name only', () => {
  for (const l of ['ru', 'en', 'lv']) { assert.ok(BAND_CARD.name[l]); assert.ok(BAND_CARD.how[l].length > 80); assert.ok(BAND_CARD.needBand[l]); }
  assert.doesNotMatch(JSON.stringify(BAND_CARD), /бол[ьи]|pain|sāp/i);
  assert.equal(BAND_CARD.clip, 'band-assisted-pull-up.mp4');
});

test('r2: switching R2_ON off keeps users already on r2 — the r2 file path does not depend on R2_ON; R2 stays off', () => {
  const src = read('blocks.js');
  assert.match(src, /let R2_ON=false/);
  assert.match(src, /function blockFilePath\(id\)\{return R2_OF\[id\]\?\('data\/blocks\/r2\/'\+id\+'\.json'\)/);
  assert.match(src, /function blockR2For\(id\)\{return R2_ON&&id&&R2_READY\.includes\(id\)\?id\+'_r2':id\}/);
});

test('home D2 stays OFF and the draft is not shipped: PR_DOWN_PLACE.b=false, no band-assisted in the app or the SW cache', () => {
  assert.equal(P.PR_DOWN_PLACE.b, false);
  for (const f of ['index.html', 'sw.js', 'cards.js', 'progress.js', 'place.js', 'lib.js']) assert.doesNotMatch(read(f), /band-assisted|drafts\//, f);
});
