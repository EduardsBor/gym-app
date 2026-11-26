'use strict';
const APP_VERSION='1.0';
function swCacheVer(){const m=typeof SW_CACHE==='string'&&/^moyzal-(v\d+(?:-[a-z]+)?)$/.exec(SW_CACHE);return m?m[1]:''}
function appVersionLabel(){const v=swCacheVer();return v?APP_VERSION+' ('+v+')':APP_VERSION}

const $=s=>document.querySelector(s), app=$('#app');
const GROUPS=['Грудь','Спина','Ноги','Плечи','Бицепс','Трицепс','Пресс','Кардио'];
const EX=[['bp','Жим штанги лёжа','Грудь'],['dbp','Жим гантелей лёжа','Грудь'],['ibp','Жим штанги на наклонной','Грудь'],['idb','Жим гантелей на наклонной','Грудь'],['fly','Разводка гантелей','Грудь'],['mk-cable-pec-fly','Сведение рук в кроссовере','Грудь'],['mk-parralel-bar-dips','Отжимания на брусьях','Грудь'],['pu','Отжимания от пола','Грудь'],
['mk-barbell-deadlift','Становая тяга со штангой','Спина'],['pull','Подтягивания','Спина'],['lat','Тяга верхнего блока','Спина'],['row','Тяга штанги в наклоне','Спина'],['dbr','Тяга гантели одной рукой','Спина'],['cr','Тяга горизонтального блока','Спина'],['hyp','Гиперэкстензия','Спина'],['mk-dumbbell-shrug','Шраги с гантелями','Спина'],
['sq','Приседания со штангой','Ноги'],['fsq','Фронтальные приседания','Ноги'],['lp','Жим ногами','Ноги'],['rdl','Румынская тяга','Ноги'],['lun','Выпады с гантелями','Ноги'],['bss','Болгарские сплит-приседания','Ноги'],['le','Разгибание ног','Ноги'],['lc','Сгибание ног','Ноги'],['ht','Ягодичный мост с опорой спиной на скамью (хип-траст)','Ноги'],['mk-standing-calf-raise-machine','Подъём на носки стоя в тренажёре','Ноги'],['gsq','Гоблет-присед','Ноги'],
['ohp','Жим штанги стоя','Плечи'],['dsp','Жим гантелей сидя','Плечи'],['lr','Махи гантелями в стороны','Плечи'],['mk-dumbbell-rear-delt-fly','Разведение гантелей в наклоне на заднюю дельту','Плечи'],['mk-cable-seated-rope-face-pull','Тяга каната к лицу сидя','Плечи'],['mk-barbell-upright-row','Тяга штанги к груди широким хватом','Плечи'],
['bc','Подъём штанги на бицепс','Бицепс'],['dbc','Подъём гантелей на бицепс','Бицепс'],['hc','Молотки','Бицепс'],['mk-ez-bar-preacher-curl','Сгибание рук на скамье Скотта с EZ-грифом','Бицепс'],
['cgb','Жим узким хватом','Трицепс'],['mk-cable-bar-pushdown','Разгибание рук на блоке с прямой рукоятью','Трицепс'],['mk-ez-bar-skullcrusher','Французский жим лёжа с EZ-грифом','Трицепс'],['mk-dumbbell-seated-overhead-tricep-extension','Разгибание рук с гантелью из-за головы сидя','Трицепс'],
['mk-front-plank','Планка на предплечьях','Пресс'],['mk-crunches','Скручивания на полу','Пресс'],['mk-hanging-knee-raises','Подъём коленей в висе','Пресс'],['mk-rkc-plank','RKC-планка','Пресс'],['rt','Русский твист','Пресс'],
['mk-treadmill-run','Бег на беговой дорожке','Кардио'],['mk-indoor-cycling-spin','Велотренажёр (сайкл)','Кардио'],['mk-elliptical','Эллиптический тренажёр','Кардио'],['mk-rowing-machine-steady-state','Гребной тренажёр, ровный темп','Кардио'],['stair','Степпер','Кардио']].map(([id,name,group])=>({id,name,group}));
const GOALS={mass:'Масса',str:'Сила',loss:'Похудение / рельеф',fit:'Общая форма'};
// D-236: name of the «Сила» goal at home without dumbbells (place b), Eduards 19.11. The ONLY place to change it: this constant (RU) + its EN/LV triple in i18n/dict3.js.
const HOME_STR_LABEL='Сила и контроль тела';
function goalName(goal,place){return goal==='str'&&place==='b'?HOME_STR_LABEL:GOALS[goal]}
// Доп. упражнения (дом / свой вес / безопасные альтернативы)
[['bwsq','Приседания с весом тела','Ноги'],['mk-dumbbell-step-up-low','Зашагивание на низкую платформу с гантелями','Ноги'],['mk-dumbbell-stiff-leg-deadlift','Становая тяга на прямых ногах с гантелями','Ноги'],['inv','Австралийские подтягивания','Спина'],['chin','Подтягивания обратным хватом','Бицепс'],['ppu','Пайк-отжимания','Плечи'],['bd','Обратные отжимания от скамьи','Трицепс'],['mk-diamond-push-ups','Отжимания узкие «алмаз»','Трицепс'],['mch','Жим в тренажёре сидя (горизонтальный)','Грудь'],['dbug','Мёртвый жук','Пресс'],['bdog','Птица-собака','Пресс'],['mk-prone-y-t-raises','Подъём рук «Y-T» лёжа на животе','Плечи'],['nlc','Скандинавские сгибания ног','Ноги'],['sglb','Ягодичный мост на одной ноге','Ноги'],['bpl','Боковая планка','Пресс'],['jump','Прыжки / джампинг-джек','Кардио'],['mk-incline-treadmill-walk','Быстрая ходьба на дорожке с наклоном','Кардио']].forEach(([id,name,group])=>EX.push({id,name,group}));
// оборудование: g=зал, d=дом с гантелями, b=свой вес(+турник); риски: s=спина, k=колени, p=плечи
// ht остаётся «gdb»: слоты HINGE и LEGISO и запасные списки SQ/LUNGE подставляют его в программах «дом с гантелями» и «свой вес». Карточка описывает штангу, гантель и вариант без веса.
const META={bp:'g|p',dbp:'gd|',ibp:'g|p',idb:'gd|',fly:'gd|p',"mk-cable-pec-fly":'g|',"mk-parralel-bar-dips":'gb|p',pu:'gdb|',mch:'g|',"mk-barbell-deadlift":'g|s',inv:'gdb|',pull:'gdb|',lat:'g|',row:'g|s',dbr:'gd|',cr:'g|',hyp:'g|s',"mk-dumbbell-shrug":'gd|',
sq:'g|sk',fsq:'g|k',lp:'g|k',rdl:'g|s',"mk-dumbbell-stiff-leg-deadlift":'gd|s',lun:'gd|k',bss:'gd|k',le:'g|k',lc:'g|',ht:'gdb|',"mk-standing-calf-raise-machine":'gdb|',gsq:'gd|k',bwsq:'b|k',"mk-dumbbell-step-up-low":'gdb|',
ohp:'g|sp',dsp:'gd|p',lr:'gd|',"mk-dumbbell-rear-delt-fly":'gd|',"mk-cable-seated-rope-face-pull":'g|',"mk-barbell-upright-row":'g|p',ppu:'b|p',bc:'g|',dbc:'gd|',hc:'gd|',"mk-ez-bar-preacher-curl":'g|',chin:'gdb|',cgb:'g|p',"mk-cable-bar-pushdown":'g|',"mk-ez-bar-skullcrusher":'gd|p',"mk-dumbbell-seated-overhead-tricep-extension":'gd|p',bd:'db|p',"mk-diamond-push-ups":'gdb|',
"mk-front-plank":'gdb|',"mk-crunches":'gdb|',"mk-hanging-knee-raises":'gb|',"mk-rkc-plank":'gdb|s',rt:'gdb|',dbug:'gdb|',bdog:'gdb|',"mk-treadmill-run":'g|',"mk-indoor-cycling-spin":'g|',"mk-elliptical":'g|',"mk-rowing-machine-steady-state":'g|',stair:'g|',"mk-prone-y-t-raises":'gdb|',nlc:'gdb|k',sglb:'gdb|',bpl:'gdb|',jump:'db|k',"mk-incline-treadmill-walk":'gdb|'};
function eqNormPlaces(s){return[...'gdb'].filter(p=>String(s||'').includes(p)).join('')}
function eqPlacesOf(a){if(a&&a.places){const p=eqNormPlaces(a.places);if(p)return p}if(typeof eqPlaces==='function'&&typeof S!=='undefined'&&S&&a&&S.prof&&a===S.prof)return eqPlaces();if(a&&a.place&&'gdb'.includes(a.place))return a.place;if(typeof eqPlaces==='function')return eqPlaces();return'g'}
function eqAvail(id,places){const eq=((typeof META!=='undefined'&&META[id])||'gdb|').split('|')[0];if(!eq)return true;places=eqNormPlaces(places||eqPlacesOf());return![...places].length||[...places].some(p=>eq.includes(p))}
const okEx=(id,a)=>{const m=META[id];if(!m)return true;const[,r]=m.split('|');return eqAvail(id,eqPlacesOf(a))&&!(a&&a.lim||[]).some(l=>r.includes(l))};
const SLOT={SQ:[['sq','lp','gsq','bss','fsq','bwsq','mk-dumbbell-step-up-low'],['ht','mk-dumbbell-step-up-low','lc']],HINGE:[['rdl','mk-barbell-deadlift','mk-dumbbell-stiff-leg-deadlift','ht','hyp'],['ht','lc','bdog']],HPUSH:[['bp','dbp','mch','pu'],['mch','pu']],IPUSH:[['idb','ibp','pu','mk-parralel-bar-dips'],['mch','pu']],
VPUSH:[['ohp','dsp','ppu'],['lr']],HPULL:[['row','cr','dbr','inv'],['cr','inv']],VPULL:[['pull','lat','chin','inv'],['lat','inv']],LUNGE:[['bss','lun','mk-dumbbell-step-up-low','lp'],['ht','lc']],LEGISO:[['lc','le','ht','sglb','nlc'],['ht','sglb']],CALF:[['mk-standing-calf-raise-machine'],['sglb']],
SIDE:[['lr','mk-prone-y-t-raises','ppu'],['mk-prone-y-t-raises']],REAR:[['mk-cable-seated-rope-face-pull','mk-dumbbell-rear-delt-fly','mk-prone-y-t-raises'],['mk-dumbbell-rear-delt-fly','mk-prone-y-t-raises']],BI:[['bc','dbc','hc','chin','inv'],['hc']],TRI:[['mk-cable-bar-pushdown','mk-dumbbell-seated-overhead-tricep-extension','mk-ez-bar-skullcrusher','mk-diamond-push-ups','bd'],['mk-cable-bar-pushdown','mk-diamond-push-ups']],CORE:[['mk-front-plank','mk-hanging-knee-raises','mk-crunches','dbug','bdog','bpl','mk-rkc-plank'],['dbug','bdog']],CHEST2:[['fly','mk-cable-pec-fly','dbp','pu'],['mk-cable-pec-fly','pu']]};
const SLOTG={SQ:'Ноги',HINGE:'Ноги',LUNGE:'Ноги',LEGISO:'Ноги',CALF:'Ноги',HPUSH:'Грудь',IPUSH:'Грудь',CHEST2:'Грудь',VPUSH:'Плечи',SIDE:'Плечи',REAR:'Плечи',HPULL:'Спина',VPULL:'Спина',BI:'Бицепс',TRI:'Трицепс',CORE:'Пресс'};
const PRIO_SLOT={'Грудь':'CHEST2','Спина':'HPULL','Ноги':'LUNGE','Ягодицы':'LEGISO','Плечи':'SIDE','Бицепс':'BI','Трицепс':'TRI','Пресс':'CORE'};
const T={FA:['Фулбоди A','SQ HPUSH HPULL VPUSH LEGISO* BI* TRI* CORE*'],FB:['Фулбоди B','HINGE IPUSH VPULL HPULL* LUNGE* SIDE* REAR* CALF* CORE*'],FC:['Фулбоди C','SQ HPUSH VPULL HPULL* CHEST2* LUNGE* SIDE* TRI* BI*'],
U1:['Верх A','HPUSH HPULL VPUSH VPULL SIDE* BI* TRI*'],L1:['Низ A','SQ HINGE LUNGE LEGISO* CALF* CORE*'],U2:['Верх B','IPUSH VPULL VPUSH HPULL* CHEST2* REAR* BI* TRI*'],L2:['Низ B','HINGE SQ LUNGE LEGISO* CALF* CORE*'],
PU:['Жим (грудь, плечи, трицепс)','HPUSH VPUSH IPUSH SIDE* TRI* CHEST2*'],PL:['Тяга (спина, бицепс)','VPULL HPULL HPULL REAR* BI* BI*'],LG:['Ноги','SQ HINGE LUNGE LEGISO* CALF* CORE*']};
const SPLITS={2:['FA','FB'],3:['FA','FB','FC'],4:['U1','L1','U2','L2'],5:['PU','PL','LG','U1','L1'],6:['PU','PL','LG','PU','PL','LG']};
const SPLITNAME={2:'Фулбоди 2×',3:'Фулбоди 3×',4:'Верх / Низ',5:'Жим / Тяга / Ноги + Верх / Низ',6:'Жим / Тяга / Ноги ×2'};
// D-217b ACSM v1.3: подходы, повторы от, до, отдых (с) по цели и уровню (programs.json v1.3 params.sets_reps_rest; c — база, a — изоляция).
// Новичок на любой цели — 8–12 в базе; тяжёлые 3–6 — только опытные на «Силе». Тест сверяет с PROG.Q.
const PRM={str:{nov:{c:[3,8,12,150],a:[2,10,12,90]},mid:{c:[4,6,10,180],a:[3,8,12,90]},adv:{c:[5,3,6,180],a:[3,6,10,120]}},
mass:{nov:{c:[3,8,12,90],a:[2,10,12,60]},mid:{c:[3,6,12,120],a:[3,8,15,60]},adv:{c:[4,6,10,180],a:[3,10,15,75]}},
loss:{nov:{c:[2,10,12,60],a:[2,12,15,60]},mid:{c:[3,8,12,90],a:[3,12,15,60]},adv:{c:[3,6,10,90],a:[3,12,20,60]}},
fit:{nov:{c:[2,8,12,60],a:[2,12,15,60]},mid:{c:[3,8,12,90],a:[3,12,15,60]},adv:{c:[3,6,12,90],a:[3,12,20,60]}}};
function prmOf(goal,level){const g=PRM[goal]||PRM.fit;return g[level]||g.mid}
const prmMe=()=>prmOf(S.goal||'fit',S.prof&&S.prof.level);
const LV={nov:0,mid:1,adv:2},LVN={nov:'Новичок',mid:'Средний',adv:'Опытный'},PLN={g:'Тренажёрный зал',d:'Дом с гантелями',b:'Дом (без инвентаря)'};
const LIMN={s:'спина',k:'колени',p:'плечи'};
const eqOk=(id,a)=>eqAvail(id,eqPlacesOf(a));
const itemTime=it=>isCardio(it.exId)?it.max*60:it.sets*(40+it.rest),WARM=5,dayMin=(d,a)=>d.est?(typeof blockEstMin==='function'?blockEstMin(d):Math.round(d.est)):Math.round(d.items.reduce((t,i)=>t+itemTime(i),0)/60+WARM+rampN(d,a||(typeof S!=='undefined'&&S.prof)||{}));
const setTxt=it=>isCardio(it.exId)?it.min+'–'+it.max+' мин':it.sec?it.sets+'×'+it.min+'–'+it.max+' с':it.sets+'×'+it.min+'–'+it.max;
// Разминка: общая (кардио) + динамическая подвижность под мышцы дня + подводящие подходы к первому базовому упражнению.
// Fradkin 2010, McCrary 2015 (разминка улучшает результат), Behm 2016 (без долгой статической растяжки перед силовой).
const BWX=new Set(['pu','pull','inv','chin','ppu','bd','mk-diamond-push-ups','bwsq','mk-dumbbell-step-up-low','mk-parralel-bar-dips','nlc','sglb','mk-front-plank','mk-crunches','mk-hanging-knee-raises','rt','dbug','bdog','bpl','mk-rkc-plank','mk-prone-y-t-raises']);
const HINGEX=new Set(['mk-barbell-deadlift','rdl','mk-dumbbell-stiff-leg-deadlift','hyp','ht','sglb','nlc','lc']);
const WMOV={
hip:['Круги тазом','10 в каждую сторону','Руки на поясе, медленно вращай тазом, постепенно увеличивая амплитуду.'],
legsw:['Махи ногами','10 вперёд-назад и 10 в стороны каждой ногой','Держись за опору; махи свободные, без рывков, амплитуда растёт постепенно.'],
bwsq:['Приседания без веса','10 раз','Медленно, на комфортную глубину, колени смотрят по направлению носков.'],
glb:['Ягодичный мост лёжа','10 раз','Лёжа на спине, стопы на полу: поднимай таз, сжимая ягодицы, без прогиба в пояснице.'],
gm:['Упражнение на наклон с отведением таза (без веса)','10 раз','Стопы на ширине таза, колени чуть согнуты. Отвести таз назад, спина нейтральная. Вернуться толчком таза вперёд.'],
armc:['Круговые вращения руками вперёд и назад','10 вперёд и 10 назад','Руки в стороны, корпус ровно. Круги от малых к большим. Сначала вперёд, потом назад, плечи не поднимать.'],
dislo:['Проносы палки за голову','10 раз','Широкий хват палки, руки прямые. Плавно пронести палку над головой за спину и обратно. Без боли, если тяжело — хват шире.'],
pa:['Тяга резинки к лицу','15 раз','Резинка закреплена выше головы, лёгкое натяжение. Тянуть к лицу, разводя локти в стороны. Свести лопатки и медленно вернуть.'],
catcow:['«Кошка-верблюд»','8 раз','На четвереньках, кисти под плечами, колени под тазом. На выдохе округлить спину, на вдохе плавно прогнуть. Движение медленное, по всей спине.'],
scpull:['Подтягивания лопатками','8 раз','В висе на прямых руках опускай и своди лопатки — тело приподнимается на пару сантиметров.'],
bandrow:['Тяга резинки к поясу','12 раз','Резинка натянута на уровне пояса, спина прямая. Тянуть локти назад вдоль корпуса, свести лопатки. Медленно вернуть, плечи не поднимать.']};
function warmGroups(d){const g=new Set(d.items.map(i=>exBy(i.exId).group));return{legs:g.has('Ноги'),push:g.has('Грудь')||g.has('Плечи')||g.has('Трицепс'),pull:g.has('Спина')||g.has('Бицепс'),hinge:d.items.some(i=>HINGEX.has(i.exId))}}
function warmMain(d){const it=d.items.find(i=>!isCardio(i.exId)&&exBy(i.exId).group!=='Пресс');return it||null}
function rampScheme(a,exId){if(!exId)return[];a=a||{};if(a.place==='b'||BWX.has(exId))return[['bw',Math.max(4,Math.round(10/2))]];
 if(a.goal==='loss'||(a.len||60)<=30)return[[50,8]];if(a.goal==='str')return[[45,10],[65,5],[80,3]];return[[50,8],[70,4]]}
const rampN=(d,a)=>{const m=warmMain(d);return m?rampScheme(a,m.exId).length:0};
function warmPlan(d,a){a=a||{};const g=warmGroups(d),lim=a.lim||[],home=a.place!=='g';
 const gen=home?(lim.includes('k')?'Ходьба на месте с высоким подниманием колен':'Джампинг-джек или ходьба на месте'):(g.pull||(g.legs&&g.push)?'Гребной тренажёр или велотренажёр, лёгкий темп':g.legs?'Велотренажёр, лёгкий темп':'Гребной тренажёр или эллипс, лёгкий темп');
 let m=[];const up=()=>{m.push('armc');if(g.push)m.push(lim.includes('p')?'pa':'dislo');if(g.pull){m.push('catcow');m.push(a.place==='d'?'pa':(a.place==='b'?'scpull':'bandrow'))}};
 if(g.legs&&(g.push||g.pull)){m=['hip','bwsq',g.hinge?'gm':'legsw','armc',g.push?(lim.includes('p')?'pa':'dislo'):'catcow'];if(g.pull)m.push(a.place==='b'?'scpull':'catcow')}
 else if(g.legs){m=['hip','legsw','bwsq','glb'];if(g.hinge)m.push('gm')}else up();
 m=[...new Set(m)];const main=warmMain(d),sch=main?rampScheme(a,main.exId):[];
 let base=null;if(main&&typeof lastSets==='function'&&typeof S!=='undefined'&&S.workouts){const l=lastSets(main.exId);if(l&&l.length)base=Math.max(...l.map(s=>+s.w||0))||null}
 const ramp=sch.map(([p,r])=>p==='bw'?{t:'Лёгкий подход',r,w:null}:{t:p+'%',r,w:base?Math.max(0,Math.round(base*p/100/2.5)*2.5):null});
 return{gen,mob:m,main:main&&main.exId,ramp,min:WARM+ramp.length}}
function warmItems(P){return[{k:'gen',n:P.gen,d:'3 мин'},...P.mob.map(id=>({k:id,n:WMOV[id][0],d:WMOV[id][1],x:WMOV[id][2]})),...P.ramp.map((r,i)=>({k:'r'+i,n:'Подводящий подход',d:(r.w==null&&r.t!=='Лёгкий подход'?r.t+' × '+r.r:r.t==='Лёгкий подход'?'× '+r.r:r.t+' · '+r.w+' кг × '+r.r),ramp:1,pct:r.t}))]}
function wuId(it){if(it.ramp)return null;if(it.k==='gen'){const n=it.n;return /Гребн/.test(n)?'mk-rowing-machine-steady-state':/Велотр/.test(n)?'mk-indoor-cycling-spin':/Эллипс/.test(n)?'mk-elliptical':/Джампинг/.test(n)?'jump':'mk-walking-knee-hugs'}return ({march:'mk-walking-knee-hugs',hip:'w_hip',legsw:'w_legsw',glb:'w_glb',gm:'mk-hip-hinge-drill',armc:'mk-arm-circles-front-back',dislo:'mk-broomstick-pass-throughs',pa:'mk-band-high-face-pull',catcow:'mk-cat-camel',scpull:'w_scpull',bandrow:'mk-band-row',bwsq:'bwsq'})[it.k]||null}
function warmCoolCheck(kind,i,on){return `<button type="button" class="wu-check${on?' ok':''}" data-${kind}="${i}" aria-label="Готово" aria-pressed="${!!on}">✓</button>`}
function warmDoneCount(chk,total){return chk.slice(0,total).filter(Boolean).length}
function warmProgressText(n,total){return n+'/'+total+(total>0&&n===total?' <span class="wu-complete-mark" role="img" aria-label="Готово">✓</span>':'')}
function warmProgressHTML(n,total){return `<span class="mut" data-wu-progress="${total}">${warmProgressText(n,total)}</span>`}
function warmHTML(P,chk){const L=warmItems(P);const noW=P.ramp.some(r=>r.w==null&&r.t!=='Лёгкий подход');
 const row=(it,i)=>`<div class="li wu exo${chk?' wu-checkrow':''}${chk&&chk[i]?' done':''}" data-exo="w,${i}">${(()=>{const v=it.ramp?P.main:wuId(it);return v?animShot(v):''})()}<div class="grow"><div><span>${esc(it.n)}</span></div>${typeof exShort==='function'&&exShort(it.d)!==it.d&&it.d?`<div class="mut" style="font-size:12px">${esc(it.d)}</div>`:''}${it.x?`<div class="mut" style="font-size:12px">${esc(it.x)}</div>`:''}</div>${(()=>{const v=wuId(it);return v?techBtn(v).replace('data-ti=','data-wf="1" data-ti='):''})()}<span class="mut wu-dose">${esc(typeof exShort==='function'?exShort(it.d):it.d)}</span>${chk?warmCoolCheck('wu',i,chk[i]):''}</div>`;
 return `<div class="mut" style="font-size:13px;margin:4px 0"><span>1) Общая разминка — 3 мин</span> · <span>2) Подвижность суставов — ~2 мин</span>${P.ramp.length?` · <span>3) Подводящие подходы</span>`:''}</div>${L.map((it,i)=>(it.k==='r0'?`<div class="row" style="margin-top:10px"><b class="grow"><span>3) Подводящие подходы</span>: <span>${esc(exBy(P.main).name)}</span></b>${techBtn(P.main)}</div>`:'')+row(it,i)).join('')}${noW?'<div class="mut" style="font-size:12px;margin-top:4px">% — от твоего рабочего веса. Разминочные подходы не записываются в историю и рекорды.</div>':'<div class="mut" style="font-size:12px;margin-top:4px">Разминочные подходы не записываются в историю и рекорды.</div>'}`}

