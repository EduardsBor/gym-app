'use strict';
// D-214: отдельные упражнения для каждого места (з — зал, г — дом с гантелями, с — свой вес).
// Раньше одно упражнение с роликом тренажёра/штанги было помечено «подходит для з/г/с» (подъём на носки, зашагивания,
// французский жим, быстрая ходьба). Теперь у зала остаётся прежний id (история и планы не меняются),
// а для дома и своего веса — отдельные id с правильными метками мест.
// Роликов MoveKit у новых id пока нет (список роликов ещё согласуют тренер и Claude) — карточка без видео.
[
['calf-db','Подъём на носки на одной ноге с гантелью','Ноги','gd|','Single-leg dumbbell calf raise','Pacelšanās uz pirkstgaliem uz vienas kājas ar hanteli',
['Икроножная, камбаловидная','—','Подъём на носки для дома: одна нога на ступеньке или книге, гантель в руке со стороны рабочей ноги.'],
['Gastrocnemius, soleus','—','A home calf raise: one foot on a step or a thick book, a dumbbell in the hand on the working side.'],
['Ikru muskulis, plekstveida muskulis','—','Ikru pacelšana mājās: viena pēda uz pakāpiena vai biezas grāmatas, hantele rokā darba kājas pusē.'],
[['Встань носком одной ноги на край ступеньки, пятка свисает; гантель в руке с той же стороны, второй рукой держись за стену.','Поднимись на носок как можно выше, пауза 1 с.','Медленно (2–3 с) опусти пятку ниже края ступеньки до растяжения икры.','Колено почти прямое; сделай все повторы и смени ногу.'],['Подпрыгивание и рывки.','Короткая амплитуда: пятка не опускается ниже ступеньки.','Опора всем весом на руку у стены.'],''],
[['Stand with the ball of one foot on the edge of a step, heel hanging; dumbbell in the hand on the same side, the other hand on a wall.','Rise as high as you can onto the toes and pause for 1 s.','Lower the heel slowly (2–3 s) below the step until the calf stretches.','Keep the knee almost straight; finish all reps, then switch legs.'],['Bouncing.','A short range: the heel never drops below the step.','Leaning your whole weight on the wall.'],''],
[['Nostājies ar vienas pēdas priekšdaļu uz pakāpiena malas, papēdis karājas; hantele tās pašas puses rokā, ar otru roku turies pie sienas.','Pacelies uz pirkstgaliem pēc iespējas augstāk, pauze 1 s.','Lēni (2–3 s) nolaid papēdi zem pakāpiena malas, līdz ikri izstiepjas.','Celis gandrīz taisns; izpildi visus atkārtojumus un maini kāju.'],['Lēkāšana un rāvieni.','Īsa amplitūda: papēdis nenolaižas zem pakāpiena.','Viss svars uz rokas pie sienas.'],'']],
['calf-bw','Подъём на носки на одной ноге без веса','Ноги','gdb|','Single-leg bodyweight calf raise','Pacelšanās uz pirkstgaliem uz vienas kājas bez svara',
['Икроножная, камбаловидная','—','Подъём на носки без оборудования: на одной ноге на ступеньке, чтобы веса тела хватало для нагрузки.'],
['Gastrocnemius, soleus','—','A calf raise with no equipment: on one leg on a step, so body weight gives enough load.'],
['Ikru muskulis, plekstveida muskulis','—','Ikru pacelšana bez inventāra: uz vienas kājas uz pakāpiena, lai pietiktu ar ķermeņa svaru.'],
[['Встань носком одной ноги на край ступеньки, пятка свисает; держись рукой за стену или перила для равновесия.','Поднимись на носок как можно выше, пауза 1 с.','Медленно (2–3 с) опусти пятку ниже края ступеньки.','Когда 20+ повторов даются легко — медленнее опускай пятку или добавь паузу внизу.'],['Подпрыгивание и рывки.','Пятка не опускается ниже ступеньки.','Колено сильно сгибается.'],''],
[['Stand with the ball of one foot on the edge of a step, heel hanging; hold a wall or rail for balance.','Rise as high as you can onto the toes and pause for 1 s.','Lower the heel slowly (2–3 s) below the step.','When 20+ reps feel easy, lower more slowly or pause at the bottom.'],['Bouncing.','The heel never drops below the step.','Bending the knee a lot.'],''],
[['Nostājies ar vienas pēdas priekšdaļu uz pakāpiena malas, papēdis karājas; līdzsvaram turies pie sienas vai margām.','Pacelies uz pirkstgaliem pēc iespējas augstāk, pauze 1 s.','Lēni (2–3 s) nolaid papēdi zem pakāpiena malas.','Kad 20+ atkārtojumi ir viegli, nolaid lēnāk vai pauzē apakšā.'],['Lēkāšana un rāvieni.','Papēdis nenolaižas zem pakāpiena.','Celis stipri saliekts.'],'']],
['step-bw','Зашагивания на ступеньку без веса','Ноги','gdb|','Bodyweight step-up','Uzkāpšana uz pakāpiena bez svara',
['Квадрицепсы, ягодичные','Приводящие, икроножные, мышцы корпуса','Зашагивания без гантелей: устойчивая ступенька, скамья или нижняя ступень лестницы.'],
['Quadriceps, glutes','Adductors, calves, core','Step-ups without dumbbells: a stable step, bench or the bottom stair.'],
['Četrgalvu muskuļi, sēžas muskuļi','Pievilcēji, ikri, korpusa muskuļi','Uzkāpšana bez hantelēm: stabils pakāpiens, sols vai kāpņu apakšējais pakāpiens.'],
[['Поставь всю стопу одной ноги на устойчивую ступеньку (высота — до колена).','Перенеси вес на эту ногу и поднимись, оттолкнувшись ею, а не нижней ногой.','Вверху выпрямись, вторую ногу можно приставить.','Медленно опустись той же ногой назад; сделай все повторы и смени ногу.'],['Толчок нижней ногой.','Колено заваливается внутрь.','Шаткая опора (стул на колёсах, мягкий пуф).'],'При ограничении «колени» — низкая ступенька и медленный спуск; при боли не выполнять.'],
[['Place the whole foot of one leg on a stable step (up to knee height).','Shift your weight onto that leg and stand up by driving through it, not the bottom leg.','Stand tall at the top; the other foot may touch down.','Step back down slowly with the same leg; finish all reps, then switch legs.'],['Pushing off the bottom leg.','The knee caving in.','An unstable surface (a chair on wheels, a soft pouf).'],'With a knee limitation use a low step and a slow descent; stop if it hurts.'],
[['Novieto visu vienas kājas pēdu uz stabila pakāpiena (augstums līdz celim).','Pārnes svaru uz šo kāju un piecelies, spiežot ar to, nevis ar apakšējo kāju.','Augšā iztaisnojies, otru kāju var pielikt.','Lēni nokāp ar to pašu kāju; izpildi visus atkārtojumus un maini kāju.'],['Atspēriens ar apakšējo kāju.','Celis krīt uz iekšu.','Nestabils balsts (krēsls ar riteņiem, mīksts pufs).'],'Ar ceļu ierobežojumu — zems pakāpiens un lēna nokāpšana; ja sāp, nedari.']],
['skull-db','Французский жим лёжа с гантелями','Трицепс','gd|p','Dumbbell skullcrusher','Franču spiešana guļus ar hantelēm',
['Трицепс','—','Французский жим для дома: две гантели вместо EZ-грифа, ладони смотрят друг на друга.'],
['Triceps','—','A home skullcrusher: two dumbbells instead of an EZ bar, palms facing each other.'],
['Tricepss','—','Franču spiešana mājās: divas hanteles EZ stieņa vietā, plaukstas vērstas viena pret otru.'],
[['Ляг на скамью, гантели над грудью на прямых руках, ладони друг к другу.','Не двигая плечами, согни локти и медленно опусти гантели к вискам.','Локти смотрят вверх и не разъезжаются в стороны.','Разогни руки до прямых, без рывка.'],['Локти уходят в стороны или к лицу.','Плечи двигаются вместе с предплечьями.','Слишком тяжёлые гантели и удар по голове.'],'При ограничении «плечи» — лёгкий вес; при боли замени на разгибание на блоке или узкие отжимания.'],
[['Lie on a bench, dumbbells over the chest on straight arms, palms facing.','Without moving the upper arms, bend the elbows and slowly lower the dumbbells toward your temples.','Keep the elbows pointing up, not flaring.','Straighten the arms fully, without jerking.'],['Elbows flaring or drifting toward the face.','The upper arms moving with the forearms.','Dumbbells too heavy, risking a hit to the head.'],'With a shoulder limitation go light; if it hurts, switch to pushdowns or close push-ups.'],
[['Apgulies uz sola, hanteles virs krūtīm uz taisnām rokām, plaukstas viena pret otru.','Nekustinot augšdelmus, saliec elkoņus un lēni nolaid hanteles pie deniņiem.','Elkoņi vērsti uz augšu, neizplešas.','Iztaisno rokas līdz galam, bez rāviena.'],['Elkoņi izplešas vai iet uz seju.','Augšdelmi kustas līdzi apakšdelmiem.','Pārāk smagas hanteles un sitiens pa galvu.'],'Ar plecu ierobežojumu — viegls svars; ja sāp, aizvieto ar bloka spiešanu vai šaurajiem atspiedieniem.']],
['walk-brisk','Быстрая ходьба (улица или на месте)','Кардио','gdb|','Brisk walk (outdoors or on the spot)','Ātra iešana (ārā vai uz vietas)',
['Сердце и сосуды, мышцы ног','—','Кардио без тренажёра: быстрая ходьба на улице или энергичная ходьба на месте дома.'],
['Heart and circulation, leg muscles','—','Cardio without a machine: brisk walking outdoors or energetic walking on the spot at home.'],
['Sirds un asinsvadi, kāju muskuļi','—','Kardio bez trenažiera: ātra iešana ārā vai enerģiska iešana uz vietas mājās.'],
[['Иди в темпе, при котором можешь говорить, но не петь.','Шаг с пятки на носок, руки согнуты и работают в такт.','На месте дома: высоко поднимай колени и активно работай руками.','В разминке — лёгкий темп, в кардио-блоке — бодрый.'],['Слишком медленный прогулочный темп.','Сутулая спина, взгляд в пол.'],'При ограничении «колени» — ровная поверхность, без подъёмов в гору.'],
[['Walk at a pace where you can talk but not sing.','Roll from heel to toe, arms bent and swinging in rhythm.','On the spot at home: lift the knees high and drive the arms.','Easy pace in the warm-up, brisk in the cardio block.'],['A slow strolling pace.','A hunched back and eyes on the floor.'],'With a knee limitation walk on flat ground, no hills.'],
[['Ej tādā tempā, lai vari runāt, bet ne dziedāt.','Solis no papēža uz pirkstgaliem, rokas saliektas un kustas ritmā.','Uz vietas mājās: augstu cel ceļus un aktīvi strādā ar rokām.','Iesildīšanā — viegls temps, kardio blokā — možs.'],['Pārāk lēns pastaigas temps.','Saliekta mugura, skats grīdā.'],'Ar ceļu ierobežojumu — līdzena virsma, bez kāpumiem.']]
].forEach(([id,name,group,meta,en,lv,lib,libEn,libLv,tech,techEn,techLv])=>{
  EX.push({id,name,group}); META[id]=meta; LIB[id]=lib; LIB_EN[id]=libEn; LIB_LV[id]=libLv; TECH[id]=tech; TECH_EN[id]=techEn; TECH_LV[id]=techLv; NO_ANIM.add(id); DICT.push([name,en,lv]);
});

