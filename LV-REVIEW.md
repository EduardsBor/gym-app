# LV translation — NEEDS NATIVE-SPEAKER REVIEW

All Latvian (LV) strings were machine-assisted drafts. Before release a native Latvian speaker must review them, and a lawyer must also review the legal texts.

| File | What it contains | Status |
|---|---|---|
| `i18n/dict.js` | 3rd column of `DICT` / `DICT_EXACT`: the whole UI (tabs, today/workout, program, progress, history, body, more, science, library, catalog, quiz, exercise names, units) | ⚠️ needs review |
| `i18n/dict2.js` | 3rd column: onboarding, paywall, consent, privacy & data, owner mode | ⚠️ needs review |
| `i18n/dict3.js` | 3rd column: account, sync, analytics (Stage 2) | ⚠️ needs review |
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

## v22 — разминочные упражнения (warm.js)

### w_march — Ходьба на месте с высоким подниманием колен
- Основные: Подвздошно-поясничные (сгибатели бедра), квадрицепс → **Gūžas saliecēji (iliopsoas), četrgalvainais**
- Вспомогательные: Икры, пресс, ягодичные → **Ikri, vēdera prese, sēžas muskuļi**
- Описание: Мягкое общее разогревание без ударной нагрузки на колени: повышает пульс и температуру мышц. В разминке — 3 минуты в лёгком темпе. → **Maiga vispārējā iesildīšanās bez trieciena slodzes ceļiem: paaugstina pulsu un muskuļu temperatūru. Iesildīšanā — 3 minūtes vieglā tempā.**
- Шаги: Nostājies taisni, pēdas gūžu platumā, rokas saliektas elkoņos. / Pamīšus cel ceļus aptuveni līdz gūžu augstumam. / Kustini rokas soļu ritmā kā ejot. / Elpo vienmērīgi; temps viegls — vari runāt.
- Ошибки: Saliekta stāja vai atliekšanās atpakaļ. / Smaga piezemēšanās uz papēža. / Pārāk ātrs temps pašā sākumā.
- Безопасность: Ja sāp ceļš, cel to zemāk.

### w_hip — Круги тазом
- Основные: Мышцы тазобедренного сустава (ягодичные, сгибатели бедра) → **Gūžas locītavas muskuļi (sēžas, gūžas saliecēji)**
- Вспомогательные: Мышцы поясницы, косые мышцы живота → **Muguras lejasdaļas muskuļi, slīpie vēdera muskuļi**
- Описание: Подвижность тазобедренных суставов и поясницы перед работой на ноги. В разминке — 10 кругов в каждую сторону. → **Gūžu un muguras lejasdaļas kustīgums pirms kāju darba. Iesildīšanā — 10 apļi uz katru pusi.**
- Шаги: Pēdas plecu platumā, ceļi nedaudz saliekti, rokas uz gurniem. / Pleci un krūtis paliek uz vietas, kustas tikai iegurnis. / Lēnām apli ar iegurni: uz sāniem, uz priekšu, uz otru pusi, atpakaļ. / Pakāpeniski palielini amplitūdu, tad maini virzienu.
- Ошибки: Visa ķermeņa griešana iegurņa vietā. / Strauji, ātri apļi. / Taisni, «bloķēti» ceļi.
- Безопасность: Ja sāp mugura, samazini amplitūdu.

### w_legsw — Махи ногами
- Основные: Сгибатели бедра, задняя поверхность бедра → **Gūžas saliecēji, augšstilba aizmugure**
- Вспомогательные: Ягодичные, приводящие и отводящие мышцы бедра → **Sēžas muskuļi, augšstilba pievilcēji un atvilcēji**
- Описание: Динамическая растяжка ног перед приседаниями, выпадами и тягами. В разминке — 10 махов вперёд-назад и 10 в стороны каждой ногой. → **Dinamiska kāju stiepšana pirms pietupieniem, izklupieniem un vilkmēm. Iesildīšanā — 10 vēzieni uz priekšu-atpakaļ un 10 uz sāniem ar katru kāju.**
- Шаги: Nostājies ar sānu pret balstu un turies pie tā ar roku. / Ķermenis taisns, balsta kāja nedaudz saliekta. / Brīvi vēzē kāju uz priekšu-atpakaļ, tad uz sāniem sev priekšā. / Sāc ar mazu amplitūdu un pakāpeniski palielini; maini kāju.
- Ошибки: Rāvieni un kājas mešana ar spēku. / Muguras saliekšana un ķermeņa noliekšana. / Pārāk liela amplitūda jau no pirmā vēziena.
- Безопасность: Vēzē bez sāpēm; amplitūda — līdz vieglai stiepšanas sajūtai.

