'use strict';
// D-235: exercise screen. Tap a row on «Сегодня» (warm-up, main, cool-down) -> one screen per exercise:
// MoveKit video, target reps/time, rest timer, sets done, set logging into the SAME S.active.items[].sets (history format unchanged).
// Warm-up/cool-down have no sets/rest in the trainer data: sets are read from the dose («2 × 20–30 с»), otherwise 1; rest 20 s (warm-up) / 30 s (cool-down).
const EX_WU_REST=20,EX_CD_REST=30;
let EXS=null,exInt=null;
function exDay(){const A=S.active;if(A)return{A,sel:A.dayIdx,d:(S.program&&S.program[A.dayIdx])||{items:[]}};
 const n=S.program.length,sel=TSEL!=null&&TSEL<n?TSEL:S.next%n,d0=S.program[sel];return{A:null,sel,d:typeof eqAdaptDay==='function'?eqAdaptDay(d0):d0}}
function exLegacyWu(P){return warmItems(P).map(it=>({id:it.ramp?P.main:wuId(it),n:it.ramp?'Подводящий подход: '+exBy(P.main).name:it.n,d:it.d,x:it.x||''}))}
function exWuRows(d,A){if(A){if(!A.warm)return[];return A.warm.t?wuRows(A.warm.wu):exLegacyWu(A.warm.P)}
 if(!d)return[];return d.wu?wuRows(d.wu):exLegacyWu(warmPlan(d,S.prof))}
function exCdRows(d,A){if(A)return A.cool?cdRows(A.cool.cd):[];return d&&d.cd?cdRows(d.cd):[]}
function exList(){const{A,d}=exDay(),L=[];
 exWuRows(d,A).forEach((r,i)=>L.push({src:'w',i,id:r.id,r}));
 ((A?A.items:d.items)||[]).forEach((it,i)=>L.push({src:'m',i,id:it.exId,it}));
 exCdRows(d,A).forEach((r,i)=>L.push({src:'c',i,id:r.id,r}));return L}
function exSide(id,txt){if(/каждой ногой|кажд\S* ногу/.test(txt||''))return'на каждую ногу';if(/кажд\S* сторон/.test(txt||''))return'на каждую сторону';if(/кажд\S* рук/.test(txt||''))return'на каждую руку';
 if(!txt&&typeof UNI!=='undefined'&&UNI.has(id)){const g=exBy(id).group;return g==='Ноги'||g==='Ягодицы'?'на каждую ногу':'на каждую сторону'}return''}
// dose text of a warm-up/cool-down row -> {sets, val, unit:'reps'|'sec'|'min'}
function exDose(t){t=String(t||'');let sets=1,m=/^(\d+)\s*×\s*(.*)$/.exec(t);if(m&&!/%/.test(t)){sets=+m[1];t=m[2]}
 const tm=/(\d+(?:–\d+)?)\s*(с|мин)(?![а-яё])/.exec(t);if(tm)return{sets,val:tm[1],unit:tm[2]==='мин'?'min':'sec'};
 const r=/×\s*(\d+(?:–\d+)?)\s*$/.exec(t)||/^(\d+(?:–\d+)?)/.exec(t);return{sets,val:r?r[1]:'',unit:'reps'}}