function pickFor(slot,a,used,off,acc){const[c,safe]=SLOT[slot];const allow=id=>okEx(id,a)&&(typeof autoOk!=='function'||autoOk(id,a,!!acc))&&!used.has(id);let L=c.filter(allow);let swapped=false;
 if(!L.length){L=safe.filter(allow);swapped=c.some(id=>eqOk(id,a))}
 if(!L.length){L=EX.filter(e=>e.group===SLOTG[slot]&&META[e.id]&&allow(e.id)).map(e=>e.id);swapped=true}
 if(!L.length)return null;const id=L[off%L.length];return{id,swapped:swapped||(c[0]!==id&&(a.lim||[]).length&&c.filter(x=>!used.has(x)&&eqOk(x,a))[0]!==id)}}
function generateAuto(a){a={sex:'m',level:'mid',len:60,place:'g',prio:[],lim:[],...a};const P=prmOf(a.goal,a.level),seen={},notes=[];let swaps=new Set();
 const days=(a.place!=='g'&&a.days>=5?(a.days==5?['U1','L1','U2','L2','FA']:['U1','L1','U2','L2','U1','L2']):SPLITS[a.days]).map(code=>{const[name,slots]=T[code];seen[code]=(seen[code]||0)+1;const off=seen[code]-1,used=new Set();
  let items=[];slots.split(' ').forEach(s=>{const acc=s.endsWith('*'),slot=s.replace('*','');const r=pickFor(slot,a,used,off,acc);if(!r)return;used.add(r.id);if(r.swapped)swaps.add(exBy(r.id).name);
   const p=P[acc?'a':'c'];let sets=p[0];if(a.prio.some(g=>SLOTG[slot]===g||(g==='Ягодицы'&&slot==='HINGE')))sets++;items.push({exId:r.id,sets,min:p[1],max:p[2],rest:p[3],acc,slot})});
  // доп. упражнение для приоритетных групп
  a.prio.forEach(g=>{const slot=PRIO_SLOT[g];if(items.some(i=>SLOTG[i.slot]===g||(g==='Ягодицы'&&i.slot==='HINGE'))){const r=pickFor(slot,a,used,off+1,true);if(r){used.add(r.id);const p=P.a;items.push({exId:r.id,sets:p[0]+1,min:p[1],max:p[2],rest:p[3],acc:true,slot,prio:true})}}});
  if(typeof finisherFor==='function'&&items.some(i=>exBy(i.exId).group==='Бицепс'&&!(typeof FINISHER!=='undefined'&&FINISHER.has(i.exId)))){const f=finisherFor(a,used,off);if(f){used.add(f);const p=P.a;items.push({exId:f,sets:Math.min(2,p[0]),min:p[1],max:p[2],rest:p[3],acc:true,slot:'BI'})}}
  // подгонка под длительность: подходы × (40 с работы + отдых) + 5 мин разминки; сначала убираем изоляцию
  const budget=a.len*60-WARM*60,cardioMin=Math.min(a.goal==='loss'?20:a.goal==='fit'?15:0,Math.round(a.len/4))*60,tot=()=>items.reduce((s,i)=>s+itemTime(i),0)+cardioMin+rampN({items},a)*60;
  while(tot()>budget){const j=items.map((x,k)=>x.acc&&!x.prio?k:-1).filter(k=>k>=0).pop();if(j!==undefined){items.splice(j,1);continue}
   const big=items.filter(x=>x.sets>2);if(big.length){big.forEach(x=>x.sets--);continue}const j2=items.map((x,k)=>x.prio?k:-1).filter(k=>k>=0).pop();if(j2!==undefined){items.splice(j2,1);continue}if(items.length>3){items.pop();continue}break}
  if(cardioMin){const c=['mk-treadmill-run','mk-indoor-cycling-spin','mk-elliptical','mk-rowing-machine-steady-state','stair','jump','mk-incline-treadmill-walk'].concat(typeof EXTRA_CARDIO!=='undefined'?EXTRA_CARDIO:[]).filter(id=>okEx(id,a)&&(typeof autoOk!=='function'||autoOk(id,a,false)));const left=Math.max(a.len<=30?5:10,Math.min(30,Math.floor((budget-tot()+cardioMin)/60)));items.push({exId:c[off%c.length]||'mk-incline-treadmill-walk',sets:1,min:Math.max(5,left-10),max:left,rest:0})}
  return{name,items:items.map(({exId,sets,min,max,rest})=>({exId,sets,min,max,rest}))}});
 return{days,why:whyOf(a,days,[...swaps])}}
function generate(a){a={sex:'m',level:'mid',len:60,place:'g',prio:[],lim:[],...a};if(typeof lenOff==='function'&&lenOff(a,LENS[lenIdx(a.len)]))a.len=effLen(a);if(typeof planFromTemplate==='function'){const p=planFromTemplate(a);if(p)return{days:p.days,why:whyOf(a,p.days,p.swaps||[]),advice:p.advice||null,timeLabel:p.timeLabel||'',shorter:!!p.shorter}}return generateAuto(a)}
let G0=0;function generate0Vol(a){if(G0)return 1e9;G0=1;try{const g=generate({...a,len:240});return Object.values(weekVol(g.days)).reduce((x,y)=>x+y,0)}finally{G0=0}}
function weekVol(days){const v={};days.forEach(d=>d.items.forEach(it=>{const g=exBy(it.exId).group;if(g!=='Кардио')v[g]=(v[g]||0)+it.sets}));return v}
function whyOf(a,days,swaps){const v=weekVol(days),P=prmOf(a.goal,a.level),w=[];
 w.push([`Сплит «${a.place!=='g'&&a.days>=5?'Верх / Низ'+(a.days==5?' + Фулбоди':' ×1,5'):SPLITNAME[a.days]}»: каждая крупная группа мышц тренируется ~${a.days>=6?2:a.days>=4?2:a.days} раз(а) в неделю — 2 раза в неделю дают больший рост, чем 1.`,['f','gf']]);
 {const rs=x=>x%60?x+' с':x/60+' мин',lvA=a.level==='adv',lvN=a.level==='nov';
 w.push([`Повторы ${P.c[1]}–${P.c[2]} в базовых и ${P.a[1]}–${P.a[2]} в изолирующих, отдых ${rs(P.c[3])} / ${P.a[3]} с: `+(a.goal==='str'?(lvN?'новичку на любой цели ACSM 2009 советует начинать с 8–12 повторов: сначала техника, тяжёлые веса — позже.':lvA?'сила лучше растёт при тяжёлых весах и длинном отдыхе (3 мин в базе); 1–2 повтора приложение не даёт — без страхующего это рискованно.':'средний уровень: 6–10 повторов в базовых — шаг к тяжёлым весам, которые ACSM 2009 оставляет опытным.'):({mass:'мышцы растут при работе близко к отказу (1–3 повтора в запасе); по ACSM 2009 при умеренных весах отдых 1–2 мин, в тяжёлой базе у опытных — до 3 мин.',loss:'силовые сохраняют мышцы при дефиците калорий, короткий отдых экономит время.',fit:'умеренные веса и 8–12 повторов (опытным 6–12) — рекомендация ACSM 2009 для здоровья и общей силы.'}[a.goal])),a.goal==='str'?(lvA?['a','l','r']:['a']):a.goal==='mass'?['a','l','r']:a.goal==='loss'?['d','a']:['a','w']])}
 w.push([`Объём в неделю (подходов): ${Object.entries(v).map(([g,n])=>g+' '+n).join(', ')}. `+(a.level==='nov'?'Для новичка — умеренный объём, ~6–12 подходов на группу в неделю: прогресс идёт и при малом объёме, важнее освоить технику.':'Ориентир для роста мышц — 10–20 подходов на группу в неделю (дополнение к ACSM 2009): больше подходов — больше результат, но 20 — верхняя рамка, а не цель.'),a.level==='nov'?['a','v']:['v','rv']]);
 if(a.prio.length)w.push([`Приоритет: ${a.prio.join(', ')} — +1 подход и доп. упражнение, т.к. больший недельный объём даёт больший рост этих мышц.`,['v']]);
 if(a.goal==='loss'||a.goal==='fit')w.push([`Кардио в конце тренировки + дополнительная активность: ориентир ВОЗ — 150–300 мин умеренной нагрузки в неделю${a.goal==='loss'?'; для снижения веса ACSM советует >150, лучше 225–420 мин':''}.`,a.goal==='loss'?['w','d']:['w']]);
 {const full=generate0Vol(a),cut=Object.values(v).reduce((x,y)=>x+y,0);w.push([`Длительность ~${a.len>=75?'75+':a.len} мин: подходы × (≈40 с работы + отдых) + 5 мин разминки — число упражнений и подходов подогнано под это время, базовые упражнения стоят первыми, изоляция убирается первой.`+(cut<full?` За тренировку объём урезан (${cut} из ${full} подходов в неделю). Чем меньше минут, тем ниже недельный объём и, как правило, медленнее рост — при возможности выбери больше времени или больше тренировок в неделю.`:''),cut<full?['v']:[]])}
 if(a.lim.length)w.push([`Ограничения (${a.lim.map(l=>LIMN[l]).join(', ')}): рискованные упражнения заменены на более щадящие${swaps.length?' ('+swaps.slice(0,5).join(', ')+')':''}. При боли — проконсультируйся с врачом.`,[]]);
 w.push([`Пол: ${a.sex==='f'?'женский':'мужской'} — в относительных величинах мужчины и женщины прибавляют в силе и мышцах сопоставимо, поэтому принципы программы одинаковые.`,['sx']]);
 w.push(['Разминка в каждой тренировке (~'+(WARM+rampN(days[0],a))+' мин): 3 мин лёгкого кардио, затем динамические движения для суставов и мышц этого дня и подводящие подходы к первому базовому упражнению. Разминка улучшает результат тренировки; долгую статическую растяжку перед силовой лучше не делать — она может временно снизить силу.',['wu1','wu2','wu3']]);
 w.push(['Прогрессия (ACSM 2009): когда верх диапазона выполнен во всех подходах 2 тренировки подряд — вес +2–5 % для верха тела и +5–10 % для низа (приложение подскажет). Повторы в запасе (1–3) и разгрузочная неделя раз в 6 недель (у новичка — не раньше 13-й недели) — дополнения к ACSM 2009.',['a']]);return w}
const CATALOG=[
['Старт в зале','Для тех, кто только начинает ходить в зал. Три раза в неделю тренируете всё тело и спокойно осваиваете технику основных упражнений, а нагрузка растёт постепенно. 36 тренировок, около 12 недель.',{goal:'fit',level:'nov',days:3,len:60,place:'g'}],
['Масса: Верх / Низ','Для тех, кто уже тренируется и хочет набрать мышцы. Четыре тренировки в неделю: два дня на верх тела, два на ноги, так каждая мышца работает дважды в неделю. 36 тренировок, около 9 недель.',{goal:'mass',level:'mid',days:4,len:60,place:'g'}],
['Масса: Жим / Тяга / Ноги ×2','Для опытных, кто готов тренироваться 6 дней в неделю ради максимального роста мышц. Дни чередуются: грудь и плечи, спина, ноги, и так два круга за неделю. 36 тренировок, около 6 недель.',{goal:'mass',level:'adv',days:6,len:75,place:'g'}],
['Масса за 3 дня','Для тех, кто хочет набрать мышцы, но может ходить в зал только три раза в неделю. Каждая тренировка прорабатывает всё тело. 36 тренировок, около 12 недель.',{goal:'mass',level:'mid',days:3,len:60,place:'g'}],
['Сила: базовая тройка','Для тех, кто хочет стать сильнее в приседе, жиме лёжа и тяге. Три тренировки в неделю: тяжёлые веса, мало повторов и долгий отдых между подходами. 36 тренировок, около 12 недель.',{goal:'str',level:'mid',days:3,len:75,place:'g'}],
['Сила: Верх / Низ','Для опытных, кто хочет поднимать больше. Четыре дня в неделю: два на верх тела, два на ноги, с упором на основные тяжёлые упражнения. 36 тренировок, около 9 недель.',{goal:'str',level:'adv',days:4,len:90,place:'g'}],
['Рельеф 4×','Для тех, кто хочет сбросить жир и сохранить мышцы. Четыре тренировки в неделю: силовые упражнения, в конце кардио. 36 тренировок, около 9 недель.',{goal:'loss',level:'mid',days:4,len:60,place:'g'}],
['Похудение для начинающих','Для новичков, кто хочет похудеть и привыкнуть к залу. Три тренировки в неделю на всё тело, в конце кардио. 36 тренировок, около 12 недель.',{goal:'loss',level:'nov',days:3,len:60,place:'g'}],
['Свой вес','Для начинающих, кто тренируется без оборудования. Турник не обязателен: если его нет, программа подберёт упражнения без него. Три тренировки в неделю на всё тело. 36 тренировок, около 12 недель.',{goal:'fit',level:'nov',days:3,len:45,place:'b'}],
['Широкая спина','Приоритет спины: доп. объём на тяги.',{goal:'mass',level:'mid',days:4,len:75,place:'g',prio:['Спина']}],
['Объёмные руки','Приоритет бицепса и трицепса.',{goal:'mass',level:'mid',days:5,len:60,place:'g',prio:['Бицепс','Трицепс']}],
['Ягодицы и ноги','Приоритет низа тела.',{goal:'mass',level:'mid',days:4,len:60,place:'g',sex:'f',prio:['Ягодицы','Ноги']}],
['Пресс и рельеф','Похудение с приоритетом пресса.',{goal:'loss',level:'mid',days:4,len:45,place:'g',prio:['Пресс']}]].map(([name,desc,a],i)=>({id:'c'+i,name,desc,a:{sex:'m',prio:[],lim:[],...a}}));
// Ready-program list: curated CATALOG plus one card per blocks-index entry (gym g, Home = b_nobar).
// The list uses the small index only — it does not load block JSON.
function catalogCardPlace(c){const p=c&&c.a&&c.a.place;return(p==='b'||p==='b_nobar')?'b':(p||'g')}
function catalogChipOptions(){return{goal:Object.keys(GOALS),level:Object.keys(LVN),days:[2,3,4,5,6],place:Object.keys(PLN).filter(k=>k!=='d')}}
function catalogIndexList(){return(typeof BLOCK_INDEX!=='undefined'&&Array.isArray(BLOCK_INDEX))?BLOCK_INDEX:[]}
function catalogLang(){return(typeof LANG==='string'&&LANG)||'ru'}
function catalogT(s){return typeof tr==='function'?tr(s):s}
function ruCountWord(n,one,few,many){n=Math.abs(parseInt(n,10)||0);const r=n%100,d=n%10;if(r>=11&&r<=19)return many;if(d===1)return one;if(d>=2&&d<=4)return few;return many}
function catalogWorkoutWord(n){const lang=catalogLang();if(lang==='en')return Number(n)===1?'workout':'workouts';if(lang==='lv')return typeof lvTreninWord==='function'?lvTreninWord(n):'treniņi';return ruCountWord(n,'тренировка','тренировки','тренировок')}
function catalogWeekWord(n){const lang=catalogLang();if(lang==='en')return Number(n)===1?'week':'weeks';if(lang==='lv'){n=Math.abs(parseInt(n,10)||0);const r=n%100,d=n%10;if((r>=11&&r<=19)||n%10===0)return'nedēļu';if(d===1)return'nedēļa';return'nedēļas'}return ruCountWord(n,'неделя','недели','недель')}
function catalogDur(label){const s=String(label||'60–70 мин');if(catalogLang()==='ru')return s;return s.replace(/\s*мин(ут[аыу]?)?$/i,' min')}
function catalogFmt(ru,map){let s=catalogT(ru);Object.keys(map).forEach(k=>{s=String(s).split('{'+k+'}').join(map[k])});return s}
function catalogBlockName(b){const pl=b.place==='b_nobar'?'b':'g';return catalogT(typeof goalName==='function'?goalName(b.goal,pl):(GOALS[b.goal]||b.goal))+': '+catalogT(b.title||'')}
function catalogBlockDesc(b){const pl=b.place==='b_nobar'?'b':'g';
  const head=catalogFmt('{level} · {days}× в неделю · {place}',{level:catalogT(LVN[b.level]||b.level),days:b.days,place:catalogT(PLN[pl]||pl)});
  const tail=catalogFmt('{n} {workoutWord}, около {w} {weekWord}',{n:b.workouts,workoutWord:catalogWorkoutWord(b.workouts),w:b.weeks,weekWord:catalogWeekWord(b.weeks)});
  return head+'. '+tail}
function catalogBlockSummary(b){return catalogFmt('{title} · {n} {workoutWord}, около {w} {weekWord}, по {dur}',{title:catalogT(b.title||''),n:b.workouts,workoutWord:catalogWorkoutWord(b.workouts),w:b.weeks,weekWord:catalogWeekWord(b.weeks),dur:catalogDur(b.duration_label||'60–70 мин')})}
function catalogCoveredKey(a){return[a.goal,a.level,a.days,catalogCardPlace({a})].join('_')}
function catalogCards(){
  const curated=CATALOG.slice();
  const covered=new Set(curated.filter(c=>!(c.a.prio&&c.a.prio.length)&&!(c.a.lim&&c.a.lim.length)).map(c=>catalogCoveredKey(c.a)));
  const extra=[];
  catalogIndexList().forEach(b=>{
    if(b.prio||(b.place!=='g'&&b.place!=='b_nobar'))return;
    const pl=b.place==='b_nobar'?'b':'g';
    if(covered.has([b.goal,b.level,b.days,pl].join('_')))return;
    extra.push({id:'blk-'+b.id,name:catalogBlockName(b),desc:catalogBlockDesc(b),summary:catalogBlockSummary(b),blockId:b.id,
      a:{sex:'m',prio:[],lim:[],goal:b.goal,level:b.level,days:b.days,place:pl,bar:pl==='b'?'0':undefined,len:70,lenLabel:b.duration_label||'60–70 мин'}});
  });
  return curated.concat(extra);
}
// The featured shelf describes exact coach blocks, not questionnaire selections or pilot variants.
const CATALOG_STARTERS=[
 ['fit_nov_3_g_b36','Старт в зале','Освой базовые движения: на каждом занятии работаешь на всё тело и заканчиваешь кардио.','gymCardio'],
 ['mass_nov_3_g_b36','Набор мышц для новичков','Три силовые тренировки на всё тело с тренажёрами и свободными весами.','gym'],
 ['str_nov_3_g_b36','Основы силы','Развивай силу в приседе и жиме, осваивая базовые движения.','gym'],
 ['loss_nov_3_g_b36','Снижение веса: старт в зале','Силовая часть на всё тело и 15–22 минуты кардио в конце занятия.','gymCardio'],
 ['fit_nov_2_g_b32','Всё тело в зале: 2 дня','Тренируй всё тело и выносливость, если можешь ходить в зал дважды в неделю.','gymCardio'],
 ['mass_mid_4_g_b36','Набор мышц: верх / низ','Чередуй два занятия на верх тела и два на ноги. Для тех, кто уже тренируется.','gym',true],
 ['fit_nov_3_b_nobar_b36','Старт дома','Развивай общую форму: после упражнений на всё тело будет ходьба или прыжки.','home'],
 ['mass_nov_3_b_nobar_b36','Набор мышц дома','Тренируй всё тело с собственным весом, рюкзаком и полотенцем.','homeSlide'],
 ['str_nov_3_b_nobar_b36','Сила своим весом','Развивай силу и контроль в приседаниях, отжиманиях и тягах.','home'],
 ['loss_nov_3_b_nobar_b36','Снижение веса: старт дома','Совмещай силовые упражнения на всё тело с кардио. В текущем плане есть прыжки.','home'],
 ['fit_nov_2_b_nobar_b32','Домашний старт на 2 дня','Два занятия на всё тело в неделю с ходьбой или прыжками в конце.','homeSlide'],
 ['mass_mid_4_b_nobar_b36','Набор мышц дома: следующий уровень','Чередуй два занятия на верх тела и два на ноги. Для тех, кто уже тренируется.','homeSlide',true]
];
const STARTER_HOME_KIT='Полотенце, рюкзак, прочная опора, устойчивая ступенька и устойчивый стул или скамья.';
const STARTER_KIT={
 gym:'Тренажёры и свободные веса.',
 gymCardio:'Тренажёры, свободные веса и кардиотренажёр.',
 home:STARTER_HOME_KIT,
 homeSlide:STARTER_HOME_KIT+' Нужны также гладкий пол или слайдеры для сгибания ног.'
};
// Scope the selection to known Home shelf blocks, never to the user's normal equipment settings.
function starterHomeMode(id,mode){
 if(mode!==1&&mode!==2)return 0;
 const row=CATALOG_STARTERS.find(x=>x[0]===id&&x[3].startsWith('home'));
 return row&&(mode===1||(typeof starterLowImpactAvailable==='function'&&starterLowImpactAvailable(id)))?mode:0;
}
function starterHomeContext(id,mode,a){
 mode=starterHomeMode(id,mode);if(!mode)return a;
 return Object.assign({},a,{place:'b',places:'b',bar:'0',starterMode:mode,starterSlides:CATALOG_STARTERS.some(x=>x[0]===id&&x[3]==='homeSlide')});
}
function starterSessionContext(A,a){
 a=a||S.prof;
 if(A)return starterHomeContext(A.blk,A.starterMode,a);
 const b=S.block;return b?starterHomeContext(b.id,b.starterMode,a):a;
}
function starterSwapModal(cur,a,cb){return swapModal(cur,a,cb,a&&a.starterMode?blockLimAvail(a):undefined)}
function starterReplacementOk(A,id){const ctx=starterSessionContext(A);return !ctx||!ctx.starterMode||(blockLimAvail(ctx)(id)&&blockLimOk(id,ctx))}
function catalogStarters(){
 const index=new Map(catalogIndexList().map(b=>[b.id,b]));
 return CATALOG_STARTERS.flatMap(([blockId,name,desc,kit,deload])=>{
  const b=index.get(blockId);if(!b)return[];
  const place=b.place==='b_nobar'?'b':'g';
  return[{id:'starter-'+blockId,starter:true,blockId,name,desc,kit,deload,
   a:{sex:'m',prio:[],lim:[],goal:b.goal,level:b.level,days:b.days,place,bar:place==='b'?'0':undefined,len:70,lenLabel:b.duration_label}}];
 });
}
function filterCatalog(F,L=catalogCards()){F=F||{};return L.filter(c=>(!F.goal||c.a.goal===F.goal)&&(!F.level||c.a.level===F.level)&&(!F.days||Number(c.a.days)===Number(F.days))&&(!F.place||catalogCardPlace(c)===F.place))}
function catalogFind(id){return String(id).startsWith('starter-')?catalogStarters().find(c=>c.id===id):catalogCards().find(c=>c.id===id)||CATALOG.find(c=>c.id===id)}
function catalogStarterInfo(c,withGoal){
 const meta=catalogFmt(c.deload?'{days}× в неделю · обычно {dur} за занятие':'{days}× в неделю · около {dur} за занятие',{days:c.a.days,dur:catalogDur(c.a.lenLabel)});
 const goal=withGoal?`<strong class="catalog-starter-goal">${esc(catalogT(GOALS[c.a.goal]))}</strong> · `:'';
 return `<p class="catalog-starter-meta">${goal}${esc(meta)}${c.deload?' · '+esc(catalogT('разгрузочные занятия короче')):''}</p><p class="catalog-starter-kit">${esc(catalogT('Оборудование:'))} ${esc(catalogT(STARTER_KIT[c.kit]))}</p>`;
}
function catalogSummary(c){if(c.summary)return c.summary;const pl=catalogCardPlace(c),b=catalogIndexList().find(x=>!x.prio&&x.goal===c.a.goal&&x.level===c.a.level&&x.days===c.a.days&&(x.place==='b_nobar'?'b':x.place)===pl);return b?catalogBlockSummary(b):''}


// Повреждённая запись не должна ломать запуск: сохраняем её в ключ gym_broken и стартуем с пустого состояния.
// S_RO — копию сохранить не удалось; тогда ничего не пишем, чтобы не затереть единственный экземпляр данных.
let S=null,S_BROKEN=false,S_RO=false;
try{S=JSON.parse(localStorage.getItem('gym')||'null')}catch(e){S_BROKEN=true;try{localStorage.setItem('gym_broken',localStorage.getItem('gym'))}catch(_){S_RO=true}}
if(!S||typeof S!=='object'||Array.isArray(S))S={custom:[],workouts:[],next:0};
if(S.goal&&!S.prof){S.prof={goal:S.goal,sex:'m',level:'mid',days:S.days||3,len:60,place:'g',prio:[],lim:[]};S.progName='Моя программа: '+GOALS[S.goal]}S.custom=S.custom||[];S.body=S.body||[];S.workouts=S.workouts||[];S.templates=S.templates||[];S.deletedTemplates=S.deletedTemplates||[];S.eqProfiles=S.eqProfiles||[];S.deletedEqProfiles=S.deletedEqProfiles||[];S.v=2;
let saveWarnAt=0;
function save(){if(S_RO)return;
 if(window.mzBeforeSave)window.mzBeforeSave();
 try{localStorage.setItem('gym',JSON.stringify(S))}
 catch(e){if(Date.now()-saveWarnAt>30000){saveWarnAt=Date.now();toast('⚠ Не удалось сохранить: память браузера заполнена. Сделай экспорт в «Профиле».')}return}
 if(typeof saveHistory==='function')try{saveHistory()}catch(e){}
 if(typeof requestPersist==='function')try{requestPersist()}catch(e){}
 if(window.mzOnSave)try{window.mzOnSave()}catch(e){}
 return true}

