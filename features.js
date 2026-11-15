'use strict';
// ===== Stage 1: onboarding, Free/Premium (demo), language, GDPR =====
// ---- Entitlement (one flag). S.premium = real purchase (future, via store/RevenueCat); S.ownerPremium = owner/dev unlock.
const FREE_EX=new Set(['bp','dbp','pu','sq','gsq','bwsq','lp','rdl','ht','mk-barbell-deadlift','lat','pull','dbr','inv','ohp','lr','bc','mk-cable-bar-pushdown','mk-front-plank','mk-treadmill-run']);
const FREE_CAT=new Set(['c0','c7','c9']);
// P-305: access decisions live in premium.js (isPremium/can). Gate is off until the Android build → all open.
const isPrem=()=>isPremium();
// Переключатель «Режим владельца» виден только тем, у кого он уже включён, или на устройстве разработчика
// (в консоли браузера: localStorage.setItem('gymOwner','1')). Обычный пользователь его не видит.
const ownerUI=()=>{try{return !!S.ownerPremium||localStorage.getItem('gymOwner')==='1'}catch(e){return !!S.ownerPremium}};
const exOk=id=>can('library'); // library and videos are never gated (G-005)
// ---- Migration: never lose access or data. Only adds new fields.
(function(){let ch=false;const has=!!((S.workouts&&S.workouts.length)||(S.body&&S.body.length)||S.program);
 // Владельческий доступ получают только данные, созданные до схемы 4 (до появления Free/Premium).
 // У новых пользователей флаг сразу фиксируется как false, иначе он выдавался бы при втором запуске.
 if(S.ownerPremium===undefined){S.ownerPremium=!!(has&&S.schema!==4);ch=true}
 if(S.obOffer===undefined){S.obOffer=S.goal?1:0;ch=true}
 if(S.schema!==4){S.schema=4;ch=true}if(ch)save()})();

// ---- Paywall (DEMO, no real payments)
function paywall(reason,o){if(!paywallAllowed(o))return false;let d=$('#pw');if(!d){d=document.createElement('div');d.id='pw';document.body.append(d)}d.className='';let plan='y';
 const st=premState(),sub=st.tier==='free'?'Дневник остаётся бесплатным':'14 дней бесплатно, без карты';
 const stx=st.tier==='trial'?(st.pre?'<p class="mut" style="text-align:center">Отсчёт начнётся с первой завершённой тренировки.</p>':`<p class="mut" style="text-align:center"><span>Демо: осталось дней —</span> <b>${st.left}</b></p>`):st.tier==='free'?'<p class="mut" style="text-align:center">Демо закончилось. Дневник тренировок остаётся бесплатным.</p>':'';
 const draw=()=>{d.innerHTML=`<div class="sheet pwsheet"><div class="row"><span class="badge demo">ДЕМО</span><span class="grow"></span><button id="pwc" aria-label="Закрыть">✕</button></div>
 <div style="text-align:center;font-size:44px">👑</div><h2 style="text-align:center;margin:4px 0">${PREM_NAME}</h2>
 <p style="text-align:center;margin:4px 0"><b>${sub}</b></p>${stx}
 ${reason?`<p class="mut" style="text-align:center">${esc(reason)}</p>`:''}
 <ul class="pwlist"><li>Программы тренера по анкете</li><li>Авто-вес, разгрузка и возврат после перерыва</li><li>Видео техники</li><li>Графики, рекорды и 1ПМ</li><li>Объём по мышцам и обхваты тела</li></ul>
 <p class="mut" style="font-size:12px"><b>Всегда бесплатно:</b> свой дневник тренировок, запись подходов, прошлый вес и повторы, вся история, «Боль» и ограничения, синхронизация, экспорт CSV, удаление аккаунта, вес тела, разминка и заминка.</p>
 <button class="plan ${plan==='y'?'sel':''}" data-pl="y"><span class="grow"><b>Год — €29,99</b><br><span class="mut">≈ €2,50/мес</span></span></button>
 <button class="plan ${plan==='m'?'sel':''}" data-pl="m"><span class="grow"><b>Месяц — €4,99</b><br><span class="mut">Отмена в любой момент</span></span></button>
 <button class="pri full" id="pwbuy" style="margin-top:12px">Оформить подписку</button>
 <button class="full" id="pwrest" style="margin-top:8px">Восстановить покупки</button>
 <p class="mut" style="font-size:12px;text-align:center">Оплата пока не подключена, деньги не списываются. ${plan==='y'?'€29,99 в год.':'€4,99 в месяц.'}</p>
 <button class="full" id="pwno" style="margin-bottom:6px">Не сейчас</button></div>`;
  d.querySelectorAll('[data-pl]').forEach(b=>b.onclick=()=>{plan=b.dataset.pl;draw()});
  const close=()=>d.className='hidden';$('#pwc').onclick=close;$('#pwno').onclick=close;
  $('#pwbuy').onclick=()=>toast('Демо: оплата пока не подключена');$('#pwrest').onclick=()=>toast('Демо: покупок не найдено')};draw();return true}
const lockCard=(t,r)=>`<div class="card lock"><div style="font-size:34px">🔒</div><h3>${t}</h3><p class="mut">${r}</p><button class="pri full" data-pw="${esc(r)}">Открыть Premium</button></div>`;
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-pw]');if(b){e.preventDefault();if(paywall(b.dataset.pw)===false)toast('Доступно по подписке. Подробнее — после тренировки.')}});

// ---- Onboarding (first launch; skippable; re-runnable from «Ещё»)
let OB={step:0,goal:'mass',level:'nov',days:3,place:'g',len:60};
const OBS=[['goal','Какая у тебя цель?',[['mass','💪 Масса','Набрать мышцы'],['str','🏋️ Сила','Поднимать больше'],['loss','🔥 Похудение','Снизить жир, сохранить мышцы']]],
 ['level','Какой у тебя опыт?',[['nov','Новичок','Меньше 6 месяцев регулярных тренировок'],['mid','Средний','6 месяцев – 2 года'],['adv','Опытный','Больше 2 лет']]],
 ['days','Сколько тренировок в неделю?',[[2,'2'],[3,'3'],[4,'4'],[5,'5'],[6,'6']]],
 ['place','Где тренируешься?',[['g','🏢 Зал','Тренажёры, штанга, гантели'],['d','🏠 Дом с гантелями','Гантели и скамья'],['b','🤸 Без инвентаря','Свой вес (желательно турник)']]],
 ['len','Сколько времени готов тратить на тренировку?',[[30,'⏱ ~30 мин','Коротко: только базовые упражнения'],[45,'⏱ ~45 мин','База + немного изоляции'],[60,'⏱ ~60 мин','Полноценная тренировка'],[75,'⏱ 75+ мин','Максимум объёма']]]];
