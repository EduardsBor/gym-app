'use strict';
// P-301: auto-weight. Pure progression logic from the trainer's progression-rules.json (C-103 v2, D-217b ACSM v1.3:
// 2 sessions in a row on every level, step upper +2 % / lower +5 % (min one equipment step), big jump > 10 % with a grace session,
// pain = no progression + swap offer, home band: reps -> tempo -> pause -> next band).
// No DOM, no storage: everything comes in through arguments. Used by autow.js in the app and by test/progress.test.js.
// Ids in PR_CLS are trainer ids; app ids renamed by LEGACY_TO (app.js) are resolved through prCls().
const PR_EQ={B:'barbell',D:'dumbbell',M:'machine',C:'cable',K:'kettlebell',R:'band',A:'assisted',W:'bodyweight',T:'time'};
const PR_REG={u:'upper',l:'lower',c:'core'};
// id: equipment, region, unilateral, hard bodyweight, risk letters (limit_rules.forbidden)
const PR_CLS={'assisted-pullup':'Au01','band-pulldown':'Ru00','bc':'Bu00','bd':'Wu00p','bdog':'Wc00','bp':'Bu00p','bpl':'Tc10','bss':'Dl10k','bwsq':'Wl00k','cable-crunch':'Cc00','cable-overhead-extension':'Cu00','calf':'Ml00','calf-bw':'Wl00','calf-db':'Dl00','cc':'Cu00','cgb':'Bu00p','chest-supported-2db':'Du00','chin':'Wu01','concentration-curl':'Du10','cr':'Mu00','cru':'Wc00','dbc':'Du00','dbp':'Du00','dbr':'Du10','dbug':'Wc00','dead-hang':'Tu00p','decline-db-press':'Du00','dip':'Wu01p','dl':'Bu00s','dpu':'Wu00','dsp':'Du00p','fly':'Du00p','fp':'Cu00','fsq':'Bl00k','gsq':'Dl00k','hack-squat':'Ml00k','hanging-knee-raise':'Wc01','hc':'Du00','hip-abduction':'Ml00','hlr':'Wc01','ht':'Bl00','ht-bw':'Wl00','ht-db':'Dl00','hyp':'Wu00s','ibp':'Bu00p','idb':'Du00','incline-db-curl':'Du00','incline-db-fly':'Du00p','inv':'Wu00','lat':'Cu00','lc':'Ml00','lc-seated':'Ml00','le':'Ml00k','lp':'Ml00k','lr':'Du00','lun':'Dl10k','mch':'Mu00','mch-incline':'Mu00p','meadows-row':'Bu00s','mk-band-row':'Ru00','mk-rkc-plank':'Tc00s','nlc':'Wl01k','ohp':'Bu00sp','ote':'Du00p','pc':'Bu00','pec-deck':'Mu00','pendlay-row':'Bu00s','pl':'Tc00','ppu':'Wu00p','pu':'Wu00','pull':'Wu01','rdl':'Bl00s','rdl-band':'Rl00s','rdl-db':'Dl00s','rdl-kb':'Kl00s','reverse-hyper':'Ml00s','reverse-lunge':'Wl10k','reverse-lunge-db':'Dl10k','reverse-pec-deck':'Mu00','rfly':'Du00','row':'Bu00s','scap-pullup':'Wu00','seated-calf':'Ml00','sglb':'Wl10','shr':'Du00','single-arm-cable-lateral':'Cu10','single-leg-press':'Ml10k','skull':'Bu00p','skull-db':'Du00p','sl-rdl':'Dl10s','smith-bench':'Bu00','smith-calf':'Bl00','smith-close-grip':'Bu00p','smith-incline-bench':'Bu00p','smith-row':'Bu00s','smith-seated-press':'Bu00p','smith-shrug':'Bu00','smith-squat':'Bl00sk','sq':'Bl00sk','standing-db-press':'Du00p','step':'Dl10','step-bw':'Wl10','straight-arm-pulldown':'Cu00','suitcase-carry':'Dc00','tbar-row':'Bu00s','tibialis-raise':'Wl00','tpd':'Cu00','ur':'Bu00p','yr':'Wu00',
 // review-nov-2 (v155): home b_nobar exercises of the pilot programs (were without a class → no RIR line, default upper bodyweight).
 // towel-row: horizontal pull, bodyweight, difficulty = body angle. backpack-row: the load is the backpack itself (kg) → steps like
 // a free weight (next available kg), hinge → s as in META. towel-leg-curl: knee flexion (hamstrings) → region lower, so a knee
 // limitation adds RIR +1 and asks 2 sessions; META risk letters unchanged (owner question 8). towel-iso-curl: logged in seconds
 // (5–10 s holds) → time class. superman: spinal erectors → core, s as in META.
 'towel-row':'Wu00','backpack-row':'Du00s','towel-leg-curl':'Wl00','towel-iso-curl':'Tu00','superman':'Wc00s'};
