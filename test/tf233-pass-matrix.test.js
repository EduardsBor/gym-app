'use strict';
// tech-fix-2.3.3 (QA-232-01, root cause): matrix of old / new / mixed saves. next = 0, 1, 2 × passAt (none / stored) ×
// records of the previous program (none / day 2 / day 3 / days 2+3; untagged or with w.blk of that block) × a fit day done
// out of order (none / before day 1 / after day 1; untagged or with w.blk of fit). Rule checked for every case:
//  - days before S.block.next → 'done';
//  - a fit record with w.blk of fit, or any record inside the known pass (after passAt / after day 1 of the pass) → 'done';
//  - no passAt: an untagged record older than day 1 of the pass (or any, while next = 0) → never 'done', always 'unsure';
//  - a record with w.blk of another block → never matches; with passAt, records before it → not this pass;
//  - otherwise → false (upcoming, checked by the plan check).
// «Заменить безопасными» (lgFixAll) never changes 'done' / 'unsure' days; S.workouts and S.pg are never changed.
const test = require('node:test');
const assert = require('node:assert/strict');
const { boot, DAY } = require('./fixtures/tf1-boot.js');

const now = Date.now();
const OLD = 'mass_nov_3_g_b36', NEW = 'fit_nov_3_g_b36';
const PR = { goal: 'mass', sex: 'm', level: 'nov', days: 3, len: 60, place: 'g', prio: [], lim: [] };
const st = () => ({ lang: 'ru', goal: 'mass', days: 3, next: 0, prof: Object.assign({}, PR), workouts: [], custom: [], body: [],
  pg: { lp: { st: { success: 1, miss: 0 }, next: { weight: 80 } } }, pgSince: now - 60 * DAY });
function assign(b, id, passAt) {
  b.run(`S.block={id:${JSON.stringify(id)},next:0${passAt != null ? ',passAt:' + passAt : ''}};S.next=0;S.program=planFromBlock(getBlock(${JSON.stringify(id)}),${JSON.stringify(PR)}).days;save()`);
}
function hist(b, i, at, blk) {
  b.run(`(()=>{const d=S.program[${i}];S.workouts.push(Object.assign({id:'h${i}_${at}',start:${at},dayIdx:${i},dayName:d.name,n:d.n,notes:'',items:[{exId:'lp',ns:3,sets:[{w:80,r:10,done:true}]}]},${blk ? JSON.stringify({ blk }) : '{}'}))})()`);
}
const fin = b => b.run(`finishBlockWorkout(S,getBlock(${JSON.stringify(NEW)}))`);
const HP = b => b.run('JSON.stringify({w:S.workouts,pg:S.pg})');

const cases = [];
for (const next of [0, 1, 2])
  for (const passAt of [false, true])
    for (const old of [[], [1], [2], [1, 2]])
      for (const oldTag of [false, true])
        for (const ooo of ['none', 'before', 'after'])
          for (const oooTag of [false, true])
            for (const inTag of [false, true]) {             // in-order fit days: old app (no w.blk) or new app (w.blk)
              if (!old.length && oldTag) continue;
              if (ooo === 'none' && oooTag) continue;
              if (ooo === 'after' && next === 0) continue;
              if ((next === 0 || passAt) && !inTag) continue;   // passAt ⇒ new app; next 0 ⇒ no in-order days
              cases.push({ next, passAt, old, oldTag, ooo, oooTag, inTag });
            }