### w_glb — Ягодичный мост лёжа
- Основные: Большая ягодичная → **Lielais sēžas muskulis**
- Вспомогательные: Задняя поверхность бедра, мышцы-разгибатели спины → **Augšstilba aizmugure, muguras iztaisnotāji**
- Описание: Активирует ягодичные перед приседаниями и тягами. В разминке — 10 повторений. → **Aktivizē sēžas muskuļus pirms pietupieniem un vilkmēm. Iesildīšanā — 10 atkārtojumi.**
- Шаги: Apgulies uz muguras, ceļi saliekti, pēdas uz grīdas gūžu platumā, rokas gar sāniem. / Sasprindzini vēdera presi un atspiedies ar papēžiem. / Izelpā cel iegurni, saspiežot sēžas muskuļus, līdz taisnai līnijai pleci–iegurnis–ceļi. / Paturi 1 s un vienmērīgi nolaid iegurni līdz grīdai.
- Ошибки: Muguras lejasdaļas izliekšana augšā sēžas muskuļu darba vietā. / Atspiešanās uz purngaliem papēžu vietā. / Ceļi sakrīt uz iekšu.

### w_gm — Наклоны «гуд-морнинг» без веса
- Основные: Задняя поверхность бедра, ягодичные → **Augšstilba aizmugure, sēžas muskuļi**
- Вспомогательные: Мышцы-разгибатели спины → **Muguras iztaisnotāji**
- Описание: Учит движению «от таза» и разогревает заднюю цепь перед становой и румынской тягой. В разминке — 10 повторений. → **Māca kustību «no gurniem» un iesilda aizmugurējo ķēdi pirms becvilkmes un rumāņu vilkmes. Iesildīšanā — 10 atkārtojumi.**
- Шаги: Pēdas gūžu platumā, ceļi nedaudz saliekti, rokas sakrustotas uz krūtīm vai aiz galvas. / Mugura taisna, skatiens uz priekšu-leju. / Virzi gurnus atpakaļ un noliec ķermeni ar taisnu muguru līdz vieglai augšstilba aizmugures stiepšanai. / Atgriezies sākuma stāvoklī, virzot gurnus uz priekšu.
- Ошибки: Muguras saliekšana. / Pietupiens noliekšanās vietā (ceļi virzās uz priekšu). / Noliekšanās zemāk, nekā ļauj lokanība.
- Безопасность: Ja sāp mugura, izpildi ar mazāku amplitūdu.

### w_armc — Круги руками
- Основные: Дельтовидные мышцы → **Deltveida muskuļi**
- Вспомогательные: Вращательная манжета плеча, трапециевидные → **Rotatoru manšete, trapecveida muskuļi**
- Описание: Разогревает плечевые суставы перед любой работой на верх тела. В разминке — 10 кругов вперёд и 10 назад. → **Iesilda plecu locītavas pirms jebkura ķermeņa augšdaļas darba. Iesildīšanā — 10 apļi uz priekšu un 10 atpakaļ.**
- Шаги: Nostājies taisni, rokas izplestas uz sāniem plecu augstumā. / Sāc ar maziem apļiem ar taisnām rokām. / Pakāpeniski palielini apļus līdz pilnai amplitūdai. / Maini virzienu: tikpat apļu atpakaļ.
- Ошибки: Strauji vēzieni ar maksimālu amplitūdu uzreiz. / Pleci pacelti pie ausīm. / Muguras lejasdaļas izliekšana.
- Безопасность: Ja plecā klikšķis ar sāpēm — samazini apli.

### w_dislo — Проводка палки или резинки за голову
- Основные: Дельтовидные мышцы, вращательная манжета плеча → **Deltveida muskuļi, rotatoru manšete**
- Вспомогательные: Большая грудная, широчайшие → **Lielais krūšu muskulis, platie muguras muskuļi**
- Описание: Мобилизация плечевых суставов перед жимами. В разминке — 10 повторений. → **Plecu locītavu mobilizācija pirms spiešanas. Iesildīšanā — 10 atkārtojumi.**
- Шаги: Satver nūju vai gumiju ar platu tvērienu sev priekšā uz taisnām rokām. / Sasprindzini vēdera presi, neizliec muguru. / Vienmērīgi pārvieto taisnās rokas pāri galvai un atpakaļ, cik ļauj kustīgums. / Tikpat vienmērīgi atgriez rokas uz priekšu.
- Ошибки: Pārāk šaurs tvēriens — elkoņi saliecas. / Muguras izliekšana plecu darba vietā. / Rāvieni caur sāpēm.
- Безопасность: Bez sāpēm plecos: ja ir diskomforts, paplašini tvērienu.

