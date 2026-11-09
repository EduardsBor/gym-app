'use strict';
// Packs the trainer's programs.json (v1.1) into a minified prog.js. Not shipped to the app.
const fs = require('fs');
const src = process.argv[2] || '/home/ubuntu/.cursor/projects/agent-repos-gym-app/uploads/programs_c07f.json';
const d = JSON.parse(fs.readFileSync(src, 'utf8'));
const L = [30, 45, 60, 75, 90];
const ids = [];
const idAt = new Map();
function iid(id) {
  if (!idAt.has(id)) { idAt.set(id, ids.length); ids.push(id); }
  return idAt.get(id);
}
const doses = [];
const doseAt = new Map();
function did(s) {
  if (!doseAt.has(s)) { doseAt.set(s, doses.length); doses.push(s); }
  return doseAt.get(s);
}
const names = [];
const nameAt = new Map();
function nid(s) {
  if (!nameAt.has(s)) { nameAt.set(s, names.length); names.push(s); }
  return nameAt.get(s);
}
const slots = [];
const slotAt = new Map();
function sid(s) {
  if (!slotAt.has(s)) { slotAt.set(s, slots.length); slots.push(s); }
  return slotAt.get(s);
}
const bit = {s: 1, k: 2, p: 4};
function mask(arr) { return (arr || []).reduce((m, x) => m | (bit[x] || 0), 0); }
function subOf(obj) {
  if (!obj) return [-1, 0];
  const k = Object.keys(obj)[0];
  return [iid(obj[k]), bit[k] || 0];
}
function mob(m) {
  const [sub, flag] = subOf(m.sub_if);
  return [iid(m.exId), did(m.dose || ''), L.indexOf(m.from), mask(m.skip_if), sub, flag];
}
function setsNum(arr) { return +arr.join(''); }
const adviceTexts = [];
function aid(t) {
  if (!t || !t.show) return -1;
  let i = adviceTexts.indexOf(t.text);
  if (i < 0) { i = adviceTexts.length; adviceTexts.push(t.text); }
  return i;
}
const T = {};
for (const [key, t] of Object.entries(d.templates)) {
  const est = [];
  for (const e of t.duration_estimate) est.push(e.est_min, e.est_max, e.shorter_than_selected ? 1 : 0);
  const days = t.days.map(day => {
    const items = day.items.map(it => [iid(it.exId), sid(it.slot), it.role === 'a' ? 1 : 0, setsNum(it.sets), it.min, it.max, it.rest, it.unit === 'sec' ? 1 : 0]);
    const cardio = day.cardio ? [iid(day.cardio.exId), day.cardio.subs.map(iid), ...day.cardio.min_by_len] : 0;
    const wuC = day.warmup.cardio;
    const wu = [iid(wuC.exId), wuC.subs.map(iid), wuC.min_by_len, day.warmup.mobility_max_by_len, day.warmup.mobility.map(mob), day.warmup.ramp.map(r => [r.item, r.pct == null ? -1 : r.pct, String(r.reps), L.indexOf(r.from)])];
    const cdC = day.cooldown.cardio;
    const cd = [cdC ? iid(cdC.exId) : -1, cdC ? cdC.subs.map(iid) : [], cdC ? cdC.min_by_len : 0, day.cooldown.note_cardio ? 1 : 0, day.cooldown.stretches_max_by_len, day.cooldown.stretches.map(mob)];
    const x10 = a => a.map(n => Math.round(n * 10));
    return [nid(day.name), items, cardio, wu, cd, x10(day.est_min), x10(day.warm_min), x10(day.cool_min)];
  });
  T[key] = [aid(t.advice), est, days];
}
const SG = {};
for (const [g, list] of Object.entries(d.priority_rules.slot_groups)) SG[g] = list.map(sid);
const P = {};
for (const [place, groups] of Object.entries(d.priority_rules.pools)) {
  P[place] = {};
  for (const [g, list] of Object.entries(groups)) P[place][g] = list.map(iid);
}
const R = {};
for (const [goal, levels] of Object.entries(d.params.sets_reps_rest)) {
  R[goal] = {};
  for (const [lv, row] of Object.entries(levels)) R[goal][lv] = row.a;
}
const F = Object.values(d.limit_rules.families).map(list => list.map(iid));
const prog = {
  L, I: ids, D: doses, N: names, V: adviceTexts, S: slots, SG, P, R, F, T,
  U: d.params.unilateral_ids.map(iid),
  H: {'pl': 1, 'bpl': 2, 'plank-advanced': 1},
  B: d.limit_rules.families.BRIDGE.map(iid),
  G: d.limit_rules.families.HINGE.map(iid),
  K: ['jump', 'stair', 'jump-rope'],
  X: {nlc: 1, dip: 1, hlr: 1, fsq: 1, abw: 1}
};
const out = 'const PROG=' + JSON.stringify(prog) + ';\n';
const dest = process.argv[3] || '/agent/repos/gym-app/prog.js';
fs.writeFileSync(dest, out);
console.log('bytes', Buffer.byteLength(out), 'ids', ids.length, 'doses', doses.length, 'names', names.length, 'templates', Object.keys(T).length);
