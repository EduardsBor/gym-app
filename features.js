'use strict';
// ===== Stage 1: onboarding, Free/Premium (demo), language, GDPR =====
// ---- Entitlement (one flag). S.premium = real purchase (future, via store/RevenueCat); S.ownerPremium = owner/dev unlock.
const FREE_EX=new Set(['bp','dbp','pu','sq','gsq','bwsq','lp','rdl','ht','dl','lat','pull','dbr','inv','ohp','lr','bc','tpd','pl','tm']);
const FREE_CAT=new Set(['c0','c7','c9']);
const isPrem=()=>!!(S.premium||S.ownerPremium);
const exOk=id=>isPrem()||FREE_EX.has(id)||String(id).startsWith('c_')||String(id).startsWith('w_');
// ---- Migration: never lose access or data. Only adds new fields.
(function(){let ch=false;const has=!!((S.workouts&&S.workouts.length)||(S.body&&S.body.length)||S.program);
 if(S.ownerPremium===undefined&&has){S.ownerPremium=true;ch=true}
 if(S.obOffer===undefined){S.obOffer=S.goal?1:0;ch=true}
 if(S.schema!==4){S.schema=4;ch=true}if(ch)save()})();

// ---- Paywall (DEMO, no real payments)
function paywall(reason){let d=$('#pw');if(!d){d=document.createElement('div');d.id='pw';document.body.append(d)}d.className='';let plan='y';
 const draw=()=>{d.innerHTML=`<div class="sheet pwsheet"><div class="row"><span class="badge demo">ДЕМО</span><span class="grow"></span><button id="pwc" aria-label="Закрыть">✕</button></div>
 <div style="text-align:center;font-size:44px">👑</div><h2 style="text-align:center;margin:4px 0">Мой Зал Premium</h2>
 ${reason?`<p class="mut" style="text-align:center">${esc(reason)}</p>`:''}
 <ul class="pwlist"><li>Все программы по целям</li><li>Полная библиотека: 68 упражнений с 3D-видео</li><li>Графики прогресса и расчётный 1ПМ</li><li>Замеры тела, фото и ИМТ</li><li>ИИ-советы (скоро)</li></ul>
 <button class="plan ${plan==='y'?'sel':''}" data-pl="y"><span class="grow"><b>Год — €29,99</b><br><span class="mut">≈ €2,50 в месяц · 7 дней бесплатно</span></span><span class="badge pr">−50%</span></button>
 <button class="plan ${plan==='m'?'sel':''}" data-pl="m"><span class="grow"><b>Месяц — €4,99</b><br><span class="mut">Отмена в любой момент</span></span></button>
 <button class="pri full" id="pwbuy" style="margin-top:12px">${plan==='y'?'Попробовать 7 дней бесплатно':'Оформить подписку'}</button>
 <button class="full" id="pwrest" style="margin-top:8px">Восстановить покупки</button>
 <p class="mut" style="font-size:12px;text-align:center">Демо-экран: оплата не подключена, деньги не списываются. ${plan==='y'?'После пробного периода — €29,99 в год.':''}</p>
 <button class="full" id="pwno" style="margin-bottom:6px">Не сейчас</button></div>`;
  d.querySelectorAll('[data-pl]').forEach(b=>b.onclick=()=>{plan=b.dataset.pl;draw()});
  const close=()=>d.className='hidden';$('#pwc').onclick=close;$('#pwno').onclick=close;
  $('#pwbuy').onclick=()=>toast('Демо: оплата пока не подключена');$('#pwrest').onclick=()=>toast('Демо: покупок не найдено')};draw()}
const lockCard=(t,r)=>`<div class="card lock"><div style="font-size:34px">🔒</div><h3>${t}</h3><p class="mut">${r}</p><button class="pri full" data-pw="${esc(r)}">Открыть Premium</button></div>`;
document.addEventListener('click',e=>{const b=e.target.closest('[data-pw]');if(b){e.preventDefault();paywall(b.dataset.pw)}});

