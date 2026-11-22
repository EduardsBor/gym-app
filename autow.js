'use strict';
// P-301: auto-weight in the app. Rules live in progress.js (pure); here: state in S.pg, prefill, buttons, «Моё оборудование».
// History (S.workouts) is never rewritten. Old it.feel / it.pain in saved workouts stay as they are
// (progression and CSV still read them). D-287: the optional how-it-went row is gone; new workouts have no UI
// to set feel, so awFinish falls back to reps/weights (RIR stays null).
const AW_DAY=864e5;
const AW_NOTE={inc:'↑ Прибавка: верх диапазона 2 тренировки подряд',inc_big:'↑ Прибавка: верх диапазона 2 тренировки подряд. Шаг снаряда большой: если в первый раз не выйдет нижняя граница — это не промах',
 top1:'Верх диапазона во всех подходах: ещё одна такая тренировка — и прибавка',grace:'Недобор на новом весе не засчитан как промах (первая тренировка после большого шага)',cal_up:'↑ Калибровка: сразу прибавка',cal_down:'↓ Калибровка: вес −10 %',
 miss1:'Промах в прошлый раз: вес тот же',miss2:'Два промаха подряд: на один подход меньше',miss3:'Три промаха подряд: вес −10 %, прогрессия заново',
break14:'После перерыва 2+ недели: вес −10 %',
 return_planned:'Упражнение вернулось по плану программы: вес прежний, начни с нижней границы повторов',
 deload_block:'Разгрузка по программе: вес тот же, запас +2 повтора',
 break28:'После перерыва 4+ недели: вес −20 %, запас на 1 повтор больше',deload_scheduled:'Разгрузка: подходов вдвое меньше, вес тот же',
 deload_early:'Разгрузка: подходов вдвое меньше, вес −10 %',time_up:'↑ Цель удержания выше',time_down:'↓ Цель удержания ниже',hold_max:'Максимум удержания',ladder:'Пора усложнить'};
const AW_MOD={tempo:'Усложнение: опускание 3–4 с',pause:'Усложнение: пауза 2 с в нижней точке',load:'Усложнение: рюкзак с грузом',
 shorter:'Тяжелее резинки нет: возьми резинку короче или встань дальше от крепления'};
if(S&&!S.pgSince){S.pgSince=Date.now();save()}

function awEq(){return prEquip(Object.assign({bands:[1]},S.equip||{}))}
function awAppId(t){return(typeof LEGACY_TO!=='undefined'&&LEGACY_TO[t])||t}
function awPg(){return S.pg||(S.pg={})}
function awLevel(){const l=S.prof&&S.prof.level;return PR_RIR[l]?l:'mid'}
function awCls(id){return isCardio(id)?null:prCls(id)}
function awLast(exId,skip){for(let i=S.workouts.length-1;i>=0;i--){const w=S.workouts[i];if(w.id===skip)continue;const it=w.items.find(x=>x.exId===exId);if(it&&it.sets.some(s=>s.done))return{w,it}}return null}
function awHang(){let m=0;S.workouts.forEach(w=>w.items.forEach(it=>{if(it.exId==='dead-hang')it.sets.forEach(s=>{if(s.done&&+s.r>m)m=+s.r})}));return m}
function awWork(sets){const L=sets.map(s=>+s.w).filter(x=>x>0);return L.length?Math.min(...L):null}
const awFmt=x=>String(Math.round(x*100)/100);

// Deload week: {type, start}. Scheduled every 6 weeks (6th week) for mid/adv; novices: none for the first 12 weeks.
// tech-fix-1 awDeload: noSchedule = the active program block has its own deload workouts → no calendar deload on top
// (a deload started by hand with «Начать разгрузку» still works).
function awDeload(noSchedule){const now=Date.now();if(S.dl&&now-S.dl.start<7*AW_DAY)return S.dl.type;
 if(noSchedule||!S.workouts.length)return null;const lv=awLevel(),first=S.workouts[0].start;
 if(lv==='nov'&&now-first<84*AW_DAY)return null;
 const base=Math.max(S.dlLast||0,S.pgSince||now,lv==='nov'?first+84*AW_DAY-35*AW_DAY:0);
 if(now-base>=35*AW_DAY){S.dl={type:'scheduled',start:now};S.dlLast=now;return'scheduled'}return null}
