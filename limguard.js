'use strict';
// tech-fix-2 (P1): one limitation check on every path an exercise reaches a workout.
// Paths: block plan (blocks.js planFromBlock + warm-up / cool-down), equipment swap (features.js eqSwapFor), manual swap
// (app.js swapModal), adding an exercise (pickEx / library), the ladder hint (autow.js), a saved plan opened later or after the
// limitations changed (Today card), the final check before the start (startW) and an open / resumed workout (workoutView).
// Nothing in history (S.workouts) or the working weights (S.pg) is changed. The plan or the open workout changes only after the
// user taps «Заменить безопасными»; «Оставить как есть» stores a per-item acknowledgement (limAck) for these limitations.
const LG_RU={s:'спина',k:'колени',p:'плечи'};
const lgT=x=>typeof tr==='function'?tr(x):x;
function lgLim(){return((typeof S!=='undefined'&&S&&S.prof&&Array.isArray(S.prof.lim)&&S.prof.lim)||[]).filter(l=>l in LG_RU)}
function lgA(){const p=(typeof S!=='undefined'&&S&&S.prof)||{};const places=typeof eqPlaces==='function'?eqPlaces():null;
  return Object.assign({},p,{lim:lgLim()},places?{places}:{})}
// risk letters of an exercise that hit the current limitations (META + impact cardio)
function lgConf(id){const lim=lgLim();if(!id||!lim.length||typeof blockLimConf!=='function')return[];return blockLimConf(id,{lim})}
function lgAcked(conf,ack){return!!ack&&conf.every(l=>String(ack).includes(l))}
function lgAckOf(id){const c=lgConf(id);return c.length?c.join(''):undefined}
function lgLimText(l){return(l||[]).map(x=>LG_RU[x]||x).join(', ')}
function lgLimSpans(l){return(l||[]).map(x=>`<span>${LG_RU[x]||x}</span>`).join(', ')}
function lgName(id){const e=typeof exBy==='function'?exBy(id):null;return e&&e.name&&e.name!=='?'?e.name:id}

// Items of a workout: [{i, exId, lim, to}] — to = safe replacement (same rules as the block builder) or null (left out).
// skipDone (open workout): a fully done item is left out; a partly done one is checked for its remaining sets
// (tech-fix-2.1: before, one done set hid the whole exercise) → partial:{done,left}.
function lgAuditItems(items,a,skipDone){
  a=a||lgA();if(!(a.lim||[]).length||typeof blockLimPick!=='function')return[];
  const out=[],used=new Set((items||[]).map(x=>x&&x.exId).filter(Boolean));
  (items||[]).forEach((it,i)=>{if(!it||!it.exId)return;const c=blockLimConf(it.exId,a);if(!c.length||lgAcked(c,it.limAck))return;
    let partial=null;
    if(skipDone&&Array.isArray(it.sets)){const done=it.sets.filter(s=>s&&s.done).length,left=it.sets.length-done;if(!left)return;if(done)partial={done,left}}
    const to=blockLimPick({exId:it.exId,cardio:it.cardio},a,used);if(to)used.add(to);const r={i,exId:it.exId,lim:c,to};if(partial)r.partial=partial;out.push(r)});
  return out;
}
// One plan day as the user would do it (equipment profile applied): main items + warm-up / cool-down.
function lgAuditDay(day,a){
  a=a||lgA();if(!day||!(a.lim||[]).length)return null;
  const d=typeof eqAdaptDay==='function'?eqAdaptDay(day):day;
  const items=lgAuditItems(d.items,a);
  let wucd=[],fixed=null;
  if((day.wu||day.cd)&&typeof blockLimWuCd==='function'&&!lgAcked(a.lim,day.limAckWuCd)){
    const sm={};items.forEach(x=>{if(x.to)sm[x.exId]=x.to});
    const w=[];fixed=blockLimWuCd(day.wu,day.cd,a,sm,w);wucd=w;
  }
  return items.length||wucd.length?{items,wucd,fixed}:null;
}
// tech-fix-2.1: a finished plan day is never changed by the plan check (only upcoming days are).
// Block plan (linear, S.block.next): days before S.block.next, plus a day done out of order in the current pass (history:
// same dayIdx + name, newer than the start of the pass). Plain plan of the old generator (cyclic, S.next): its days are
// templates of the coming sessions — history keeps its own copy of every done workout, so only the day of the open workout is
// locked. The open workout itself is handled by the workout card. Old data without these fields → the day counts as upcoming.
function lgHist(i){const p=S.program&&S.program[i];if(!p)return[];
  return(S.workouts||[]).filter(w=>w&&w.dayIdx===i&&w.dayName===p.name&&!w.fromTemplate&&(w.n==null||p.n==null||+w.n===+p.n))}