### w_pa — Разведение рук со сведением лопаток
- Основные: Задние дельты, ромбовидные мышцы → **Aizmugurējie deltveida, rombveida muskuļi**
- Вспомогательные: Средняя часть трапециевидной, вращательная манжета плеча → **Trapecveida muskuļa vidusdaļa, rotatoru manšete**
- Описание: Активирует мышцы, стабилизирующие лопатки, перед жимами и тягами; бережно к плечам. В разминке — 15 повторений. → **Aktivizē lāpstiņu stabilizētājus pirms spiešanas un vilkmēm; saudzīgi pret pleciem. Iesildīšanā — 15 atkārtojumi.**
- Шаги: Nostājies taisni, taisnas rokas sev priekšā plecu augstumā (var ar vieglu gumiju). / Nolaid plecus prom no ausīm. / Izpleta rokas uz sāniem, savelkot lāpstiņas, līdz «T» stāvoklim. / Vienmērīgi atgriez rokas uz priekšu.
- Ошибки: Pacelti pleci. / Roku saliekšana elkoņos. / Muguras izliekšana un ribu izvirzīšana.

### w_scpu — Отжимания лопатками
- Основные: Передняя зубчатая мышца → **Priekšējais zobainais muskulis**
- Вспомогательные: Ромбовидные, трапециевидные → **Rombveida, trapecveida muskuļi**
- Описание: Включает мышцы-стабилизаторы лопаток перед жимами и отжиманиями. В разминке — 10 повторений. → **Iesaista lāpstiņu stabilizētājus pirms spiešanas un atspiešanās. Iesildīšanā — 10 atkārtojumi.**
- Шаги: Nostājies balstā uz taisnām rokām (var no ceļiem), ķermenis taisns. / Nesaliecot elkoņus, nolaid krūtis, savelkot lāpstiņas. / Atgrūdies no grīdas, izpletot lāpstiņas un nedaudz noapaļojot muguras augšdaļu. / Kustas tikai lāpstiņas — amplitūda dažus centimetrus.
- Ошибки: Elkoņu saliekšana — sanāk parasta atspiešanās. / Iegurņa nokāršanās. / Nolaista galva.
- Безопасность: Ja sāp plaukstu locītavas, balsties uz dūrēm vai no ceļiem.

### w_catcow — Кошка-корова
- Основные: Мышцы-разгибатели спины, мышцы пресса → **Muguras iztaisnotāji, vēdera preses muskuļi**
- Вспомогательные: Ягодичные, мышцы плечевого пояса → **Sēžas muskuļi, plecu joslas muskuļi**
- Описание: Мягкая мобилизация позвоночника перед тягами и упражнениями на спину. В разминке — 8 повторений. → **Maiga mugurkaula mobilizācija pirms vilkmēm un muguras vingrinājumiem. Iesildīšanā — 8 atkārtojumi.**
- Шаги: Nostājies četrrāpus: plaukstas zem pleciem, ceļi zem gurniem. / Izelpā izliec muguru uz augšu, zodu pie krūtīm, iegurni pagriežot zem sevis. / Ieelpā vienmērīgi ieliecies: krūtis uz priekšu, skatiens uz priekšu, iegurnis uz augšu. / Kusties lēnām, elpošanas ritmā.
- Ошибки: Strauja kustība. / Kustība tikai jostasvietā, nevis visā mugurā. / Svara pārnešana uz rokām.
- Безопасность: Ja sāp mugura, strādā mazākā amplitūdā.