function awAfterDeload(){return!!(S.dl&&Date.now()-S.dl.start>=7*AW_DAY&&Date.now()-S.dl.start<14*AW_DAY)}
// Early deload offer: weight has not grown for 3 weeks in at least half of the tracked weighted exercises
function awEarly(){if(awLevel()==='nov')return true;const now=Date.now(),P=awPg();let act=0,stale=0;
 for(const id in P){const p=P[id],c=prCls(id);if(!c||/^(bodyweight|time|band)$/.test(c.eq))continue;
  if(!p.first||now-p.first<21*AW_DAY||!p.last||now-p.last>21*AW_DAY)continue;act++;if(now-(p.incAt||p.first)>=21*AW_DAY)stale++}
 return act>=2&&stale*2>=act}

// Suggestion for one active item, from S.pg (or the last history) + context of this day
// tech-fix-1 GC-01: days since the last finished workout of any kind (real break of the user), not of this exercise.
function awUserGap(skip){let t=0;for(const w of S.workouts){if(w.id===skip||!w.items||!w.items.some(it=>(it.sets||[]).some(s=>s.done)))continue;if(w.start>t)t=w.start}
 return t?Math.floor((Date.now()-t)/AW_DAY):null}
// tech-fix-1 UI RIR: role of the exercise ('c' main / 'a' accessory) and the day context of the program block.
function awDayCtx(dayIdx){const i=dayIdx!=null?dayIdx:S.active&&S.active.dayIdx;return i!=null&&typeof blockDayCtx==='function'?blockDayCtx(i):null}
function awRole(it,dayIdx){const i=dayIdx!=null?dayIdx:S.active&&S.active.dayIdx,d=i!=null&&S.program&&S.program[i],pi=d&&(d.items||[]).find(x=>x.exId===it.exId);
 if(pi&&(pi.role==='c'||pi.role==='a'))return pi.role;return typeof blockRole==='function'?blockRole({exId:it.exId}):'c'}
function awSuggest(it,dl){const c=awCls(it.exId);if(!c)return null;const p=awPg()[it.exId],last=awLast(it.exId,S.active&&S.active.id);
 const plan=it.ns||it.sets.length,R=c.eq==='time'?(PR_TIME[c.id]||[it.min,it.max]):[it.min,it.max];
 const dc=awDayCtx(),role=awRole(it),rt=dc&&dc.rirTarget||undefined;
 if(!p&&!last){const r0=prRir(awLevel(),role,prFlags(c,(S.prof&&S.prof.lim)||[]),0,rt);const rr=dl?[r0[0]+2,r0[1]+2]:r0;
  if(c.eq==='bodyweight'||c.eq==='time')return{ex:it.exId,target:R[0],sets:plan,note:'start',rir:rr};return{ex:it.exId,cal:1,sets:plan,note:'cal',rir:rr}}
 const nx=(p&&p.next)||{};let w=nx.weight!==undefined?nx.weight:(last?awWork(last.it.sets.filter(s=>s.done)):null);
 const days=last?Math.floor((Date.now()-last.w.start)/AW_DAY):0,ctx={};
 if(dl)ctx.deload=dl;
 else if(days>=14){const daysSinceAny=awUserGap(S.active&&S.active.id);if(daysSinceAny!=null&&daysSinceAny<14)ctx.planned_return=1;else ctx.days_since_last=daysSinceAny!=null?Math.max(14,daysSinceAny):days}
 const base={id:it.exId,level:awLevel(),role:role,range:R,sets_plan:plan,weight:w,state:Object.assign({},(p&&p.st)||{}),flags:(S.prof&&S.prof.lim)||[],ctx,target:nx.target!=null?nx.target:undefined};
 if(rt)base.rir_target=rt;
 const o=prNext(base,awEq()),cx=ctx.deload||ctx.days_since_last||ctx.planned_return;
 const s={ex:it.exId,weight:o.weight,sets:cx?o.sets:(nx.sets||plan),target:cx?o.target:(nx.target!=null?nx.target:null),
  rir:o.rir,note:cx?o.note:(nx.note||'same'),modKey:nx.modKey||o.modKey||'',to:nx.id||null,st:o.state};
 if(ctx.planned_return)s.st=Object.assign({},(p&&p.st)||{});
 if(dl)s.dl=dl;if(!dl&&(awAfterDeload()||(p&&p.afterDl)))s.after=1;return s}