// Правильные метки мест у прежних id (ролик показывает тренажёр, дорожку, EZ-гриф, гантели или резинку).
Object.assign(META,{"mk-standing-calf-raise-machine":'g|',"mk-dumbbell-step-up-low":'gd|',"mk-ez-bar-skullcrusher":'g|p',"mk-incline-treadmill-walk":'g|',"mk-band-high-face-pull":'gd|'});

// Прежний id -> id для дома (d) и своего веса (b). Зал (g) всегда остаётся на прежнем id.
const PLACE_VARIANTS={
  "mk-standing-calf-raise-machine":{d:'calf-db',b:'calf-bw'},
  "mk-dumbbell-step-up-low":{b:'step-bw'},
  "mk-ez-bar-skullcrusher":{d:'skull-db'},
  "mk-incline-treadmill-walk":{d:'walk-brisk',b:'walk-brisk'}
};
// Обратная карта: id для места -> прежний id (время подхода, одно движение на день).
const PLACE_BASE={};Object.keys(PLACE_VARIANTS).forEach(b=>Object.values(PLACE_VARIANTS[b]).forEach(v=>{PLACE_BASE[v]=b}));
const placeHas=(id,place)=>{const m=META[id];return !m||m.split('|')[0].includes(place)};
// Вариант упражнения для места; null — если прежний id сам подходит месту или варианта нет.
function placeVariant(id,place){const v=PLACE_VARIANTS[id];if(!v||!place||placeHas(id,place))return null;const x=v[place];return x&&placeHas(x,place)?x:null}

