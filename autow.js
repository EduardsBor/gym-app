'use strict';
// P-301: auto-weight in the app. Rules live in progress.js (pure); here: state in S.pg, prefill, buttons, «Моё оборудование».
// History (S.workouts) is never rewritten: the new fields feel/pain only go into the workout being saved now.
const AW_DAY=864e5;
const AW_FEELS=[['easy','легко'],['ok','нормально'],['hard','тяжело']];
const AW_NOTE={inc:'↑ Прибавка: все подходы на верхней границе',cal_up:'↑ Калибровка: сразу прибавка',cal_down:'↓ Калибровка: вес −10 %',
 miss1:'Промах в прошлый раз: вес тот же',miss2:'Два промаха подряд: на один подход меньше',miss3:'Три промаха подряд: вес −10 %, прогрессия заново',
 pain:'В прошлый раз была боль: вес −10 %. Если боль повторяется — замени упражнение ⇄',break14:'После перерыва 2+ недели: вес −10 %',
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
function awDeload(){const now=Date.now();if(S.dl&&now-S.dl.start<7*AW_DAY)return S.dl.type;
 if(!S.workouts.length)return null;const lv=awLevel(),first=S.workouts[0].start;
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
function awSuggest(it,dl){const c=awCls(it.exId);if(!c)return null;const p=awPg()[it.exId],last=awLast(it.exId,S.active&&S.active.id);
 const plan=it.ns||it.sets.length,R=c.eq==='time'?(PR_TIME[c.id]||[it.min,it.max]):[it.min,it.max];
 if(!p&&!last){if(c.eq==='bodyweight'||c.eq==='time')return{ex:it.exId,target:R[0],sets:plan,note:'start'};return{ex:it.exId,cal:1,sets:plan,note:'cal'}}
 const nx=(p&&p.next)||{};let w=nx.weight!==undefined?nx.weight:(last?awWork(last.it.sets.filter(s=>s.done)):null);
 const days=last?Math.floor((Date.now()-last.w.start)/AW_DAY):0,ctx={};
 if(dl)ctx.deload=dl;else if(days>=14)ctx.days_since_last=days;
 const base={id:it.exId,level:awLevel(),range:R,sets_plan:plan,weight:w,state:Object.assign({},(p&&p.st)||{}),flags:(S.prof&&S.prof.lim)||[],ctx,target:nx.target!=null?nx.target:undefined};
 const o=prNext(base,awEq());
 const s={ex:it.exId,weight:o.weight,sets:ctx.deload||ctx.days_since_last?o.sets:(nx.sets||plan),target:ctx.deload||ctx.days_since_last?o.target:(nx.target!=null?nx.target:null),
  rir:o.rir,note:ctx.deload?o.note:ctx.days_since_last?o.note:(nx.note||'same'),modKey:nx.modKey||o.modKey||'',to:nx.id||null,st:o.state};
 if(dl)s.dl=dl;if(!dl&&awAfterDeload())s.after=1;return s}
function awApply(it,dl){if(!awOn())return awPrev(it);const s=awSuggest(it,dl);it.awx=1;it.sug=s;if(s&&/^(inc|cal_up|time_up)$/.test(s.note||'')&&typeof premFlagInc==='function')premFlagInc();if(!s||S.autoW===false)return;
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
function awPrev(it){it.awx=1;it.sug=null;if(S.autoW===false)return;const last=awLast(it.exId,S.active&&S.active.id),L=last?last.it.sets.filter(x=>x.done):null;if(!L||!L.length)return;
 it.sets.forEach((x,j)=>{if(x.done||(x.w!==''&&x.w!=null&&!x.pf))return;const pv=L[j]||L[L.length-1];x.w=pv.w;x.r=pv.r;x.pf=true})}
function awStart(){const A=S.active;if(!A)return;const dl=awCan('deload')?awDeload():null;A.dl=dl||null;
 A.items.forEach(it=>awApply(it,dl));save()}
const _awSW=startW;startW=function(i){_awSW(i);awStart();if(S.active)workoutView()};

function awSugHTML(it,i){const s=it.sug||{},c=awCls(it.exId);if(!c)return'';const L=[];
 if(!awOn()||!it.sug){}else if(s.cal)L.push(`<span>Калибровка:</span> <span>подбери вес, с которым выйдет верх диапазона и останется 3–4 повтора в запасе</span>`);
 else{const u=c.eq==='band'?'ур. резинки':c.eq==='assisted'?'кг противовеса':c.eq==='bodyweight'?'кг доп. веса':'кг';
  const parts=[];if(s.weight!=null&&c.eq!=='time')parts.push(`${awFmt(s.weight)} <span>${u}</span>`);if(s.target!=null)parts.push(`${s.target} <span>${c.eq==='time'?'с':'повт.'}</span>`);
  if(parts.length)L.push(`<b>🎯 <span>Авто-вес</span>: ${parts.join(' × ')}</b>`);
  if(s.rir&&c.eq!=='time')L.push(`<span>Запас</span> ${s.rir[0]}–${s.rir[1]} <span>повт.</span>`);
  if(AW_NOTE[s.note]&&s.note!=='ladder'&&s.note!=='same')L.push(`<span>${AW_NOTE[s.note]}</span>`);
  if(s.modKey&&AW_MOD[s.modKey])L.push(`<span>${AW_MOD[s.modKey]}</span>`);
  if(s.to&&s.to!==it.exId)L.push(`<span>Пора усложнить</span> → <b>${esc(exBy(s.to).name)}</b> <button class="sm" data-awlad="${i}">Заменить</button>`)}
 if(it.pain)L.push(`<span style="color:#e5484d">Не повышай вес: снизь на 10 % или замени упражнение ⇄</span>`);
 return`<div class="row" style="align-items:flex-start;margin:4px 0"><div class="awsug mut grow" style="font-size:13px">${L.join('<br>')}</div><button class="sm ${it.pain?'danger':''}" data-awpain="${i}" title="Боль">🤕 Боль</button></div>`}
function awFeelHTML(it,i){if(!awCls(it.exId)||!it.sets.length||!it.sets.every(s=>s.done))return'';
 return`<div class="row awfeel" style="margin-top:6px"><span class="mut grow">Как прошло? <span style="font-size:12px">(необязательно)</span></span>${AW_FEELS.map(([k,t])=>`<button class="sm ${it.feel===k?'ok':''}" data-awfeel="${i},${k}">${t}</button>`).join('')}</div>`}

function awDecorate(){const A=S.active;if(!A)return;let ch=false;
 A.items.forEach(it=>{const c=awCls(it.exId);if(!c)return;if((!it.awx&&!it.sets.some(s=>s.done))||(it.sug&&it.sug.ex!==it.exId)){awApply(it,A.dl);ch=true}});
 if(ch){save();return workoutView()}
 const first=app.querySelector('[data-rm]');
 if(first&&first.closest){const fc=first.closest('.card');let b='';
  if(A.dl)b=`<div class="card awdl"><b>🔋 Разгрузочная неделя</b><br><span class="mut"><span>${A.dl==='early'?'Подходов вдвое меньше, вес −10 %.':'Каждые 6 недель: подходов вдвое меньше, вес тот же.'}</span> <span>Запас +2 повтора. Результаты этой недели не меняют прогрессию.</span></span></div>`;
  else if(awCan('deload')&&awOn()&&awEarly()&&!A.items.some(it=>it.sets.some(s=>s.done)))b=`<div class="card awdl"><span class="mut">Тяжело восстанавливаться или вес давно не растёт? Можно начать разгрузочную неделю.</span><button class="sm full" id="awdl" style="margin-top:6px">🔋 Начать разгрузку</button></div>`;
  if(b)fc.insertAdjacentHTML('beforebegin',b)}
 A.items.forEach((it,i)=>{const rm=app.querySelector(`[data-rm="${i}"]`);if(!rm||!rm.closest)return;const card=rm.closest('.card');if(!card)return;
  const c=awCls(it.exId);if(!c)return;
  const goal=card.querySelector('.mut');if(goal)goal.insertAdjacentHTML('afterend',awSugHTML(it,i));
  const add=card.querySelector('[data-add]');if(add)add.closest('.row').insertAdjacentHTML('beforebegin',awFeelHTML(it,i))});
 app.querySelectorAll('[data-awpain]').forEach(b=>b.onclick=()=>{const it=A.items[b.dataset.awpain];it.pain=!it.pain;
  if(it.pain&&S.autoW!==false){const c=awCls(it.exId),e=awEq();it.sets.forEach(s=>{if(!s.done&&+s.w>0&&c&&!/^(band|bodyweight|time)$/.test(c.eq)){s.w=c.eq==='assisted'?+s.w+e.assist:prDown(+s.w,0.9,c,e);s.pf=true}})}
  save();const y=scrollY;workoutView();scrollTo(0,y)});
 app.querySelectorAll('[data-awfeel]').forEach(b=>b.onclick=()=>{const[i,k]=b.dataset.awfeel.split(',');const it=A.items[+i];it.feel=it.feel===k?undefined:k;save();const y=scrollY;workoutView();scrollTo(0,y)});
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
  if(s.dl){p.last=W.start;return}
  const sets=it.sets.filter(x=>x.done);if(!sets.length)return;
  const rir=sets.map(()=>null);if(it.feel&&PR_FEEL[it.feel]!=null)rir[rir.length-1]=PR_FEEL[it.feel];
  const R=c.eq==='time'?(PR_TIME[c.id]||[it.min,it.max]):[it.min,it.max],w=c.eq==='time'?null:awWork(sets);
  const inp={id:it.exId,level:awLevel(),range:R,sets_plan:it.ns||sets.length,weight:w,results:sets.map(x=>+x.r||0),rir,
   state:Object.assign({},s.st||p.st||{}),flags:lim,ctx:s.after?{after_deload:true}:{},calibration:!!s.cal,pain:!!it.pain,place:S.prof&&S.prof.place,hang};
  if(c.eq==='time')inp.target=s.target!=null?s.target:R[0];
  const o=prNext(inp,awEq()),to=o.id!==it.exId?awAppId(o.id):null;
  p.st=o.state;p.next={weight:o.weight,sets:o.sets,target:o.target,note:o.note,modKey:o.modKey};if(to)p.next.id=to;
  p.last=W.start;if(/^(inc|cal_up|ladder)$/.test(o.note))p.incAt=W.start;
  if(to&&!P[to])P[to]={st:{success:0,miss:0},next:{target:o.target,sets:o.sets,weight:o.weight,note:'ladder'},first:W.start,last:W.start}})}

// Today: show the next suggestion instead of the old "+2,5 кг" hint
const _awHint=hint;hint=function(item){const c=awCls(item.exId),p=awPg()[item.exId];if(!c||!p||!p.next)return _awHint(item);const n=p.next,u=c.eq==='band'?'ур.':'кг';
 const parts=[];if(n.weight!=null&&c.eq!=='time')parts.push(awFmt(n.weight)+' '+u);if(n.target!=null)parts.push(n.target+(c.eq==='time'?' с':''));
 const up=/^(inc|cal_up|time_up|ladder)$/.test(n.note);if(!parts.length&&!n.id)return'';
 return`<div class="${up?'pr':'mut'}" style="font-size:13px">${up?'⬆ ':''}<span>Авто-вес</span>: ${parts.join(' × ')}${n.id?` → ${esc(exBy(n.id).name)}`:''}</div>`};

// «Моё оборудование» in «Ещё»
function awEquipHTML(){const e=Object.assign({},PR_EQUIP,{bands:[1]},S.equip||{}),j=a=>(a||[]).join(', ');
 return`<div class="card" id="awequip"><b>🏋️ Моё оборудование</b><p class="mut">Шаги для авто-веса. По умолчанию — как в правилах тренера; поменяй, если у тебя другие гантели или блоки.</p>
 <label class="mut">Гантели, кг (через запятую; дробные — через точку)<input id="eqdb" value="${esc(j(e.db))}"></label>
 <label class="mut">Гири, кг (через запятую; дробные — через точку)<input id="eqkb" value="${esc(j(e.kb))}"></label>
 <div class="grid2"><label class="mut">Гриф, кг<input type="number" inputmode="decimal" step="0.5" id="eqbar" value="${esc(e.bar)}"></label><label class="mut">Шаг штанги, кг<input type="number" inputmode="decimal" step="0.25" id="eqplate" value="${esc(e.plate)}"></label>
 <label class="mut">Шаг тренажёра, кг<input type="number" inputmode="decimal" step="0.5" id="eqmachine" value="${esc(e.machine)}"></label><label class="mut">Шаг блока, кг<input type="number" inputmode="decimal" step="0.5" id="eqcable" value="${esc(e.cable)}"></label></div>
 <label class="mut">Резинок дома (уровней 1–5)<input type="number" inputmode="numeric" min="1" max="5" id="eqbands" value="${esc((e.bands||[1]).length)}"></label>
 <p class="mut">Одна резинка: когда станет легко, приложение предложит взять её короче и замедлить темп.</p>
 <button class="full" id="eqsave">Сохранить оборудование</button></div>`}
function awEquipSave(){const num=v=>+String(v).replace(',','.'),list=v=>String(v).split(/[;,\s]+/).map(num).filter(x=>x>0);
 const n=Math.max(1,Math.min(5,Math.round(num($('#eqbands').value))||1));
 S.equip={db:list($('#eqdb').value),kb:list($('#eqkb').value),bar:num($('#eqbar').value)||20,plate:num($('#eqplate').value)||2.5,machine:num($('#eqmachine').value)||5,cable:num($('#eqcable').value)||2.5,bands:Array.from({length:n},(_,i)=>i+1)};
 const e=prEquip(S.equip);S.equip.db=e.db;S.equip.kb=e.kb;save();toast('Оборудование сохранено')}
const _awMore=more;more=function(){_awMore();const aw=$('#aw');const card=aw&&aw.closest?aw.closest('.card'):null;if(!card)return;
 card.insertAdjacentHTML('afterend',awEquipHTML());$('#eqsave').onclick=awEquipSave};
// P-305b: demo paywall moments (premium.js) — only after the workout is saved, never mid-set; not over the summary sheet.
function awMoment(W){if(typeof premMarkDemo==='function'){premMarkDemo(W);save()}if(typeof premMoment!=='function')return;
 setTimeout(()=>{const m=$('#modal');if(S.active||(m&&m.classList&&!m.classList.contains('hidden')))return;premMoment()},800)}
