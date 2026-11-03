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
const GOALS={mass:'Масса',str:'Сила',loss:'Похудение / рельеф',fit:'Общая форма'};
// Доп. упражнения (дом / свой вес / безопасные альтернативы)
[['bwsq','Приседания с весом тела','Ноги'],['step','Зашагивания на скамью','Ноги'],['dbrdl','Румынская тяга с гантелями','Ноги'],['inv','Австралийские подтягивания','Спина'],['chin','Подтягивания обратным хватом','Бицепс'],['ppu','Пайк-отжимания','Плечи'],['bd','Обратные отжимания от скамьи','Трицепс'],['dpu','Узкие отжимания','Трицепс'],['mch','Жим в тренажёре сидя','Грудь'],['dbug','Мёртвый жук','Пресс'],['bdog','Птица-собака','Пресс'],['yr','Y-подъёмы рук лёжа','Плечи'],['nlc','Скандинавские сгибания ног','Ноги'],['sglb','Ягодичный мост на одной ноге','Ноги'],['bpl','Боковая планка','Пресс'],['jump','Прыжки / джампинг-джек','Кардио'],['wlk','Быстрая ходьба','Кардио']].forEach(([id,name,group])=>EX.push({id,name,group}));
// оборудование: g=зал, d=дом с гантелями, b=свой вес(+турник); риски: s=спина, k=колени, p=плечи
const META={bp:'g|p',dbp:'gd|',ibp:'g|p',idb:'gd|',fly:'gd|p',cc:'g|',dip:'gb|p',pu:'gdb|',mch:'g|',dl:'g|s',inv:'gdb|',pull:'gdb|',lat:'g|',row:'g|s',dbr:'gd|',cr:'g|',hyp:'g|s',shr:'gd|',
sq:'g|sk',fsq:'g|k',lp:'g|k',rdl:'g|s',dbrdl:'gd|s',lun:'gd|k',bss:'gd|k',le:'g|k',lc:'g|',ht:'gdb|',calf:'gdb|',gsq:'gd|k',bwsq:'b|k',step:'gdb|',
ohp:'g|sp',dsp:'gd|p',lr:'gd|',rfly:'gd|',fp:'g|',ur:'g|p',ppu:'b|p',bc:'g|',dbc:'gd|',hc:'gd|',pc:'g|',chin:'gdb|',cgb:'g|p',tpd:'g|',skull:'gd|p',ote:'gd|p',bd:'db|p',dpu:'gdb|',
pl:'gdb|',cru:'gdb|',hlr:'gb|',abw:'gd|s',rt:'gdb|',dbug:'gdb|',bdog:'gdb|',tm:'g|',bike:'g|',ell:'g|',rowm:'g|',stair:'g|',yr:'gdb|',nlc:'gdb|k',sglb:'gdb|',bpl:'gdb|',jump:'db|k',wlk:'gdb|'};
const okEx=(id,a)=>{const m=META[id];if(!m)return true;const[eq,r]=m.split('|');return eq.includes(a.place)&&!(a.lim||[]).some(l=>r.includes(l))};
const SLOT={SQ:[['sq','lp','gsq','bss','fsq','bwsq','step'],['ht','step','lc']],HINGE:[['rdl','dl','dbrdl','ht','hyp'],['ht','lc','bdog']],HPUSH:[['bp','dbp','mch','pu'],['mch','pu']],IPUSH:[['idb','ibp','pu','dip'],['mch','pu']],
VPUSH:[['ohp','dsp','ppu'],['lr']],HPULL:[['row','cr','dbr','inv'],['cr','inv']],VPULL:[['pull','lat','chin','inv'],['lat','inv']],LUNGE:[['bss','lun','step','lp'],['ht','lc']],LEGISO:[['lc','le','ht','sglb','nlc'],['ht','sglb']],CALF:[['calf'],['sglb']],
SIDE:[['lr','yr','ppu'],['yr']],REAR:[['fp','rfly','yr'],['rfly','yr']],BI:[['bc','dbc','hc','chin','inv'],['hc']],TRI:[['tpd','ote','skull','dpu','bd'],['tpd','dpu']],CORE:[['pl','hlr','cru','dbug','bdog','bpl','abw'],['dbug','bdog']],CHEST2:[['fly','cc','dbp','pu'],['cc','pu']]};
const SLOTG={SQ:'Ноги',HINGE:'Ноги',LUNGE:'Ноги',LEGISO:'Ноги',CALF:'Ноги',HPUSH:'Грудь',IPUSH:'Грудь',CHEST2:'Грудь',VPUSH:'Плечи',SIDE:'Плечи',REAR:'Плечи',HPULL:'Спина',VPULL:'Спина',BI:'Бицепс',TRI:'Трицепс',CORE:'Пресс'};
const PRIO_SLOT={'Грудь':'CHEST2','Спина':'HPULL','Ноги':'LUNGE','Ягодицы':'LEGISO','Плечи':'SIDE','Бицепс':'BI','Трицепс':'TRI','Пресс':'CORE'};
const T={FA:['Фулбоди A','SQ HPUSH HPULL VPUSH LEGISO* BI* TRI* CORE*'],FB:['Фулбоди B','HINGE IPUSH VPULL LUNGE SIDE* REAR* CALF* CORE*'],FC:['Фулбоди C','SQ HPUSH VPULL HINGE SIDE* BI* TRI*'],
U1:['Верх A','HPUSH HPULL VPUSH VPULL SIDE* BI* TRI*'],L1:['Низ A','SQ HINGE LUNGE LEGISO* CALF* CORE*'],U2:['Верх B','IPUSH VPULL HPULL CHEST2* REAR* BI* TRI*'],L2:['Низ B','HINGE LUNGE SQ LEGISO* CALF* CORE*'],
PU:['Жим (грудь, плечи, трицепс)','HPUSH VPUSH IPUSH SIDE* TRI* CHEST2*'],PL:['Тяга (спина, бицепс)','VPULL HPULL HPULL REAR* BI* BI*'],LG:['Ноги','SQ HINGE LUNGE LEGISO* CALF* CORE*']};
const SPLITS={2:['FA','FB'],3:['FA','FB','FC'],4:['U1','L1','U2','L2'],5:['PU','PL','LG','U1','L1'],6:['PU','PL','LG','PU','PL','LG']};
const SPLITNAME={2:'Фулбоди 2×',3:'Фулбоди 3×',4:'Верх / Низ',5:'Жим / Тяга / Ноги + Верх / Низ',6:'Жим / Тяга / Ноги ×2'};
// [подходы: новичок, средний, опытный], повторы от, до, отдых (с)
const PRM={str:{c:[[3,4,5],3,6,180],a:[[2,3,3],6,10,120]},mass:{c:[[3,3,4],6,10,150],a:[[2,3,3],10,15,90]},loss:{c:[[2,3,3],10,15,90],a:[[2,3,3],12,15,60]},fit:{c:[[2,3,3],8,12,90],a:[[2,2,3],10,15,60]}};
const LV={nov:0,mid:1,adv:2},LVN={nov:'Новичок',mid:'Средний',adv:'Опытный'},PLN={g:'Зал',d:'Дом с гантелями',b:'Свой вес'};
const LIMN={s:'спина',k:'колени',p:'плечи'};
const eqOk=(id,a)=>(META[id]||'gdb|').split('|')[0].includes(a.place);
const itemTime=it=>isCardio(it.exId)?it.max*60:it.sets*(40+it.rest)+90;
function pickFor(slot,a,used,off){const[c,safe]=SLOT[slot];let L=c.filter(id=>okEx(id,a)&&!used.has(id));let swapped=false;
 if(!L.length){L=safe.filter(id=>okEx(id,a)&&!used.has(id));swapped=c.some(id=>eqOk(id,a))}
 if(!L.length)return null;const id=L[off%L.length];return{id,swapped:swapped||(c[0]!==id&&(a.lim||[]).length&&c.filter(x=>!used.has(x)&&eqOk(x,a))[0]!==id)}}
