'use strict';
// GC-162 / GC-163-03 — DRAFT, NOT LOADED BY THE APP (not in index.html, not in sw.js precache). Home D2 stays off.
// Band-assisted pull-up: progression = LESS help. Band levels as in PR_EQUIP.bands (1 = lightest … 5 = most help);
// only the user's own bands (equipment profile) are used. Activation needs: the clip in storage + movekit-sign whitelist,
// a human check of the clip against the technique, the LV linguist check, GPT + owner approval, then wiring into
// progress.js (PR_CLS / PR_DOWN.b / AW_P_CAUTION), cards.js and place.js.

const BAND_CARD = {
  id: 'band-assisted-pullup',
  group: 'Спина',
  place: 'b',                     // home with a pull-up bar (b_bar) — the bar is required
  equipment: ['pullup-bar', 'loop-band'],
  clip: 'band-assisted-pull-up.mp4',
  shoulderCaution: true,          // same technique hint as pull / chin / gravitron (AW_P_CAUTION, v160)
  name: { ru: 'Подтягивания с резинкой', en: 'Band-assisted pull-ups', lv: 'Pievilkšanās ar gumiju' },
  how: {
    ru: 'Закрепи петлю резинки на перекладине, поставь в неё колено или стопу. Хват на ширине плеч, руки прямые. Сведи лопатки вниз и подтянись, пока подбородок не окажется над перекладиной. Опускайся под контролем 2–3 секунды до прямых рук. Без рывков и раскачки.',
    en: 'Loop the band over the bar and place a knee or foot in it. Shoulder-width grip, arms straight. Pull your shoulder blades down and pull up until your chin is over the bar. Lower under control for 2–3 seconds to straight arms. No jerking or swinging.',
    // LV: needs the linguist check (Grok was unavailable on 23.11.2026)
    lv: 'Nostiprini gumijas cilpu pie stieņa un ieliec tajā celi vai pēdu. Satver stieni plecu platumā, rokas taisnas. Velc lāpstiņas uz leju un pievelcies, līdz zods ir virs stieņa. Nolaidies kontrolēti 2–3 sekundēs līdz taisnām rokām. Bez rāvieniem un šūpošanās.'
  },
  // GC-163-03 p.10: anchoring the loop band safely
  safety: {
    ru: 'Перед тренировкой проверь резинку: без надрывов, трещин и потёртостей. Закрепи петлю на перекладине «удавкой» — протяни один конец через другой и затяни, — убедись, что она не съезжает. Ставь колено или стопу в петлю со стула или устойчивой опоры, не прыгай. После подхода опустись до прямых рук и выйди из петли, держась за перекладину. Повреждённую резинку замени.',
    en: 'Before training, check the band: no nicks, cracks or worn spots. Anchor the loop on the bar with a girth hitch — pass one end through the other and pull tight — and make sure it does not slide. Step into the loop from a chair or other stable support, do not jump. After the set, lower to straight arms and step out of the loop while holding the bar. Replace a damaged band.',
    lv: 'Pirms treniņa pārbaudi gumiju: bez iegriezumiem, plaisām un nodilumiem. Nostiprini cilpu pie stieņa ar cilpas mezglu — izver vienu galu caur otru un savelc — un pārliecinies, ka tā neslīd. Ieliec celi vai pēdu cilpā no krēsla vai stabila atbalsta, nelec. Pēc piegājiena nolaidies līdz taisnām rokām un izkāp no cilpas, turoties pie stieņa. Bojātu gumiju nomaini.'
  },
  needBand: {
    ru: 'Укажи уровень резинки (1 — самая лёгкая, 5 — самая сильная) — без него прогрессию не посчитать',
    en: 'Enter the band level (1 = lightest, 5 = strongest) — without it, progression can’t be calculated',
    lv: 'Ieraksti gumijas līmeni (1 — vieglākā, 5 — stiprākā) — bez tā progresiju nevar aprēķināt'
  },
  notOwned: {
    ru: 'Такой резинки нет в твоём оборудовании — выбери уровень из профиля оборудования',
    en: 'This band is not in your equipment — pick a level from your equipment profile',
    lv: 'Šādas gumijas nav tavā aprīkojumā — izvēlies līmeni no aprīkojuma profila'
  },
  testPull: {
    ru: 'Проверка: в начале тренировки сделай один подход обычных подтягиваний без резинки и запиши повторы',
    en: 'Test: at the start of the workout, do one set of regular pull-ups without the band and log the reps',
    lv: 'Pārbaude: treniņa sākumā izpildi vienu piegājienu parastās pievilkšanās bez gumijas un ieraksti atkārtojumus'
  }
};

