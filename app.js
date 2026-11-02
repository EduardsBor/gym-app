'use strict';
const $=s=>document.querySelector(s), app=$('#app');
const GROUPS=['Грудь','Спина','Ноги','Плечи','Бицепс','Трицепс','Пресс','Кардио'];
const EX=[['bp','Жим штанги лёжа','Грудь'],['dbp','Жим гантелей лёжа','Грудь'],['ibp','Жим штанги на наклонной','Грудь'],['idb','Жим гантелей на наклонной','Грудь'],['fly','Разводка гантелей','Грудь'],['cc','Сведение в кроссовере','Грудь'],['dip','Отжимания на брусьях','Грудь'],['pu','Отжимания от пола','Грудь'],
['dl','Становая тяга','Спина'],['pull','Подтягивания','Спина'],['lat','Тяга верхнего блока','Спина'],['row','Тяга штанги в наклоне','Спина'],['dbr','Тяга гантели одной рукой','Спина'],['cr','Тяга горизонтального блока','Спина'],['hyp','Гиперэкстензия','Спина'],['shr','Шраги','Спина'],
['sq','Приседания со штангой','Ноги'],['fsq','Фронтальные приседания','Ноги'],['lp','Жим ногами','Ноги'],['rdl','Румынская тяга','Ноги'],['lun','Выпады с гантелями','Ноги'],['bss','Болгарские сплит-приседания','Ноги'],['le','Разгибание ног','Ноги'],['lc','Сгибание ног','Ноги'],['ht','Ягодичный мост','Ноги'],['calf','Подъём на носки','Ноги'],['gsq','Гоблет-присед','Ноги'],
['ohp','Жим штанги стоя','Плечи'],['dsp','Жим гантелей сидя','Плечи'],['lr','Махи гантелями в стороны','Плечи'],['rfly','Махи в наклоне','Плечи'],['fp','Тяга каната к лицу','Плечи'],['ur','Тяга штанги к подбородку','Плечи'],
['bc','Подъём штанги на бицепс','Бицепс'],['dbc','Подъём гантелей на бицепс','Бицепс'],['hc','Молотки','Бицепс'],['pc','Сгибания на скамье Скотта','Бицепс'],
['cgb','Жим узким хватом','Трицепс'],['tpd','Разгибание на блоке','Трицепс'],['skull','Французский жим','Трицепс'],['ote','Разгибание из-за головы','Трицепс'],
['pl','Планка','Пресс'],['cru','Скручивания','Пресс'],['hlr','Подъём ног в висе','Пресс'],['abw','Ролик для пресса','Пресс'],['rt','Русский твист','Пресс'],
['tm','Беговая дорожка','Кардио'],['bike','Велотренажёр','Кардио'],['ell','Эллипс','Кардио'],['rowm','Гребной тренажёр','Кардио'],['stair','Степпер','Кардио']].map(([id,name,group])=>({id,name,group}));
const GOALS={mass:'Масса',str:'Сила',loss:'Похудение'};
// Шаблоны сплитов: c = базовое (многосуставное), a = изолирующее
const SPLITS={
2:[['Фулбоди A',[['sq','c'],['bp','c'],['row','c'],['ohp','c'],['rdl','c'],['lr','a'],['bc','a'],['tpd','a']]],['Фулбоди B',[['dl','c'],['ibp','c'],['lat','c'],['lp','c'],['dsp','c'],['lc','a'],['hc','a'],['hlr','a']]]],
3:[['Фулбоди A',[['sq','c'],['bp','c'],['row','c'],['lr','a'],['bc','a'],['cru','a']]],['Фулбоди B',[['dl','c'],['ohp','c'],['lat','c'],['idb','c'],['lc','a'],['tpd','a']]],['Фулбоди C',[['lp','c'],['dbp','c'],['cr','c'],['rdl','c'],['fp','a'],['hc','a'],['calf','a']]]],
4:[['Верх A',[['bp','c'],['row','c'],['ohp','c'],['lat','c'],['bc','a'],['tpd','a']]],['Низ A',[['sq','c'],['rdl','c'],['lp','c'],['lc','a'],['calf','a'],['pl','a']]],['Верх B',[['ibp','c'],['pull','c'],['dsp','c'],['cr','c'],['lr','a'],['hc','a'],['skull','a']]],['Низ B',[['dl','c'],['bss','c'],['ht','c'],['le','a'],['calf','a'],['hlr','a']]]],
5:[['Жим (грудь, плечи, трицепс)',[['bp','c'],['ohp','c'],['idb','c'],['lr','a'],['tpd','a']]],['Тяга (спина, бицепс)',[['dl','c'],['pull','c'],['cr','c'],['fp','a'],['bc','a']]],['Ноги',[['sq','c'],['rdl','c'],['lp','c'],['lc','a'],['calf','a']]],['Верх',[['dbp','c'],['row','c'],['dsp','c'],['lat','c'],['hc','a'],['skull','a']]],['Низ',[['fsq','c'],['ht','c'],['bss','c'],['le','a'],['hlr','a']]]]};
// Параметры по цели (см. «Научная основа»)
const PRM={str:{c:[5,3,5,180],a:[3,6,10,120]},mass:{c:[4,6,10,150],a:[3,10,15,90]},loss:{c:[3,10,15,90],a:[3,12,15,60]}};
function buildProgram(goal,days){const p=PRM[goal];return SPLITS[days].map(([name,list])=>{
 let items=list.map(([exId,t])=>{const [sets,min,max,rest]=p[t];return{exId,sets:(days<=2&&goal!=='loss'&&t==='c')?sets:sets,min,max,rest}});
 if(goal==='loss')items.push({exId:['tm','bike','ell','rowm','stair'][Math.floor(Math.random()*5)],sets:1,min:20,max:30,rest:0});
 return{name,items}})}