// Recommended session length for the chosen frequency: weekly volume (Schoenfeld 2017) ÷ sessions, same duration formula as generate().
function recLen(a){const P=prmOf(a.goal||'mass',a.level),per={nov:10,mid:12,adv:15}[a.level]||12,rest=.6*P.c[3]+.4*P.a[3],sets=per*5/a.days,min=Math.round(WARM+(a.goal==='str'?3:a.goal==='loss'?1:2)+sets*(40+rest)/60);
 const opt=min>=68?75:[30,45,60].reduce((b,o)=>Math.abs(o-min)<Math.abs(b-min)?o:b);return{min,sets:Math.round(sets),opt,per,rest:Math.round(P.c[3]/60*10)/10}}
function recHint(a){const r=recLen(a),o=r.opt>=75?'75+':'~'+r.opt,T={
 ru:`<b>Рекомендация для ${a.days}× в неделю: ${o} мин</b> (расчёт ≈${r.min} мин). Для роста нужно ~${r.per} тяжёлых подходов на мышцу в неделю (ориентир 10–20) [1]. При ${a.days} тренировках это ~${r.sets} подходов за тренировку; ≈40 с работы + отдых ~${r.rest} мин в базовых [2] + 5 мин разминки. Меньше тренировок в неделю — дольше каждая.`,
 en:`<b>Recommended for ${a.days}× per week: ${o} min</b> (calculated ≈${r.min} min). Growth needs ~${r.per} hard sets per muscle per week (target 10–20) [1]. With ${a.days} workouts that is ~${r.sets} sets per session; ≈40 s of work + ~${r.rest} min rest on compound lifts [2] + 5 min warm-up. Fewer sessions per week means longer ones.`,
 lv:`<b>Ieteikums ${a.days}× nedēļā: ${o} min</b> (aprēķins ≈${r.min} min). Augšanai vajag ~${r.per} smagas pieejas uz muskuli nedēļā (mērķis 10–20) [1]. Ar ${a.days} treniņiem tas ir ~${r.sets} pieejas treniņā; ≈40 s darba + ~${r.rest} min atpūta pamatvingrinājumos [2] + 5 min iesildīšanās. Mazāk treniņu nedēļā — katrs ilgāks.`}[LANG];
 return `<div class="card" data-noi18n style="font-size:14px">💡 ${T}<div class="mut" style="font-size:11px;margin-top:6px">[1] ${SRC.v}<br>[2] ${SRC.r}</div></div>`}
function onb(){$('#title').textContent='Добро пожаловать';$('#nav').classList.add('hidden');const[k,q,opts]=OBS[OB.step];const RL=k==='len'?recLen(OB):null;if(RL&&!OB.lenTouched)OB.len=RL.opt;
 app.innerHTML=`<div class="obprog">${OBS.map((_,i)=>`<i class="${i<=OB.step?'on':''}"></i>`).join('')}</div><p class="mut">Шаг ${OB.step+1} из ${OBS.length}</p><h2>${q}</h2>
 ${RL?recHint(OB):''}<div class="${k==='days'?'opts c5':k==='len'?'opts c4':'opts'}">${opts.map(([v,l,s])=>`<button class="opt ${String(OB[k])===String(v)?'sel':''}" data-ob="${v}"><b>${l}${RL&&RL.opt===v?' ★':''}</b>${s?`<br><span class="mut">${s}</span>`:''}</button>`).join('')}</div>
 <button class="pri full" id="obnext" style="margin-top:18px">${OB.step<OBS.length-1?'Далее':'Составить программу'}</button>
 <div class="row" style="margin:8px 0 20px">${OB.step?'<button class="grow" id="obback">← Назад</button>':''}<button class="grow" id="obskip">Пропустить</button></div>
 <p class="mut" style="font-size:12px">Программа строится по научным данным (раздел «Научная основа»). Ответы хранятся только на этом устройстве. Если войдёшь в аккаунт, они синхронизируются с облаком в ЕС.</p>`;
 app.querySelectorAll('[data-ob]').forEach(b=>b.onclick=()=>{OB[k]=(k==='days'||k==='len')?+b.dataset.ob:b.dataset.ob;if(k==='len')OB.lenTouched=1;onb()});
 $('#obnext').onclick=()=>{if(OB.step<OBS.length-1){OB.step++;onb();scrollTo(0,0);return}
  const a={goal:OB.goal,level:OB.level,days:OB.days,len:OB.len,place:OB.place,sex:'m',prio:[],lim:[]};
  preview({name:'Моя программа: '+GOALS[a.goal],desc:`${LVN[a.level]} · ${PLN[a.place]} · ${a.days}× ${a.len>=75?'75+':'~'+a.len} мин`,a},'onb')};
 if($('#obback'))$('#obback').onclick=()=>{OB.step--;onb()};
 $('#obskip').onclick=()=>{S.obDone=1;S.obOffer=2;if(!S.program){const c=CATALOG[0],g=generate(c.a);S.prof=c.a;S.goal=c.a.goal;S.days=c.a.days;S.program=g.days;S.progName=c.name;S.why=g.why;S.next=0;if(typeof eqOnProgramApplied==='function')eqOnProgramApplied(c.a)}save();$('#nav').classList.remove('hidden');go('today')}}
function obStart(){OB={step:0,goal:S.goal&&S.goal!=='fit'?S.goal:'mass',level:(S.prof&&S.prof.level)||'nov',days:S.days||3,place:(typeof eqPrimaryPlace==='function'&&eqPrimaryPlace())||(S.prof&&S.prof.place)||'g',lenTouched:!!(S.prof&&S.prof.len),len:[30,45,60,75].includes(S.prof&&S.prof.len)?S.prof.len:(S.prof&&S.prof.len>75?75:60)};go('onb')}