const LEGACY={ abw:['Ролик для пресса','Пресс'], bike:['Велотренажёр','Кардио'], calf:['Подъём на носки','Ноги'], cc:['Сведение в кроссовере','Грудь'], cru:['Скручивания','Пресс'], dbrdl:['Румынская тяга с гантелями','Ноги'], dip:['Отжимания на брусьях','Грудь'], dl:['Становая тяга','Спина'], dpu:['Узкие отжимания','Трицепс'], ell:['Эллипс','Кардио'], fp:['Тяга каната к лицу','Плечи'], hlr:['Подъём ног в висе','Пресс'], ote:['Разгибание из-за головы','Трицепс'], pc:['Сгибания на скамье Скотта','Бицепс'], pl:['Планка','Пресс'], rfly:['Махи в наклоне','Плечи'], rowm:['Гребной тренажёр','Кардио'], shr:['Шраги','Спина'], skull:['Французский жим','Трицепс'], step:['Зашагивания на скамью','Ноги'], tm:['Беговая дорожка','Кардио'], tpd:['Разгибание на блоке','Трицепс'], ur:['Тяга штанги широким хватом к груди','Плечи'], w_armc:['Круги руками','Разминка'], w_bandrow:['Лёгкая тяга к поясу','Разминка'], w_catcow:['Кошка-корова','Разминка'], w_dislo:['Проводка палки или резинки за голову','Разминка'], w_gm:['Наклоны «гуд-морнинг» без веса','Разминка'], w_march:['Ходьба на месте с высоким подниманием колен','Разминка'], w_pa:['Разведение рук со сведением лопаток','Разминка'], wlk:['Быстрая ходьба','Кардио'], yr:['Y-подъёмы рук лёжа','Плечи'], w_scpu:['Отжимания лопатками','Разминка']};
const LEGACY_TO={ abw:'mk-rkc-plank', bike:'mk-indoor-cycling-spin', calf:'mk-standing-calf-raise-machine', cc:'mk-cable-pec-fly', cru:'mk-crunches', dbrdl:'mk-dumbbell-stiff-leg-deadlift', dip:'mk-parralel-bar-dips', dl:'mk-barbell-deadlift', dpu:'mk-diamond-push-ups', ell:'mk-elliptical', fp:'mk-cable-seated-rope-face-pull', hlr:'mk-hanging-knee-raises', ote:'mk-dumbbell-seated-overhead-tricep-extension', pc:'mk-ez-bar-preacher-curl', pl:'mk-front-plank', rfly:'mk-dumbbell-rear-delt-fly', rowm:'mk-rowing-machine-steady-state', shr:'mk-dumbbell-shrug', skull:'mk-ez-bar-skullcrusher', step:'mk-dumbbell-step-up-low', tm:'mk-treadmill-run', tpd:'mk-cable-bar-pushdown', ur:'mk-barbell-upright-row', w_armc:'mk-arm-circles-front-back', w_bandrow:'mk-band-row', w_catcow:'mk-cat-camel', w_dislo:'mk-broomstick-pass-throughs', w_gm:'mk-hip-hinge-drill', w_march:'mk-walking-knee-hugs', w_pa:'mk-band-high-face-pull', wlk:'mk-incline-treadmill-walk', yr:'mk-prone-y-t-raises'};
function legacyEx(id){const L=LEGACY[id];return L?{id:id,name:L[0],group:L[1],legacy:true}:null}
function migrateLegacyPlans(){const drop='w_scpu';let ch=false;
 const mapId=id=>{if(id===drop){ch=true;return null}if(LEGACY_TO[id]){ch=true;return LEGACY_TO[id]}return id};
 const mapItems=items=>{if(!Array.isArray(items))return items;const out=[];for(const it of items){if(!it||typeof it.exId!=='string'){out.push(it);continue}const id=mapId(it.exId);if(id==null)continue;if(id!==it.exId)it.exId=id;out.push(it)}return out};
 const mapBlock=b=>{if(!b)return;if(b.cardio&&typeof b.cardio.id==='string'){const id=mapId(b.cardio.id);if(id==null)b.cardio=null;else b.cardio.id=id}if(Array.isArray(b.mob))b.mob=b.mob.filter(m=>{if(!m||typeof m.id!=='string')return true;const id=mapId(m.id);if(id==null)return false;m.id=id;return true});if(Array.isArray(b.stretch))b.stretch=b.stretch.filter(m=>{if(!m||typeof m.id!=='string')return true;const id=mapId(m.id);if(id==null)return false;m.id=id;return true});if(Array.isArray(b.ramp))b.ramp=b.ramp.filter(r=>{if(!r||typeof r.exId!=='string')return true;const id=mapId(r.exId);if(id==null)return false;r.exId=id;return true})};
 const mapDay=d=>{if(!d)return;if(d.items)d.items=mapItems(d.items);mapBlock(d.wu);mapBlock(d.cd)};
 if(Array.isArray(S.program))S.program.forEach(mapDay);
 if(S.active){if(S.active.items)S.active.items=mapItems(S.active.items);if(S.active.warm&&S.active.warm.wu)mapBlock(S.active.warm.wu);if(S.active.cool&&S.active.cool.cd)mapBlock(S.active.cool.cd);
  if(S.active.warm&&Array.isArray(S.active.warm.c)&&S.active.warm.wu){const n=(S.active.warm.wu.cardio?1:0)+(S.active.warm.wu.mob?S.active.warm.wu.mob.length:0)+(S.active.warm.wu.ramp?S.active.warm.wu.ramp.length:0);if(S.active.warm.c.length!==n)S.active.warm.c=Array.from({length:n},(_,i)=>!!S.active.warm.c[i])}}
 return ch}
const allEx=()=>EX.concat(S.custom||[]), exBy=id=>allEx().find(e=>e.id===id)||legacyEx(id)||{name:'?',group:''};
if(migrateLegacyPlans())save();
// 13.11.2026: автозамена id переименовала поле замера «calf» (икра). Возвращаем замеры, сохранённые под ошибочным ключом.
(function(){const bad='mk-standing-calf-raise-machine';let ch=false;(Array.isArray(S.body)?S.body:[]).forEach(b=>{if(b&&Object.prototype.hasOwnProperty.call(b,bad)){if(b.calf==null||b.calf==='')b.calf=b[bad];delete b[bad];ch=true}});if(ch)save()})();

const isCardio=id=>exBy(id).group==='Кардио';
const e1rm=(w,r)=>{if(typeof epley1RM==='function'){const v=epley1RM(w,r);return v==null?0:v}w=+w;r=+r;return(w>0&&r>=1&&r<=10)?w*(1+r/30):0};
const fmtT=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
function histWorkouts(){return typeof histList==='function'?histList():((typeof S!=='undefined'&&S&&Array.isArray(S.workouts))?S.workouts:[])}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.append(d);setTimeout(()=>d.remove(),2600)}
let view='today';
// D-247: no «Программа» tab — program/catalog/quiz/preview live under «Тренировки», library/science under «Профиль» → «Справка».
// D-251: program change lives in «Профиль» (Eduards: «Смена программы тут не нужна»), so catalog/quiz/preview highlight «Профиль».
const NAV_OF={program:'today',catalog:'more',quiz:'more',preview:'more',library:'more',science:'more'};NAV_OF.nutrition='more';let PEDIT=null;
function go(v){if(v==='catalog'&&view!=='preview'&&view!=='quiz'&&view!=='catalog'){catF={};catAll=false}if(v!=='program')PEDIT=null;view=v;const nv=NAV_OF[v]||v;document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===nv));render();scrollTo(0,0)}
function progRowHTML(){return`<div class="card row" id="progrow" style="align-items:center;padding:10px 14px"><span class="grow"><span class="mut" style="font-size:13px">Программа</span><br><b>${esc(S.progName||'Моя программа')}</b></span><button class="sm" id="pchg">Сменить</button></div>`}
function editDay(di){PEDIT=di;go('program')}
function progRowBind(){const c=$('#pchg');if(c)c.onclick=()=>go('catalog')}
function todayProgBind(sel){const e=$('#tedit');if(e)e.onclick=()=>editDay(sel)}
const TEDIT_HTML='<button class="full" id="tedit" style="margin-top:8px">✏️ Изменить</button>';
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>go(b.dataset.v));
// D-256 (Eduards: «Таймер тренировки общий добавь. Верху где то. Возле часов.»): total workout time in the header on every screen
// while a workout runs. Computed from S.active.start (survives reload, background, screen lock); hidden without a workout.
function wclockFmt(s){s=Math.max(0,Math.floor(s));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=String(s%60).padStart(2,'0');return h?h+':'+String(m).padStart(2,'0')+':'+x:String(m).padStart(2,'0')+':'+x}
function wclockTick(){const el=typeof document!=='undefined'&&document.getElementById&&document.getElementById('wclock');if(!el)return;const A=typeof S!=='undefined'&&S&&S.active;
 if(!A||!A.start){el.hidden=true;el.textContent='';return}el.hidden=false;el.textContent='⏱ '+wclockFmt((Date.now()-A.start)/1000)}
setInterval(wclockTick,1000);if(typeof document!=='undefined'&&document.addEventListener)document.addEventListener('visibilitychange',wclockTick);
function render(){wclockTick();$('#nav').classList.toggle('hidden',!S.goal);if(!S.goal&&!['preview','catalog','quiz','science'].includes(view)){view='catalog';return catalog()}
 if(view==='preview')return renderPreview();if(S.active&&view==='today')return workoutView();if(view==='tpl'&&typeof tplView==='function')return tplView();({today,program,progress,history,more,science,library,nutrition:()=>nutrition(),quiz,catalog,body}[view])()}
let ob={goal:'mass'};
function onboarding(){openQuestionnaire('catalog')}
let Q=null,QBack='catalog',catF={},catAll=false;
function questionnaireSeed(){
 const p=S.prof||{},pick=(key,fallback)=>p[key]==null?fallback:p[key];
 const place=pick('place',(typeof eqPrimaryPlace==='function'&&eqPrimaryPlace())||'g');
 return {goal:pick('goal',S.goal||'mass'),sex:pick('sex','m'),level:pick('level','mid'),
  days:pick('days',S.days||3),len:pick('len',60),place:place==='d'?'b':place,bar:pick('bar','0'),acc:pick('acc','none'),
  prio:Array.isArray(p.prio)?p.prio.slice():[],lim:Array.isArray(p.lim)?p.lim.slice():[],
  ...(p.variant?{variant:p.variant}:{}),...(typeof quizDaysAsked==='function'?quizDaysAsked():{})};
}
function openQuestionnaire(from,field){
 QBack=['more','today','catalog'].includes(from)?from:'catalog';
 Q=questionnaireSeed();
 go('quiz');
 if(field==='bwkg'||field==='agey'){const input=$('#'+field);if(input&&typeof input.focus==='function')input.focus()}
}
function leaveQuestionnaire(to){Q=null;if(to==='catalog'){catF={};catAll=false}go(to||QBack)}
function saveQuestionnaireMeasure(input,key,asked,min,max,msg,precision){
 const raw=String(input.value).trim(),n=Number(raw);
 if((input.validity&&input.validity.badInput)||(raw&&(!Number.isFinite(n)||n<min||n>max))){toast(msg);input.value=S[key]||'';return}
 S[key]=raw?Math.round(n*precision)/precision:0;
 S[asked]=1;
 input.value=S[key]||'';
 save();
}
function quizLenOld(filter){
 if(typeof lenOff==='function'&&lenOff(Q,LENS[lenIdx(Q.len)]))Q.len=effLen(Q);
 const note=(typeof lenNote==='function'&&lenNote(Q,Q.len))||'';
 const glance=typeof progGlance==='function'&&progGlance(Q);
 return `${filter('Длительность тренировки','len',[30,45,60,75,90].filter(n=>!(typeof lenOff==='function'&&lenOff(Q,n))).map(n=>[n,n+' мин']),true)}
 ${typeof lenOff==='function'&&lenOff(Q,30)?`<p class="mut qfilter-wide" id="qlenoff">${esc(LEN_MIN_STR)}</p>`:''}
 ${note?`<p class="mut qfilter-wide" id="qlennote">⚡ <span>${esc(note)}</span></p>`:''}
 ${glance?`<p class="mut qfilter-wide">Реальное время с разминкой и заминкой: ${esc(glance.label)}${glance.shorter?' — тренировка короче выбранного времени: объём новичка не раздуваем.':''}</p>${glance.advice?`<p class="mut qfilter-wide">${esc(glance.advice)}</p>`:''}`:''}`;
}
// C-114: show the selected block's duration_label (no longer a fixed 60–70 min).
function quizBlockId(q){q=q||(typeof Q!=='undefined'?Q:null);return(q&&typeof blockIdForProfile==='function'&&blockIdForProfile(q))||null}
function quizDurationLabel(q){const id=quizBlockId(q);if(!id)return'';
 if(typeof BLOCK_INDEX!=='undefined'&&Array.isArray(BLOCK_INDEX)){const it=BLOCK_INDEX.find(b=>b&&b.id===id);if(it&&it.duration_label)return it.duration_label}
 if(typeof getBlock==='function'){try{const b=getBlock(id);if(b&&b.duration_label)return b.duration_label}catch(e){}}
 return''}
function quizGrowthHint(q){q=q||(typeof Q!=='undefined'?Q:null);return!!(q&&q.level==='adv'&&+q.days===2)}
function quizLen(filter,blocks=typeof blocksEnabled==='function'&&blocksEnabled()){
 if(blocks){const label=quizDurationLabel(Q)||'60–70 мин';Q.lenLabel=label;const nums=String(label).match(/\d+/g);Q.len=nums&&nums.length?+nums[nums.length-1]:70;const shown=(typeof catalogDur==='function'?catalogDur(label):label)+' (с разминкой и заминкой)';return`<p class="mut qfilter-wide" id="qlen"><strong>Длительность тренировки</strong><br><span>${esc(shown)}</span></p>`}
 delete Q.lenLabel;return quizLenOld(filter)
}
function quiz(){$('#title').textContent='Анкета';Q=Q||questionnaireSeed();if(Q.bar==null)Q.bar='0';if(Q.acc==null)Q.acc='none';if(Q.place==='d')Q.place='b';
 const blocks=typeof blocksEnabled==='function'&&blocksEnabled();
 if(blocks)Q.prio=[];
 const options={
   lim:[['s','Спина'],['k','Колени'],['p','Плечи']],
   prio:['Грудь','Спина','Плечи','Ноги','Ягодицы','Бицепс','Трицепс','Пресс'].map(v=>[v,v])
 };
 const localize=s=>typeof tr==='function'?tr(s):s;
 const selected=k=>options[k].filter(([v])=>Q[k].includes(v)).map(([,label])=>localize(label)).join(' · ')||localize('Не выбрано');
 const filter=(t,k,opts,wide)=>`<label class="qfilter${wide?' qfilter-wide':''}" for="qf-${k}"><span>${t}</span><select id="qf-${k}" data-qfilter="${k}">${opts.map(([v,l])=>`<option value="${esc(v)}"${String(Q[k])===String(v)?' selected':''}>${esc(l)}</option>`).join('')}</select></label>`;
 const multi=(k,title,hint)=>`<details id="qf-${k}" class="qfilter-multi qfilter-wide">
   <summary><span>${title}</span><span id="qfs-${k}" class="qfilter-selection" aria-live="polite">${esc(selected(k))}</span></summary>
   <div class="qfilter-options"><p class="mut">${hint}</p>${options[k].map(([v,l],i)=>`<label for="qf-${k}-${i}"><input id="qf-${k}-${i}" type="checkbox" data-qmulti="${k}" value="${esc(v)}"${Q[k].includes(v)?' checked':''}> <span>${l}</span></label>`).join('')}</div></details>`;
 app.innerHTML=`<button type="button" class="pri full program-action" id="qcat">Готовые программы</button>
 <p class="mut">Ответь на вопросы — программа составится по данным научных исследований.</p>
 <section class="card qfilters" aria-labelledby="qfilters-title"><h2 class="qfilter-wide" id="qfilters-title">Фильтры программы</h2>
 ${filter('Цель','goal',Object.keys(GOALS).map(id=>[id,goalName(id,Q.place)]),true)}
 ${filter('Где тренируешься','place',[['g','Тренажёрный зал'],['b','Дом']],true)}
 ${filter('Уровень','level',Object.entries(LVN))}
 ${filter('Тренировок в неделю','days',[2,3,4,5,6].map(n=>[n,n]))}
 ${quizGrowthHint(Q)?`<p class="mut qfilter-wide" id="qgrowth">Для роста выбери 3–4 дня</p>`:''}
 ${filter('Пол','sex',[['m','Мужской'],['f','Женский']],Q.place!=='b')}
 ${Q.place==='b'?`${filter('Есть турник?','bar',[['1','Да'],['0','Нет']])}<p class="mut qfilter-wide" id="qhome">Для домашних тренировок могут понадобиться полотенце, рюкзак и устойчивая опора.</p>`:''}
 ${blocks?filter('Акцент','acc',[['none','Нет'],['back','Спина'],['arms','Руки'],['glutes','Ягодицы и ноги'],['abs','Пресс']],true):multi('prio','Приоритетные мышцы','Можно выбрать несколько вариантов.')}
 ${multi('lim','Ограничения','Заменим рискованные упражнения.')}
 <h3 class="qfilter-wide" id="qf-optional">Вес и возраст (необязательно)</h3>
 <label class="qfilter" for="bwkg"><span>Вес тела, кг</span><input type="number" id="bwkg" inputmode="decimal" step="0.1" min="30" max="300" placeholder="не указан" value="${esc(S.weightKg||'')}"></label>
 <label class="qfilter" for="agey"><span>Возраст</span><input type="number" id="agey" inputmode="numeric" step="1" min="14" max="100" placeholder="не указан" value="${esc(S.age||'')}"></label>
 <p class="mut qfilter-wide">Вес помогает оценить калории, возраст нужен для пульсовых зон. Эти данные сохраняются отдельно от программы.</p>
 ${quizLen(filter,blocks)}</section>
 <div class="program-actions">
 <button type="button" class="pri full program-action" id="qgo">Подобрать программу</button>
 ${QBack!=='catalog'?'<button type="button" class="full" id="qback">← Назад</button>':''}</div>`;
 const redraw=el=>{
   const y=scrollY,focused=document.activeElement===el;
   const open=[...app.querySelectorAll('.qfilter-multi[open]')].map(e=>e.id);
   quiz();open.forEach(id=>{const details=$('#'+id);if(details)details.open=true});
   const next=$('#'+el.id);if(focused&&next)next.focus({preventScroll:true});scrollTo(0,y);
 };
 app.querySelectorAll('[data-qfilter]').forEach(el=>el.onchange=()=>{
   const k=el.dataset.qfilter;
   Q[k]=['days','len'].includes(k)?+el.value:el.value;redraw(el);
 });
 app.querySelectorAll('[data-qmulti]').forEach(el=>el.onchange=()=>{
   const k=el.dataset.qmulti,v=el.value;
   Q[k]=el.checked?[...new Set([...Q[k],v])]:Q[k].filter(x=>x!==v);
   if(blocks)$('#qfs-'+k).textContent=selected(k);else redraw(el);
 });
 $('#bwkg').onchange=e=>saveQuestionnaireMeasure(e.target,'weightKg','weightAsked',30,300,'Вес: от 30 до 300 кг',10);
 $('#agey').onchange=e=>saveQuestionnaireMeasure(e.target,'age','ageAsked',14,100,'Возраст: от 14 до 100 лет',1);
 $('#qcat').onclick=()=>leaveQuestionnaire('catalog');$('#qgo').onclick=()=>{preview({name:'Моя программа: '+goalName(Q.goal,Q.place),desc:`${LVN[Q.level]} · ${PLN[Q.place]}${Q.place==='b'?(String(Q.bar)==='1'?' · с турником':' · без турника'):''} · ${Q.days}×${Q.lenLabel||Q.len+' мин'}`,a:{...Q}},'quiz')};
 if(QBack!=='catalog')$('#qback').onclick=()=>leaveQuestionnaire()}
function dayWeek(d){if(d&&d.week)return d.week;const m=/^Неделя (\d+)/.exec(d&&d.name||'');return m?+m[1]:0}
function dayTitle(d){return String(d&&d.name||'').replace(/^Неделя \d+ · /,'')}
function dayNum(d,i){const n=d&&d.n;if(n!=null&&+n>0)return +n;if(i!=null&&i>=0)return +i+1;return 0}
function stripDayLetter(s){return String(s||'').replace(/(^| )[A-Ea-e](?=(?: \((?:разгрузка|deload|atslodze)\))?$)/,'')}
function dayTypeTitle(d){return stripDayLetter(String(d&&(d.name!=null?d.name:d.dayName)||'').replace(/^Неделя \d+ · /,'').replace(/^\d+\.\s/,''))}
function workoutLabel(d,i){const n=dayNum(d,i),t=dayTypeTitle(d);return n?(t?n+'. '+t:String(n)):t}
function historyLabel(w){if(!w)return'';if(w.dayName==='Своя тренировка'||w.fromTemplate)return w.dayName||'';if(w.n!=null&&+w.n>0)return workoutLabel(w);const i=w.dayIdx;if(typeof S!=='undefined'&&S&&S.program&&i!=null&&S.program[i]){const p=S.program[i];if(p.name===w.dayName||dayTypeTitle(p)===dayTypeTitle(w))return workoutLabel(p,i)}return stripDayLetter(w.dayName||'')}
function weekHead(days,di){const w=dayWeek(days[di]);return w&&(di===0||dayWeek(days[di-1])!==w)?`<h3 style="margin:16px 0 6px">Неделя ${w}</h3>`:''}
function progSummary(days){const t=[...new Set(days.map(d=>stripDayLetter(dayWeek(d)?dayTitle(d).replace(/ \((?:разгрузка|deload|atslodze)\)$/,''):d.name)))];const w=new Set(days.map(dayWeek).filter(Boolean)).size;return(w?w+' нед. · ':'')+t.join(' · ')}
// D-230 (Эдуард 19.11): дом только без инвентаря — «Дом с гантелями» (place d) скрыт; d-блоки остаются для старых профилей:
// ['Дом с гантелями','Для тех, кто хочет набрать мышцы дома: нужны гантели, скамья и резинка. Четыре тренировки в неделю, два дня на верх, два на низ. 36 тренировок, около 9 недель.',{goal:'mass',level:'mid',days:4,len:60,place:'d'}]
// D-228: «Здоровая спина» и «Бережно к коленям» скрыты до отдельных блоков Тренера без запрещённых упражнений:
// ['Здоровая спина','Укрепление здоровья без осевой нагрузки на позвоночник.',{goal:'fit',level:'nov',days:2,len:45,place:'g',lim:['s']}], ['Бережно к коленям','Без глубоких приседов и выпадов.',{goal:'fit',level:'mid',days:3,len:45,place:'g',lim:['k']}]
let PV=null;
// D3 (v152 QA): a catalog card has no personal data — the user's limitations (S.prof.lim) and sex are kept, so the program is
// generated and checked with them (same limitation path as the questionnaire). The questionnaire / onboarding pass their own answers.
function withPersonal(a){const P=typeof S!=='undefined'&&S&&S.prof&&typeof S.prof==='object'?S.prof:null;if(!P)return a;
 const lim=[...new Set([].concat(Array.isArray(a.lim)?a.lim:[],Array.isArray(P.lim)?P.lim:[]))];const o=Object.assign({},a,{lim});if(P.sex==='m'||P.sex==='f')o.sex=P.sex;return o}