let S=JSON.parse(localStorage.getItem('gym')||'null')||{custom:[],workouts:[],next:0};
const save=()=>localStorage.setItem('gym',JSON.stringify(S));
const allEx=()=>EX.concat(S.custom), exBy=id=>allEx().find(e=>e.id===id)||{name:'?',group:''};
const isCardio=id=>exBy(id).group==='Кардио';
const e1rm=(w,r)=>r>0?w*(1+r/30):0, fmtT=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.append(d);setTimeout(()=>d.remove(),2600)}
let view='today';
function go(v){view=v;document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));render();scrollTo(0,0)}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>go(b.dataset.v));
function render(){$('#nav').classList.toggle('hidden',!S.goal);if(!S.goal)return onboarding();
 if(S.active&&view==='today')return workoutView();({today,program,progress,history,more,science,library}[view])()}
// ---------- Онбординг
let ob={goal:'mass',days:3};
function onboarding(){$('#title').textContent='Добро пожаловать';
 app.innerHTML=`<p class="mut">Выбери цель и сколько раз в неделю ты тренируешься. Программа составится автоматически на основе научных данных — потом её можно менять.</p>
 <h2>Цель</h2><div class="opts">${Object.entries({mass:['💪 Масса','Рост мышц: 6–15 повторов, 10–20 подходов на мышцу в неделю'],str:['🏋️ Сила','Тяжёлые веса: 3–6 повторов, отдых 3 мин'],loss:['🔥 Похудение','Силовые 10–15 повторов + кардио 20–30 мин']}).map(([k,[t,d]])=>`<button class="opt ${ob.goal===k?'sel':''}" data-g="${k}"><b>${t}</b><br><span class="mut">${d}</span></button>`).join('')}</div>
 <h2>Тренировок в неделю</h2><div class="opts c4">${[2,3,4,5].map(n=>`<button class="opt ${ob.days===n?'sel':''}" data-d="${n}" style="text-align:center"><b>${n}</b></button>`).join('')}</div>
 <p class="mut">${ob.days<=3?'Фулбоди — каждая мышца ~'+ob.days+' раза в неделю':ob.days==4?'Верх/Низ — каждая мышца 2 раза в неделю':'Жим/Тяга/Ноги + Верх/Низ — каждая мышца ~2 раза в неделю'}</p>
 <button class="pri full" id="obgo" style="margin-top:16px">Создать программу</button>
 <button class="full" style="margin-top:8px" id="obsci">📚 Научная основа</button>`;
 app.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{ob.goal=b.dataset.g;onboarding()});
 app.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{ob.days=+b.dataset.d;onboarding()});
 $('#obsci').onclick=()=>{S.goal=null;science(true)};
 $('#obgo').onclick=()=>{S.goal=ob.goal;S.days=ob.days;S.program=buildProgram(ob.goal,ob.days);S.next=0;save();go('today')}}
// ---------- Сегодня
function lastSets(exId,beforeId){for(let i=S.workouts.length-1;i>=0;i--){const w=S.workouts[i];if(w.id===beforeId)continue;const it=w.items.find(x=>x.exId===exId);if(it&&it.sets.some(s=>s.done))return it.sets.filter(s=>s.done)}return null}
function hint(item){const l=lastSets(item.exId);if(!l||isCardio(item.exId))return'';
 if(l.length>=item.sets&&l.every(s=>s.r>=item.max))return`<div class="pr" style="font-size:13px">⬆ В прошлый раз все подходы на ${item.max}+ — добавь вес (+2,5 кг)</div>`;return''}