function lgDayLocked(i){
  if(typeof S==='undefined'||!S||!Array.isArray(S.program))return false;const p=S.program[i];if(!p)return true;
  if(S.active&&S.active.dayIdx===i&&S.active.dayName===p.name&&!S.active.fromTemplate)return'active';
  if(typeof blockActive==='function'&&blockActive()){const nx=S.block.next|0;if(i<nx)return'done';const W=lgHist(i);
    const last=Math.max(0,...lgHist(nx>0?0:S.program.length-1).map(w=>+w.start||0));
    return W.some(w=>(+w.start||0)>last)?'done':false}
  return false;
}
function lgAuditPlan(){
  if(typeof S==='undefined'||!S||!Array.isArray(S.program)||!lgLim().length)return[];
  const a=lgA(),out=[];S.program.forEach((d,i)=>{if(lgDayLocked(i))return;const r=lgAuditDay(d,a);if(r)out.push(Object.assign({d:i},r))});return out;
}
function lgLog(e){S.limLog=Array.isArray(S.limLog)?S.limLog:[];S.limLog.push(Object.assign({at:Date.now()},e));if(S.limLog.length>200)S.limLog=S.limLog.slice(-200)}
// «Заменить безопасными» for one plan day: swap / leave out the flagged items, fix warm-up / cool-down, keep a visible note.
function lgApplyDay(di,force){
  if(!force&&lgDayLocked(di))return 0;
  const day=S.program&&S.program[di];const r=day&&lgAuditDay(day);if(!r)return 0;
  if(day.est!=null&&day.est0==null&&typeof blockEstBase==='function'){const b=blockEstBase(day);if(b!=null)day.est0=b}
  const warn=Array.isArray(day.limWarn)?day.limWarn.slice():[];
  const rm=[];
  r.items.forEach(x=>{const it=day.items[x.i];if(!it)return;
    if(x.to){day.items[x.i]=Object.assign({},it,{exId:x.to,swapped:1});delete day.items[x.i].limAck}else rm.push(x.i);
    warn.push({from:x.exId,to:x.to||null,lim:x.lim,user:1});lgLog({kind:'fix',d:di,from:x.exId,to:x.to||null,lim:x.lim})});
  rm.sort((p,q)=>q-p).forEach(i=>day.items.splice(i,1));
  if(r.wucd.length&&r.fixed){if(r.fixed.wu)day.wu=r.fixed.wu;else delete day.wu;if(r.fixed.cd)day.cd=r.fixed.cd;else delete day.cd;
    r.wucd.forEach(w=>{warn.push(Object.assign({},w,{user:1}));lgLog({kind:'fix',d:di,from:w.from,to:w.to||null,lim:w.lim,part:w.part})})}
  if(warn.length)day.limWarn=warn;
  return r.items.length+r.wucd.length;
}
// «Оставить как есть»: the user keeps these exercises for the current limitations (asked again if a limitation is added).
function lgAckDay(di,force){
  if(!force&&lgDayLocked(di))return 0;
  const day=S.program&&S.program[di];const r=day&&lgAuditDay(day);if(!r)return 0;const lim=lgLim().join('');
  r.items.forEach(x=>{const it=day.items[x.i];if(it){it.limAck=x.lim.join('');lgLog({kind:'keep',d:di,ex:x.exId,lim:x.lim})}});
  if(r.wucd.length){day.limAckWuCd=lim;lgLog({kind:'keep',d:di,part:'wucd',lim:lgLim()})}
  return r.items.length+r.wucd.length;
}
function lgRowsHTML(r){
  const E=typeof esc==='function'?esc:(x=>x);
  const part=w=>w.part==='wu'?'<span>Разминка</span>: ':w.part==='cd'?'<span>Заминка</span>: ':'';
  return r.items.concat(r.wucd).map(x=>`<div>⚠ ${part(x)}<b>${E(lgName(x.exId||x.from))}</b> (${lgLimSpans(x.lim)}) → ${x.to?`<b>${E(lgName(x.to))}</b>`:`<span>безопасной замены нет — будет убрано</span>`}</div>`).join('');
}
// Today card: saved plan (made before tech-fix-2, synced from another device, or limitations changed later).
function lgPlanCardHTML(P){
  const n=P.reduce((s,x)=>s+x.items.length+x.wucd.length,0);const E=typeof esc==='function'?esc:(x=>x);
  const days=P.map(x=>`<div style="margin-top:6px"><b>${E(typeof workoutLabel==='function'?workoutLabel(S.program[x.d],x.d):'#'+(x.d+1))}</b>${lgRowsHTML(x)}</div>`).join('');
  return`<div class="card limwarn" id="lgplan"><b>⚠ <span>Проверка ограничений</span></b> <span class="mut">(${lgLimSpans(lgLim())}) · ${n}</span>
<p class="mut" style="margin:6px 0"><span>Некоторые упражнения программы не подходят к твоим ограничениям.</span> <span>Без твоего согласия ничего не меняется. История и рабочие веса сохраняются.</span> <span>Завершённые тренировки не меняются.</span></p>
<details><summary><span>Показать</span></summary><div style="font-size:13px">${days}</div></details>
<button class="pri full" id="lgfixall" style="margin-top:8px">Заменить безопасными</button><button class="full" id="lgkeepall" style="margin-top:6px">Оставить как есть</button></div>`;
}
const LG_KEEP_Q='Оставить эти упражнения? Они отмечены как рискованные при твоих ограничениях. Лучше сначала посоветоваться с врачом или тренером.';
function lgFixAll(){const P=lgAuditPlan();let n=0;P.forEach(x=>{n+=lgApplyDay(x.d)});if(n&&typeof save==='function')save();return n}
function lgKeepAll(){const P=lgAuditPlan();let n=0;P.forEach(x=>{n+=lgAckDay(x.d)});if(n&&typeof save==='function')save();return n}
function lgMountToday(){
  if(typeof S==='undefined'||!S||S.active||typeof app==='undefined'||!app||!app.insertAdjacentHTML)return;
  if(typeof document!=='undefined'&&document.getElementById&&document.getElementById('lgplan')&&document.getElementById('lgplan').isConnected)return;
  const P=lgAuditPlan();if(!P.length)return;
  app.insertAdjacentHTML('afterbegin',lgPlanCardHTML(P));
  const f=$('#lgfixall');if(f)f.onclick=()=>{const n=lgFixAll();if(typeof toast==='function')toast(lgT('Программа исправлена')+': '+n);today(TSEL!=null&&TOPEN?TSEL:undefined)};
  const k=$('#lgkeepall');if(k)k.onclick=()=>{if(typeof confirm==='function'&&!confirm(lgT(LG_KEEP_Q)))return;lgKeepAll();today(TSEL!=null&&TOPEN?TSEL:undefined)};
}
if(typeof today==='function'){const _lgToday=today;today=function(sel){const r=_lgToday(sel);try{lgMountToday()}catch(e){}return r}}