// Highest modifier step per bodyweight exercise (index in PR_MODS: 1 tempo, 2 pause). Without an entry: full ladder incl. the backpack.
// towel-row: a backpack on a towel doorframe row adds nothing safe (body angle is the real progression); towel-leg-curl: no backpack
// on the hips, and with a knee limitation no automatic step above the rep range at all; superman: a pause «at the bottom» and a load
// on the lower back do not fit → tempo only.
const PR_MOD_CAP={'towel-row':2,'towel-leg-curl':2,'superman':1};
const PR_MOD_CAP_LIM={'towel-leg-curl':{k:0}};
function prModCap(id,fl){let cap=PR_MOD_CAP[id];const L=PR_MOD_CAP_LIM[id];if(L)(fl||[]).forEach(f=>{if(L[f]!=null)cap=Math.min(cap==null?3:cap,L[f])});return cap}
// Default equipment profile (available_weights). The user can change it in «Моё оборудование».
const PR_EQUIP={bar:20,plate:2.5,db:[1,2,3,4,5,6,7,8,9,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50],machine:5,cable:2.5,
 kb:[4,6,8,10,12,14,16,20,24,28,32,36,40,48],bands:[1,2,3,4,5],assist:5};
const PR_RIR={nov:{c:[2,3],a:[2,3]},mid:{c:[2,3],a:[1,3]},adv:{c:[2,3],a:[0,2]}};
const PR_SESS={nov:2,mid:2,adv:2};
const PR_PCT={upper:0.02,lower:0.05,core:0.02},PR_BIG=0.10;
// Bodyweight ladders: from -> {to, places allowed (null = any), needs}
const PR_LADDER={'ht-bw':{to:'sglb'},'assisted-pullup':{to:'pull'},'scap-pullup':{to:'pull',pl:'gb'},'inv':{to:'pull',pl:'gb'},
 'dbug':{to:'hanging-knee-raise',pl:'gb',hang:30},'hanging-knee-raise':{to:'hlr'},'pl':{to:'mk-rkc-plank'}};
// review-nov-2 task 2 (v155, prepared, OFF until the owner decides questions 2–4): pull / chin below the lower bound of the range in
// every set (calibration, or the 2nd miss in a row) → offer ONE easier step that already has a card and a clip for the place:
// gym → assisted-pullup (gravitron); home with a bar → scap-pullup. Never the gravitron at home. The way back is PR_LADDER
// (assisted-pullup / scap-pullup → pull). Only a suggestion (out.down): the user switches with a button, history stays by exId.
const PR_DOWN={pull:{g:'assisted-pullup',b:'scap-pullup'},chin:{g:'assisted-pullup',b:'scap-pullup'}};
// v159: ON for the gym — Eduards 23.11 («Включить в зале», decision A); home stays off on its own by PR_DOWN_PLACE.
let PR_DOWN_ON=true;
// closeout (v157): per place. Gym only (owner decision A); home with a bar stays off until negative pull-ups have a card and a clip
// (decision B: scap pull-ups → pull-ups is too big a step, the user would swing back and forth).
const PR_DOWN_PLACE={g:true,b:false};
function prDownStep(id,place,lim){if(!PR_DOWN_ON||!PR_DOWN_PLACE[place])return null;const D=PR_DOWN[id];const to=D&&D[place];return to&&!prForbidden(to,lim)?to:null}
const PR_TIME={pl:[20,45],bpl:[20,40],'mk-rkc-plank':[10,20]};
const PR_TSTEP={pl:5,bpl:5,'mk-rkc-plank':2,'dead-hang':5,'towel-iso-curl':1};
const PR_PLANK_CAP=60;
// Modifier ladder: 1 tempo 3–4 s down, 2 pause 2 s at the bottom, 3 backpack +5 kg, 4+ backpack +2.5 kg per step.
const PR_MODS=['','tempo','pause','load'];
const PR_FEEL={easy:4,ok:2,hard:0,'легко':4,'нормально':2,'тяжело':0};
const PR_EPS=1e-6,pr2=x=>Math.round(x*100)/100;