function today(){$('#title').textContent='Сегодня';const d=S.program[S.next%S.program.length];
 const wk=S.workouts.filter(w=>Date.now()-w.start<7*864e5).length;
 app.innerHTML=`<div class="card"><div class="mut">${GOALS[S.goal]} · ${S.days}× в неделю · на этой неделе: ${wk}/${S.days}</div><h2 style="margin-top:6px">${esc(d.name)}</h2>
 ${d.items.map(it=>`<div class="li"><div class="grow">${esc(exBy(it.exId).name)}${hint(it)}</div><span class="mut">${isCardio(it.exId)?it.min+'–'+it.max+' мин':it.sets+'×'+it.min+'–'+it.max}</span></div>`).join('')}
 <button class="pri full" id="start" style="margin-top:14px">▶ Начать тренировку</button></div>
 <h2>Или выбрать другой день</h2>${S.program.map((p,i)=>`<button class="full" style="margin:4px 0" data-i="${i}">${esc(p.name)}</button>`).join('')}`;
 $('#start').onclick=()=>startW(S.next%S.program.length);app.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>startW(+b.dataset.i))}
function startW(i){const d=S.program[i];S.active={id:'w'+Date.now(),start:Date.now(),dayIdx:i,dayName:d.name,notes:'',
 items:d.items.map(it=>{const l=lastSets(it.exId);return{exId:it.exId,ns:it.sets,rest:it.rest,min:it.min,max:it.max,sets:Array.from({length:it.sets},(_,k)=>{const p=l&&(l[k]||l[l.length-1]);return{w:p?p.w:'',r:p?p.r:(isCardio(it.exId)?it.max:it.max),done:false}})}})};save();go('today')}
let durInt;
function workoutView(){const A=S.active;$('#title').textContent=A.dayName;
 app.innerHTML=`<div class="card row"><div class="grow"><div class="mut">Длительность</div><b id="dur" style="font-size:22px"></b></div><button class="ok" id="fin">Завершить</button></div>
 ${A.items.map((it,i)=>{const c=isCardio(it.exId),l=lastSets(it.exId,A.id);return`<div class="card"><div class="row"><h3 class="grow">${esc(exBy(it.exId).name)}</h3><button class="sm" data-rm="${i}">✕</button></div>
 <div class="mut">Цель: ${c?it.min+'–'+it.max+' мин':(it.ns||it.sets.length)+' × '+it.min+'–'+it.max+' повт., отдых '+fmtT(it.rest)}</div>
 <div class="set mut" style="font-size:12px"><span>#</span><span>${c?'Уровень/км':'Вес, кг'}</span><span>${c?'Минуты':'Повторы'}</span><span></span></div>
 ${it.sets.map((s,k)=>`<div class="set ${s.done?'done':''}"><span class="n">${k+1}</span><input type="number" inputmode="decimal" step="0.5" value="${s.w}" data-i="${i}" data-k="${k}" data-f="w"><input type="number" inputmode="numeric" value="${s.r}" data-i="${i}" data-k="${k}" data-f="r"><button class="${s.done?'ok':''}" data-done="${i},${k}">✓</button>${l&&l[k]?`<div class="prev">прошлый раз: ${l[k].w} × ${l[k].r}</div>`:''}</div>`).join('')}
 <div class="row"><button class="sm grow" data-add="${i}">+ подход</button><button class="sm grow" data-del="${i}">− подход</button></div></div>`}).join('')}
 <button class="full" id="addex">+ Добавить упражнение</button>
 <h2>Заметки</h2><textarea id="notes" rows="3" placeholder="Самочувствие, что получилось…">${esc(A.notes)}</textarea>
 <button class="danger full" id="cancel" style="margin:16px 0">Отменить тренировку</button>`;
 const tick=()=>{const e=$('#dur');if(e)e.textContent=fmtT(Math.floor((Date.now()-A.start)/1000))};tick();clearInterval(durInt);durInt=setInterval(tick,1000);
 app.querySelectorAll('input[data-f]').forEach(inp=>inp.oninput=()=>{const s=A.items[inp.dataset.i].sets[inp.dataset.k];s[inp.dataset.f]=inp.value===''?'':+inp.value;save()});
 app.querySelectorAll('[data-done]').forEach(b=>b.onclick=()=>{const[i,k]=b.dataset.done.split(',').map(Number),it=A.items[i],s=it.sets[k];s.done=!s.done;
  if(s.done){if(s.w==='')s.w=0;if(s.r==='')s.r=0;checkPR(it.exId,s);if(it.rest&&!isCardio(it.exId))startTimer(S.restOverride||it.rest)}save();workoutView()});
 app.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{const it=A.items[b.dataset.add],l=it.sets[it.sets.length-1]||{w:'',r:''};it.sets.push({w:l.w,r:l.r,done:false});save();workoutView()});
 app.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{A.items[b.dataset.del].sets.pop();save();workoutView()});
 app.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{if(confirm('Убрать упражнение?')){A.items.splice(b.dataset.rm,1);save();workoutView()}});
 $('#notes').oninput=e=>{A.notes=e.target.value;save()};
 $('#addex').onclick=()=>pickEx(id=>{const p=PRM[S.goal].a;A.items.push({exId:id,ns:3,rest:p[3],min:p[1],max:p[2],sets:[0,0,0].map(()=>({w:'',r:p[2],done:false}))});save();workoutView()});
 $('#cancel').onclick=()=>{if(confirm('Отменить тренировку без сохранения?')){S.active=null;save();stopTimer();go('today')}};
 $('#fin').onclick=()=>{A.end=Date.now();A.items=A.items.filter(it=>it.sets.some(s=>s.done));A.items.forEach(it=>it.sets=it.sets.filter(s=>s.done));
  if(!A.items.length&&!confirm('Нет выполненных подходов. Всё равно сохранить?'))return;S.workouts.push(A);S.next=(A.dayIdx+1)%S.program.length;S.active=null;save();stopTimer();toast('Тренировка сохранена 💪');go('history')}}