// Автоподбор: вариант для места не берём там, где прежний id сам подходит (иначе в зале одно движение попало бы в день дважды).
function placeAutoOk(id,place){const b=PLACE_BASE[id];return !b||!placeHas(b,place)}

// Замены ⇄ и запасные списки генератора: вариант для места стоит сразу за прежним id.
(function(){
  const vars=id=>{const v=PLACE_VARIANTS[id];return v?[...new Set([v.d,v.b].filter(Boolean))]:[]};
  const after=(list,base)=>{const vs=vars(base),out=[];for(const x of list){if(vs.includes(x))continue;out.push(x);if(x===base)out.push(...vs)}return out};
  if(typeof ALT!=='undefined'){
    for(const base of Object.keys(PLACE_VARIANTS)){
      for(const k of Object.keys(ALT))if(ALT[k].includes(base))ALT[k]=after(ALT[k],base).filter(x=>x!==k);
      const own=ALT[base]||[];
      ALT[base]=[...new Set(vars(base).concat(own))];
      for(const v of vars(base))ALT[v]=[...new Set([base].concat(vars(base),own))].filter(x=>x!==v);
    }
  }
  if(typeof SLOT!=='undefined')for(const k of Object.keys(SLOT))SLOT[k]=SLOT[k].map(list=>{let out=list.slice();for(const base of Object.keys(PLACE_VARIANTS))if(out.includes(base))out=after(out,base);return out});
})();