function prAlias(id){if(PR_CLS[id])return id;if(typeof LEGACY_TO!=='undefined'){for(const k in LEGACY_TO)if(LEGACY_TO[k]===id&&PR_CLS[k])return k}return null}
function prCls(id){const k=prAlias(id);if(!k)return null;const s=PR_CLS[k];
 return{id:k,eq:PR_EQ[s[0]],region:PR_REG[s[1]],uni:s[2]==='1',hard:s[3]==='1',risk:s.slice(4)}}
// Risk flags of the user that apply to this exercise's zone (risk_flags.applies)
function prFlags(c,lim){if(!c)return[];return(lim||[]).filter(f=>f==='s'?(c.region==='core'||(c.region==='lower'&&/^(barbell|dumbbell|kettlebell)$/.test(c.eq))):
 f==='k'?c.region==='lower':f==='p'?c.region==='upper':false)}
function prEquip(e){e=Object.assign({},PR_EQUIP,e||{});const list=a=>[...new Set((a||[]).map(Number).filter(x=>x>0))].sort((a,b)=>a-b);
 e.db=list(e.db);e.kb=list(e.kb);e.bands=list(e.bands);if(!e.db.length)e.db=PR_EQUIP.db.slice();if(!e.kb.length)e.kb=PR_EQUIP.kb.slice();if(!e.bands.length)e.bands=[1];
 for(const k of['bar','plate','machine','cable','assist'])if(!(+e[k]>0))e[k]=PR_EQUIP[k];return e}
// Available weights: list for dumbbells/kettlebells/bands, generated grid for stacks and barbell
function prGrid(eq,e){if(eq==='dumbbell')return e.db;if(eq==='kettlebell')return e.kb;if(eq==='band')return e.bands;
 const g=(min,st,max)=>{const L=[];for(let x=min;x<=max+PR_EPS;x+=st)L.push(pr2(x));return L};
 if(eq==='barbell')return g(e.bar,e.plate,500);if(eq==='machine')return g(e.machine,e.machine,400);if(eq==='cable')return g(e.cable,e.cable,300);
 if(eq==='assisted')return g(0,e.assist,150);return null}
// rounding.up: smallest available >= max(w + one equipment step, w × (1 + 2 % upper / 5 % lower)); flags (minimal) = one step only.
// null = nothing heavier (no_heavier)
function prUp(w,c,e,minimal){const L=prGrid(c.eq,e);if(!L)return null;
 const st=c.eq==='barbell'?e.plate:c.eq==='machine'?e.machine:c.eq==='cable'?e.cable:0;
 const t=Math.max(w+st,minimal?0:w*(1+(PR_PCT[c.region]||0.02)));
 const r=L.find(x=>x>w+PR_EPS&&x>=t-PR_EPS);return r==null?null:r}
// rounding.down: largest available <= w*f; equal to w -> next one down
function prDown(w,f,c,e){const L=prGrid(c.eq,e);if(!L||!(w>0))return w;const t=w*f;let r=null;for(const x of L)if(x<=t+PR_EPS)r=x;
 if(r!=null&&Math.abs(r-w)<PR_EPS){const lo=L.filter(x=>x<w-PR_EPS);r=lo.length?lo[lo.length-1]:null}
 return r==null?(L[0]<w?L[0]:w):r}
// tech-fix-1 UI RIR: tgt = rir_target of the block / phase {c:[lo,hi],a:[lo,hi]}; never below the floor of the user's level.
const PR_RIR_FLOOR={nov:2,mid:1,adv:0};
function prRir(level,role,flags,plus,tgt){const k=role==='a'?'a':'c',lt=(PR_RIR[level]||PR_RIR.mid)[k];
 const tt=tgt&&Array.isArray(tgt[k])&&tgt[k].length===2?tgt[k]:null;
 let r=tt?(()=>{const f=PR_RIR_FLOOR[level]!=null?PR_RIR_FLOOR[level]:1,lo=Math.max(+tt[0]|0,f);return[lo,Math.max(+tt[1]|0,lo)]})():lt.slice();
 if(flags&&flags.length)r=[Math.max(2,r[0]+1),r[1]+1];if(plus)r=[r[0]+plus,r[1]+plus];return r}
function prForbidden(to,lim){const c=prCls(to);return!!(c&&c.risk&&(lim||[]).some(f=>c.risk.includes(f)))}

