# Новые LV-строки — дополнение к C-113 по внешнему аудиту (v146)

Не вносить в `LV-проверка.xlsx` и `LV-REVIEW.md` до ревью.

Пакет `fixes-addendum.json`: 41 LV-правка (плюс правка оговорки в `lib.why` становой тяги, см. ниже). Поле `old` совпало с текстами main v144 во всех 125 записях пакета (RU/EN/LV).

## Становая тяга (`mk-barbell-deadlift`, `lib.why`) — правка оговорки после пакета

Переписана только оговорка про квадрицепс; остальной текст сохранён.

| | Текст |
|---|---|
| RU было | Базовое упражнение: квадрицепс создаёт разгибающий момент в колене, особенно в начале подъёма с пола; ягодичные и мышцы задней поверхности бедра разгибают таз; разгибатели спины удерживают нейтральный позвоночник. |
| RU стало | Базовое упражнение: квадрицепс разгибает колени в начале подъёма с пола; ягодичные и мышцы задней поверхности бедра разгибают таз; разгибатели спины удерживают нейтральный позвоночник. |
| EN стало | A foundational lift: the quadriceps extend the knees at the start of the pull from the floor; the glutes and hamstrings extend the hips; the spinal erectors keep the spine neutral. |
| LV стало | Pamatvingrinājums: četrgalvainais muskulis iztaisno ceļus vilkmes sākumā no zemes; sēžas muskuļi un augšstilba mugurējās grupas muskuļi iztaisno gūžas; muguras iztaisnotājmuskuļi notur neitrālu mugurkaulu. |

LV до правки оговорки (как в addendum): `četrgalvainais muskulis rada ceļa iztaisnošanas momentu, īpaši vilkmes sākumā no zemes`.

## Правки пакета (LV)