// ---- Onboarding (first launch; skippable; re-runnable from «Ещё»)
let OB={step:0,goal:'mass',level:'nov',days:3,place:'g',len:60};
const OBS=[['goal','Какая у тебя цель?',[['mass','💪 Масса','Набрать мышцы'],['str','🏋️ Сила','Поднимать больше'],['loss','🔥 Похудение','Снизить жир, сохранить мышцы']]],
 ['level','Какой у тебя опыт?',[['nov','Новичок','Меньше 6 месяцев регулярных тренировок'],['mid','Средний','6 месяцев – 2 года'],['adv','Опытный','Больше 2 лет']]],
 ['days','Сколько тренировок в неделю?',[[2,'2'],[3,'3'],[4,'4'],[5,'5'],[6,'6']]],
 ['place','Где тренируешься?',[['g','🏢 Зал','Тренажёры, штанга, гантели'],['d','🏠 Дом с гантелями','Гантели и скамья'],['b','🤸 Без инвентаря','Свой вес (желательно турник)']]],
 ['len','Сколько времени готов тратить на тренировку?',[[30,'⏱ ~30 мин','Коротко: только базовые упражнения'],[45,'⏱ ~45 мин','База + немного изоляции'],[60,'⏱ ~60 мин','Полноценная тренировка'],[75,'⏱ 75+ мин','Максимум объёма']]]];
// Recommended session length for the chosen frequency: weekly volume (Schoenfeld 2017) ÷ sessions, same duration formula as generate().
function recLen(a){const P=PRM[a.goal]||PRM.mass,per={nov:10,mid:12,adv:15}[a.level]||12,rest=.6*P.c[3]+.4*P.a[3],sets=per*5/a.days,min=Math.round(WARM+(a.goal==='str'?3:a.goal==='loss'?1:2)+sets*(40+rest)/60);
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
 $('#obskip').onclick=()=>{S.obDone=1;S.obOffer=2;if(!S.program){const c=CATALOG[0],g=generate(c.a);S.prof=c.a;S.goal=c.a.goal;S.days=c.a.days;S.program=g.days;S.progName=c.name;S.why=g.why;S.next=0}save();$('#nav').classList.remove('hidden');go('today')}}
function obStart(){OB={step:0,goal:S.goal&&S.goal!=='fit'?S.goal:'mass',level:(S.prof&&S.prof.level)||'nov',days:S.days||3,place:(S.prof&&S.prof.place)||'g',lenTouched:!!(S.prof&&S.prof.len),len:[30,45,60,75].includes(S.prof&&S.prof.len)?S.prof.len:(S.prof&&S.prof.len>75?75:60)};go('onb')}

// ---- Wrap existing views with gating / offers
const _today=today;today=function(sel){_today(sel);if(S.obOffer===1){app.insertAdjacentHTML('afterbegin',`<div class="card offer"><b>✨ Новое: подбор программы за 4 шага</b><p class="mut" style="margin:4px 0 8px">Цель, опыт, частота и место — и готовая программа. Твоя текущая программа и история не изменятся, пока ты сам не выберешь новую.</p><div class="row"><button class="pri grow" id="ofgo">Пройти</button><button class="grow" id="ofno">Не сейчас</button></div></div>`);
 $('#ofgo').onclick=()=>{S.obOffer=2;save();obStart()};$('#ofno').onclick=()=>{S.obOffer=2;save();today(sel)}}};
const _progress=progress;progress=function(){if(isPrem())return _progress();$('#title').textContent='Прогресс';app.innerHTML=lockCard('Графики и рекорды — в Premium','Графики веса, объёма и расчётного 1ПМ по каждому упражнению')+'<p class="mut">История тренировок остаётся бесплатной — раздел «История».</p>'};
const _catalog=catalog;catalog=function(){_catalog();if(isPrem())return;app.querySelectorAll('[data-c]').forEach(b=>{if(FREE_CAT.has(b.dataset.c))return;b.textContent='🔒 Premium';b.classList.remove('pri');b.onclick=()=>paywall('Все программы по целям доступны в Premium');const h=b.closest('.card').querySelector('h3');if(h)h.insertAdjacentText('afterbegin','🔒 ')})};
const _quiz=quiz;quiz=function(){_quiz();if(isPrem())return;app.querySelectorAll('.chip[data-k="prio"],.chip[data-k="lim"],.chip[data-k="len"]').forEach(b=>{if(b.dataset.k==='len'&&b.dataset.v==='60')return;b.classList.add('locked');b.onclick=()=>paywall('Приоритетные мышцы, ограничения и длительность — в Premium')})};
// ---- Body: Premium + explicit health-data consent (GDPR art. 9) before any entry
const _body=body;body=function(){$('#title').textContent='Тело';if(!isPrem()){app.innerHTML=lockCard('Замеры тела — в Premium','Вес, обхваты, % жира, фото и ИМТ с графиками');return}
 if(!S.consentHealth)return consentView();_body()};
