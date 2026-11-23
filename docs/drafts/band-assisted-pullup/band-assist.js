'use strict';
// GC-162 task 3 — DRAFT, NOT LOADED BY THE APP (not in index.html, not in sw.js precache). Home D2 stays off.
// Band-assisted pull-up: progression = LESS help. Band levels as in PR_EQUIP.bands (1 = lightest … 5 = most help);
// the user's own bands come from the equipment profile. Activation needs: the clip in storage + movekit-sign whitelist,
// GPT + owner approval of the method, then wiring into progress.js (PR_CLS / PR_DOWN.b) and cards.js.

const BAND_CARD = {
  id: 'band-assisted-pullup',
  group: 'Спина',
  place: 'b',                     // home with a pull-up bar (b_bar) — the bar is required
  equipment: ['pullup-bar', 'loop-band'],
  clip: 'band-assisted-pull-up.mp4',
  name: { ru: 'Подтягивания с резинкой', en: 'Band-assisted pull-ups', lv: 'Pievilkšanās ar gumiju' },
  how: {
    ru: 'Закрепи петлю резинки на перекладине, поставь в неё колено или стопу. Хват на ширине плеч, руки прямые. Сведи лопатки вниз и подтянись, пока подбородок не окажется над перекладиной. Опускайся под контролем 2–3 секунды до прямых рук. Без рывков и раскачки.',
    en: 'Loop the band over the bar and place a knee or foot in it. Shoulder-width grip, arms straight. Pull your shoulder blades down and pull up until your chin is over the bar. Lower under control for 2–3 seconds to straight arms. No jerking or swinging.',
    // LV: needs the linguist check (Grok was unavailable on 23.11.2026)
    lv: 'Nostiprini gumijas cilpu pie stieņa un ieliec tajā celi vai pēdu. Satver stieni plecu platumā, rokas taisnas. Velc lāpstiņas uz leju un pievelcies, līdz zods ir virs stieņa. Nolaidies kontrolēti 2–3 sekundēs līdz taisnām rokām. Bez rāvieniem un šūpošanās.'
  },
  needBand: {
    ru: 'Укажи уровень резинки (1 — самая лёгкая, 5 — самая сильная) — без него прогрессию не посчитать',
    en: 'Enter the band level (1 = lightest, 5 = strongest) — without it, progression can’t be calculated',
    lv: 'Ieraksti gumijas līmeni (1 — vieglākā, 5 — stiprākā) — bez tā progresiju nevar aprēķināt'
  }
};

// inp: {weight: band level used (1–5) | null, results:[reps…], range:[lo,hi], sets_plan, state:{success,miss,cut},
//       calibration?, from?: 'pull'|'chin' (where the user came from, default pull), req?: sessions at the top (PR_SESS = 2)}
// bands: levels the user owns, e.g. [1,3,5]. Returns {id, weight, sets, note, state}.
function bandAssistNext(inp, bands) {
  const st = Object.assign({}, inp.state || {});
  const lo = inp.range[0], hi = inp.range[1], plan = inp.sets_plan || 3, req = inp.req || 2;
  const own = [...new Set((bands || []).map(Number).filter(x => x >= 1 && x <= 5))].sort((a, b) => a - b);
  const w = +inp.weight;
  const out = { id: 'band-assisted-pullup', weight: w > 0 ? w : null, sets: plan, note: 'same', state: st };
  if (!(w > 0) || !own.length) { out.note = 'need_w'; out.weight = null; return out; }
  const res = (inp.results || []).map(Number);
  const lighter = own.filter(x => x < w).pop();          // less help
  const heavier = own.find(x => x > w);                   // more help
  const need = st.cut ? Math.max(2, plan - 1) : plan;
  const allTop = res.length >= need && res.every(x => x >= hi);
  const miss = res.some(x => x < lo);
  const toLighter = () => {
    st.success = 0; st.miss = 0; delete st.cut;
    if (lighter != null) { out.weight = lighter; out.note = 'inc'; }
    else { out.id = inp.from === 'chin' ? 'chin' : 'pull'; out.weight = null; out.note = 'ladder'; }
  };
  if (inp.calibration) {
    if (allTop) { toLighter(); return out; }
    if (res.length && res.every(x => x < lo)) { st.success = 0; if (heavier != null) { out.weight = heavier; out.note = 'cal_down'; } else out.note = 'same'; return out; }
    out.note = 'same'; return out;
  }
  if (miss) {
    st.success = 0; st.miss = (st.miss | 0) + 1;
    if (st.miss >= 3) { st.miss = 0; delete st.cut; out.note = 'miss3'; if (heavier != null) out.weight = heavier; }
    else if (st.miss === 2) { st.cut = 1; out.sets = Math.max(2, plan - 1); out.note = 'miss2'; }
    else out.note = 'miss1';
    return out;
  }
  delete st.cut; st.miss = 0;
  if (!allTop) { st.success = 0; out.note = 'same'; return out; }
  st.success = (st.success | 0) + 1;
  if (st.success < req) { out.note = 'same'; return out; }
  toLighter();
  return out;
}

if (typeof module !== 'undefined' && module.exports) module.exports = { BAND_CARD, bandAssistNext };
