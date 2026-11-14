'use strict';
// ===== P-305c / G-005 v3: one access module (demo 14 days → free diary forever, or subscription) =====
// No payments here. Until Play Billing (Android build) the gate is OFF: every real user gets everything (tier 'open').
// Review modes (this device only, never in user data): ?demo=free | premium | trial | trialend | off.
// Stored in localStorage 'gymDemoTier' — NOT in S, so it never touches the user's data, history or sync.
// ?demo= modes work only when the paywall is off or this is a test build; a production paywall ignores them and drops the stored key.
const PREM_CFG={PAYWALL_ENABLED:false,TEST_BUILD:false,PAYWALL_LAUNCH:null};
// Temporary product name until G-002 is decided.
const PREM_NAME='Мой Зал Premium';
const PREM_DEMO_KEY='gymDemoTier',PREM_SEEN_KEY='gymPwSeen';
const PREM_DAY=864e5,DEMO_DAYS=14,DEMO_WARN_DAYS=2;
// One table. 'free' = free forever (also after the demo), 'sub' = subscription (or the 14-day demo).
const FEATURES={
 // Free forever
 diary:'free',          // own workout: exercises picked from the list (names and groups), logging sets
 prevInField:'free',    // previous weight and reps
 history:'free', library:'free', pain:'free', limitations:'free', painSwap:'free', disclaimer:'free',
 sync:'free', exportCsv:'free', deleteAccount:'free', bodyWeight:'free', equipProfile:'free',
 // Subscription
 programs:'sub',        // trainer programs from the questionnaire (after the demo: last one read-only)
 warmup:'sub', cooldown:'sub',
 autoWeight:'sub', deload:'sub', breakReturn:'sub',
 video:'sub',           // technique videos AND posters (no movekit-sign call without it)
 charts:'sub', prs:'sub', oneRM:'sub', muscleVolume:'sub', girths:'sub'
};
const NEVER_GATED=Object.keys(FEATURES).filter(k=>FEATURES[k]==='free');
const DEMO_MODES=['free','premium','trial','trialend'];
function demoAllowed(){return !PREM_CFG.PAYWALL_ENABLED||!!PREM_CFG.TEST_BUILD}
function clearDemoTier(){try{localStorage.removeItem(PREM_DEMO_KEY)}catch(e){}}
function demoTier(){if(!demoAllowed()){clearDemoTier();return null}try{const v=localStorage.getItem(PREM_DEMO_KEY);return DEMO_MODES.includes(v)?v:null}catch(e){return null}}
function setDemoTier(v){if(!demoAllowed()){clearDemoTier();return}try{if(DEMO_MODES.includes(v))localStorage.setItem(PREM_DEMO_KEY,v);else localStorage.removeItem(PREM_DEMO_KEY);
 localStorage.removeItem(PREM_SEEN_KEY)}catch(e){}}
function premUrl(q){const m=/[?&]demo=(free|premium|trialend|trial|off)\b/.exec(q||'');if(!m)return null;if(!demoAllowed()){clearDemoTier();return null}setDemoTier(m[1]);return m[1]}
try{if(demoAllowed())premUrl(typeof location!=='undefined'&&location.search);else clearDemoTier()}catch(e){}
// ---- Demo start: the FIRST COMPLETED workout. Kept on the account (S.demoStart is synced in user_state);
// merges always take the earliest date, never a later one. Guests keep it locally.
// Effective start is max(stored first workout, PAYWALL_LAUNCH) so existing users still get a full 14 days from launch.
// Do not rewrite S.demoStart or history — clamp only when computing access. null/unset PAYWALL_LAUNCH = not launched.
const premPos=v=>typeof v==='number'&&isFinite(v)&&v>0;
function premMergeStart(a,b){a=premPos(a)?a:0;b=premPos(b)?b:0;return a&&b?Math.min(a,b):(a||b||0)}
function premFirstWorkout(){let t=0;((typeof S!=='undefined'&&S&&S.workouts)||[]).forEach(w=>{t=premMergeStart(t,w&&(w.end||w.start))});return t}
function premLaunchAt(){const L=PREM_CFG.PAYWALL_LAUNCH;if(L==null||L==='')return 0;const t=typeof L==='number'?L:Date.parse(L);return premPos(t)?t:0}
function demoStartAt(now){const d=demoTier();now=now||Date.now();
 if(d==='trial')return now-3600e3;                               // review: day 1
 if(d==='trialend')return now-(DEMO_DAYS-DEMO_WARN_DAYS)*PREM_DAY; // review: 2 days left
 const raw=premMergeStart(typeof S!=='undefined'&&S?S.demoStart:0,premFirstWorkout()),launch=premLaunchAt();
 return raw&&launch?Math.max(raw,launch):raw}