// inp: {weight: band level used (1–5) | null, results:[reps…], range:[lo,hi], sets_plan, state:{success,miss,cut,test},
//       calibration?, from?: 'pull'|'chin' (where the user came from, default pull), req?: sessions at the top (PR_SESS = 2),
//       test_reps?: reps of the unassisted test set (only when the previous note was test_pull), lim?: ['p', …]}
// bands: levels the user owns, e.g. [1,3,5]. Returns {id, weight, sets, note, state, caution?, down?, reason?}.
// The input state object is never changed; the pull / chin entries of S.pg are not touched by this function.
function bandAssistNext(inp, bands) {
  const st = Object.assign({}, inp.state || {});
  const lo = inp.range[0], hi = inp.range[1], plan = inp.sets_plan || 3, req = inp.req || 2;
  const own = [...new Set((bands || []).map(Number).filter(x => x >= 1 && x <= 5 && Number.isInteger(x)))].sort((a, b) => a - b);
  const w = +inp.weight;
  const from = inp.from === 'chin' ? 'chin' : 'pull';
  const out = { id: 'band-assisted-pullup', weight: w > 0 ? w : null, sets: plan, note: 'same', state: st };
  if (Array.isArray(inp.lim) && inp.lim.includes('p')) out.caution = 'p';   // p.9: shoulder hint, the exercise is allowed (decision C)
  // p.1: the level must be one of the user's own bands
  if (!(w > 0) || !own.length) { out.note = 'need_w'; out.weight = null; return out; }
  if (!own.includes(w)) { out.note = 'need_w'; out.weight = null; out.reason = 'not_owned'; return out; }
  const res = (inp.results || []).map(Number).filter(x => isFinite(x));
  if (!res.length) { out.note = 'same'; return out; }   // nothing logged → nothing changes
  const lighter = own.filter(x => x < w).pop();          // less help
  const heavier = own.find(x => x > w);                   // more help
  // p.3/p.4: a separate unassisted test before leaving the band
  if (st.test && inp.test_reps != null && inp.test_reps !== '') {   // no test logged → the request stays (test_pull again below)
    delete st.test;
    const t = +inp.test_reps;
    if (isFinite(t) && t >= lo) { st.success = 0; st.miss = 0; delete st.cut; out.id = from; out.weight = null; out.note = 'ladder'; return out; }
    st.success = 0; out.note = 'test_fail';   // stay on the lightest band, test again after 2 more top sessions
  } else if (st.test) { out.note = 'test_pull'; return out; }
  const need = st.cut ? Math.max(2, plan - 1) : plan;
  const allTop = res.length >= need && res.every(x => x >= hi);
  const miss = res.some(x => x < lo);   // p.5: zero reps are a miss like any rep below the range
  const toLighter = () => {
    st.success = 0; st.miss = 0; delete st.cut;
    if (lighter != null) { out.weight = lighter; out.note = 'inc'; }
    else { st.test = 1; out.note = 'test_pull'; }       // lightest band mastered → ask for the unassisted test first
  };
  if (inp.calibration) {
    // p.7: calibration never makes it harder at once — a top result counts as the first of the two sessions
    if (allTop) { st.success = 1; st.miss = 0; out.note = 'cal_ok'; return out; }
    if (res.every(x => x < lo)) { st.success = 0; if (heavier != null) { out.weight = heavier; out.note = 'cal_down'; } else { out.note = 'cal_down'; out.down = 'scap-pullup'; } return out; }
    out.note = 'same'; return out;
  }
  if (miss) {
    st.success = 0; st.miss = (st.miss | 0) + 1;
    // p.6: three failed sessions in a row → stronger band; on the strongest own band → suggest the easier home step
    if (st.miss >= 3) { st.miss = 0; delete st.cut; out.note = 'miss3'; if (heavier != null) out.weight = heavier; else out.down = 'scap-pullup'; }
    else if (st.miss === 2) { st.cut = 1; out.sets = Math.max(2, plan - 1); out.note = 'miss2'; }
    else out.note = 'miss1';
    return out;
  }
  delete st.cut; st.miss = 0;
  if (!allTop) { st.success = 0; if (out.note !== 'test_fail') out.note = 'same'; return out; }
  st.success = (st.success | 0) + 1;
  if (st.success < req) { if (out.note !== 'test_fail') out.note = 'same'; return out; }
  toLighter();
  return out;
}

if (typeof module !== 'undefined' && module.exports) module.exports = { BAND_CARD, bandAssistNext };