function awApply(it,dl){if(!awOn())return awPrev(it);const s=awSuggest(it,dl);it.awx=1;it.sug=s;if(s&&/^(inc|inc_big|cal_up|time_up)$/.test(s.note||'')&&typeof premFlagInc==='function')premFlagInc();if(!s||S.autoW===false)return;
 const last=awLast(it.exId,S.active&&S.active.id),L=last?last.it.sets.filter(x=>x.done):null,n=Math.max(1,s.sets||it.sets.length);
 const done=it.sets.filter(x=>x.done);let rest=it.sets.filter(x=>!x.done);
 while(done.length+rest.length<n)rest.push({w:'',r:'',done:false});if(done.length+rest.length>n)rest=rest.slice(0,Math.max(0,n-done.length));
 rest.forEach((x,k)=>{const j=done.length+k,pv=L&&(L[j]||L[L.length-1]);
  const w=s.cal?'':(s.weight!=null?s.weight:(pv?pv.w:''));x.w=w;x.pf=w!=='';x.r=s.target!=null?s.target:(pv?pv.r:it.max)});
 it.sets=done.concat(rest)}

// P-305b: auto-weight, deload and return after a break are a subscription feature (premium.js). No premium.js → full.
// Without it the free diary only puts the previous weight and reps into the fields (no suggestion, no arrow).
const awCan=f=>typeof can!=='function'||can(f);
const awOn=()=>awCan('autoWeight');
function awPrev(it){it.awx=1;it.sug=null;const c0=awCls(it.exId);
 // tech-fix-1 UI RIR: the target RIR of the program is shown without the auto-weight subscription too.
 if(c0&&c0.eq!=='time'){const dc=awDayCtx(),r=prRir(awLevel(),awRole(it),prFlags(c0,(S.prof&&S.prof.lim)||[]),0,dc&&dc.rirTarget||undefined);it.rirShow=S.active&&S.active.dl?[r[0]+2,r[1]+2]:r}
 if(S.autoW===false)return;const last=awLast(it.exId,S.active&&S.active.id),L=last?last.it.sets.filter(x=>x.done):null;if(!L||!L.length)return;
 it.sets.forEach((x,j)=>{if(x.done||(x.w!==''&&x.w!=null&&!x.pf))return;const pv=L[j]||L[L.length-1];x.w=pv.w;x.r=pv.r;x.pf=true})}
// tech-fix-1 GC-07: a deload workout of the program block is a deload for auto-weight (not a premium switch: it is the program).
// awDeload: blocks with their own deload workouts get no calendar deload on top.
function awStart(){const A=S.active;if(!A)return;const dc=awDayCtx();
 const dl=dc&&dc.deload?'block':(awCan('deload')?awDeload(!!(dc&&dc.blockHasDeload)):null);A.dl=dl||null;
 A.items.forEach(it=>awApply(it,dl));save()}
const _awSW=startW;startW=function(i){_awSW(i);awStart();if(S.active)workoutView()};