function bestOf(exId,excl){let w=0,r=0;S.workouts.forEach(wo=>wo.items.forEach(it=>{if(it.exId===exId)it.sets.forEach(s=>{if(s.done){w=Math.max(w,+s.w);r=Math.max(r,e1rm(+s.w,+s.r))}})}));return{w,r}}
function checkPR(exId,s){if(isCardio(exId)||!(+s.w>0))return;const b=bestOf(exId);const has=S.workouts.some(w=>w.items.some(i=>i.exId===exId));if(!has)return;
 if(+s.w>b.w){s.pr=1;toast('🏆 Новый рекорд веса: '+s.w+' кг!')}else if(e1rm(+s.w,+s.r)>b.r+0.01){s.pr=1;toast('🏆 Новый рекорд 1ПМ: '+e1rm(+s.w,+s.r).toFixed(1)+' кг!')}}
// ---------- Таймер
let tEnd=0,tInt,actx;
function beep(){try{actx=actx||new AudioContext();[0,.25,.5].forEach(t=>{const o=actx.createOscillator(),g=actx.createGain();o.frequency.value=880;o.connect(g);g.connect(actx.destination);g.gain.value=.3;o.start(actx.currentTime+t);o.stop(actx.currentTime+t+.15)})}catch(e){}}
function startTimer(sec){try{actx=actx||new AudioContext();actx.resume()}catch(e){}tEnd=Date.now()+sec*1000;$('#timer').classList.remove('hidden');clearInterval(tInt);tInt=setInterval(tt,250);tt()}
function tt(){const l=Math.round((tEnd-Date.now())/1000);$('#tval').textContent=fmtT(Math.max(0,l));if(l<=0){stopTimer();navigator.vibrate&&navigator.vibrate([300,150,300,150,300]);beep();toast('⏰ Отдых окончен — следующий подход!')}}
function stopTimer(){clearInterval(tInt);$('#timer').classList.add('hidden')}
document.querySelectorAll('#timer [data-t]').forEach(b=>b.onclick=()=>{tEnd+=b.dataset.t*1000;tt()});$('#tstop').onclick=stopTimer;
// ---------- Программа
function program(){$('#title').textContent='Программа';
 app.innerHTML=`<div class="card"><div class="mut">Цель: <b>${GOALS[S.goal]}</b> · ${S.days} трен./нед.</div><button class="full" style="margin-top:10px" id="chg">Сменить цель / частоту</button><button class="full" style="margin-top:8px" id="sci">📚 Научная основа программы</button></div>
 ${S.program.map((d,di)=>`<div class="card"><div class="row"><input value="${esc(d.name)}" data-dn="${di}"></div>
 ${d.items.map((it,ii)=>`<div class="li" style="flex-wrap:wrap"><div class="grow" style="min-width:60%">${esc(exBy(it.exId).name)}</div>
 <button class="sm" data-up="${di},${ii}">↑</button><button class="sm" data-dn2="${di},${ii}">↓</button><button class="sm" data-x="${di},${ii}">✕</button>
 <div class="row full" style="width:100%;font-size:13px"><label class="grow">Подходы<input type="number" value="${it.sets}" data-e="${di},${ii},sets"></label><label class="grow">Повт. от<input type="number" value="${it.min}" data-e="${di},${ii},min"></label><label class="grow">до<input type="number" value="${it.max}" data-e="${di},${ii},max"></label><label class="grow">Отдых, с<input type="number" value="${it.rest}" data-e="${di},${ii},rest"></label></div></div>`).join('')}
 <button class="full sm" style="margin-top:10px" data-ad="${di}">+ Упражнение</button></div>`).join('')}
 <div class="card"><b>Подходов на группу мышц в неделю</b><div style="margin-top:6px">${volBadges()}</div><div class="mut" style="margin-top:6px">Ориентир для роста мышц: 10–20 подходов (Schoenfeld 2017).</div></div>`;
 $('#chg').onclick=()=>{ob={goal:S.goal,days:S.days};if(confirm('Создать новую программу? Текущие шаблоны дней заменятся (история сохранится).')){S.goal=null;save();render()}};
 $('#sci').onclick=()=>go('science');
 app.querySelectorAll('[data-dn]').forEach(i=>i.onchange=()=>{S.program[i.dataset.dn].name=i.value;save()});
 app.querySelectorAll('[data-e]').forEach(i=>i.onchange=()=>{const[d,k,f]=i.dataset.e.split(',');S.program[d].items[k][f]=+i.value;save();program()});
 const mv=(a,d)=>{const[di,ii]=a.split(',').map(Number),L=S.program[di].items,j=ii+d;if(j<0||j>=L.length)return;[L[ii],L[j]]=[L[j],L[ii]];save();program()};
 app.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>mv(b.dataset.up,-1));app.querySelectorAll('[data-dn2]').forEach(b=>b.onclick=()=>mv(b.dataset.dn2,1));
 app.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>{const[di,ii]=b.dataset.x.split(',');S.program[di].items.splice(ii,1);save();program()});
 app.querySelectorAll('[data-ad]').forEach(b=>b.onclick=()=>pickEx(id=>{const p=PRM[S.goal].a;S.program[b.dataset.ad].items.push({exId:id,sets:p[0],min:p[1],max:p[2],rest:p[3]});save();program()}))}