function generate(a){a={sex:'m',level:'mid',len:60,place:'g',prio:[],lim:[],...a};const P=PRM[a.goal],lv=LV[a.level],seen={},notes=[];let swaps=new Set();
 const days=(a.place!=='g'&&a.days>=5?(a.days==5?['U1','L1','U2','L2','FA']:['U1','L1','U2','L2','U1','L2']):SPLITS[a.days]).map(code=>{const[name,slots]=T[code];seen[code]=(seen[code]||0)+1;const off=seen[code]-1,used=new Set();
  let items=[];slots.split(' ').forEach(s=>{const acc=s.endsWith('*'),slot=s.replace('*','');const r=pickFor(slot,a,used,off);if(!r)return;used.add(r.id);if(r.swapped)swaps.add(exBy(r.id).name);
   const p=P[acc?'a':'c'];let sets=p[0][lv];if(a.prio.some(g=>SLOTG[slot]===g||(g==='Ягодицы'&&slot==='HINGE')))sets++;items.push({exId:r.id,sets,min:p[1],max:p[2],rest:p[3],acc,slot})});
  // доп. упражнение для приоритетных групп
  a.prio.forEach(g=>{const slot=PRIO_SLOT[g];if(items.some(i=>SLOTG[i.slot]===g||(g==='Ягодицы'&&i.slot==='HINGE'))){const r=pickFor(slot,a,used,off+1);if(r){used.add(r.id);const p=P.a;items.push({exId:r.id,sets:p[0][lv]+1,min:p[1],max:p[2],rest:p[3],acc:true,slot,prio:true})}}});
  // подгонка под длительность (−8 мин разминка)
  const budget=a.len*60-480,cardioMin=(a.goal==='loss'?20:a.goal==='fit'?15:0)*60,tot=()=>items.reduce((s,i)=>s+itemTime(i),0)+cardioMin;
  while(tot()>budget){const j=items.map((x,k)=>x.acc&&!x.prio?k:-1).filter(k=>k>=0).pop();if(j!==undefined){items.splice(j,1);continue}
   const big=items.filter(x=>x.sets>2);if(big.length){big.forEach(x=>x.sets--);continue}const j2=items.map((x,k)=>x.prio?k:-1).filter(k=>k>=0).pop();if(j2!==undefined){items.splice(j2,1);continue}if(items.length>3){items.pop();continue}break}
  if(cardioMin){const c=['tm','bike','ell','rowm','stair','jump','wlk'].filter(id=>okEx(id,a));const left=Math.max(10,Math.min(30,Math.floor((budget-tot()+cardioMin)/60)));items.push({exId:c[off%c.length]||'wlk',sets:1,min:Math.max(10,left-10),max:left,rest:0})}
  return{name,items:items.map(({exId,sets,min,max,rest})=>({exId,sets,min,max,rest}))}});
 return{days,why:whyOf(a,days,[...swaps])}}
function weekVol(days){const v={};days.forEach(d=>d.items.forEach(it=>{const g=exBy(it.exId).group;if(g!=='Кардио')v[g]=(v[g]||0)+it.sets}));return v}
function whyOf(a,days,swaps){const v=weekVol(days),P=PRM[a.goal],w=[];
 w.push([`Сплит «${a.place!=='g'&&a.days>=5?'Верх / Низ'+(a.days==5?' + Фулбоди':' ×1,5'):SPLITNAME[a.days]}»: каждая крупная группа мышц тренируется ~${a.days>=6?2:a.days>=4?2:a.days} раз(а) в неделю — 2 раза в неделю дают больший рост, чем 1.`,['f','gf']]);
 w.push([`Повторы ${P.c[1]}–${P.c[2]} в базовых и ${P.a[1]}–${P.a[2]} в изолирующих, отдых ${P.c[3]/60} мин / ${P.a[3]} с: `+({str:'сила лучше растёт при весах >80% 1ПМ и длинном отдыхе.',mass:'мышцы растут в широком диапазоне повторов при работе близко к отказу; длинный отдых в базе даёт больше прогресса.',loss:'силовые сохраняют мышцы при дефиците калорий, короткий отдых экономит время.',fit:'умеренные веса и 8–15 повторов — рекомендация ACSM для здоровья и общей силы.'}[a.goal]),a.goal==='str'?['l','a','r']:a.goal==='mass'?['l','r']:a.goal==='loss'?['d','a']:['a','w']]);
 w.push([`Объём в неделю (подходов): ${Object.entries(v).map(([g,n])=>g+' '+n).join(', ')}. `+(a.level==='nov'?'Для новичка — умеренный объём (меньше подходов): прогресс идёт и при малом объёме, важнее освоить технику.':'Для роста мышц ориентир — ~10+ подходов на группу в неделю; больше подходов — больше результат (дозозависимо).'),a.level==='nov'?['a','v']:['v','rv']]);
 if(a.prio.length)w.push([`Приоритет: ${a.prio.join(', ')} — +1 подход и доп. упражнение, т.к. больший недельный объём даёт больший рост этих мышц.`,['v']]);
 if(a.goal==='loss'||a.goal==='fit')w.push([`Кардио в конце тренировки + дополнительная активность: ориентир ВОЗ — 150–300 мин умеренной нагрузки в неделю${a.goal==='loss'?'; для снижения веса ACSM советует >150, лучше 225–420 мин':''}.`,a.goal==='loss'?['w','d']:['w']]);
 w.push([`Длительность ~${a.len} мин: число упражнений и подходов подогнано под это время (8 мин — разминка).`,[]]);
 if(a.lim.length)w.push([`Ограничения (${a.lim.map(l=>LIMN[l]).join(', ')}): рискованные упражнения заменены на более щадящие${swaps.length?' ('+swaps.slice(0,5).join(', ')+')':''}. При боли — проконсультируйся с врачом.`,[]]);
 w.push([`Пол: ${a.sex==='f'?'женский':'мужской'} — в относительных величинах мужчины и женщины прибавляют в силе и мышцах сопоставимо, поэтому принципы программы одинаковые.`,['sx']]);
 w.push(['Прогрессия: когда все подходы выполнены на верхней границе повторов — добавь 2,5–5% веса (приложение подскажет).',['a']]);return w}
const CATALOG=[
['Старт в зале','Для новичков: освоить базовые движения, 3 фулбоди в неделю.',{goal:'fit',level:'nov',days:3,len:60,place:'g'}],
['Масса: Верх / Низ','Классика для набора массы: каждая мышца 2 раза в неделю.',{goal:'mass',level:'mid',days:4,len:60,place:'g'}],
['Масса: Жим / Тяга / Ноги ×2','Высокий объём для опытных, 6 дней.',{goal:'mass',level:'adv',days:6,len:75,place:'g'}],
['Масса за 3 дня','Фулбоди для тех, у кого мало времени.',{goal:'mass',level:'mid',days:3,len:60,place:'g'}],
['Сила: базовая тройка','Присед, жим, становая — тяжёлые веса, длинный отдых.',{goal:'str',level:'mid',days:3,len:75,place:'g'}],
['Сила: Верх / Низ','4 дня, больше объёма на базовые движения.',{goal:'str',level:'adv',days:4,len:90,place:'g'}],
['Рельеф 4×','Силовые 10–15 повторов + кардио для сжигания жира.',{goal:'loss',level:'mid',days:4,len:60,place:'g'}],
['Похудение: экспресс 30 мин','Коротко и интенсивно, 3 раза в неделю.',{goal:'loss',level:'nov',days:3,len:30,place:'g'}],
['Дом с гантелями','Масса дома: только гантели и скамья.',{goal:'mass',level:'mid',days:4,len:60,place:'d'}],
['Свой вес','Без оборудования (нужен турник), 3 дня.',{goal:'fit',level:'nov',days:3,len:45,place:'b'}],
['Широкая спина','Приоритет спины: доп. объём на тяги.',{goal:'mass',level:'mid',days:4,len:75,place:'g',prio:['Спина']}],
['Объёмные руки','Приоритет бицепса и трицепса.',{goal:'mass',level:'mid',days:5,len:60,place:'g',prio:['Бицепс','Трицепс']}],
['Ягодицы и ноги','Приоритет низа тела.',{goal:'mass',level:'mid',days:4,len:60,place:'g',sex:'f',prio:['Ягодицы','Ноги']}],
['Пресс и рельеф','Похудение с приоритетом пресса.',{goal:'loss',level:'mid',days:4,len:45,place:'g',prio:['Пресс']}],
['Здоровая спина','Укрепление здоровья без осевой нагрузки на позвоночник.',{goal:'fit',level:'nov',days:2,len:45,place:'g',lim:['s']}],
['Бережно к коленям','Без глубоких приседов и выпадов.',{goal:'fit',level:'mid',days:3,len:45,place:'g',lim:['k']}]].map(([name,desc,a],i)=>({id:'c'+i,name,desc,a:{sex:'m',prio:[],lim:[],...a}}));

let S=JSON.parse(localStorage.getItem('gym')||'null')||{custom:[],workouts:[],next:0};
if(S.goal&&!S.prof){S.prof={goal:S.goal,sex:'m',level:'mid',days:S.days||3,len:60,place:'g',prio:[],lim:[]};S.progName='Моя программа: '+GOALS[S.goal]}S.custom=S.custom||[];S.body=S.body||[];S.workouts=S.workouts||[];S.v=2;
const save=()=>localStorage.setItem('gym',JSON.stringify(S));
const allEx=()=>EX.concat(S.custom), exBy=id=>allEx().find(e=>e.id===id)||{name:'?',group:''};
const isCardio=id=>exBy(id).group==='Кардио';
const e1rm=(w,r)=>r>0?w*(1+r/30):0, fmtT=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.append(d);setTimeout(()=>d.remove(),2600)}
let view='today';
function go(v){view=v;document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));render();scrollTo(0,0)}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>go(b.dataset.v));
function render(){$('#nav').classList.toggle('hidden',!S.goal);if(!S.goal&&!['preview','catalog','quiz','science'].includes(view))return quiz();
 if(view==='preview')return renderPreview();if(S.active&&view==='today')return workoutView();({today,program,progress,history,more,science,library,quiz,catalog,body}[view])()}