function awSugHTML(it,i){const s=it.sug||{},c=awCls(it.exId);if(!c)return'';const L=[];
 if(!awOn()||!it.sug){if(it.rirShow&&c.eq!=='time')L.push(`<span>Запас</span> ${it.rirShow[0]}–${it.rirShow[1]} <span>повт.</span>`)}else if(s.cal)L.push(`<span>Калибровка:</span> <span>подбери вес, с которым выйдет верх диапазона и останется 3–4 повтора в запасе</span>`);
 else{const u=c.eq==='band'?'ур. резинки':c.eq==='assisted'?'кг противовеса':c.eq==='bodyweight'?'кг доп. веса':'кг';
  const parts=[];if(s.weight!=null&&c.eq!=='time')parts.push(`${awFmt(s.weight)} <span>${u}</span>`);if(s.target!=null)parts.push(`${s.target} <span>${c.eq==='time'?'с':'повт.'}</span>`);
  if(parts.length)L.push(`<b>🎯 <span>Авто-вес</span>: ${parts.join(' × ')}</b>`);
  if(s.rir&&c.eq!=='time')L.push(`<span>Запас</span> ${s.rir[0]}–${s.rir[1]} <span>повт.</span>`);

  if(AW_NOTE[s.note]&&s.note!=='ladder'&&s.note!=='same'&&s.note!=='pain'&&s.note!=='pain2')L.push(`<span>${AW_NOTE[s.note]}</span>`);
  if(s.modKey&&AW_MOD[s.modKey])L.push(`<span>${AW_MOD[s.modKey]}</span>`);
  if(s.to&&s.to!==it.exId)L.push(`<span>Пора усложнить</span> → <b>${esc(exBy(s.to).name)}</b> <button class="sm" data-awlad="${i}">Заменить</button>`)}
 // D-257 (Eduards: «Убери во всех случаях данное упоминание про боль»): no pain button and no pain notes on the card.
 // Old it.pain flags in history stay as they are (progression still reads them); nothing new can set them.
 return L.length?`<div class="awsug mut" style="font-size:13px;margin:4px 0">${L.join('<br>')}</div>`:''}
function awDecorate(){const A=S.active;if(!A)return;let ch=false;
 A.items.forEach(it=>{const c=awCls(it.exId);if(!c)return;if((!it.awx&&!it.sets.some(s=>s.done))||(it.sug&&it.sug.ex!==it.exId)){awApply(it,A.dl);ch=true}});
 if(ch){save();return workoutView()}
 const first=app.querySelector('[data-rm]');
 if(first&&first.closest){const fc=first.closest('.card');let b='';
  if(A.dl)b=`<div class="card awdl"><b>🔋 Разгрузочная неделя</b><br><span class="mut"><span>${A.dl==='early'?'Подходов вдвое меньше, вес −10 %.':A.dl==='block'?'Разгрузка по программе: подходов меньше (уже в плане), вес тот же.':'Каждые 6 недель: подходов вдвое меньше, вес тот же.'}</span> <span>Запас +2 повтора. Результаты этой недели не меняют прогрессию.</span></span></div>`;
  else if(awCan('deload')&&awOn()&&awEarly()&&!A.items.some(it=>it.sets.some(s=>s.done)))b=`<div class="card awdl"><span class="mut">Тяжело восстанавливаться или вес давно не растёт? Можно начать разгрузочную неделю.</span><button class="sm full" id="awdl" style="margin-top:6px">🔋 Начать разгрузку</button></div>`;
  const lw=typeof blockLimWarnHTML==='function'&&S.program?blockLimWarnHTML(S.program[A.dayIdx]):'';if(lw)b=(b||'')+`<div class="card">${lw}</div>`;
  if(b)fc.insertAdjacentHTML('beforebegin',b)}
 A.items.forEach((it,i)=>{const rm=app.querySelector(`[data-rm="${i}"]`);if(!rm||!rm.closest)return;const card=rm.closest('.card');if(!card)return;
  const c=awCls(it.exId);if(!c)return;
  const goal=card.querySelector('.mut');if(goal)goal.insertAdjacentHTML('afterend',awSugHTML(it,i))});
 app.querySelectorAll('[data-awlad]').forEach(b=>b.onclick=()=>{const it=A.items[b.dataset.awlad],from=it.exId,to=it.sug&&it.sug.to;if(!to)return;
  it.exId=to;const d=S.program[A.dayIdx];if(d){const pi=d.items.find(x=>x.exId===from);if(pi)pi.exId=to}
  const p=awPg()[from];if(p&&p.next)delete p.next.id;awApply(it,A.dl);save();workoutView()});
 const dlb=$('#awdl');if(dlb)dlb.onclick=()=>{S.dl={type:'early',start:Date.now()};S.dlLast=S.dl.start;A.dl='early';A.items.forEach(it=>awApply(it,'early'));save();workoutView()};
 const fin=$('#fin');if(fin&&fin.onclick){const o=fin.onclick;fin.onclick=()=>{const id=A.id,n=S.workouts.length;o();if(S.workouts.length>n&&S.workouts[S.workouts.length-1].id===id){awFinish(S.workouts[S.workouts.length-1]);save();awMoment(S.workouts[S.workouts.length-1])}}}}