// Main entry. Input as in progression-rules.json tests:
// {id, level, range:[min,max], sets_plan, weight, results (array | {L,R}), rir?, state?, flags?, ctx?, target?,
//  role?('c'|'a'), calibration?, pain?, place?, hang?(best dead-hang sec)}
// Returns {id, weight, sets, target, rir, state, mod, note}; note codes: inc, same, miss1, miss2, miss3, cal_up, cal_down,
// ladder, no_heavier, pain, break14, break28, deload_scheduled, deload_early, deload_block, return_planned, time_up, time_down, hold_max.
// ctx: {deload:'scheduled'|'early'|'block', days_since_last, planned_return}; rir_target?: {c:[lo,hi],a:[lo,hi]}.
function prNext(inp,equip){const e=prEquip(equip);const c=prCls(inp.id)||inp.cls||{id:inp.id,eq:'bodyweight',region:'upper',uni:false,hard:false,risk:''};
 const lv=PR_RIR[inp.level]?inp.level:'mid',lo=inp.range[0],hi=inp.range[1],plan=Math.max(1,inp.sets_plan|0||3);
 const lim=inp.flags||[],fl=prFlags(c,lim),ctx=inp.ctx||{};
 if(inp.profile&&Array.isArray(inp.profile.band)){e.bands=inp.profile.band.map(Number).filter(x=>x>0).sort((a,b)=>a-b)}
 const st=Object.assign({success:0,miss:0},inp.state||{});if(inp.variant!=null)st.mod=inp.variant|0;
 let rp=st.rirPlus|0;const rir=prRir(lv,inp.role,fl,rp?1:0,inp.rir_target);
 const out={id:inp.id,weight:inp.weight==null?null:inp.weight,sets:plan,target:null,rir,state:st,mod:st.mod|0,note:'same',big_jump:false,grace_used:false,suggest_swap:false};
 const has=inp.results!=null&&(Array.isArray(inp.results)?inp.results.length:true);
 // tech-fix-1 GC-07: results of a deload workout (ctx.deload / ctx.block_deload) never move the progression counters.
 if(ctx.block_deload&&!ctx.deload)ctx.deload='block';
 if(has&&!ctx.deload){
  if(rp>0)st.rirPlus=rp-1;
  if(c.eq==='time')prTime(inp,c,lim,out,lo,hi);else prReps(inp,c,e,lv,lim,fl,out,lo,hi,plan,rir)}
 if(!st.rirPlus)delete st.rirPlus;
 // Context before the next workout
 const days=ctx.days_since_last;
 // tech-fix-1 GC-07/awDeload: ctx.deload 'block' = deload workout of the program block: its sets are already reduced in the block,
 // so they are not halved again; weight the same, RIR +2.
 if(ctx.deload){const blk=ctx.deload==='block';out.sets=blk?plan:Math.max(1,Math.ceil(plan/2));out.target=c.eq==='time'?(inp.target||lo):lo;out.rir=[out.rir[0]+2,out.rir[1]+2];out.note=blk?'deload_block':'deload_'+(ctx.deload==='early'?'early':'scheduled');
  if(ctx.deload==='early'&&out.weight>0&&c.eq!=='band'&&c.eq!=='bodyweight')out.weight=c.eq==='assisted'?pr2(out.weight+e.assist):prDown(out.weight,0.9,c,e)}
 // tech-fix-1 GC-01: the exercise comes back by the plan (the user kept training): no break cut, the state stays.
 else if(ctx.planned_return){out.sets=plan;out.note='return_planned';if(c.eq==='time'){out.target=out.target!=null?out.target:(inp.target||lo)}else out.target=lo}
 else if(days>=14){const big=days>=28;st.success=0;st.miss=0;delete st.cut;out.sets=plan;out.note=big?'break28':'break14';
  if(c.eq==='time'){const t=out.target!=null?out.target:(inp.target||lo);out.target=big?lo:Math.max(lo,t-(PR_TSTEP[c.id]||5))}
  else{out.target=lo;
   if(c.eq==='bodyweight'){if(big&&out.mod>0){out.mod--;st.mod=out.mod;if(out.mod<3)out.weight=null}}
   else if(c.eq==='band'){if(big&&out.weight>0){const L=e.bands.filter(x=>x<out.weight);if(L.length)out.weight=L[L.length-1]}}
   else if(c.eq==='assisted'){if(out.weight!=null)out.weight=pr2(out.weight+(big?2:1)*e.assist)}
   else if(out.weight>0)out.weight=prDown(out.weight,big?0.8:0.9,c,e)}
  if(big){st.rirPlus=2;out.rir=prRir(lv,inp.role,fl,1,inp.rir_target)}}
 out.modKey=prModKey(c.eq,out.mod);out.variant=out.mod;if(!out.state.mod)delete out.state.mod;return out}