// ---- Wrap existing views with gating / offers
const _today=today;today=function(sel){_today(sel);if(S.obOffer===1){app.insertAdjacentHTML('afterbegin',`<div class="card offer"><b>✨ Новое: подбор программы за 4 шага</b><p class="mut" style="margin:4px 0 8px">Цель, опыт, частота и место — и готовая программа. Твоя текущая программа и история не изменятся, пока ты сам не выберешь новую.</p><div class="row"><button class="pri grow" id="ofgo">Пройти</button><button class="grow" id="ofno">Не сейчас</button></div></div>`);
 $('#ofgo').onclick=()=>{S.obOffer=2;save();obStart()};$('#ofno').onclick=()=>{S.obOffer=2;save();today(sel)}}};
// ---- Body: explicit health-data consent (GDPR art. 9) before any entry. After the demo: body weight stays free, girths by subscription.
const _body=body;body=function(){$('#title').textContent='Тело';if(!S.consentHealth)return consentView();
 if(!can('girths'))bM='weight';_body();
 if(!can('girths')){app.querySelectorAll('[data-bm]').forEach(b=>{if(b.dataset.bm!=='weight')b.remove()});
  const c=app.querySelector('[data-bm]'),card=c&&c.closest&&c.closest('.card');if(card)card.insertAdjacentHTML('beforeend','<button class="full sm" style="margin-top:8px" data-pw="Обхваты тела и тренды — по подписке">🔒 Обхваты — по подписке</button>')}};
function consentView(){$('#title').textContent='Согласие';app.innerHTML=`<div class="card consent"><div style="font-size:34px">🛡️</div><h2 style="margin-top:4px">Данные о здоровье</h2>
 <p>Вес, обхваты, процент жира, рост и фото тела — это <b>данные о здоровье</b>. По GDPR (ст. 9) их можно обрабатывать только с твоего явного согласия.</p>
 <ul><li>На этом устройстве данные хранятся в браузере.</li><li>Если войдёшь в аккаунт, программа, история и настройки синхронизируются с облаком в ЕС (Supabase). Замеры тела — только при этом согласии. Фото тела остаются на устройстве и в облако не загружаются.</li><li>Используются только чтобы показать твои графики и прогресс.</li><li>Согласие можно отозвать, а данные — экспортировать или удалить в «Ещё».</li><li>Анонимную аналитику можно включить отдельно в «Ещё».</li></ul>
 <label class="li"><input type="checkbox" id="cs" style="width:28px;min-height:28px"><span class="grow">Я даю явное согласие на хранение и обработку моих данных о теле в этом приложении.</span></label>
 <button class="pri full" id="csok" disabled>Согласен — продолжить</button><button class="full" id="cspol" style="margin-top:8px">Политика конфиденциальности</button></div>
 <p class="mut">Без согласия раздел «Тело» не сохраняет никаких данных. Остальные функции работают как обычно.</p>`;
 $('#cs').onchange=e=>$('#csok').disabled=!e.target.checked;$('#csok').onclick=()=>{S.consentHealth={v:1,at:new Date().toISOString()};save();toast('Согласие сохранено');body()};$('#cspol').onclick=()=>legal('privacy','body')}
const _bodyForm=bodyForm;bodyForm=function(e){if(!S.consentHealth)return go('body');_bodyForm(e);if(can('girths'))return;
 // Free: only body weight is entered. Other fields are hidden, not removed, so saved values stay untouched.
 const m=$('#modal');if(!m||!m.querySelectorAll)return;m.querySelectorAll('[data-bf]').forEach(i=>{if(i.dataset.bf!=='weight'){const l=i.closest&&i.closest('label');if(l)l.style.display='none'}});
 const f=m.querySelector('#bfile'),fl=f&&f.closest&&f.closest('label');if(fl){fl.style.display='none';fl.insertAdjacentHTML('afterend','<p class="mut" style="font-size:12px">Обхваты, % жира и фото — по подписке.</p>')}};

// ---- «Ещё»: language, premium, onboarding, privacy & data
const _more=more;more=function(){_more();const r=$('#reset');if(r)r.remove();
 const ver=[...app.querySelectorAll('p.mut')].pop();
 const html=`<div class="card"><b data-noi18n>🌐 Язык / Language / Valoda</b><div class="chips" style="margin-top:8px" data-noi18n>${Object.entries(LANGS).map(([k,l])=>`<button class="opt chip ${LANG===k?'sel':''}" data-lang="${k}">${l}</button>`).join('')}</div>${LANG==='lv'?'<p class="mut" style="font-size:12px">Latviešu tulkojums ir melnraksts — to vēl pārbaudīs dzimtās valodas runātājs.</p>':''}</div>
 <div class="card"><b>👑 Premium</b><p class="mut" style="margin:4px 0">${premStatusText()}</p>
 <button class="full" id="pwopen">Посмотреть Premium</button>
 ${ownerUI()?`<label class="li"><span class="grow">🔑 Режим владельца: всё открыто<br><span class="mut">Для разработчика. Не зависит от оплаты.</span></span><input type="checkbox" id="own" style="width:28px;min-height:28px" ${S.ownerPremium?'checked':''}></label>`:''}</div>
 <div class="card"><b>🤖 ИИ-советы</b> <span class="badge">скоро · Premium</span><p class="mut" style="margin:4px 0 0">Персональные подсказки по прогрессу. Пока не подключено — данные никуда не отправляются.</p></div>
 <button class="full card" id="obre" style="text-align:left">🧭 Пройти подбор программы заново (4 шага)</button>
 <div class="card"><b>Профили оборудования</b><p class="mut" style="margin:4px 0 8px">Зал и дом: переключение на экране «Сегодня». В профиле — доступные места (зал, дом с гантелями, без инвентаря).</p><button class="full" id="eqmore">Настроить профили</button></div>
 <div class="card"><b>🛡️ Конфиденциальность и данные</b>
 <div class="li"><span class="grow">Согласие на данные о теле</span><span class="mut">${S.consentHealth?'дано '+new Date(S.consentHealth.at).toLocaleDateString(LOC):'не дано'}</span></div>
 ${S.consentHealth?'<button class="full sm" id="cwd">Отозвать согласие</button>':''}
 <button class="full" id="exp2" style="margin-top:8px">⬇ Скачать все мои данные (JSON)</button>
 <div class="row" style="margin-top:8px"><button class="grow" id="lpriv">Политика конфиденциальности</button><button class="grow" id="lterms">Условия использования</button></div>
 <button class="danger full" id="wipe" style="margin-top:8px">🗑 Удалить все данные</button></div>`;
 ver.insertAdjacentHTML('beforebegin',html);ver.textContent='Версия '+APP_VERSION;
 app.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{S.lang=b.dataset.lang;save();location.reload()});
 $('#pwopen').onclick=()=>paywall('',{force:1});if($('#own'))$('#own').onchange=e=>{S.ownerPremium=e.target.checked;save();toast(e.target.checked?'Premium открыт (режим владельца)':'Режим владельца выключен');more()};
 $('#obre').onclick=obStart;if($('#eqmore'))$('#eqmore').onclick=()=>eqEditor();$('#exp2').onclick=()=>$('#exp').click();$('#lpriv').onclick=()=>legal('privacy','more');$('#lterms').onclick=()=>legal('terms','more');
 if($('#cwd'))$('#cwd').onclick=()=>{if(!confirm('Отозвать согласие? Новые замеры нельзя будет вводить.'))return;S.consentHealth=null;S.healthConsentRevokedAt=new Date().toISOString();
  if(S.body.length&&confirm('Удалить и уже сохранённые замеры и фото тела?')){S.body.forEach(e=>(e.photos||[]).forEach(k=>idb.del(k)));
   // id удалённых замеров запоминаем: иначе синхронизация вернёт их из старой копии в облаке
   S.deletedBody=(S.deletedBody||[]).concat(S.body.map(e=>e.id));S.body=[];S.height=0}save();more()};
 $('#wipe').onclick=wipeAll};