let ob={goal:'mass'};
function onboarding(){quiz()}
let Q=null,catF={};
const chip=(k,v,label,sel)=>`<button class="opt chip ${sel?'sel':''}" data-k="${k}" data-v="${v}">${label}</button>`;
function quiz(){$('#title').textContent='Подбор программы';Q=Q||{goal:'mass',sex:'m',level:'mid',days:3,len:60,place:'g',prio:[],lim:[],...(S.prof||{})};
 const grp=(t,k,opts,multi)=>`<h2>${t}</h2><div class="chips">${opts.map(([v,l])=>chip(k,v,l,multi?Q[k].includes(v):String(Q[k])===String(v))).join('')}</div>`;
 app.innerHTML=`<p class="mut">Ответь на вопросы — программа составится по данным научных исследований. Или выбери <a href="#" id="tocat" style="color:var(--acc)">готовую программу</a>.</p>
 ${grp('Цель','goal',[['mass','💪 Масса'],['str','🏋️ Сила'],['loss','🔥 Похудение / рельеф'],['fit','❤️ Общая форма']])}
 ${grp('Пол','sex',[['m','Мужской'],['f','Женский']])}${grp('Уровень','level',[['nov','Новичок'],['mid','Средний'],['adv','Опытный']])}
 ${grp('Тренировок в неделю','days',[2,3,4,5,6].map(n=>[n,n]))}${grp('Длительность тренировки','len',[30,45,60,75,90].map(n=>[n,n+' мин']))}
 ${grp('Где тренируешься','place',[['g','🏢 Зал'],['d','🏠 Дом с гантелями'],['b','🤸 Свой вес']])}
 ${grp('Приоритетные мышцы (можно несколько)','prio',['Грудь','Спина','Плечи','Ноги','Ягодицы','Бицепс','Трицепс','Пресс'].map(g=>[g,g]),1)}
 ${grp('Ограничения (заменим рискованные упражнения)','lim',[['s','Спина'],['k','Колени'],['p','Плечи']],1)}
 <button class="pri full" id="qgo" style="margin:18px 0 8px">Подобрать программу</button>${S.program?'<button class="full" id="qback" style="margin-bottom:16px">← Назад</button>':''}`;
 app.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{const k=b.dataset.k,v=b.dataset.v;if(Array.isArray(Q[k]))Q[k]=Q[k].includes(v)?Q[k].filter(x=>x!==v):[...Q[k],v];else Q[k]=['days','len'].includes(k)?+v:v;const y=scrollY;quiz();scrollTo(0,y)});
 $('#tocat').onclick=e=>{e.preventDefault();go('catalog')};$('#qgo').onclick=()=>{preview({name:'Моя программа: '+GOALS[Q.goal],desc:`${LVN[Q.level]} · ${PLN[Q.place]} · ${Q.days}×${Q.len} мин`,a:{...Q}},'quiz')};
 if($('#qback'))$('#qback').onclick=()=>go('program')}
let PV=null;
function preview(pr,back){PV={pr,back,gen:generate(pr.a)};view='preview';renderPreview()}
function renderPreview(){const{pr,gen}=PV,a=pr.a;$('#title').textContent='Программа';$('#nav').classList.add('hidden');
 const refs=[...new Set(gen.why.flatMap(w=>w[1]))];
 app.innerHTML=`<div class="card"><h2 style="margin-top:0">${esc(pr.name)}</h2><div class="mut">${esc(pr.desc)}</div><div style="margin-top:8px">${tags(a)}</div></div>
 ${gen.days.map((d,di)=>`<div class="card"><h3>День ${di+1}: ${esc(d.name)}</h3>${d.items.map((it,ii)=>`<div class="li"><span class="grow">${esc(exBy(it.exId).name)}</span>${techBtn(it.exId)}<span class="mut">${isCardio(it.exId)?it.min+'–'+it.max+' мин':it.sets+'×'+it.min+'–'+it.max}</span><button class="sm" data-sw="${di},${ii}" aria-label="Заменить">⇄</button></div>`).join('')}</div>`).join('')}
 <h2>Почему программа построена так</h2><div class="card">${gen.why.map(([t,r])=>`<p style="margin:6px 0">• ${t} ${r.length?`<span class="mut">${r.map(k=>'['+(refs.indexOf(k)+1)+']').join('')}</span>`:''}</p>`).join('')}
 <div class="mut" style="font-size:12px;margin-top:10px">${refs.map((k,i)=>`<p>[${i+1}] ${SRC[k]}</p>`).join('')}</div></div>
 <button class="pri full" id="pstart">Начать программу</button><button class="full" id="pback" style="margin:8px 0 20px">← Назад</button>`;
 app.querySelectorAll('[data-sw]').forEach(b=>b.onclick=()=>{const[di,ii]=b.dataset.sw.split(',');const it=gen.days[di].items[ii];swapModal(it.exId,a,id=>{it.exId=id;renderPreview()})});
 $('#pback').onclick=()=>{$('#nav').classList.remove('hidden');go(PV.back)};
 $('#pstart').onclick=()=>{if(S.program&&!confirm('Заменить текущую программу? История тренировок сохранится.'))return;
  S.prof=a;S.goal=a.goal;S.days=a.days;S.program=gen.days;S.progName=pr.name;S.why=gen.why;S.next=0;save();toast('Программа выбрана 💪');$('#nav').classList.remove('hidden');go('today')}}
const tags=a=>[GOALS[a.goal],LVN[a.level],a.days+'×/нед',a.len+' мин',PLN[a.place],...(a.prio||[]).map(p=>'★ '+p),...(a.lim||[]).map(l=>'⚠ '+LIMN[l])].map(t=>`<span class="badge">${t}</span>`).join('');
function catalog(){$('#title').textContent='Готовые программы';const F=catF;
 const fl=(k,opts)=>`<div class="chips sm2">${[['','Все'],...opts].map(([v,l])=>`<button class="opt chip ${String(F[k]||'')===String(v)?'sel':''}" data-fk="${k}" data-fv="${v}">${l}</button>`).join('')}</div>`;
 const L=CATALOG.filter(c=>(!F.goal||c.a.goal===F.goal)&&(!F.level||c.a.level===F.level)&&(!F.days||c.a.days==F.days)&&(!F.place||c.a.place===F.place));
 app.innerHTML=`${fl('goal',Object.entries(GOALS))}${fl('level',Object.entries(LVN))}${fl('days',[2,3,4,5,6].map(n=>[n,n+'×']))}${fl('place',Object.entries(PLN))}
 <p class="mut">Найдено: ${L.length}</p>${L.map(c=>`<div class="card"><h3>${esc(c.name)}</h3><div class="mut">${esc(c.desc)}</div><div style="margin:6px 0">${tags(c.a)}</div>
 <div class="mut" style="font-size:13px">${generate(c.a).days.map(d=>esc(d.name)).join(' · ')}</div><button class="pri full" style="margin-top:10px" data-c="${c.id}">Подробнее</button></div>`).join('')}
 <button class="full" id="toq" style="margin-bottom:20px">🧩 Подобрать по анкете</button>`;
 app.querySelectorAll('[data-fk]').forEach(b=>b.onclick=()=>{catF[b.dataset.fk]=b.dataset.fv;catalog()});
 app.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>preview(CATALOG.find(c=>c.id===b.dataset.c),'catalog'));$('#toq').onclick=()=>go('quiz')}
function swapModal(cur,a,cb){const g=exBy(cur).group,m=$('#modal');m.classList.remove('hidden');a=a||S.prof||{place:'g',lim:[]};
 const L=allEx().filter(e=>e.group===g&&e.id!==cur),good=L.filter(e=>okEx(e.id,a)),other=L.filter(e=>!okEx(e.id,a));
 m.innerHTML=`<div class="sheet"><div class="row"><h2 class="grow" style="margin:0">Замена: ${esc(exBy(cur).name)}</h2><button id="mc">✕</button></div><p class="mut">Альтернативы (${g})</p>
 ${good.map(e=>`<div class="row"><button class="full grow" style="margin:3px 0;text-align:left" data-p="${e.id}">${esc(e.name)}</button>${techBtn(e.id)}</div>`).join('')}
 ${other.length?`<p class="mut">Другое оборудование или риск при ограничениях:</p>`+other.map(e=>`<div class="row"><button class="full grow" style="margin:3px 0;text-align:left;opacity:.6" data-p="${e.id}">${esc(e.name)}</button>${techBtn(e.id)}</div>`).join(''):''}</div>`;
 $('#mc').onclick=()=>m.classList.add('hidden');m.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{m.classList.add('hidden');cb(b.dataset.p)})}

// ---------- Сегодня
function lastSets(exId,beforeId){for(let i=S.workouts.length-1;i>=0;i--){const w=S.workouts[i];if(w.id===beforeId)continue;const it=w.items.find(x=>x.exId===exId);if(it&&it.sets.some(s=>s.done))return it.sets.filter(s=>s.done)}return null}
function hint(item){const l=lastSets(item.exId);if(!l||isCardio(item.exId))return'';
 if(l.length>=item.sets&&l.every(s=>s.r>=item.max))return`<div class="pr" style="font-size:13px">⬆ В прошлый раз все подходы на ${item.max}+ — добавь вес (+2,5 кг)</div>`;return''}