function volBadges(){const v={};S.program.forEach(d=>d.items.forEach(it=>{const g=exBy(it.exId).group;if(g!=='Кардио')v[g]=(v[g]||0)+it.sets}));return Object.entries(v).map(([g,n])=>`<span class="badge">${g}: ${n}</span>`).join('')}
function pickEx(cb){const m=$('#modal');m.classList.remove('hidden');
 m.innerHTML=`<div class="sheet"><div class="row"><input id="q" placeholder="Поиск упражнения"><button id="mc">✕</button></div><div id="el"></div></div>`;
 const draw=()=>{const q=$('#q').value.toLowerCase();$('#el').innerHTML=GROUPS.map(g=>{const l=allEx().filter(e=>e.group===g&&e.name.toLowerCase().includes(q));return l.length?`<h2>${g}</h2>`+l.map(e=>`<button class="full" style="margin:3px 0;text-align:left" data-p="${e.id}">${esc(e.name)}</button>`).join(''):''}).join('');
  $('#el').querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{m.classList.add('hidden');cb(b.dataset.p)})};
 $('#q').oninput=draw;$('#mc').onclick=()=>m.classList.add('hidden');draw()}
// ---------- Прогресс
let pEx=null,pM='w';
function progress(){$('#title').textContent='Прогресс';const used=[...new Set(S.workouts.flatMap(w=>w.items.map(i=>i.exId)))].filter(id=>!isCardio(id));
 if(!used.length){app.innerHTML='<div class="card">Пока нет данных. Заверши первую тренировку — здесь появятся графики и рекорды.</div>';return}
 if(!used.includes(pEx))pEx=used[0];
 const pts=S.workouts.map(w=>{const it=w.items.find(i=>i.exId===pEx);if(!it)return null;const s=it.sets;return{d:w.start,w:Math.max(...s.map(x=>+x.w)),r:Math.max(...s.map(x=>e1rm(+x.w,+x.r))),v:s.reduce((a,x)=>a+x.w*x.r,0)}}).filter(Boolean);
 const recs=used.map(id=>{const b=bestOf(id);return`<div class="li"><span class="grow">${esc(exBy(id).name)}</span><span class="pr">🏆 ${b.w} кг</span><span class="mut">1ПМ ${b.r.toFixed(1)}</span></div>`}).join('');
 app.innerHTML=`<select id="pex">${used.map(id=>`<option value="${id}" ${id===pEx?'selected':''}>${esc(exBy(id).name)}</option>`).join('')}</select>
 <div class="tabs">${[['w','Макс. вес'],['r','1ПМ (расч.)'],['v','Объём']].map(([k,t])=>`<button class="sm ${pM===k?'on':''}" data-m="${k}">${t}</button>`).join('')}</div>
 <canvas id="ch"></canvas><h2>Личные рекорды</h2><div class="card">${recs}</div><p class="mut">1ПМ рассчитан по формуле Эпли: вес × (1 + повторы/30).</p>`;
 $('#pex').onchange=e=>{pEx=e.target.value;progress()};app.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{pM=b.dataset.m;progress()});
 chart($('#ch'),pts.map(p=>[p.d,p[pM]]))}
