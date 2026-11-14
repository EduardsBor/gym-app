'use strict';
// D-214: отдельные упражнения для каждого места (з — зал, г — дом с гантелями, с — свой вес).
// Раньше одно упражнение с роликом тренажёра/штанги было помечено «подходит для з/г/с» (подъём на носки, зашагивания,
// французский жим, быстрая ходьба). Теперь у зала остаётся прежний id (история и планы не меняются),
// а для дома и своего веса — отдельные id с правильными метками мест.
// v1.2c (14.11.2026): ролики MoveKit для новых id — в movekit.js (только имена файлов). Новые карточки программ v1.2c тоже здесь.
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
['step-bw','Спуск со ступеньки на одной ноге','Ноги','gdb|','Single-leg step-down','Nokāpšana no pakāpiena uz vienas kājas',
['Квадрицепсы, ягодичные','Средняя ягодичная, икроножные, мышцы корпуса','Упражнение на одну ногу без оборудования: медленный спуск со ступеньки, колено смотрит по линии стопы.'],
['Quadriceps, glutes','Gluteus medius, calves, core','A single-leg exercise with no equipment: a slow step-down from a step, the knee tracking over the foot.'],
['Četrgalvu muskuļi, sēžas muskuļi','Vidējais sēžas muskulis, ikri, korpusa muskuļi','Vingrinājums uz vienas kājas bez inventāra: lēna nokāpšana no pakāpiena, celis virs pēdas līnijas.'],
[['Встань одной ногой на устойчивую ступеньку или нижнюю ступень лестницы, вторая нога свисает сбоку.','Медленно (2–3 с) согни опорную ногу и опусти свободную пятку к полу.','Коснись пола пяткой, не перенося на неё вес, колено опорной ноги смотрит вперёд по линии стопы.','Выпрямись опорной ногой; сделай все повторы и смени ногу.'],['Колено заваливается внутрь.','Падение вниз вместо медленного спуска.','Толчок от пола свободной ногой.'],'При ограничении «колени» — низкая ступенька и неполная амплитуда; при боли не выполнять.'],
[['Stand with one foot on a stable step or the bottom stair, the other leg hanging to the side.','Slowly (2–3 s) bend the standing leg and lower the free heel toward the floor.','Tap the floor with the heel without putting weight on it; the standing knee tracks forward over the foot.','Stand up on the working leg; finish all reps, then switch legs.'],['The knee caving in.','Dropping down instead of lowering slowly.','Pushing off the floor with the free leg.'],'With a knee limitation use a low step and a partial range; stop if it hurts.'],
[['Nostājies ar vienu kāju uz stabila pakāpiena vai kāpņu apakšējā pakāpiena, otra kāja karājas sānis.','Lēni (2–3 s) saliec atbalsta kāju un nolaid brīvās kājas papēdi pret grīdu.','Pieskaries grīdai ar papēdi, nepārnesot uz to svaru; atbalsta kājas celis vērsts uz priekšu pēdas virzienā.','Iztaisnojies ar darba kāju; izpildi visus atkārtojumus un maini kāju.'],['Celis krīt uz iekšu.','Krišana lejup lēnas nolaišanās vietā.','Atspēriens no grīdas ar brīvo kāju.'],'Ar ceļu ierobežojumu — zems pakāpiens un nepilna amplitūda; ja sāp, nedari.']],
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
[['Ej tādā tempā, lai vari runāt, bet ne dziedāt.','Solis no papēža uz pirkstgaliem, rokas saliektas un kustas ritmā.','Uz vietas mājās: augstu cel ceļus un aktīvi strādā ar rokām.','Iesildīšanā — viegls temps, kardio blokā — možs.'],['Pārāk lēns pastaigas temps.','Saliekta mugura, skats grīdā.'],'Ar ceļu ierobežojumu — līdzena virsma, bez kāpumiem.']],
['ht-db','Ягодичный мост с гантелью','Ноги','gd|','Dumbbell glute bridge','Sēžas tilts ar hanteli',
['Ягодичные','Задняя поверхность бедра, мышцы корпуса','Ягодичный мост на полу для дома: гантель лежит на тазу.'],
['Glutes','Hamstrings, core','A floor glute bridge for home: a dumbbell rests on the hips.'],
['Sēžas muskuļi','Augšstilba aizmugure, korpusa muskuļi','Sēžas tilts uz grīdas mājās: hantele uz gurniem.'],
[['Ляг на спину, колени согнуты, стопы на ширине таза; гантель положи поперёк таза и придерживай руками.','Напряги пресс и ягодицы, подними таз до прямой линии от колен до плеч.','Пауза 1–2 с вверху, поясница не прогибается.','Медленно опусти таз почти до пола и повтори.'],['Прогиб в пояснице вверху.','Толчок носками вместо пяток.','Колени разъезжаются или сводятся.'],''],
[['Lie on your back, knees bent, feet hip-width apart; place a dumbbell across the hips and hold it with both hands.','Brace the abs and squeeze the glutes, lift the hips to a straight line from knees to shoulders.','Pause for 1–2 s at the top without arching the lower back.','Lower the hips slowly almost to the floor and repeat.'],['Arching the lower back at the top.','Pushing through the toes instead of the heels.','Knees falling out or caving in.'],''],
[['Apgulies uz muguras, ceļi saliekti, pēdas gurnu platumā; novieto hanteli šķērsām uz gurniem un pieturi ar rokām.','Sasprindzini vēderu un sēžas muskuļus, pacel gurnus līdz taisnai līnijai no ceļiem līdz pleciem.','Pauze 1–2 s augšā, mugura neizliecas.','Lēni nolaid gurnus gandrīz līdz grīdai un atkārto.'],['Muguras lejasdaļas izliekums augšā.','Spiešana ar pirkstgaliem papēžu vietā.','Ceļi izplešas vai saiet kopā.'],'']],
['ht-bw','Ягодичный мост на полу','Ноги','gdb|','Bodyweight glute bridge','Sēžas tilts uz grīdas',
['Ягодичные','Задняя поверхность бедра, мышцы корпуса','Ягодичный мост без оборудования: медленный темп и пауза вверху вместо веса.'],
['Glutes','Hamstrings, core','A glute bridge with no equipment: a slow tempo and a pause at the top instead of weight.'],
['Sēžas muskuļi','Augšstilba aizmugure, korpusa muskuļi','Sēžas tilts bez inventāra: lēns temps un pauze augšā svara vietā.'],
[['Ляг на спину, колени согнуты, стопы на ширине таза, руки вдоль тела.','Напряги пресс и ягодицы, подними таз до прямой линии от колен до плеч.','Пауза 2 с вверху, поясница не прогибается.','Медленно (2–3 с) опусти таз; когда 20 повторов легко — переходи на мост на одной ноге.'],['Прогиб в пояснице вверху.','Толчок носками вместо пяток.','Быстрые повторы без паузы.'],''],
[['Lie on your back, knees bent, feet hip-width apart, arms by your sides.','Brace the abs and squeeze the glutes, lift the hips to a straight line from knees to shoulders.','Pause for 2 s at the top without arching the lower back.','Lower slowly (2–3 s); when 20 reps are easy, move on to the single-leg bridge.'],['Arching the lower back at the top.','Pushing through the toes instead of the heels.','Fast reps with no pause.'],''],
[['Apgulies uz muguras, ceļi saliekti, pēdas gurnu platumā, rokas gar ķermeni.','Sasprindzini vēderu un sēžas muskuļus, pacel gurnus līdz taisnai līnijai no ceļiem līdz pleciem.','Pauze 2 s augšā, mugura neizliecas.','Lēni (2–3 s) nolaid gurnus; kad 20 atkārtojumi ir viegli, pārej uz tiltu uz vienas kājas.'],['Muguras lejasdaļas izliekums augšā.','Spiešana ar pirkstgaliem papēžu vietā.','Ātri atkārtojumi bez pauzes.'],'']],
['rdl-db','Румынская тяга с гантелями (упор на носок)','Ноги','gd|s','Kickstand dumbbell Romanian deadlift','Rumāņu vilkme ar hantelēm (atbalsts uz pirkstgala)',
['Задняя поверхность бедра, ягодичные','Разгибатели спины, хват','Румынская тяга с акцентом на одну ногу: задняя нога стоит на носке и только помогает равновесию.'],
['Hamstrings, glutes','Spinal erectors, grip','A Romanian deadlift biased to one leg: the back foot rests on its toes and only helps balance.'],
['Augšstilba aizmugure, sēžas muskuļi','Muguras iztaisnotāji, tvēriens','Rumāņu vilkme ar akcentu uz vienu kāju: aizmugurējā kāja balstās uz pirkstgala un tikai palīdz līdzsvaram.'],
[['Гантели в руках у бёдер; одну ногу отставь на полшага назад и поставь на носок — основной вес на передней ноге.','Колено передней ноги слегка согнуто; отводя таз назад, наклоняйся с прямой спиной, гантели скользят вдоль ноги.','Опускайся до сильного растяжения задней поверхности бедра (обычно чуть ниже колена).','Вернись, двигая таз вперёд; сделай все повторы и смени ногу.'],['Круглая спина.','Вес уходит на заднюю ногу.','Приседание вместо наклона: колено сильно сгибается.'],'При ограничении «спина» — с осторожностью: лёгкий вес и короткая амплитуда; при боли не выполнять.'],
[['Dumbbells at your thighs; step one foot half a step back onto its toes, most of the weight on the front leg.','Front knee slightly bent; push the hips back and hinge with a flat back, the dumbbells sliding down the leg.','Lower until the hamstring stretches hard (usually just below the knee).','Drive the hips forward to stand up; finish all reps, then switch legs.'],['A rounded back.','Shifting the weight onto the back leg.','Squatting instead of hinging: bending the knee a lot.'],'With a back limitation be careful: light weight and a short range; stop if it hurts.'],
[['Hanteles rokās pie augšstilbiem; vienu kāju atliec pussoli atpakaļ uz pirkstgala — galvenais svars uz priekšējās kājas.','Priekšējās kājas celis nedaudz saliekts; atbīdot gurnus atpakaļ, noliecies ar taisnu muguru, hanteles slīd gar kāju.','Nolaidies līdz spēcīgam augšstilba aizmugures stiepumam (parasti nedaudz zem ceļa).','Atgriezies, virzot gurnus uz priekšu; izpildi visus atkārtojumus un maini kāju.'],['Apaļa mugura.','Svars pāriet uz aizmugurējo kāju.','Pietupiens noliekšanās vietā: celis stipri saliecas.'],'Ar muguras ierobežojumu — uzmanīgi: viegls svars un īsa amplitūda; ja sāp, nedari.']],
['rdl-band','Румынская тяга с резинкой','Ноги','gd|s','Band Romanian deadlift','Rumāņu vilkme ar gumiju',
['Задняя поверхность бедра, ягодичные','Разгибатели спины','Румынская тяга для дома и для новичков: резинка под стопами даёт нагрузку вверху движения.'],
['Hamstrings, glutes','Spinal erectors','A Romanian deadlift for home and beginners: a band under the feet loads the top of the movement.'],
['Augšstilba aizmugure, sēžas muskuļi','Muguras iztaisnotāji','Rumāņu vilkme mājām un iesācējiem: gumija zem pēdām dod slodzi kustības augšā.'],
[['Встань на середину резинки, стопы на ширине таза, концы резинки в руках.','Колени слегка согнуты; отводя таз назад, наклоняйся с прямой спиной, руки опускаются вдоль ног.','Опускайся до растяжения задней поверхности бедра, спина остаётся прямой.','Вернись в стойку, двигая таз вперёд и сжимая ягодицы.'],['Круглая спина.','Тяга руками вместо движения тазом.','Резинка соскальзывает из-под стоп.'],'При ограничении «спина» — с осторожностью: лёгкая резинка и короткая амплитуда; при боли не выполнять.'],
[['Stand on the middle of the band, feet hip-width apart, the band ends in your hands.','Knees slightly bent; push the hips back and hinge with a flat back, hands sliding down the legs.','Lower until the hamstrings stretch while the back stays flat.','Stand up by driving the hips forward and squeezing the glutes.'],['A rounded back.','Pulling with the arms instead of moving the hips.','The band slipping out from under the feet.'],'With a back limitation be careful: a light band and a short range; stop if it hurts.'],
[['Nostājies uz gumijas vidus, pēdas gurnu platumā, gumijas gali rokās.','Ceļi nedaudz saliekti; atbīdot gurnus atpakaļ, noliecies ar taisnu muguru, rokas slīd gar kājām.','Nolaidies līdz augšstilba aizmugures stiepumam, mugura paliek taisna.','Atgriezies stāvus, virzot gurnus uz priekšu un saspiežot sēžas muskuļus.'],['Apaļa mugura.','Vilkšana ar rokām gurnu kustības vietā.','Gumija izslīd no pēdu apakšas.'],'Ar muguras ierobežojumu — uzmanīgi: viegla gumija un īsa amplitūda; ja sāp, nedari.']],
['rdl-kb','Румынская тяга с гирей','Ноги','g|s','Kettlebell Romanian deadlift','Rumāņu vilkme ar svaru bumbu',
['Задняя поверхность бедра, ягодичные','Разгибатели спины, хват','Румынская тяга для новичков в зале: одна гиря двумя руками, легко держать спину прямой.'],
['Hamstrings, glutes','Spinal erectors, grip','A Romanian deadlift for gym beginners: one kettlebell in both hands makes a flat back easy.'],
['Augšstilba aizmugure, sēžas muskuļi','Muguras iztaisnotāji, tvēriens','Rumāņu vilkme iesācējiem zālē: viena svaru bumba abās rokās, viegli noturēt taisnu muguru.'],
[['Встань прямо, стопы на ширине таза, гиря двумя руками за ручку перед бёдрами.','Колени слегка согнуты; отводя таз назад, наклоняйся с прямой спиной, гиря идёт вдоль ног.','Опускайся до растяжения задней поверхности бедра, гиря примерно на уровне голени.','Вернись в стойку, двигая таз вперёд и сжимая ягодицы.'],['Круглая спина.','Приседание вместо наклона.','Гиря уходит далеко от ног.'],'При ограничении «спина» — с осторожностью: лёгкая гиря и короткая амплитуда; при боли не выполнять.'],
[['Stand tall, feet hip-width apart, holding one kettlebell by the handle with both hands in front of the thighs.','Knees slightly bent; push the hips back and hinge with a flat back, the kettlebell travelling down the legs.','Lower until the hamstrings stretch, the kettlebell at about shin level.','Stand up by driving the hips forward and squeezing the glutes.'],['A rounded back.','Squatting instead of hinging.','The kettlebell drifting away from the legs.'],'With a back limitation be careful: a light kettlebell and a short range; stop if it hurts.'],
[['Nostājies taisni, pēdas gurnu platumā, svaru bumba abās rokās aiz roktura augšstilbu priekšā.','Ceļi nedaudz saliekti; atbīdot gurnus atpakaļ, noliecies ar taisnu muguru, bumba slīd gar kājām.','Nolaidies līdz augšstilba aizmugures stiepumam, bumba aptuveni apakšstilba līmenī.','Atgriezies stāvus, virzot gurnus uz priekšu un saspiežot sēžas muskuļus.'],['Apaļa mugura.','Pietupiens noliekšanās vietā.','Bumba attālinās no kājām.'],'Ar muguras ierobežojumu — uzmanīgi: viegla bumba un īsa amplitūda; ja sāp, nedari.']],
['band-pulldown','Тяга резинки сверху на коленях (резинка закреплена на двери вверху)','Спина','gd|','Kneeling band pulldown (band anchored at the top of a door)','Gumijas vilkšana no augšas uz ceļiem (gumija piestiprināta durvju augšā)',
['Широчайшие','Бицепс, задние дельты, ромбовидные','Вертикальная тяга для дома без турника: резинка закреплена вверху двери.'],
['Lats','Biceps, rear delts, rhomboids','A vertical pull for home without a pull-up bar: the band is anchored at the top of a door.'],
['Platie muguras muskuļi','Bicepss, aizmugurējie deltveida, rombveida muskuļi','Vertikāla vilkšana mājās bez stieņa: gumija piestiprināta durvju augšā.'],
[['Закрепи резинку вверху закрытой двери (дверной анкер), встань на колени лицом к двери и возьмись за концы прямыми руками.','Опусти плечи и сведи лопатки вниз.','Тяни локти вниз к бокам, пока кисти не окажутся у плеч или груди.','Медленно вернись, руки почти прямые; 8–15 повторов.'],['Плечи поднимаются к ушам.','Рывки корпусом назад.','Резинка закреплена ненадёжно (дверь открывается к тебе).'],''],
[['Anchor the band at the top of a closed door (door anchor), kneel facing the door and hold the ends with straight arms.','Set the shoulders down and draw the shoulder blades down.','Pull the elbows down to your sides until the hands reach the shoulders or chest.','Return slowly to almost straight arms; 8–15 reps.'],['Shoulders shrugging up to the ears.','Jerking the torso back.','A loose anchor (the door opens toward you).'],''],
[['Piestiprini gumiju aizvērtu durvju augšā (durvju enkurs), nometies ceļos ar seju pret durvīm un satver galus ar taisnām rokām.','Nolaid plecus un savelc lāpstiņas uz leju.','Velc elkoņus lejup gar sāniem, līdz plaukstas ir pie pleciem vai krūtīm.','Lēni atgriezies, rokas gandrīz taisnas; 8–15 atkārtojumi.'],['Pleci paceļas pie ausīm.','Ķermeņa rāvieni atpakaļ.','Gumija piestiprināta nedroši (durvis veras uz tevi).'],'']],
['reverse-lunge-db','Выпады назад с гантелями','Ноги','gd|k','Dumbbell reverse lunge','Izklupieni atpakaļ ar hantelēm',
['Квадрицепсы, ягодичные','Приводящие, задняя поверхность бедра, мышцы корпуса','Выпады назад мягче для коленей, чем вперёд; гантели в опущенных руках.'],
['Quadriceps, glutes','Adductors, hamstrings, core','Reverse lunges are easier on the knees than forward lunges; dumbbells held at your sides.'],
['Četrgalvu muskuļi, sēžas muskuļi','Pievilcēji, augšstilba aizmugure, korpusa muskuļi','Izklupieni atpakaļ ir saudzīgāki ceļiem nekā uz priekšu; hanteles nolaistās rokās.'],
[['Встань прямо, гантели в опущенных руках.','Сделай широкий шаг назад и опусти заднее колено почти до пола.','Переднее колено над стопой, корпус прямой.','Оттолкнись передней ногой и вернись в стойку; чередуй ноги или сделай все повторы на одну.'],['Короткий шаг: колено уходит далеко за носок.','Корпус заваливается вперёд.','Удар коленом о пол.'],'При ограничении «колени» — без гантелей и с короткой амплитудой; при боли не выполнять.'],
[['Stand tall with dumbbells at your sides.','Take a long step back and lower the back knee almost to the floor.','Front knee over the foot, torso upright.','Push through the front leg back to standing; alternate legs or do all reps on one side.'],['A short step that pushes the knee far past the toes.','The torso tipping forward.','Banging the knee on the floor.'],'With a knee limitation go without dumbbells and with a short range; stop if it hurts.'],
[['Nostājies taisni, hanteles nolaistās rokās.','Sper platu soli atpakaļ un nolaid aizmugurējo celi gandrīz līdz grīdai.','Priekšējais celis virs pēdas, ķermenis taisns.','Atsperies ar priekšējo kāju un atgriezies stāvus; maini kājas vai izpildi visus atkārtojumus uz vienas.'],['Īss solis: celis aiziet tālu aiz pirkstgaliem.','Ķermenis krīt uz priekšu.','Sitiens ar celi pret grīdu.'],'Ar ceļu ierobežojumu — bez hantelēm un ar īsu amplitūdu; ja sāp, nedari.']],
['scap-pullup','Подтягивания лопатками (рабочие подходы)','Спина','gb|','Scapular pull-ups (working sets)','Lāpstiņu pievilkšanās (darba pieejas)',
['Нижние трапециевидные, широчайшие','Ромбовидные, хват','Подготовка к подтягиваниям: в висе на турнике двигаются только лопатки, 6–10 повторов.'],
['Lower traps, lats','Rhomboids, grip','A step toward pull-ups: hanging from the bar, only the shoulder blades move; 6–10 reps.'],
['Apakšējie trapecveida, platie muguras muskuļi','Rombveida muskuļi, tvēriens','Sagatavošanās pievilkšanās vingrinājumam: karājoties pie stieņa, kustas tikai lāpstiņas; 6–10 atkārtojumi.'],
[['Повисни на турнике на прямых руках, хват чуть шире плеч.','Не сгибая локтей, опусти плечи и сведи лопатки вниз — тело немного поднимется.','Задержись на 1–2 с.','Плавно вернись в полный вис; 6–10 повторов.'],['Сгибание рук в локтях.','Раскачивание корпуса.','Резкое падение в вис.'],'При ограничении «плечи» — короткие подходы; при боли не выполнять.'],
[['Hang from the bar on straight arms, grip slightly wider than the shoulders.','Without bending the elbows, pull the shoulders down and draw the shoulder blades down; the body rises a little.','Hold for 1–2 s.','Return smoothly to a full hang; 6–10 reps.'],['Bending the elbows.','Swinging the body.','Dropping sharply into the hang.'],'With a shoulder limitation keep sets short; stop if it hurts.'],
[['Pakāries pie stieņa uz taisnām rokām, tvēriens nedaudz platāks par pleciem.','Nesaliecot elkoņus, nolaid plecus un savelc lāpstiņas uz leju — ķermenis nedaudz paceļas.','Noturi 1–2 s.','Plūdeni atgriezies pilnā karāšanās stāvoklī; 6–10 atkārtojumi.'],['Elkoņu saliekšana.','Ķermeņa šūpošana.','Strauja krišana karāšanās stāvoklī.'],'Ar plecu ierobežojumu — īsas pieejas; ja sāp, nedari.']],
['hamstring-sweep','Наклоны с «подметанием» для задней поверхности бедра','Заминка','gdb|','Hamstring sweeps','Augšstilba aizmugures “slaucīšana”',
['Задняя поверхность бедра','Икроножные, ягодичные','Динамическая растяжка задней поверхности бедра в заминке: плавные наклоны к выставленной ноге.'],
['Hamstrings','Calves, glutes','A dynamic hamstring stretch for the cool-down: smooth hinges toward the front leg.'],
['Augšstilba aizmugure','Ikri, sēžas muskuļi','Dinamiska augšstilba aizmugures stiepšana atsildīšanā: plūdenas noliekšanās pret priekšā izliktu kāju.'],
[['Выставь одну ногу на полшага вперёд на пятку, носок на себя, задняя нога слегка согнута.','С прямой спиной наклонись к передней ноге, руки «подметают» пол у стопы.','Почувствуй растяжение под коленом и бедром, выпрямись.','8–10 плавных повторов, смени ногу.'],['Круглая спина.','Рывки и пружинящие движения.'],''],
[['Place one foot half a step forward on its heel, toes up, the back leg slightly bent.','Hinge toward the front leg with a flat back, hands sweeping the floor by the foot.','Feel the stretch behind the knee and thigh, then stand up.','8–10 smooth reps, then switch legs.'],['A rounded back.','Bouncing.'],''],
[['Izliec vienu kāju pussoli uz priekšu uz papēža, pirksti uz augšu, aizmugurējā kāja nedaudz saliekta.','Ar taisnu muguru noliecies pret priekšējo kāju, rokas “slauka” grīdu pie pēdas.','Sajūti stiepumu zem ceļa un augšstilbā, iztaisnojies.','8–10 plūdenas reizes, maini kāju.'],['Apaļa mugura.','Rāvieni.'],'']],
['hip-flexor-rock','Раскачивания в выпаде на колене (сгибатели бедра, квадрицепс)','Заминка','gdb|k','Half-kneeling hip flexor rocks','Šūpošanās izklupienā uz ceļa (gūžas saliecēji, četrgalvu muskulis)',
['Сгибатели бедра','Квадрицепс (прямая мышца бедра)','Мягкая динамическая растяжка передней поверхности бедра в заминке.'],
['Hip flexors','Quadriceps (rectus femoris)','A gentle dynamic stretch for the front of the hip in the cool-down.'],
['Gūžas saliecēji','Četrgalvu muskulis (taisnais augšstilba muskulis)','Maiga dinamiska augšstilba priekšpuses stiepšana atsildīšanā.'],
[['Встань в выпад на одно колено (под колено — коврик), вторая стопа впереди.','Подкрути таз (копчик вниз) и напряги ягодицу задней ноги.','Плавно качнись тазом вперёд до растяжения спереди бедра, затем назад.','8–10 раскачиваний, смени ногу.'],['Прогиб в пояснице.','Переднее колено уходит далеко за носок.'],'При ограничении «колени» — мягкая подкладка под колено; при боли не выполнять.'],
[['Kneel on one knee (on a mat), the other foot in front.','Tuck the pelvis (tailbone down) and squeeze the glute of the back leg.','Rock the hips forward smoothly until the front of the hip stretches, then back.','8–10 rocks, then switch legs.'],['Arching the lower back.','The front knee pushing far past the toes.'],'With a knee limitation use soft padding under the knee; stop if it hurts.'],
[['Nometies uz viena ceļa (zem ceļa paklājiņš), otra pēda priekšā.','Pagriez iegurni (astes kauls uz leju) un sasprindzini aizmugurējās kājas sēžas muskuli.','Plūdeni pašūpo gurnus uz priekšu līdz stiepumam augšstilba priekšā, tad atpakaļ.','8–10 šūpošanās, maini kāju.'],['Muguras lejasdaļas izliekums.','Priekšējais celis aiziet tālu aiz pirkstgaliem.'],'Ar ceļu ierobežojumu — mīksts paliktnis zem ceļa; ja sāp, nedari.']],
['chest-wall-stretch','Растяжка груди и плеча у стены','Заминка','gdb|p','Wall chest and shoulder stretch','Krūšu un pleca stiepšana pie sienas',
['Большая грудная','Передняя дельта, бицепс','Статическая растяжка груди после жимов: рука на стене, корпус поворачивается от неё.'],
['Pectoralis major','Front delt, biceps','A static chest stretch after pressing: one hand on the wall, the torso turning away.'],
['Lielais krūšu muskulis','Priekšējais deltveida, bicepss','Statiska krūšu stiepšana pēc spiešanas: roka uz sienas, ķermenis pagriežas prom.'],
[['Встань боком к стене, положи ладонь и предплечье на стену на уровне плеча.','Медленно поворачивай корпус от стены до растяжения в груди и передней части плеча.','Плечо опущено, без боли.','Держи 20–30 с, смени сторону.'],['Плечо поднимается к уху.','Резкий поворот и боль в плече.'],'При ограничении «плечи» — рука ниже уровня плеча и малая амплитуда; при боли не выполнять.'],
[['Stand side-on to a wall, palm and forearm on the wall at shoulder height.','Slowly turn the torso away from the wall until the chest and front shoulder stretch.','Keep the shoulder down, no pain.','Hold 20–30 s, then switch sides.'],['The shoulder rising toward the ear.','Turning sharply with shoulder pain.'],'With a shoulder limitation keep the hand below shoulder height and the range small; stop if it hurts.'],
[['Nostājies ar sānu pret sienu, novieto plaukstu un apakšdelmu uz sienas plecu augstumā.','Lēni pagriez ķermeni prom no sienas līdz stiepumam krūtīs un pleca priekšā.','Plecs nolaists, bez sāpēm.','Turi 20–30 s, maini pusi.'],['Plecs paceļas pie auss.','Straujš pagrieziens un sāpes plecā.'],'Ar plecu ierobežojumu — roka zem plecu līmeņa un maza amplitūda; ja sāp, nedari.']],
['hip-90-90','Перекаты 90/90 (ягодичные, тазобедренный)','Заминка','gdb|','90/90 hip switches','90/90 gūžu pārslēgšana',
['Ягодичные, вращатели бедра','Приводящие','Мобильность тазобедренных суставов в заминке: колени перекатываются из стороны в сторону.'],
['Glutes, hip rotators','Adductors','Hip mobility for the cool-down: the knees rock from side to side.'],
['Sēžas muskuļi, gūžas rotatori','Pievilcēji','Gūžu locītavu mobilitāte atsildīšanā: ceļi pārvēlas no vienas puses uz otru.'],
[['Сядь на пол, стопы чуть шире плеч, колени согнуты, руки упираются в пол сзади.','Медленно опусти оба колена в одну сторону — обе ноги согнуты примерно под 90°.','Вернись через центр и опусти колени в другую сторону.','8–10 перекатов в каждую сторону, спина прямая.'],['Рывки и давление коленом в пол.','Круглая спина.'],''],
[['Sit on the floor, feet a little wider than the shoulders, knees bent, hands on the floor behind you.','Slowly drop both knees to one side, both legs bent at about 90°.','Come back through the middle and drop the knees to the other side.','8–10 switches each way, back straight.'],['Jerking and forcing the knee into the floor.','A rounded back.'],''],
[['Apsēdies uz grīdas, pēdas nedaudz platāk par pleciem, ceļi saliekti, rokas atbalstītas uz grīdas aiz muguras.','Lēni nolaid abus ceļus uz vienu pusi — abas kājas saliektas aptuveni 90° leņķī.','Atgriezies caur centru un nolaid ceļus uz otru pusi.','8–10 pārslēgšanas uz katru pusi, mugura taisna.'],['Rāvieni un ceļa spiešana grīdā.','Apaļa mugura.'],'']],
['adductor-stretch','Растяжка приводящих мышц','Заминка','gdb|k','Adductor stretch','Pievilcēju muskuļu stiepšana',
['Приводящие мышцы бедра','Внутренняя часть задней поверхности бедра','Растяжка внутренней поверхности бедра после ног: мягкий перенос веса в сторону.'],
['Hip adductors','Inner hamstrings','An inner-thigh stretch after leg work: a gentle shift of weight to the side.'],
['Augšstilba pievilcēji','Augšstilba aizmugures iekšpuse','Augšstilba iekšpuses stiepšana pēc kāju treniņa: maiga svara pārnešana uz sāniem.'],
[['Встань в широкую стойку, носки слегка развёрнуты.','Перенеси вес на одну ногу, сгибая её колено; вторая нога прямая.','Таз отводи назад, спина прямая, до растяжения по внутренней стороне прямой ноги.','Держи 20–30 с или плавно перекатывайся 8–10 раз; смени сторону.'],['Колено согнутой ноги заваливается внутрь.','Рывки.'],'При ограничении «колени» — малая амплитуда; при боли не выполнять.'],
[['Take a wide stance, toes turned out slightly.','Shift your weight onto one leg, bending its knee; the other leg stays straight.','Push the hips back with a flat back until the inside of the straight leg stretches.','Hold 20–30 s or rock smoothly 8–10 times; switch sides.'],['The bent knee caving in.','Bouncing.'],'With a knee limitation keep the range small; stop if it hurts.'],
[['Nostājies platā stājā, pirksti nedaudz uz āru.','Pārnes svaru uz vienu kāju, saliecot tās celi; otra kāja taisna.','Atbīdi gurnus atpakaļ, mugura taisna, līdz stiepumam taisnās kājas iekšpusē.','Turi 20–30 s vai plūdeni šūpojies 8–10 reizes; maini pusi.'],['Saliektās kājas celis krīt uz iekšu.','Rāvieni.'],'Ar ceļu ierobežojumu — maza amplitūda; ja sāp, nedari.']],
['shoulder-rolls','Круги плечами со сведением лопаток сидя','Заминка','gdb|p','Seated shoulder rolls with scapular retraction','Plecu apļi ar lāpstiņu savilkšanu sēžot',
['Трапециевидные, ромбовидные','Дельтовидные','Спокойное расслабление плеч и верха спины в заминке.'],
['Trapezius, rhomboids','Deltoids','A calm release for the shoulders and upper back in the cool-down.'],
['Trapecveida, rombveida muskuļi','Deltveida muskuļi','Mierīga plecu un muguras augšdaļas atslābināšana atsildīšanā.'],
[['Сядь ровно, руки свободно опущены.','Подними плечи к ушам, отведи назад и опусти, сводя лопатки.','Двигайся медленно, дыши спокойно.','8–10 кругов назад, затем 5 вперёд.'],['Быстрые рывки.','Сутулая спина.'],'При ограничении «плечи» — малая амплитуда, без боли.'],
[['Sit tall, arms hanging loosely.','Lift the shoulders to the ears, roll them back and down, drawing the shoulder blades together.','Move slowly and breathe calmly.','8–10 rolls back, then 5 forward.'],['Fast jerky movements.','A hunched back.'],'With a shoulder limitation keep the range small and pain-free.'],
[['Apsēdies taisni, rokas brīvi nolaistas.','Pacel plecus pie ausīm, atvelc atpakaļ un nolaid, savelkot lāpstiņas.','Kusties lēni, elpo mierīgi.','8–10 apļi atpakaļ, tad 5 uz priekšu.'],['Ātri rāvieni.','Saliekta mugura.'],'Ar plecu ierobežojumu — maza amplitūda, bez sāpēm.']],
['ankle-circles','Круги стопой сидя (голеностоп)','Заминка','gdb|','Seated ankle circles','Pēdas apļi sēžot (potīte)',
['Мышцы голени, голеностоп','—','Мобильность голеностопа в заминке: медленные круги стопой сидя.'],
['Lower-leg muscles, ankle','—','Ankle mobility for the cool-down: slow foot circles while seated.'],
['Apakšstilba muskuļi, potīte','—','Potītes mobilitāte atsildīšanā: lēni pēdas apļi sēžot.'],
[['Сядь на стул или пол, приподними одну ногу.','Медленно рисуй стопой большие круги, двигается только голеностоп.','10 кругов в одну сторону и 10 в другую.','Смени ногу.'],['Маленькие быстрые круги.','Движение всей ногой вместо стопы.'],''],
[['Sit on a chair or the floor and lift one foot.','Slowly draw large circles with the foot, moving only the ankle.','10 circles one way and 10 the other.','Switch legs.'],['Small fast circles.','Moving the whole leg instead of the foot.'],''],
[['Apsēdies uz krēsla vai grīdas, pacel vienu kāju.','Lēni zīmē ar pēdu lielus apļus, kustas tikai potīte.','10 apļi uz vienu pusi un 10 uz otru.','Maini kāju.'],['Mazi ātri apļi.','Kustība ar visu kāju pēdas vietā.'],'']],
['thoracic-rotation','Повороты грудного отдела на четвереньках','Заминка','gdb|p','Quadruped thoracic rotation','Krūšu daļas rotācija četrrāpus',
['Мышцы грудного отдела спины','Ромбовидные, косые мышцы живота','Мобильность грудного отдела в заминке: поворот корпуса с опорой на руку.'],
['Thoracic spine muscles','Rhomboids, obliques','Upper-back mobility for the cool-down: turning the torso while supported on one hand.'],
['Krūšu daļas muguras muskuļi','Rombveida, slīpie vēdera muskuļi','Krūšu daļas mobilitāte atsildīšanā: ķermeņa pagrieziens ar atbalstu uz rokas.'],
[['Встань на четвереньки, ладони под плечами, колени под тазом; одну руку положи на затылок.','Медленно опусти локоть к опорной руке.','Повернись и подними локоть к потолку, взгляд за локтем.','8–10 повторов, смени сторону; таз не двигается.'],['Поворот тазом вместо грудного отдела.','Рывки.'],'При ограничении «плечи» — малая амплитуда; при боли не выполнять.'],
[['Get on all fours, hands under the shoulders, knees under the hips; place one hand behind your head.','Slowly bring that elbow down toward the supporting arm.','Rotate and lift the elbow toward the ceiling, eyes following it.','8–10 reps, then switch sides; keep the hips still.'],['Turning from the hips instead of the upper back.','Jerking.'],'With a shoulder limitation keep the range small; stop if it hurts.'],
[['Nostājies četrrāpus, plaukstas zem pleciem, ceļi zem gurniem; vienu roku novieto pakausī.','Lēni nolaid elkoni pret atbalsta roku.','Pagriezies un pacel elkoni pret griestiem, skats seko elkonim.','8–10 atkārtojumi, maini pusi; gurni nekustas.'],['Pagrieziens ar gurniem krūšu daļas vietā.','Rāvieni.'],'Ar plecu ierobežojumu — maza amplitūda; ja sāp, nedari.']],
['wrist-flexor-stretch','Растяжка сгибателей запястья сидя','Разминка','gdb|','Seated wrist flexor stretch','Plaukstas saliecēju stiepšana sēžot',
['Сгибатели запястья и пальцев','Мышцы предплечья','Подготовка запястий к отжиманиям и упорам: мягкая растяжка предплечья.'],
['Wrist and finger flexors','Forearm muscles','Prepares the wrists for push-ups and planks: a gentle forearm stretch.'],
['Plaukstas un pirkstu saliecēji','Apakšdelma muskuļi','Plaukstu locītavu sagatavošana atspiedieniem un balstiem: maiga apakšdelma stiepšana.'],
[['Сядь ровно, вытяни одну руку вперёд ладонью вверх.','Второй рукой мягко отведи пальцы вниз и к себе.','Держи 15–20 с до лёгкого растяжения предплечья.','Смени руку; 2 раза.'],['Резкое давление на пальцы.','Боль в запястье.'],''],
[['Sit tall and extend one arm forward, palm up.','With the other hand gently draw the fingers down and back.','Hold 15–20 s until the forearm stretches lightly.','Switch hands; twice.'],['Pressing hard on the fingers.','Pain in the wrist.'],''],
[['Apsēdies taisni, izstiep vienu roku uz priekšu ar plaukstu uz augšu.','Ar otru roku maigi atliec pirkstus uz leju un pret sevi.','Turi 15–20 s līdz vieglam apakšdelma stiepumam.','Maini roku; 2 reizes.'],['Strauja spiešana uz pirkstiem.','Sāpes plaukstas locītavā.'],'']]
].forEach(([id,name,group,meta,en,lv,lib,libEn,libLv,tech,techEn,techLv])=>{
  EX.push({id,name,group}); META[id]=meta; LIB[id]=lib; LIB_EN[id]=libEn; LIB_LV[id]=libLv; TECH[id]=tech; TECH_EN[id]=techEn; TECH_LV[id]=techLv; NO_ANIM.add(id); DICT.push([name,en,lv]);
});