function today(){$('#title').textContent='Сегодня';const d=S.program[S.next%S.program.length];
 const wk=S.workouts.filter(w=>Date.now()-w.start<7*864e5).length;
 app.innerHTML=`<div class="card"><div class="mut">${GOALS[S.goal]} · ${S.days}× в неделю · на этой неделе: ${wk}/${S.days}</div><h2 style="margin-top:6px">${esc(d.name)}</h2>
 ${d.items.map(it=>`<div class="li"><div class="grow">${esc(exBy(it.exId).name)}${hint(it)}</div>${techBtn(it.exId)}<span class="mut">${isCardio(it.exId)?it.min+'–'+it.max+' мин':it.sets+'×'+it.min+'–'+it.max}</span></div>`).join('')}
 <button class="pri full" id="start" style="margin-top:14px">▶ Начать тренировку</button></div>
 <h2>Или выбрать другой день</h2>${S.program.map((p,i)=>`<button class="full" style="margin:4px 0" data-i="${i}">${esc(p.name)}</button>`).join('')}`;
 $('#start').onclick=()=>startW(S.next%S.program.length);app.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>startW(+b.dataset.i))}
function startW(i){const d=S.program[i];S.active={id:'w'+Date.now(),start:Date.now(),dayIdx:i,dayName:d.name,notes:'',
 items:d.items.map(it=>{const l=lastSets(it.exId);return{exId:it.exId,ns:it.sets,rest:it.rest,min:it.min,max:it.max,sets:Array.from({length:it.sets},(_,k)=>{const p=l&&(l[k]||l[l.length-1]);return{w:p?p.w:'',r:p?p.r:(isCardio(it.exId)?it.max:it.max),done:false}})}})};save();go('today')}
let durInt;
function workoutView(){const A=S.active;$('#title').textContent=A.dayName;
 app.innerHTML=`<div class="card row"><div class="grow"><div class="mut">Длительность</div><b id="dur" style="font-size:22px"></b></div><button class="ok" id="fin">Завершить</button></div>
 ${A.items.map((it,i)=>{const c=isCardio(it.exId),l=lastSets(it.exId,A.id);return`<div class="card"><div class="row"><h3 class="grow">${esc(exBy(it.exId).name)}</h3>${techBtn(it.exId)}<button class="sm" data-ws="${i}">⇄</button><button class="sm" data-rm="${i}">✕</button></div>
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
  if(s.done){if(s.w==='')s.w=0;if(s.r==='')s.r=0;checkPR(it.exId,s);if(it.rest&&!isCardio(it.exId))startTimer(S.restOverride||it.rest);else if(pendingFan)playFanfareOnly();pendingFan=false}else{delete s.pr;delete s.prInfo}save();workoutView()});
 app.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{const it=A.items[b.dataset.add],l=it.sets[it.sets.length-1]||{w:'',r:''};it.sets.push({w:l.w,r:l.r,done:false});save();workoutView()});
 app.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{A.items[b.dataset.del].sets.pop();save();workoutView()});
 app.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{if(confirm('Убрать упражнение?')){A.items.splice(b.dataset.rm,1);save();workoutView()}});
 app.querySelectorAll('[data-ws]').forEach(b=>b.onclick=()=>{const it=A.items[b.dataset.ws];swapModal(it.exId,S.prof,id=>{it.exId=id;const l=lastSets(id,A.id);it.sets.forEach((s,k)=>{if(!s.done){const p=l&&(l[k]||l[l.length-1]);s.w=p?p.w:''}});save();workoutView()})});
 $('#notes').oninput=e=>{A.notes=e.target.value;save()};
 $('#addex').onclick=()=>pickEx(id=>{const p=PRM[S.goal].a;A.items.push({exId:id,ns:3,rest:p[3],min:p[1],max:p[2],sets:[0,0,0].map(()=>({w:'',r:p[2],done:false}))});save();workoutView()});
 $('#cancel').onclick=()=>{if(confirm('Отменить тренировку без сохранения?')){S.active=null;save();stopTimer();go('today')}};
 $('#fin').onclick=()=>{A.end=Date.now();A.items=A.items.filter(it=>it.sets.some(s=>s.done));A.items.forEach(it=>it.sets=it.sets.filter(s=>s.done));
  if(!A.items.length&&!confirm('Нет выполненных подходов. Всё равно сохранить?'))return;S.workouts.push(A);S.next=(A.dayIdx+1)%S.program.length;S.active=null;save();stopTimer();toast('Тренировка сохранена 💪');go('history');prSummary(A)}}
function prSummary(A){const L=[];A.items.forEach(it=>it.sets.forEach(s=>s.pr&&s.prInfo&&L.push([exBy(it.exId).name,s.prInfo])));if(!L.length)return;const m=$('#modal');m.classList.remove('hidden');
 m.innerHTML=`<div class="sheet"><h2 style="margin-top:0">🏆 Рекорды тренировки: ${L.length}</h2>${L.map(([n,i])=>`<div class="li"><div class="grow"><b>${esc(n)}</b><br><span class="mut">${i.t}</span></div><span class="mut"><s>${i.o}</s></span>&nbsp;→&nbsp;<b class="pr">${i.n}</b></div>`).join('')}<p>${PHR[Math.floor(Math.random()*PHR.length)]}</p><button class="pri full" id="mc">Отлично!</button></div>`;$('#mc').onclick=()=>m.classList.add('hidden')}
function priorSets(exId,skip){const L=[];S.workouts.forEach(wo=>wo.items.forEach(it=>{if(it.exId===exId)it.sets.forEach(s=>s.done&&L.push(s))}));
 if(S.active)S.active.items.forEach(it=>{if(it.exId===exId)it.sets.forEach(s=>s.done&&s!==skip&&L.push(s))});return L}
function bestOf(exId){let w=0,r=0;priorSets(exId).forEach(s=>{w=Math.max(w,+s.w);r=Math.max(r,e1rm(+s.w,+s.r))});return{w,r}}
let pendingFan=false;
function checkPR(exId,s){delete s.pr;delete s.prInfo;if(isCardio(exId)||!(+s.w>0)||!(+s.r>0))return;const L=priorSets(exId,s);if(!L.length)return;
 const bw=Math.max(...L.map(x=>+x.w)),br=Math.max(...L.map(x=>e1rm(+x.w,+x.r))),same=L.filter(x=>+x.w===+s.w),bRep=same.length?Math.max(...same.map(x=>+x.r)):0;let info=null;
 if(+s.w>bw)info={t:'Максимальный вес',o:bw+' кг',n:s.w+' кг'};else if(e1rm(+s.w,+s.r)>br+0.05)info={t:'Расчётный 1ПМ',o:br.toFixed(1)+' кг',n:e1rm(+s.w,+s.r).toFixed(1)+' кг'};
 else if(same.length&&+s.r>bRep)info={t:'Повторы с весом '+s.w+' кг',o:bRep+' повт.',n:s.r+' повт.'};
 if(info){s.pr=1;s.prInfo=info;pendingFan=true;celebrate(exBy(exId).name,info)}}
const PHR=['Сила растёт — так держать!','Ты сильнее, чем вчера 💪','Прогресс налицо — продолжай!','Вот это результат! Гордись собой.','Каждый подход приближает к цели.','Рекорды любят упорных!','Отличная работа — тело отвечает на нагрузку.','Новая планка взята! Дальше — больше.'];
function celebrate(name,info){const d=document.createElement('div');d.id='prov';d.innerHTML=`<canvas id="conf"></canvas><div class="prbox"><div style="font-size:64px">🏆</div><h2>Новый личный рекорд!</h2><h3>${esc(name)}</h3>
 <div class="mut">${info.t}</div><div class="prcmp"><span class="mut"><s>${info.o}</s></span> → <b class="pr">${info.n}</b></div><p>${PHR[Math.floor(Math.random()*PHR.length)]}</p><button class="pri full" id="prok">Супер!</button></div>`;
 document.body.append(d);d.querySelector('#prok').onclick=()=>d.remove();confetti(d.querySelector('#conf'))}
function confetti(c){const W=c.width=innerWidth,H=c.height=innerHeight,x=c.getContext('2d'),cols=['#ff6b35','#ffc83d','#2ecc71','#3da5ff','#ff4d8d','#fff'];
 const P=Array.from({length:160},()=>({x:Math.random()*W,y:-Math.random()*H*.6,vx:(Math.random()-.5)*3,vy:2+Math.random()*4,r:Math.random()*6.3,s:5+Math.random()*7,c:cols[Math.floor(Math.random()*6)]}));
 let f=0;(function step(){if(!c.isConnected||f++>260)return;x.clearRect(0,0,W,H);P.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.03;p.r+=.1;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);x.restore()});requestAnimationFrame(step)})()}
function playFanfareOnly(){if(!soundOn()||taCovers())return;armAudio(0,true,true)}
// ---------- Таймер
let tEnd=0,tInt,lastWarn=-1;
const soundOn=()=>S.sound!==false;
function endSignal(){navigator.vibrate&&navigator.vibrate([400,150,400,150,400]);toast('⏰ Отдых окончен — следующий подход!')}
function startTimer(sec){armAudio(sec);tEnd=Date.now()+sec*1000;S.tEnd=tEnd;save();lastWarn=-1;$('#timer').classList.remove('hidden');clearInterval(tInt);tInt=setInterval(tt,200);tt()}
function tt(){const l=Math.ceil((tEnd-Date.now())/1000);$('#tval').textContent=fmtT(Math.max(0,l));
 if(l<=3&&l>=1&&l!==lastWarn){lastWarn=l;}
 if(l<=0){const c=taCovers();stopTimer(true);if(c){navigator.vibrate&&navigator.vibrate([400,150,400,150,400]);toast('⏰ Отдых окончен — следующий подход!')}else endSignal()}}