// compact dose for the row, same look as main «2×8–12»: «1×10», «2×20–30 с», «5 мин»
function exShort(t){const ds=exDose(t);if(!ds.val||/%/.test(String(t||'')))return String(t||'');const u=ds.unit==='sec'?' с':ds.unit==='min'?' мин':'';return ds.unit==='min'&&ds.sets===1?ds.val+u:ds.sets+'×'+ds.val+u}
function exNoW(id,it){if(isCardio(id)||(it&&it.sec))return true;if(typeof BWX!=='undefined'&&BWX.has(id))return true;const c=typeof awCls==='function'?awCls(id):null;return!!(c&&(c.eq==='bodyweight'||c.eq==='time'))}
function exClock(s){s=Math.max(0,Math.round(+s||0));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function exInfo(e){const{A}=exDay();
 if(e.src==='m'){const it=e.it,c=isCardio(e.id),plan=it.ns||(Array.isArray(it.sets)?it.sets.length:+it.sets||0),done=A?it.sets.filter(s=>s.done).length:0;
  const rng=it.min==it.max?String(it.min):it.min+'–'+it.max,side=exSide(e.id,'');
  return{rng,cap:c?'Минут':it.sec?(side?'Секунд '+side:'Секунд'):(side?'Повторов '+side:'Повторов'),rest:c?0:+it.rest||0,done,plan,noW:exNoW(e.id,it),unit:c?'min':it.sec?'sec':'reps'}}
 const ds=exDose(e.r.d),box=A&&(e.src==='w'?A.warm:A.cool),side=exSide(e.id,e.r.d);
 const done=box?((box.n&&box.n[e.i])||(box.c&&box.c[e.i]?ds.sets:0)):0;
 return{rng:ds.val||'—',cap:(ds.unit==='min'?'Минут':ds.unit==='sec'?'Секунд':'Повторов')+(side?' '+side:''),rest:e.src==='w'?EX_WU_REST:EX_CD_REST,done,plan:ds.sets,noW:true,unit:ds.unit,dose:e.r.d}}
function exRecW(e){if(e.src!=='m')return'';const it=e.it;if(exNoW(e.id,it))return'';const A=S.active;
 let w=null;if(A&&it.sug&&it.sug.weight!=null)w=it.sug.weight;
 if(w==null&&typeof awSuggest==='function'&&!A){try{const s=awSuggest({exId:it.exId,ns:it.sets,min:it.min,max:it.max,sets:[]},null);if(s&&s.weight!=null)w=s.weight}catch(x){}}
 if(w==null){const l=lastSets(e.id,A&&A.id);if(l&&l.length)w=Math.max(...l.map(s=>+s.w||0))||null}
 return w!=null?`<span>Рекомендуемый вес</span>: <b>${esc(String(w))}</b> <span>кг</span>`:'<span>Подбери вес, с которым последние 2 повтора даются тяжело</span>'}
function exHist(id){const out=[];const W=histWorkouts();for(let i=W.length-1;i>=0&&out.length<3;i--){const w=W[i];if(S.active&&w.id===S.active.id)continue;const it=(w.items||[]).find(x=>x.exId===id);const L=it?it.sets.filter(s=>s.done):[];if(!L.length)continue;
  out.push(`<div class="li"><span class="mut" style="min-width:64px">${esc(new Date(w.start).toLocaleDateString(typeof LOC!=='undefined'?LOC:'ru'))}</span><span class="grow">${L.map(s=>esc((+s.w?s.w+' × ':'')+s.r)).join(' · ')}</span></div>`)}
 return out.length?out.join(''):'<p class="mut">Пока нет записей.</p>'}
function exOpen(src,i){const L=exList();const pos=L.findIndex(e=>e.src===src&&e.i===i);if(pos<0)return;EXS={pos,src,i,id:L[pos].id,cm:''};go('ex')}
function exStop(){clearInterval(exInt);exInt=null;const v=app&&app.querySelector&&app.querySelector('#exv video.a3d');if(v&&typeof stopAnim==='function')stopAnim(v)}
function exStart(){const{sel}=exDay();if(S.active)return;startW(sel);const L=exList();let p=L.findIndex(e=>e.src===EXS.src&&e.id===EXS.id);if(p<0)p=Math.min(EXS.pos,L.length-1);EXS.pos=p;EXS.src=L[p].src;EXS.i=L[p].i;view='ex';exView()}
function exLog(){const num=v=>v===''?'':+String(v).replace(',','.'),wv=$('#exw')?num($('#exw').value):'',rv=$('#exr')?num($('#exr').value):'';
 if(!S.active)exStart();const A=S.active,L=exList(),e=L[EXS.pos];if(!A||!e)return;
 if(e.src==='m'){const it=A.items[e.i],noW=exNoW(e.id,it);
  let k=it.sets.findIndex(s=>!s.done);if(k<0){const l=it.sets[it.sets.length-1]||{w:'',r:''};it.sets.push({w:l.w,r:l.r,done:false});k=it.sets.length-1}
  const s=it.sets[k];if(!noW&&wv!=='')s.w=wv;else if(noW&&s.w==='')s.w=0;if(rv!=='')s.r=rv;if(EXS.cm){s.cm=EXS.cm.slice(0,200);EXS.cm=''}setDone(it,k)}
 else{const box=e.src==='w'?A.warm:A.cool;if(!box)return;const inf=exInfo(e);box.n=box.n||[];box.n[e.i]=(box.n[e.i]||0)+1;if(box.n[e.i]>=inf.plan)box.c[e.i]=true;startTimer(inf.rest)}
 save();
 // D-244 (Eduards 19.11): planned sets done -> open the next exercise right away (warm-up -> main -> cool-down); the rest bar keeps running.
 // Last exercise -> back to the workout with «Завершить».
 const L2=exList(),e2=L2[EXS.pos],i2=e2&&exInfo(e2);
 if(i2&&i2.plan&&i2.done===i2.plan){if(EXS.pos<L2.length-1){EXS.pos++;EXS.cm='';exView();scrollTo(0,0);return}exStop();EXS=null;go('today');toast('Тренировка выполнена 💪 Нажми «Завершить»');return}
 exView()}
function exView(){exStop();const L=exList();if(!EXS||!L.length){view='today';return render()}
 if(EXS.pos>=L.length)EXS.pos=L.length-1;const e=L[EXS.pos];EXS.src=e.src;EXS.i=e.i;EXS.id=e.id;const A=S.active,inf=exInfo(e),id=e.id,ex=id?exBy(id):{name:e.r.n,group:''};
 const grp=e.src==='w'?'Разминка':e.src==='c'?'Заминка':ex.group,name=e.src==='m'?ex.name:e.r.n,it=e.src==='m'?(A?A.items[e.i]:e.it):null;
 const nx=A&&it?(it.sets.find(s=>!s.done)||it.sets[it.sets.length-1]||{}):(()=>{const l=e.src==='m'?lastSets(id):null;return l?l[0]:{w:'',r:it?it.max:''}})();
 $('#title').textContent='Упражнение';
 app.innerHTML=`<div class="exhead row"><button class="sm" id="exback" aria-label="Назад">←</button><b class="grow">${(()=>{const sec=L.filter(x=>x.src===e.src);return(sec.indexOf(e)+1)+'/'+sec.length})()} <span>${esc(grp)}</span></b>${A?'':'<button class="pri sm" id="exgo">Начать</button>'}</div>
 <div class="exvid" id="exv">${id&&typeof animMedia==='function'?animMedia(id)||'<div class="exnov mut">Видео пока нет</div>':'<div class="exnov mut">Видео пока нет</div>'}<div class="exside">${e.src==='m'&&altCands(id).length?'<button class="exico" id="exsw" aria-label="Заменить">⇄</button>':''}${id&&TECH[id]?`<button class="exico" data-ti="${id}" aria-label="Техника">ⓘ</button>`:''}</div></div>
 <h2 class="exname">${esc(name)}</h2>${e.src==='m'?(()=>{const r=exRecW(e);return r?`<div class="mut exrec"><span>${r}</span><button class="linkb" id="exrwi" aria-label="Как считается вес">ⓘ</button></div>`:''})():`<div class="mut exrec"><span>${esc(inf.dose||'')}</span>${e.r.x?` · <span>${esc(e.r.x)}</span>`:''}</div>`}
 <div class="excircs"><div class="excirc"><b>${esc(inf.rng)}</b><span>${esc(inf.cap)}</span></div><div class="exrestw"><button class="excirc" id="exrest" ${inf.rest?'':'disabled'}><b id="exrt">${inf.rest?exClock(inf.rest):'—'}</b><span>Отдых</span></button><div class="exrestc" id="exrc" hidden><button class="sm" id="exm15" aria-label="−15 с">−15</button><button class="sm" id="exp15" aria-label="+15 с">+15</button><button class="sm" id="exskip" aria-label="Пропустить отдых">✕</button></div></div><div class="excirc ${inf.plan&&inf.done>=inf.plan?'exdone':''}" id="exsets"><b>${inf.done}/${inf.plan}</b><span>Подходов выполнено</span></div></div>
 ${e.src==='m'?`<div class="exlog row">${inf.noW?'':`<label class="grow">Килограммы<input id="exw" type="number" inputmode="decimal" step="0.5" value="${esc(nx.w==null?'':nx.w)}"></label>`}<label class="grow">${inf.unit==='min'?'Минуты':inf.unit==='sec'?'Секунды':'Повторы'}<input id="exr" type="number" inputmode="numeric" value="${esc(nx.r==null?'':nx.r)}"></label><button class="pri exadd" id="exadd" aria-label="Записать подход">+</button></div>
 <button class="linkb" id="excm">${EXS.cm?'✎ '+esc(EXS.cm):'Добавить комментарий к подходу'}</button>`:`<button class="pri full" id="exadd" style="margin-top:12px">+ <span>Подход выполнен</span></button>`}
 ${e.src==='m'&&A&&it.sets.some(s=>s.done)?`<h3 style="margin-top:14px">Сегодня</h3>${it.sets.filter(s=>s.done).map((s,k)=>`<div class="li"><span class="mut">${k+1}</span><span class="grow">${esc((+s.w?s.w+' кг × ':'')+s.r)}</span>${s.cm?`<span class="mut">${esc(s.cm)}</span>`:''}</div>`).join('')}`:''}
 ${id?`<h3 style="margin-top:14px">История</h3>${exHist(id)}`:''}
 <div class="row" style="margin:16px 0"><button class="grow" id="exprev" ${EXS.pos?'':'disabled'}>← <span>Предыдущее</span></button><button class="grow" id="exnext" ${EXS.pos<L.length-1?'':'disabled'}><span>Следующее</span> →</button></div>`;
 const v=app.querySelector('#exv video.a3d');if(v&&typeof startAnim==='function')startAnim(v);
 $('#exback').onclick=()=>{exStop();EXS=null;go('today')};const g=$('#exgo');if(g)g.onclick=exStart;
 $('#exadd').onclick=exLog;const ri=$('#exrwi');if(ri)ri.onclick=()=>toast('Вес — из авто-веса программы и твоих прошлых подходов');const rb=$('#exrest');if(rb)rb.onclick=()=>{if(inf.rest)startTimer(inf.rest)};
 const cm=$('#excm');if(cm)cm.onclick=()=>{const t=prompt('Комментарий к подходу',EXS.cm||'');if(t!=null){EXS.cm=String(t).trim();exView()}};
 const sw=$('#exsw');if(sw)sw.onclick=()=>swapModal(id,S.prof,nid=>{if(A){const x=A.items[e.i];x.exId=nid;const l=S.autoW!==false?lastSets(nid,A.id):null;x.sets.forEach((s,k)=>{if(!s.done){const p=l&&(l[k]||l[l.length-1]);s.w=p?p.w:'';if(p)s.r=p.r;s.pf=!!p}})}else{const{sel}=exDay();const pi=S.program[sel]&&S.program[sel].items[e.i];if(pi)pi.exId=nid}save();exView()});
 $('#exprev').onclick=()=>{if(EXS.pos>0){EXS.pos--;EXS.cm='';exView();scrollTo(0,0)}};$('#exnext').onclick=()=>{if(EXS.pos<L.length-1){EXS.pos++;EXS.cm='';exView();scrollTo(0,0)}};
 const upd=()=>{const el=document.getElementById('exrt');if(!el){clearInterval(exInt);return}const left=tEnd?Math.ceil((tEnd-Date.now())/1000):0;el.textContent=left>0?exClock(left):(inf.rest?exClock(inf.rest):'—');const b=document.getElementById('exrest');if(b)b.classList.toggle('run',left>0);const rc=document.getElementById('exrc');if(rc)rc.hidden=!(left>0)};upd();exInt=setInterval(upd,500);
 // D-245: on this screen the «Отдых» circle is the only rest countdown (shared tEnd); the bottom bar is hidden via body.exv
 const m=$('#exm15'),pl=$('#exp15'),sk=$('#exskip');if(m)m.onclick=()=>{timerAdd(-15);upd()};if(pl)pl.onclick=()=>{timerAdd(15);upd()};if(sk)sk.onclick=()=>{stopTimer();upd()};exBody(true)}
function exBody(on){const b=typeof document!=='undefined'&&document.body;if(b&&b.classList)b.classList.toggle('exv',!!on)}
(function exHook(){const _r=render;render=function(){if(view!=='ex'){exStop();exBody(false)}if(view==='ex'&&S.goal&&S.program&&S.program.length)return exView();return _r()};
 if(typeof document!=='undefined'&&document.addEventListener)document.addEventListener('click',ev=>{const t=ev.target;if(!t||!t.closest)return;if(t.closest('button,input,a,summary,label,select,textarea'))return;const r=t.closest('[data-exo]');if(!r||view==='ex')return;const[src,i]=String(r.dataset.exo).split(',');ev.preventDefault();exOpen(src,+i)})})();