function consentView(){$('#title').textContent='Согласие';app.innerHTML=`<div class="card consent"><div style="font-size:34px">🛡️</div><h2 style="margin-top:4px">Данные о здоровье</h2>
 <p>Вес, обхваты, процент жира, рост и фото тела — это <b>данные о здоровье</b>. По GDPR (ст. 9) их можно обрабатывать только с твоего явного согласия.</p>
 <ul><li>На этом устройстве данные хранятся в браузере.</li><li>Если войдёшь в аккаунт, программа, история и настройки синхронизируются с облаком в ЕС (Supabase). Замеры тела — только при этом согласии. Фото тела остаются на устройстве и в облако не загружаются.</li><li>Используются только чтобы показать твои графики и прогресс.</li><li>Согласие можно отозвать, а данные — экспортировать или удалить в «Ещё».</li><li>Анонимную аналитику можно включить отдельно в «Ещё».</li></ul>
 <label class="li"><input type="checkbox" id="cs" style="width:28px;min-height:28px"><span class="grow">Я даю явное согласие на хранение и обработку моих данных о теле в этом приложении.</span></label>
 <button class="pri full" id="csok" disabled>Согласен — продолжить</button><button class="full" id="cspol" style="margin-top:8px">Политика конфиденциальности</button></div>
 <p class="mut">Без согласия раздел «Тело» не сохраняет никаких данных. Остальные функции работают как обычно.</p>`;
 $('#cs').onchange=e=>$('#csok').disabled=!e.target.checked;$('#csok').onclick=()=>{S.consentHealth={v:1,at:new Date().toISOString()};save();toast('Согласие сохранено');body()};$('#cspol').onclick=()=>legal('privacy','body')}
const _bodyForm=bodyForm;bodyForm=function(e){if(!S.consentHealth)return go('body');_bodyForm(e)};
// ---- Technique sheet: 3D video only for unlocked exercises
const _techModal=techModal;techModal=function(id){_techModal(id);if(exOk(id)||window._wf)return;const m=document.getElementById('tech'),v=m&&m.querySelector('video.a3d');if(v){v.pause();v.removeAttribute('src');v.load();v.outerHTML=`<div class="vlock" data-pw="3D-видео всех 68 упражнений доступны в Premium"><img src="anim3d/${id}.jpg" alt=""><span>🔒 3D-видео — Premium</span></div>`}};