function stopTimer(keep){if(!keep){TA&&TA.pause();taEndAt=0}clearInterval(tInt);tEnd=0;S.tEnd=0;save();$('#timer').classList.add('hidden')}
document.querySelectorAll('#timer [data-t]').forEach(b=>b.onclick=()=>{tEnd+=b.dataset.t*1000;armAudio(Math.max(0,(tEnd-Date.now())/1000));S.tEnd=tEnd;save();lastWarn=-1;tt()});$('#tstop').onclick=()=>stopTimer();
document.addEventListener('visibilitychange',()=>{if(document.hidden)return;if(tEnd)tt();wake()});
// iOS: звук должен стартовать синхронно в обработчике нажатия — один <audio> с тишиной + сигналами
const setSession=()=>{try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(e){}};
let TA=null;const getTA=()=>{if(!TA){TA=new Audio();TA.setAttribute('playsinline','');TA.volume=1}return TA};let taURL=null,taEndAt=0;
function wavFor(sec,fan,noEnd){const R=11025,tail=1.2,n=Math.ceil((Math.max(sec,fan?1:0)+tail)*R),buf=new ArrayBuffer(44+n*2),v=new DataView(buf);
 const ws=(o,s)=>[...s].forEach((c,i)=>v.setUint8(o+i,c.charCodeAt(0)));ws(0,'RIFF');v.setUint32(4,36+n*2,true);ws(8,'WAVE');ws(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,R,true);v.setUint32(28,R*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);ws(36,'data');v.setUint32(40,n*2,true);
 const beep=(t,d,f,amp)=>{const s=Math.floor(t*R),e=Math.min(n,s+Math.floor(d*R));for(let i=Math.max(0,s);i<e;i++){const k=i-s,env=Math.min(1,k/60,(e-i)/60);v.setInt16(44+i*2,Math.round(amp*env*(Math.sin(2*Math.PI*f*k/R)>=0?1:-1)),true)}};
 if(fan)[[523,0],[659,.13],[784,.26],[1047,.39],[784,.6],[1047,.72]].forEach(([f,t])=>beep(t,t>.5?.22:.12,f,24000));if(!noEnd){[3,2,1].forEach(k=>{if(sec-k>(fan?1.1:0.2))beep(sec-k,.12,700,20000)});[0,.35,.7].forEach(d=>beep(sec+d,.25,1000,30000))}
 return URL.createObjectURL(new Blob([buf],{type:'audio/wav'}))}
function armAudio(sec,fan,noEnd){fan=fan===undefined?pendingFan:fan;setSession();if(!soundOn()){TA&&TA.pause();return}getTA();if(taURL)URL.revokeObjectURL(taURL);taURL=wavFor(Math.max(0,sec),fan,noEnd);TA.src=taURL;TA.currentTime=0;taEndAt=noEnd?0:Date.now()+sec*1000;
 const p=TA.play();window.__taLast='pending';p&&p.then(()=>window.__taLast='ok').catch(err=>{window.__taLast=err.name;taEndAt=0})}
const taCovers=()=>TA&&taEndAt&&!TA.paused&&Math.abs(taEndAt-tEnd)<1500;
// восстановление таймера после перезагрузки
setTimeout(()=>{if(S.tEnd&&S.active){tEnd=S.tEnd;if(tEnd>Date.now()){$('#timer').classList.remove('hidden');tInt=setInterval(tt,200)}else{S.tEnd=0;save();toast('⏰ Отдых окончен')}}},0);
// Не гасить экран во время тренировки
let wl=null;async function wake(){try{if(S.active&&S.wake!==false&&'wakeLock'in navigator&&!wl&&!document.hidden){wl=await navigator.wakeLock.request('screen');wl.addEventListener('release',()=>wl=null)}if((!S.active||S.wake===false)&&wl){wl.release();wl=null}}catch(e){}}
setInterval(wake,3000);

// ---------- Программа
function program(){$('#title').textContent='Программа';
 app.innerHTML=`<div class="card"><h3>${esc(S.progName||'Моя программа')}</h3><div>${tags(S.prof)}</div><button class="pri full" style="margin-top:10px" id="chg">🧩 Подобрать заново (анкета)</button><button class="full" style="margin-top:8px" id="cat">📚 Каталог готовых программ</button><button class="full" style="margin-top:8px" id="sci">🔬 Научная основа</button></div>
 ${S.why?`<details class="card"><summary><b>Почему программа построена так</b></summary>${S.why.map(([t])=>`<p style="margin:6px 0">• ${t}</p>`).join('')}<p class="mut">Источники — в разделе «Научная основа».</p></details>`:''}
 ${S.program.map((d,di)=>`<div class="card"><div class="row"><input value="${esc(d.name)}" data-dn="${di}"></div>
 ${d.items.map((it,ii)=>`<div class="li" style="flex-wrap:wrap"><div class="grow" style="min-width:60%">${esc(exBy(it.exId).name)}</div>${techBtn(it.exId)}
 <button class="sm" data-swp="${di},${ii}">⇄</button><button class="sm" data-up="${di},${ii}">↑</button><button class="sm" data-dn2="${di},${ii}">↓</button><button class="sm" data-x="${di},${ii}">✕</button>
 <div class="row full" style="width:100%;font-size:13px"><label class="grow">Подходы<input type="number" value="${it.sets}" data-e="${di},${ii},sets"></label><label class="grow">Повт. от<input type="number" value="${it.min}" data-e="${di},${ii},min"></label><label class="grow">до<input type="number" value="${it.max}" data-e="${di},${ii},max"></label><label class="grow">Отдых, с<input type="number" value="${it.rest}" data-e="${di},${ii},rest"></label></div></div>`).join('')}
 <button class="full sm" style="margin-top:10px" data-ad="${di}">+ Упражнение</button></div>`).join('')}
 <div class="card"><b>Подходов на группу мышц в неделю</b><div style="margin-top:6px">${volBadges()}</div><div class="mut" style="margin-top:6px">Ориентир для роста мышц: 10–20 подходов (Schoenfeld 2017).</div></div>`;
 $('#chg').onclick=()=>{Q=null;go('quiz')};$('#cat').onclick=()=>go('catalog');
 app.querySelectorAll('[data-swp]').forEach(b=>b.onclick=()=>{const[di,ii]=b.dataset.swp.split(',');const it=S.program[di].items[ii];swapModal(it.exId,S.prof,id=>{it.exId=id;save();program()})});
 $('#sci').onclick=()=>go('science');
 app.querySelectorAll('[data-dn]').forEach(i=>i.onchange=()=>{S.program[i.dataset.dn].name=i.value;save()});
 app.querySelectorAll('[data-e]').forEach(i=>i.onchange=()=>{const[d,k,f]=i.dataset.e.split(',');S.program[d].items[k][f]=+i.value;save();program()});
 const mv=(a,d)=>{const[di,ii]=a.split(',').map(Number),L=S.program[di].items,j=ii+d;if(j<0||j>=L.length)return;[L[ii],L[j]]=[L[j],L[ii]];save();program()};
 app.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>mv(b.dataset.up,-1));app.querySelectorAll('[data-dn2]').forEach(b=>b.onclick=()=>mv(b.dataset.dn2,1));
 app.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>{const[di,ii]=b.dataset.x.split(',');S.program[di].items.splice(ii,1);save();program()});
 app.querySelectorAll('[data-ad]').forEach(b=>b.onclick=()=>pickEx(id=>{const p=PRM[S.goal].a;S.program[b.dataset.ad].items.push({exId:id,sets:p[0][1],min:p[1],max:p[2],rest:p[3]});save();program()}))}