const _awWV=workoutView;workoutView=function(){_awWV();awDecorate()};

// After a workout is saved: update per-exercise state; the saved workout itself is not changed
function awFinish(W){const P=awPg(),lim=(S.prof&&S.prof.lim)||[],hang=awHang();
 W.items.forEach(it=>{const c=awCls(it.exId);if(!c)return;const s=it.sug||{},p=P[it.exId]||(P[it.exId]={});
  p.first=p.first||W.start;
  // tech-fix-1 GC-07: deload workouts (calendar, early or of the block) never change progression, also without auto-weight.
  const wdl=s.dl||W.dl;if(wdl){p.last=W.start;if(wdl==='block')p.afterDl=1;return}
  const sets=it.sets.filter(x=>x.done);if(!sets.length)return;
  const rir=sets.map(()=>null);if(it.feel&&PR_FEEL[it.feel]!=null)rir[rir.length-1]=PR_FEEL[it.feel];
  const R=c.eq==='time'?(PR_TIME[c.id]||[it.min,it.max]):[it.min,it.max],w=c.eq==='time'?null:awWork(sets);
  const dcF=awDayCtx(W.dayIdx);
  const inp={id:it.exId,level:awLevel(),role:awRole(it,W.dayIdx),range:R,sets_plan:it.ns||sets.length,weight:w,results:sets.map(x=>+x.r||0),rir,
   state:Object.assign({},s.st||p.st||{}),flags:lim,ctx:s.after||p.afterDl?{after_deload:true}:{},calibration:!!s.cal,pain:!!it.pain,place:S.prof&&S.prof.place,hang};
  if(c.eq==='time')inp.target=s.target!=null?s.target:R[0];
  if(dcF&&dcF.rirTarget)inp.rir_target=dcF.rirTarget;
  const o=prNext(inp,awEq()),to=o.id!==it.exId?awAppId(o.id):null;
  // v2 notes: inc with a big equipment step, first of the 2 sessions at the top, grace session after a big step
  const note=o.note==='inc'&&o.big_jump?'inc_big':o.note==='same'&&(o.state.success|0)===1&&c.eq!=='time'?'top1':o.note;
  delete p.afterDl;
  p.st=o.state;p.next={weight:o.weight,sets:o.sets,target:o.target,note,modKey:o.modKey};if(to)p.next.id=to;
  p.last=W.start;if(/^(inc|cal_up|ladder)$/.test(o.note))p.incAt=W.start;
  if(to&&!P[to])P[to]={st:{success:0,miss:0},next:{target:o.target,sets:o.sets,weight:o.weight,note:'ladder'},first:W.start,last:W.start}})}

// Today: show the next suggestion instead of the old "+2,5 кг" hint
const _awHint=hint;hint=function(item){const c=awCls(item.exId),p=awPg()[item.exId];if(!c||!p||!p.next)return _awHint(item);const n=p.next,u=c.eq==='band'?'ур.':'кг';
 const parts=[];if(n.weight!=null&&c.eq!=='time')parts.push(awFmt(n.weight)+' '+u);if(n.target!=null)parts.push(n.target+(c.eq==='time'?' с':''));
 const up=/^(inc|inc_big|cal_up|time_up|ladder)$/.test(n.note);if(!parts.length&&!n.id)return'';
 return`<div class="${up?'pr':'mut'}" style="font-size:13px">${up?'⬆ ':''}<span>Авто-вес</span>: ${parts.join(' × ')}${n.id?` → ${esc(exBy(n.id).name)}`:''}</div>`};