async function wipeAll(){if(!confirm('Удалить ВСЕ данные: тренировки, программу, замеры, фото и настройки?'))return;
 if(!confirm('Это необратимо. Сначала можно скачать копию. Точно удалить всё без возможности восстановления?'))return;
 try{if(typeof clearLocalData==='function')await clearLocalData();
  else{localStorage.removeItem('gym');await new Promise(r=>{const q=indexedDB.deleteDatabase('moyzal');q.onsuccess=q.onerror=q.onblocked=()=>r()})}}catch(e){}location.reload()}
// ---- Legal pages (drafts)
let LG=null;function legal(k,back){LG={k,back};go('legal')}
function legalView(){const L=(LEGAL[LANG]||LEGAL.ru)[LG.k];$('#title').textContent=L[0];
 app.innerHTML=`<div data-noi18n><div class="card draft">${L[1]}</div>${L[2]}</div><button class="full" id="lgb" style="margin:12px 0 20px">← Назад</button>`;$('#lgb').onclick=()=>go(LG.back||'more')}
// ---- Router additions
const _render=render;render=function(){if(view==='onb')return onb();if(view==='legal')return legalView();if(!S.goal&&!S.obDone&&!['preview','catalog','quiz','science','legal'].includes(view))return onb();_render()};
// ---- Exercise card: 1RM chart is Premium
const _exCard=exCard;exCard=function(id){_exCard(id);if(can('oneRM'))return;document.querySelectorAll('#exc svg.spark').forEach(s=>{const p=s.nextElementSibling;s.outerHTML='<button class="full sm" data-pw="Графики и расчётный 1ПМ — по подписке">🔒 График 1ПМ — по подписке</button>';if(p&&p.tagName==='P')p.remove()})};
// ---- P-305b programs: trainer programs (questionnaire, catalog) are a subscription feature; the questionnaire itself is open.
function premProgLock(){return can('programs')?'':'Программы тренера по анкете — по подписке. Бесплатно: свой дневник тренировок.'}
const _renderPreview=renderPreview;renderPreview=function(){_renderPreview();const r=premProgLock(PV.pr.a,PV.back);if(!r)return;const b=$('#pstart');if(!b||!b.insertAdjacentHTML)return;
 b.insertAdjacentHTML('beforebegin',`<p class="mut">${esc(r)}</p>`);b.textContent='🔒 По подписке';b.onclick=()=>paywall(r)};
function premStatusText(){const d=demoTier(),st=premState(),M={free:'Демо-режим: после демо (бесплатно).',premium:'Демо-режим: подписка.',trial:'Демо-режим: идут 14 дней демо.',trialend:'Демо-режим: до конца демо 2 дня.'};
 if(d)return M[d];if(st.tier==='open')return'Сейчас всё открыто бесплатно.';if(st.tier==='premium')return S.premium?'Подписка активна.':'Открыто в режиме владельца.';
 if(st.tier==='trial')return st.pre?'14 дней бесплатно, без карты — с первой тренировки.':'Демо: осталось дней — '+st.left;return'Демо закончилось. Дневник — бесплатно.'}
// ---- After the demo: the free diary (own workout from the exercise list), last program read-only
// P-307: warm-up/cool-down text and structure are free in every workout, including the diary after the demo.
function diaryWarmCool(items){const P=warmPlan({items:items||[]},S.prof||{});
 const cd={note:'лёгкий темп, пульс снижается',stretch:[{id:'cd_breath',dose:'≈ 60 с'}]};
 return{warm:{P,c:warmItems(P).map(()=>false)},cool:typeof cdRows==='function'?{cd,c:cdRows(cd).map(()=>false)}:null}}
function isDiaryWorkout(A){return!!(A&&(A.dayName==='Своя тренировка'||A.fromTemplate))}
function refreshDiaryWarmCool(A){if(!isDiaryWorkout(A))return;
 const started=(A.warm&&A.warm.c&&A.warm.c.some(Boolean))||(A.cool&&A.cool.c&&A.cool.c.some(Boolean));
 if(started&&A.warm&&A.cool)return;const wc=diaryWarmCool(A.items);A.warm=wc.warm;A.cool=wc.cool}
function premStartFree(){if(S.active)return go('today');const n=(S.program&&S.program.length)||0;
 // dayIdx = the day before the planned one, so finishing keeps S.next where it was
 const wc=diaryWarmCool([]);
 S.active={id:'w'+Date.now(),start:Date.now(),dayIdx:n?((S.next||0)%n+n-1)%n:0,dayName:'Своя тренировка',notes:'',warm:wc.warm,cool:wc.cool,items:[]};save();go('today')}