test(`tf2.3.3 matrix: ${cases.length} saves (next 0/1/2, passAt, w.blk, other program, out of order) follow the pass rule; data unchanged`, () => {
  let unsureSeen = 0, doneSeen = 0;
  for (const c of cases) {
    const tag = JSON.stringify(c);
    const b = boot({ state: st() });
    // previous program (old or new app), its days 2 / 3 done
    assign(b, OLD, null);
    c.old.forEach((d, k) => hist(b, d, now - (20 - k) * DAY, c.oldTag ? OLD : null));
    // switch to fit: new app stores passAt, old app does not
    const pA = now - 15 * DAY;
    assign(b, NEW, c.passAt ? pA : null);
    // out-of-order fit day (k = next + 1, i.e. a day after the in-order ones) — before day 1 of the pass
    const k = c.next + 1;
    if (c.ooo === 'before') hist(b, k, now - 12 * DAY, c.oooTag ? NEW : null);
    for (let i = 0; i < c.next; i++) { hist(b, i, now - (10 - i) * DAY, c.inTag ? NEW : null); fin(b); }
    if (c.ooo === 'after') hist(b, k, now - 2 * DAY, c.oooTag ? NEW : null);
    b.run(`S.prof.lim=['k'];save()`);
    assert.equal(b.run('S.block.next'), c.next, tag);
    for (const d of c.old) assert.equal(b.run(`S.program[${d}].name`), b.run(`S.workouts.find(w=>w.dayIdx===${d}).dayName`), 'same day name ' + tag);
    const n = b.run('S.program.length'), got = b.J('S.program.map((d,i)=>lgDayLocked(i))');
    for (let i = 0; i < n; i++) {
      let exp;
      if (i < c.next) exp = 'done';
      else {
        const fitHere = (c.ooo !== 'none' && i === k) ? { tagged: c.oooTag, inPass: c.passAt || c.ooo === 'after' } : null;
        const oldHere = c.old.includes(i) && !c.oldTag;            // tagged mass records never match fit
        if (fitHere && (fitHere.tagged || fitHere.inPass)) exp = 'done';
        else if (c.passAt) exp = false;                            // mass records are before passAt
        else if (fitHere || oldHere) exp = 'unsure';               // untagged, older than day 1 of the pass
        else exp = false;
      }
      assert.equal(got[i], exp, `day ${i + 1}: ${tag}`);
      if (exp === 'unsure') unsureSeen++; if (exp === 'done' && i >= c.next) doneSeen++;
    }
    // no record of another program and no untagged record older than the pass start is ever 'done'
    if (!c.passAt) for (const d of c.old) if (d >= c.next && !(c.ooo !== 'none' && d === k && (c.oooTag || c.ooo === 'after'))) assert.notEqual(got[d], 'done', tag);
    // the plan check / question cover every upcoming or unsure risky day; done / unsure days are not changed by lgFixAll
    const plan = b.J('lgAuditPlan().map(x=>x.d)'), uns = b.J('lgAuditUnsure().map(x=>x.d)');
    for (let i = 0; i < n; i++) if (b.J(`!!lgAuditDay(S.program[${i}])`)) {
      if (got[i] === false) assert.ok(plan.includes(i), `risky upcoming day ${i + 1} checked: ${tag}`);
      if (got[i] === 'unsure') assert.ok(uns.includes(i), `risky unsure day ${i + 1} asked: ${tag}`);
    }
    const H = HP(b), keep = b.run(`JSON.stringify(S.program.filter((d,i)=>${JSON.stringify(got)}[i]))`);
    b.run('lgFixAll()');
    assert.equal(HP(b), H, 'S.workouts and S.pg unchanged ' + tag);
    assert.equal(b.run(`JSON.stringify(S.program.filter((d,i)=>${JSON.stringify(got)}[i]))`), keep, 'done / unsure days unchanged ' + tag);
  }
  assert.ok(unsureSeen > 0 && doneSeen > 0);
});

test('tf2.3.3 repeat on the old app (no passAt): full first pass, next back to 0, day 1 again → days of the 1st pass are upcoming; untagged out-of-order day of the 2nd pass before its day 1 is unsure', () => {
  const b = boot({ state: st() });
  assign(b, NEW, null);
  const n = b.run('S.program.length');
  for (let i = 0; i < n; i++) hist(b, i, now - 200 * DAY + i * 3600e3);
  b.run(`S.block={id:${JSON.stringify(NEW)},next:0};save()`);       // old-app repeat: no passAt
  hist(b, 3, now - 3 * DAY); hist(b, 0, now - 2 * DAY); fin(b);
  b.run(`S.prof.lim=['k'];save()`);
  assert.equal(b.J('lgDayLocked(0)'), 'done');
  assert.equal(b.J('lgDayLocked(1)'), false, 'done only in the 1st pass');
  assert.equal(b.J('lgDayLocked(3)'), 'unsure', 'out of order before day 1, untagged');
  const H = HP(b); b.run('lgFixAll()'); assert.equal(HP(b), H);
});

test('tf2.3.3 repeat on the new app (repeatBlock stores passAt) → 1st pass upcoming, out-of-order day of the 2nd pass done', () => {
  const b = boot({ state: st() });
  assign(b, NEW, now - 300 * DAY);
  const n = b.run('S.program.length');
  for (let i = 0; i < n; i++) hist(b, i, now - 200 * DAY + i * 3600e3, NEW);
  b.run(`S.block.next=${n};repeatBlock(S);S.block.passAt=${now - 4 * DAY};save()`);
  hist(b, 3, now - 3 * DAY, NEW); hist(b, 0, now - 2 * DAY, NEW); fin(b);
  b.run(`S.prof.lim=['k'];save()`);
  assert.equal(b.J('lgDayLocked(1)'), false);
  assert.equal(b.J('lgDayLocked(3)'), 'done');
});