function chart(c,data){const dpr=devicePixelRatio||1,W=c.clientWidth,H=c.clientHeight;c.width=W*dpr;c.height=H*dpr;const x=c.getContext('2d');x.scale(dpr,dpr);
 x.font='12px system-ui';x.fillStyle='#8b93a3';if(!data.length)return;const ys=data.map(d=>d[1]),mn=Math.min(...ys)*.95,mx=Math.max(...ys)*1.05||1,P=34;
 const X=i=>P+(data.length<2?(W-2*P)/2:i*(W-P-14)/(data.length-1)),Y=v=>H-24-(v-mn)/(mx-mn||1)*(H-44);
 x.strokeStyle='#333a47';[0,.5,1].forEach(f=>{const v=mn+(mx-mn)*f;x.beginPath();x.moveTo(P,Y(v));x.lineTo(W-8,Y(v));x.stroke();x.fillText(Math.round(v),4,Y(v)+4)});
 x.strokeStyle='#ff6b35';x.lineWidth=3;x.beginPath();data.forEach((d,i)=>i?x.lineTo(X(i),Y(d[1])):x.moveTo(X(i),Y(d[1])));x.stroke();
 x.fillStyle='#ff6b35';data.forEach((d,i)=>{x.beginPath();x.arc(X(i),Y(d[1]),4,0,7);x.fill()});x.fillStyle='#8b93a3';
 [0,data.length-1].forEach(i=>{const dt=new Date(data[i][0]);x.fillText(dt.getDate()+'.'+(dt.getMonth()+1),Math.min(X(i)-10,W-40),H-6)})}
// ---------- История
let calM=new Date();calM.setDate(1);
function history(){$('#title').textContent='История';const y=calM.getFullYear(),m=calM.getMonth(),first=(new Date(y,m,1).getDay()+6)%7,n=new Date(y,m+1,0).getDate();
 const byDay={};S.workouts.forEach(w=>{const d=new Date(w.start);if(d.getFullYear()===y&&d.getMonth()===m)(byDay[d.getDate()]=byDay[d.getDate()]||[]).push(w)});
 app.innerHTML=`<div class="card"><div class="row"><button class="sm" id="pm">‹</button><b class="grow" style="text-align:center">${calM.toLocaleDateString('ru-RU',{month:'long',year:'numeric'})}</b><button class="sm" id="nm">›</button></div>
 <div class="cal" style="margin-top:10px">${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d=>`<div class="h">${d}</div>`).join('')}${'<div></div>'.repeat(first)}${Array.from({length:n},(_,i)=>`<div class="${byDay[i+1]?'has':''}" data-day="${i+1}">${i+1}</div>`).join('')}</div></div>
 <h2>Все тренировки (${S.workouts.length})</h2>${S.workouts.slice().reverse().map(w=>`<button class="full card" style="text-align:left;height:auto;padding:12px" data-w="${w.id}"><b>${esc(w.dayName)}</b><br><span class="mut">${new Date(w.start).toLocaleDateString('ru-RU',{day:'numeric',month:'long',weekday:'short'})} · ${fmtT(Math.round(((w.end||w.start)-w.start)/60000))} ч · ${w.items.length} упр.</span></button>`).join('')||'<p class="mut">Пока пусто.</p>'}`;
 $('#pm').onclick=()=>{calM.setMonth(m-1);history()};$('#nm').onclick=()=>{calM.setMonth(m+1);history()};
 app.querySelectorAll('[data-day]').forEach(d=>byDay[d.dataset.day]&&(d.onclick=()=>showW(byDay[d.dataset.day][0].id)));
 app.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>showW(b.dataset.w))}
function showW(id){const w=S.workouts.find(x=>x.id===id),m=$('#modal');m.classList.remove('hidden');
 m.innerHTML=`<div class="sheet"><div class="row"><h2 class="grow" style="margin:0">${esc(w.dayName)}</h2><button id="mc">✕</button></div>
 <p class="mut">${new Date(w.start).toLocaleString('ru-RU')} · длительность ${fmtT(Math.round(((w.end||w.start)-w.start)/60000))} ч</p>
 ${w.items.map(it=>`<div class="card"><b>${esc(exBy(it.exId).name)}</b><br>${it.sets.map(s=>`<span class="badge ${s.pr?'pr':''}">${s.pr?'🏆 ':''}${s.w} × ${s.r}</span>`).join('')}</div>`).join('')}
 ${w.notes?`<div class="card"><b>Заметки</b><br>${esc(w.notes)}</div>`:''}<button class="danger full" id="wdel">Удалить тренировку</button></div>`;
 $('#mc').onclick=()=>m.classList.add('hidden');$('#wdel').onclick=()=>{if(confirm('Удалить?')){S.workouts=S.workouts.filter(x=>x.id!==id);save();m.classList.add('hidden');history()}}}