// Запасной генератор (generateAuto, если нет шаблона тренера): то же правило для вариантов мест.
if(typeof autoOk==='function'){const autoOk0=autoOk;autoOk=function(id,a,acc){return autoOk0(id,a,acc)&&placeAutoOk(id,(a&&a.place)||'g')}}
if(typeof EXTRA_CARDIO!=='undefined'&&Array.isArray(EXTRA_CARDIO)&&!EXTRA_CARDIO.includes('walk-brisk'))EXTRA_CARDIO.push('walk-brisk');

// Сохранённый план пользователя «дом»/«свой вес»: один раз переводим прежние id на вариант для места.
// История тренировок (S.workouts) и начатая тренировка (S.active) не меняются: старые записи остаются под прежним id.
function migratePlaceIds(){
  if(typeof S==='undefined'||!S||(S.placeIds|0)>=1)return false;
  const place=(S.prof&&S.prof.place)||'g';
  const map=id=>placeVariant(id,place)||id;
  const day=d=>{if(!d)return;(d.items||[]).forEach(it=>{if(it&&it.exId)it.exId=map(it.exId)});
    if(d.wu){if(d.wu.cardio&&d.wu.cardio.id)d.wu.cardio.id=map(d.wu.cardio.id);(d.wu.ramp||[]).forEach(r=>{if(r&&r.exId)r.exId=map(r.exId)})}
    if(d.cd&&d.cd.cardio&&d.cd.cardio.id)d.cd.cardio.id=map(d.cd.cardio.id)};
  if(place!=='g'&&Array.isArray(S.program))S.program.forEach(day);
  S.placeIds=1;return true}
if(typeof save==='function'&&migratePlaceIds())save();