// v160 (task 7): limitations are health data and never go to the cloud (sync.js stripLimits). After signing in on another device
// S.prof.lim is empty, so a ready program would be built without them. Before the first new pick on THIS device of a signed-in
// user the limitations are confirmed locally (S.limSeen is local too, stripped from sync). The questionnaire asks them itself.
function limConfirmNeeded(back){return(back==='catalog'||back==='onb')&&S.limSeen!==1&&typeof window!=='undefined'&&typeof window.mzSignedIn==='function'&&!!window.mzSignedIn()}
function programChangeBlocked(){if(!S.active)return false;toast('Сначала заверши текущую тренировку.');return true}
function limConfirm(cb){if(programChangeBlocked())return;const m=$('#modal');m.classList.remove('hidden');const sel=new Set(S.prof&&Array.isArray(S.prof.lim)?S.prof.lim:[]);
 const draw=()=>{m.innerHTML=`<div class="sheet"><h2 style="margin-top:0">Ограничения (заменим рискованные упражнения)</h2><p class="mut">${S.consentHealth?'Ограничения сохраняются в облаке вместе с другими данными о здоровье — по твоему согласию. Отозвать его можно в «Профиле».':'Ограничения хранятся только на этом устройстве и не отправляются в облако.'}</p><div class="chips">${[['s','Спина'],['k','Колени'],['p','Плечи']].map(([k,t])=>`<button class="opt chip ${sel.has(k)?'sel':''}" data-lim="${k}">${t}</button>`).join('')}</div><button class="pri full" id="limok" style="margin-top:12px">Продолжить</button></div>`;
  m.querySelectorAll('[data-lim]').forEach(b=>b.onclick=()=>{const k=b.dataset.lim;if(sel.has(k))sel.delete(k);else sel.add(k);draw()});
  $('#limok').onclick=()=>{m.classList.add('hidden');if(programChangeBlocked())return;const lim=[...sel];if(S.prof&&typeof S.prof==='object')S.prof.lim=lim;S.limSeen=1;save();cb(lim)}};draw()}
function preview(pr,back){
 if(limConfirmNeeded(back))return limConfirm(lim=>{const p2=Object.assign({},pr,{a:Object.assign({},pr.a,{lim:[...new Set([].concat(pr.a.lim||[],lim))]})});preview(p2,back)});
 if(back==='catalog'&&pr&&pr.a)pr=Object.assign({},pr,{a:withPersonal(pr.a)});
 let gen;
 if(pr.starter){
  const b=typeof getBlock==='function'&&getBlock(pr.blockId);
  if(!b||typeof planFromBlock!=='function')return toast(catalogT('Не удалось открыть программу. Попробуй ещё раз.'));
  gen=planFromBlock(b,starterHomeContext(pr.blockId,1,pr.a));
  if(gen.blockId!==pr.blockId||!gen.days.length)return toast(catalogT('Не удалось открыть программу. Попробуй ещё раз.'));
 }else gen=generate(pr.a);
 PV={pr,back,gen};
 if(pr.starter&&typeof starterLowImpact==='function'&&starterLowImpactAvailable(pr.blockId))PV.starterBase=gen;
 view='preview';renderPreview()}
function renderPreview(){const{pr,gen}=PV,a=pr.a;$('#title').textContent='Программа';$('#nav').classList.add('hidden');
 const refs=[...new Set(gen.why.flatMap(w=>w[1]))],summary=PV.back==='catalog'&&!pr.starter?catalogSummary(pr):'';
 const desc=PV.noJump&&pr.blockId==='loss_nov_3_b_nobar_b36'?'Совмещай силовые упражнения на всё тело с кардио.':pr.desc;
 const jumpOption=PV.starterBase?`<div class="qfilter-options starter-options">
  <label for="starter-no-jump"><input type="checkbox" id="starter-no-jump" aria-describedby="starter-no-jump-tip"${PV.noJump?' checked':''}> <span>Без прыжков</span></label>
  <p class="mut" id="starter-no-jump-tip">В разминке и кардио вместо прыжков будет ходьба. Время не изменится.</p></div>`:'';
 app.innerHTML=`<div class="card"><h2 style="margin-top:0">${esc(pr.name)}</h2><div class="mut">${esc(desc)}</div><div style="margin-top:8px">${tags(a,pr.starter)}</div>${pr.starter?catalogStarterInfo(pr):''}${summary?`<p class="mut" id="catalog-preview-summary">${esc(summary)}</p>`:''}${gen.timeLabel&&!pr.starter?`<p class="mut" style="margin-bottom:0">Реальное время с разминкой и заминкой: ${esc(gen.timeLabel)}${gen.shorter?' — тренировка короче выбранного времени: объём новичка не раздуваем.':''}</p>`:''}${gen.advice?`<p class="mut">${esc(gen.advice)}</p>`:''}${jumpOption}</div>
 ${gen.days.length>4?'<p class="mut">Нажми на тренировку, чтобы открыть упражнения.</p>':''}${gen.days.map((d,di)=>`${weekHead(gen.days,di)}<details class="card dayc"${gen.days.length<=4||di===PV.open?' open':''} data-di="${di}"><summary><b>${esc(workoutLabel(d,di))}</b> <span class="mut">≈ ${dayMin(d,a)} мин · ${d.items.length} упражн.</span></summary>${typeof blockLimWarnHTML==='function'?blockLimWarnHTML(d):''}${d.wu&&typeof wuHTML==='function'?wuHTML(d.wu):`<details class="wud"><summary>🔥 <b>Разминка</b> <span class="mut">≈ ${warmPlan(d,a).min} мин</span></summary>${warmHTML(warmPlan(d,a))}</details>`}${d.items.map((it,ii)=>`<div class="li"><span class="grow">${esc(exBy(it.exId).name)}</span>${techBtn(it.exId)}<span class="mut">${esc(setTxt(it))}</span>${altCands(it.exId).length?`<button class="sm" data-sw="${di},${ii}" aria-label="Заменить">⇄</button>`:''}</div>`).join('')}${d.cd&&typeof cdHTML==='function'?cdHTML(d.cd):''}</details>`).join('')}
 <h2>Почему программа построена так</h2><div class="card">${gen.why.map(([t,r])=>`<p style="margin:6px 0">• ${t} ${r.length?`<span class="mut">${r.map(k=>'['+(refs.indexOf(k)+1)+']').join('')}</span>`:''}</p>`).join('')}
 <div class="mut" style="font-size:12px;margin-top:10px">${refs.map((k,i)=>`<p>[${i+1}] ${SRC[k]}</p>`).join('')}</div></div>
 <button class="pri full" id="pstart">Начать программу</button><button class="full" id="pback" style="margin:8px 0 20px">← Назад</button>`;
 const noJump=$('#starter-no-jump');
 if(PV.starterBase&&noJump)noJump.onchange=()=>{const y=scrollY;PV.noJump=noJump.checked;
  PV.gen=PV.noJump?starterLowImpact(PV.starterBase,a):PV.starterBase;renderPreview();
  $('#starter-no-jump').focus({preventScroll:true});scrollTo(0,y)};
 app.querySelectorAll('[data-sw]').forEach(b=>b.onclick=()=>{
  const[di,ii]=b.dataset.sw.split(','),it=gen.days[di].items[ii];
  const context=pr.starter?starterHomeContext(pr.blockId,PV.noJump?2:1,a):a;
  starterSwapModal(it.exId,context,id=>{
   if(PV.starterBase){PV.starterBase.days[di].items[ii].exId=id;PV.gen=PV.noJump?starterLowImpact(PV.starterBase,a):PV.starterBase}
   else it.exId=id;
   PV.open=+di;renderPreview();
  });
 });
 $('#pback').onclick=()=>{$('#nav').classList.remove('hidden');go(PV.back)};
 $('#pstart').onclick=()=>{if(programChangeBlocked())return;if(S.program&&!confirm('Заменить текущую программу? История тренировок сохранится.'))return;
  S.prof=a;if(PV.back==='quiz'){S.limSeen=1;S.obDone=1;S.obOffer=2;Q=null}S.goal=a.goal;S.days=a.days;S.program=gen.days;S.progName=pr.name;S.why=gen.why;S.next=0;if(typeof eqOnProgramApplied==='function'&&!(pr.starter&&starterHomeMode(pr.blockId,1)))eqOnProgramApplied(a);save();toast('Программа выбрана 💪');$('#nav').classList.remove('hidden');go('today')}}
const tags=(a,starter)=>[catalogT(goalName(a.goal,a.place)),catalogT(LVN[a.level]),...(starter?[]:[a.days+catalogT('×/нед'),catalogDur(a.lenLabel||a.len+' мин')]),catalogT(starter&&a.place==='b'?'Дома без турника':PLN[a.place]),...(a.prio||[]).map(p=>'★ '+catalogT(p)),...(a.acc&&typeof ACC_RU!=='undefined'&&ACC_RU[a.acc]?['★ '+catalogT(ACC_RU[a.acc])]:[]),...(a.lim||[]).map(l=>'⚠ '+catalogT(LIMN[l]))].map(t=>`<span class="badge">${esc(t)}</span>`).join('');
function catalog(){$('#title').textContent='Готовые программы';const F=catF,first=!S.goal&&!(S.program&&S.program.length);
 const fl=(t,k,opts,wide)=>`<label class="qfilter${wide?' qfilter-wide':''}" for="cf-${k}"><span>${t}</span><select id="cf-${k}" data-cfilter="${k}">${[['','Все'],...opts].map(([v,l])=>`<option value="${esc(v)}"${String(F[k]||'')===String(v)?' selected':''}>${esc(l)}</option>`).join('')}</select></label>`;
 const rows=L=>L.length?`<ul class="catalog-programs">${L.map(c=>`<li><button type="button" class="full program-action" data-c="${esc(c.id)}" aria-describedby="cf-info-${esc(c.id)}"${c.starter?` data-starter-goal="${esc(c.a.goal)}"`:''}><span>${esc(catalogT(c.name))}</span></button><div class="catalog-program-info" id="cf-info-${esc(c.id)}">${c.starter?`<p class="catalog-starter-desc">${esc(catalogT(c.desc))}</p>${catalogStarterInfo(c,true)}`:tags(c.a)}</div></li>`).join('')}</ul>`:'<p class="mut">По этим фильтрам программы не найдены.</p>';
 const showAll=()=>catAll||!catalogIndexList().length;
 const source=()=>showAll()?catalogCards():catalogStarters();
 const results=L=>!L.length||showAll()?rows(L):[['g','В зале'],['b','Дома без турника']].map(([place,label])=>{
   const group=L.filter(c=>catalogCardPlace(c)===place);return group.length?`<section aria-labelledby="cf-group-${place}"><h2 id="cf-group-${place}">${catalogT(label)}</h2>${rows(group)}</section>`:'';
 }).join('');
 const switchLabel=()=>catalogT(catAll?'К подборке программ':'Все программы');
 const L=filterCatalog(F,source());
 app.innerHTML=`${first?'<p id="catfirst">Выбери готовую программу или подбери свою по анкете.</p>':''}
 <section class="card qfilters catalog-filters" aria-labelledby="catalog-filters-title"><h2 class="qfilter-wide" id="catalog-filters-title">Фильтры программы</h2>
 ${fl('Цель','goal',Object.entries(GOALS),true)}
 ${fl('Где тренируешься','place',[['g',PLN.g],['b','Дом']],true)}
 ${fl('Уровень','level',Object.entries(LVN))}
 ${fl('Тренировок в неделю','days',[2,3,4,5,6].map(n=>[n,n+'×']))}
 <div class="row qfilter-wide"><p class="mut grow" id="cf-count" role="status">Найдено: ${L.length}</p><button type="button" id="cf-reset">Сбросить фильтры</button></div></section>
 ${catalogIndexList().length?`<button type="button" id="cf-all" class="full" aria-controls="cf-results">${switchLabel()}</button>`:''}
 <div id="cf-results">${results(L)}</div>
 <p class="mut" style="margin:16px 0 6px">Не нашёл подходящую?</p><button class="full" id="toq" style="margin-bottom:20px;padding:14px">🧩 Подобрать программу под себя</button>`;
 const bindRows=()=>app.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{const c=catalogFind(b.dataset.c);if(c)preview(c,'catalog')});
 const refresh=()=>{const K=filterCatalog(catF,source());$('#cf-count').textContent=catalogT('Найдено:')+' '+K.length;$('#cf-results').innerHTML=results(K);const toggle=$('#cf-all');if(toggle)toggle.textContent=switchLabel();bindRows()};
 const toggle=$('#cf-all');if(toggle)toggle.onclick=()=>{catAll=!catAll;refresh()};
 const controls=app.querySelectorAll('[data-cfilter]');
 controls.forEach(el=>el.onchange=()=>{catF[el.dataset.cfilter]=el.value;refresh()});
 $('#cf-reset').onclick=()=>{catF={};controls.forEach(el=>{el.value=''});refresh()};
 bindRows();$('#toq').onclick=()=>openQuestionnaire('catalog')}
function altCands(cur){const raw=(typeof ALT!=='undefined'&&ALT[cur])||[];const have=new Set(allEx().map(e=>e.id)),seen=new Set(),out=[];
 for(const id of raw){if(id===cur||seen.has(id)||!have.has(id))continue;seen.add(id);out.push(exBy(id))}return out}
function swapModal(cur,a,cb,allow){const m=$('#modal');m.classList.remove('hidden');a=a||S.prof||{place:'g',lim:[]};
 const place=a.place||'g';
 // v158 (Eduards, decision D 23.11): the gravitron (clip of the machine) only in the gym — not even greyed out in the home list.
 const L=altCands(cur).filter(e=>!allow||allow(e.id)).filter(e=>e.id!=='walk-brisk'||(typeof walkBriskPlaceOk==='function'?walkBriskPlaceOk(place):(place==='d'||place==='b'))).filter(e=>e.id!=='assisted-pullup'||eqAvail(e.id,eqPlacesOf(a)));
 // tech-fix-2: exercises that conflict with the limitations (META + impact cardio) are not offered — shown greyed with the reason, no tap.
 const lc=e=>typeof blockLimConf==='function'?blockLimConf(e.id,a):[];const risky=L.filter(e=>lc(e).length);
 const good=L.filter(e=>!lc(e).length&&okEx(e.id,a)),other=L.filter(e=>!lc(e).length&&!okEx(e.id,a));
 const LR={s:'спина',k:'колени',p:'плечи'};
 m.innerHTML=`<div class="sheet"><div class="row"><h2 class="grow" style="margin:0">Замена: ${esc(exBy(cur).name)}</h2><button id="mc">✕</button></div><p class="mut">${allow&&!L.length?'Нет подходящей замены для этой тренировки.':'Альтернативы на те же мышцы'}</p>
 ${good.map(e=>`<div class="row">${animShot(e.id)}<button class="full grow" style="margin:3px 0;text-align:left" data-p="${esc(e.id)}">${esc(e.name)}</button>${techBtn(e.id)}</div>`).join('')}
 ${other.length?`<p class="mut">Другое оборудование:</p>`+other.map(e=>`<div class="row">${animShot(e.id)}<button class="full grow" style="margin:3px 0;text-align:left;opacity:.6" data-p="${esc(e.id)}">${esc(e.name)}</button>${techBtn(e.id)}</div>`).join(''):''}
 ${risky.length?`<p class="mut">Не подходит при твоих ограничениях:</p>`+risky.map(e=>`<div class="row lgrisky"><button class="full grow" disabled style="margin:3px 0;text-align:left;opacity:.45">⚠ ${esc(e.name)} <span class="mut">(${lc(e).map(l=>`<span>${LR[l]}</span>`).join(', ')})</span></button></div>`).join(''):''}</div>`;
 $('#mc').onclick=()=>m.classList.add('hidden');m.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{m.classList.add('hidden');cb(b.dataset.p)})}

// ---------- Сегодня
// D2 (v152 QA): manual ⇄ in an open workout. Done sets stay with the original exercise (history, records, S.pg untouched);
// only the remaining sets move to the new exercise as a new item (swFrom, own progression only when all its sets are done;
// the source gets swStop → neutral for auto-weight, like a stopped exercise). Nothing done yet → the whole item is replaced as before.
// All sets done → nothing to move: the exercise stays, a toast says so. Returns 'replace' | 'split' | 'done' | null.
function swapActiveItem(A,idx,nid){const it=A&&A.items&&A.items[idx];if(!it||!nid||nid===it.exId)return null;
 if(!starterReplacementOk(A,nid))return null;
 const sets=Array.isArray(it.sets)?it.sets:[],done=sets.filter(s=>s&&s.done),left=sets.length-done.length;
 const l=S.autoW!==false?lastSets(nid,A.id):null,fill=(s,k)=>{const p=l&&(l[k]||l[l.length-1]);s.w=p?p.w:'';if(p)s.r=p.r;s.pf=!!p;return s};
 if(!done.length){it.exId=nid;sets.forEach((s,k)=>{if(!s.done)fill(s,k)});return'replace'}
 if(!left){toast('Упражнение уже выполнено — замена не нужна');return'done'}
 const n={exId:nid,ns:left,rest:it.rest,min:it.min,max:it.max,swFrom:it.exId,sets:Array.from({length:left},(_,j)=>fill({w:'',r:it.max,done:false},j))};
 if(it.sec)n.sec=it.sec;it.sets=done;it.swStop=1;A.items.splice(idx+1,0,n);return'split'}
function lastSets(exId,beforeId){for(let i=S.workouts.length-1;i>=0;i--){const w=S.workouts[i];if(w.id===beforeId)continue;const it=w.items.find(x=>x.exId===exId);if(it&&it.sets.some(s=>s.done))return it.sets.filter(s=>s.done)}return null}
function hint(item){const l=lastSets(item.exId);if(!l||isCardio(item.exId))return'';
 if(l.length>=item.sets&&l.every(s=>s.r>=item.max))return`<div class="pr" style="font-size:13px">⬆ В прошлый раз все подходы на ${esc(item.max)}+ — добавь вес (+2,5 кг)</div>`;return''}
// D-238: «Тренировки» tab = next/current workout card + every program workout by week (✓ done). One list for the plain and block programs.
function dayDone(i){const p=S.program[i];if(!p)return false;if(typeof blockActive==='function'&&blockActive())return i<(S.block.next|0);
 return (S.workouts||[]).some(w=>w.dayIdx===i&&w.dayName===p.name&&Date.now()-w.start<7*864e5)}
function dayDue(){if(!S.program||!S.program.length)return 0;if(typeof blockActive==='function'&&blockActive())return Math.min(S.block.next|0,S.program.length-1);const n=S.program.length;return(((S.next||0)%n)+n)%n}
function dayRowLabel(p,i){const d=typeof eqAdaptDay==='function'?eqAdaptDay(p):p;const mins=typeof dayMin==='function'?dayMin(d):0;return esc(workoutLabel(p,i))+(mins?` · ≈ ${mins} мин`:'')}
function dayStartHTML(due){const skip=typeof blockActive==='function'&&blockActive()?`<button class="full" id="blk-skip" style="margin:0 0 12px">Пропустить тренировку</button>`:'';return`<button class="pri full wstart" id="start" style="margin:8px 0 12px">▶ Начать тренировку</button>${skip}`}
// v150: Start is under the title so the open card shows it without scrolling.
// Skip stays at the bottom, after the exercise list, so it is not beside Start.
function todayOpenCardHTML(sel){const d0=S.program[sel],d=typeof eqAdaptDay==='function'?eqAdaptDay(d0):d0,mins=dayMin(d),due=dayDue();
 const skip=sel===due&&typeof blockActive==='function'&&blockActive()?'<button class="full" id="blk-skip" style="margin-top:8px">Пропустить тренировку</button>':'';
 return`<div class="card"><button class="sm" id="tback" style="margin-bottom:8px">← К списку тренировок</button><div class="mut">${goalName(S.goal,S.prof&&S.prof.place)} · ${S.days}× в неделю</div><h2 style="margin-top:6px">${esc(workoutLabel(d,sel))}</h2><div class="mut">${sel===due?'По плану сегодня':'Выбранный день'} · ≈ ${mins} мин · ${d.items.length} упражн.</div>${typeof blockLimWarnHTML==='function'?blockLimWarnHTML(d0):''}
 <button class="pri full wstart" id="start" style="margin:8px 0 12px">▶ Начать тренировку</button>
 ${d.wu&&typeof wuHTML==='function'?wuHTML(d.wu):`<details class="wud"><summary>🔥 <b>Разминка</b> <span class="mut">≈ ${warmPlan(d,S.prof).min} мин</span></summary>${warmHTML(warmPlan(d,S.prof))}</details>`}${d.items.map((it,ii)=>`<div class="li exo" data-exo="m,${ii}">${animShot(it.exId)}<div class="grow">${esc(exBy(it.exId).name)}${hint(it)}</div>${techBtn(it.exId)}<span class="mut">${esc(setTxt(it))}</span></div>`).join('')}${d.cd&&typeof cdHTML==='function'?cdHTML(d.cd):''}
 ${skip}</div>`}
function todayBind(sel){const due=dayDue();const st=$('#start');if(st)st.onclick=()=>startW(TOPEN?sel:due);const tb=$('#tback');if(tb)tb.onclick=()=>today();dayListBind();const sk=$('#blk-skip');if(sk)sk.onclick=()=>{if(typeof skipBlockWorkout==='function')skipBlockWorkout(S);if(typeof save==='function')save();if(typeof toast==='function')toast('Тренировка перенесена');if(typeof go==='function')go('today')}}
function dayListHTML(sel,withStart){if(!S.program||!S.program.length)return'';const due=dayDue();const btn=(p,i)=>`<button class="full dayb${dayDone(i)?' done':''}${i===sel?' pri sel':''}" style="margin:4px 0;text-align:left;height:auto;padding:12px 14px" data-i="${i}"${i===sel?' aria-current="true"':''}>${dayDone(i)?'✓ ':''}${dayRowLabel(p,i)}</button>${withStart&&i===due?dayStartHTML(due):''}`;
 return`<h2>Все тренировки программы</h2>${S.program.map(btn).join('')}`}
function dayListBind(){app.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{today(+b.dataset.i);scrollTo({top:0,behavior:'smooth'})})}
let TSEL=null,TOPEN=false;
function renderTodayScreen(pick){$('#title').textContent='Тренировки';if(!S.program||!S.program.length)return catalog();
 TOPEN=pick!=null&&isFinite(+pick)&&+pick>=0&&!!S.program[+pick];const due=dayDue();const sel=TOPEN?+pick:due;TSEL=sel;
 if(!TOPEN)app.innerHTML=`<div class="mut">${goalName(S.goal,S.prof&&S.prof.place)} · ${S.days}× в неделю</div>${dayListHTML(sel,true)}`;
 else app.innerHTML=`${todayOpenCardHTML(sel)}${dayListHTML(sel,false)}`;
 todayBind(sel)}
function today(sel){if(!S.program||!S.program.length){$('#title').textContent='Тренировки';return catalog()}return renderTodayScreen(sel)}
function startW(i){const src=S.program[i],d=typeof blockNoBarSavedDay==='function'?blockNoBarSavedDay(src):src;const tw=!!(d.wu&&typeof wuRows==='function');S.active={id:'w'+Date.now(),start:Date.now(),dayIdx:i,dayName:d.name,n:dayNum(d,i),blk:typeof blockActive==='function'&&blockActive()?S.block.id:undefined,notes:'',warm:tw?{t:1,wu:d.wu,c:wuRows(d.wu).map(()=>false)}:(()=>{const P=warmPlan(d,S.prof);return{P,c:warmItems(P).map(()=>false)}})(),cool:d.cd&&typeof cdRows==='function'?{cd:d.cd,c:cdRows(d.cd).map(()=>false)}:null,
 items:d.items.map(it=>{const l=S.autoW!==false?lastSets(it.exId):null;return{exId:it.exId,ns:it.sets,rest:it.rest,min:it.min,max:it.max,sec:it.sec?1:0,sets:Array.from({length:it.sets},(_,k)=>{const p=l&&(l[k]||l[l.length-1]);return{w:p?p.w:'',r:p?p.r:it.max,pf:!!p,done:false}})}})};
 const mode=S.block&&starterHomeMode(S.active.blk,S.block.starterMode);if(mode)S.active.starterMode=mode;
 save();go('today')}