### w_scpull — Подтягивания лопатками
- Основные: Нижняя часть трапециевидной, широчайшие → **Trapecveida muskuļa apakšdaļa, platie muguras muskuļi**
- Вспомогательные: Ромбовидные, мышцы предплечья → **Rombveida muskuļi, apakšdelma muskuļi**
- Описание: Включает мышцы спины и стабилизирует плечи перед подтягиваниями и тягами. В разминке — 8 повторений. → **Iesaista muguras muskuļus un stabilizē plecus pirms pievilkšanās un vilkmēm. Iesildīšanā — 8 atkārtojumi.**
- Шаги: Pakāries pie stieņa uz taisnām rokām, tvēriens nedaudz platāks par pleciem. / Nesaliecot elkoņus, nolaid plecus un savelc lāpstiņas — ķermenis pacelsies pāris centimetrus. / Paturi 1 s. / Vienmērīgi atgriezies pilnā karā.
- Ошибки: Roku saliekšana — sākas parasta pievilkšanās. / Ķermeņa šūpošana. / Strauja «nomešanās» karā.
- Безопасность: Ja sāp pleci, sāc ar kājām uz grīdas (daļējs kārs).

### w_bandrow — Лёгкая тяга к поясу
- Основные: Широчайшие, ромбовидные → **Platie muguras muskuļi, rombveida muskuļi**
- Вспомогательные: Задние дельты, бицепс → **Aizmugurējie deltveida, bicepss**
- Описание: Разогревает мышцы спины перед основными тягами. В разминке — 12 повторений с резинкой или малым весом блока. → **Iesilda muguras muskuļus pirms galvenajām vilkmēm. Iesildīšanā — 12 atkārtojumi ar gumiju vai nelielu trenažiera svaru.**
- Шаги: Nostiprini gumiju krūšu vai vidukļa augstumā (vai satver trenažiera rokturi ar nelielu svaru). / Nostājies taisni, ceļi nedaudz saliekti, rokas izstieptas uz priekšu. / Velc rokturus pie vidukļa, savelkot lāpstiņas un virzot elkoņus gar ķermeni. / Vienmērīgi iztaisno rokas, nezaudējot stāju.
- Ошибки: Rāvieni ar ķermeni atpakaļ. / Pacelti pleci. / Pārāk liela pretestība iesildīšanai.


## v30 library cards (need review)

`cards.js` adds 93 exercises. Latvian names, muscles and technique (`LIB_LV` / `TECH_LV` entries and the `DICT` name rows pushed from that file) are drafts and need a native speaker. Also new UI strings: «Заминка» → Atdzišana, «Анимация в разработке» → Animācija tiek izstrādāta. The horizontal machine-press wording for existing `mch` in `i18n/lib.lv.js` and `i18n/tech.lv.js` needs the same review.

## v23 additions (need review)

Account and sync (`i18n/dict3.js`, `sync.js`, `legal.js`):

- ☁️ Аккаунт и синхронизация → **Konts un sinhronizācija**
- Без входа всё остаётся только на этом устройстве. После входа программа, история, рекорды и настройки копируются в облако (серверы в ЕС) и не затирают то, что уже есть. → **Bez ieiešanas viss paliek tikai šajā ierīcē. Pēc ieiešanas programma, vēsture, rekordi un iestatījumi tiek kopēti mākonī (ES serveri) un nepārraksta to, kas jau ir.**
- Войти / Создать аккаунт / Войти по ссылке на почту / Забыли пароль? → **Ieiet / Izveidot kontu / Ieiet ar e-pasta saiti / Aizmirsi paroli?**
- На iPhone в приложении с домашнего экрана надёжнее вход с паролем: ссылка из письма откроется в Safari. → **iPhone lietotnē no sākuma ekrāna drošāk ieiet ar paroli: e-pasta saite atvērsies Safari.**
- Синхронизировать сейчас / Выйти → **Sinhronizēt tagad / Iziet**
- Выход не удаляет данные на этом устройстве. … Фото тела остаются на устройстве. → **Iziešana neizdzēš datus šajā ierīcē. … Ķermeņa foto paliek ierīcē.**
- Анонимная аналитика / Короткие события (открытие, онбординг, показ оплаты) без имени, почты и тренировок → **Anonīma analitika / Īsi notikumi (atvēršana, ievadanketa, apmaksas ekrāns) bez vārda, e-pasta un treniņiem**
- Если войдёшь в аккаунт, они синхронизируются с облаком в ЕС. → **Ja ieiesi kontā, tie sinhronizēsies ES mākonī.**
- Consent extras: «На этом устройстве данные хранятся в браузере.» / cloud + photos note / «Анонимную аналитику можно включить отдельно в «Ещё».»
- Legal drafts (`LEGAL.lv` sections 3–4): guest vs EU Supabase account, body measurements only with consent, photos stay local, opt-in analytics events (install, app_open, onboarding_done, paywall_shown, trial_start, purchase, cancel).