| id | поле | было | стало |
|---|---|---|---|
| `rdl` | `lib.why` | Vilkme ar taisnām kājām: noslogo augšstilba aizmuguri un sēžas muskuļus stiepumā un māca pareizu noliekšanos no gurniem. | Rumāņu vilkme: noslogo augšstilba mugurējās grupas muskuļus un sēžas muskuļus stiepumā un māca pareizu noliekšanos no gurniem. Tā nav vilkme ar taisnām kājām: ceļi paliek nedaudz saliekti. |
| `rdl` | `lib.primary` | Augšstilba aizmugure, sēžas muskuļi | Augšstilba mugurējās grupas muskuļi (divgalvainais, pusdzīslainais, pusplēvainais), sēžas muskuļi |
| `lp` | `tech.safety` | Nekad «neaizslēdz» ceļus zem svara. | Neiztaisno ceļus līdz galam ar rāvienu un neaizslēdz tos augšējā punktā — atstāj ceļus nedaudz saliektus. |
| `lp` | `tech.steps` | ["Apsēdies, jostasvieta piespiesta atzveltnei, pēdas plecu platumā uz platformas.", "Noņem fiksatorus.", "Ieelpojot nolaid platformu, līdz ceļi saliecas ~90°.", "Izelpojot izspied, neiztaisnojot ceļus līdz galam."] | ["Apsēdies, jostasvieta piespiesta atzveltnei, pēdas plecu platumā uz platformas.", "Noņem fiksatorus.", "Ieelpojot nolaid platformu, līdz ceļi saliecas ~90°.", "Izelpojot izspied, neiztaisnojot ceļus līdz galam ar rāvienu: augšā atstāj tos nedaudz saliektus."] |
| `lp` | `tech.errors` | ["Jostasvieta atraujas no atzveltnes apakšā.", "Ceļu bloķēšana augšā.", "Ceļi uz iekšu."] | ["Jostasvieta atraujas no atzveltnes apakšā.", "Rāviens iztaisnošanā un ciets ceļu aizslēgums augšā.", "Ceļi uz iekšu."] |
| `lc` | `lib.primary` | Augšstilba aizmugure | Augšstilba mugurējās grupas muskuļi (divgalvainais, pusdzīslainais, pusplēvainais) |
| `lc` | `lib.secondary` | Ikri | Ikru muskulis (gastrocnemius; šķērso ceļa locītavu un palīdz ceļa saliekšanā); plekstveida muskulis šajā kustībā gandrīz nepiedalās |
| `lc-seated` | `lib.primary` | Augšstilba aizmugure. Ar saliektu gūžu divu locītavu augšstilba aizmugures muskuļi ir vairāk iestiepti pie iegurņa. | Augšstilba mugurējās grupas muskuļi (divgalvainais, pusdzīslainais, pusplēvainais). Ar saliektu gūžu šīs grupas divu locītavu muskuļi ir vairāk iestiepti pie iegurņa. |
| `lc-seated` | `lib.secondary` | Ikri. | Ikru muskulis (gastrocnemius; šķērso ceļa locītavu un palīdz ceļa saliekšanā); plekstveida muskulis šajā kustībā gandrīz nepiedalās. |
| `standing-single-leg-curl` | `lib.primary` | Darba kājas augšstilba aizmugure. | Darba kājas augšstilba mugurējās grupas muskuļi (divgalvainais, pusdzīslainais, pusplēvainais). |
| `mk-barbell-deadlift` | `lib.primary` | Sēžas muskuļi, augšstilba aizmugure, muguras iztaisnotājmuskuļi | Sēžas muskuļi, augšstilba mugurējās grupas muskuļi (divgalvainais, pusdzīslainais, pusplēvainais), četrgalvainais muskulis |
| `mk-barbell-deadlift` | `lib.secondary` | Četrgalvainais muskulis; lielais pievilcējmuskulis; trapecveida muskulis un apakšdelmi (tvēriens); vēdera muskuļi (stabilizācija) | Muguras iztaisnotājmuskuļi (stabilizatori); lielais pievilcējmuskulis; trapecveida muskulis un apakšdelmi (tvēriens); vēdera muskuļi (stabilizācija) |
| `mk-barbell-deadlift` | `lib.why` (после правки оговорки) | Pamatvingrinājums visas ķermeņa mugurējās virsmas spēkam: sēžas muskuļiem, augšstilbiem un mugurai. | Pamatvingrinājums: četrgalvainais muskulis iztaisno ceļus vilkmes sākumā no zemes; sēžas muskuļi un augšstilba mugurējās grupas muskuļi iztaisno gūžas; muguras iztaisnotājmuskuļi notur neitrālu mugurkaulu. |
| `mk-hanging-knee-raises` | `lib.primary` | Taisnais vēdera muskulis, gūžas saliecēji | Gūžas saliecēji; taisnais vēdera muskulis — pie iegurņa pagriešanas atpakaļ |
| `mk-hanging-knee-raises` | `lib.why` | Ceļu celšana kārienā ar iegurņa piegriešanu. | Gūžas saliecēji ceļ augšstilbus; taisnais vēdera muskulis iesaistās, kad iegurnis tiek pagriezts atpakaļ. Bez šīs iegurņa kustības slodze paliek gūžas saliecējos. |
| `hanging-knee-raise` | `lib.primary` | Taisnais vēdera muskulis; gūžas saliecēji | Gūžas saliecēji; taisnais vēdera muskulis — pie iegurņa pagriešanas atpakaļ |
| `hanging-knee-raise` | `lib.why` | Ceļu pacelšana karājoties: gūžas saliecēji un taisnais vēdera muskulis (iegurņa pagriešana atpakaļ). | Gūžas saliecēji ceļ augšstilbus; taisnais vēdera muskulis iesaistās, kad iegurnis tiek pagriezts atpakaļ. Bez šīs iegurņa kustības slodze paliek gūžas saliecējos. |
| `stair` | `lib.primary` | Sēžas muskuļi, četrgalvainais muskulis (kardio) | Sēžas muskuļi, četrgalvainais muskulis |
| `jump` | `lib.primary` | Ikri, četrgalvainais muskulis, sēžas muskuļi (kardio) | Ikri, četrgalvainais muskulis, sēžas muskuļi |
| `mk-elliptical` | `lib.primary` | Četrgalvainais muskulis, sēžas muskuļi, augšstilba aizmugure (kardio) | Četrgalvainais muskulis, sēžas muskuļi, augšstilba mugurējās grupas muskuļi (divgalvainais, pusdzīslainais, pusplēvainais) |
| `mk-incline-treadmill-walk` | `lib.primary` | Sēžas muskuļi, augšstilba aizmugure, ikri (viegls kardio) | Sēžas muskuļi, augšstilba mugurējās grupas muskuļi (divgalvainais, pusdzīslainais, pusplēvainais), ikri |
| `mk-indoor-cycling-spin` | `lib.primary` | Četrgalvainais muskulis, sēžas muskuļi, ikri (kardio) | Četrgalvainais muskulis, sēžas muskuļi, ikri |
| `mk-rowing-machine-steady-state` | `lib.primary` | četrgalvainais muskulis, sēžas muskuļi, augšstilba aizmugure, platie muguras muskuļi (kardio) | Četrgalvainais muskulis, sēžas muskuļi, augšstilba mugurējās grupas muskuļi (divgalvainais, pusdzīslainais, pusplēvainais), platie muguras muskuļi |
| `mk-treadmill-run` | `lib.primary` | Četrgalvainais muskulis, sēžas muskuļi, augšstilba aizmugure, ikri (kardio) | Četrgalvainais muskulis, sēžas muskuļi, augšstilba mugurējās grupas muskuļi (divgalvainais, pusdzīslainais, pusplēvainais), ikri |
| `mk-treadmill-run` | `lib.why` | Skriešana uz skrejceliņa. | Skriešana uz skrejceliņa: slodze sirds un asinsvadu sistēmai. |
| `sglb` | `lib.why` | Gūžas pacelšana guļus uz vienas kājas: divkāršo slodzi bez svara un izlīdzina puses. | Gūžas pacelšana guļus uz vienas kājas: palielina relatīvo slodzi uz atbalsta pusi un palīdz izlīdzināt puses. |
| `nlc` | `lib.primary` | Augšstilba aizmugure | Augšstilba mugurējās grupas muskuļi (divgalvainais, pusdzīslainais, pusplēvainais) |
| `nlc` | `lib.secondary` | Sēžas muskuļi, ikri | Sēžas muskuļi; ikru muskulis (ceļa saliecējs); plekstveida muskulis šajā kustībā gandrīz nepiedalās |
| `rdl-db` | `lib.primary` | Augšstilba aizmugure, sēžas muskuļi | Augšstilba mugurējās grupas muskuļi (divgalvainais, pusdzīslainais, pusplēvainais), sēžas muskuļi |
| `rdl-kb` | `lib.primary` | Augšstilba aizmugure, sēžas muskuļi | Augšstilba mugurējās grupas muskuļi (divgalvainais, pusdzīslainais, pusplēvainais), sēžas muskuļi |
| `rdl-band` | `lib.primary` | Augšstilba aizmugure, sēžas muskuļi | Augšstilba mugurējās grupas muskuļi (divgalvainais, pusdzīslainais, pusplēvainais), sēžas muskuļi |
| `smith-rdl` | `lib.primary` | Augšstilba aizmugure; sēžas muskuļi. | Augšstilba mugurējās grupas muskuļi (divgalvainais, pusdzīslainais, pusplēvainais); sēžas muskuļi. |
| `sl-rdl` | `lib.primary` | Atbalsta kājas augšstilba aizmugure un lielais sēžas muskulis. | Atbalsta kājas augšstilba mugurējās grupas muskuļi (divgalvainais, pusdzīslainais, pusplēvainais) un lielais sēžas muskulis. |
| `mk-dumbbell-stiff-leg-deadlift` | `lib.primary` | Augšstilba aizmugure, sēžas muskuļi | Augšstilba mugurējās grupas muskuļi (divgalvainais, pusdzīslainais, pusplēvainais), sēžas muskuļi |
| `hamstring-sweep` | `lib.primary` | Augšstilba aizmugure | Augšstilba mugurējās grupas muskuļi (divgalvainais, pusdzīslainais, pusplēvainais) |
| `inchworm` | `lib.primary` | Augšstilba aizmugure (noliekšanās laikā un pēdām soļojot pret plaukstām); rumpja muskuļi plankā. | Augšstilba mugurējās grupas muskuļi (divgalvainais, pusdzīslainais, pusplēvainais) — noliekšanās laikā un pēdām soļojot pret plaukstām; rumpja muskuļi plankā. |
| `kettlebell-swing` | `lib.primary` | Sēžas muskuļi; augšstilba aizmugure. | Sēžas muskuļi; augšstilba mugurējās grupas muskuļi (divgalvainais, pusdzīslainais, pusplēvainais). |
| `reverse-hyper` | `lib.primary` | Sēžas muskuļi; augšstilba aizmugure. | Sēžas muskuļi; augšstilba mugurējās grupas muskuļi (divgalvainais, pusdzīslainais, pusplēvainais). |
| `w_legsw` | `lib.primary` | Gūžas saliecēji, augšstilba aizmugure | Gūžas saliecēji, augšstilba mugurējās grupas muskuļi (divgalvainais, pusdzīslainais, pusplēvainais) |
| `mk-walking-knee-hugs` | `lib.primary` | Lielais sēžas muskulis un augšstilba aizmugure paceltajai kājai (dinamiska stiepšana); atbalsta kājas ikri (pacelšanās uz pirkstgala) | Lielais sēžas muskulis un augšstilba mugurējās grupas muskuļi (divgalvainais, pusdzīslainais, pusplēvainais) paceltajai kājai (dinamiska stiepšana); atbalsta kājas ikri (pacelšanās uz pirkstgala) |
| `mk-hip-hinge-drill` | `lib.primary` | Augšstilba aizmugure, sēžas muskuļi, muguras iztaisnotājmuskuļi (iesildīšanās) | Augšstilba mugurējās grupas muskuļi (divgalvainais, pusdzīslainais, pusplēvainais), sēžas muskuļi, muguras iztaisnotājmuskuļi |
