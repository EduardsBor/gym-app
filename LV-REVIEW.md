# LV translation — NEEDS NATIVE-SPEAKER REVIEW

All Latvian (LV) strings were machine-assisted drafts. Before release a native Latvian speaker must review them, and a lawyer must also review the legal texts.

| File | What it contains | Status |
|---|---|---|
| `i18n/dict.js` | 3rd column of `DICT` / `DICT_EXACT`: the whole UI (tabs, today/workout, program, progress, history, body, more, science, library, catalog, quiz, exercise names, units) | ⚠️ needs review |
| `i18n/dict2.js` | 3rd column: onboarding, paywall, consent, privacy & data, owner mode | ⚠️ needs review |
| `i18n/lib.lv.js` | `LIB_LV`: 68 exercises (muscles, description, steps, mistakes) | ⚠️ needs review (anatomy terms) |
| `i18n/tech.lv.js` | `TECH_LV`: 68 technique sheets | ⚠️ needs review |
| `legal.js` (`LEGAL.lv`) | Privacy Policy + Terms of Use (DRAFT, placeholders) | ⚠️ needs native review **and** a lawyer |
| `features.js` | One LV-only note in «Vēl»: "Latviešu tulkojums ir melnraksts…" | remove after review |

Notes for the reviewer:
- Citations or scientific sources are intentionally left in their original language.
- Terms to check: 1RM → "1MA" (1 maksimālais atkārtojums), BMI → "ĶMI", GDPR → "VDAR".
- Exercise names may follow gym slang (for example "Pietupieni ar stieni"); align them with common Latvian gym usage.

## v20–v21 additions (need review)

v20 — workout-time step (`features.js` / `i18n/dict2.js`): «Cik daudz laika esi gatavs veltīt treniņam?», the time-fit hint «pieejas × (≈40 s darba + atpūta) + 5 min iesildīšanās — …», «Apjoms vienā treniņā samazināts (… pieejas nedēļā)», «Mazāk minūšu nozīmē mazāku nedēļas apjomu …», «Ilgums».

v21 — warm-up block (`i18n/dict2.js`, end of file):