let durInt;
// D-235: one place that marks a set done (workout list ✓ and the exercise screen «+»): auto-weight carry-over, PR check, rest timer.
function setDone(it,k){const s=it.sets[k];s.done=true;s.pf=false;if(s.w==='')s.w=0;if(s.r==='')s.r=0;if(S.autoW!==false&&!isCardio(it.exId))it.sets.slice(k+1).forEach(n=>{if(!n.done&&(n.pf||n.w==='')){n.w=s.w;n.pf=true}});checkPR(it.exId,s);if(it.rest&&!isCardio(it.exId))startTimer(S.restOverride||it.rest);else if(pendingFan)playFanfareOnly();pendingFan=false}
// D-286: keep already-painted MoveKit poster nodes across a full workout re-render (add/remove set, swap).
// D-289: reuse ONLY list thumbnails (span.athumb.mkposter, not .mkwide) into a slot of exactly the same
// kind and classes, and only when the old node really holds a painted <img>. Before, any painted
// [data-mk-poster] node with the same id was reused — after ← from the exercise screen its big
// <video class="a3d mk"> landed in a warm-up/cool-down row: huge poster, row pushed off-screen, iOS zoomed out.
function mkThumbKey(el){
  if(!el||String(el.tagName||'').toUpperCase()!=='SPAN'||!el.classList)return '';
  if(!el.classList.contains('athumb')||!el.classList.contains('mkposter')||el.classList.contains('mkwide'))return '';
  const id=(el.dataset&&el.dataset.mkPoster)||'';if(!id)return '';
  return id+'|'+String(el.className||'').trim().split(/\s+/).sort().join(' ');
}
function mkThumbReusable(prev,el){
  if(!prev||!el||prev===el)return false;
  const k=mkThumbKey(el);if(!k||mkThumbKey(prev)!==k)return false;
  if(String(prev.className)!==String(el.className))return false;
  if(prev.isConnected)return false;
  const img=prev.querySelector&&prev.querySelector('img');
  if(!img||!(img.getAttribute&&img.getAttribute('src')))return false;
  if(prev.children&&prev.children.length!==1)return false;
  return !!(prev.dataset&&prev.dataset.mkPosterState==='ok');
}
function reuseMkPosters(root,build){
  const bag=new Map();
  if(root&&root.querySelectorAll)root.querySelectorAll('[data-mk-poster]').forEach(el=>{const k=mkThumbKey(el);if(!k)return;if(!bag.has(k))bag.set(k,[]);bag.get(k).push(el)});
  build();
  if(!root||!root.querySelectorAll)return;
  root.querySelectorAll('[data-mk-poster]').forEach(el=>{
    const k=mkThumbKey(el),q=k&&bag.get(k);if(!q)return;
    let prev=q.shift();while(prev&&!mkThumbReusable(prev,el))prev=q.shift();
    if(!prev)return;
    if(el.getAttribute&&prev.setAttribute)['aria-hidden','title'].forEach(a=>{const v=el.getAttribute(a);if(v==null)prev.removeAttribute&&prev.removeAttribute(a);else prev.setAttribute(a,v)});
    if(typeof el.replaceWith==='function')el.replaceWith(prev);else if(el.parentNode)el.parentNode.replaceChild(prev,el);
  });
}
// D-286: tick a warm-up/cool-down row in place — do not rebuild the list (that flashed every poster).
function patchWuCd(kind,k){
  const A=S.active,chk=kind==='cd'?(A.cool&&A.cool.c):(A.warm&&A.warm.c);if(!chk)return;
  const b=app.querySelector('[data-'+kind+'="'+k+'"]');if(!b)return;
  const on=!!chk[k];b.classList.toggle('ok',on);b.setAttribute('aria-pressed',String(on));
  const row=b.closest&&(b.closest('.li.wu')||b.closest('.li'));if(row)row.classList.toggle('done',on);
  const n=chk.filter(Boolean).length,all=n===chk.length;
  const d=b.closest&&b.closest('details');
  if(d){
    const progress=kind==='wu'&&d.querySelector('summary [data-wu-progress]');
    if(progress){
      const total=+progress.dataset.wuProgress,done=warmDoneCount(chk,total);
      progress.innerHTML=warmProgressText(done,total);
      d.open=done!==total;
    }else{
      const m=d.querySelector('summary .mut');if(m)m.textContent=n+'/'+chk.length+(all?' ✓':'');d.open=!all;
    }
  }
}
function patchSets(i){
  const it=S.active&&S.active.items[i];if(!it)return;
  (it.sets||[]).forEach((s,k)=>{
    const b=app.querySelector('[data-done="'+i+','+k+'"]');if(!b)return;
    b.classList.toggle('ok',!!s.done);
    const row=b.closest&&b.closest('.set');if(!row)return;
    row.classList.toggle('done',!!s.done);row.classList.toggle('pf',!!(s.pf&&!s.done));
    const w=row.querySelector('input[data-f="w"]'),r=row.querySelector('input[data-f="r"]');
    if(w)w.value=s.w;if(r)r.value=s.r;
  });
}
function workoutView(){const A=S.active;$('#title').textContent=historyLabel(A);
 const own=typeof isDiaryWorkout==='function'&&isDiaryWorkout(A);
 reuseMkPosters(app,()=>{
 app.innerHTML=`<div class="card row"><div class="grow"><div class="mut">Длительность</div><b id="dur" style="font-size:22px"></b></div><button class="ok hidden" id="fin" aria-hidden="true" tabindex="-1">Завершить</button></div>
 ${typeof healthPanel==='function'?healthPanel():''}
 ${own?'<button class="full" id="addex">+ Добавить упражнение</button>':''}
 ${A.warm?(()=>{if(A.warm.t)return`<div class="card wucard">${wuHTML(A.warm.wu,A.warm.c)}</div>`;const total=warmItems(A.warm.P).length,n=warmDoneCount(A.warm.c,total),all=n===total;return`<div class="card wucard"><details ${all?'':'open'}><summary>🔥 <b>Разминка</b> ${warmProgressHTML(n,total)}</summary>${warmHTML(A.warm.P,A.warm.c)}</details></div>`})():''}
 ${A.items.map((it,i)=>{const c=isCardio(it.exId),l=lastSets(it.exId,A.id);
  // v160 (task 6): holds (plank, towel-iso-curl) — the second column is seconds, the first one optional extra weight; data unchanged.
  const sec=!c&&(!!it.sec||(typeof isSecEx==='function'&&isSecEx(it.exId)));
  const prev=p=>{const w=p.w!==''&&p.w!=null&&+p.w!==0?esc(p.w)+(sec?' <span>кг</span> · ':' × '):'';return`<span>прошлый раз:</span> ${w}${esc(p.r)}${sec?' <span>с</span>':w?'':' <span>повт.</span>'}`};
  return`<div class="card"><div class="row exo" data-exo="m,${i}">${animShot(it.exId)}<h3 class="grow">${esc(exBy(it.exId).name)}</h3>${techBtn(it.exId)}${altCands(it.exId).length?`<button class="sm" data-ws="${i}">⇄</button>`:''}<button class="sm" data-rm="${i}">✕</button></div>
 <div class="mut">Цель: ${esc(c?it.min+'–'+it.max+' мин':sec?(it.ns||it.sets.length)+' × '+it.min+'–'+it.max+' с':(it.ns||it.sets.length)+' × '+it.min+'–'+it.max+' повт., отдых '+fmtT(it.rest))}</div>
 <div class="set mut" style="font-size:12px"><span>#</span><span>${c?'Уровень/км':sec?'Доп. вес, кг':'Вес, кг'}</span><span>${c?'Минуты':sec?'Секунды':'Повторы'}</span><span></span></div>
 ${it.sets.map((s,k)=>`<div class="set ${s.done?'done':''} ${s.pf&&!s.done?'pf':''}"><span class="n">${k+1}</span><input type="number" inputmode="decimal" step="0.5" value="${esc(s.w)}" data-i="${i}" data-k="${k}" data-f="w"><input type="number" inputmode="numeric" value="${esc(s.r)}" data-i="${i}" data-k="${k}" data-f="r"${sec?' aria-label="Секунды"':''}><button class="${s.done?'ok':''}" data-done="${i},${k}">✓</button>${l&&l[k]?`<div class="prev">${prev(l[k])}</div>`:''}</div>`).join('')}
 <div class="row"><button class="sm grow" data-add="${i}">+ подход</button><button class="sm grow" data-del="${i}">− подход</button></div></div>`}).join('')}
 ${A.cool?`<div class="card wucard">${cdHTML(A.cool.cd,A.cool.c)}</div>`:''}
 <h2>Заметки</h2><textarea id="notes" rows="3" placeholder="Самочувствие, что получилось…">${esc(A.notes)}</textarea>
 <button class="pri full" id="fin2" style="margin:16px 0 0;min-height:52px;font-size:17px">Завершить тренировку</button>
 <button class="danger full" id="cancel" style="margin:16px 0">Отменить тренировку</button>`;
 });
 const tick=()=>{const e=$('#dur');if(e)e.textContent=fmtT(Math.floor((Date.now()-A.start)/1000));if(typeof healthTick==='function')healthTick()};tick();clearInterval(durInt);durInt=setInterval(tick,1000);if(typeof healthBind==='function')healthBind();
 app.querySelectorAll('input[data-f]').forEach(inp=>inp.oninput=()=>{const s=A.items[inp.dataset.i].sets[inp.dataset.k];s[inp.dataset.f]=inp.value===''?'':+inp.value;if(s.pf){s.pf=false;inp.closest('.set').classList.remove('pf')}save()});
 app.querySelectorAll('[data-done]').forEach(b=>b.onclick=()=>{const[i,k]=b.dataset.done.split(',').map(Number),it=A.items[i],s=it.sets[k];if(!s.done)setDone(it,k);else{s.done=false;delete s.pr;delete s.prInfo}save();patchSets(i)});
 app.querySelectorAll('[data-wu]').forEach(b=>b.onclick=()=>{const k=+b.dataset.wu;A.warm.c[k]=!A.warm.c[k];save();patchWuCd('wu',k)});
 app.querySelectorAll('[data-cd]').forEach(b=>b.onclick=()=>{const k=+b.dataset.cd;A.cool.c[k]=!A.cool.c[k];save();patchWuCd('cd',k)});
 app.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{const it=A.items[b.dataset.add],l=it.sets[it.sets.length-1]||{w:'',r:''};it.sets.push(S.autoW!==false?{w:l.w,r:l.r,pf:l.w!=='',done:false}:{w:'',r:l.r,done:false});save();workoutView()});
 app.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{A.items[b.dataset.del].sets.pop();save();workoutView()});
 app.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{if(confirm('Убрать упражнение?')){A.items.splice(b.dataset.rm,1);save();workoutView()}});
 app.querySelectorAll('[data-ws]').forEach(b=>b.onclick=()=>{const it=A.items[b.dataset.ws];starterSwapModal(it.exId,starterSessionContext(A),id=>{swapActiveItem(A,+b.dataset.ws,id);save();workoutView()})});
 $('#notes').oninput=e=>{A.notes=e.target.value;save()};
 const add=$('#addex');if(add)add.onclick=()=>pickEx(id=>{const p=prmMe().a;A.items.push({exId:id,ns:3,rest:p[3],min:p[1],max:p[2],sets:[0,0,0].map(()=>({w:'',r:p[2],done:false})),limAck:typeof lgAckOf==='function'?lgAckOf(id):undefined});save();workoutView()});
 $('#cancel').onclick=()=>{if(confirm('Отменить тренировку без сохранения?')){S.active=null;if(typeof hr!=='undefined')try{hr.disconnect()}catch(e){}save();stopTimer();clearInterval(durInt);go('today')}};
 // D-259 (Eduards: «Завершить тренировку в конце должна быть.»): bottom button runs the same (wrapped) handler as the top «Завершить».
 $('#fin2').onclick=()=>{const f=$('#fin');if(f&&f.onclick)f.onclick()};
 $('#fin').onclick=()=>{const doneItems=A.items.filter(it=>it.sets.some(s=>s.done)).map(it=>({...it,sets:it.sets.filter(s=>s.done)}));
  if(!doneItems.length&&!confirm('Нет выполненных подходов. Всё равно сохранить?'))return;
  const snap=typeof healthSnap==='function'?healthSnap(A):null;A.end=snap?snap.end:Date.now();if(A.warm)A.warmDone=A.warm.c.filter(Boolean).length;delete A.warm;if(A.cool){A.coolDone=A.cool.c.filter(Boolean).length;delete A.cool}A.items=doneItems;
  if(snap&&typeof applyHealthFields==='function')applyHealthFields(A,summarizeHealth(snap,typeof healthProfile==='function'?healthProfile():{}));
  delete A.hrSamples;delete A.starterMode;S.workouts.push(A);S.next=(A.dayIdx+1)%S.program.length;if(typeof blockOnFinished==='function')blockOnFinished(A);S.active=null;if(typeof hr!=='undefined')try{hr.disconnect()}catch(e){}save();if(typeof mzOnWorkoutFinished==='function')mzOnWorkoutFinished(A);stopTimer();clearInterval(durInt);toast('Тренировка сохранена 💪');go('history');if(typeof showWorkoutSummary==='function')showWorkoutSummary(A);else prSummary(A)}}
function prNotes(A){const L=[];(A&&A.items||[]).forEach(it=>(it.sets||[]).forEach(s=>{if(s&&s.pr&&s.prInfo)L.push([exBy(it.exId).name,s.prInfo])}));
 const seen=new Set(),out=[];L.forEach(p=>{const k=p[0]+'\0'+(p[1].t||'');if(seen.has(k))return;seen.add(k);out.push(p)});return out}
function prNotesHTML(L){if(!L||!L.length)return'';const t=L.length===1?'🏆 Новый рекорд':'🏆 Новые рекорды';
 return`<div class="prnote"><b>${t}</b>${L.map(([n,i])=>`<div class="li"><div class="grow"><b>${esc(n)}</b><br><span class="mut">${esc(i.t)}</span></div><span class="mut"><s>${esc(i.o)}</s></span>&nbsp;→&nbsp;<b class="pr">${esc(i.n)}</b></div>`).join('')}</div>`}
function prSummary(A){if(typeof can==='function'&&!can('prs'))return;const L=prNotes(A);if(!L.length)return;const m=$('#modal');m.classList.remove('hidden');
 m.innerHTML=`<div class="sheet">${prNotesHTML(L)}<button class="pri full" id="mc" style="margin-top:12px">Отлично!</button></div>`;$('#mc').onclick=()=>m.classList.add('hidden')}
function priorSets(exId,skip){const ok=s=>s&&s.done&&s!==skip&&(typeof isWorkingSet!=='function'||isWorkingSet(s));const L=[];
 histWorkouts().forEach(wo=>(wo.items||[]).forEach(it=>{if(it.exId===exId)(it.sets||[]).forEach(s=>{if(ok(s))L.push(s)})}));
 if(S.active)S.active.items.forEach(it=>{if(it.exId===exId)it.sets.forEach(s=>{if(ok(s))L.push(s)})});return L}
function bestOf(exId){if(typeof recordsForExercise==='function'){const b=recordsForExercise(histWorkouts(),exId);return{w:b.bestWeight||0,r:b.best1RM||0,reps:b.bestRepsAtWeight,wReps:b.bestWeightReps}}
 let w=0,r=0;priorSets(exId).forEach(s=>{w=Math.max(w,+s.w);r=Math.max(r,e1rm(+s.w,+s.r))});return{w,r}}
let pendingFan=false;
function checkPR(exId,s){delete s.pr;delete s.prInfo;if(isCardio(exId)||(typeof isWarmupSet==='function'&&isWarmupSet(s))||!(+s.w>0)||!(+s.r>0))return;const L=priorSets(exId,s);if(!L.length)return;
 const bw=Math.max(0,...L.map(x=>+x.w)),eNew=typeof epley1RM==='function'?epley1RM(+s.w,+s.r):e1rm(+s.w,+s.r);
 const brs=L.map(x=>typeof epley1RM==='function'?epley1RM(+x.w,+x.r):e1rm(+x.w,+x.r)).filter(v=>v>0);
 const br=brs.length?Math.max(...brs):null;
 const same=L.filter(x=>+x.w===+s.w),bRep=same.length?Math.max(...same.map(x=>+x.r)):0;let info=null;
 if(+s.w>bw)info={t:'Максимальный вес',o:bw+' кг',n:s.w+' кг'};
 else if(eNew>0&&br!=null&&eNew>br+0.05)info={t:'1ПМ (оценка)',o:br.toFixed(1)+' кг',n:eNew.toFixed(1)+' кг'};
 else if(same.length&&+s.r>bRep)info={t:'Повторы с весом '+s.w+' кг',o:bRep+' повт.',n:s.r+' повт.'};
 if(info){s.pr=1;s.prInfo=info}}
const PHR=['Сила растёт — так держать!','Ты сильнее, чем вчера 💪','Прогресс налицо — продолжай!','Вот это результат! Гордись собой.','Каждый подход приближает к цели.','Рекорды любят упорных!','Отличная работа — тело отвечает на нагрузку.','Новая планка взята! Дальше — больше.'];
function celebrate(name,info){const d=document.createElement('div');d.id='prov';d.innerHTML=`<canvas id="conf"></canvas><div class="prbox"><div style="font-size:64px">🏆</div><h2>Новый личный рекорд!</h2><h3>${esc(name)}</h3>
 <div class="mut">${info.t}</div><div class="prcmp"><span class="mut"><s>${info.o}</s></span> → <b class="pr">${info.n}</b></div><p>${PHR[Math.floor(Math.random()*PHR.length)]}</p><button class="pri full" id="prok">Супер!</button></div>`;
 document.body.append(d);d.querySelector('#prok').onclick=()=>d.remove();confetti(d.querySelector('#conf'))}
function confetti(c){const W=c.width=innerWidth,H=c.height=innerHeight,x=c.getContext('2d'),cols=['--acc','--gold','--ok','--info','--pink','--txt'].map(cssVar);
 const P=Array.from({length:160},()=>({x:Math.random()*W,y:-Math.random()*H*.6,vx:(Math.random()-.5)*3,vy:2+Math.random()*4,r:Math.random()*6.3,s:5+Math.random()*7,c:cols[Math.floor(Math.random()*6)]}));
 let f=0;(function step(){if(!c.isConnected||f++>260)return;x.clearRect(0,0,W,H);P.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.03;p.r+=.1;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);x.restore()});requestAnimationFrame(step)})()}
function playFanfareOnly(){if(!soundOn()||taCovers())return;armAudio(0,true,true)}
// ---------- Таймер
let tEnd=0,tInt,lastWarn=-1;
const soundOn=()=>S.sound!==false;
function endSignal(){navigator.vibrate&&navigator.vibrate([400,150,400,150,400]);toast('⏰ Отдых окончен — следующий подход!')}
// Rest is 0 (use the program) or 5…600 s, in steps of 5. Anything under 5 s, empty, or not a number becomes 0.
function clampRest(v){v=+v;if(!Number.isFinite(v)||v<5)return 0;v=Math.round(v/5)*5;if(v<5)return 0;return v>600?600:v}
// D6 (v152 QA): while the rest timer bar is shown the page gets extra bottom space, so «Отменить тренировку» can scroll above it.
function tmrPad(on){try{const b=document.body;if(b&&b.classList)b.classList.toggle('tmr',!!on)}catch(_){}}
function startTimer(sec){sec=clampRest(sec);if(!(sec>0))return;armAudio(sec);tEnd=Date.now()+sec*1000;S.tEnd=tEnd;save();lastWarn=-1;$('#timer').classList.remove('hidden');tmrPad(1);clearInterval(tInt);tInt=setInterval(tt,200);tt();typeof NTF!=='undefined'&&NTF.restStart(tEnd)}
function tt(){const l=Math.ceil((tEnd-Date.now())/1000);$('#tval').textContent=fmtT(Math.max(0,l));
 if(l<=3&&l>=1&&l!==lastWarn){lastWarn=l;}
 if(l<=0){const c=taCovers();stopTimer(true);if(c){navigator.vibrate&&navigator.vibrate([400,150,400,150,400]);toast('⏰ Отдых окончен — следующий подход!')}else endSignal()}}
function stopTimer(keep){if(!keep){TA&&TA.pause();taEndAt=0}if(typeof NTF!=='undefined'&&(!keep||!document.hidden))NTF.restCancel();clearInterval(tInt);tEnd=0;S.tEnd=0;save();$('#timer').classList.add('hidden');tmrPad(0)}
// D-288: no skip/stop button. Rest ends on its own (tt → stopTimer) or is restarted by startTimer when the next set is logged.
document.addEventListener('visibilitychange',()=>{if(document.hidden)return;if(tEnd)tt();wake()});
// iOS web apps must not request exclusive audio focus (also on return to a running workout).
// Declaring ambient does not start playback. Keep media creation lazy; older iOS without mixing keeps the visual timer.
const iosWebAudio=!(window.Capacitor&&typeof window.Capacitor.isNativePlatform==='function'&&window.Capacitor.isNativePlatform())&&
 (navigator.standalone===true||/iPhone|iPad|iPod/i.test(navigator.userAgent||'')||
  (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1));
function mixIOSAudio(){try{const s=navigator.audioSession;if(!s)return false;
 if(s.type!=='ambient')s.type='ambient';return s.type==='ambient'}catch(e){return false}}
if(iosWebAudio)mixIOSAudio();
// Keep the real timer cue gesture-bound: a single <audio> with silence followed by the existing cues.
let TA=null;const getTA=()=>{if(!TA){TA=new Audio();TA.setAttribute('playsinline','');TA.volume=1}return TA};let taURL=null,taEndAt=0;
function wavFor(sec,fan,noEnd){sec=+sec;if(!Number.isFinite(sec)||sec<0)sec=0;if(sec>600)sec=600;const R=11025,tail=1.2,dur=Math.max(sec,fan?1:0)+tail;if(!Number.isFinite(dur)||dur>602)return null;const n=Math.ceil(dur*R);if(!Number.isFinite(n)||n<=0||n>R*602)return null;const buf=new ArrayBuffer(44+n*2),v=new DataView(buf);
 const ws=(o,s)=>[...s].forEach((c,i)=>v.setUint8(o+i,c.charCodeAt(0)));ws(0,'RIFF');v.setUint32(4,36+n*2,true);ws(8,'WAVE');ws(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,R,true);v.setUint32(28,R*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);ws(36,'data');v.setUint32(40,n*2,true);
 const beep=(t,d,f,amp)=>{const s=Math.floor(t*R),e=Math.min(n,s+Math.floor(d*R));for(let i=Math.max(0,s);i<e;i++){const k=i-s,env=Math.min(1,k/60,(e-i)/60);v.setInt16(44+i*2,Math.round(amp*env*(Math.sin(2*Math.PI*f*k/R)>=0?1:-1)),true)}};
 if(fan)[[523,0],[659,.13],[784,.26],[1047,.39],[784,.6],[1047,.72]].forEach(([f,t])=>beep(t,t>.5?.22:.12,f,24000));if(!noEnd){[3,2,1].forEach(k=>{if(sec-k>(fan?1.1:0.2))beep(sec-k,.12,700,20000)});[0,.35,.7].forEach(d=>beep(sec+d,.25,1000,30000))}
 return URL.createObjectURL(new Blob([buf],{type:'audio/wav'}))}
// Completing a restored hold can also start a new rest timer via its normal logging path.
let workoutAudioSuppressed=false;
function withoutWorkoutAudio(fn){const prev=workoutAudioSuppressed;workoutAudioSuppressed=true;
 try{return fn()}finally{workoutAudioSuppressed=prev}}
function armAudio(sec,fan,noEnd){if(workoutAudioSuppressed)return;fan=fan===undefined?pendingFan:fan;sec=+sec;if(!Number.isFinite(sec)||sec<0)sec=0;if(sec>600)sec=600;
 if(!soundOn()||(iosWebAudio&&(document.hidden||!mixIOSAudio()))){if(TA&&!TA.paused)TA.pause();taEndAt=0;return}getTA();const url=wavFor(sec,fan,noEnd);if(!url){try{TA.pause()}catch(e){}return}if(taURL)URL.revokeObjectURL(taURL);taURL=url;TA.src=taURL;TA.currentTime=0;taEndAt=noEnd?0:Date.now()+sec*1000;
 const p=TA.play();window.__taLast='pending';p&&p.then(()=>window.__taLast='ok').catch(err=>{window.__taLast=err.name;taEndAt=0})}
const taCovers=()=>TA&&taEndAt&&!TA.paused&&Math.abs(taEndAt-tEnd)<1500;
// восстановление таймера после перезагрузки
setTimeout(()=>{if(S.tEnd&&S.active){tEnd=S.tEnd;if(tEnd>Date.now()){$('#timer').classList.remove('hidden');tmrPad(1);tInt=setInterval(tt,200)}else{S.tEnd=0;save();toast('⏰ Отдых окончен')}}},0);
// Не гасить экран во время тренировки
let wl=null;async function wake(){try{if(S.active&&S.wake!==false&&'wakeLock'in navigator&&!wl&&!document.hidden){wl=await navigator.wakeLock.request('screen');wl.addEventListener('release',()=>wl=null)}if((!S.active||S.wake===false)&&wl){wl.release();wl=null}}catch(e){}}
setInterval(wake,3000);