function premFreeToday(){$('#title').textContent='Сегодня';
 app.innerHTML=`<div class="card"><h2 style="margin-top:0">📓 Мой дневник</h2><p class="mut">Записывай свои тренировки бесплатно: выбери упражнения из списка и вводи подходы — прошлый вес и повторы подставятся сами.</p><button class="pri full" id="fstart">▶ Начать свою тренировку</button></div>
 <div class="card"><b>📋 ${esc(S.progName||'Моя программа')}</b><p class="mut" style="margin:4px 0 8px">Программа тренера, авто-вес и видео техники — по подписке. Разминка и заминка — бесплатно в каждой тренировке. Последнюю программу можно посмотреть в разделе «Программа».</p><button class="full sm" data-pw="Программа тренера по анкете — по подписке">🔒 Подробнее о подписке</button></div>`;
 if(typeof tplMount==='function')tplMount(app);$('#fstart').onclick=premStartFree}
const _pwv=workoutView;workoutView=function(){if(typeof S!=='undefined'&&S&&S.active)refreshDiaryWarmCool(S.active);return _pwv()};
const _ptoday=today;today=function(sel){if(!can('programs')){premFreeToday();if(typeof eqMountToday==='function')eqMountToday(sel);return}_ptoday(sel);if(typeof tplMount==='function')tplMount(app);if(typeof eqMountToday==='function')eqMountToday(sel);
 const st=premState();let hide=false;try{hide=localStorage.getItem('gymSignOffer')==='1'}catch(e){}
 if(st.tier==='trial'&&!premFirstWorkout()&&!hide&&!(typeof mzSignedIn==='function'&&mzSignedIn())&&app.insertAdjacentHTML){
  app.insertAdjacentHTML('afterbegin','<div class="card offer" id="sgoffer"><b>🔐 Войди в аккаунт</b><p class="mut" style="margin:4px 0 8px">14 дней бесплатно, без карты — отсчёт с первой завершённой тренировки. С аккаунтом демо и история сохранятся при переустановке и на другом устройстве. Можно и без входа.</p><div class="row"><button class="pri grow" id="sgin">Войти</button><button class="grow" id="sgno">Не сейчас</button></div></div>');
  $('#sgin').onclick=()=>go('more');$('#sgno').onclick=()=>{try{localStorage.setItem('gymSignOffer','1')}catch(e){}today(sel)}}
 premMoment()};
const _pprogram=program;program=function(){_pprogram();if(can('programs')||!app.querySelectorAll)return;
 app.querySelectorAll('input[data-dn],input[data-e]').forEach(i=>{i.disabled=true});
 app.querySelectorAll('[data-swp],[data-up],[data-dn2],[data-x],[data-ad]').forEach(b=>b.remove());
 if(app.insertAdjacentHTML)app.insertAdjacentHTML('afterbegin','<div class="card"><p class="mut" style="margin:0 0 8px">Только просмотр: программы тренера — по подписке. Свои тренировки записывай бесплатно на вкладке «Сегодня».</p><button class="full sm" data-pw="Программа тренера по анкете — по подписке">🔒 Подробнее о подписке</button></div>')};
const _pvol=volBadges;volBadges=function(){return can('muscleVolume')?_pvol():'<button class="full sm" data-pw="Объём по мышцам — по подписке">🔒 Объём по мышцам — по подписке</button>'};
const _pprogress=progress;progress=function(){if(can('charts')||can('prs')||can('oneRM')||can('muscleVolume'))return _pprogress();$('#title').textContent='Прогресс';
 app.innerHTML=lockCard('Графики и рекорды','Графики, рекорды, 1ПМ и объём по мышцам — по подписке. Вся история тренировок бесплатно — в разделе «История».')};
const _pcel=celebrate;celebrate=function(n,i){if(can('prs'))return _pcel(n,i)};

// ===== P-302: own workout templates (free). IDs only; no custom-exercise creation. Sync via updatedAt / deletedTemplates.
let TE=null;
function tplAll(){return Array.isArray(S.templates)?S.templates:[]}
function tplGet(id){return tplAll().find(t=>t&&t.id===id)||null}
function tplNewId(){return('t'+Date.now().toString(36)+Math.random().toString(36).slice(2,8)).slice(0,20)}
function isSecEx(id){if(typeof isCardio==='function'&&isCardio(id))return false;const n=((typeof exBy==='function'&&exBy(id).name)||'')+' '+id;return/plank|планка/i.test(n)}
function tplDefaults(id){const cardio=typeof isCardio==='function'&&isCardio(id);
 if(cardio)return{exId:id,sets:1,min:10,max:20,rest:0};
 if(isSecEx(id))return{exId:id,sets:3,min:20,max:45,rest:60,sec:1};
 const P=typeof prmOf==='function'&&prmOf(S&&S.goal||'fit',S&&S.prof&&S.prof.level);const p=P&&P.a||[null,8,12,120];
 return{exId:id,sets:3,min:p[1],max:p[2],rest:p[3]}}
function tplNormItem(it){if(!it||!it.exId)return null;const id=String(it.exId);if(!/^[\w.-]{1,60}$/.test(id))return null;
 const cardio=typeof isCardio==='function'&&isCardio(id);const sec=!!it.sec&&!cardio;
 const sets=Math.max(1,Math.min(20,+it.sets||(cardio?1:3)));const min=Math.max(0,+it.min||0);const max=Math.max(min,+it.max||min);const rest=Math.max(0,+it.rest||0);
 const o={exId:id,sets,min,max,rest};if(sec)o.sec=1;return o}
function tplSave(t){if(typeof can==='function'&&!can('templates'))return null;
 const name=String(t&&t.name||'').trim();const items=((t&&t.items)||[]).map(tplNormItem).filter(Boolean);
 if(!name||!items.length)return null;S.templates=S.templates||[];const now=Date.now();let cur=t.id?S.templates.find(x=>x.id===t.id):null;
 if(cur){cur.name=name;cur.items=items;cur.updatedAt=now}else{const id=t.id&&/^[\w.-]{1,60}$/.test(t.id)?t.id:tplNewId();cur={id,name,items,updatedAt:now};S.templates.push(cur)}
 if(typeof save==='function')save();return cur}