// Final check before the start: the set of exercises the user will really do (after the equipment swap).
let LG_PENDING=null;
function lgStartModal(i,r){
  const m=typeof $==='function'&&$('#modal');LG_PENDING={i};if(!m)return;m.classList.remove('hidden');
  m.innerHTML=`<div class="sheet" id="lgstart"><h2 style="margin-top:0">⚠ <span>Проверка ограничений</span></h2><p class="mut"><span>В этой тренировке есть упражнения, которые не подходят к твоим ограничениям.</span> (${lgLimSpans(lgLim())})</p>
<div style="font-size:14px">${lgRowsHTML(r)}</div><p class="mut" style="font-size:13px"><span>История и рабочие веса сохраняются.</span></p>
<button class="pri full" id="lgsfix">Заменить и начать</button><button class="full" id="lgskeep" style="margin-top:6px">Начать без изменений</button><button class="full" id="lgscancel" style="margin-top:6px">Отмена</button></div>`;
  const close=()=>m.classList.add('hidden');
  $('#lgsfix').onclick=()=>{close();lgStartFix(i)};
  $('#lgskeep').onclick=()=>{if(typeof confirm==='function'&&!confirm(lgT(LG_KEEP_Q)))return;close();lgStartKeep(i)};
  $('#lgscancel').onclick=()=>{close();LG_PENDING=null};
}
let LG_GO=false;
// tech-fix-2.1: starting a finished day again (opened from the list) → the decision goes into this workout only; the plan day
// of the finished part of the block stays as it was.
function lgStartWith(i,fn){
  const locked=lgDayLocked(i)==='done',orig=S.program[i];
  if(locked)S.program[i]=JSON.parse(JSON.stringify(orig));
  fn(i,true);if(typeof save==='function')save();LG_GO=true;
  try{startW(i)}finally{LG_GO=false;LG_PENDING=null;if(locked){S.program[i]=orig;if(typeof save==='function')save()}}
}
function lgStartFix(i){lgStartWith(i,lgApplyDay)}
function lgStartKeep(i){lgStartWith(i,lgAckDay)}
if(typeof startW==='function'){const _lgSW=startW;startW=function(i){
  if(!LG_GO&&!(typeof S!=='undefined'&&S&&S.active)){const day=S.program&&S.program[i];const r=day&&lgAuditDay(day);if(r){lgStartModal(i,r);return}}
  return _lgSW(i)}}