// ---------- Программа
let PRG_OPEN=-1;
function program(){const one=PEDIT!=null&&S.program[PEDIT]?PEDIT:null;$('#title').textContent=one!=null?'Изменить тренировку':'Программа';
 app.innerHTML=`<button class="sm" id="pback" style="margin-bottom:8px">← Тренировки</button>${one==null?`<div class="card"><h3>${esc(S.progName||'Моя программа')}</h3><div>${tags(S.prof)}</div></div>`:''}
 
 ${one==null&&S.program.length>4?'<p class="mut">Нажми на тренировку, чтобы открыть и изменить её.</p>':''}${S.program.map((d,di)=>one!=null&&di!==one?'':`${one!=null?'':weekHead(S.program,di)}<details class="card dayc"${one!=null||S.program.length<=4||di===PRG_OPEN?' open':''} data-pd="${di}"><summary><b>${esc(workoutLabel(d,di))}</b> <span class="mut">${d.items.length} упражн.</span></summary><div class="row"><input value="${esc(d.name)}" data-dn="${di}"></div>
 ${d.items.map((it,ii)=>`<div class="li" style="flex-wrap:wrap"><div class="grow" style="min-width:60%">${esc(exBy(it.exId).name)}</div>${techBtn(it.exId)}
 ${altCands(it.exId).length?`<button class="sm" data-swp="${di},${ii}">⇄</button>`:''}<button class="sm" data-up="${di},${ii}">↑</button><button class="sm" data-dn2="${di},${ii}">↓</button><button class="sm" data-x="${di},${ii}">✕</button>
 <div class="row full" style="width:100%;font-size:13px"><label class="grow">Подходы<input type="number" value="${esc(it.sets)}" data-e="${di},${ii},sets"></label><label class="grow">Повт. от<input type="number" value="${esc(it.min)}" data-e="${di},${ii},min"></label><label class="grow">до<input type="number" value="${esc(it.max)}" data-e="${di},${ii},max"></label><label class="grow">Отдых, с<input type="number" value="${esc(it.rest)}" data-e="${di},${ii},rest"></label></div></div>`).join('')}
 <button class="full sm" style="margin-top:10px" data-ad="${di}">+ Упражнение</button></details>`).join('')}
 <div class="card"><b>Подходов на группу мышц в неделю</b><div style="margin-top:6px">${volBadges()}</div><div class="mut" style="margin-top:6px">Ориентир для роста мышц: 10–20 подходов (Schoenfeld 2017).</div></div>`;
 $('#pback').onclick=()=>{const d=PEDIT;go('today');if(d!=null&&!S.active&&S.program[d]&&view==='today')today(d)};
 app.querySelectorAll('[data-swp]').forEach(b=>b.onclick=()=>{const[di,ii]=b.dataset.swp.split(',');const it=S.program[di].items[ii];starterSwapModal(it.exId,starterSessionContext(null),id=>{it.exId=id;save();program()})});
 app.querySelectorAll('[data-pd]').forEach(x=>x.ontoggle=()=>{if(x.open)PRG_OPEN=+x.dataset.pd});app.querySelectorAll('[data-dn]').forEach(i=>i.onchange=()=>{S.program[i.dataset.dn].name=i.value;save()});
 app.querySelectorAll('[data-e]').forEach(i=>i.onchange=()=>{const[d,k,f]=i.dataset.e.split(',');S.program[d].items[k][f]=+i.value;save();program()});
 const mv=(a,d)=>{const[di,ii]=a.split(',').map(Number),L=S.program[di].items,j=ii+d;if(j<0||j>=L.length)return;[L[ii],L[j]]=[L[j],L[ii]];save();program()};
 app.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>mv(b.dataset.up,-1));app.querySelectorAll('[data-dn2]').forEach(b=>b.onclick=()=>mv(b.dataset.dn2,1));
 app.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>{const[di,ii]=b.dataset.x.split(',');S.program[di].items.splice(ii,1);save();program()});
 app.querySelectorAll('[data-ad]').forEach(b=>b.onclick=()=>pickEx(id=>{const p=prmMe().a;S.program[b.dataset.ad].items.push({exId:id,sets:p[0],min:p[1],max:p[2],rest:p[3],limAck:typeof lgAckOf==='function'?lgAckOf(id):undefined});save();program()}))}
function volBadges(){const v={};S.program.forEach(d=>d.items.forEach(it=>{const g=exBy(it.exId).group;if(g!=='Кардио')v[g]=(v[g]||0)+it.sets}));return Object.entries(v).map(([g,n])=>`<span class="badge">${esc(g)}: ${esc(n)}</span>`).join('')}
function pickEx(cb){const m=$('#modal');m.classList.remove('hidden');
 m.innerHTML=`<div class="sheet"><div class="row"><input id="q" placeholder="Поиск упражнения"><button id="mc">✕</button></div><div id="el"></div></div>`;
 const draw=()=>{const q=$('#q').value.toLowerCase();$('#el').innerHTML=GROUPS.map(g=>{const l=allEx().filter(e=>e.group===g&&tr(e.name).toLowerCase().includes(q));return l.length?`<h2>${g}</h2>`+l.map(e=>{const rk=typeof lgConf==='function'?lgConf(e.id):[];return`<div class="row"><button class="full grow" style="margin:3px 0;text-align:left${rk.length?';opacity:.6':''}" data-p="${esc(e.id)}">${rk.length?'⚠ ':''}${esc(e.name)}${rk.length?` <span class="mut">(${typeof lgLimSpans==='function'?lgLimSpans(rk):''})</span>`:''}</button>${techBtn(e.id)}</div>`}).join(''):''}).join('');
  // tech-fix-2: a risky exercise is marked; adding it needs a confirm and the item keeps the acknowledgement (limAck).
  $('#el').querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{const id=b.dataset.p;if(typeof lgConfirmAdd==='function'&&!lgConfirmAdd(id))return;m.classList.add('hidden');cb(id)})};
 $('#q').oninput=draw;$('#mc').onclick=()=>m.classList.add('hidden');draw()}
// ---------- Прогресс
let pEx=null,pM='w';
function fmtWeekRange(b){const a=new Date(b.start),e=new Date(b.end);e.setDate(e.getDate()-1);return a.getDate()+'.'+(a.getMonth()+1)+'–'+e.getDate()+'.'+(e.getMonth()+1)}
function volWeekHTML(){if(typeof can==='function'&&!can('charts'))return'<div class="card" id="volweek"><button class="full sm" data-pw="Объём по мышцам — по подписке">🔒 Объём по мышцам — по подписке</button></div>';
 if(typeof weeklyVolume!=='function')return'';
 const v=weeklyVolume(histWorkouts());
 const max=Math.max(1,...v.current.groups.map(g=>g.sets),...v.previous.groups.map(g=>g.sets));
 const block=(title,side,empty)=>{
  const lab=fmtWeekRange(side===v.current?v.bounds.current:v.bounds.previous);
  if(!side.groups.length)return`<div class="card"><b>${title}</b> <span class="mut">${lab}</span><p class="mut" style="margin:6px 0 0">${empty}</p></div>`;
  return`<div class="card"><b>${title}</b> <span class="mut">${lab}</span><div style="margin-top:8px">${side.groups.map(g=>{
   const w=Math.max(6,Math.round(100*g.sets/max));const tons=g.tonnage>0?' · '+Math.round(g.tonnage)+' кг':'';
   return`<div class="volrow"><span class="volname">${esc(g.group)}</span><div class="voltrack"><i style="width:${w}%"></i></div><span class="voln">${g.sets} подходов${tons}</span></div>`;
  }).join('')}</div></div>`;
 };
 return`<div id="volweek"><h2>Объём по мышцам за неделю</h2>${block('Эта неделя',v.current,'На этой неделе пока нет рабочих подходов.')}${block('Прошлая неделя',v.previous,'На прошлой неделе нет рабочих подходов.')}<p class="mut">Рабочие подходы и тоннаж (кг × повторы), где указан вес. Упражнения с собственным весом — только подходы. Неделя: пн–вс, местное время.</p></div>`}
function recRow(id){const b=typeof recordsForExercise==='function'?recordsForExercise(histWorkouts(),id):null;
 const name=esc(exBy(id).name);
 if(!b){const o=bestOf(id);return`<div class="li"><span class="grow">${name}</span><span class="pr">🏆 ${o.w} кг</span><span class="mut">1ПМ (оценка) ${o.r?o.r.toFixed(1):'—'}</span></div>`}
 const w=b.bestWeight?b.bestWeight+' кг × '+(b.bestWeightReps||'—'):'—';
 let reps='';
 if(b.bestRepsAtWeight&&(b.bestRepsAtWeight.w!==b.bestWeight||b.bestRepsAtWeight.r!==b.bestWeightReps))
  reps=`<div class="mut">Повторы: ${b.bestRepsAtWeight.w} кг × ${b.bestRepsAtWeight.r}</div>`;
 const rm=b.best1RM!=null?b.best1RM.toFixed(1)+' кг':'—';
 return`<div class="li" style="align-items:flex-start"><div class="grow"><b>${name}</b><div class="mut">Макс. вес: ${w}</div>${reps}<div class="mut">1ПМ (оценка): ${rm}</div></div></div>`}
function recsHTML(used){if(typeof can==='function'&&!can('prs'))return'<div class="card" id="prlist"><button class="full sm" data-pw="Рекорды — по подписке">🔒 Рекорды — по подписке</button></div>';
 return`<h2>Личные рекорды</h2><div class="card" id="prlist">${used.map(recRow).join('')||'<p class="mut">Пока нет рекордов.</p>'}</div>`}
function progress(){$('#title').textContent='Прогресс';const wo=histWorkouts();const used=[...new Set(wo.flatMap(w=>(w.items||[]).map(i=>i.exId)))].filter(id=>!isCardio(id));
 if(!used.length){app.innerHTML='<div class="card">Пока нет данных. Заверши первую тренировку — здесь появятся графики и рекорды.</div>';return}
 if(!used.includes(pEx))pEx=used[0];
 const showCh=typeof can!=='function'||can('charts');
 const pts=wo.map(w=>{const it=(w.items||[]).find(i=>i.exId===pEx);if(!it)return null;const s=(it.sets||[]).filter(x=>typeof isWorkingSet!=='function'||isWorkingSet(x));if(!s.length)return null;
  const e1s=s.map(x=>typeof epley1RM==='function'?epley1RM(+x.w,+x.r):e1rm(+x.w,+x.r)).filter(v=>v>0);
  const bw=typeof BWX!=='undefined'&&BWX.has(pEx);
  return{d:w.end||w.start,w:Math.max(0,...s.map(x=>+x.w||0)),r:e1s.length?Math.max(...e1s):null,v:s.reduce((a,x)=>{const ww=+x.w,rr=+x.r;return a+(!bw&&ww>0&&rr>0?ww*rr:0)},0)}}).filter(Boolean);
 const chartBlock=showCh?`<select id="pex">${used.map(id=>`<option value="${esc(id)}" ${id===pEx?'selected':''}>${esc(exBy(id).name)}</option>`).join('')}</select>
 <div class="tabs">${[['w','Макс. вес'],['r','1ПМ (оценка)'],['v','Объём']].map(([k,t])=>`<button class="sm ${pM===k?'on':''}" data-m="${k}">${t}</button>`).join('')}</div>
 <canvas id="ch"></canvas><p class="mut">1ПМ (оценка) по формуле Эпли: вес × (1 + повторы/30), только для 1–10 повторов. Это оценка, не измеренный максимум.</p>`
 :'<div class="card"><button class="full sm" data-pw="Графики и расчётный 1ПМ — по подписке">🔒 График 1ПМ — по подписке</button></div>';
 app.innerHTML=`${volWeekHTML()}${chartBlock}${recsHTML(used)}`;
 if(showCh){const sel=$('#pex');if(sel)sel.onchange=e=>{pEx=e.target.value;progress()};app.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{pM=b.dataset.m;progress()});
  const series=pts.filter(p=>pM!=='r'||p.r!=null).map(p=>[p.d,p[pM]]);const c=$('#ch');if(c)chart(c,series)}}
function chart(c,data){const dpr=devicePixelRatio||1,W=c.clientWidth,H=c.clientHeight;c.width=W*dpr;c.height=H*dpr;const x=c.getContext('2d');x.scale(dpr,dpr);
 x.font='12px system-ui';x.fillStyle=cssVar('--mut');if(!data.length)return;const ys=data.map(d=>d[1]),mn=Math.min(...ys)*.95,mx=Math.max(...ys)*1.05||1,P=34;
 const X=i=>P+(data.length<2?(W-2*P)/2:i*(W-P-14)/(data.length-1)),Y=v=>H-24-(v-mn)/(mx-mn||1)*(H-44);
 x.strokeStyle=cssVar('--line');[0,.5,1].forEach(f=>{const v=mn+(mx-mn)*f;x.beginPath();x.moveTo(P,Y(v));x.lineTo(W-8,Y(v));x.stroke();x.fillText(Math.round(v),4,Y(v)+4)});
 x.strokeStyle=cssVar('--acc');x.lineWidth=3;x.beginPath();data.forEach((d,i)=>i?x.lineTo(X(i),Y(d[1])):x.moveTo(X(i),Y(d[1])));x.stroke();
 x.fillStyle=cssVar('--acc');data.forEach((d,i)=>{x.beginPath();x.arc(X(i),Y(d[1]),4,0,7);x.fill()});x.fillStyle=cssVar('--mut');
 [0,data.length-1].forEach(i=>{const dt=new Date(data[i][0]);x.fillText(dt.getDate()+'.'+(dt.getMonth()+1),Math.min(X(i)-10,W-40),H-6)})}
// ---------- История
let calM=new Date();calM.setDate(1);
function history(){$('#title').textContent='История';const y=calM.getFullYear(),m=calM.getMonth(),first=(new Date(y,m,1).getDay()+6)%7,n=new Date(y,m+1,0).getDate();
 const byDay={};S.workouts.forEach(w=>{const d=new Date(w.start);if(d.getFullYear()===y&&d.getMonth()===m)(byDay[d.getDate()]=byDay[d.getDate()]||[]).push(w)});
 app.innerHTML=`<div class="card"><div class="row"><button class="sm" id="pm">‹</button><b class="grow" style="text-align:center">${calM.toLocaleDateString(LOC,{month:'long',year:'numeric'})}</b><button class="sm" id="nm">›</button></div>
 <div class="cal" style="margin-top:10px">${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d=>`<div class="h">${d}</div>`).join('')}${'<div></div>'.repeat(first)}${Array.from({length:n},(_,i)=>`<div class="${byDay[i+1]?'has':''}" data-day="${i+1}">${i+1}</div>`).join('')}</div></div>
 <h2>Все тренировки (${S.workouts.length})</h2>${S.workouts.slice().reverse().map(w=>`<button class="full card" style="text-align:left;height:auto;padding:12px" data-w="${esc(w.id)}"><b>${esc(historyLabel(w))}</b><br><span class="mut">${new Date(w.start).toLocaleDateString(LOC,{day:'numeric',month:'long',weekday:'short'})} · ${fmtT(Math.round(((w.end||w.start)-w.start)/60000))} ч · ${w.items.length} упр.${typeof historyKcalText==='function'?historyKcalText(w):''}</span></button>`).join('')||'<p class="mut">Пока пусто.</p>'}`;
 $('#pm').onclick=()=>{calM.setMonth(m-1);history()};$('#nm').onclick=()=>{calM.setMonth(m+1);history()};
 app.querySelectorAll('[data-day]').forEach(d=>byDay[d.dataset.day]&&(d.onclick=()=>showW(byDay[d.dataset.day][0].id)));
 app.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>showW(b.dataset.w))}
function showW(id){const w=S.workouts.find(x=>x.id===id),m=$('#modal');m.classList.remove('hidden');
 m.innerHTML=`<div class="sheet"><div class="row"><h2 class="grow" style="margin:0">${esc(historyLabel(w))}</h2><button id="mc">✕</button></div>
 <p class="mut">${new Date(w.start).toLocaleString(LOC)} · длительность ${fmtT(Math.round(((w.end||w.start)-w.start)/60000))} ч</p>
 ${typeof healthDetailHTML==='function'?healthDetailHTML(w):''}
 ${w.items.map(it=>`<div class="card"><b>${esc(exBy(it.exId).name)}</b><br>${it.sets.map(s=>`<span class="badge ${s.pr?'pr':''}">${s.pr?'🏆 ':''}${esc(s.w)} × ${esc(s.r)}</span>`).join('')}</div>`).join('')}
 ${w.notes?`<div class="card"><b>Заметки</b><br>${esc(w.notes)}</div>`:''}<button class="danger full" id="wdel">Удалить тренировку</button></div>`;
 $('#mc').onclick=()=>m.classList.add('hidden');$('#wdel').onclick=()=>{if(confirm('Удалить?')){S.workouts=S.workouts.filter(x=>x.id!==id);S.deletedWorkouts=(S.deletedWorkouts||[]).concat(id);save();m.classList.add('hidden');history()}}}
// ---------- Тело
const BM=[['weight','Вес','кг'],['fat','Жир','%'],['neck','Шея','см'],['chest','Грудь','см'],['waist','Талия','см'],['belly','Живот','см'],['hips','Бёдра (таз)','см'],['biceps','Бицепс','см'],['thigh','Бедро','см'],['calf','Икра','см']];
const IDB_NAME='moyzal',IDB_VER=2,HIST_BACKUP_KEY='gym_hist_backup',HIST_IDB_KEY='gym_hist_idb',PERSIST_KEY='gymPersist';
const idb=(()=>{let p,live,epoch=0;
 function drop(){epoch++;try{if(live&&live.close)live.close()}catch(e){} live=null; p=null}
 const open=()=>p=p||new Promise((res,rej)=>{
  if(typeof indexedDB==='undefined'){p=null;rej(new Error('no idb'));return}
  const r=indexedDB.open(IDB_NAME,IDB_VER);
  r.onupgradeneeded=()=>{const db=r.result;
   if(!db.objectStoreNames.contains('photos'))db.createObjectStore('photos');
   if(!db.objectStoreNames.contains('history'))db.createObjectStore('history')};
  r.onsuccess=()=>{live=r.result;
   // A blocked deleteDatabase never finishes while this connection is open (Android may kill the process first).
   live.onversionchange=()=>drop();
   res(live)};
  r.onerror=()=>{p=null;rej(r.error)}});
 const tx=(store,m,f)=>open().then(db=>new Promise((res,rej)=>{const t=db.transaction(store,m),st=t.objectStore(store),q=f(st);t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error)}));
 return{close:drop,gen:()=>epoch,get:k=>tx('photos','readonly',s=>s.get(k)),put:(k,v)=>tx('photos','readwrite',s=>s.put(v,k)),del:k=>tx('photos','readwrite',s=>s.delete(k)),
  all:()=>tx('photos','readonly',s=>s.getAllKeys()).then(async ks=>{const o={};for(const k of ks)o[k]=await idb.get(k);return o}),
  histGet:()=>tx('history','readonly',s=>s.get('workouts')),
  // GC-165: 'owner' = account (ownerUid) the IDB history belongs to; null = guest; absent = written before v165.
  histOwner:()=>tx('history','readonly',s=>s.get('owner')),
  // list + owner (+ GC-166 quarantine) in ONE transaction: a save() at start-up must not slip in between the reads.
  histRead:()=>tx('history','readonly',s=>{const a=s.get('workouts'),o=s.get('owner'),q=s.get('quarantine');return{get result(){return{list:a.result,owner:o.result,quarantine:q.result}}}}),
  histPut:(list,owner,quarantine)=>tx('history','readwrite',s=>{if(quarantine!==undefined)s.put(quarantine,'quarantine');if(owner!==undefined)s.put(owner,'owner');return s.put(list,'workouts')}),
  // GC-166: read-modify-write in ONE readwrite transaction (what is in IDB is isolated before it is replaced; all-or-nothing).
  histSwap:fn=>tx('history','readwrite',s=>{const r=[s.get('workouts'),s.get('owner'),s.get('quarantine')];let n=r.length;
   const go=()=>{if(--n)return;const w=fn(r[0].result,r[1].result,r[2].result);if(!w)return;
    if(w.quarantine!==undefined)s.put(w.quarantine,'quarantine');if(w.owner!==undefined)s.put(w.owner,'owner');if(w.list)s.put(w.list,'workouts')};
   r.forEach(q=>{if(q.readyState==='pending')q.onsuccess=go;else go()});return null})}})();
function histOwnerNow(){return(typeof S!=='undefined'&&S&&S.ownerUid)||null}
// D-207: workout history lives in IndexedDB 'history'. localStorage 'gym' still keeps a copy this version;
// a one-time snapshot is stored in gym_hist_backup and is never overwritten. If IndexedDB is missing (private mode), we keep using localStorage.
function histList(){return Array.isArray(S.workouts)?S.workouts:[]}
function writeHistBackupOnce(list){try{if(localStorage.getItem(HIST_BACKUP_KEY)==null)localStorage.setItem(HIST_BACKUP_KEY,JSON.stringify(list||[]))}catch(e){}}
// GC-166: history whose owner differs from this device's owner, or cannot be proven (IDB written before v165, no mark), is
// never merged and never destroyed: it goes to an isolated 'quarantine' (IndexedDB only, never synced), one bundle per owner
// ('legacy' = unknown, 'guest' = guest, otherwise the account id).
// GC-166-F1: tombstones belong to an owner — the device owner's S.deletedWorkouts are NEVER applied to another owner's records;
// they apply only when a bundle is restored into the device owner's own history. A same id of different owners is no proof of
// anything: only a byte-identical record counts as «already on the device»; a different record under the same id is isolated whole.
function histQKey(owner){return owner===undefined?'legacy':owner===null?'guest':String(owner)}
const histSig=w=>{try{return JSON.stringify(w)}catch(e){return''}};
function histQAdd(Q,owner,list,keep){
 // GC-167: «byte-identical = already on the device» holds only for an UNMARKED base (owner unknown, same device data).
 // For a KNOWN other owner (account or guest) even an identical record is its own copy and is isolated — otherwise that owner
 // would lose an unsynced workout just because the current owner happens to have the same bytes.
 // GC-167b: a GUEST source being bound to an account on this device (transfer / empty account) is the device's own data —
 // byte-identical records are not copied into a «guest» bundle. Different ACCOUNTS stay strict (identical records isolated).
 const same=new Set(owner===undefined||owner===null?(Array.isArray(keep)?keep:[]).map(histSig):[]);
 const extra=(Array.isArray(list)?list:[]).filter(w=>w&&typeof w==='object'&&w.id!=null&&!same.has(histSig(w)));
 const out=Array.isArray(Q)?Q.filter(x=>x&&typeof x==='object'&&x.owner):[];
 if(!extra.length)return out;
 const key=histQKey(owner);let b=out.find(x=>x.owner===key);
 if(!b){b={owner:key,at:Date.now(),workouts:[]};out.push(b)}
 // lossless union: every distinct record is kept (no «newer wins» inside the quarantine)
 const have=new Set((b.workouts||[]).map(histSig));b.workouts=(b.workouts||[]).slice();
 extra.forEach(w=>{const s=histSig(w);if(!have.has(s)){have.add(s);b.workouts.push(w)}});b.at=Date.now();
 return out}
// Own bundle of `owner` (an account) goes back into its history; its own tombstones apply.
function histQTakeOwn(Q,owner,list,deleted){
 if(typeof owner!=='string'||!owner)return{Q,list};
 const b=Q.find(x=>x&&x.owner===owner);if(!b)return{Q,list};
 return{Q:Q.filter(x=>x!==b),list:mergeHist(b.workouts,list,deleted)}}
// One write of the device history to IDB: whatever is there and does not belong to the current owner is isolated first,
// and the current owner's own isolated bundle comes back (U1 → U2 → U1 in one session, no restart needed).
function histWriteFn(list,owner,deleted,res){return(l0,o0,q0)=>{
 let Q=Array.isArray(q0)?q0:[],L=Array.isArray(list)?list:[];
 if(Array.isArray(l0)&&l0.length&&o0!==owner)Q=histQAdd(Q,o0,l0,L);
 const t=histQTakeOwn(Q,owner,L,deleted);Q=t.Q;
 if(res){res.list=t.list;res.restored=t.list!==L;res.quarantine=Q}
 return{list:t.list,owner,quarantine:Q}}}
function histWrite(list,owner){if(S_RO||typeof indexedDB==='undefined')return Promise.resolve(false);
 const own=owner===undefined?histOwnerNow():owner,res={};
 return idb.histSwap(histWriteFn(list,own,S.deletedWorkouts,res)).then(()=>{try{localStorage.setItem(HIST_IDB_KEY,'1')}catch(e){}
  if(res.quarantine)histQCache=res.quarantine;
  // the device owner's own records came back from the quarantine → show them now and keep the device copy in step
  if(res.restored&&own===histOwnerNow()){S.workouts=mergeHist(res.list,histList(),S.deletedWorkouts);try{if(!S_RO)localStorage.setItem('gym',JSON.stringify(S))}catch(e){}}
  return true})}
function saveHistory(){if(S_RO||typeof indexedDB==='undefined')return;
 const gen=idb.gen();
 Promise.resolve().then(async()=>{if(idb.gen()!==gen)return;try{await histWrite(histList(),histOwnerNow())}catch(e){}})}