// Called when a workout is saved. Only ever moves the date earlier.
function premMarkDemo(W){if(typeof S==='undefined'||!S)return;const t=premMergeStart(premMergeStart(S.demoStart,premFirstWorkout()),W&&(W.end||W.start)||Date.now());if(t!==S.demoStart)S.demoStart=t}
// ---- Access state: 'open' (gate off), 'premium' (paid/owner), 'trial' (demo running or not started), 'free' (after demo)
function premState(now){now=now||Date.now();const d=demoTier();
 if(d==='premium')return{tier:'premium'};if(d==='free')return{tier:'free',start:now-30*PREM_DAY,left:0};
 if(!d){if(!PREM_CFG.PAYWALL_ENABLED)return{tier:'open'};if(typeof S!=='undefined'&&S&&(S.premium||S.ownerPremium))return{tier:'premium'}}
 const st=demoStartAt(now);if(!st)return{tier:'trial',pre:true,left:DEMO_DAYS};
 const end=st+DEMO_DAYS*PREM_DAY;return end>now?{tier:'trial',start:st,end,left:Math.ceil((end-now)/PREM_DAY)}:{tier:'free',start:st,end,left:0}}
function premTier(){return premState().tier}
function isPremium(){return premTier()!=='free'} // full access (open, paid or demo)
function can(f){if(NEVER_GATED.includes(f))return true;if(!(f in FEATURES))return true;return isPremium()}
const premFree=()=>!isPremium();
// Never open the paywall in the middle of a workout/set
function paywallAllowed(){return!(typeof S!=='undefined'&&S&&S.active)}
// ---- Paywall moments (demo only; each at most once): first weight increase suggestion, after the 3rd demo workout,
// 2 days before the demo ends. After the demo: only when the user opens a paid feature (lock buttons).
function premSeen(){try{return JSON.parse(localStorage.getItem(PREM_SEEN_KEY)||'{}')||{}}catch(e){return{}}}
function premSee(k){const s=premSeen();s[k]=Date.now();try{localStorage.setItem(PREM_SEEN_KEY,JSON.stringify(s))}catch(e){}}
function premFlagInc(){if(premTier()!=='trial')return;const s=premSeen();if(!s.inc&&!s.incPending){s.incPending=1;try{localStorage.setItem(PREM_SEEN_KEY,JSON.stringify(s))}catch(e){}}}
function premCountDemo(st){return((typeof S!=='undefined'&&S&&S.workouts)||[]).filter(w=>(w.end||w.start)>=st).length}
function premNextMoment(now){const p=premState(now);if(p.tier!=='trial'||p.pre)return null;const s=premSeen();
 if(p.left<=DEMO_WARN_DAYS&&!s.ending)return'ending';
 if(!s.third&&premCountDemo(p.start)>=3)return'third';
 if(s.incPending&&!s.inc)return'inc';return null}
const PREM_MOMENT={inc:'Приложение предложило прибавить вес. Точный авто-вес остаётся в подписке после 14 дней демо.',
 third:'Уже 3 тренировки! Программа тренера, авто-вес и видео техники остаются в подписке после 14 дней демо.',
 ending:'Демо заканчивается через 2 дня. Дальше — бесплатный дневник или подписка.'};
function premMoment(now){if(!paywallAllowed())return false;const k=premNextMoment(now);if(!k)return false;premSee(k);
 return typeof paywall==='function'&&paywall(PREM_MOMENT[k])!==false}
// TODO(Android): when Play Billing is connected, take subscription status from the server (RevenueCat or Play Billing), not from S.premium / S.ownerPremium.