function tplDelete(id){if(!id)return;S.templates=(S.templates||[]).filter(t=>t.id!==id);S.deletedTemplates=S.deletedTemplates||[];if(!S.deletedTemplates.includes(id))S.deletedTemplates.push(id);if(typeof save==='function')save()}
function startTemplate(id){if(S.active){go('today');return S.active}if(typeof can==='function'&&!can('templates'))return null;
 const t=tplGet(id);if(!t)return null;const src=(t.items||[]).map(tplNormItem).filter(Boolean);if(!src.length)return null;
 const n=(S.program&&S.program.length)||0;
 const items=src.map(it=>{const cardio=isCardio(it.exId);const l=S.autoW!==false&&typeof lastSets==='function'?lastSets(it.exId):null;const sets=+it.sets||(cardio?1:3);
  return{exId:it.exId,ns:sets,rest:it.rest,min:it.min,max:it.max,sec:it.sec?1:0,sets:Array.from({length:sets},(_,k)=>{const p=l&&(l[k]||l[l.length-1]);return{w:p?p.w:'',r:p?p.r:it.max,pf:!!p,done:false}})}});
 const wc=typeof diaryWarmCool==='function'?diaryWarmCool(items):{warm:null,cool:null};
 S.active={id:'w'+Date.now(),start:Date.now(),dayIdx:n?((S.next||0)%n+n-1)%n:0,dayName:t.name||'Своя тренировка',fromTemplate:t.id,notes:'',warm:wc.warm,cool:wc.cool,items};
 if(typeof save==='function')save();go('today');return S.active}
function tplCountText(t){const n=(t&&t.items&&t.items.length)||0;return n+' упражн.'}
function tplBarHTML(){if(typeof can==='function'&&!can('templates'))return'';
 const L=tplAll().slice().sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
 return`<div class="card" id="tplbox"><div class="row"><b class="grow">Мои шаблоны</b><button class="sm pri" id="tplnew">➕ Новый шаблон</button></div>
 ${L.length?L.map(t=>`<div class="li"><span class="grow"><b>${esc(t.name)}</b><br><span class="mut">${esc(tplCountText(t))}</span></span><button class="pri sm" data-tpls="${esc(t.id)}">▶ Начать</button><button class="sm" data-tple="${esc(t.id)}">Изменить</button><button class="sm" data-tpld="${esc(t.id)}">✕</button></div>`).join(''):'<p class="mut" style="margin:8px 0 0">Собери свою тренировку из библиотеки и сохраняй как шаблон.</p>'}</div>`}
function tplBind(root){root=root||(typeof app!=='undefined'?app:null);if(!root||!root.querySelector)return;
 const n=root.querySelector('#tplnew');if(n)n.onclick=()=>tplOpen();
 root.querySelectorAll('[data-tpls]').forEach(b=>b.onclick=()=>startTemplate(b.dataset.tpls));
 root.querySelectorAll('[data-tple]').forEach(b=>b.onclick=()=>tplOpen(b.dataset.tple));
 root.querySelectorAll('[data-tpld]').forEach(b=>b.onclick=()=>{const t=tplGet(b.dataset.tpld);if(!t)return;if(!confirm('Удалить шаблон «'+t.name+'»?'))return;tplDelete(t.id);if(view==='library')libView();else go('today')})}
function tplMount(root){if(typeof can==='function'&&!can('templates'))return;root=root||(typeof app!=='undefined'?app:null);if(!root||!root.insertAdjacentHTML)return;
 if(root.querySelector&&root.querySelector('#tplbox'))return;const html=tplBarHTML();const first=root.querySelector&&root.querySelector('.card');
 if(first&&first.insertAdjacentHTML)first.insertAdjacentHTML('afterend',html);else root.insertAdjacentHTML('beforeend',html);tplBind(root)}
function tplOpen(id){if(id){const t=tplGet(id);if(!t)return;TE={id:t.id,name:t.name,items:(t.items||[]).map(x=>({...x}))}}else TE={id:'',name:'',items:[]};go('tpl')}
function tplDose(it){const cardio=isCardio(it.exId);return cardio?it.min+'–'+it.max+' мин':it.sec?it.sets+'×'+it.min+'–'+it.max+' с':it.sets+'×'+it.min+'–'+it.max}
function tplView(){if(!TE)return go('library');$('#title').textContent=TE.id?'Шаблон':'Новый шаблон';
 const row=(it,i)=>{const cardio=isCardio(it.exId),sec=!!it.sec&&!cardio;
  const unit=cardio?'мин':(sec?'с':'повт.');
  return`<div class="card"><div class="row"><span class="grow"><b>${esc(exBy(it.exId).name)}</b><br><span class="mut">${esc(exBy(it.exId).group)} · ${esc(tplDose(it))}</span></span><button class="sm" data-tup="${i}">↑</button><button class="sm" data-tdn="${i}">↓</button><button class="sm" data-tx="${i}">✕</button></div>
  <div class="row" style="margin-top:8px;gap:6px;flex-wrap:wrap">
   ${cardio?'':`<label class="mut">Подходы<input type="number" min="1" max="20" value="${esc(it.sets)}" data-tf="${i},sets" style="width:64px"></label>`}
   <label class="mut">${cardio?'Мин.':'От'}<input type="number" min="0" value="${esc(it.min)}" data-tf="${i},min" style="width:64px"></label>
   <label class="mut">${cardio?'Макс.':'До'} <span class="mut">${unit}</span><input type="number" min="0" value="${esc(it.max)}" data-tf="${i},max" style="width:64px"></label>
   ${cardio?'':`<label class="mut">Отдых, с<input type="number" min="0" value="${esc(it.rest)}" data-tf="${i},rest" style="width:72px"></label>`}
  </div></div>`};
 app.innerHTML=`<div class="card"><label class="mut">Название шаблона<input id="tplname" value="${esc(TE.name)}" placeholder="Например: Жим день" autocomplete="off"></label></div>
 ${TE.items.length?TE.items.map(row).join(''):'<p class="mut">Добавь хотя бы одно упражнение</p>'}
 <button class="full" id="tpladd" style="margin-top:8px">+ Упражнение</button>
 <button class="pri full" id="tplsave" style="margin-top:14px">Сохранить шаблон</button>
 <button class="full" id="tplback" style="margin:8px 0 20px">← Назад</button>`;
 $('#tplname').oninput=e=>{TE.name=e.target.value};
 app.querySelectorAll('[data-tf]').forEach(i=>i.onchange=()=>{const[idx,f]=i.dataset.tf.split(',');const it=TE.items[+idx];if(!it)return;it[f]=+i.value||0;if(f==='min'&&it.max<it.min)it.max=it.min;if(f==='max'&&it.max<it.min)it.min=it.max;tplView()});
 const mv=(i,d)=>{const j=i+d;if(j<0||j>=TE.items.length)return;[TE.items[i],TE.items[j]]=[TE.items[j],TE.items[i]];tplView()};
 app.querySelectorAll('[data-tup]').forEach(b=>b.onclick=()=>mv(+b.dataset.tup,-1));
 app.querySelectorAll('[data-tdn]').forEach(b=>b.onclick=()=>mv(+b.dataset.tdn,1));
 app.querySelectorAll('[data-tx]').forEach(b=>b.onclick=()=>{TE.items.splice(+b.dataset.tx,1);tplView()});
 $('#tpladd').onclick=()=>pickEx(id=>{TE.items.push(tplDefaults(id));tplView()});
 $('#tplback').onclick=()=>{TE=null;go('library')};
 $('#tplsave').onclick=()=>{const name=String(TE.name||'').trim();if(!name){toast('Введи название шаблона');return}if(!TE.items.length){toast('Добавь хотя бы одно упражнение');return}
  const saved=tplSave({id:TE.id,name,items:TE.items});if(!saved){toast('Не удалось сохранить шаблон');return}TE=null;toast('Шаблон сохранён');go('library')}}