// ---------- Ещё
function more(){$('#title').textContent='Ещё';
 app.innerHTML=`<button class="full card" id="sci" style="text-align:left">📚 Научная основа программ</button><button class="full card" id="lib" style="text-align:left">📖 Библиотека упражнений</button>
 <div class="card"><b>Таймер отдыха</b><p class="mut">По умолчанию берётся из программы. Можно задать одно значение для всех упражнений:</p>
 <div class="row"><input type="number" id="ro" placeholder="Из программы" value="${S.restOverride||''}"><span class="mut">сек</span></div></div>
 <div class="card"><b>Резервная копия</b><p class="mut">Все данные хранятся только на этом телефоне, в браузере. Периодически сохраняй копию.</p>
 <button class="full" id="exp">⬇ Экспорт (JSON)</button><label class="btn full" style="display:flex;align-items:center;justify-content:center;margin-top:8px">⬆ Импорт<input type="file" id="imp" accept=".json,application/json" hidden></label></div>
 <button class="danger full" id="reset">Сбросить все данные</button>`;
 $('#sci').onclick=()=>go('science');$('#lib').onclick=()=>go('library');$('#ro').onchange=e=>{S.restOverride=+e.target.value||0;save()};
 $('#exp').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,1)],{type:'application/json'}));a.download='moy-zal-'+new Date().toISOString().slice(0,10)+'.json';a.click()};
 $('#imp').onchange=async e=>{try{const d=JSON.parse(await e.target.files[0].text());if(!d.workouts)throw 0;if(confirm('Заменить текущие данные данными из файла?')){S=d;save();toast('Данные восстановлены');go('today')}}catch(_){alert('Не удалось прочитать файл')}};
 $('#reset').onclick=()=>{if(confirm('Удалить ВСЕ данные?')&&confirm('Точно?')){localStorage.removeItem('gym');location.reload()}}}
function library(){$('#title').textContent='Упражнения';
 app.innerHTML=`<div class="card"><b>Своё упражнение</b><input id="cn" placeholder="Название" style="margin:8px 0"><select id="cg">${GROUPS.map(g=>`<option>${g}</option>`).join('')}</select><button class="pri full" id="cadd" style="margin-top:8px">Добавить</button></div>
 ${GROUPS.map(g=>`<h2>${g}</h2><div class="card">${allEx().filter(e=>e.group===g).map(e=>`<div class="li"><span class="grow">${esc(e.name)}</span>${e.id.startsWith('c_')?`<button class="sm" data-cx="${e.id}">✕</button>`:''}</div>`).join('')}</div>`).join('')}`;
 $('#cadd').onclick=()=>{const n=$('#cn').value.trim();if(!n)return;S.custom.push({id:'c_'+Date.now(),name:n,group:$('#cg').value});save();toast('Добавлено');library()};
 app.querySelectorAll('[data-cx]').forEach(b=>b.onclick=()=>{S.custom=S.custom.filter(e=>e.id!==b.dataset.cx);save();library()})}