// Open / resumed workout (also a template or own workout): flagged items that are not done yet; consent per item.
function lgAuditActive(){const A=typeof S!=='undefined'&&S&&S.active;if(!A)return[];return lgAuditItems(A.items,lgA(),true)}
// Partly done item: done sets keep their exId / weights; 'stop' drops the remaining sets, 'split' moves them into a new
// item with the safe replacement (swap → split, remove → stop for a partly done item).
function lgActiveFix(k,mode){
  const A=S.active;if(!A)return false;const L=lgAuditActive();const x=L.find(y=>y.i===k);if(!x)return false;const it=A.items[k];
  if(x.partial&&mode!=='keep'){
    const done=it.sets.filter(s=>s&&s.done),left=it.sets.length-done.length;
    if(x.to&&(mode==='split'||mode==='swap')){
      const l=S.autoW!==false&&typeof lastSets==='function'?lastSets(x.to,A.id):null;
      const n={exId:x.to,ns:left,rest:it.rest,min:it.min,max:it.max,sec:it.sec?1:0,limFrom:it.exId,swapped:1,
        sets:Array.from({length:left},(_,j)=>{const p=l&&(l[j]||l[l.length-1]);return{w:p?p.w:'',r:p?p.r:it.max,pf:!!p,done:false}})};
      it.sets=done;A.items.splice(k+1,0,n);lgLog({kind:'split',active:A.id,from:x.exId,to:x.to,lim:x.lim,done:done.length,left})}
    else{it.sets=done;it.limStop=1;lgLog({kind:'stop',active:A.id,ex:x.exId,lim:x.lim,done:done.length,left})}
    if(typeof save==='function')save();return true;
  }
  if(mode==='keep'){it.limAck=x.lim.join('');lgLog({kind:'keep',active:A.id,ex:x.exId,lim:x.lim})}
  else if(x.to&&mode!=='remove'){it.exId=x.to;delete it.sug;delete it.awx;const l=S.autoW!==false&&typeof lastSets==='function'?lastSets(x.to,A.id):null;
    it.sets.forEach((s,j)=>{if(!s.done){const p=l&&(l[j]||l[l.length-1]);s.w=p?p.w:'';if(p)s.r=p.r;s.pf=!!p}});lgLog({kind:'fix',active:A.id,from:x.exId,to:x.to,lim:x.lim})}
  else{A.items.splice(k,1);lgLog({kind:'fix',active:A.id,from:x.exId,to:null,lim:x.lim})}
  if(typeof save==='function')save();return true;
}
function lgActiveHTML(L){const E=typeof esc==='function'?esc:(x=>x);
  return`<div class="card limwarn" id="lgaw"><b>⚠ <span>Проверка ограничений</span></b> <span class="mut">(${lgLimSpans(lgLim())})</span><p class="mut" style="margin:6px 0"><span>В этой тренировке есть упражнения, которые не подходят к твоим ограничениям.</span></p>
${L.map(x=>x.partial?`<div class="row" style="margin:4px 0;flex-wrap:wrap"><span class="grow"><b>${E(lgName(x.exId))}</b> · <span>выполнено</span> ${x.partial.done}/${x.partial.done+x.partial.left}${x.to?` → ${E(lgName(x.to))}`:` — <span>безопасной замены нет</span>`}</span>${x.to?`<button class="sm" data-lgas="${x.i}">Заменить остаток</button>`:''}<button class="sm" data-lgat="${x.i}">Остановить</button><button class="sm" data-lgak="${x.i}">Оставить</button></div>`
  :`<div class="row" style="margin:4px 0;flex-wrap:wrap"><span class="grow"><b>${E(lgName(x.exId))}</b>${x.to?` → ${E(lgName(x.to))}`:` — <span>безопасной замены нет</span>`}</span>${x.to?`<button class="sm" data-lgaw="${x.i}">Заменить</button>`:`<button class="sm" data-lgar="${x.i}">Убрать</button>`}<button class="sm" data-lgak="${x.i}">Оставить</button></div>`).join('')}
${L.some(x=>x.partial)?'<p class="mut" style="margin:6px 0 0;font-size:13px"><span>Выполненные подходы и веса сохраняются.</span></p>':''}</div>`}
if(typeof workoutView==='function'){const _lgWV=workoutView;workoutView=function(){const r=_lgWV.apply(this,arguments);
  try{const L=lgAuditActive();if(L.length&&typeof app!=='undefined'&&app&&app.insertAdjacentHTML&&!(app.querySelector&&app.querySelector('#lgaw'))){app.insertAdjacentHTML('afterbegin',lgActiveHTML(L));
    app.querySelectorAll('[data-lgaw]').forEach(b=>b.onclick=()=>{lgActiveFix(+b.dataset.lgaw,'swap');workoutView()});
    app.querySelectorAll('[data-lgar]').forEach(b=>b.onclick=()=>{lgActiveFix(+b.dataset.lgar,'remove');workoutView()});
    app.querySelectorAll('[data-lgas]').forEach(b=>b.onclick=()=>{lgActiveFix(+b.dataset.lgas,'split');workoutView()});
    app.querySelectorAll('[data-lgat]').forEach(b=>b.onclick=()=>{lgActiveFix(+b.dataset.lgat,'stop');workoutView()});
    app.querySelectorAll('[data-lgak]').forEach(b=>b.onclick=()=>{if(typeof confirm==='function'&&!confirm(lgT(LG_KEEP_Q)))return;lgActiveFix(+b.dataset.lgak,'keep');workoutView()})}}catch(e){}
  return r}}