// ===== P-304: equipment profiles (gym / home). Free (FEATURES.equipProfile). Presets from META places g/d/b.
const EQ_PRESETS=[{id:'gym',name:'Зал',places:'g'},{id:'home',name:'Дом',places:'d'},{id:'body',name:'Без инвентаря',places:'b'}];
const EQ_CUSTOM_MAX=1;
function eqIsPreset(id){return EQ_PRESETS.some(p=>p.id===id)}
function eqEnsure(){if(typeof S==='undefined'||!S)return;
 S.eqProfiles=Array.isArray(S.eqProfiles)?S.eqProfiles:[];S.deletedEqProfiles=Array.isArray(S.deletedEqProfiles)?S.deletedEqProfiles:[];
 S.eqProfiles=S.eqProfiles.filter(p=>p&&typeof p==='object'&&/^[\w.-]{1,60}$/.test(p.id||'')&&eqNormPlaces(p.places)&&String(p.name||'').trim())
  .map(p=>({id:p.id,name:String(p.name).trim().slice(0,60),places:eqNormPlaces(p.places),updatedAt:+p.updatedAt||0,preset:eqIsPreset(p.id)||p.preset?1:undefined}));
 const have=new Set(S.eqProfiles.map(p=>p.id));
 EQ_PRESETS.forEach(pr=>{if(!have.has(pr.id))S.eqProfiles.push({id:pr.id,name:pr.name,places:pr.places,updatedAt:0,preset:1})});
 S.deletedEqProfiles=(S.deletedEqProfiles||[]).filter(id=>/^[\w.-]{1,60}$/.test(id)&&!eqIsPreset(id));
 if(!S.eqActive||!S.eqProfiles.some(p=>p.id===S.eqActive)){const place=(S.prof&&S.prof.place)||'g';const pr=EQ_PRESETS.find(p=>p.places===place)||EQ_PRESETS[0];S.eqActive=pr.id;if(!S.eqActiveAt)S.eqActiveAt=0}}
function eqAll(){eqEnsure();const order=id=>{const i=EQ_PRESETS.findIndex(p=>p.id===id);return i<0?100+id:i};return S.eqProfiles.slice().sort((a,b)=>order(a.id)-order(b.id))}
function eqGet(id){return eqAll().find(p=>p.id===id)||null}
function eqActiveId(){eqEnsure();return S.eqActive}
function eqActive(){return eqGet(eqActiveId())||EQ_PRESETS[0]}
function eqPlaces(){return eqNormPlaces((eqActive()||{}).places)||'g'}
function eqPrimaryPlace(){return (eqPlaces()||'g')[0]}
function eqCanAdd(){return eqAll().filter(p=>!eqIsPreset(p.id)).length<EQ_CUSTOM_MAX}
function eqNewId(){return('eq'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)).slice(0,20)}
function eqSetActive(id,opts){eqEnsure();if(!eqGet(id))return null;S.eqActive=id;S.eqActiveAt=Date.now();if(typeof LQ!=='undefined')LQ._eqAuto=undefined;if(!(opts&&opts.silent)&&typeof save==='function')save();return id}
function eqOnProgramApplied(a){eqEnsure();const place=a&&a.place;const pr=EQ_PRESETS.find(p=>p.places===place);if(pr)eqSetActive(pr.id,{silent:true})}
function eqSave(t){if(typeof can==='function'&&!can('equipProfile'))return null;eqEnsure();
 const name=String(t&&t.name||'').trim().slice(0,60),places=eqNormPlaces(t&&t.places);if(!name||!places)return null;
 const now=Date.now();let cur=t.id?S.eqProfiles.find(p=>p.id===t.id):null;
 if(cur){cur.name=name;cur.places=places;cur.updatedAt=now}else{if(!eqCanAdd())return null;const id=(t.id&&/^[\w.-]{1,60}$/.test(t.id)&&!eqIsPreset(t.id))?t.id:eqNewId();cur={id,name,places,updatedAt:now};S.eqProfiles.push(cur)}
 if(typeof save==='function')save();return cur}
function eqDelete(id){eqEnsure();if(!id||eqIsPreset(id))return false;S.eqProfiles=S.eqProfiles.filter(p=>p.id!==id);S.deletedEqProfiles=S.deletedEqProfiles||[];if(!S.deletedEqProfiles.includes(id))S.deletedEqProfiles.push(id);
 if(S.eqActive===id)eqSetActive((eqAll()[0]||EQ_PRESETS[0]).id,{silent:true});if(typeof save==='function')save();return true}
function eqSameMuscle(a,b){const ea=typeof exBy==='function'?exBy(a):null,eb=typeof exBy==='function'?exBy(b):null;if(ea&&eb&&ea.group&&eb.group)return ea.group===eb.group;return false}
function eqSwapFor(id,places,used){places=eqNormPlaces(places||eqPlaces());used=used||new Set();if(eqAvail(id,places))return id;
 if(typeof PLACE_VARIANTS!=='undefined'&&PLACE_VARIANTS[id]){for(const p of places){const v=PLACE_VARIANTS[id][p];if(v&&eqAvail(v,places)&&!used.has(v)&&eqSameMuscle(id,v))return v}}
 const cands=typeof altCands==='function'?altCands(id).map(e=>e.id):(((typeof ALT!=='undefined'&&ALT[id])||[]));
 for(const x of cands){if(x&&eqAvail(x,places)&&!used.has(x)&&eqSameMuscle(id,x))return x}return id}