function volBadges(){const v={};S.program.forEach(d=>d.items.forEach(it=>{const g=exBy(it.exId).group;if(g!=='Кардио')v[g]=(v[g]||0)+it.sets}));return Object.entries(v).map(([g,n])=>`<span class="badge">${g}: ${n}</span>`).join('')}
function pickEx(cb){const m=$('#modal');m.classList.remove('hidden');
 m.innerHTML=`<div class="sheet"><div class="row"><input id="q" placeholder="Поиск упражнения"><button id="mc">✕</button></div><div id="el"></div></div>`;
 const draw=()=>{const q=$('#q').value.toLowerCase();$('#el').innerHTML=GROUPS.map(g=>{const l=allEx().filter(e=>e.group===g&&e.name.toLowerCase().includes(q));return l.length?`<h2>${g}</h2>`+l.map(e=>`<div class="row"><button class="full grow" style="margin:3px 0;text-align:left" data-p="${e.id}">${esc(e.name)}</button>${techBtn(e.id)}</div>`).join(''):''}).join('');
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
// ---------- Тело
const BM=[['weight','Вес','кг'],['fat','Жир','%'],['neck','Шея','см'],['chest','Грудь','см'],['waist','Талия','см'],['belly','Живот','см'],['hips','Бёдра (таз)','см'],['biceps','Бицепс','см'],['thigh','Бедро','см'],['calf','Икра','см']];
const idb=(()=>{let p;const open=()=>p=p||new Promise((res,rej)=>{const r=indexedDB.open('moyzal',1);r.onupgradeneeded=()=>r.result.createObjectStore('photos');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
 const tx=(m,f)=>open().then(db=>new Promise((res,rej)=>{const t=db.transaction('photos',m),st=t.objectStore('photos'),q=f(st);t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error)}));
 return{get:k=>tx('readonly',s=>s.get(k)),put:(k,v)=>tx('readwrite',s=>s.put(v,k)),del:k=>tx('readwrite',s=>s.delete(k)),all:()=>tx('readonly',s=>s.getAllKeys()).then(async ks=>{const o={};for(const k of ks)o[k]=await idb.get(k);return o})}})();
function compress(file){return new Promise((res,rej)=>{const img=new Image();img.onload=()=>{const k=Math.min(1,900/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=img.width*k;c.height=img.height*k;c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(img.src);res(c.toDataURL('image/jpeg',.72))};img.onerror=rej;img.src=URL.createObjectURL(file)})}
let bM='weight',bR=0,cmpA=null,cmpB=null;
const fmtD=d=>new Date(d).toLocaleDateString('ru-RU',{day:'numeric',month:'short',year:'2-digit'});
const sgn=(v,u)=>(v>0?'+':'')+(Math.round(v*10)/10)+' '+u;
function body(){$('#title').textContent='Тело';const E=S.body.slice().sort((a,b)=>a.date.localeCompare(b.date));
 const m=BM.find(x=>x[0]===bM),from=bR?Date.now()-bR*864e5:0,pts=E.filter(e=>e[bM]!==''&&e[bM]!=null&&new Date(e.date)>=from).map(e=>[new Date(e.date).getTime(),+e[bM]]);
 const all=E.filter(e=>e[bM]!==''&&e[bM]!=null),last=all[all.length-1],first=all[0],prev=all[all.length-2];
 const lw=E.filter(e=>+e.weight>0).pop(),bmi=S.height&&lw?(+lw.weight/((S.height/100)**2)):0;
 const bmiT=bmi?(bmi<18.5?'ниже нормы':bmi<25?'норма':bmi<30?'избыточный вес':'ожирение'):'';
 const ph=E.filter(e=>e.photos&&e.photos.length);if(!ph.some(e=>e.id===cmpA))cmpA=null;if(!ph.some(e=>e.id===cmpB)||(cmpA&&cmpA===cmpB&&ph.length>1))cmpB=ph.length?ph[ph.length-1].id:null;if(!cmpA&&ph.length)cmpA=ph[0].id;
 app.innerHTML=`<button class="pri full" id="badd">+ Новый замер</button><button class="full" id="bguide" style="margin-top:8px">📐 Где и как мерить</button>
 <div class="card"><div class="chips sm2">${BM.map(([k,l])=>`<button class="opt chip ${bM===k?'sel':''}" data-bm="${k}">${l}</button>`).join('')}</div>
 <div class="chips sm2">${[[30,'1 мес'],[90,'3 мес'],[180,'6 мес'],[365,'1 год'],[0,'Всё']].map(([d,l])=>`<button class="opt chip ${bR===d?'sel':''}" data-br="${d}">${l}</button>`).join('')}</div>
 ${pts.length?'<canvas id="bch"></canvas>':'<p class="mut">Нет данных по этому показателю за период.</p>'}
 ${last?`<div class="grid2" style="margin-top:10px"><div><div class="mut">Сейчас</div><b style="font-size:22px">${last[bM]} ${m[2]}</b></div><div><div class="mut">От первого (${fmtD(first.date)})</div><b>${sgn(last[bM]-first[bM],m[2])}</b><br><span class="mut">от прошлого: ${prev?sgn(last[bM]-prev[bM],m[2]):'—'}</span></div></div>`:''}</div>
 <div class="card"><div class="row"><span class="grow">Рост</span><input type="number" id="hgt" inputmode="numeric" placeholder="см" value="${S.height||''}" style="width:100px"></div>${bmi?`<p>ИМТ: <b>${bmi.toFixed(1)}</b> <span class="mut">(${bmiT}; ВОЗ: 18,5–24,9 — норма. Для людей с большой мышечной массой ИМТ может завышать)</span></p>`:'<p class="mut">Укажи рост — посчитаем ИМТ.</p>'}</div>
 ${ph.length>=1?`<h2>Сравнение фото</h2><div class="card"><div class="grid2"><select id="ca">${ph.map(e=>`<option value="${e.id}" ${e.id===(cmpA||ph[0].id)?'selected':''}>${fmtD(e.date)}</option>`).join('')}</select><select id="cb">${ph.map(e=>`<option value="${e.id}" ${e.id===(cmpB||ph[ph.length-1].id)?'selected':''}>${fmtD(e.date)}</option>`).join('')}</select></div><div class="photos" style="margin-top:8px"><img id="ia" alt=""><img id="ib" alt=""></div></div>`:''}
 <h2>Замеры (${E.length})</h2>${E.slice().reverse().map(e=>`<div class="card"><div class="row"><b class="grow">${fmtD(e.date)}</b><button class="sm" data-be="${e.id}">✎</button></div>
 <div>${BM.filter(([k])=>e[k]!==''&&e[k]!=null).map(([k,l,u])=>`<span class="badge">${l}: ${e[k]} ${u}</span>`).join('')}</div>${e.note?`<div class="mut">${esc(e.note)}</div>`:''}${e.photos&&e.photos.length?`<div class="thumbs" data-th="${e.id}"></div>`:''}</div>`).join('')||'<p class="mut">Добавь первый замер — вес, обхваты и фото, чтобы видеть, как меняется тело.</p>'}`;
 $('#badd').onclick=()=>bodyForm();$('#bguide').onclick=()=>guide();app.querySelectorAll('[data-bm]').forEach(b=>b.onclick=()=>{bM=b.dataset.bm;body()});app.querySelectorAll('[data-br]').forEach(b=>b.onclick=()=>{bR=+b.dataset.br;body()});
 app.querySelectorAll('[data-be]').forEach(b=>b.onclick=()=>bodyForm(S.body.find(e=>e.id===b.dataset.be)));
 $('#hgt').onchange=e=>{S.height=+e.target.value||0;save();body()};if(pts.length)chart($('#bch'),pts);
 app.querySelectorAll('[data-th]').forEach(async d=>{const e=S.body.find(x=>x.id===d.dataset.th);for(const k of e.photos){const u=await idb.get(k);if(u){const i=new Image();i.src=u;d.append(i)}}});
 if(ph.length){const show=async()=>{cmpA=$('#ca').value;cmpB=$('#cb').value;for(const[sel,img]of[[cmpA,'#ia'],[cmpB,'#ib']]){const e=S.body.find(x=>x.id===sel);$(img).src=(e&&await idb.get(e.photos[0]))||''}};$('#ca').onchange=show;$('#cb').onchange=show;show()}}
function bodyForm(e){const isNew=!e;e=e||{id:'b'+Date.now(),date:new Date().toISOString().slice(0,10),photos:[]};const newPh=[],delPh=[];const m=$('#modal');m.classList.remove('hidden');
 m.innerHTML=`<div class="sheet"><div class="row"><h2 class="grow" style="margin:0">${isNew?'Новый замер':'Изменить замер'}</h2><button id="mc">✕</button></div>
 <label class="mut">Дата<input type="date" id="bd" value="${e.date}"></label><div class="grid2" style="margin-top:8px">${BM.map(([k,l,u])=>`<label><span class="row" style="justify-content:space-between">${l}, ${u}<button type="button" class="gi" data-gi="${k}">ⓘ Где мерить?</button></span><input type="number" inputmode="decimal" step="0.1" data-bf="${k}" value="${e[k]??''}"></label>`).join('')}</div>
 <label class="mut">Заметка<textarea id="bn" rows="2">${esc(e.note||'')}</textarea></label>
 <div class="thumbs" id="bph" style="margin:8px 0"></div><label class="btn full" style="display:flex;align-items:center;justify-content:center">📷 Добавить фото<input type="file" id="bfile" accept="image/*" multiple hidden></label>
 <p class="mut" style="font-size:12px">Фото хранятся только на этом телефоне (сжатые).</p>
 <button class="pri full" id="bsave">Сохранить</button>${isNew?'':'<button class="danger full" id="bdel" style="margin-top:8px">Удалить замер</button>'}</div>`;
 const drawPh=async()=>{const d=$('#bph');d.innerHTML='';for(const k of e.photos.filter(k=>!delPh.includes(k)).concat(newPh.map(x=>x[0]))){const u=(newPh.find(x=>x[0]===k)||[])[1]||await idb.get(k);const i=new Image();i.src=u;i.title='Нажми, чтобы удалить';i.onclick=()=>{if(!confirm('Удалить фото?'))return;const j=newPh.findIndex(x=>x[0]===k);if(j>=0)newPh.splice(j,1);else delPh.push(k);drawPh()};d.append(i)}};drawPh();
 $('#bfile').onchange=async ev=>{for(const f of ev.target.files){try{newPh.push(['p'+Date.now()+Math.random().toString(36).slice(2,6),await compress(f)])}catch(_){alert('Не удалось открыть фото')}}drawPh()};
 m.querySelectorAll('[data-gi]').forEach(b=>b.onclick=ev=>{ev.preventDefault();guide(b.dataset.gi)});
 $('#mc').onclick=()=>m.classList.add('hidden');
 $('#bsave').onclick=async()=>{e.date=$('#bd').value||e.date;m.querySelectorAll('[data-bf]').forEach(i=>e[i.dataset.bf]=i.value===''?'':+i.value);e.note=$('#bn').value.trim();
  for(const[k,u]of newPh)await idb.put(k,u);for(const k of delPh)await idb.del(k);e.photos=e.photos.filter(k=>!delPh.includes(k)).concat(newPh.map(x=>x[0]));
  if(isNew)S.body.push(e);save();m.classList.add('hidden');toast('Замер сохранён');body()};
 if($('#bdel'))$('#bdel').onclick=async()=>{if(!confirm('Удалить замер вместе с фото?'))return;for(const k of e.photos)await idb.del(k);S.body=S.body.filter(x=>x.id!==e.id);save();m.classList.add('hidden');body()}}
// ---------- Где мерить (иллюстрации — собственные SVG)
const FIG=`<g fill="#3a4252" stroke="#6b7590" stroke-width="1.5" stroke-linejoin="round">
<path d="M56 86 Q40 92 38 122 L32 182 Q30 212 33 240 Q38 246 44 241 Q45 212 48 184 L57 132 Z"/><path d="M144 86 Q160 92 162 122 L168 182 Q170 212 167 240 Q162 246 156 241 Q155 212 152 184 L143 132 Z"/>
<path d="M63 246 L99 252 L98 300 Q96 328 95 350 L93 398 L73 400 L72 350 Q67 326 65 300 Z"/><path d="M137 246 L101 252 L102 300 Q104 328 105 350 L107 398 L127 400 L128 350 Q133 326 135 300 Z"/>
<path d="M70 80 Q100 74 130 80 L144 86 Q151 94 146 112 L138 150 Q132 170 131 180 Q137 202 140 224 L139 252 Q100 262 61 252 L60 224 Q63 202 69 180 Q68 170 62 150 L54 112 Q49 94 56 86 Z"/>
<rect x="90" y="58" width="20" height="24" rx="6"/><ellipse cx="100" cy="38" rx="21" ry="26"/></g>
<circle cx="100" cy="190" r="2" fill="#6b7590"/>`;
const tape=(cx,cy,rx,lbl)=>`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${Math.max(3,rx/9)}" fill="none" stroke="#ff6b35" stroke-width="3.5"/>${lbl?`<circle cx="${cx+rx+12}" cy="${cy}" r="8" fill="#ff6b35"/><text x="${cx+rx+12}" y="${cy+4}" font-size="10" font-weight="700" text-anchor="middle" fill="#fff">${lbl}</text>`:''}`;
const TP={neck:[100,74,12],chest:[100,112,46],waist:[100,168,33],belly:[100,190,33],hips:[100,232,40],thigh:[81,268,17],calf:[83,338,12]};
const svgWrap=(inner,vb='-20 0 240 420')=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" class="gsvg"><rect width="100%" height="100%" fill="#14171d"/>${inner}</svg>`;
const scaleSvg=pct=>svgWrap(FIG+`<rect x="58" y="398" width="84" height="14" rx="4" fill="#2b313d" stroke="#ff6b35" stroke-width="2.5"/><rect x="86" y="401" width="28" height="8" rx="2" fill="#ff6b35"/><text x="100" y="408" font-size="7" text-anchor="middle" fill="#fff" font-weight="700">${pct?'%':'кг'}</text>`,'-20 0 240 420');
const ARM=svgWrap(`<g fill="#3a4252" stroke="#6b7590" stroke-width="1.5" stroke-linejoin="round">
<path d="M14 40 Q40 20 70 40 L70 190 L14 190 Z"/>
<path d="M136 64 Q130 30 140 4 L172 2 Q178 40 172 96 Z"/><circle cx="156" cy="-4" r="17"/>
<path d="M40 58 Q100 18 158 54 Q176 66 172 92 Q166 108 146 108 Q100 116 44 112 Z"/><circle cx="44" cy="80" r="30"/></g>
<ellipse cx="102" cy="72" rx="8" ry="38" fill="none" stroke="#ff6b35" stroke-width="3.5"/>
<text x="0" y="150" font-size="10" fill="#cfd5e0">Рука согнута под 90°, бицепс напряжён;</text><text x="0" y="164" font-size="10" fill="#cfd5e0">лента — в самом широком месте</text>`,'-6 -26 220 200');
const GUIDE={
weight:['Вес','Утром, сразу после туалета, до еды и питья, без одежды (или в одном белье). Всегда на одних и тех же весах, стоящих на ровном твёрдом полу. Вес колеблется день ко дню на 0,5–1,5 кг из-за воды и еды — смотри на тренд за недели, а не на один замер.',()=>scaleSvg()],
fat:['% жира','Измеряй одним и тем же способом и прибором (весы-анализатор, калипер, DEXA) и в одинаковых условиях: утром, натощак, после туалета, до тренировки. Биоимпедансные весы сильно зависят от количества воды в теле — важна динамика, а не точное число.',()=>scaleSvg(1)],
neck:['Шея','Сразу ниже кадыка (гортани), лента перпендикулярно оси шеи (слегка наклонена вперёд-вниз). Смотри прямо, плечи опущены, шею не напрягай.',()=>svgWrap(FIG+tape(...TP.neck))],
chest:['Грудь','Горизонтально на уровне сосков, лента проходит под мышками и по лопаткам. Руки опущены вдоль тела, замер — в конце обычного спокойного выдоха.',()=>svgWrap(FIG+tape(...TP.chest))],
waist:['Талия','Посередине между нижним ребром и верхним краем подвздошной кости (тазовой косточки) — по протоколу ВОЗ. Стоя, ноги вместе, руки расслаблены, живот не втягивай; замер в конце обычного выдоха.',()=>svgWrap(FIG+tape(...TP.waist)+`<line x1="130" y1="152" x2="150" y2="152" stroke="#ffc83d" stroke-dasharray="3 2"/><text x="152" y="155" font-size="8" fill="#ffc83d">нижнее ребро</text><line x1="133" y1="186" x2="150" y2="186" stroke="#ffc83d" stroke-dasharray="3 2"/><text x="152" y="189" font-size="8" fill="#ffc83d">край таза</text>`)],
belly:['Живот','Горизонтально на уровне пупка. Стоя, живот расслаблен (не втягивай и не надувай), замер в конце обычного выдоха.',()=>svgWrap(FIG+tape(...TP.belly))],
hips:['Бёдра (таз)','По самой выступающей части ягодиц, лента строго горизонтально. Стопы вместе, ягодицы расслаблены. Удобно мерить перед зеркалом боком.',()=>svgWrap(FIG+tape(...TP.hips))],
biceps:['Бицепс','Правая рука (всегда одна и та же): согни руку под 90° и напряги бицепс; мерь в самом широком месте, лента перпендикулярно плечевой кости. Если хочешь мерить расслабленную руку — тоже можно, но всегда одинаково.',()=>ARM],
thigh:['Бедро','Правая нога (всегда одна и та же): сразу под ягодичной складкой, в самом широком месте бедра. Стой прямо, вес равномерно на обе ноги, мышцы расслаблены.',()=>svgWrap(FIG+tape(...TP.thigh))],
calf:['Икра','Правая нога: в самом широком месте икроножной мышцы. Стоя, вес на обе ноги, икра расслаблена.',()=>svgWrap(FIG+tape(...TP.calf))]};
const OVERVIEW=()=>svgWrap(FIG+Object.entries(TP).map(([k,t],i)=>tape(t[0],t[1],t[2],i+1)).join('')+`<g font-size="9" fill="#cfd5e0">${Object.keys(TP).map((k,i)=>`<text x="-16" y="${300+i*14}">${i+1} ${GUIDE[k][0]}</text>`).join('')}</g>`);
const TIPS='<b>Общие правила</b><ul style="margin:6px 0;padding-left:18px"><li>Мягкая сантиметровая лента: плотно прилегает к коже, но не сдавливает.</li><li>Лента горизонтальна (параллельно полу), не перекручена.</li><li>Всегда в одно время дня (лучше утром), в расслабленном состоянии, не после тренировки.</li><li>Мерь 2 раза и запиши среднее; если разница больше 1 см — третий замер.</li><li>Одна и та же сторона тела для рук и ног.</li><li>Достаточно раз в неделю или раз в 2 недели.</li></ul>';
const GSRC='<p class="mut" style="font-size:12px">Талия: World Health Organization (2011). Waist circumference and waist–hip ratio: report of a WHO expert consultation, Geneva, 8–11 December 2008. Geneva: WHO.</p>';
function guide(k){let d=$('#gd');if(!d){d=document.createElement('div');d.id='gd';document.body.append(d)}const g=k?GUIDE[k]:null;
 d.className='';d.innerHTML=`<div class="sheet"><div class="row"><h2 class="grow" style="margin:0">${g?'Где мерить: '+g[0]:'Как правильно мерить'}</h2><button id="gdc">✕</button></div>
 <div class="gpic" id="gpic">${g?g[2]():OVERVIEW()}<div class="mut" style="text-align:center;font-size:12px">Нажми на картинку, чтобы увеличить</div></div>
 ${g?`<p>${g[1]}</p>`:''}<div class="card">${TIPS}</div>${!g||k==='waist'?GSRC:''}
 ${g?'':`<div class="chips sm2">${Object.entries(GUIDE).map(([kk,v])=>`<button class="opt chip" data-gk="${kk}">${v[0]}</button>`).join('')}</div>`}</div>`;
 $('#gdc').onclick=()=>d.remove();d.onclick=e=>{if(e.target===d)d.remove()};d.querySelectorAll('[data-gk]').forEach(b=>b.onclick=()=>guide(b.dataset.gk));
 $('#gpic').onclick=()=>{const f=document.createElement('div');f.id='gfull';f.innerHTML=(g?g[2]():OVERVIEW());f.onclick=()=>f.remove();document.body.append(f)}}
// ---------- Ещё
function more(){$('#title').textContent='Ещё';
 app.innerHTML=`<button class="full card" id="sci" style="text-align:left">📚 Научная основа программ</button><button class="full card" id="lib" style="text-align:left">📖 Библиотека упражнений</button>
 <div class="card"><b>Звук и экран</b>
 <label class="li"><span class="grow">🔊 Звуковой сигнал таймера</span><input type="checkbox" id="snd" style="width:28px;min-height:28px" ${S.sound!==false?'checked':''}></label>
 <label class="li"><span class="grow">💡 Не гасить экран во время тренировки</span><input type="checkbox" id="wk" style="width:28px;min-height:28px" ${S.wake!==false?'checked':''}></label>
 <p class="mut">iPhone: выключи беззвучный режим (переключатель сбоку) и не блокируй экран — иначе звук таймера может не прозвучать. Громкость — кнопками телефона.</p></div>
 <div class="card"><b>Таймер отдыха</b><p class="mut">По умолчанию берётся из программы. Можно задать одно значение для всех упражнений:</p>
 <div class="row"><input type="number" id="ro" placeholder="Из программы" value="${S.restOverride||''}"><span class="mut">сек</span></div></div>
 <div class="card"><b>Резервная копия</b><p class="mut">Все данные хранятся только на этом телефоне, в браузере. Периодически сохраняй копию.</p>
 <button class="full" id="exp">⬇ Экспорт (JSON)</button><label class="li"><span class="grow">Включить фото тела в копию (файл будет больше)</span><input type="checkbox" id="expph" style="width:28px;min-height:28px" checked></label><label class="btn full" style="display:flex;align-items:center;justify-content:center;margin-top:8px">⬆ Импорт<input type="file" id="imp" accept=".json,application/json" hidden></label></div>
 <button class="danger full" id="reset">Сбросить все данные</button><p class="mut" style="text-align:center;margin:16px 0 8px">Версия 11</p>`;
 $('#snd').onchange=e=>{S.sound=e.target.checked;save()};$('#wk').onchange=e=>{S.wake=e.target.checked;save();wake()};
 $('#sci').onclick=()=>go('science');$('#lib').onclick=()=>go('library');$('#ro').onchange=e=>{S.restOverride=+e.target.value||0;save()};
 $('#exp').onclick=async()=>{const D={...S};if($('#expph').checked&&S.body.some(e=>e.photos&&e.photos.length))D.photos=await idb.all();const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(D)],{type:'application/json'}));a.download='moy-zal-'+new Date().toISOString().slice(0,10)+'.json';a.click()};
 $('#imp').onchange=async e=>{try{const d=JSON.parse(await e.target.files[0].text());if(!d.workouts)throw 0;if(confirm('Заменить текущие данные данными из файла?')){const P=d.photos;delete d.photos;d.body=d.body||[];d.custom=d.custom||[];S=d;if(P)for(const k in P)await idb.put(k,P[k]);save();toast('Данные восстановлены');go('today')}}catch(_){alert('Не удалось прочитать файл')}};
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
sx:'Roberts BM, Nuckols G, Krieger JW (2020). Sex differences in resistance training: A systematic review and meta-analysis. Journal of Strength and Conditioning Research, 34(5), 1448–1460.',
w:'Bull FC, Al-Ansari SS, Biddle S, et al. (2020). World Health Organization 2020 guidelines on physical activity and sedentary behaviour. British Journal of Sports Medicine, 54(24), 1451–1462.'};
const SCI={mass:[['Объём','10–20 рабочих подходов на группу мышц в неделю: больше подходов — больше рост (дозозависимый эффект).',['v']],['Частота','Каждую мышцу тренируем ~2 раза в неделю — это даёт больший рост, чем 1 раз.',['f']],['Повторы и близость к отказу','Мышцы растут в широком диапазоне (≈6–30 повторов), если подход доведён близко к отказу (1–2 повтора в запасе). Практично: 6–10 в базовых, 10–15 в изолирующих.',['l']],['Отдых','2–3 мин между подходами в базовых упражнениях дают больше прогресса, чем 1 мин.',['r']],['Прогрессия (двойная)','Работай в диапазоне повторов; когда все подходы выполнены на верхней границе — увеличь вес на 2,5–5% и снова начинай с нижней. Приложение подсказывает это.',['a']],['Белок','≈1,6 г белка на кг веса тела в день — дальше дополнительной пользы почти нет.',['p']]],
str:[['Интенсивность','Сила лучше всего растёт при тяжёлых весах: >80% от 1ПМ, примерно 1–6 повторов.',['l','a']],['Отдых','3–5 мин между тяжёлыми подходами в базовых упражнениях (у нас 3 мин по умолчанию).',['a','r']],['Объём','Несколько подходов (multi-set) дают больше силы, чем один подход.',['rv']],['Частота','При равном объёме частота не так важна, но 2–3 раза в неделю на движение — удобный способ набрать объём.',['gf']],['Прогрессия','Постепенно повышай нагрузку: при выполнении всех повторов — +2,5–5% к весу.',['a']]],
fit:[['Силовые 2–3 раза в неделю','Для здоровья и общей формы: силовые на все крупные группы мышц 2–3 раза в неделю, 8–12 (до 15) повторов, новичкам — 1–3 подхода.',['a']],['Активность','ВОЗ: 150–300 мин умеренной активности в неделю + силовые минимум 2 дня.',['w']],['Мужчины и женщины','В относительных величинах прирост силы и мышц у мужчин и женщин сопоставим — принципы одинаковы.',['sx']],['Прогрессия','Плавно увеличивай нагрузку, когда выполняешь верхнюю границу повторов.',['a']]],
loss:[['Силовые обязательно','Силовые тренировки при дефиците калорий помогают сохранить мышцы; поэтому программа сохраняет базовые упражнения (10–15 повторов, отдых 60–90 с).',['d','a']],['Кардио','ВОЗ: 150–300 мин умеренной или 75–150 мин интенсивной активности в неделю; для заметного снижения веса ACSM рекомендует >150 мин, а лучше 225–420 мин в неделю.',['w','d']],['Калории','Главный фактор похудения — дефицит калорий (питание). Одна только активность даёт умеренный эффект.',['d']],['Белок','Достаточно белка (≈1,6 г/кг) помогает удерживать мышечную массу.',['p']]]};
function science(fromOb){$('#title').textContent='Научная основа';const g=S.goal||ob.goal;let cur=window._sg||g;
 const used=[...new Set(SCI[cur].flatMap(x=>x[2]))];
 app.innerHTML=`<div class="tabs">${Object.entries(GOALS).map(([k,t])=>`<button class="sm ${cur===k?'on':''}" data-sg="${k}">${t}</button>`).join('')}</div>
 ${SCI[cur].map(([t,d,s])=>`<div class="card"><h3>${t}</h3><div>${d}</div><div class="mut" style="margin-top:6px">${s.map(k=>'['+(used.indexOf(k)+1)+']').join(' ')}</div></div>`).join('')}
 <h2>Источники</h2><div class="card mut" style="font-size:13px">${used.map((k,i)=>`<p>[${i+1}] ${SRC[k]}</p>`).join('')}</div>
 <p class="mut">Это общие рекомендации для здоровых взрослых, а не медицинская консультация.</p><button class="full" id="back" style="margin-bottom:16px">← Назад</button>`;
 app.querySelectorAll('[data-sg]').forEach(b=>b.onclick=()=>{window._sg=b.dataset.sg;science(fromOb)});
 $('#back').onclick=()=>{window._sg=null;if(!S.goal)onboarding();else go('more')}}
if('serviceWorker'in navigator){const had=!!navigator.serviceWorker.controller;let rl=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(had&&!rl){rl=true;location.reload()}});navigator.serviceWorker.register('sw.js').then(r=>r.update()).catch(()=>{})}
go(S.goal?'today':'today');