## P-305b Premium model v3: 14-day demo without card, free diary, subscription (need review, D-216)

Rows at the end of `i18n/dict3.js` (comment «P-305b»). The P-305 v1 rows (arrows «Пора прибавить ↑», 90-day/8-week Free limits, store trial «Попробовать 14 дней бесплатно») were removed.

- 14 дней бесплатно, без карты → **14 dienas bez maksas, bez kartes**
- Отсчёт начнётся с первой завершённой тренировки. → **Atskaite sāksies ar pirmo pabeigto treniņu.**
- Демо: осталось дней — → **Demo: atlikušās dienas —**
- Демо закончилось. Дневник тренировок остаётся бесплатным. → **Demo ir beidzies. Treniņu dienasgrāmata paliek bez maksas.**
- Программы тренера по анкете → **Trenera programmas pēc anketas**
- Разминка и заминка → **Iesildīšanās un atsildīšanās**
- Авто-вес, разгрузка и возврат после перерыва → **Auto svars, atslodze un atgriešanās pēc pārtraukuma**
- Видео техники → **Tehnikas video**
- Графики, рекорды и 1ПМ → **Grafiki, rekordi un 1AM**
- Объём по мышцам и обхваты тела → **Apjoms pa muskuļiem un ķermeņa apkārtmēri**
- Всегда бесплатно: → **Vienmēr bez maksas:**
- свой дневник тренировок, запись подходов, прошлый вес и повторы, вся история, «Боль» и ограничения, синхронизация, экспорт CSV, удаление аккаунта, вес тела. → **sava treniņu dienasgrāmata, piegājienu pierakstīšana, iepriekšējais svars un atkārtojumi, visa vēsture, “Sāpes” un ierobežojumi, sinhronizācija, CSV eksports, konta dzēšana, ķermeņa svars.**
- Год — €29,99 → **Gads — €29,99**
- ≈ €2,50/мес → **≈ €2,50/mēn.**
- Месяц — €4,99 → **Mēnesis — €4,99**
- Отмена в любой момент → **Atcelt jebkurā brīdī**
- Оформить подписку → **Abonēt**
- Оплата пока не подключена, деньги не списываются. → **Maksājumi vēl nav pieslēgti, nauda netiek iekasēta.**
- €29,99 в год. → **€29,99 gadā.**
- €4,99 в месяц. → **€4,99 mēnesī.**
- Посмотреть Premium → **Skatīt Premium**
- Сейчас всё открыто бесплатно. → **Pašlaik viss ir atvērts bez maksas.**
- Демо-режим: после демо (бесплатно). → **Demo režīms: pēc demo (bez maksas).**
- Демо-режим: подписка. → **Demo režīms: abonements.**
- Демо-режим: идут 14 дней демо. → **Demo režīms: notiek 14 dienu demo.**
- Демо-режим: до конца демо 2 дня. → **Demo režīms: līdz demo beigām 2 dienas.**
- 14 дней бесплатно, без карты — с первой тренировки. → **14 dienas bez maksas, bez kartes — no pirmā treniņa.**
- Демо закончилось. Дневник — бесплатно. → **Demo ir beidzies. Dienasgrāmata — bez maksas.**
- Подписка активна. → **Abonements ir aktīvs.**
- Доступно по подписке. Подробнее — после тренировки. → **Pieejams ar abonementu. Sīkāk — pēc treniņa.**
- Видео техники — по подписке → **Tehnikas video — ar abonementu**
- 🔒 Видео техники — по подписке → **🔒 Tehnikas video — ar abonementu**
- Обхваты тела и тренды — по подписке → **Ķermeņa apkārtmēri un tendences — ar abonementu**
- 🔒 Обхваты — по подписке → **🔒 Apkārtmēri — ar abonementu**
- Обхваты, % жира и фото — по подписке. → **Apkārtmēri, tauku % un foto — ar abonementu.**
- Графики и расчётный 1ПМ — по подписке → **Grafiki un aprēķinātais 1AM — ar abonementu**
- 🔒 График 1ПМ — по подписке → **🔒 1AM grafiks — ar abonementu**
- Программы тренера по анкете — по подписке. Бесплатно: свой дневник тренировок. → **Trenera programmas pēc anketas — ar abonementu. Bez maksas: sava treniņu dienasgrāmata.**
- 🔒 По подписке → **🔒 Ar abonementu**
- Своя тренировка → **Savs treniņš**
- 📓 Мой дневник → **📓 Mana dienasgrāmata**
- Записывай свои тренировки бесплатно: выбери упражнения из списка и вводи подходы — прошлый вес и повторы подставятся сами. → **Pieraksti savus treniņus bez maksas: izvēlies vingrinājumus no saraksta un ievadi piegājienus — iepriekšējais svars un atkārtojumi tiks ievietoti automātiski.**
- ▶ Начать свою тренировку → **▶ Sākt savu treniņu**
- Программа тренера, авто-вес, разминка, заминка и видео техники — по подписке. Последнюю программу можно посмотреть в разделе «Программа». → **Trenera programma, auto svars, iesildīšanās, atsildīšanās un tehnikas video — ar abonementu. Pēdējo programmu var apskatīt sadaļā “Programma”.**
- 🔒 Подробнее о подписке → **🔒 Par abonementu**
- Программа тренера по анкете — по подписке → **Trenera programma pēc anketas — ar abonementu**
- 🔐 Войди в аккаунт → **🔐 Ienāc kontā**
- 14 дней бесплатно, без карты — отсчёт с первой завершённой тренировки. С аккаунтом демо и история сохранятся при переустановке и на другом устройстве. Можно и без входа. → **14 dienas bez maksas, bez kartes — skaitot no pirmā pabeigtā treniņa. Ar kontu demo un vēsture saglabāsies pēc pārinstalēšanas un citā ierīcē. Var turpināt arī bez ienākšanas.**
- Только просмотр: программы тренера — по подписке. Свои тренировки записывай бесплатно на вкладке «Сегодня». → **Tikai skatīšanai: trenera programmas — ar abonementu. Savus treniņus pieraksti bez maksas cilnē “Šodien”.**
- Объём по мышцам — по подписке → **Apjoms pa muskuļiem — ar abonementu**
- 🔒 Объём по мышцам — по подписке → **🔒 Apjoms pa muskuļiem — ar abonementu**
- Графики и рекорды → **Grafiki un rekordi**
- Графики, рекорды, 1ПМ и объём по мышцам — по подписке. Вся история тренировок бесплатно — в разделе «История». → **Grafiki, rekordi, 1AM un apjoms pa muskuļiem — ar abonementu. Visa treniņu vēsture bez maksas — sadaļā “Vēsture”.**
- Приложение предложило прибавить вес. Точный авто-вес остаётся в подписке после 14 дней демо. → **Lietotne ieteica palielināt svaru. Precīzs auto svars pēc 14 dienu demo paliek abonementā.**
- Уже 3 тренировки! Программа тренера, авто-вес и видео техники остаются в подписке после 14 дней демо. → **Jau 3 treniņi! Trenera programma, auto svars un tehnikas video pēc 14 dienu demo paliek abonementā.**
- Демо заканчивается через 2 дня. Дальше — бесплатный дневник или подписка. → **Demo beigsies pēc 2 dienām. Pēc tam — bezmaksas dienasgrāmata vai abonements.**

## P-305c Premium screen subtitle after the demo (need review, D-216)

Rows at the end of `i18n/dict3.js` (comment «P-305c»).

- Дневник остаётся бесплатным → **Dienasgrāmata paliek bez maksas**


## Prelaunch batch: D-208 calories, P-306 CSV export (need review, D-216)

Rows in `i18n/dict3.js` near «ккал, примерно».

- ккал, примерно → **kcal, aptuveni**
- Вес нужен для примерной оценки калорий. Оба поля необязательны и хранятся на устройстве. → **Svars vajadzīgs aptuvenam kaloriju novērtējumam. Abi lauki nav obligāti un glabājas šajā ierīcē.**
- ⬇ Экспорт CSV (история тренировок) → **⬇ Eksportēt CSV (treniņu vēsture)**
- Таблица для Excel/Google Таблиц. Работает без интернета и без аккаунта. → **Tabula Excel/Google izklājlapām. Darbojas bez interneta un bez konta.**
- CSV headers: Упражнение → **Vingrinājums**, ID упражнения → **Vingrinājuma ID**, Подход → **Pieeja**, Секунды → **Sekundes**, Оценка → **Vērtējums**, да → **jā**