// What the modifier step means for this equipment: '', 'shorter' (band), 'tempo', 'pause', 'load'
function prModKey(eq,m){if(!m)return'';if(eq==='band')return['','tempo','pause','shorter'][Math.min(m,3)];
 if(eq==='bodyweight')return PR_MODS[Math.min(m,3)];return PR_MODS[Math.min(m,2)]}

function prTime(inp,c,lim,out,lo,hi){const st=out.state,R=PR_TIME[c.id]||[lo,hi];lo=R[0];hi=R[1];
 const step=PR_TSTEP[c.id]||5,t=inp.target!=null?inp.target:lo,res=prWeak(inp.results);out.target=t;out.weight=null;
 // The saved workout contains only completed sets. An incomplete or pain-marked session breaks the success streak
 // but does not raise the target, offer a harder exercise, or count toward a reduction.
 if(inp.pain||res.length<out.sets){st.success=0;return}
 if(res.every(x=>x>=t)){st.tmiss=0;
  if(t>=hi){const L=PR_LADDER[c.id];
   if(L&&!prForbidden(L.to,lim)){st.success=(st.success|0)+1;
    if(st.success>=2){out.id=L.to;out.target=(PR_TIME[L.to]||[t])[0];out.note='ladder';st.tmiss=0;st.success=0}else out.note='same'}
   else if(c.id==='pl'&&t<PR_PLANK_CAP){out.target=Math.min(PR_PLANK_CAP,t+step);out.note='time_up'}
   else out.note='hold_max'}
  else{out.target=Math.min(hi,t+step);out.note='time_up'}}
 else if(res.some(x=>x<t-step)){st.success=0;st.tmiss=(st.tmiss|0)+1;if(st.tmiss>=3){out.target=Math.max(lo,t-step);st.tmiss=0;out.note='time_down'}else out.note='same'}
 else{st.tmiss=0;st.success=0;out.note='same'}
 if(!st.tmiss)delete st.tmiss}

function prWeak(r){if(Array.isArray(r))return r.map(Number);const L=r.L||[],R=r.R||[];return L.map((x,i)=>Math.min(+x,R[i]==null?+x:+R[i]))}

function prReps(inp,c,e,lv,lim,fl,out,lo,hi,plan,rir){const st=out.state,res=prWeak(inp.results);
 const btn=inp.rir_button!=null?PR_FEEL[inp.rir_button]:undefined,rr=btn!=null?res.map(()=>btn):(inp.rir||[]);
 const grace=!!st.grace;delete st.grace;
 const floor=Math.max(0,rir[0]-1),top=(x,i)=>x>=hi&&(rr[i]==null||rr[i]>=floor);
 const need=st.cut?Math.max(2,plan-1):plan;
 const allTop=res.length>=Math.min(need,plan)&&res.every(top),miss=res.some(x=>x<lo),w=inp.weight;
 const reset=()=>{st.success=0;st.miss=0;delete st.cut};
 // Pain: no progression, weight and variant the same, misses of this workout do not count, offer a swap.
 // Pain 2 workouts in a row: note pain2 (suggest −10 % or a swap, see a doctor if it persists); the weight is not cut automatically.
 if(inp.pain){st.success=0;delete st.cut;out.target=lo;st.pain=(st.pain|0)+1;out.note=st.pain>=2?'pain2':'pain';out.suggest_swap=true;return}
 delete st.pain;
 // v162 (Grok QA v160 P2): the D2 gravitron with no counterweight written asks for it on EVERY path (first top / same / miss /
 // calibration), not only on a success — an empty field is not «0 kg of help», and the session does not count for the ladder.
 if(c.eq==='assisted'&&inp.need_w&&!(+w>0)){out.note='need_w';out.weight=null;out.target=lo;return}
 if(inp.calibration){reset();
  if(allTop){prInc(inp,c,e,lim,out,lo);out.note=out.note==='inc'?'cal_up':out.note}
  else if(miss){if(w>0&&c.eq!=='band'&&c.eq!=='bodyweight')out.weight=c.eq==='assisted'?pr2(w+e.assist):prDown(w,0.9,c,e);out.target=lo;out.note='cal_down';
   if(res.length&&res.every(x=>x<lo)){const d=prDownStep(c.id,inp.place,lim);if(d)out.down=d}}
  return}
 if(miss){st.success=0;
  if(inp.ctx&&inp.ctx.after_deload){out.note='same';return}
  if(grace){out.note='grace';out.grace_used=true;return}
  st.miss=(st.miss|0)+1;
  if(st.miss>=3){reset();out.target=lo;out.note='miss3';
   if(c.eq==='assisted')out.weight=pr2((w||0)+e.assist);else if(w>0&&c.eq!=='band'&&c.eq!=='bodyweight')out.weight=prDown(w,0.9,c,e)}
  else if(st.miss===2){st.cut=1;out.sets=Math.max(2,plan-1);out.note='miss2'}
  else out.note='miss1';
  if(st.miss>=2||out.note==='miss3'){if(res.length&&res.every(x=>x<lo)){const d=prDownStep(c.id,inp.place,lim);if(d)out.down=d}}
  return}
 delete st.cut;st.miss=0;
 if(!allTop){st.success=0;out.note='same';return}
 st.success=(st.success|0)+1;const req=fl.length?2:PR_SESS[lv];
 if(st.success<req){out.note='same';return}
 reset();prInc(inp,c,e,lim,out,lo)}