- Круги тазом → Iegurņa apļi
- 10 в каждую сторону → 10 uz katru pusi
- Руки на поясе, медленно вращай тазом, постепенно увеличивая амплитуду. → Rokas uz gurniem, lēni apļo iegurni, pakāpeniski palielinot amplitūdu.
- Махи ногами → Kāju vēzieni
- 10 вперёд-назад и 10 в стороны каждой ногой → 10 uz priekšu–atpakaļ un 10 uz sāniem ar katru kāju
- Держись за опору; махи свободные, без рывков, амплитуда растёт постепенно. → Pieturies pie atbalsta; vēzieni brīvi, bez rāvieniem, amplitūda pieaug pakāpeniski.
- Приседания без веса → Pietupieni bez svara
- 10 раз → 10 reizes
- 8 раз → 8 reizes
- 12 раз → 12 reizes
- 15 раз → 15 reizes
- Медленно, на комфортную глубину, колени смотрят по направлению носков. → Lēni, līdz ērtam dziļumam, ceļi vērsti pēdu pirkstu virzienā.
- Ягодичный мост лёжа → Sēžas tilts guļus
- Лёжа на спине, стопы на полу: поднимай таз, сжимая ягодицы, без прогиба в пояснице. → Guļus uz muguras, pēdas uz grīdas: cel iegurni, saspiežot sēžas muskuļus, neizliecot jostasvietu.
- Наклоны «гуд-морнинг» без веса → “Labrīt” noliekumi bez svara
- Руки на груди, колени чуть согнуты: наклон от таза с прямой спиной до лёгкого натяжения задней поверхности бедра. → Rokas uz krūtīm, ceļi nedaudz saliekti: noliecies no gurniem ar taisnu muguru līdz vieglam augšstilba aizmugures sasprindzinājumam.
- Круги руками → Roku apļi
- 10 вперёд и 10 назад → 10 uz priekšu un 10 atpakaļ
- Прямые руки, от маленьких кругов к большим. → Taisnas rokas, no maziem apļiem uz lieliem.
- Проводка палки или резинки за голову → Nūjas vai gumijas pārnešana pār galvu
- Широкий хват, прямые руки плавно проводи над головой назад и обратно; без боли в плечах. → Plats tvēriens, taisnas rokas plūstoši pārnes pār galvu atpakaļ un atpakaļ; bez sāpēm plecos.
- Разведение рук со сведением лопаток → Roku izplešana ar lāpstiņu savilkšanu
- Руки на уровне плеч: разводи их в стороны (можно с лёгкой резинкой), сводя лопатки. → Rokas plecu augstumā: izpleti tās uz sāniem (var ar vieglu gumiju), savelkot lāpstiņas.
- Отжимания лопатками → Lāpstiņu atspiedieni
- В упоре на прямых руках (можно с колен): своди и разводи лопатки, локти не сгибаются. → Balstā uz taisnām rokām (var no ceļiem): savelc un izpleti lāpstiņas, elkoņi nesaliecas.
- Кошка-корова → Kaķis–govs
- На четвереньках плавно округляй и прогибай спину вместе с дыханием. → Četrrāpus plūstoši izliec un ieliec muguru līdz ar elpošanu.
- Подтягивания лопатками → Lāpstiņu pievilkšanās
- В висе на прямых руках опускай и своди лопатки — тело приподнимается на пару сантиметров. → Karājoties uz taisnām rokām, nolaid un savelc lāpstiņas — ķermenis paceļas par pāris centimetriem.
- Лёгкая тяга к поясу → Viegla vilkme pie vidukļa
- Резинка или блок с малым весом: тяни к поясу, сводя лопатки, без рывков. → Gumija vai trenažieris ar mazu svaru: velc pie vidukļa, savelkot lāpstiņas, bez rāvieniem.
- Ходьба на месте с высоким подниманием колен → Soļošana uz vietas, augstu ceļot ceļus
- Джампинг-джек или ходьба на месте → Lēcieni “zvaigznīte” vai soļošana uz vietas
- Гребной тренажёр или велотренажёр, лёгкий темп → Airēšanas trenažieris vai velotrenažieris, viegls temps
- Велотренажёр, лёгкий темп → Velotrenažieris, viegls temps
- Гребной тренажёр или эллипс, лёгкий темп → Airēšanas trenažieris vai eliptiskais trenažieris, viegls temps
- Подводящий подход → Iesildošā pieeja
- Лёгкий подход → Viegla pieeja
- 1) Общая разминка — 3 мин → 1) Vispārējā iesildīšanās — 3 min
- 2) Подвижность суставов — ~2 мин → 2) Locītavu kustīgums — ~2 min
- 3) Подводящие подходы → 3) Iesildošās pieejas
- % — от твоего рабочего веса. Разминочные подходы не записываются в историю и рекорды. → % — no tava darba svara. Iesildošās pieejas netiek saglabātas vēsturē un rekordos.
- Разминочные подходы не записываются в историю и рекорды. → Iesildošās pieejas netiek saglabātas vēsturē un rekordos.
- Разминка в каждой тренировке → Iesildīšanās katrā treniņā
- лёгкого кардио, затем динамические движения для суставов и мышц этого дня и подводящие подходы к первому базовому упражнению. Разминка улучшает результат тренировки; долгую статическую растяжку перед силовой лучше не делать — она может временно снизить силу. → viegla kardio, tad dinamiskas kustības šīs dienas locītavām un muskuļiem un iesildošās pieejas pirmajam pamatvingrinājumam. Iesildīšanās uzlabo treniņa rezultātu; ilgu statisko stiepšanos pirms spēka treniņa labāk nedarīt — tā var īslaicīgi samazināt spēku.
- Разминка → Iesildīšanās
- Готово → Gatavs
- каждая крупная группа мышц тренируется → katra lielā muskuļu grupa tiek trenēta