// ---------- Научная основа
const SRC={
v:'Schoenfeld BJ, Ogborn D, Krieger JW (2017). Dose-response relationship between weekly resistance training volume and increases in muscle mass: A systematic review and meta-analysis. Journal of Sports Sciences, 35(11), 1073–1082.',
f:'Schoenfeld BJ, Ogborn D, Krieger JW (2016). Effects of resistance training frequency on measures of muscle hypertrophy: A systematic review and meta-analysis. Sports Medicine, 46(11), 1689–1697.',
l:'Schoenfeld BJ, Grgic J, Ogborn D, Krieger JW (2017). Strength and hypertrophy adaptations between low- vs. high-load resistance training: A systematic review and meta-analysis. Journal of Strength and Conditioning Research, 31(12), 3508–3523.',
r:'Schoenfeld BJ, Pope ZK, Benik FM, et al. (2016). Longer interset rest periods enhance muscle strength and hypertrophy in resistance-trained men. Journal of Strength and Conditioning Research, 30(7), 1805–1812.',
a:'American College of Sports Medicine (2009). Position stand: Progression models in resistance training for healthy adults. Medicine & Science in Sports & Exercise, 41(3), 687–708.',
rv:'Ralston GW, Kilgore L, Wyatt FB, Baker JS (2017). The effect of weekly set volume on strength gain: A meta-analysis. Sports Medicine, 47(12), 2585–2601.',
gf:'Grgic J, Schoenfeld BJ, Davies TB, et al. (2018). Effect of resistance training frequency on gains in muscular strength: A systematic review and meta-analysis. Sports Medicine, 48(5), 1207–1220.',
p:'Morton RW, Murphy KT, McKellar SR, et al. (2018). A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. British Journal of Sports Medicine, 52(6), 376–384.',
d:'Donnelly JE, Blair SN, Jakicic JM, et al. (2009). ACSM Position Stand: Appropriate physical activity intervention strategies for weight loss and prevention of weight regain for adults. Medicine & Science in Sports & Exercise, 41(2), 459–471.',
w:'Bull FC, Al-Ansari SS, Biddle S, et al. (2020). World Health Organization 2020 guidelines on physical activity and sedentary behaviour. British Journal of Sports Medicine, 54(24), 1451–1462.'};
const SCI={mass:[['Объём','10–20 рабочих подходов на группу мышц в неделю: больше подходов — больше рост (дозозависимый эффект).',['v']],['Частота','Каждую мышцу тренируем ~2 раза в неделю — это даёт больший рост, чем 1 раз.',['f']],['Повторы и близость к отказу','Мышцы растут в широком диапазоне (≈6–30 повторов), если подход доведён близко к отказу (1–2 повтора в запасе). Практично: 6–10 в базовых, 10–15 в изолирующих.',['l']],['Отдых','2–3 мин между подходами в базовых упражнениях дают больше прогресса, чем 1 мин.',['r']],['Прогрессия (двойная)','Работай в диапазоне повторов; когда все подходы выполнены на верхней границе — увеличь вес на 2,5–5% и снова начинай с нижней. Приложение подсказывает это.',['a']],['Белок','≈1,6 г белка на кг веса тела в день — дальше дополнительной пользы почти нет.',['p']]],
str:[['Интенсивность','Сила лучше всего растёт при тяжёлых весах: >80% от 1ПМ, примерно 1–6 повторов.',['l','a']],['Отдых','3–5 мин между тяжёлыми подходами в базовых упражнениях (у нас 3 мин по умолчанию).',['a','r']],['Объём','Несколько подходов (multi-set) дают больше силы, чем один подход.',['rv']],['Частота','При равном объёме частота не так важна, но 2–3 раза в неделю на движение — удобный способ набрать объём.',['gf']],['Прогрессия','Постепенно повышай нагрузку: при выполнении всех повторов — +2,5–5% к весу.',['a']]],
loss:[['Силовые обязательно','Силовые тренировки при дефиците калорий помогают сохранить мышцы; поэтому программа сохраняет базовые упражнения (10–15 повторов, отдых 60–90 с).',['d','a']],['Кардио','ВОЗ: 150–300 мин умеренной или 75–150 мин интенсивной активности в неделю; для заметного снижения веса ACSM рекомендует >150 мин, а лучше 225–420 мин в неделю.',['w','d']],['Калории','Главный фактор похудения — дефицит калорий (питание). Одна только активность даёт умеренный эффект.',['d']],['Белок','Достаточно белка (≈1,6 г/кг) помогает удерживать мышечную массу.',['p']]]};
function science(fromOb){$('#title').textContent='Научная основа';const g=S.goal||ob.goal;let cur=window._sg||g;
 const used=[...new Set(SCI[cur].flatMap(x=>x[2]))];
 app.innerHTML=`<div class="tabs">${Object.entries(GOALS).map(([k,t])=>`<button class="sm ${cur===k?'on':''}" data-sg="${k}">${t}</button>`).join('')}</div>
 ${SCI[cur].map(([t,d,s])=>`<div class="card"><h3>${t}</h3><div>${d}</div><div class="mut" style="margin-top:6px">${s.map(k=>'['+(used.indexOf(k)+1)+']').join(' ')}</div></div>`).join('')}
 <h2>Источники</h2><div class="card mut" style="font-size:13px">${used.map((k,i)=>`<p>[${i+1}] ${SRC[k]}</p>`).join('')}</div>
 <p class="mut">Это общие рекомендации для здоровых взрослых, а не медицинская консультация.</p><button class="full" id="back" style="margin-bottom:16px">← Назад</button>`;
 app.querySelectorAll('[data-sg]').forEach(b=>b.onclick=()=>{window._sg=b.dataset.sg;science(fromOb)});
 $('#back').onclick=()=>{window._sg=null;if(!S.goal)onboarding();else go('more')}}
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
go(S.goal?'today':'today');
