'use strict';
// Авторские шаблоны: пол не меняет план; приоритет и ограничения применяются поверх PROG.
const LENS = PROG.L;
const IM = {}; PROG.I.forEach((id, i) => IM[id] = i);
const UNI = new Set(PROG.U.map(i => PROG.I[i]));
const HINGE = new Set(PROG.G.map(i => PROG.I[i]));
const BRIDGE = PROG.B.map(i => PROG.I[i]);
function lenIdx(len) { len = +len || 60; let i = 0; for (let k = 0; k < LENS.length; k++) if (LENS[k] <= len) i = k; return i; }
function tKey(a) { return a.goal + '_' + a.level + '_' + a.days + '_' + a.place; }
function setsAt(n, i) { return +('00000' + n).slice(-5)[i]; }
function metaOf(id) { return (typeof META !== 'undefined' && META[id]) || ''; }
function placeOk(id, place, block) {
  if (block && (id === 'bwsq' || String(id).startsWith('w_'))) return true;
  const m = metaOf(id); if (!m) return true;
  return m.split('|')[0].includes(place);
}
function riskOk(id, lim) {
  const m = metaOf(id); if (!m) return true;
  const r = (m.split('|')[1] || '');
  return !(lim || []).some(l => r.includes(l));
}
function levelOk(id, level) {
  const need = Math.max((typeof EX_MIN !== 'undefined' && EX_MIN[id]) || 0, PROG.X[id] || 0);
  const lv = (typeof LVRANK !== 'undefined' && LVRANK[level] != null) ? LVRANK[level] : 1;
  return lv >= need;
}
function kneeCardio(id, lim) { return (lim || []).includes('k') && PROG.K.indexOf(id) >= 0; }
// v1.2c: в программу попадают только упражнения с роликом MoveKit; без ролика — только быстрая ходьба и дыхание лёжа.
const NO_CLIP_OK = new Set(['walk-brisk', 'cd_breath']);
function clipOk(id) { return typeof movekitFile !== 'function' || NO_CLIP_OK.has(id) || !!movekitFile(id); }
function workOk(id, a, used) {
  if (!id || (used && used.has(id))) return false;
  if (!clipOk(id)) return false;
  if (typeof LIB_ONLY !== 'undefined' && LIB_ONLY.has(id)) return false;
  if (typeof FINISHER !== 'undefined' && FINISHER.has(id)) return false;
  if (typeof GEAR !== 'undefined' && GEAR[id] && !((a.gear) || []).includes(GEAR[id])) return false;
  if (typeof placeAutoOk === 'function' && !placeAutoOk(id, a.place)) return false;
  if (!placeOk(id, a.place, false) || !levelOk(id, a.level) || !riskOk(id, a.lim) || kneeCardio(id, a.lim)) return false;
  return true;
}
function altAfter(exId) {
  const raw = (typeof ALT !== 'undefined' && ALT[exId]) || [];
  const out = []; const seen = new Set([exId]);
  for (const id of raw) { if (seen.has(id)) continue; seen.add(id); out.push(id); }
  if (!raw.length && typeof ALT !== 'undefined' && !ALT[exId]) {
    for (const fam of PROG.F) {
      const names = fam.map(i => PROG.I[i]);
      if (names.indexOf(exId) < 0) continue;
      for (const id of names) if (!seen.has(id)) { seen.add(id); out.push(id); }
    }
  }
  return out;
}
function pickWork(exId, a, used, prefer) {
  const cands = [exId];
  const seen = new Set([exId]);
  // D-214: отдельный id для дома / своего веса идёт сразу за прежним (до запасных и замен).
  const pv = typeof placeVariant === 'function' ? placeVariant(exId, a.place) : null;
  if (pv) { seen.add(pv); cands.push(pv); }
  for (const id of (prefer || [])) if (!seen.has(id)) { seen.add(id); cands.push(id); }
  for (const id of altAfter(exId)) if (!seen.has(id)) { seen.add(id); cands.push(id); }
  for (const id of cands) if (workOk(id, a, used)) return id;
  return null;
}
function workSec(it) {
  if (isCardio(it.exId)) return it.max * 60;
  const tid = (typeof PLACE_BASE !== 'undefined' && PLACE_BASE[it.exId]) || it.exId; // время как у упражнения из шаблона тренера
  const mult = PROG.H[tid] || 1;
  const work = it.sec ? mult * (+it.max || 0) : (UNI.has(tid) ? 70 : 40);
  return it.sets * (work + it.rest);
}
function daySeconds(day) { return (day.warmMin + day.coolMin) * 60 + day.items.reduce((s, it) => s + workSec(it), 0); }
function progGlance(a) {
  if (typeof PROG === 'undefined') return null;
  const t = PROG.T[tKey(a)]; if (!t) return null;
  const i = lenIdx(a.len), mn = t[1][i * 3], mx = t[1][i * 3 + 1];
  return { label: mn === mx ? '≈' + mn + ' мин' : '≈' + mn + '–' + mx + ' мин', shorter: !!t[1][i * 3 + 2], advice: t[0] < 0 ? null : PROG.V[t[0]] };
}
function resolveBlock(entry, lim) {
  let id = PROG.I[entry[0]];
  const skip = entry[3] || 0, sub = entry[4], flag = entry[5] || 0;
  if (flag && sub >= 0) { if ((flag & 1) && lim.includes('s')) id = PROG.I[sub]; else if ((flag & 2) && lim.includes('k')) id = PROG.I[sub]; else if ((flag & 4) && lim.includes('p')) id = PROG.I[sub]; }
  if ((skip & 1) && lim.includes('s')) return null;
  if ((skip & 2) && lim.includes('k')) return null;
  if ((skip & 4) && lim.includes('p')) return null;
  return id;
}
function takeBlock(list, maxN, len, lim) {
  const out = [], seen = new Set(), iLen = lenIdx(len);
  for (const e of list) {
    if (e[2] > iLen) continue;
    const id = resolveBlock(e, lim);
    if (!id || seen.has(id)) continue;
    seen.add(id); out.push({ id, dose: PROG.D[e[1]] || '' });
    if (out.length >= maxN) break;
  }
  return out;
}
function pickCardio(id, subs, a, used) {
  return pickWork(id, a, used, (subs || []).map(i => PROG.I[i]));
}
function planFromTemplate(a) {
  if (typeof PROG === 'undefined') return null;
  a = { sex: 'm', level: 'mid', len: 60, place: 'g', prio: [], lim: [], ...a };
  const raw = PROG.T[tKey(a)]; if (!raw) return null;
  const i = lenIdx(a.len), len = LENS[i], lim = a.lim || [];
  const swaps = [];
  const days = raw[2].map(day => {
    let removed = false;
    const used = new Set();
    const kept = [];
    const orig = [];
    let droppedHinge = null;
    day[1].forEach((it, idx) => {
      const n = setsAt(it[3], i);
      const base = { slot: PROG.S[it[1]], role: it[2] ? 'a' : 'c', sets: n, min: it[4], max: it[5], rest: it[6], sec: it[7] ? 1 : 0, acc: !!it[2], exId: PROG.I[it[0]], idx };
      orig.push(base);
      if (!n) { kept.push(null); return; }
      const id = pickWork(base.exId, a, used);
      if (!id) {
        kept.push(null); removed = true;
        if (!droppedHinge && (HINGE.has(base.exId) || base.slot === 'HINGE')) droppedHinge = base;
        return;
      }
      if (id !== base.exId && !(typeof placeVariant === 'function' && placeVariant(base.exId, a.place) === id)) swaps.push(exBy(id).name);
      used.add(id);
      kept.push({ exId: id, sets: n, min: base.min, max: base.max, rest: base.rest, sec: base.sec, acc: base.acc, slot: base.slot, prio: false });
    });
    let items = kept.filter(Boolean);
    if (lim.includes('s') && droppedHinge && !items.some(it => BRIDGE.indexOf(it.exId) >= 0)) {
      const id = pickWork(BRIDGE[0], a, new Set(items.map(it => it.exId)), BRIDGE.slice(1));
      if (id) items.push({ exId: id, sets: droppedHinge.sets, min: droppedHinge.min, max: droppedHinge.max, rest: droppedHinge.rest, sec: droppedHinge.sec, acc: true, slot: 'HINGE', prio: false });
    }
    const warmMin = day[6][i] / 10, coolMin = day[7][i] / 10;
    const draft = { items, warmMin, coolMin };
    if (removed) {
      for (const it of orig) {
        if (it.sets) continue;
        let sets = 0;
        for (let j = i + 1; j < 5 && !sets; j++) sets = setsAt(day[1][it.idx][3], j);
        if (!sets) continue;
        const id = pickWork(it.exId, a, new Set(items.map(x => x.exId)));
        if (!id) continue;
        const add = { exId: id, sets, min: it.min, max: it.max, rest: it.rest, sec: it.sec, acc: it.acc, slot: it.slot, prio: false };
        if (daySeconds({ items: items.concat(add), warmMin, coolMin }) > len * 60) continue;
        items.push(add);
      }
    }
    let cardio = null;
    if (day[2]) {
      const id = pickCardio(PROG.I[day[2][0]], day[2][1], a, new Set(items.map(x => x.exId)));
      const m = day[2][2 + i];
      if (id && m > 0) cardio = { exId: id, sets: 1, min: Math.max(5, m - 5), max: m, rest: 0 };
    }
    const indexOf = {};
    kept.forEach((it, idx) => { if (it) indexOf[idx] = it.exId; });
    const wuRaw = day[3];
    const wuCardioId = pickCardio(PROG.I[wuRaw[0]], wuRaw[1], a, null);
    const wuMin = wuRaw[2][i];
    const wu = {
      min: warmMin,
      cardio: wuCardioId && wuMin > 0 ? { id: wuCardioId, min: wuMin, note: 'лёгкий темп' } : null,
      mob: takeBlock(wuRaw[4], wuRaw[3][i], len, lim),
      ramp: wuRaw[5].filter(r => r[3] <= i && indexOf[r[0]]).map(r => ({ exId: indexOf[r[0]], pct: r[1] < 0 ? null : r[1], reps: r[2] }))
    };
    const cdRaw = day[4];
    const cdCardioId = cdRaw[0] >= 0 ? pickCardio(PROG.I[cdRaw[0]], cdRaw[1], a, null) : null;
    const cdMin = cdRaw[0] >= 0 ? cdRaw[2][i] : 0;
    const cd = {
      cardio: cdCardioId && cdMin > 0 ? { id: cdCardioId, min: cdMin, note: 'лёгкий темп, пульс снижается' } : null,
      note: cdRaw[3] ? 'последние 2–3 мин кардио-блока — в лёгком темпе (это часть заминки)' : '',
      stretch: takeBlock(cdRaw[5], cdRaw[4][i], len, lim)
    };
    if (cardio) items.push(cardio);
    return { name: PROG.N[day[0]], items: items.map(({ exId, sets, min, max, rest, sec }) => sec ? { exId, sets, min, max, rest, sec: 1 } : { exId, sets, min, max, rest }), _build: items, wu, cd, warmMin, coolMin, est: day[5][i] / 10 };
  });
  // Приоритет: +1 подход, и доп. упражнение у первых двух групп.
  const spec = (PROG.R[a.goal] || {})[a.level];
  const prio = a.prio || [];
  if (spec && prio.length) {
    const trained = g => (PROG.SG[g] || []).map(s => PROG.S[s]);
    days.forEach(day => {
      for (const g of prio) {
        const slots = new Set(trained(g));
        if (!day._build.some(it => slots.has(it.slot))) continue;
        day._build.forEach(it => { if (it.slot && slots.has(it.slot) && !isCardio(it.exId)) it.sets++; });
      }
    });
    let extras = 0;
    for (const g of prio) {
      if (extras >= 2) break;
      const slots = new Set(trained(g));
      const pool = ((PROG.P[a.place] || {})[g] || []).map(n => PROG.I[n]);
      const sets = a.level === 'nov' ? spec[0] : spec[0] + 1;
      let added = false;
      days.forEach(day => {
        if (!day._build.some(it => slots.has(it.slot))) return;
        const used = new Set(day._build.map(it => it.exId));
        let id = null;
        for (const c0 of pool) { const cand = (typeof placeVariant === 'function' && placeVariant(c0, a.place)) || c0; if (workOk(cand, a, used)) { id = cand; break; } }
        if (!id) return;
        day._build.push({ exId: id, sets, min: spec[1], max: spec[2], rest: spec[3], acc: true, prio: true, slot: trained(g)[0] || '' });
        added = true;
      });
      if (added) extras++;
    }
    days.forEach(day => {
      const fit = () => daySeconds(day) <= len * 60;
      while (!fit()) {
        let j = -1;
        for (let k = day._build.length - 1; k >= 0; k--) if (day._build[k].acc && !day._build[k].prio && !isCardio(day._build[k].exId)) { j = k; break; }
        if (j >= 0) { day._build.splice(j, 1); continue; }
        const big = day._build.filter(x => !isCardio(x.exId) && x.sets > 2);
        if (big.length) { big.forEach(x => x.sets--); continue; }
        let j2 = -1;
        for (let k = day._build.length - 1; k >= 0; k--) if (day._build[k].prio) { j2 = k; break; }
        if (j2 >= 0) { day._build.splice(j2, 1); continue; }
        break;
      }
      day.est = Math.round(daySeconds(day) / 60 * 10) / 10;
    });
  }
  const glance = progGlance(a);
  const out = days.map(d => ({ name: d.name, items: d._build.map(it => it.sec ? { exId: it.exId, sets: it.sets, min: it.min, max: it.max, rest: it.rest, sec: 1 } : { exId: it.exId, sets: it.sets, min: it.min, max: it.max, rest: it.rest }), wu: d.wu, cd: d.cd, est: d.est }));
  return { days: out, advice: glance.advice, timeLabel: glance.label, shorter: glance.shorter, swaps: [...new Set(swaps)] };
}
function wuRows(wu) {
  const rows = [];
  if (wu.cardio) rows.push({ id: wu.cardio.id, n: exBy(wu.cardio.id).name, d: wu.cardio.min + ' мин', x: wu.cardio.note || '' });
  (wu.mob || []).forEach(m => rows.push({ id: m.id, n: exBy(m.id).name, d: m.dose, x: '' }));
  (wu.ramp || []).forEach(r => rows.push({ id: r.exId, n: 'Подводящий подход: ' + exBy(r.exId).name, d: r.pct == null ? 'Лёгкий подход × ' + r.reps : r.pct + '% × ' + r.reps, x: '' }));
  return rows;
}
function cdRows(cd) {
  const rows = [];
  if (cd.cardio) rows.push({ id: cd.cardio.id, n: exBy(cd.cardio.id).name, d: cd.cardio.min + ' мин', x: cd.cardio.note || '' });
  else if (cd.note) rows.push({ id: '', n: 'Лёгкое кардио', d: '', x: cd.note });
  (cd.stretch || []).forEach(m => rows.push({ id: m.id, n: exBy(m.id).name, d: m.dose, x: '' }));
  return rows;
}
function rowsHTML(rows, chk, attr) {
  return rows.map((it, i) => `<div class="li wu${chk && chk[i] ? ' done' : ''}">${chk ? `<button class="sm ${chk[i] ? 'ok' : ''}" data-${attr}="${i}" aria-label="Готово">✓</button>` : ''}<div class="grow"><div><span>${esc(it.n)}</span></div>${it.x ? `<div class="mut" style="font-size:12px">${esc(it.x)}</div>` : ''}</div>${it.id ? techBtn(it.id) : ''}<span class="mut" style="max-width:42%;text-align:right">${esc(it.d)}</span></div>`).join('');
}
function wuHTML(wu, chk) {
  const rows = wuRows(wu), n = chk ? chk.filter(Boolean).length : 0, all = chk && n === rows.length;
  return `<details class="wud" ${chk ? (all ? '' : 'open') : ''}><summary>🔥 <b>Разминка</b> <span class="mut">${chk ? n + '/' + rows.length + (all ? ' ✓' : '') : '≈ ' + Math.round(wu.min || 0) + ' мин'}</span></summary>${rowsHTML(rows, chk, 'wu')}</details>`;
}
function cdHTML(cd, chk) {
  const rows = cdRows(cd), n = chk ? chk.filter(Boolean).length : 0, all = chk && n === rows.length;
  return `<details class="wud" ${chk && all ? '' : 'open'}><summary>🧊 <b>Заминка</b> <span class="mut">${chk ? n + '/' + rows.length + (all ? ' ✓' : '') : (cd.stretch || []).length + ' упр.'}</span></summary>${rowsHTML(rows, chk, 'cd')}</details>`;
}