// Правильные метки мест у прежних id (ролик показывает тренажёр, дорожку, EZ-гриф, гантели или резинку).
Object.assign(META,{"mk-standing-calf-raise-machine":'g|',"mk-dumbbell-step-up-low":'gd|',"mk-ez-bar-skullcrusher":'g|p',"mk-incline-treadmill-walk":'g|',"mk-band-high-face-pull":'gd|'});
// v1.2c (решения Эдуарда 14.11.2026): дома турника нет — подтягивания только зал/свой вес, австралийские — свой вес;
// ягодичный мост со штангой — только зал; приседания с весом тела — везде.
Object.assign(META,{pull:'gb|',chin:'gb|',inv:'b|',ht:'g|',bwsq:'gdb|k',"mk-rkc-plank":'gdb|s'});
// Разминка и заминка v1.2c — только в блоках разминки/заминки, не рабочими подходами.
['hamstring-sweep','hip-flexor-rock','chest-wall-stretch','hip-90-90','adductor-stretch','shoulder-rolls','ankle-circles','thoracic-rotation','wrist-flexor-stretch'].forEach(id=>LIB_ONLY.add(id));
// Выпады назад без веса в v1.2c есть у новичков «свой вес».
if(typeof EX_MIN!=='undefined')delete EX_MIN['reverse-lunge'];
// Тренер (D-214): обратные отжимания — от скамьи или стула; проносы — палка (от швабры) или полотенце.
(function(){
  const set=(o,id,i,j,t)=>{if(o&&o[id]&&o[id][i]&&typeof o[id][i][j]==='string')o[id][i][j]=t};
  set(TECH,'bd',0,0,'Упрись руками сзади в скамью или устойчивый стул, пальцы вперёд.');
  set(TECH_EN,'bd',0,0,'Place your hands behind you on a bench or a sturdy chair, fingers forward.');
  set(TECH_LV,'bd',0,0,'Atbalsties ar rokām aiz muguras pret solu vai stabilu krēslu, pirksti uz priekšu.');
  const W='mk-broomstick-pass-throughs';
  if(LIB[W])LIB[W][2]='Мобильность плеч в разминке: пронос палки (подойдёт палка от швабры) или полотенца за голову.';
  if(LIB_EN[W])LIB_EN[W][2]='A warm-up for shoulder mobility: passing a stick (a broom handle works) or a towel behind the head.';
  if(LIB_LV[W])LIB_LV[W][2]='Plecu mobilitāte iesildīšanās laikā: nūjas (der slotas kāts) vai dvieļa pārnešana aiz galvas.';
  set(TECH,W,0,0,'Широкий хват палки или натянутого полотенца, руки прямые.');
  set(TECH_EN,W,0,0,'Wide grip on a stick or a taut towel, arms straight.');
  set(TECH_LV,W,0,0,'Plats tvēriens uz nūjas vai nostiepta dvieļa, rokas taisnas.');
})();