// «Моё оборудование» in «Ещё»
function awEquipHTML(){const e=Object.assign({},PR_EQUIP,{bands:[1]},S.equip||{}),j=a=>(a||[]).join(', ');
 return`<div class="card" id="awequip"><b>🏋️ Моё оборудование</b><p class="mut">Шаги для авто-веса. По умолчанию — как в правилах тренера; поменяй, если у тебя другие гантели или блоки.</p>
 <label class="mut">Гантели, кг (через запятую; дробные — через точку)<input id="eqdb" value="${esc(j(e.db))}"></label>
 <label class="mut">Гири, кг (через запятую; дробные — через точку)<input id="eqkb" value="${esc(j(e.kb))}"></label>
 <div class="grid2"><label class="mut">Гриф, кг<input type="number" inputmode="decimal" step="0.5" id="awbar" value="${esc(e.bar)}"></label><label class="mut">Шаг штанги, кг<input type="number" inputmode="decimal" step="0.25" id="eqplate" value="${esc(e.plate)}"></label>
 <label class="mut">Шаг тренажёра, кг<input type="number" inputmode="decimal" step="0.5" id="eqmachine" value="${esc(e.machine)}"></label><label class="mut">Шаг блока, кг<input type="number" inputmode="decimal" step="0.5" id="eqcable" value="${esc(e.cable)}"></label></div>
 <label class="mut">Резинок дома (уровней 1–5)<input type="number" inputmode="numeric" min="1" max="5" id="eqbands" value="${esc((e.bands||[1]).length)}"></label>
 <p class="mut">Одна резинка: когда станет легко, приложение предложит взять её короче и замедлить темп.</p>
 <button class="full" id="eqsave">Сохранить оборудование</button></div>`}
function awEquipSave(){const num=v=>+String(v).replace(',','.'),list=v=>String(v).split(/[;,\s]+/).map(num).filter(x=>x>0);
 const n=Math.max(1,Math.min(5,Math.round(num($('#eqbands').value))||1));
 S.equip={db:list($('#eqdb').value),kb:list($('#eqkb').value),bar:num($('#awbar').value)||20,plate:num($('#eqplate').value)||2.5,machine:num($('#eqmachine').value)||5,cable:num($('#eqcable').value)||2.5,bands:Array.from({length:n},(_,i)=>i+1)};
 const e=prEquip(S.equip);S.equip.db=e.db;S.equip.kb=e.kb;save();toast('Оборудование сохранено')}
const _awMore=more;more=function(){_awMore();const aw=$('#aw');const card=aw&&aw.closest?aw.closest('.card'):null;if(!card)return;
 card.insertAdjacentHTML('afterend',awEquipHTML());$('#eqsave').onclick=awEquipSave;
 // QA-06: вход в профили оборудования (Зал / Дом / Без инвентаря) — от активного профиля зависят упражнения тренировки.
 const eq=$('#eqsave');if(eq&&typeof eqEditor==='function'&&!$('#eqprofs')){eq.insertAdjacentHTML('afterend','<button class="full" id="eqprofs" style="margin-top:8px">🏠 Профили оборудования (зал / дом / без инвентаря)</button>');$('#eqprofs').onclick=()=>eqEditor()}
 if(typeof eqSwitchHTML==='function'&&!$('#eqswitch')){const host=$('#eqprofs')||eq;if(host){host.insertAdjacentHTML('afterend',eqSwitchHTML('eqswitch'));if(typeof eqBindSwitch==='function')eqBindSwitch(host.parentNode,()=>{if(typeof more==='function')more()})}}};
// P-305b: demo paywall moments (premium.js) — only after the workout is saved, never mid-set; not over the summary sheet.
function awMoment(W){if(typeof premMarkDemo==='function'){premMarkDemo(W);save()}if(typeof mzOnWorkoutFinished==='function')mzOnWorkoutFinished(W);if(typeof premMoment!=='function')return;
 setTimeout(()=>{const m=$('#modal');if(S.active||(m&&m.classList&&!m.classList.contains('hidden')))return;premMoment()},800)}