// Device copy present? (any guest / account data, not only workouts) — «localStorage lost» only when there is nothing at all.
function histDeviceHasData(){return histList().length>0||!!(S&&(S.program||S.goal||S.prof||S.block))}
// Isolated history: list (for a future UI / support) and an explicit restore. An account bundle only for that same account;
// 'legacy' / 'guest' bundles only after the user confirms. Restored workouts are merged like any other (tombstones win).
function histQuarantineList(){return(histQCache||[]).map(b=>({owner:b.owner,count:(b.workouts||[]).length,at:b.at}))}
let histQCache=[];
function histQuarantineRestore(key){
 const b=(histQCache||[]).find(x=>x.owner===key);if(!b)return false;
 const me=histOwnerNow();
 if(key!=='legacy'&&key!=='guest'&&key!==me)return false;
 if((key==='legacy'||key==='guest')&&typeof confirm==='function'&&!confirm('Вернуть в историю '+(b.workouts||[]).length+' тренировок, которые нашлись на этом устройстве без подтверждённого владельца? Делай это, только если это твои тренировки.'))return false;
 S.workouts=mergeHist(b.workouts,histList(),S.deletedWorkouts);
 histQCache=histQCache.filter(x=>x!==b);
 try{localStorage.setItem('gym',JSON.stringify(S))}catch(e){}
 if(!S_RO&&typeof indexedDB!=='undefined')idb.histSwap((l0,o0,q0)=>({list:histList(),owner:histOwnerNow(),quarantine:(Array.isArray(q0)?q0:[]).filter(x=>x&&x.owner!==key)})).catch(()=>{});
 return true}
// Union of IDB + localStorage(+in-memory) history by workout id; tombstones in S.deletedWorkouts (same list sync uses) win;
// on a conflict the newer one (updatedAt||end||start) wins, ties go to the local copy (written synchronously, so freshest).
function histT(w){return +(w&&(w.updatedAt||w.end||w.start))||0}
function mergeHist(fromIdb,local,deleted){const del=new Set(Array.isArray(deleted)?deleted:[]),map=new Map(),order=[];
 const add=(w,pref)=>{if(!w||typeof w!=='object'||w.id==null||del.has(w.id))return;const y=map.get(w.id);
  if(!y){map.set(w.id,w);order.push(w.id)}else if(pref?histT(w)>=histT(y):histT(w)>histT(y))map.set(w.id,w)};
 (Array.isArray(fromIdb)?fromIdb:[]).forEach(w=>add(w,false));(Array.isArray(local)?local:[]).forEach(w=>add(w,true));
 return order.map(id=>map.get(id))}
async function migrateHistory(){
 if(typeof indexedDB==='undefined')return{ok:false,fallback:'localStorage'};
 const gen=idb.gen();
 let fromIdb,idbOwner,idbQ,idbAvail=true;
 try{const h=await idb.histRead();fromIdb=h&&h.list;idbOwner=h?h.owner:undefined;idbQ=h&&h.quarantine}catch(e){idbAvail=false}
 if(idb.gen()!==gen)return{ok:false,fallback:'cleared'};
 if(!idbAvail)return{ok:false,fallback:'localStorage'};
 if(Array.isArray(fromIdb)){
  // D-207 fix (Claude 15.11): union by id instead of replace. localStorage 'gym' is written synchronously,
  // the IDB write is async; if the app was closed before it finished, the last workout is only in localStorage.
  // GC-165/166 ownership rules (the decision depends only on the marks, so a failed / interrupted write gives the same result on
  // the next start):
  //  • IDB owner = device owner (same account, or guest↔guest) → merge as before;
  //  • device copy lost (nothing on the device, no owner) → restore: with the PROVEN owner of a marked IDB, or as unbound device
  //    data for an unmarked one (binding to an account then needs the transfer consent at sign-in);
  //  • otherwise (another account, a guest with its own data on the device, or an unmarked IDB) → records already on the device
  //    stay, the rest is isolated in the quarantine — never merged, never assigned, never destroyed.
  const me=histOwnerNow(),local=histList(),del=S.deletedWorkouts,lost=me===null&&!histDeviceHasData();
  let Q=Array.isArray(idbQ)?idbQ:[],merged,src='idb';
  if(idbOwner!==undefined&&idbOwner===me)merged=mergeHist(fromIdb,local,del);
  else if(lost){merged=mergeHist(fromIdb,local,del);if(typeof idbOwner==='string'&&idbOwner&&fromIdb.length)S.ownerUid=idbOwner;src='restored'}
  // GC-166-F1: different / unproven owner → the device keeps ONLY its own records (a same id from IndexedDB never replaces them,
  // whatever its date); every IndexedDB record that is not byte-identical to a device record is isolated whole.
  else{const n0=JSON.stringify(Q);merged=mergeHist([],local,del);Q=histQAdd(Q,idbOwner,fromIdb,local);if(JSON.stringify(Q)!==n0)src='isolated'}
  // the current account's own isolated bundle (e.g. after another account used the device) comes back automatically
  {const t=histQTakeOwn(Q,histOwnerNow(),merged,del);Q=t.Q;merged=t.list}
  if(idb.gen()!==gen)return{ok:false,fallback:'cleared'};
  S.workouts=merged;histQCache=Q;
  try{localStorage.setItem(HIST_IDB_KEY,'1')}catch(e){}
  try{if(!S_RO)localStorage.setItem('gym',JSON.stringify(S))}catch(e){}
  // all-or-nothing: workouts + owner + quarantine in one transaction
  if(!S_RO)try{await idb.histPut(merged,histOwnerNow(),Q)}catch(e){}
  return{ok:true,source:src};
 }
 const local=histList();
 writeHistBackupOnce(local);
 try{if(idb.gen()!==gen)return{ok:false,fallback:'cleared'};await idb.histPut(local,histOwnerNow());try{localStorage.setItem(HIST_IDB_KEY,'1')}catch(e){};return{ok:true,source:'migrated'}}
 catch(e){return{ok:false,fallback:'localStorage'}}
}
async function clearLocalData({logoutOwner}={}){
 // QA-03: вместе с основными данными — гостевые и аварийные копии.
 try{['gym','gym_hist_backup','gym_hist_idb','gymPersist','gym_guest_copy','gym_broken'].forEach(k=>localStorage.removeItem(k))}catch(e){}
 if(logoutOwner!==undefined&&typeof indexedDB!=='undefined'){
  // Ordinary logout clears the active account, not other accounts' isolated history. An explicit wipe still deletes the DB.
  await idb.histSwap((list,owner,q)=>{
   let keep=(Array.isArray(q)?q:[]).filter(b=>b&&b.owner!==logoutOwner&&b.owner!=='guest'&&b.owner!=='legacy');
   if(typeof owner==='string'&&owner!==logoutOwner)keep=histQAdd(keep,owner,list,[]);
   return{list:[],owner:null,quarantine:keep};
  }).catch(()=>{}); // Never fall back to dropping the whole DB after a failed targeted clear.
  try{for(const k of Object.keys(await idb.all()))await idb.del(k)}catch(e){}
 }
 // Close the cached moyzal connection first, otherwise deleteDatabase stays blocked until the page dies.
 try{if(typeof idb!=='undefined'&&idb&&idb.close)idb.close()}catch(e){}
 histQCache=[];
 for(const db of logoutOwner===undefined?[IDB_NAME,'moyzal_guest']:['moyzal_guest'])try{await new Promise(r=>{if(typeof indexedDB==='undefined')return r();const q=indexedDB.deleteDatabase(db);q.onsuccess=q.onerror=q.onblocked=()=>r()})}catch(e){}
}
let persistAsked=false;
function requestPersist(){
 try{
  if(persistAsked)return;
  if(!S||!(S.program||(S.workouts&&S.workouts.length)))return;
  let prev=null;try{prev=localStorage.getItem(PERSIST_KEY)}catch(e){}
  if(prev)return;
  persistAsked=true;
  if(!(navigator.storage&&navigator.storage.persist)){try{localStorage.setItem(PERSIST_KEY,'unsupported')}catch(e){}return}
  navigator.storage.persist().then(ok=>{try{localStorage.setItem(PERSIST_KEY,ok?'granted':'denied')}catch(e){}}).catch(()=>{try{localStorage.setItem(PERSIST_KEY,'error')}catch(e){}});
 }catch(e){}
}
const histReady=migrateHistory();
function compress(file){return new Promise((res,rej)=>{const img=new Image();img.onload=()=>{const k=Math.min(1,900/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=img.width*k;c.height=img.height*k;c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(img.src);res(c.toDataURL('image/jpeg',.72))};img.onerror=rej;img.src=URL.createObjectURL(file)})}
let bM='weight',bR=0,cmpA=null,cmpB=null;
const fmtD=d=>new Date(d).toLocaleDateString(LOC,{day:'numeric',month:'short',year:'2-digit'});
const sgn=(v,u)=>(v>0?'+':'')+(Math.round(v*10)/10)+' '+u;
function body(){$('#title').textContent='Тело';const E=S.body.slice().sort((a,b)=>a.date.localeCompare(b.date));
 const m=BM.find(x=>x[0]===bM),from=bR?Date.now()-bR*864e5:0,pts=E.filter(e=>e[bM]!==''&&e[bM]!=null&&new Date(e.date)>=from).map(e=>[new Date(e.date).getTime(),+e[bM]]);
 const all=E.filter(e=>e[bM]!==''&&e[bM]!=null),last=all[all.length-1],first=all[0],prev=all[all.length-2];
 const lw=E.filter(e=>+e.weight>0).pop(),bmi=S.height&&lw?(+lw.weight/((S.height/100)**2)):0;
 const bmiT=bmi?(bmi<18.5?'ниже нормы':bmi<25?'норма':bmi<30?'избыточный вес':'ожирение'):'';
 const ph=E.filter(e=>e.photos&&e.photos.length);if(!ph.some(e=>e.id===cmpA))cmpA=null;if(!ph.some(e=>e.id===cmpB)||(cmpA&&cmpA===cmpB&&ph.length>1))cmpB=ph.length?ph[ph.length-1].id:null;if(!cmpA&&ph.length)cmpA=ph[0].id;
 const bmiC=bmi?(bmi<18.5||bmi>=25&&bmi<30?'gold':bmi<25?'ok':'danger'):'';
 app.innerHTML=`<div class="card" id="mydata"><h2 style="margin-top:0">Мои данные</h2><div class="grid2"><label class="mut">Рост, см<input type="number" id="hgt" inputmode="numeric" placeholder="170" value="${esc(S.height||'')}" style="font-size:24px;font-weight:700"></label><label class="mut">Вес, кг<input type="number" id="wgt" inputmode="decimal" step="0.1" placeholder="70" value="${esc(lw?lw.weight:'')}" style="font-size:24px;font-weight:700"></label></div>
 ${bmi?`<p id="bmi" style="margin:12px 0 4px;font-size:18px">ИМТ: <b>${bmi.toFixed(1)}</b> <span class="badge" id="bmit" data-bmi="${bmiC}" style="${{ok:'background:var(--ok);color:var(--on-ok)',gold:'background:var(--gold);color:var(--on-gold)',danger:'background:var(--danger);color:var(--on-gold)'}[bmiC]};font-weight:700">${bmiT}</span></p><p class="mut" style="font-size:12px;margin:0">Норма по ВОЗ: 18,5–24,9. При большой мышечной массе ИМТ может быть завышен.</p>`:S.height?'<p class="mut" id="bmihint">Добавь замер с весом — посчитаем ИМТ.</p>':'<p class="mut" id="bmihint">Укажи рост — посчитаем ИМТ.</p>'}</div>
 <button class="pri full" id="badd">+ Новый замер (обхваты, фото)</button><button class="full" id="bguide" style="margin-top:8px">📐 Где и как мерить</button>
 <div class="card"><div class="chips sm2">${BM.map(([k,l])=>`<button class="opt chip ${bM===k?'sel':''}" data-bm="${k}">${l}</button>`).join('')}</div>
 <div class="chips sm2">${[[30,'1 мес'],[90,'3 мес'],[180,'6 мес'],[365,'1 год'],[0,'Всё']].map(([d,l])=>`<button class="opt chip ${bR===d?'sel':''}" data-br="${d}">${l}</button>`).join('')}</div>
 ${pts.length?'<canvas id="bch"></canvas>':'<p class="mut">Нет данных по этому показателю за период.</p>'}
 ${last?`<div class="grid2" style="margin-top:10px"><div><div class="mut">Сейчас</div><b style="font-size:22px">${esc(last[bM])} ${m[2]}</b></div><div><div class="mut">От первого (${fmtD(first.date)})</div><b>${sgn(last[bM]-first[bM],m[2])}</b><br><span class="mut">от прошлого: ${prev?sgn(last[bM]-prev[bM],m[2]):'—'}</span></div></div>`:''}</div>

 ${ph.length>=1?`<h2>Сравнение фото</h2><div class="card"><div class="grid2"><select id="ca">${ph.map(e=>`<option value="${esc(e.id)}" ${e.id===(cmpA||ph[0].id)?'selected':''}>${fmtD(e.date)}</option>`).join('')}</select><select id="cb">${ph.map(e=>`<option value="${esc(e.id)}" ${e.id===(cmpB||ph[ph.length-1].id)?'selected':''}>${fmtD(e.date)}</option>`).join('')}</select></div><div class="photos" style="margin-top:8px"><img id="ia" alt=""><img id="ib" alt=""></div></div>`:''}
 <h2>Замеры (${E.length})</h2>${E.slice().reverse().map(e=>`<div class="card"><div class="row"><b class="grow">${fmtD(e.date)}</b><button class="sm" data-be="${esc(e.id)}">✎</button></div>
 <div>${BM.filter(([k])=>e[k]!==''&&e[k]!=null).map(([k,l,u])=>`<span class="badge">${l}: ${esc(e[k])} ${u}</span>`).join('')}</div>${e.note?`<div class="mut">${esc(e.note)}</div>`:''}${e.photos&&e.photos.length?`<div class="thumbs" data-th="${esc(e.id)}"></div>`:''}</div>`).join('')||'<p class="mut">Добавь первый замер — вес, обхваты и фото, чтобы видеть, как меняется тело.</p>'}`;
 $('#badd').onclick=()=>bodyForm();$('#bguide').onclick=()=>guide();app.querySelectorAll('[data-bm]').forEach(b=>b.onclick=()=>{bM=b.dataset.bm;body()});app.querySelectorAll('[data-br]').forEach(b=>b.onclick=()=>{bR=+b.dataset.br;body()});
 app.querySelectorAll('[data-be]').forEach(b=>b.onclick=()=>bodyForm(S.body.find(e=>e.id===b.dataset.be)));
 $('#hgt').onchange=e=>{S.height=+e.target.value||0;save();body()};$('#wgt').onchange=e=>{bodySetWeight(e.target.value);body()};if(pts.length)chart($('#bch'),pts);
 app.querySelectorAll('[data-th]').forEach(async d=>{const e=S.body.find(x=>x.id===d.dataset.th);for(const k of e.photos){const u=await idb.get(k);if(u){const i=new Image();i.src=u;d.append(i)}}});
 if(ph.length){const show=async()=>{cmpA=$('#ca').value;cmpB=$('#cb').value;for(const[sel,img]of[[cmpA,'#ia'],[cmpB,'#ib']]){const e=S.body.find(x=>x.id===sel);$(img).src=(e&&await idb.get(e.photos[0]))||''}};$('#ca').onchange=show;$('#cb').onchange=show;show()}}
// «Мои данные»: weight typed on the Body screen creates or updates today's measurement; other fields stay as they are.
function bodySetWeight(v){const w=v===''||v==null?'':+v;if(w!==''&&!(w>0))return null;const d=new Date().toISOString().slice(0,10);
 let e=S.body.filter(x=>x.date===d).pop();if(!e){if(w==='')return null;e={id:'b'+Date.now(),date:d,photos:[]};S.body.push(e)}e.weight=w;save();return e}
function bodyForm(e){const isNew=!e;e=e||{id:'b'+Date.now(),date:new Date().toISOString().slice(0,10),photos:[]};const newPh=[],delPh=[];const m=$('#modal');m.classList.remove('hidden');
 m.innerHTML=`<div class="sheet"><div class="row"><h2 class="grow" style="margin:0">${isNew?'Новый замер':'Изменить замер'}</h2><button id="mc">✕</button></div>
 <label class="mut">Дата<input type="date" id="bd" value="${esc(e.date)}"></label><div class="grid2" style="margin-top:8px">${BM.map(([k,l,u])=>`<label><span class="row" style="justify-content:space-between">${l}, ${u}<button type="button" class="gi" data-gi="${k}">ⓘ Где мерить?</button></span><input type="number" inputmode="decimal" step="0.1" data-bf="${k}" value="${esc(e[k]??'')}"></label>`).join('')}</div>
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
 if($('#bdel'))$('#bdel').onclick=async()=>{if(!confirm('Удалить замер вместе с фото?'))return;for(const k of e.photos)await idb.del(k);S.body=S.body.filter(x=>x.id!==e.id);S.deletedBody=(S.deletedBody||[]).concat(e.id);save();m.classList.add('hidden');body()}}
// ---------- Где мерить (иллюстрации — собственные SVG)
const FIG=`<g stroke-width="1.5" stroke-linejoin="round" style="fill:var(--fig);stroke:var(--fig-line)">
<path d="M56 86 Q40 92 38 122 L32 182 Q30 212 33 240 Q38 246 44 241 Q45 212 48 184 L57 132 Z"/><path d="M144 86 Q160 92 162 122 L168 182 Q170 212 167 240 Q162 246 156 241 Q155 212 152 184 L143 132 Z"/>
<path d="M63 246 L99 252 L98 300 Q96 328 95 350 L93 398 L73 400 L72 350 Q67 326 65 300 Z"/><path d="M137 246 L101 252 L102 300 Q104 328 105 350 L107 398 L127 400 L128 350 Q133 326 135 300 Z"/>
<path d="M70 80 Q100 74 130 80 L144 86 Q151 94 146 112 L138 150 Q132 170 131 180 Q137 202 140 224 L139 252 Q100 262 61 252 L60 224 Q63 202 69 180 Q68 170 62 150 L54 112 Q49 94 56 86 Z"/>
<rect x="90" y="58" width="20" height="24" rx="6"/><ellipse cx="100" cy="38" rx="21" ry="26"/></g>
<circle cx="100" cy="190" r="2" style="fill:var(--fig-line)"/>`;
const tape=(cx,cy,rx,lbl)=>`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${Math.max(3,rx/9)}" fill="none" stroke-width="3.5" style="stroke:var(--acc)"/>${lbl?`<circle cx="${cx+rx+12}" cy="${cy}" r="8" style="fill:var(--acc)"/><text x="${cx+rx+12}" y="${cy+4}" font-size="10" font-weight="700" text-anchor="middle" style="fill:var(--on-acc)">${lbl}</text>`:''}`;
const TP={neck:[100,74,12],chest:[100,112,46],waist:[100,168,33],belly:[100,190,33],hips:[100,232,40],thigh:[81,268,17],calf:[83,338,12]};
const svgWrap=(inner,vb='-20 0 240 420')=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" class="gsvg"><rect width="100%" height="100%" style="fill:var(--fig-bg)"/>${inner}</svg>`;
const scaleSvg=pct=>svgWrap(FIG+`<rect x="58" y="398" width="84" height="14" rx="4" stroke-width="2.5" style="fill:var(--card2);stroke:var(--acc)"/><rect x="86" y="401" width="28" height="8" rx="2" style="fill:var(--acc)"/><text x="100" y="408" font-size="7" text-anchor="middle" font-weight="700" style="fill:var(--on-acc)">${pct?'%':'кг'}</text>`,'-20 0 240 420');
const ARM=svgWrap(`<g stroke-width="1.5" stroke-linejoin="round" style="fill:var(--fig);stroke:var(--fig-line)">
<path d="M14 40 Q40 20 70 40 L70 190 L14 190 Z"/>
<path d="M136 64 Q130 30 140 4 L172 2 Q178 40 172 96 Z"/><circle cx="156" cy="-4" r="17"/>
<path d="M40 58 Q100 18 158 54 Q176 66 172 92 Q166 108 146 108 Q100 116 44 112 Z"/><circle cx="44" cy="80" r="30"/></g>
<ellipse cx="102" cy="72" rx="8" ry="38" fill="none" stroke-width="3.5" style="stroke:var(--acc)"/>
<text x="0" y="150" font-size="10" style="fill:var(--fig-txt)">Рука согнута под 90°, бицепс напряжён;</text><text x="0" y="164" font-size="10" style="fill:var(--fig-txt)">лента — в самом широком месте</text>`,'-6 -26 220 200');
const GUIDE={
weight:['Вес','Утром, сразу после туалета, до еды и питья, без одежды (или в одном белье). Всегда на одних и тех же весах, стоящих на ровном твёрдом полу. Вес колеблется день ко дню на 0,5–1,5 кг из-за воды и еды — смотри на тренд за недели, а не на один замер.',()=>scaleSvg()],
fat:['% жира','Измеряй одним и тем же способом и прибором (весы-анализатор, калипер, DEXA) и в одинаковых условиях: утром, натощак, после туалета, до тренировки. Биоимпедансные весы сильно зависят от количества воды в теле — важна динамика, а не точное число.',()=>scaleSvg(1)],
neck:['Шея','Сразу ниже кадыка (гортани), лента перпендикулярно оси шеи (слегка наклонена вперёд-вниз). Смотри прямо, плечи опущены, шею не напрягай.',()=>svgWrap(FIG+tape(...TP.neck))],
chest:['Грудь','Горизонтально на уровне сосков, лента проходит под мышками и по лопаткам. Руки опущены вдоль тела, замер — в конце обычного спокойного выдоха.',()=>svgWrap(FIG+tape(...TP.chest))],
waist:['Талия','Посередине между нижним ребром и верхним краем подвздошной кости (тазовой косточки) — по протоколу ВОЗ. Стоя, ноги вместе, руки расслаблены, живот не втягивай; замер в конце обычного выдоха.',()=>svgWrap(FIG+tape(...TP.waist)+`<line x1="130" y1="152" x2="150" y2="152" stroke-dasharray="3 2" style="stroke:var(--gold)"/><text x="152" y="155" font-size="8" style="fill:var(--gold)">нижнее ребро</text><line x1="133" y1="186" x2="150" y2="186" stroke-dasharray="3 2" style="stroke:var(--gold)"/><text x="152" y="189" font-size="8" style="fill:var(--gold)">край таза</text>`)],
belly:['Живот','Горизонтально на уровне пупка. Стоя, живот расслаблен (не втягивай и не надувай), замер в конце обычного выдоха.',()=>svgWrap(FIG+tape(...TP.belly))],
hips:['Бёдра (таз)','По самой выступающей части ягодиц, лента строго горизонтально. Стопы вместе, ягодицы расслаблены. Удобно мерить перед зеркалом боком.',()=>svgWrap(FIG+tape(...TP.hips))],
biceps:['Бицепс','Правая рука (всегда одна и та же): согни руку под 90° и напряги бицепс; мерь в самом широком месте, лента перпендикулярно плечевой кости. Если хочешь мерить расслабленную руку — тоже можно, но всегда одинаково.',()=>ARM],
thigh:['Бедро','Правая нога (всегда одна и та же): сразу под ягодичной складкой, в самом широком месте бедра. Стой прямо, вес равномерно на обе ноги, мышцы расслаблены.',()=>svgWrap(FIG+tape(...TP.thigh))],
calf:['Икра','Правая нога: в самом широком месте икроножной мышцы. Стоя, вес на обе ноги, икра расслаблена.',()=>svgWrap(FIG+tape(...TP.calf))]};
const OVERVIEW=()=>svgWrap(FIG+Object.entries(TP).map(([k,t],i)=>tape(t[0],t[1],t[2],i+1)).join('')+`<g font-size="9" style="fill:var(--fig-txt)">${Object.keys(TP).map((k,i)=>`<text x="-16" y="${300+i*14}">${i+1} ${GUIDE[k][0]}</text>`).join('')}</g>`);
const TIPS='<b>Общие правила</b><ul style="margin:6px 0;padding-left:18px"><li>Мягкая сантиметровая лента: плотно прилегает к коже, но не сдавливает.</li><li>Лента горизонтальна (параллельно полу), не перекручена.</li><li>Всегда в одно время дня (лучше утром), в расслабленном состоянии, не после тренировки.</li><li>Мерь 2 раза и запиши среднее; если разница больше 1 см — третий замер.</li><li>Одна и та же сторона тела для рук и ног.</li><li>Достаточно раз в неделю или раз в 2 недели.</li></ul>';
const GSRC='<p class="mut" style="font-size:12px">Талия: World Health Organization (2011). Waist circumference and waist–hip ratio: report of a WHO expert consultation, Geneva, 8–11 December 2008. Geneva: WHO.</p>';
function guide(k){let d=$('#gd');if(!d){d=document.createElement('div');d.id='gd';document.body.append(d)}const g=k?GUIDE[k]:null;
 d.className='';d.innerHTML=`<div class="sheet"><div class="row"><h2 class="grow" style="margin:0">${g?'Где мерить: '+g[0]:'Как правильно мерить'}</h2><button id="gdc">✕</button></div>
 <div class="gpic" id="gpic">${g?g[2]():OVERVIEW()}<div class="mut" style="text-align:center;font-size:12px">Нажми на картинку, чтобы увеличить</div></div>
 ${g?`<p>${g[1]}</p>`:''}<div class="card">${TIPS}</div>${!g||k==='waist'?GSRC:''}
 ${g?'':`<div class="chips sm2">${Object.entries(GUIDE).map(([kk,v])=>`<button class="opt chip" data-gk="${kk}">${v[0]}</button>`).join('')}</div>`}</div>`;
 $('#gdc').onclick=()=>d.remove();d.onclick=e=>{if(e.target===d)d.remove()};d.querySelectorAll('[data-gk]').forEach(b=>b.onclick=()=>guide(b.dataset.gk));
 $('#gpic').onclick=()=>{const f=document.createElement('div');f.id='gfull';f.innerHTML=(g?g[2]():OVERVIEW());f.onclick=()=>f.remove();document.body.append(f)}}
// ---------- Проверка файла резервной копии: структура и типы. Бросает исключение, если файл не подходит.
function cleanImport(d){
 const isO=x=>!!x&&typeof x==='object'&&!Array.isArray(x),str=x=>typeof x==='string',idOk=x=>str(x)&&/^[\w.-]{1,60}$/.test(x);
 const num=x=>x===''||x==null?x:(Number.isFinite(+x)?+x:0),arr=x=>Array.isArray(x)?x:[];
 if(!isO(d)||!Array.isArray(d.workouts))throw 0;
 d.custom=arr(d.custom).filter(c=>isO(c)&&idOk(c.id)&&str(c.name)&&str(c.group));
 d.templates=arr(d.templates).filter(x=>isO(x)&&idOk(x.id)&&str(x.name)).map(x=>({id:x.id,name:String(x.name||''),updatedAt:Number.isFinite(+x.updatedAt)?+x.updatedAt:0,
  items:arr(x.items).filter(it=>isO(it)&&idOk(it.exId)).map(it=>{const o={exId:it.exId,sets:+it.sets||1,min:+it.min||0,max:+it.max||0,rest:+it.rest||0};if(it.sec)o.sec=1;return o})})).filter(x=>x.items.length);
 d.deletedTemplates=arr(d.deletedTemplates).filter(idOk);
 d.eqProfiles=arr(d.eqProfiles).filter(x=>isO(x)&&idOk(x.id)&&str(x.name)&&eqNormPlaces(x.places)).map(x=>({id:x.id,name:String(x.name||'').trim(),places:eqNormPlaces(x.places),updatedAt:Number.isFinite(+x.updatedAt)?+x.updatedAt:0,preset:x.preset?1:undefined}));
 d.deletedEqProfiles=arr(d.deletedEqProfiles).filter(idOk);
 if(d.eqActive!=null&&!idOk(d.eqActive))delete d.eqActive;
 if(d.eqActiveAt!=null)d.eqActiveAt=Number.isFinite(+d.eqActiveAt)?+d.eqActiveAt:0;
 d.workouts=d.workouts.filter(w=>isO(w)&&idOk(w.id)&&Number.isFinite(+w.start)&&Array.isArray(w.items)).map(w=>({...w,start:+w.start,end:Number.isFinite(+w.end)?+w.end:+w.start,dayName:String(w.dayName||''),notes:String(w.notes||''),
  items:w.items.filter(it=>isO(it)&&idOk(it.exId)).map(it=>({...it,sets:arr(it.sets).filter(isO).map(s=>({...s,w:num(s.w),r:num(s.r)}))}))}));
 d.body=arr(d.body).filter(e=>isO(e)&&idOk(e.id)&&/^\d{4}-\d{2}-\d{2}$/.test(e.date||'')).map(e=>{const o={...e,note:String(e.note||''),photos:arr(e.photos).filter(idOk)};BM.forEach(([k])=>{if(k in o)o[k]=num(o[k])});return o});
 if(d.program!=null){if(!Array.isArray(d.program)||!d.program.length||!GOALS[d.goal])throw 0;
  d.program=d.program.map(p=>{if(!isO(p)||!Array.isArray(p.items))throw 0;return{...p,name:String(p.name||''),items:p.items.filter(it=>isO(it)&&idOk(it.exId)).map(it=>({...it,sets:+it.sets||1,min:+it.min||0,max:+it.max||0,rest:+it.rest||0}))}});
  if(d.prof==null)d.prof={goal:d.goal,sex:'m',level:'mid',days:+d.days||3,len:60,place:'g',prio:[],lim:[]}}
 else if(d.goal!=null)throw 0;
 if(d.prof!=null){const p=d.prof;if(!isO(p)||!GOALS[p.goal]||!LVN[p.level]||!PLN[p.place])throw 0;
  p.days=+p.days||3;p.len=+p.len||60;p.sex=p.sex==='f'?'f':'m';p.prio=arr(p.prio).filter(g=>str(g)&&g in PRIO_SLOT);p.lim=arr(p.lim).filter(l=>str(l)&&l in LIMN);if(p.acc!=null&&!['none','back','arms','glutes','abs'].includes(p.acc))p.acc='none'}
 if(d.why!=null)d.why=arr(d.why).filter(w=>Array.isArray(w)&&str(w[0])).map(w=>[w[0],arr(w[1]).filter(str)]);
 ['height','weightKg','age','restOverride','next','days'].forEach(k=>{if(d[k]!=null)d[k]=+d[k]||0});
 // QA-04: numbers stay inside the ranges the profile already uses. Out-of-range values become 0 (not imported).
 let clamped=false;
 const rng=(k,lo,hi)=>{if(d[k]!=null&&!(d[k]>=lo&&d[k]<=hi)){d[k]=0;clamped=true}};
 rng('age',14,100);rng('weightKg',30,300);rng('height',100,250);
 if(d.restOverride!=null){const was=d.restOverride;d.restOverride=clampRest(d.restOverride);if(d.restOverride!==was&&!(was>=5&&was<=600&&Math.round(was/5)*5===was))clamped=true}
 if(d.days!=null&&!(d.days>=1&&d.days<=7)){d.days=0;clamped=true}
 if(d.next!=null&&!(d.next>=0&&d.next<400)){d.next=0;clamped=true}
 if(d.progName!=null)d.progName=String(d.progName).slice(0,120);
 if(d.exportedAt!=null){d.exportedAt=+d.exportedAt;if(!Number.isFinite(d.exportedAt)||d.exportedAt<=0)delete d.exportedAt;else if(d.exportedAt>Date.now()+60000)d.exportedAt=Date.now()}
 // Allowlist: a backup may only carry these fields. owner, premium, entitlements, consents and demoStart never come from the file.
 const ALLOW=['v','schema','workouts','deletedWorkouts','body','deletedBody','custom','deletedCustom','templates','deletedTemplates','eqProfiles','deletedEqProfiles','eqActive','eqActiveAt','program','progName','why','prof','goal','days','next','block','progAt','height','weightKg','age','weightAsked','ageAsked','restOverride','sound','wake','autoW','pg','pgSince','equip','dlLast','obDone','obOffer','exportedAt','photos','updatedAt'];
 const out={};ALLOW.forEach(k=>{if(d[k]!==undefined)out[k]=d[k]});
 if(clamped)out._clamped=1;
 return out}
// ---------- Профиль (was «Ещё», D-248)
 async function importBackup(text){let d,hadBody=false,fileDemo=0,clamped=false,raw;
  try{raw=JSON.parse(text);hadBody=!!raw&&Array.isArray(raw.body);if(raw&&typeof raw.demoStart==='number'&&isFinite(raw.demoStart)&&raw.demoStart>0)fileDemo=raw.demoStart;d=cleanImport(raw);clamped=!!d._clamped;delete d._clamped}catch(_){alert('Не удалось прочитать файл');return}
  const prev=S;
  if(prev.active){alert('Сейчас идёт тренировка. Сначала заверши или отмени её — заменить данные во время тренировки нельзя.');return}
  const noProg=d.program==null;
  let q='Заменить текущие данные данными из файла?';if(noProg&&prev.program)q+=' В файле нет программы — текущая программа останется.';
  if(typeof mzSignedIn==='function'&&mzSignedIn())q+=' Данные в облаке тоже будут заменены. Записи, сделанные на других устройствах после этой копии, сохранятся.';
  if(clamped)q+=' Некоторые значения из файла были вне допустимых границ и не перенесены.';
  if(!confirm(q))return;
  const P=d.photos;delete d.photos;delete d._clamped;d.body=d.body||[];d.custom=d.custom||[];
  if(noProg)['program','progName','why','prof','goal','days','next','block','progAt'].forEach(k=>{if(prev[k]!==undefined)d[k]=prev[k]}); // QA-11
  // Device-owned fields. demoStart is the earlier of the two, so a file cannot restart a trial.
  ['ownerUid','ownerPremium','premium','consentHealth','consentAnalytics','healthConsentRevokedAt','healthConsentQueue','installId','azFirstWo','azInstall','azOpen','_azOb','lang'].forEach(k=>{if(prev[k]!==undefined)d[k]=prev[k];else delete d[k]});
  const devDemo=(typeof prev.demoStart==='number'&&isFinite(prev.demoStart)&&prev.demoStart>0)?prev.demoStart:0;
  if(devDemo&&fileDemo)d.demoStart=Math.min(devDemo,fileDemo);else if(devDemo)d.demoStart=devDemo;else if(fileDemo)d.demoStart=fileDemo;
  if(typeof mzSignedIn==='function'&&mzSignedIn()){d.replacePending=Date.now();if(hadBody)d.replaceBody=1} // QA-02
  try{localStorage.setItem('gym',JSON.stringify(d))}catch(_){alert('Не удалось сохранить данные из файла: память устройства заполнена. Текущие данные не изменены.');return} // QA-12
  if(prev.active&&typeof stopTimer==='function'){try{stopTimer()}catch(_){}}
  S=d;
  try{ // QA-08: только используемые фото; ключ и формат проверяются
   const used=new Set();(S.body||[]).forEach(b=>(b.photos||[]).forEach(k=>used.add(k)));
   const okKey=k=>/^[\w.-]{1,60}$/.test(k),okImg=v=>typeof v==='string'&&/^data:image\/(png|jpe?g|webp);base64,/.test(v)&&v.length<4e6;
   if(P)for(const k in P)if(okKey(k)&&used.has(k)&&okImg(P[k]))await idb.put(k,P[k]);
   if(hadBody){const all=await idb.all()||{};for(const k of Object.keys(all))if(!used.has(k))await idb.del(k)}
  }catch(_){}
  save();toast('Данные восстановлены');go('today')}

function libCountText(){const n=(typeof EX!=='undefined'&&EX.length)||0;const n10=n%10,n100=n%100;const w=(n10===1&&n100!==11)?'упражнение':(n10>=2&&n10<=4&&(n100<10||n100>=20))?'упражнения':'упражнений';return n+' '+w+': 3D-анимация, техника, твоя история'}
function more(){$('#title').textContent='Профиль';
 app.innerHTML=`${S.program&&S.program.length?progRowHTML():''}${typeof themeCardHTML==='function'?themeCardHTML():''}
 <div class="card"><b>Звук и экран</b>
 <label class="li"><span class="grow">🔊 Звуковой сигнал таймера</span><input type="checkbox" id="snd" style="width:28px;min-height:28px" ${S.sound!==false?'checked':''}></label>
 <label class="li"><span class="grow">💡 Не гасить экран во время тренировки</span><input type="checkbox" id="wk" style="width:28px;min-height:28px" ${S.wake!==false?'checked':''}></label></div>
 ${typeof ntfCardHTML==='function'?ntfCardHTML():''}
 <div class="card"><b>Тренировка</b><label class="li"><span class="grow">🏋️ Подставлять последний вес</span><input type="checkbox" id="aw" style="width:28px;min-height:28px" ${S.autoW!==false?'checked':''}></label><p class="mut">Вес и повторы подставляются из прошлой тренировки с этим упражнением (серым). Можно изменить; ✓ сохраняет то, что видно.</p></div>
 <div class="card"><b>Таймер отдыха</b><p class="mut">По умолчанию берётся из программы. Можно задать одно значение для всех упражнений:</p>
 <div class="row"><input type="number" id="ro" inputmode="numeric" min="0" max="600" step="5" placeholder="Из программы" value="${esc(S.restOverride||'')}"><span class="mut">сек</span></div></div>
 <div class="card"><b>Резервная копия</b><p class="mut">Данные копируются в облако автоматически. Файл — дополнительная копия на случай, если понадобится.</p>
 <button class="full" id="expcsv">⬇ Экспорт CSV (история тренировок)</button><p class="mut" style="font-size:12px;margin:4px 0 8px">Таблица для Excel/Google Таблиц. Работает без интернета.</p><button class="full" id="exp">⬇ Экспорт (JSON)</button><label class="li"><span class="grow">Включить фото тела в копию (файл будет больше)</span><input type="checkbox" id="expph" style="width:28px;min-height:28px" checked></label><label class="btn full" style="display:flex;align-items:center;justify-content:center;margin-top:8px">⬆ Импорт<input type="file" id="imp" accept=".json,application/json" hidden></label></div>
 <div class="card" id="pfdanger"><button class="danger full" id="reset">Очистить данные на этом телефоне</button></div>
 <div class="card" id="helpc"><b>Справка</b><button class="full card libbig" style="margin-top:8px" id="lib"><span style="font-size:30px">📚</span><span class="grow"><b>Библиотека упражнений</b><br><span class="mut">${libCountText()}</span></span><span class="mut">›</span></button><button class="full" id="sci" style="text-align:left;margin-top:8px">🔬 Научная основа программ</button><button class="full" id="nut" style="text-align:left;margin-top:8px">🥗 Питание под цель</button></div><p class="mut" style="text-align:center;margin:16px 0 8px">Версия ${appVersionLabel()}</p>`;
 if(typeof themeBind==='function')themeBind(app);$('#aw').onchange=e=>{S.autoW=e.target.checked;save()};$('#snd').onchange=e=>{S.sound=e.target.checked;save()};$('#wk').onchange=e=>{S.wake=e.target.checked;save();wake()};if(typeof ntfCardBind==='function')ntfCardBind();
 $('#sci').onclick=()=>go('science');$('#lib').onclick=()=>go('library');if($('#nut'))$('#nut').onclick=()=>go('nutrition');progRowBind();$('#ro').onchange=e=>{S.restOverride=clampRest(e.target.value);e.target.value=S.restOverride||'';save()};
 if($('#expcsv'))$('#expcsv').onclick=()=>{if(typeof exportCsv==='function')exportCsv()};
 $('#exp').onclick=async()=>{const D={...S,exportedAt:Date.now()};delete D.replacePending;delete D.replaceBody;delete D.syncPending;if($('#expph').checked&&S.body.some(e=>e.photos&&e.photos.length))D.photos=await idb.all();const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(D)],{type:'application/json'}));a.download='gymcaptain-'+new Date().toISOString().slice(0,10)+'.json';a.click()};
 $('#imp').onchange=async e=>{const input=e.target;try{await importBackup(await input.files[0].text())}catch(_){alert('Не удалось прочитать файл')}if(input)input.value=''};
 $('#reset').onclick=()=>{const signed=typeof mzSignedIn==='function'&&mzSignedIn();
  if(signed){if(confirm('Ты вошёл в аккаунт: если только очистить, данные сразу снова загрузятся из облака. Очистить данные на этом телефоне и выйти из аккаунта? Аккаунт, копия в облаке и подписка останутся. Удалить всё — «Удалить аккаунт».')&&typeof mzDoLogout==='function')mzDoLogout({wipeLocal:true});return}
  if(confirm('Удалятся данные только на этом устройстве. Аккаунт, копия в облаке и подписка останутся. Чтобы удалить аккаунт и данные в облаке — «Удалить аккаунт».')){Promise.resolve(typeof clearLocalData==='function'?clearLocalData():localStorage.removeItem('gym')).finally(()=>location.reload())}}}
