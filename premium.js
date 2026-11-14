'use strict';
// ===== P-305 / G-005: one access module for Free / Premium =====
// No payments here. Until the Android build (store billing) the gate is OFF: every real user gets everything.
// Demo tier (reviewers/tests only, never shown to normal users): open the app with ?demo=free | ?demo=premium | ?demo=off.
// It lives in localStorage 'gymDemoTier' — NOT in S, so it never touches the user's data, history or sync.
const PREM_CFG={PAYWALL_ENABLED:false};
const PREM_DEMO_KEY='gymDemoTier';
const PREM_BLOCK_DAYS=56; // Free: a new questionnaire program after the block ends (8–12 weeks → shortest, 8)
const PREM_CHART_DAYS=90; // Free: charts for the last 90 days
// One table. 'free' = available in Free, 'premium' = Premium only.
const FEATURES={
 // Auto-weight (P-301)
 autoWeightArrow:'free',     // «пора прибавить ↑ / держи / сбавь ↓», no number
 autoWeightFeel:'free',      // «легко / нормально / тяжело» is always recorded
 autoWeightExact:'premium',  // exact weight and equipment step
 deload:'premium',           // deload week every 6 weeks (+ early deload offer)
 breakReturn:'premium',      // exact return weights after a break
 // Programs
 programQuiz:'free',         // 1 program from the questionnaire, 2–5 days
 programDays6:'premium',     // 6 days per week
 programsAll:'premium',      // all ready-made templates
 programSwitch:'premium',    // switch program at any time (Free: after the block ends)
 customTemplate:'premium',   // own workout template (P-302, not built yet)
 // Charts and records
 charts90:'free', chartsFull:'premium',
 prHistory:'premium',        // PR history / 1RM curves (P-303, not built yet; exercise-card 1RM spark)
 muscleVolume:'premium',     // weekly volume per muscle (P-303, not built yet)
 // Equipment and body
 equipProfile:'free', equipProfiles:'premium',
 bodyWeight:'free', bodyGirths:'premium',
 // Never gated (G-005 §3)
 pain:'free', limitations:'free', painSwap:'free', warmup:'free', cooldown:'free', sync:'free', exportCsv:'free',
 video:'free', library:'free', journal:'free', prevInField:'free', prBanner:'free'
};
const NEVER_GATED=['pain','limitations','painSwap','warmup','cooldown','sync','exportCsv','video','library','journal','prevInField','prBanner','autoWeightArrow','autoWeightFeel','programQuiz','charts90','equipProfile','bodyWeight'];
function demoTier(){try{const v=localStorage.getItem(PREM_DEMO_KEY);return v==='free'||v==='premium'?v:null}catch(e){return null}}
function setDemoTier(v){try{if(v==='free'||v==='premium')localStorage.setItem(PREM_DEMO_KEY,v);else localStorage.removeItem(PREM_DEMO_KEY)}catch(e){}}
function premUrl(q){const m=/[?&]demo=(free|premium|off)\b/.exec(q||'');if(m)setDemoTier(m[1]);return m?m[1]:null}
try{premUrl(typeof location!=='undefined'&&location.search)}catch(e){}
function premTier(){const d=demoTier();if(d)return d;if(!PREM_CFG.PAYWALL_ENABLED)return'premium';
 return typeof S!=='undefined'&&S&&(S.premium||S.ownerPremium)?'premium':'free'}
function isPremium(){return premTier()==='premium'}
function can(f){if(NEVER_GATED.includes(f))return true;if(!(f in FEATURES))return true;return FEATURES[f]==='free'||isPremium()}
const premFree=()=>!isPremium();
// Free: start of the next allowed program = end of the current block
function blockEndsAt(){return S&&S.program&&S.progStart?S.progStart+PREM_BLOCK_DAYS*864e5:0}
function blockEnded(){return Date.now()>=blockEndsAt()}
function chartFrom(){return can('chartsFull')?0:Date.now()-PREM_CHART_DAYS*864e5}
// Never open the paywall in the middle of a workout/set
function paywallAllowed(o){return!!(o&&o.force)||!(typeof S!=='undefined'&&S&&S.active)}
// Natural moments (plateau, deload, after a break, end of block): at most once per 14 days, never during a workout.
function premMoment(kind){if(isPremium()||!paywallAllowed())return false;let t=0;try{t=+localStorage.getItem('gymPwMoment')||0}catch(e){}
 if(Date.now()-t<14*864e5)return false;try{localStorage.setItem('gymPwMoment',String(Date.now()))}catch(e){}
 const R={plateau:'Вес давно не растёт? Premium подскажет точный вес и шаг оборудования.',deload:'Пора разгрузиться. В Premium — разгрузочная неделя каждые 6 недель.',
  break:'С возвращением! В Premium — точный вес после перерыва.',block:'Блок программы завершён. В Premium — все программы и смена в любой момент.'};
 return typeof paywall==='function'&&paywall(R[kind]||'')!==false}
// Free auto-weight: direction only
function awDir(s,lastW){if(!s)return'hold';const n=s.note||'';
 if(/^(inc|cal_up|time_up)$/.test(n))return'up';if(/^(cal_down|miss3|pain|break14|break28|deload_early|time_down)$/.test(n))return'down';
 if(s.weight!=null&&lastW!=null&&+lastW>0){if(+s.weight>+lastW)return'up';if(+s.weight<+lastW)return'down'}return'hold'}
const AW_DIR={up:'Пора прибавить ↑',hold:'Держи вес',down:'Сбавь ↓'};