// One step of progression for a success
function prInc(inp,c,e,lim,out,lo){const st=out.state,w=inp.weight,fl=prFlags(c,lim);out.target=lo;
 // closeout fix 1 (v157): a gravitron taken as the easier step (need_w) with no counterweight written must not count as 0 kg
 // help and send the user back to pull-ups after one session — stay and ask for the counterweight.
 if(c.eq==='assisted'&&inp.need_w&&!(+w>0)){out.note='need_w';out.weight=null;return}
 if(c.eq==='assisted'){const n=pr2((w||0)-e.assist);if(n<=0){out.id='pull';out.weight=null;out.note='ladder'}else{out.weight=n;out.note='inc'}return}
 // Band: tempo -> pause -> next band from the profile (variant back to 0) -> shorter grip / further from the anchor.
 if(c.eq==='band'){const m=st.mod|0;if(m<2){st.mod=m+1;out.mod=m+1;out.note='mod';return}
  const n=+w>0?e.bands.find(x=>x>+w+PR_EPS):null;if(n!=null){out.weight=n;st.mod=0;out.mod=0;out.note='inc';return}
  st.mod=3;out.mod=3;out.note='no_heavier';out.band='shorter';return}
 if(c.eq==='bodyweight'){const L=PR_LADDER[c.id];
  if(L&&!prForbidden(L.to,lim)&&(!L.pl||!inp.place||L.pl.includes(inp.place))&&(!L.hang||(inp.hang||0)>=L.hang)){out.id=L.to;out.weight=null;st.mod=0;out.mod=0;out.note='ladder';return}
  prMod(out,st,'bw',prModCap(c.id,fl));return}
 const n=w>0?prUp(w,c,e,fl.length>0):null;
 if(n!=null){out.weight=n;out.note='inc';if((n-w)/w>PR_BIG+PR_EPS){out.big_jump=true;st.grace=1}return}
 prMod(out,st,'weighted')}
// Modifier ladder (no heavier equipment / bodyweight without an id ladder)
function prMod(out,st,kind,cap){let m=(st.mod|0)+1;out.note='no_heavier';
 if(cap!=null){m=Math.min(m,cap);out.mod_cap=cap}
 if(kind==='weighted'){m=Math.min(m,2)}
 else if(kind==='band'){if(m===1){out.band='shorter'}else{m=Math.min(m,3)}}
 st.mod=m;out.mod=m;
 if(kind==='bw'&&m>=3)out.weight=m===3?5:pr2(5+2.5*(m-3))}

if(typeof module!=='undefined'&&module.exports)module.exports={prNext,prModKey,prModCap,PR_MOD_CAP,prDownStep,PR_DOWN,PR_DOWN_ON,PR_DOWN_PLACE,prCls,prFlags,prUp,prDown,prEquip,prGrid,prRir,PR_CLS,PR_EQUIP,PR_LADDER,PR_TIME,PR_TSTEP,PR_FEEL,PR_MODS,PR_SESS,PR_PCT};