function library(){libView()}
// ---------- Научная основа
const SRC={
v:'Schoenfeld BJ, Ogborn D, Krieger JW (2017). Dose-response relationship between weekly resistance training volume and increases in muscle mass: A systematic review and meta-analysis. Journal of Sports Sciences, 35(11), 1073–1082.',
f:'Schoenfeld BJ, Ogborn D, Krieger JW (2016). Effects of resistance training frequency on measures of muscle hypertrophy: A systematic review and meta-analysis. Sports Medicine, 46(11), 1689–1697.',
l:'Schoenfeld BJ, Grgic J, Ogborn D, Krieger JW (2017). Strength and hypertrophy adaptations between low- vs. high-load resistance training: A systematic review and meta-analysis. Journal of Strength and Conditioning Research, 31(12), 3508–3523.',
r:'Schoenfeld BJ, Pope ZK, Benik FM, et al. (2016). Longer interset rest periods enhance muscle strength and hypertrophy in resistance-trained men. Journal of Strength and Conditioning Research, 30(7), 1805–1812.',
a:'American College of Sports Medicine (2009). Position stand: Progression models in resistance training for healthy adults. Medicine & Science in Sports & Exercise, 41(3), 687–708.',
rv:'Ralston GW, Kilgore L, Wyatt FB, Baker JS (2017). The effect of weekly set volume on strength gain: A meta-analysis. Sports Medicine, 47(12), 2585–2601.',
wu1:'Fradkin AJ, Zazryn TR, Smoliga JM (2010). Effects of warming-up on physical performance: a systematic review with meta-analysis. Journal of Strength and Conditioning Research, 24(1), 140–148.',
wu2:'McCrary JM, Ackermann BJ, Halaki M (2015). A systematic review of the effects of upper body warm-up on performance and injury. British Journal of Sports Medicine, 49(14), 935–942.',
wu3:'Behm DG, Blazevich AJ, Kay AD, McHugh M (2016). Acute effects of muscle stretching on physical performance, range of motion, and injury incidence in healthy active individuals: a systematic review. Applied Physiology, Nutrition, and Metabolism, 41(1), 1–11.',
gf:'Grgic J, Schoenfeld BJ, Davies TB, et al. (2018). Effect of resistance training frequency on gains in muscular strength: A systematic review and meta-analysis. Sports Medicine, 48(5), 1207–1220.',
p:'Morton RW, Murphy KT, McKellar SR, et al. (2018). A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. British Journal of Sports Medicine, 52(6), 376–384.',
d:'Donnelly JE, Blair SN, Jakicic JM, et al. (2009). ACSM Position Stand: Appropriate physical activity intervention strategies for weight loss and prevention of weight regain for adults. Medicine & Science in Sports & Exercise, 41(2), 459–471.',
sx:'Roberts BM, Nuckols G, Krieger JW (2020). Sex differences in resistance training: A systematic review and meta-analysis. Journal of Strength and Conditioning Research, 34(5), 1448–1460.',
w:'Bull FC, Al-Ansari SS, Biddle S, et al. (2020). World Health Organization 2020 guidelines on physical activity and sedentary behaviour. British Journal of Sports Medicine, 54(24), 1451–1462.'};
const SCI={mass:[['Объём','10–20 рабочих подходов на группу мышц в неделю для среднего и опытного уровня (дополнение к ACSM 2009): больше подходов — больше рост. Новичку достаточно ~6–12.',['v']],['Частота','Каждую мышцу тренируем ~2 раза в неделю — это даёт больший рост, чем 1 раз.',['f']],['Повторы и близость к отказу','Мышцы растут в широком диапазоне (≈6–30 повторов), если подход доведён близко к отказу (1–3 повтора в запасе). По ACSM 2009 в базовых: новичку 8–12, среднему 6–12, опытному 6–10; в изолирующих 8–15.',['l']],['Отдых','По ACSM 2009: 1–2 мин при умеренных весах; у опытных в тяжёлых базовых — 2–3 мин (длинный отдых в тяжёлой базе даёт больше прогресса, чем 1 мин).',['a','r']],['Прогрессия (двойная)','Работай в диапазоне повторов; когда верх диапазона выполнен во всех подходах 2 тренировки подряд — увеличь вес (верх тела +2–5 %, низ +5–10 %) и снова начинай с нижней границы. Приложение подсказывает это.',['a']],['Белок','≈1,6 г белка на кг веса тела в день — дальше дополнительной пользы почти нет.',['p']]],
str:[['Интенсивность','По ACSM 2009: новичку — 8–12 повторов (сначала техника), среднему — 6–10 в базовых, опытному — тяжёлые веса, 3–6 повторов. 1–2 повтора приложение не даёт: без страхующего это рискованно.',['a','l']],['Отдых','2–3 мин в базовых у новичка, 3–5 мин между тяжёлыми подходами у опытных (у нас 3 мин по умолчанию, таймер можно продлить); 1–2 мин в изолирующих.',['a','r']],['Объём','Несколько подходов (multi-set) дают больше силы, чем один подход.',['rv']],['Частота','При равном объёме частота не так важна, но 2–3 раза в неделю на движение — удобный способ набрать объём.',['gf']],['Прогрессия','Постепенно повышай нагрузку: верх диапазона во всех подходах 2 тренировки подряд — +2–5 % к весу для верха тела, +5–10 % для низа.',['a']]],
fit:[['Силовые 2–3 раза в неделю','Для здоровья и общей формы: силовые на все крупные группы мышц 2–3 раза в неделю, 8–12 (до 15) повторов, новичкам — 1–3 подхода.',['a']],['Активность','ВОЗ: 150–300 мин умеренной активности в неделю + силовые минимум 2 дня.',['w']],['Мужчины и женщины','В относительных величинах прирост силы и мышц у мужчин и женщин сопоставим — принципы одинаковы.',['sx']],['Прогрессия','Плавно увеличивай нагрузку, когда выполняешь верхнюю границу повторов.',['a']]],
loss:[['Силовые обязательно','Силовые тренировки при дефиците калорий помогают сохранить мышцы; поэтому программа сохраняет базовые упражнения (по уровню 6–12 повторов, отдых 60–90 с).',['d','a']],['Кардио','ВОЗ: 150–300 мин умеренной или 75–150 мин интенсивной активности в неделю; для заметного снижения веса ACSM рекомендует >150 мин, а лучше 225–420 мин в неделю.',['w','d']],['Калории','Главный фактор похудения — дефицит калорий (питание). Одна только активность даёт умеренный эффект.',['d']],['Белок','Достаточно белка (≈1,6 г/кг) помогает удерживать мышечную массу.',['p']]]};
function science(fromOb){$('#title').textContent='Научная основа';const g=S.goal||ob.goal;let cur=window._sg||g;
 const used=[...new Set(SCI[cur].flatMap(x=>x[2]))];
 app.innerHTML=`<div class="tabs">${Object.entries(GOALS).map(([k,t])=>`<button class="sm ${cur===k?'on':''}" data-sg="${k}">${t}</button>`).join('')}</div>
 ${SCI[cur].map(([t,d,s])=>`<div class="card"><h3>${t}</h3><div>${d}</div><div class="mut" style="margin-top:6px">${s.map(k=>'['+(used.indexOf(k)+1)+']').join(' ')}</div></div>`).join('')}
 <h2>Источники</h2><div class="card mut" style="font-size:13px">${used.map((k,i)=>`<p>[${i+1}] ${SRC[k]}</p>`).join('')}</div>
 <p class="mut">Это общие рекомендации для здоровых взрослых, а не медицинская консультация.</p><button class="full" id="back" style="margin-bottom:16px">← Назад</button>`;
 app.querySelectorAll('[data-sg]').forEach(b=>b.onclick=()=>{window._sg=b.dataset.sg;science(fromOb)});
 $('#back').onclick=()=>{window._sg=null;if(!S.goal)onboarding();else go('more')}}
if('serviceWorker'in navigator){const had=!!navigator.serviceWorker.controller;let rl=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(had&&!rl){rl=true;location.reload()}});navigator.serviceWorker.register('sw.js').then(r=>r.update()).catch(()=>{})}
document.addEventListener('DOMContentLoaded',()=>{
 const start=()=>{go('today');
  if(S_BROKEN)setTimeout(()=>alert(S_RO?'Сохранённые данные повреждены и не читаются. Приложение открыто без записи, чтобы их не затереть. Освободи место в браузере и перезапусти.':'Сохранённые данные были повреждены и не прочитались. Их копия сохранена на устройстве (gym_broken). Восстанови данные из резервной копии или войди в аккаунт.'),300)};
 Promise.resolve(typeof histReady!=='undefined'?histReady:null).catch(()=>{}).then(start);
});
// D-207: ask once (after first saved workout or when data already exists). Result is stored in gymPersist; no repeat prompts.
try{requestPersist()}catch(e){}