// ---- «Ещё»: language, premium, onboarding, privacy & data
const _more=more;more=function(){_more();const r=$('#reset');if(r)r.remove();
 const ver=[...app.querySelectorAll('p.mut')].pop();
 const html=`<div class="card"><b data-noi18n>🌐 Язык / Language / Valoda</b><div class="chips" style="margin-top:8px" data-noi18n>${Object.entries(LANGS).map(([k,l])=>`<button class="opt chip ${LANG===k?'sel':''}" data-lang="${k}">${l}</button>`).join('')}</div>${LANG==='lv'?'<p class="mut" style="font-size:12px">Latviešu tulkojums ir melnraksts — to vēl pārbaudīs dzimtās valodas runātājs.</p>':''}</div>
 <div class="card"><b>👑 Premium</b><p class="mut" style="margin:4px 0">${isPrem()?(S.premium?'Подписка активна.':'Открыто в режиме владельца.'):'Сейчас бесплатная версия.'}</p>
 <button class="full" id="pwopen">Посмотреть Premium (демо)</button>
 <label class="li"><span class="grow">🔑 Режим владельца: всё открыто<br><span class="mut">Для разработчика. Не зависит от оплаты.</span></span><input type="checkbox" id="own" style="width:28px;min-height:28px" ${S.ownerPremium?'checked':''}></label></div>
 <div class="card"><b>🤖 ИИ-советы</b> <span class="badge">скоро · Premium</span><p class="mut" style="margin:4px 0 0">Персональные подсказки по прогрессу. Пока не подключено — данные никуда не отправляются.</p></div>
 <button class="full card" id="obre" style="text-align:left">🧭 Пройти подбор программы заново (4 шага)</button>
 <div class="card"><b>🛡️ Конфиденциальность и данные</b>
 <div class="li"><span class="grow">Согласие на данные о теле</span><span class="mut">${S.consentHealth?'дано '+new Date(S.consentHealth.at).toLocaleDateString(LOC):'не дано'}</span></div>
 ${S.consentHealth?'<button class="full sm" id="cwd">Отозвать согласие</button>':''}
 <button class="full" id="exp2" style="margin-top:8px">⬇ Скачать все мои данные (JSON)</button>
 <div class="row" style="margin-top:8px"><button class="grow" id="lpriv">Политика конфиденциальности</button><button class="grow" id="lterms">Условия использования</button></div>
 <button class="danger full" id="wipe" style="margin-top:8px">🗑 Удалить все данные</button></div>`;
 ver.insertAdjacentHTML('beforebegin',html);ver.textContent='Версия 28';
 app.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{S.lang=b.dataset.lang;save();location.reload()});
 $('#pwopen').onclick=()=>paywall('');$('#own').onchange=e=>{S.ownerPremium=e.target.checked;save();toast(e.target.checked?'Premium открыт (режим владельца)':'Режим владельца выключен');more()};
 $('#obre').onclick=obStart;$('#exp2').onclick=()=>$('#exp').click();$('#lpriv').onclick=()=>legal('privacy','more');$('#lterms').onclick=()=>legal('terms','more');
 if($('#cwd'))$('#cwd').onclick=()=>{if(!confirm('Отозвать согласие? Новые замеры нельзя будет вводить.'))return;S.consentHealth=null;
  if(S.body.length&&confirm('Удалить и уже сохранённые замеры и фото тела?')){S.body.forEach(e=>(e.photos||[]).forEach(k=>idb.del(k)));S.body=[];S.height=0}save();more()};
 $('#wipe').onclick=wipeAll};
async function wipeAll(){if(!confirm('Удалить ВСЕ данные: тренировки, программу, замеры, фото и настройки?'))return;
 if(!confirm('Это необратимо. Сначала можно скачать копию. Точно удалить всё без возможности восстановления?'))return;
 try{localStorage.removeItem('gym');await new Promise(r=>{const q=indexedDB.deleteDatabase('moyzal');q.onsuccess=q.onerror=q.onblocked=()=>r()})}catch(e){}location.reload()}
// ---- Legal pages (drafts)
let LG=null;function legal(k,back){LG={k,back};go('legal')}
function legalView(){const L=(LEGAL[LANG]||LEGAL.ru)[LG.k];$('#title').textContent=L[0];
 app.innerHTML=`<div data-noi18n><div class="card draft">${L[1]}</div>${L[2]}</div><button class="full" id="lgb" style="margin:12px 0 20px">← Назад</button>`;$('#lgb').onclick=()=>go(LG.back||'more')}
// ---- Router additions
const _render=render;render=function(){if(view==='onb')return onb();if(view==='legal')return legalView();if(!S.goal&&!S.obDone&&!['preview','catalog','quiz','science','legal'].includes(view))return onb();_render()};
// ---- Exercise card: 1RM chart is Premium
const _exCard=exCard;exCard=function(id){_exCard(id);if(isPrem())return;document.querySelectorAll('#exc svg.spark').forEach(s=>{const p=s.nextElementSibling;s.outerHTML='<button class="full sm" data-pw="Графики и расчётный 1ПМ — в Premium">🔒 График 1ПМ — Premium</button>';if(p&&p.tagName==='P')p.remove()})};