// tech-fix-2.1: going on with a flagged exercise (workout list ✓ or the exercise screen «+») asks first, once per exercise.
const LG_GO_Q='Это упражнение отмечено как рискованное при твоих ограничениях. Продолжить подходы? Лучше заменить его или остановиться.';
if(typeof setDone==='function'){const _lgSD=setDone;setDone=function(it,k){
  try{const A=typeof S!=='undefined'&&S&&S.active;if(A&&it&&it.exId&&Array.isArray(A.items)&&A.items.includes(it)){const c=lgConf(it.exId);
    if(c.length&&!lgAcked(c,it.limAck)&&typeof confirm==='function'){if(!confirm(lgT(LG_GO_Q)))return;it.limAck=c.join('');lgLog({kind:'keep',active:A.id,ex:it.exId,lim:c,at_set:k})}}}catch(e){}
  return _lgSD(it,k)}}
// Adding an exercise by hand (program editor, open workout, library, template): risky ones are marked and need a confirm.
function lgConfirmAdd(id){const c=lgConf(id);if(!c.length)return true;
  return typeof confirm!=='function'||confirm(lgT('Упражнение отмечено как рискованное при твоих ограничениях')+' ('+c.map(l=>lgT(LG_RU[l])).join(', ')+'). '+lgT('Добавить всё равно?'))}