// Прежний id -> id для дома (d) и своего веса (b). Зал (g) всегда остаётся на прежнем id.
const PLACE_VARIANTS={
  "mk-standing-calf-raise-machine":{d:'calf-db',b:'calf-bw'},
  "mk-dumbbell-step-up-low":{b:'step-bw'},
  "mk-ez-bar-skullcrusher":{d:'skull-db'},
  "mk-incline-treadmill-walk":{d:'walk-brisk',b:'walk-brisk'},
  "ht":{d:'ht-db',b:'ht-bw'},
  "pull":{d:'band-pulldown'},
  "chin":{d:'band-pulldown'}
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

// v1.2c (14.11.2026, только MoveKit): один раз переводим сохранённый план на id программ v1.2c.
// Меняются только id в S.program (упражнения, разминка, заминка) — подходы, повторы и правки пользователя остаются.
// История (S.workouts) и начатая тренировка (S.active) не меняются: прежние карточки остаются в приложении, имена видны.
// Программа заново не составляется: пользователь мог править план вручную.
const V12C_ALL={'stretch-hamstring':'hamstring-sweep','cd_quad':'hip-flexor-rock','stretch-chest-doorway':'chest-wall-stretch',
  'stretch-glute-figure4':'hip-90-90','stretch-hip-flexor':'adductor-stretch','cd_xbody':'shoulder-rolls','stretch-calf':'ankle-circles',
  'wrist-mobility':'wrist-flexor-stretch','ankle-knee-to-wall':'tibialis-raise','chest-supported-1db':'chest-supported-2db',
  'tpd-rope':'mk-cable-bar-pushdown','plank-advanced':'mk-rkc-plank',
  'cd_lat':{g:'dead-hang',d:'thoracic-rotation',b:'dead-hang'},
  'negative-pullup':{g:'scap-pullup',d:'band-pulldown',b:'scap-pullup'},
  'reverse-lunge-supported':{g:'reverse-lunge-db',d:'reverse-lunge',b:'reverse-lunge'}};
const V12C_PLACE={
  d:{pull:'band-pulldown',chin:'band-pulldown',inv:'mk-band-row',ht:'ht-db',"mk-standing-calf-raise-machine":'calf-db',"mk-ez-bar-skullcrusher":'skull-db',"mk-incline-treadmill-walk":'walk-brisk'},
  b:{ht:'ht-bw',"mk-dumbbell-step-up-low":'step-bw',"mk-standing-calf-raise-machine":'calf-bw',"mk-incline-treadmill-walk":'walk-brisk'}};
// Запасные id с роликом, если два прежних упражнения дня стали одним (movekit.js грузится позже place.js).
const V12C_DUP={'band-pulldown':['mk-band-row','dbr'],'mk-band-row':['dbr','chest-supported-2db']};
function v12cId(id,place,lim){
  if(typeof id!=='string')return id;
  const pm=V12C_PLACE[place]||{};if(pm[id])return pm[id];
  let x=V12C_ALL[id];if(x&&typeof x==='object')x=x[place]||x.g;
  if(x==='mk-rkc-plank'&&(lim||[]).includes('s'))x='mk-front-plank'; // RKC — «осторожно со спиной»
  return x||id}
function migrateV12c(){
  if(typeof S==='undefined'||!S||(S.planV12c|0)>=1)return false;
  const prof=S.prof||{},place=prof.place||'g',lim=prof.lim||[];
  const map=id=>v12cId(id,place,lim);
  const blk=list=>{if(!Array.isArray(list))return list;const seen=new Set(),out=[];
    for(const m of list){if(m&&typeof m.id==='string'){m.id=map(m.id);if(seen.has(m.id))continue;seen.add(m.id)}out.push(m)}return out};
  const day=d=>{if(!d)return;
    const used=new Set();
    (d.items||[]).forEach(it=>{if(!it||typeof it.exId!=='string')return;let n=map(it.exId);
      // Два прежних id стали одним (pull и chin дома): второму — первая подходящая месту замена из ALT.
      if(n!==it.exId&&used.has(n)){const alt=(V12C_DUP[n]||[]).concat((typeof ALT!=='undefined'&&ALT[n])||[]);
        const x=alt.find(a=>!used.has(a)&&placeHas(a,place)&&(typeof movekitFile!=='function'||movekitFile(a)));if(x)n=x}
      it.exId=n;used.add(n)});
    if(d.wu){if(d.wu.cardio&&d.wu.cardio.id)d.wu.cardio.id=map(d.wu.cardio.id);d.wu.mob=blk(d.wu.mob);(d.wu.ramp||[]).forEach(r=>{if(r&&r.exId)r.exId=map(r.exId)})}
    if(d.cd){if(d.cd.cardio&&d.cd.cardio.id)d.cd.cardio.id=map(d.cd.cardio.id);d.cd.stretch=blk(d.cd.stretch)}};
  if(Array.isArray(S.program))S.program.forEach(day);
  S.planV12c=1;return true}
if(typeof save==='function'&&migrateV12c())save();

// ---------------------------------------------------------------------------------------------
// D-215 (C-109, принято Claude 14.11.2026): в приложении только упражнения с роликом MoveKit.
// Без ролика остаются только быстрая ходьба (walk-brisk) и дыхание лёжа (cd_breath).
// Скрытые карточки убраны из библиотеки, списков «добавить», замен ⇄ и генератора.
// Названия, тексты и метки скрытых карточек остаются: история и старые планы показывают их имена.
const HIDDEN=new Set(["chest-supported-1db","smith-split-squat","smith-rdl","standing-single-leg-curl","negative-pullup",
  "neck-flexion-extension","cable-internal-rotation","cable-external-rotation-90","band-chest-press","wrist-mobility",
  "reverse-lunge-supported","plank-advanced","smith-upright-row","smith-bss","smith-hip-thrust","standing-ab-wheel",
  "deep-squat-hold","inchworm","stretch-hip-flexor","stretch-chest-doorway","stretch-hamstring","stretch-glute-figure4",
  "stretch-calf","wall-slide","med-ball-slam",
  // Заминка без ролика, в программах v1.2c заменена роликами MoveKit (thoracic-rotation / dead-hang, hip-flexor-rock, shoulder-rolls).
  "cd_lat","cd_quad","cd_xbody"]);
const HIDDEN_EX=[];
for(let i=EX.length-1;i>=0;i--)if(HIDDEN.has(EX[i].id))HIDDEN_EX.unshift(EX.splice(i,1)[0]);
const isHidden=id=>HIDDEN.has(id);
// exBy() ищет в EX, затем в legacyEx(): скрытая карточка находится там с прежним названием.
if(typeof legacyEx==='function'){const legacyEx0=legacyEx;legacyEx=function(id){const e=HIDDEN_EX.find(x=>x.id===id);return e?{id:e.id,name:e.name,group:e.group,hidden:true}:legacyEx0(id)}}
if(typeof ALT!=='undefined')for(const k of Object.keys(ALT)){if(HIDDEN.has(k)){delete ALT[k];continue}ALT[k]=ALT[k].filter(x=>!HIDDEN.has(x))}
if(typeof SLOT!=='undefined')for(const k of Object.keys(SLOT))SLOT[k]=SLOT[k].map(list=>list.filter(x=>!HIDDEN.has(x)));
if(typeof autoOk==='function'){const autoOk1=autoOk;autoOk=function(id,a,acc){return !HIDDEN.has(id)&&autoOk1(id,a,acc)}}

// Строка «Безопасность» у 9 карточек v1.2c (замечание Claude; band-pulldown — формулировка Claude).
[['calf-db','При боли в ахилле или стопе уменьши амплитуду; ступенька устойчивая, держись за стену.','If the Achilles or foot hurts, shorten the range; use a stable step and hold the wall.','Ja sāp Ahileja cīpsla vai pēda, samazini amplitūdu; pakāpiens stabils, turies pie sienas.'],
 ['calf-bw','Ступенька устойчивая, держись за опору; при боли в ахилле уменьши амплитуду или не выполняй.','Use a stable step and hold a support; if the Achilles hurts, shorten the range or skip it.','Pakāpiens stabils, turies pie balsta; ja sāp Ahileja cīpsla, samazini amplitūdu vai nedari.'],
 ['ht-db','Придерживай гантель руками, чтобы она не скатилась; при боли в пояснице уменьши высоту подъёма.','Hold the dumbbell with both hands so it cannot roll; if the lower back hurts, lift the hips less.','Pieturi hanteli ar rokām, lai tā neaizripo; ja sāp muguras lejasdaļa, pacel gurnus zemāk.'],
 ['ht-bw','Не прогибай поясницу вверху; при боли в пояснице уменьши высоту подъёма или не выполняй.','Do not arch the lower back at the top; if it hurts, lift the hips less or skip it.','Neizliec muguras lejasdaļu augšā; ja sāp, pacel gurnus zemāk vai nedari.'],
 ['band-pulldown','Перед подходом проверь резинку на надрывы; дверь закрыта и открывается от тебя.','Check the band for tears before each set; the door is closed and opens away from you.','Pirms pieejas pārbaudi, vai gumijai nav plīsumu; durvis aizvērtas un veras prom no tevis.'],
 ['hamstring-sweep','Без рывков, до лёгкого натяжения; при боли в пояснице или прострелах в ногу прекрати.','No bouncing, only to a light stretch; stop if the lower back hurts or pain shoots down the leg.','Bez rāvieniem, līdz vieglam stiepumam; pārtrauc, ja sāp muguras lejasdaļa vai sāpes izstaro kājā.'],
 ['hip-90-90','Двигайся только в безболезненной амплитуде; при боли в тазобедренном суставе или колене прекрати.','Move only through a pain-free range; stop if the hip or knee hurts.','Kusties tikai nesāpīgā amplitūdā; pārtrauc, ja sāp gūža vai celis.'],
 ['ankle-circles','Медленно и без боли; при свежей травме голеностопа не выполнять.','Slowly and pain-free; do not perform with a fresh ankle injury.','Lēni un bez sāpēm; ar svaigu potītes traumu nedari.'],
 ['wrist-flexor-stretch','Натяжение лёгкое, без боли; при онемении или покалывании в пальцах прекрати.','Keep the stretch light and pain-free; stop if the fingers go numb or tingle.','Stiepums viegls, bez sāpēm; pārtrauc, ja pirksti notirpst vai durstās.']
].forEach(([id,ru,en,lv])=>{if(TECH[id])TECH[id][2]=ru;if(TECH_EN[id])TECH_EN[id][2]=en;if(TECH_LV[id])TECH_LV[id][2]=lv});

// D-215: один раз переводим сохранённый план со скрытых карточек на карточку с роликом (замена тренера или та же мышца).
// Как и в v1.2c: меняются только id в S.program; история (S.workouts) и начатая тренировка (S.active) не меняются.
const D215_MAP={'chest-supported-1db':'chest-supported-2db',
  'smith-split-squat':{g:'bss',d:'bss',b:'reverse-lunge'},'smith-bss':{g:'bss',d:'bss',b:'reverse-lunge'},
  'smith-rdl':{g:'rdl',d:'rdl-db',b:'sglb'},'standing-single-leg-curl':{g:'lc',d:'rdl-db',b:'nlc'},
  'negative-pullup':{g:'scap-pullup',d:'band-pulldown',b:'scap-pullup'},'neck-flexion-extension':'neck-retraction',
  'cable-internal-rotation':'cable-external-rotation','cable-external-rotation-90':'cable-external-rotation',
  'band-chest-press':{g:'dbp',d:'dbp',b:'pu'},'wrist-mobility':'wrist-flexor-stretch',
  'reverse-lunge-supported':{g:'reverse-lunge-db',d:'reverse-lunge',b:'reverse-lunge'},
  'plank-advanced':'mk-rkc-plank','standing-ab-wheel':'mk-rkc-plank','smith-upright-row':'lr',
  'smith-hip-thrust':{g:'ht',d:'ht-db',b:'ht-bw'},'deep-squat-hold':'bwsq','inchworm':'worlds-greatest-stretch',
  'stretch-hip-flexor':'hip-flexor-rock','stretch-chest-doorway':'chest-wall-stretch','stretch-hamstring':'hamstring-sweep',
  'stretch-glute-figure4':'hip-90-90','stretch-calf':'ankle-circles','wall-slide':'mk-prone-y-t-raises',
  'med-ball-slam':{g:'kettlebell-swing',d:'kettlebell-swing',b:'jump-squat'},
  'cd_lat':{g:'dead-hang',d:'thoracic-rotation',b:'dead-hang'},'cd_quad':'hip-flexor-rock','cd_xbody':'shoulder-rolls'};
function d215Id(id,place,lim){
  if(typeof id!=='string')return id;
  let x=D215_MAP[id];if(x&&typeof x==='object')x=x[place]||x.g;
  if(x==='mk-rkc-plank'&&(lim||[]).includes('s'))x='mk-front-plank'; // RKC — «осторожно со спиной»
  return x||id}
function migrateD215(){
  if(typeof S==='undefined'||!S||(S.planD215|0)>=1)return false;
  const prof=S.prof||{},place=prof.place||'g',lim=prof.lim||[];
  const map=id=>d215Id(id,place,lim);
  const blk=list=>{if(!Array.isArray(list))return list;const seen=new Set(),out=[];
    for(const m of list){if(m&&typeof m.id==='string'){m.id=map(m.id);if(seen.has(m.id))continue;seen.add(m.id)}out.push(m)}return out};
  const day=d=>{if(!d)return;const used=new Set();
    (d.items||[]).forEach(it=>{if(!it||typeof it.exId!=='string')return;let n=map(it.exId);
      if(n!==it.exId&&used.has(n)){const alt=(typeof ALT!=='undefined'&&ALT[n])||[];const x=alt.find(a=>!used.has(a)&&!HIDDEN.has(a)&&placeHas(a,place));if(x)n=x}
      it.exId=n;used.add(n)});
    if(d.wu){if(d.wu.cardio&&d.wu.cardio.id)d.wu.cardio.id=map(d.wu.cardio.id);d.wu.mob=blk(d.wu.mob);(d.wu.ramp||[]).forEach(r=>{if(r&&r.exId)r.exId=map(r.exId)})}
    if(d.cd){if(d.cd.cardio&&d.cd.cardio.id)d.cd.cardio.id=map(d.cd.cardio.id);d.cd.stretch=blk(d.cd.stretch)}};
  if(Array.isArray(S.program))S.program.forEach(day);
  S.planD215=1;return true}
if(typeof save==='function'&&migrateD215())save();