function eqAdaptItems(items,places){places=eqNormPlaces(places||eqPlaces());const used=new Set();return(items||[]).map(it=>{if(!it||!it.exId)return it;const id=eqSwapFor(it.exId,places,used);used.add(id);return id===it.exId?it:Object.assign({},it,{exId:id})})}
function eqAdaptDay(d,places){if(!d)return d;return Object.assign({},d,{items:eqAdaptItems(d.items,places)})}
function eqAdaptMisses(items,places){places=eqNormPlaces(places||eqPlaces());return(items||[]).filter(it=>it&&it.exId&&!eqAvail(it.exId,places)&&eqSwapFor(it.exId,places,new Set())===it.exId).map(it=>it.exId)}
function eqMountToday(sel){eqEnsure();if(!app||!app.insertAdjacentHTML)return;if(typeof document!=='undefined'&&document.getElementById&&document.getElementById('eqbar'))return;
 const mid=!!(S&&S.active);const chips=eqAll().map(p=>`<button type="button" class="opt chip ${eqActiveId()===p.id?'sel':''}" data-eqsw="${p.id}" ${mid?'disabled':''}>${esc(p.name)}</button>`).join('');
 const html=`<div class="card" id="eqbar"><div class="row"><span class="grow"><b>Профиль оборудования</b></span><button type="button" class="sm" id="eqedit">Изменить</button></div><div class="chips sm2" style="margin-top:8px">${chips}</div>${mid?'<p class="mut" style="margin:6px 0 0">Профиль нельзя сменить во время тренировки.</p>':''}</div>`;
 app.insertAdjacentHTML('afterbegin',html);
 app.querySelectorAll('[data-eqsw]').forEach(b=>b.onclick=()=>{if(S.active||b.dataset.eqsw===eqActiveId())return;eqSetActive(b.dataset.eqsw);if(typeof today==='function')today(sel)});
 const ed=$('#eqedit');if(ed)ed.onclick=()=>eqEditor()}
function eqEditor(){eqEnsure();const m=$('#modal');if(!m)return;m.classList.remove('hidden');
 const placeBox=(cur)=>[...'gdb'].map(k=>{const lab=(typeof EQN!=='undefined'&&EQN[k])||k;return`<label class="li"><span class="grow">${esc(lab)}</span><input type="checkbox" data-eqpl="${k}" ${String((cur&&cur.places)||'').includes(k)?'checked':''} style="width:28px;min-height:28px"></label>`}).join('');
 const row=p=>`<div class="card" data-eqid="${p.id}" style="margin-top:8px"><label class="mut">Название профиля<input data-eqname value="${esc(p.name)}" maxlength="60" autocomplete="off"></label>${placeBox(p)}<div class="row" style="margin-top:8px"><button type="button" class="pri grow" data-eqsave="${p.id}">Сохранить профиль</button>${eqIsPreset(p.id)?'':'<button type="button" class="danger" data-eqdel="'+p.id+'">Удалить профиль</button>'}</div></div>`;
 m.innerHTML=`<div class="sheet"><div class="row"><h2 class="grow" style="margin:0">Профили оборудования</h2><button type="button" id="mc">✕</button></div><p class="mut">Каждый профиль — набор мест, которые реально есть в карточках: зал, дом с гантелями, без инвентаря. Активный профиль переключается на экране «Сегодня».</p>${eqAll().map(row).join('')}${eqCanAdd()?'<button type="button" class="full" id="eqadd" style="margin-top:10px">➕ Новый профиль</button>':'<p class="mut">Уже есть дополнительный профиль.</p>'}<button type="button" class="full" id="eqdone" style="margin:10px 0 0">Закрыть</button></div>`;
 const close=()=>m.classList.add('hidden');$('#mc').onclick=close;$('#eqdone').onclick=close;
 const boxOf=id=>{const el=m.querySelector(`[data-eqid="${id}"]`);return{name:el.querySelector('[data-eqname]').value,places:[...el.querySelectorAll('[data-eqpl]:checked')].map(x=>x.dataset.eqpl).join('')}};
 m.querySelectorAll('[data-eqsave]').forEach(b=>b.onclick=()=>{const v=boxOf(b.dataset.eqsave);if(!String(v.name||'').trim()){toast('Введи название профиля');return}if(!eqNormPlaces(v.places)){toast('Выбери хотя бы одно место');return}if(!eqSave({id:b.dataset.eqsave,name:v.name,places:v.places})){toast('Не удалось сохранить профиль');return}toast('Профиль сохранён');eqEditor()});
 m.querySelectorAll('[data-eqdel]').forEach(b=>b.onclick=()=>{if(!confirm('Удалить профиль?'))return;if(!eqDelete(b.dataset.eqdel)){toast('Нельзя удалить встроенный профиль');return}toast('Профиль удалён');eqEditor()});
 const add=$('#eqadd');if(add)add.onclick=()=>{const saved=eqSave({name:'Мой профиль',places:'d'});if(!saved){toast('Уже есть дополнительный профиль');return}toast('Профиль сохранён');eqEditor()}}
const _eqStartW=startW;startW=function(i){_eqStartW(i);if(!S.active||S.active.fromTemplate||S.active.dayName==='Своя тренировка')return;
 const src=(S.program&&S.program[i]&&S.program[i].items)||[];const adapted=eqAdaptItems(src);
 S.active.items=adapted.map(it=>{const l=S.autoW!==false?lastSets(it.exId,S.active.id):null;return{exId:it.exId,ns:it.sets,rest:it.rest,min:it.min,max:it.max,sec:it.sec?1:0,sets:Array.from({length:it.sets},(_,k)=>{const p=l&&(l[k]||l[l.length-1]);return{w:p?p.w:'',r:p?p.r:it.max,pf:!!p,done:false}})}});
 S.active.eqProfile=eqActiveId();if(typeof save==='function')save()};
const _eqSwap=swapModal;swapModal=function(cur,a,cb){_eqSwap(cur,a&&a.places?a:Object.assign({},a||S.prof||{},{places:eqPlaces(),place:eqPrimaryPlace()}),cb)};
const _eqQuiz=quiz;quiz=function(){const p=typeof eqPrimaryPlace==='function'&&eqPrimaryPlace();if(p&&!Q){Q={goal:'mass',sex:'m',level:'mid',days:3,len:60,place:p,prio:[],lim:[],...(S.prof||{}),place:p}}_eqQuiz()};
eqEnsure();
