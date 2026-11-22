# Новые LV-строки: C-113 (описания упражнений)

Нужна проверка носителем (Claude + Grok после PR). В `LV-проверка.xlsx` и `LV-REVIEW.md` не добавлялись. Формат: было → стало.

## Новый заголовок (словарь)

| RU | EN | LV |
|---|---|---|
| Амплитуда и безопасность | Range and safety | Amplitūda un drošība |

Используется вместо «Безопасность» / «Safety» / «Drošība» у 45 упражнений из `changes-v2.md`.

## Глоссарий (замены по всему LV)

| Было | Стало |
|---|---|
| dorsālā fleksija / plantārā fleksija (в шагах) | pacel pirkstgalus / pacelies pirkstgalos |
| lendmain… | stūra stieņa … |
| pustupien… | puspietupien… |
| svaru bumb… / svara bumb… | svarbumb… |
| Ahileja cīpsl… | Ahilleja cīpsl… |
| knābjveida–pleca muskulis | knābjveida-augšdelma muskulis |
| virsaizsmailes muskulis | virsšķautnes muskulis |
| jostas kvadrātmuskul… | jostas kvadrātveida muskul… |

Не меняли: `plekstveida muskulis`, `kardio`, `ceturtdaļpietupiens`, `aizāķē stieni`, `drošības balsti`, `augšdelma muskulis`, `rumpja muskuļi`.

После ревью Claude эти формулировки убраны из всех LV-строк приложения (не только из шагов). Проверка: в LV нет «dorsāl» / «plantār».

## Доработка после ревью Claude (dorsāl / plantār)

Все оставшиеся LV-вхождения (мышцы и безопасность) переписаны простыми словами. Других вхождений в LV-строках не было.

| id | Поле | Было | Стало |
|---|---|---|---|
| box-jump | libLv мышцы | Ikri (plantārā fleksija atgrūšanās brīdī) | Ikri (atgrūšanās no pirkstgaliem) |
| seated-calf | techLv амплитуда | Pilna dorsālā un plantārā fleksija ar fiksētu celi ap 90°. | Pilna amplitūda: lejā nolaid papēžus līdz ikru stiepumam, augšā pacelies uz pirkstgaliem; ceļi paliek saliekti ap 90°. |
| smith-calf | techLv шаг | Papēži nolaižas (pacel pirkstgalus), tad pacelies pirkstgalos līdz galam. | Nolaid papēžus līdz ikru stiepumam, tad pacelies uz pirkstgaliem līdz galam. |
| smith-calf | techLv амплитуда | Pilna dorsālā un plantārā fleksija uz platformas, Ahilleja cīpslas bezsāpju diapazonā. | Pilna amplitūda uz platformas: lejā nolaid papēžus līdz ikru stiepumam, augšā pacelies uz pirkstgaliem, bez sāpēm Ahilleja cīpslā. |
| ankle-knee-to-wall | libLv «для чего» | Potītes dorsālās fleksijas mobilizācija pirms… | Potītes kustīguma uzlabošana pirms… |
| tibialis-raise | techLv шаг | …pirkstgali ceļas pret sevi (pacel pirkstgalus). | Papēži paliek uz grīdas, pievelc pirkstgalus pret sevi. |
| tibialis-raise | techLv амплитуда | …līdz maksimālai bezsāpju dorsālajai fleksijai. | …līdz maksimālai pirkstgalu pievilkšanai pret sevi bez sāpēm. |
| deep-squat-hold | libLv мышцы | (potītes dorsālfleksija) | (stiepjas, saliecot potīti) |


## Словарь (новые или изменённые тройки)

| RU | LV было | LV стало |
|---|---|---|
| Ягодичный мост с опорой спиной на скамью (хип-траст) | — | Gūžas pacelšana pie sola |
| Жим в тренажёре сидя (горизонтальный) | Krūšu muskuļu spiešana horizontālajā trenažierī sēdus. | Krūšu muskuļu spiešana horizontālajā trenažierī sēdus |
| Ягодичный мост с опорой спиной на скамью (хип-траст) на одной ноге | — | Gūžas pacelšana guļus uz vienas kājas |
| Амплитуда и безопасность | — | Amplitūda un drošība |
| Тяга штанги к груди широким хватом | — | Stieņa vilkme pie krūtīm ar platu tvērienu |
| Ягодичный мост с опорой спиной на скамью (хип-траст) лёжа | — | Gūžas pacelšana guļus |
| Гири, кг (через запятую; дробные — через точку) | Svaru bumbas, kg (ar komatu; daļskaitļi ar punktu) | Svarbumbas, kg (ar komatu; daļskaitļi ar punktu) |

## Поля упражнений: 507 изменений LV (было → стало)

### `adductor-stretch`

**tech.safety**

- Было: Ar ceļu ierobežojumu — maza amplitūda; ja sāp, nedari.
- Стало: Ja traucē ceļi, neliela amplitūda; ja sāp, neizpildi.

### `air-bike`

**lib.primary**

- Было: Četrgalvainais un sēžas muskuļi; priekšējie deltveida un platie muguras muskuļi uz kustīgajiem rokturiem.
- Стало: Četrgalvainais muskulis un sēžas muskuļi; priekšējie deltveida un platie muguras muskuļi uz kustīgajiem rokturiem.

**lib.secondary**

- Было: Augšstilba aizmugure; tricepss un krūtis, spiežot rokturus; korpuss.
- Стало: Augšstilba aizmugure; tricepss un krūtis, spiežot rokturus; rumpja muskuļi.

**tech.safety**

- Было: Pilns pedāļu aplis un pilns rokturu gājiens, ceļiem ne pret ko neatsitoties.
- Стало: Pilns pedāļu aplis un pilns rokturu gājiens, ceļiem ne pret ko neatsitoties. Noregulē sēdekli, lai ceļi neaizskartu rokturus; pēc intervāla neapstājies pēkšņi — turpini viegli mīt.

### `ankle-circles`

**lib.primary**

- Было: Apakšstilba muskuļi, potīte
- Стало: Apakšstilba muskuļi (priekšējais lielā lielakaula, lielakaula, ikru, plekstveida); potītes locītavas kustīgums

### `ankle-knee-to-wall`

**lib.primary**

- Было: Plekstveida muskulis un Ahileja cīpsla priekšējai kājai (stiepjas, kad ceļš saliekts); potītes locītavas kapsula.
- Стало: Plekstveida muskulis un Ahilleja cīpsla priekšējai kājai (stiepjas, kad ceļš saliekts); potītes locītavas kapsula.

**tech.safety**

- Было: Ceļš uz priekšu līdz brīdim, kad papēdis gandrīz atraujas, bez sāpēm potītes priekšpusē. Ar svaigu potītes traumu neveikt.
- Стало: Ceļš uz priekšu līdz brīdim, kad papēdis gandrīz atraujas, bez sāpēm potītes priekšpusē. Ar svaigu potītes traumu nedari.

### `assisted-pullup`

**lib.secondary**

- Было: Bicepss; aizmugurējie deltveida; rombveida; apakšējie trapecveida; korpuss.
- Стало: Bicepss; aizmugurējie deltveida; rombveida; apakšējie trapecveida; rumpja muskuļi.

**tech.steps**

- Было: Tvēriens no augšas nedaudz platāks par pleciem, kā pievilkšanās. Gumija uz stieņa, pēdas vai ceļi cilpā, vai ceļi uz gravitrona platformas. Pleci viegli nolaisti, bez šūpošanās.<br>Tā pati trajektorija kā pievilkšanās: elkoņi lejup un atpakaļ, krūtis pret stieni. Palīdzība atslogo ķermeņa svaru; vilkmi dari tu pats.<br>Zods virs stieņa. Nolaidies kontrolēti līdz gandrīz taisnām rokām.<br>Variants: Gumija (pēdas vai ceļi cilpā) vai gravitron (ceļi uz platformas).
- Стало: Tvēriens no augšas nedaudz platāks par pleciem, kā pievilkšanās. Gumija uz stieņa, pēdas vai ceļi cilpā, vai ceļi uz gravitrona platformas. Pleci viegli nolaisti, bez šūpošanās.<br>Tāda pati trajektorija kā pievilkšanās: elkoņi uz leju un atpakaļ, krūtis pie stieņa. Palīdzība tikai atvieglo svaru — velc tu pats, ar muguru.<br>Zods virs stieņa. Nolaidies kontrolēti līdz gandrīz taisnām rokām.<br>Variants: Gumija (pēdas vai ceļi cilpā) vai gravitron (ceļi uz platformas). Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: No gandrīz pilnas karāšanās līdz zodam virs stieņa. Gumiju vai gravitrona svaru izvēlies tā, lai amplitūda paliktu pilna.
- Стало: No gandrīz pilnas karāšanās līdz zodam virs stieņa. Gumiju vai gravitrona svaru izvēlies tā, lai amplitūda paliktu pilna. Pārbaudi, vai gumija nav ieplīsusi un ir droši nostiprināta; izkāp no cilpas, stāvot uz balsta.

### `backpack-row`

**lib.secondary**

- Было: Deltveida muskuļa mugurējā daļa, bicepss, muguras iztaisnotāji (slīpuma noturēšana)
- Стало: Deltveida muskuļa mugurējā daļa, bicepss, muguras iztaisnotājmuskuļi (slīpuma noturēšana)

**tech.safety**

- Было: No taisnām rokām līdz soma pieskaras vēderam, rumpis nekustīgs. Saturu sakārto cieši; lences veselas. Ar ierobežojumu "mugura" — aizstāj ar vilkmi ar dvieli durvju ailā.
- Стало: Saturu saliec cieši, lences veselas; mugura neitrāla. Ja traucē mugura, aizstāj ar dvieļa vilkmi durvju ailē.

### `band-pulldown`

**tech.steps**

- Было: Piestiprini gumiju aizvērtu durvju augšā (durvju enkurs), nometies ceļos ar seju pret durvīm un satver galus ar taisnām rokām.<br>Nolaid plecus un savelc lāpstiņas uz leju.<br>Velc elkoņus lejup gar sāniem, līdz plaukstas ir pie pleciem vai krūtīm.<br>Lēni atgriezies, rokas gandrīz taisnas; 8–15 atkārtojumi.
- Стало: Piestiprini gumiju aizvērtu durvju augšā (durvju enkurs), nometies ceļos ar seju pret durvīm un satver galus ar taisnām rokām.<br>Nolaid plecus un savelc lāpstiņas uz leju.<br>Velc elkoņus lejup gar sāniem, līdz plaukstas ir pie pleciem vai krūtīm.<br>Lēni atgriezies, rokas gandrīz taisnas; 8–15 atkārtojumi. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

### `bc`

**tech.steps**

- Было: Stāvi taisni, apakšējais tvēriens plecu platumā.<br>Elkoņi piespiesti korpusam.<br>Izelpojot saliec rokas, ceļot stieni pie pleciem.<br>Lēni nolaid līdz taisnām rokām.
- Стало: Stāvi taisni, apakšējais tvēriens plecu platumā.<br>Elkoņi piespiesti rumpim.<br>Izelpojot saliec rokas, ceļot stieni pie pleciem.<br>Lēni nolaid līdz taisnām rokām.

**tech.errors**

- Было: Korpusa šūpošana.<br>Elkoņi aiziet uz priekšu.<br>Nepilna iztaisnošana.
- Стало: Rumpja šūpošana.<br>Elkoņi aiziet uz priekšu.<br>Nepilna iztaisnošana.

**tech.safety**

- Было: —
- Стало: Bez rumpja rāvieniem un jostasvietas ieliekuma; ja sāp plaukstas locītavas vai elkoņi — EZ stienis.

### `bd`

**lib.secondary**

- Было: Priekšējie deltveida, krūtis
- Стало: Deltveida muskuļa priekšējā daļa, lielais krūšu muskulis (mazāk nekā uz līdztekām)

### `bdog`

**lib.primary**

- Было: Muguras taisnotāji, sēžas muskuļi
- Стало: Muguras iztaisnotājmuskuļi, sēžas muskuļi

**lib.secondary**

- Было: Vēdera prese, pleci
- Стало: Vēdera muskuļi, pleci

**lib.why**

- Было: Korpusa stabilitātes un koordinācijas vingrinājums; maigi stiprina muguru.
- Стало: Rumpja stabilitātes un koordinācijas vingrinājums; maigi stiprina muguru.

**tech.steps**

- Было: Nostājies četrrāpus, mugura neitrāla.<br>Prese sasprindzināta.<br>Izstiep pretējo roku un kāju līdz korpusa līnijai.<br>Aizturi 1–2 s, atgriezies, maini pusi.
- Стало: Nostājies četrrāpus, mugura neitrāla.<br>Vēdera muskuļi sasprindzināti.<br>Izstiep pretējo roku un kāju līdz rumpja līnijai.<br>Aizturi 1–2 s, atgriezies, maini pusi. Elpo vienmērīgi, neaizturi elpu.

**tech.safety**

- Было: —
- Стало: Iegurnis taisns, jostasvieta neieliecas; ja sāp — tikai roka vai tikai kāja.

### `box-jump`

**lib.primary**

- Было: Četrgalvainais; sēžas muskuļi (sprādzienveida gūžu un ceļu atliekšana).
- Стало: Četrgalvainais muskulis; sēžas muskuļi (sprādzienveida gūžu un ceļu atliekšana).

**lib.secondary**

- Было: Ikri (plantārā fleksija atgrūšanās brīdī); augšstilba aizmugure; korpuss (stabilizācija piezemējoties).
- Стало: Ikri (plantārā fleksija atgrūšanās brīdī); augšstilba aizmugure; rumpja muskuļi (stabilizācija piezemējoties).

**tech.steps**

- Было: Ar seju pret kasti, pēdas apmēram gurnu platumā, rumpis viegli noliekts, rokas gatavas vēzienam. Kastes augstums ir tāds, lai varētu mīksti piezemēties ceturtdaļpietupienā ar visu pēdu uz virsmas.<br>Neliela pretkustība ceturtdaļpietupienā, roku vēziens, tad sprādzienveida iztaisnošana gūžās, ceļos un potītēs. Piezemēšanās uz kastes ir mīksta, ceturtdaļpietupienā: gurni atpakaļ, ceļi pirkstgalu virzienā, visa pēda uz kastes, papēži nekarājas pāri malai.<br>Iztaisnošanās uz kastes līdz stabilai stājai. Nokāpšana ar soli, nevis lēciens lejā: lēciens lejā dod lielu ekscentrisku slodzi Ahileja cīpslai un ceļiem.
- Стало: Nostājies ar seju pret kasti, pēdas gurnu platumā.<br>Izvēlies augstumu, uz kura piezemējies mīksti ceturtdaļpietupienā.<br>Pietupies puspietupienā, vēzējot rokas atpakaļ.<br>Spēcīgi iztaisnojies un lec, vēzējot rokas uz priekšu.<br>Piezemējies mīksti uz visas pēdas, ceļi pirkstgalu virzienā.<br>Iztaisnojies un nokāp ar soli, nelec lejā.

**tech.safety**

- Было: Drošs augstums ir tāds, kādā piezemējums paliek mīksts ceturtdaļpietupienā, krūtis augšā, abas pēdas pilnībā uz kastes. Nepalielināt kastes augstumu uz tehnikas rēķina.
- Стало: Drošs augstums ir tāds, kādā piezemējums paliek mīksts ceturtdaļpietupienā, krūtis augšā, abas pēdas pilnībā uz kastes. Nepalielināt kastes augstumu uz tehnikas rēķina. Liela trieciena slodze ceļiem un Ahilleja cīpslai: ja sāp ceļi, potīte vai Ahilleja cīpsla — neizpildi.

### `bp`

**lib.secondary**

- Было: Priekšējie deltveida, tricepss
- Стало: Deltveida muskuļa priekšējā daļa, tricepss; stabilizē priekšējais zobainais muskulis, rotatoru manšete, rombveida muskuļi un trapecveida muskuļa vidusdaļa (notur lāpstiņas).

**tech.steps**

- Было: Apgulies uz sola, acis zem stieņa, pēdas stingri uz grīdas, lāpstiņas savilktas un nolaistas.<br>Tvēriens nedaudz platāks par pleciem, noņem stieni ar taisnām rokām virs pleciem.<br>Ieelpojot kontrolēti (2–3 s) nolaid stieni līdz krūšu vidusdaļai, elkoņi 45–75° pret korpusu.<br>Pieskaries krūtīm bez atsitiena un izelpojot spied augšup, turot lāpstiņas savilktas.
- Стало: Apgulies uz sola, acis zem stieņa, pēdas stingri uz grīdas, lāpstiņas savilktas un nolaistas.<br>Tvēriens nedaudz platāks par pleciem, noņem stieni ar taisnām rokām virs pleciem.<br>Ieelpojot kontrolēti (2–3 s) nolaid stieni līdz krūšu vidusdaļai, elkoņi 45–75° pret rumpi.<br>Pieskaries krūtīm bez atsitiena un izelpojot spied augšup, turot lāpstiņas savilktas.

**tech.errors**

- Было: Stieņa atsitiens no krūtīm.<br>Elkoņi atvērti 90° pret korpusu — slodze pleciem.<br>Iegurnis atraujas no sola.<br>Plaukstas locītavas atliektas atpakaļ.
- Стало: Stieņa atsitiens no krūtīm.<br>Elkoņi atvērti 90° pret rumpi — slodze pleciem.<br>Iegurnis atraujas no sola.<br>Plaukstas locītavas atliektas atpakaļ.

**tech.safety**

- Было: Smagi piegājieni — tikai ar apdrošinātāju vai rāmī ar drošības stieņiem.
- Стало: Smagi piegājieni — tikai ar drošinātāju vai rāmī ar drošības stieņiem.

### `bpl`

**lib.secondary**

- Было: Jostas kvadrātmuskulis, vidējais sēžas muskulis
- Стало: Jostas kvadrātveida muskulis, vidējais sēžas muskulis

**lib.why**

- Было: Statisks vingrinājums korpusa sānu muskuļiem un iegurņa stabilitātei.
- Стало: Statisks vingrinājums rumpja sānu muskuļiem un iegurņa stabilitātei.

**tech.steps**

- Было: Apgulies uz sāniem, elkonis zem pleca.<br>Kājas kopā, ķermenis taisns.<br>Pacel iegurni līdz taisnai līnijai.<br>Noturi noteikto laiku, tad maini pusi.
- Стало: Apgulies uz sāniem, elkonis zem pleca.<br>Kājas kopā, ķermenis taisns.<br>Pacel iegurni līdz taisnai līnijai.<br>Noturi noteikto laiku, tad maini pusi. Elpo vienmērīgi, neaizturi elpu.

**tech.errors**

- Было: Iegurnis nokarājas.<br>Korpuss krīt uz priekšu/atpakaļ.<br>Elpas aizturēšana.
- Стало: Iegurnis nokarājas.<br>Rumpis krīt uz priekšu/atpakaļ.<br>Elpas aizturēšana.

**tech.safety**

- Было: —
- Стало: Ja sāp plecs — no ceļiem (īsa svira).

### `broad-jump`

**lib.primary**

- Было: Sēžas muskuļi; četrgalvainais.
- Стало: Sēžas muskuļi; četrgalvainais muskulis.

**lib.secondary**

- Было: Augšstilba aizmugure; ikri; korpuss.
- Стало: Augšstilba aizmugure; ikri; rumpja muskuļi.

**tech.safety**

- Было: Piezemējies ceturtdaļpietupienā uz abām pēdām, ceļi virzienā uz pirkstiem.
- Стало: Piezemējies ceturtdaļpietupienā uz abām pēdām, ceļi virzienā uz pirkstiem. Liela trieciena slodze ceļiem un Ahilleja cīpslai: ja sāp ceļi, potīte vai jostasvieta — neizpildi.

### `bss`

**lib.primary**

- Было: Četrgalvainais, sēžas muskuļi
- Стало: Četrgalvainais muskulis, sēžas muskuļi

**tech.steps**

- Было: Nostājies ar muguru pret solu, aizmugurējās kājas pirkstgals uz sola.<br>Priekšējā kāja soli uz priekšu.<br>Nolaidies, līdz priekšējās kājas augšstilbs ir paralēls grīdai.<br>Paceļies, atgrūžoties ar priekšējās kājas papēdi.
- Стало: Nostājies ar muguru pret solu, aizmugurējās kājas pirkstgals uz sola.<br>Priekšējā kāja soli uz priekšu.<br>Nolaidies, līdz priekšējās kājas augšstilbs ir paralēls grīdai.<br>Paceļies, atgrūžoties ar priekšējās kājas papēdi. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

### `bwsq`

**lib.primary**

- Было: Četrgalvainais, sēžas muskuļi
- Стало: Četrgalvainais muskulis, sēžas muskuļi

**tech.safety**

- Было: —
- Стало: Dziļums — kamēr papēži uz grīdas un mugura neitrāla; ja sāp ceļgals — mazāks dziļums.

### `cable-crunch`

**lib.why**

- Было: Saliec korpusu pret trosi, lai darbu veic vēdera prese.
- Стало: Saliec rumpi pret trosi, lai darbu veic vēdera muskuļi.

**tech.steps**

- Было: Ceļos ar seju pret augšējo bloku, virve pie galvas vai krūšu augšdaļas.<br>Saliec korpusu uz leju ar vēdera presi; iegurnis paliek samērā nekustīgs.<br>Kontrolēta saliekšana, tad lēna atgriešanās bez jostasvietas ieliekuma.
- Стало: Ceļos ar seju pret augšējo bloku, virve pie galvas vai krūšu augšdaļas.<br>Saliec rumpi uz leju ar vēdera muskuļiem; iegurnis paliek samērā nekustīgs.<br>Kontrolēta saliekšana, tad lēna atgriešanās bez jostasvietas ieliekuma. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.errors**

- Было: Vilkšana ar rokām<br>iegurņa kustība (saliekšana gūžās) korpusa saliekšanas vietā.
- Стало: Vilkšana ar rokām<br>iegurņa kustība (saliekšana gūžās) rumpja saliekšanas vietā.

**tech.safety**

- Было: Korpusa saliekšana ērtā amplitūdā, bez sāpēm jostasvietā.
- Стало: Rumpja saliekšana ērtā amplitūdā, bez sāpēm jostasvietā.

### `cable-external-rotation`

**tech.steps**

- Было: Stāvus sāniski pret bloku elkoņa augstumā. Darba roka ir tālākā no bloka, elkonis piespiests sānam un saliekts 90°, apakšdelms vērsts uz vēderu. Dvielis starp elkoni un sānu palīdz neaizvirzīt plecu no sāna. Trose velk apakšdelmu uz vēderu, tāpēc ārējā rotācija iet pret šo vilkmi.<br>Apakšdelms griežas uz āru ap pleca asi. Plecs un elkonis neaiziet no sāna.<br>Apakšdelms apmēram uz priekšu vai nedaudz uz āru, bez sāpēm. Lēna atgriešanās.
- Стало: Stāvus sāniski pret bloku elkoņa augstumā. Darba roka ir tālākā no bloka, elkonis piespiests sānam un saliekts 90°, apakšdelms vērsts uz vēderu. Dvielis starp elkoni un sānu palīdz neaizvirzīt plecu no sāna. Trose velk apakšdelmu uz vēderu, tāpēc ārējā rotācija iet pret šo vilkmi.<br>Apakšdelms griežas uz āru ap pleca asi. Plecs un elkonis neaiziet no sāna.<br>Apakšdelms apmēram uz priekšu vai nedaudz uz āru, bez sāpēm. Lēna atgriešanās. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: Bezsāpju ārējās rotācijas diapazons, parasti ap 45–90° no vēdera uz priekšu, un tas ir individuāli.
- Стало: Bezsāpju ārējās rotācijas diapazons, parasti ap 45–90° no vēdera uz priekšu, un tas ir individuāli. Svars ļoti viegls, kustība lēna; ja sāp plecs, pārtrauc.

### `cable-overhead-extension`

**tech.steps**

- Было: Stāvus ar muguru pret bloku vai vieglā noliekumā. Virve virs galvas (retāk taisns rokturis), elkoņi vērsti uz augšu un fiksēti pie galvas.<br>Atliekšana tikai elkoņos. Virves gali izplūst uz priekšu un augšu.<br>Gandrīz taisnas rokas virs galvas, bez sitiena. Atgriešanās aiz galvas līdz ērtai saliekšanai.
- Стало: Stāvus ar muguru pret bloku vai vieglā noliekumā. Virve virs galvas (retāk taisns rokturis), elkoņi vērsti uz augšu un fiksēti pie galvas.<br>Atliekšana tikai elkoņos. Virves gali izplūst uz priekšu un augšu.<br>Gandrīz taisnas rokas virs galvas, bez sitiena. Atgriešanās aiz galvas līdz ērtai saliekšanai. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: Aiz galvas līdz iestiepumam bez sāpēm elkonī un plecā, tad līdz gandrīz taisnām rokām.
- Стало: Aiz galvas līdz iestiepumam bez sāpēm elkonī un plecā, tad līdz gandrīz taisnām rokām. Sāc ar vieglu svaru; ja sāp elkonis vai plecs, samazini amplitūdu apakšā.

### `calf-bw`

**tech.steps**

- Было: Nostājies ar vienas pēdas priekšdaļu uz pakāpiena malas, papēdis karājas; līdzsvaram turies pie sienas vai margām.<br>Pacelies uz pirkstgaliem pēc iespējas augstāk, pauze 1 s.<br>Lēni (2–3 s) nolaid papēdi zem pakāpiena malas.<br>Kad 20+ atkārtojumi ir viegli, nolaid lēnāk vai pauzē apakšā.
- Стало: Nostājies ar vienas pēdas priekšdaļu uz pakāpiena malas, papēdis karājas; līdzsvaram turies pie sienas vai margām.<br>Pacelies uz pirkstgaliem pēc iespējas augstāk, pauze 1 s.<br>Lēni (2–3 s) nolaid papēdi zem pakāpiena malas.<br>Kad 20+ atkārtojumi ir viegli, nolaid lēnāk vai pauzē apakšā. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: Pakāpiens stabils, turies pie balsta; ja sāp Ahileja cīpsla, samazini amplitūdu vai nedari.
- Стало: Pakāpiens stabils, turies pie balsta; ja sāp Ahilleja cīpsla, samazini amplitūdu vai nedari.

### `calf-db`

**tech.steps**

- Было: Nostājies ar vienas pēdas priekšdaļu uz pakāpiena malas, papēdis karājas; hantele tās pašas puses rokā, ar otru roku turies pie sienas.<br>Pacelies uz pirkstgaliem pēc iespējas augstāk, pauze 1 s.<br>Lēni (2–3 s) nolaid papēdi zem pakāpiena malas, līdz ikri izstiepjas.<br>Celis gandrīz taisns; izpildi visus atkārtojumus un maini kāju.
- Стало: Nostājies ar vienas pēdas priekšdaļu uz pakāpiena malas, papēdis karājas; hantele tās pašas puses rokā, ar otru roku turies pie sienas.<br>Pacelies uz pirkstgaliem pēc iespējas augstāk, pauze 1 s.<br>Lēni (2–3 s) nolaid papēdi zem pakāpiena malas, līdz ikri izstiepjas.<br>Celis gandrīz taisns; izpildi visus atkārtojumus un maini kāju. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: Ja sāp Ahileja cīpsla vai pēda, samazini amplitūdu; pakāpiens stabils, turies pie sienas.
- Стало: Ja sāp Ahilleja cīpsla vai pēda, samazini amplitūdu; pakāpiens stabils, turies pie sienas.

### `cd_breath`

**lib.why**

- Было: Mierīga elpošana guļus: ieelpa ~4 s, izelpa ~6 s, apmēram 60 s. Aizstāj stiepšanos, ja ir plecu ierobežojums.
- Стало: Mierīga elpošana guļus: ieelpa apmēram 4 s, izelpa apmēram 6 s, apmēram 60 s; palīdz nomierināt pulsu pēc treniņa.

**tech.safety**

- Было: Nav locītavu ierobežojuma. Aizstāj stiepšanos, ja ir plecu ierobežojums.
- Стало: Ja reibst galva, elpo lēnāk un seklāk.

### `cd_quad`

**tech.steps**

- Было: Stāvi pie balsta un turi to ar vienu roku.<br>Saliec kāju, satver pēdu vai potīti un velc papēdi pie gurna.<br>Ceļi blakus, iegurnis viegli iegriezts, korpuss taisns.<br>Turi 30 s, maini kāju.
- Стало: Stāvi pie balsta un turi to ar vienu roku.<br>Saliec kāju, satver pēdu vai potīti un velc papēdi pie gurna.<br>Ceļi blakus, iegurnis viegli iegriezts, rumpis taisns.<br>Turi 30 s, maini kāju.

### `cd_xbody`

**lib.secondary**

- Было: Trapeces vidusdaļa, rombveida muskuļi
- Стало: Trapecveida muskuļa vidusdaļa, rombveida muskuļi

**tech.errors**

- Было: Plecs pie auss.<br>Spiediens uz elkoņa locītavu.<br>Korpusa pagriešana līdzi rokai.
- Стало: Plecs pie auss.<br>Spiediens uz elkoņa locītavu.<br>Rumpja pagriešana līdzi rokai.

### `cgb`

**tech.steps**

- Было: Apgulies uz sola, tvēriens plecu platumā.<br>Elkoņi tuvu korpusam.<br>Ieelpojot nolaid stieni līdz krūšu apakšdaļai.<br>Izelpojot spied augšup.
- Стало: Apgulies uz sola, tvēriens plecu platumā.<br>Elkoņi tuvu rumpim.<br>Ieelpojot nolaid stieni līdz krūšu apakšdaļai.<br>Izelpojot spied augšup.

**tech.safety**

- Было: Smagi — ar apdrošinātāju.
- Стало: Smagus piegājienus izpildi tikai ar drošinātāju vai statnē ar drošības balstiem.

### `chest-supported-1db`

**lib.secondary**

- Было: Aizmugurējais deltveida; bicepss. Atliecēji paliek gandrīz nenoslogoti atbalsta dēļ.
- Стало: Aizmugurējais deltveida; bicepss. Muguras iztaisnotājmuskuļi paliek gandrīz nenoslogoti atbalsta dēļ.

### `chest-supported-2db`

**lib.secondary**

- Было: Aizmugurējie deltveida; bicepss. Muguras atliecēji paliek gandrīz nenoslogoti, jo krūtis ir atbalstītas.
- Стало: Aizmugurējie deltveida; bicepss. Muguras iztaisnotājmuskuļi paliek gandrīz nenoslogoti, jo krūtis ir atbalstītas.

**tech.steps**

- Было: Krūtis uz slīpā sola 30–45°. Abas hanteles karājas, kakls neitrāls.<br>Vienlaicīga abu hanteļu vilkme uz apakšējām ribām, lāpstiņas savilkas.<br>Elkoņi pie sāniem, bez plecu pacelšanas. Lēnām nolaid līdz karājumam.
- Стало: Apgulies ar krūtīm uz sola 30–45° slīpumā, hanteles nokarājas, kakls neitrāls.<br>Izelpojot velc abas hanteles pie apakšējām ribām, savelkot lāpstiņas.<br>Elkoņi pie rumpja, plecus necel; ieelpojot lēni nolaid līdz nokarenam stāvoklim.

**tech.errors**

- Было: Krūtis atraujas no polstera<br>Vilkme uz pleciem<br>Rāviens
- Стало: Krūtis atraujas no sola.<br>Vilkme pie pleciem, nevis pie apakšējām ribām.<br>Rāviens kontrolētas vilkmes vietā.

**tech.safety**

- Было: No karājuma līdz elkoņiem pie sāniem, krūtīm paliekot uz polstera.
- Стало: No karājuma līdz elkoņiem pie sāniem, krūtīm paliekot uz polstera. Krūtis visu laiku uz polstera; ja sāp plecs vai jostasvieta, samazini svaru.

### `chest-wall-stretch`

**tech.safety**

- Было: Ar plecu ierobežojumu — roka zem plecu līmeņa un maza amplitūda; ja sāp, nedari.
- Стало: Ja traucē pleci, roka zemāk par plecu līmeni un neliela amplitūda; ja sāp, neizpildi.

### `chin`

**lib.primary**

- Было: Platākie muguras muskuļi, bicepss
- Стало: Platie muguras muskuļi, bicepss

**tech.safety**

- Было: —
- Стало: Ja sāp elkoņi vai pleci — neitrāls tvēriens vai gumija; nolec maigi uz saliektām kājām.

### `close-pulldown`

**tech.steps**

- Было: Neitrāls V-rokturis, viegls atgāziens, pleci nolaisti.<br>Vilkme uz krūšu augšu vai krūšu kaulu, elkoņi gar sāniem.<br>Rokturis pie krūtīm, tad kontrolēta atgriešanās uz augšu līdz iestiepumam.
- Стало: Apsēdies, augšstilbi zem veltņiem, satver V rokturi, nedaudz atliecies, pleci nolaisti.<br>Izelpojot velc pie krūšu augšdaļas, elkoņi gar rumpi.<br>Ieelpojot kontrolēti atgriez līdz muguras iestiepumam.

**tech.errors**

- Было: Šūpošanās<br>Vilkšana ar rokām, muguru atstājot ārā
- Стало: Rumpja šūpošana.<br>Vilkme tikai ar rokām bez muguras darba.

**tech.safety**

- Было: No gandrīz taisnām rokām līdz rokturim pie krūšu kaula.
- Стало: No gandrīz taisnām rokām līdz rokturim pie krūšu kaula. Atliecies tikai nedaudz, bez šūpošanās; ja sāp plecs, samazini svaru.

### `concentration-curl`

**tech.steps**

- Было: Sēdus, noliekums uz priekšu. Darba rokas elkonis atbalstās pret augšstilba iekšpusi, hantele apakšā, augšdelms vertikāli.<br>Saliekšana tikai elkonī, bez rumpja šūpošanas un nepaceļot elkoni no augšstilba.<br>Pilns saliekums, tad lēna nolaišana līdz gandrīz taisnai rokai.
- Стало: Sēdus, noliekums uz priekšu. Darba rokas elkonis atbalstās pret augšstilba iekšpusi, hantele apakšā, augšdelms vertikāli.<br>Saliekšana tikai elkonī, bez rumpja šūpošanas un nepaceļot elkoni no augšstilba.<br>Pilns saliekums, tad lēna nolaišana līdz gandrīz taisnai rokai. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: No gandrīz taisnas rokas līdz pilnam saliekumam ar fiksētu elkoni.
- Стало: No gandrīz taisnas rokas līdz pilnam saliekumam ar fiksētu elkoni. Nolaid hanteli lēni, bez rāviena apakšā; ja sāp elkonis, samazini svaru.

### `copenhagen-plank`

**lib.secondary**

- Было: Slīpie un jostas kvadrātmuskulis (kā sānu plankā); vidējais sēžas muskulis; korpuss.
- Стало: Slīpie un jostas kvadrātveida muskulis (kā sānu plankā); vidējais sēžas muskulis; rumpja muskuļi.

**tech.steps**

- Было: Sāniski pret solu. Augšējās kājas apakšstilbs ir uz sola, apakšējā kāja karājas. Apakšdelms uz grīdas, ķermenis taisnā līnijā.<br>Noturi sānu planku: iegurnis neiekrīt un neapgāžas uz priekšu vai atpakaļ. Īsa iegurņa nolaišana un pacelšana ir pieņemama.<br>Izej kontrolēti: apakšējā pēda uz grīdas, tad augšējā kāja.<br>Statiska noturēšana.<br>Variants: Vieglāks variants: augšējais celis uz sola (īsāka svira) vai apakšējā pēda uz grīdas.
- Стало: Sāniski pret solu. Augšējās kājas apakšstilbs ir uz sola, apakšējā kāja karājas. Apakšdelms uz grīdas, ķermenis taisnā līnijā.<br>Noturi sānu planku: iegurnis neiekrīt un neapgāžas uz priekšu vai atpakaļ. Īsa iegurņa nolaišana un pacelšana ir pieņemama.<br>Izej kontrolēti: apakšējā pēda uz grīdas, tad augšējā kāja.<br>Statiska noturēšana.<br>Variants: Vieglāks variants: augšējais celis uz sola (īsāka svira) vai apakšējā pēda uz grīdas. Elpo vienmērīgi, neaizturi elpu.

### `cr`

**lib.primary**

- Было: Platākie, rombveida
- Стало: Platie muguras muskuļi, rombveida

**tech.errors**

- Было: Korpusa šūpošana.<br>Apaļa mugura.<br>Pleci paceļas.
- Стало: Rumpja šūpošana.<br>Apaļa mugura.<br>Pleci paceļas.

**tech.safety**

- Было: —
- Стало: Mugura neitrāla, rumpis gandrīz nekustīgs; ja sāp jostasvieta, samazini svaru.

### `cru-machine`

**lib.why**

- Было: Saliec korpusu īsu ceļu pret polsteri.
- Стало: Saliec rumpi īsu ceļu pret polsteri.

**tech.steps**

- Было: Sēdi vēdera preses trenažierī, polsteris uz krūšu augšdaļas vai pleciem, pēdas uz pēdu balstiem.<br>Saliec korpusu caur krūšu mugurkaulu pret pretestību, neraujot ar rokām.<br>Īsa pauze, tad kontrolēta atgriešanās.
- Стало: Sēdi vēdera preses trenažierī, polsteris uz krūšu augšdaļas vai pleciem, pēdas uz pēdu balstiem.<br>Saliec rumpi caur krūšu mugurkaulu pret pretestību, neraujot ar rokām.<br>Īsa pauze, tad kontrolēta atgriešanās. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: Neliela korpusa saliekšanas amplitūda, saudzīga pret jostasvietu.
- Стало: Neliela rumpja saliekšanas amplitūda, saudzīga pret jostasvietu. Svars mērens, bez rāvieniem; ja sāp jostasvieta, pārtrauc.

### `cuban-press`

**tech.steps**

- Было: Stāvus, vieglas hanteles. Sākums kā augstā vilkmē uz krūtīm: elkoņi augstu sānis, apakšdelmi vērsti lejup.<br>Nenolaižot elkoņus, plecus griež uz āru, līdz apakšdelmi nostājas vertikāli (hanteles pie ausīm). Tad spiešana uz augšu.<br>Gandrīz taisnas rokas virs galvas. Atpakaļceļš: nolaist līdz ausīm, rotācija uz iekšu, tad nolaišana kā no vilkmes.
- Стало: Stāvus, vieglas hanteles. Sākums kā augstā vilkmē uz krūtīm: elkoņi augstu sānis, apakšdelmi vērsti lejup.<br>Nenolaižot elkoņus, plecus griež uz āru, līdz apakšdelmi nostājas vertikāli (hanteles pie ausīm). Tad spiešana uz augšu.<br>Gandrīz taisnas rokas virs galvas. Atpakaļceļš: nolaist līdz ausīm, rotācija uz iekšu, tad nolaišana kā no vilkmes. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: No karājuma pie gurniem caur augstiem elkoņiem ar vertikāliem apakšdelmiem līdz gandrīz taisnām rokām virs galvas.
- Стало: No karājuma pie gurniem caur augstiem elkoņiem ar vertikāliem apakšdelmiem līdz gandrīz taisnām rokām virs galvas. Tikai vieglas hanteles; pie sāpēm vai klikšķiem plecā pārtrauc.

### `dbc`

**tech.errors**

- Было: Šūpošanās.<br>Pārāk ātra nolaišana.<br>Elkoņi attālinās no korpusa.
- Стало: Šūpošanās.<br>Pārāk ātra nolaišana.<br>Elkoņi attālinās no rumpja.

**tech.safety**

- Было: —
- Стало: Bez rāvieniem; ja sāp elkonis, samazini svaru.

### `dbp`

**tech.steps**

- Было: Apsēdies, hanteles uz augšstilbiem, apgulies un pacel tās virs krūtīm.<br>Lāpstiņas savilktas, pēdas uz grīdas.<br>Ieelpojot nolaid hanteles pa loku līdz krūšu līmenim, elkoņi ~45–70° pret korpusu.<br>Izelpojot spied augšup, hanteles satuvinās virs krūtīm.
- Стало: Apsēdies, hanteles uz augšstilbiem, apgulies un pacel tās virs krūtīm.<br>Lāpstiņas savilktas, pēdas uz grīdas.<br>Ieelpojot nolaid hanteles pa loku līdz krūšu līmenim, elkoņi ~45–70° pret rumpi.<br>Izelpojot spied augšup, hanteles satuvinās virs krūtīm.

### `dbr`

**lib.primary**

- Было: Platākie muguras muskuļi
- Стало: Platie muguras muskuļi

**tech.steps**

- Было: Atbalsti ceļgalu un roku uz sola, mugura taisna, paralēli grīdai.<br>Hantele brīvajā rokā.<br>Izelpojot velc hanteli pie jostas, elkonis gar korpusu.<br>Lēni nolaid līdz pilnam stiepumam.
- Стало: Atbalsti ceļgalu un roku uz sola, mugura taisna, paralēli grīdai.<br>Hantele brīvajā rokā.<br>Izelpojot velc hanteli pie jostas, elkonis gar rumpi.<br>Lēni nolaid līdz pilnam stiepumam.

**tech.errors**

- Было: Korpusa pagriešana.<br>Vilkšana pie krūtīm, nevis pie jostas.<br>Rāvieni.
- Стало: Rumpja pagriešana.<br>Vilkšana pie krūtīm, nevis pie jostas.<br>Rāvieni.

**tech.safety**

- Было: —
- Стало: Mugura neitrāla, atbalsts uz sola stabils; ja sāp jostasvieta — vilkme ar krūšu atbalstu.

### `dbug`

**tech.steps**

- Было: Apgulies uz muguras, rokas uz augšu, kājas saliektas 90°.<br>Jostasvieta piespiesta grīdai.<br>Lēni izstiep pretējo roku un kāju.<br>Atgriezies un maini pusi.
- Стало: Apgulies uz muguras, rokas uz augšu, kājas saliektas 90°.<br>Jostasvieta piespiesta grīdai.<br>Lēni izstiep pretējo roku un kāju.<br>Atgriezies un maini pusi. Elpo vienmērīgi, neaizturi elpu.

**tech.safety**

- Было: —
- Стало: Jostasvieta piespiesta; ja atraujas — samazini roku un kāju amplitūdu.

### `dead-hang`

**lib.secondary**

- Было: Platie muguras muskuļi un apakšējie trapecveida tur plecu viegli nolaistu; korpuss notur iegurni.
- Стало: Platie muguras muskuļi un apakšējie trapecveida tur plecu viegli nolaistu; rumpja muskuļi notur iegurni.

**tech.steps**

- Было: Tvēriens no augšas plecu platumā, pēdas nost no grīdas. Pleci nav pie ausīm: viegla nolaišana uz leju, bez aktīvas vilkšanas augšup.<br>Noturi karāšanos. Elpo vienmērīgi, neizvirzi ribas, un turi kājas mierā.<br>Nostājies uz grīdas vai atbalsta. Nelec uz taisnām kājām.<br>Statiska noturēšana, līdz tvēriens vai plecu stāvoklis sāk zust.
- Стало: Tvēriens no augšas plecu platumā, pēdas atrautas no grīdas. Pleci nav pacelti pie ausīm: viegla nolaišana uz leju, bez aktīvas pievilkšanās.<br>Noturi karāšanos, elpo vienmērīgi, ribas neizspied, kājas mierīgas; turi, kamēr saglabājas tvēriens un plecu stāvoklis.<br>Mīksti nostājies uz grīdas vai balsta, nelec lejā uz taisnām kājām.

**tech.safety**

- Было: Taisnas rokas, bez saliekuma elkoņos. Cik tālu nolaist plecu, ir individuāli: bez sāpēm pleca priekšpusē.
- Стало: Taisnas rokas, bez saliekuma elkoņos. Cik tālu nolaist plecu, ir individuāli: bez sāpēm pleca priekšpusē. Kāp lejā uz balsta, nelec; ja sāp plecs, pārtrauc.

### `decline-db-press`

**tech.steps**

- Было: Sols nolaists uz leju, parasti 15–30°. Pēdas fiksētas, lāpstiņas savilktas, hanteles virs krūšu apakšas vai vidus.<br>Nolaišana uz krūšu apakšas līniju, elkoņi 45–70°. Augšā hanteles satuvinās bez sitiena.<br>Gandrīz taisnas rokas, nezaudējot lāpstiņu savilkumu.
- Стало: Sols nolaists uz leju, parasti 15–30°. Pēdas fiksētas, lāpstiņas savilktas, hanteles virs krūšu apakšas vai vidus.<br>Nolaišana uz krūšu apakšas līniju, elkoņi 45–70°. Augšā hanteles satuvinās bez sitiena.<br>Gandrīz taisnas rokas, nezaudējot lāpstiņu savilkumu. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.errors**

- Было: Pārāk stāvs slīpums, ja asinis stipri sakāpj galvā<br>Lāpstiņas atraujas<br>Hanteļu sitiens
- Стало: Pārāk stāvs sola slīpums (vairāk par 30°).<br>Lāpstiņas atraujas<br>Hanteļu sitiens

**tech.safety**

- Было: Laist lejā līdz krūšu iestiepumam, plecam neizkrītot uz priekšu. Sola slīpums 15–30°.
- Стало: Laid lejā līdz krūšu iestiepumam, plecam neizkrītot uz priekšu. Sola slīpums 15–30°. Apgulies un piecelies ar hantelēm, kas piespiestas pie krūtīm, nemet tās uz sāniem; ja reibst galva vai ir paaugstināts asinsspiediens, izvēlies horizontālu solu.

### `deep-squat-hold`

**lib.primary**

- Было: Četrgalvainais un sēžas muskuļi notur pozīciju izometriski; pievilcēji apakšā stiepjas.
- Стало: Četrgalvainais muskulis un sēžas muskuļi notur pozīciju izometriski; pievilcēji apakšā stiepjas.

**lib.secondary**

- Было: Plekstveida muskulis un ikru muskulis (potītes dorsālfleksija); korpuss tur krūškurvi.
- Стало: Plekstveida muskulis un ikru muskulis (potītes dorsālfleksija); rumpja muskuļi tur krūškurvi.

### `dsp`

**tech.safety**

- Было: —
- Стало: Pēc piegājiena nolaid hanteles uz augšstilbiem; ja sāp plecs, samazini amplitūdu.

### `farmers-walk`

**lib.primary**

- Было: Apakšdelmi un tvēriens; trapecveida augšdaļa; korpusa muskuļi.
- Стало: Apakšdelmi un tvēriens; trapecveida augšdaļa; rumpja muskuļi.

**lib.secondary**

- Было: Sēžas muskuļi, četrgalvainais un ikri kā soļošanas muskuļi.
- Стало: Sēžas muskuļi, četrgalvainais muskulis un ikri kā soļošanas muskuļi.

**lib.why**

- Было: Soļo ar smagiem svariem sānos, lai veidotu tvērienu, stāju un stingru korpusu.
- Стало: Soļo ar smagiem svariem sānos, lai veidotu tvērienu, stāju un stingru rumpi.

**tech.steps**

- Было: Smaga hantele katrā taisnā rokā sānos, krūtis atvērtas, pleci nolaisti, skatiens uz priekšu.<br>Soļo vienmērīgi ar īsiem, stabiliem soļiem. Svari nešūpojas, un korpuss neapgāžas.<br>Vairāki soļi taisnā līnijā, kamēr stāja turas. Noliec svarus kontrolēti, nemet zemē.
- Стало: Smaga hantele katrā taisnā rokā sānos, krūtis atvērtas, pleci nolaisti, skatiens uz priekšu.<br>Soļo vienmērīgi ar īsiem, stabiliem soļiem. Svari nešūpojas, un rumpis neapgāžas.<br>Vairāki soļi taisnā līnijā, kamēr stāja turas. Noliec svarus kontrolēti, nemet zemē. Elpo vienmērīgi, neaizturi elpu.

**tech.safety**

- Было: Pilns solis ar neitrālu mugurkaulu, svari turēti gar ķermeni.
- Стало: Pilns solis ar neitrālu mugurkaulu, svari turēti gar ķermeni. Pacel un noliec hanteles ar neitrālu muguru, saliecot ceļus kā vilkmē; ja tvēriens slīd, noliec hanteles, nemet.

### `fsq`

**lib.primary**

- Было: Četrgalvainais
- Стало: Četrgalvainais muskulis

**lib.secondary**

- Было: Sēžas muskuļi, pievilcēji, muguras augšdaļa, vēdera prese
- Стало: Sēžas muskuļi, pievilcēji, muguras augšdaļa, vēdera muskuļi

**lib.why**

- Было: Pietupiens ar akcentu uz četrgalvaino un vertikālāku korpusu; stipri noslogo muguras augšdaļu.
- Стало: Pietupiens ar akcentu uz četrgalvaino muskuli un vertikālāku rumpi; stipri noslogo muguras augšdaļu.

**tech.steps**

- Было: Stienis uz plecu priekšpuses, elkoņi augstu.<br>Pēdas plecu platumā.<br>Ieelpa, prese sasprindzināta, nolaidies vertikāli uz leju.<br>Celies, turot elkoņus augstu un korpusu vertikāli.
- Стало: Stienis uz plecu priekšējās daļas pie kakla, tvēriens nedaudz platāks par pleciem (pirksti zem stieņa) vai rokas sakrustotas; elkoņi augstu. Noņem stieni no statīva un atkāpies 1–2 soļus.<br>Pēdas plecu platumā.<br>Ieelpa, vēdera muskuļi sasprindzināti, nolaidies vertikāli uz leju.<br>Celies, turot elkoņus augstu un rumpi vertikāli.

**tech.safety**

- Было: —
- Стало: Smagi — rāmī ar drošības balstiem; neveiksmes gadījumā nolaid stieni uz balstiem.

### `gsq`

**lib.primary**

- Было: Četrgalvainais, sēžas muskuļi
- Стало: Četrgalvainais muskulis, sēžas muskuļi

**lib.secondary**

- Было: Pievilcēji, vēdera prese, muguras augšdaļa
- Стало: Pievilcēji, vēdera muskuļi, muguras augšdaļa

**tech.steps**

- Было: Turi hanteli/svaru bumbu pie krūtīm vertikāli.<br>Pēdas nedaudz platāk par pleciem, pirkstgali uz āru.<br>Nolaidies, ar elkoņiem atbīdot ceļus, korpuss vertikāls.<br>Celies izelpojot.
- Стало: Turi hanteli/svarbumbu pie krūtīm vertikāli.<br>Pēdas nedaudz platāk par pleciem, pirkstgali uz āru.<br>Nolaidies, ar elkoņiem atbīdot ceļus, rumpis vertikāls.<br>Celies izelpojot.

**tech.safety**

- Было: —
- Стало: Dziļums — kamēr mugura neitrāla un papēži uz grīdas; ja sāp ceļgals — mazāks dziļums.

### `hack-squat`

**lib.primary**

- Было: Četrgalvainais.
- Стало: Četrgalvainais muskulis.

**lib.secondary**

- Было: Sēžas muskuļi; pievilcējmuskuļi. Mugura balstās uz polstera, tāpēc muguras atliecēji un korpuss stabilizē mazāk nekā brīvā pietupienā.
- Стало: Sēžas muskuļi; pievilcējmuskuļi. Mugura balstās uz polstera, tāpēc muguras iztaisnotājmuskuļi un rumpja muskuļi stabilizē mazāk nekā brīvā pietupienā.

**tech.steps**

- Было: Mugura un iegurnis pret polsteri, pleci zem plecu polsteriem, pēdas uz platformas apmēram plecu platumā. Jostas daļa neatraujas.<br>Ceļu un gūžu saliekšana pa ragavu sliedēm, ceļi pirkstgalu virzienā, papēži uz platformas.<br>Līdz paralēlei vai nedaudz zemāk, kamēr iegurnis ir piespiests. Izspiešana bez sitiena pret atduri un bez pilnas aizslēgšanas, ja tā sit pa ceļiem.
- Стало: Mugura un iegurnis pret polsteri, pleci zem plecu polsteriem, pēdas uz platformas apmēram plecu platumā. Jostas daļa neatraujas.<br>Ceļu un gūžu saliekšana pa ragavu sliedēm, ceļi pirkstgalu virzienā, papēži uz platformas.<br>Līdz paralēlei vai nedaudz zemāk, kamēr iegurnis ir piespiests. Izspiešana bez sitiena pret atduri un bez pilnas aizslēgšanas, ja tā sit pa ceļiem. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: Līdz paralēlei vai zemāk ar piespiestu iegurni. Nedzīt dziļumu, noapaļojot jostas daļu.
- Стало: Līdz paralēlei vai zemāk ar piespiestu iegurni. Nedzen dziļumu, noapaļojot jostas daļu. Pirms piegājiena uzstādi ierobežotājus; pēc piegājiena aizver fiksācijas sviras.

### `hanging-knee-raise`

**lib.primary**

- Было: Taisnais vēdera muskulis (apakšējā daļa); gūžas saliecēji.
- Стало: Taisnais vēdera muskulis; gūžas saliecēji

**lib.why**

- Было: Ceļ ceļus no karājuma, lai rumpis saliecas bez šūpošanās.
- Стало: Ceļu pacelšana karājoties: gūžas saliecēji un taisnais vēdera muskulis (iegurņa pagriešana atpakaļ).

**tech.steps**

- Было: Karājums uz pārliktņa, pleci nolaisti, kājas kopā.<br>Vilkt ceļus uz krūtīm, saliecot gūžas un sagāžot iegurni atpakaļ. Apakšstilbi saliecas. Nešūpot taisnas kājas.<br>Augšstilbi virs paralēles vai ceļi pie vēdera, bez šūpošanās. Lēnām nolaid līdz karājumam.
- Стало: Karājums uz pārliktņa, pleci nolaisti, kājas kopā.<br>Vilkt ceļus uz krūtīm, saliecot gūžas un sagāžot iegurni atpakaļ. Apakšstilbi saliecas. Nešūpot taisnas kājas.<br>Augšstilbi virs paralēles vai ceļi pie vēdera, bez šūpošanās. Lēnām nolaid līdz karājumam. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

### `hc`

**tech.safety**

- Было: —
- Стало: Bez rāvieniem; ja sāp elkonis, samazini svaru.

### `hip-abduction`

**tech.steps**

- Было: Sēdus atvilkšanas trenažierī, mugura pret polsteri, polsteri no ārpuses pie ceļiem vai augšstilbiem, iegurnis piespiests.<br>Augšstilbu atvēršana pret pretestību, neatraujott iegurni un nenoliecot rumpi uz sāniem.<br>Ērta atvilkšanas amplitūda, īsa pauze, lēna atgriešanās.
- Стало: Sēdus atvilkšanas trenažierī, mugura pret polsteri, polsteri no ārpuses pie ceļiem vai augšstilbiem, iegurnis piespiests.<br>Augšstilbu atvēršana pret pretestību, neatraujott iegurni un nenoliecot rumpi uz sāniem.<br>Ērta atvilkšanas amplitūda, īsa pauze, lēna atgriešanās. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

### `hip-adduction`

**tech.steps**

- Было: Sēdi savilkšanas trenažierī, polsteri ceļu vai augšstilbu iekšpusē, iegurnis piespiests sēdeklim.<br>Savieno augšstilbus pret pretestību, neatraujott iegurni.<br>Augšstilbi tuvojas ērtā amplitūdā, tad lēna atgriešanās.
- Стало: Sēdi savilkšanas trenažierī, polsteri ceļu vai augšstilbu iekšpusē, iegurnis piespiests sēdeklim.<br>Savieno augšstilbus pret pretestību, neatraujott iegurni.<br>Augšstilbi tuvojas ērtā amplitūdā, tad lēna atgriešanās. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

### `hip-flexor-rock`

**tech.errors**

- Было: Muguras lejasdaļas izliekums.<br>Priekšējais celis aiziet tālu aiz pirkstgaliem.
- Стало: Muguras lejasdaļas izliekums.<br>Priekšējais celis krīt uz iekšu.

**tech.safety**

- Было: Ar ceļu ierobežojumu — mīksts paliktnis zem ceļa; ja sāp, nedari.
- Стало: Ja traucē ceļi, paliec zem ceļa mīkstu paliktni; ja sāp, neizpildi.

### `ht`

**tech.steps**

- Было: Apsēdies uz grīdas, lāpstiņas pret solu; slodze uz gūžu locītavas: stienis ar spilvenu (zālē), hantele (mājās) vai bez svara.<br>Pēdas plecu platumā, apakšstilbi vertikāli augšējā punktā.<br>Izelpojot pacel iegurni līdz taisnai līnijai pleci–ceļi, savelc sēžas muskuļus.<br>Nolaid kontrolēti.
- Стало: Apsēdies uz grīdas, lāpstiņas pret solu; slodze uz gūžu locītavas: stienis ar spilvenu (zālē), hantele (mājās) vai bez svara.<br>Pēdas plecu platumā, apakšstilbi vertikāli augšējā punktā.<br>Izelpojot pacel gurnus līdz taisnai līnijai pleci–ceļi, zods nedaudz piespiests, skats uz priekšu; saspied sēžas muskuļus uz 1 s.<br>Nolaid kontrolēti.

**tech.safety**

- Было: —
- Стало: Spilvens uz stieņa, sols stabils un neslīd; neieliec jostasvietu augšā.

### `ht-bw`

**lib.secondary**

- Было: Augšstilba aizmugure, korpusa muskuļi
- Стало: Augšstilba aizmugure, rumpja muskuļi

**tech.steps**

- Было: Apgulies uz muguras, ceļi saliekti, pēdas gurnu platumā, rokas gar ķermeni.<br>Sasprindzini vēderu un sēžas muskuļus, pacel gurnus līdz taisnai līnijai no ceļiem līdz pleciem.<br>Pauze 2 s augšā, mugura neizliecas.<br>Lēni (2–3 s) nolaid gurnus; kad 20 atkārtojumi ir viegli, pārej uz tiltu uz vienas kājas.
- Стало: Apgulies uz muguras, ceļi saliekti, pēdas gurnu platumā, rokas gar ķermeni.<br>Sasprindzini vēderu un sēžas muskuļus, pacel gurnus līdz taisnai līnijai no ceļiem līdz pleciem.<br>Pauze 2 s augšā, mugura neizliecas.<br>Lēni (2–3 s) nolaid gurnus; kad 20 atkārtojumi ir viegli, pārej uz tiltu uz vienas kājas. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

### `ht-db`

**lib.secondary**

- Было: Augšstilba aizmugure, korpusa muskuļi
- Стало: Augšstilba aizmugure, rumpja muskuļi

**tech.steps**

- Было: Apgulies uz muguras, ceļi saliekti, pēdas gurnu platumā; novieto hanteli šķērsām uz gurniem un pieturi ar rokām.<br>Sasprindzini vēderu un sēžas muskuļus, pacel gurnus līdz taisnai līnijai no ceļiem līdz pleciem.<br>Pauze 1–2 s augšā, mugura neizliecas.<br>Lēni nolaid gurnus gandrīz līdz grīdai un atkārto.
- Стало: Apgulies uz muguras, ceļi saliekti, pēdas gurnu platumā; novieto hanteli šķērsām uz gurniem un pieturi ar rokām.<br>Sasprindzini vēderu un sēžas muskuļus, pacel gurnus līdz taisnai līnijai no ceļiem līdz pleciem.<br>Pauze 1–2 s augšā, mugura neizliecas.<br>Lēni nolaid gurnus gandrīz līdz grīdai un atkārto. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

### `hyp`

**lib.primary**

- Было: Muguras taisnotāji
- Стало: Muguras iztaisnotājmuskuļi

**tech.steps**

- Было: Iekārtojies trenažierī, veltnis zem iegurņa kauliem.<br>Rokas sakrustotas uz krūtīm, mugura taisna.<br>Nolaidies, saliecoties gūžas locītavā.<br>Paceļies līdz taisnai ķermeņa līnijai, ne augstāk.
- Стало: Iekārtojies trenažierī, veltnis zem iegurņa kauliem.<br>Rokas sakrustotas uz krūtīm, mugura taisna.<br>Nolaidies, saliecoties gūžas locītavā.<br>Paceļies līdz taisnai ķermeņa līnijai, ne augstāk. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

### `ibp`

**tech.safety**

- Было: Smagi — ar apdrošinātāju.
- Стало: Smagus piegājienus izpildi tikai ar drošinātāju vai statnē ar drošības balstiem.

### `idb`

**tech.safety**

- Было: —
- Стало: Smagi piegājieni — ar drošinātāju; pēc piegājiena nolaid hanteles uz augšstilbiem.

### `inchworm`

**lib.primary**

- Было: Augšstilba aizmugure (noliekšanās laikā un pēdām soļojot pret plaukstām); korpusa muskuļi plankā.
- Стало: Augšstilba aizmugure (noliekšanās laikā un pēdām soļojot pret plaukstām); rumpja muskuļi plankā.

**lib.why**

- Было: Aizsoļo ar rokām līdz plankai un atpakaļ, lai atbrīvotu augšstilba aizmuguri un sasprindzinātu korpusu.
- Стало: Aizsoļo ar rokām līdz plankai un atpakaļ, lai atbrīvotu augšstilba aizmuguri un sasprindzinātu rumpi.

### `incline-db-curl`

**lib.primary**

- Было: Bicepss; garā galva ir stiprāk izstiepta, jo roka karājas aiz korpusa.
- Стало: Bicepss; garā galva ir stiprāk izstiepta, jo roka karājas aiz rumpja.

**lib.why**

- Было: Saliec bicepsu no izstieptas karāšanās aiz korpusa.
- Стало: Saliec bicepsu no izstieptas karāšanās aiz rumpja.

**tech.steps**

- Было: Sēdi slīpā solā 45–60°, rokas brīvi karājas, elkoņi nedaudz aiz korpusa, plaukstas uz priekšu vai sāc neitrāli un tad supinē.<br>Locies tikai elkonī. Augšdelms nevirzās uz priekšu.<br>Pilna saliekšana, nemetot elkoņus uz priekšu. Nolaid lēni līdz gandrīz taisnai rokai.
- Стало: Sēdi slīpā solā 45–60°, rokas brīvi karājas, elkoņi nedaudz aiz rumpja, plaukstas uz priekšu vai sāc neitrāli un tad supinē.<br>Locies tikai elkonī. Augšdelms nevirzās uz priekšu.<br>Pilna saliekšana, nemetot elkoņus uz priekšu. Nolaid lēni līdz gandrīz taisnai rokai. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.errors**

- Было: Korpusa šūpošana<br>elkoņu dzīšana uz priekšu<br>pārāk stāvs slīpums, ja sāp pleca priekšpuse.
- Стало: Rumpja šūpošana<br>elkoņu dzīšana uz priekšu<br>pārāk stāvs slīpums, ja sāp pleca priekšpuse.

**tech.safety**

- Было: No gandrīz taisnas karājošās rokas līdz pilnai saliekšanai, nemetot elkoni uz priekšu.
- Стало: No gandrīz taisnas karājošās rokas līdz pilnai saliekšanai, nemetot elkoni uz priekšu. Ja sāp pleca priekšpuse, samazini sola slīpumu vai svaru.

### `incline-db-fly`

**lib.secondary**

- Было: Priekšējie deltveida; bicepsa īsā galva. Tricepss gandrīz nestrādā — tā nav spiešana.
- Стало: Deltveida muskuļa priekšējā daļa; knābjveida-augšdelma muskulis. Tricepss gandrīz nestrādā — tā nav spiešana.

**tech.steps**

- Было: Atzveltne 30–45°. Hanteles virs krūšu augšdaļas, elkoņi viegli saliekti un turēti šajā leņķī.<br>Rokas atveras uz sāniem pa loku. Elkoņa leņķis gandrīz nemainās.<br>Savilc virs krūšu augšdaļas, nesitot hanteles kopā; apakšā — stiepums, plecam neiekrītot uz priekšu.
- Стало: Atzveltne 30–45°. Hanteles virs krūšu augšdaļas, elkoņi viegli saliekti un turēti šajā leņķī.<br>Rokas atveras uz sāniem pa loku. Elkoņa leņķis gandrīz nemainās.<br>Savilc virs krūšu augšdaļas, nesitot hanteles kopā; apakšā — stiepums, plecam neiekrītot uz priekšu. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: Laid lejā aptuveni līdz korpusa līmenim vai nedaudz zemāk, kamēr plecs neiekrīt uz priekšu.
- Стало: Laid lejā aptuveni līdz rumpja līmenim vai nedaudz zemāk, kamēr plecs neiekrīt uz priekšu. Nenolaid hanteles zemāk par plecu līniju; ja sāp plecs, samazini svaru un amplitūdu.

### `inv`

**lib.primary**

- Было: Platākie, rombveida
- Стало: Platie muguras muskuļi, rombveida

### `jump`

**lib.primary**

- Было: Sirds un asinsvadu sistēma
- Стало: Ikri, četrgalvainais muskulis, sēžas muskuļi (kardio)

**lib.secondary**

- Было: Ikri, pleci
- Стало: Deltveida muskuļi; augšstilba atvilcējmuskuļi un pievilcējmuskuļi

### `jump-rope`

**lib.secondary**

- Было: Priekšējais lielā lielakaula muskulis starp lēcieniem; četrgalvainais; pleci un apakšdelmi griež lecamauklu; korpuss.
- Стало: Priekšējais lielā lielakaula muskulis starp lēcieniem; četrgalvainais muskulis; pleci un apakšdelmi griež lecamauklu; rumpja muskuļi.

**tech.steps**

- Было: Lecamaukla aiz tevis, elkoņi pie korpusa, plaukstas nedaudz gurnu priekšā. Mīksti ceļi.<br>Griez lecamauklu galvenokārt ar plaukstām. Zemi lēcieni uz abām pēdām, piezemējoties uz pēdas priekšdaļas ar mīkstu celi.<br>Turi lēcienus zemus un nepārtrauktus, bez pauzes uz taisnām kājām.
- Стало: Lecamaukla aiz tevis, elkoņi pie rumpja, plaukstas nedaudz gurnu priekšā. Mīksti ceļi.<br>Griez lecamauklu galvenokārt ar plaukstām. Zemi lēcieni uz abām pēdām, piezemējoties uz pēdas priekšdaļas ar mīkstu celi.<br>Turi lēcienus zemus un nepārtrauktus, bez pauzes uz taisnām kājām.

**tech.safety**

- Было: Neliela pēdu atraušanās, tieši tik, lai lecamaukla paietu apakšā.
- Стало: Neliela pēdu atraušanās, tieši tik, lai lecamaukla paietu apakšā. Lec uz līdzenas, neslidenas virsmas; ja sāp ikri vai Ahilleja cīpsla, pārtrauc.

### `jump-squat`

**lib.primary**

- Было: Četrgalvainais; sēžas muskuļi.
- Стало: Četrgalvainais muskulis; sēžas muskuļi.

**lib.secondary**

- Было: Augšstilba aizmugure; ikri; korpuss.
- Стало: Augšstilba aizmugure; ikri; rumpja muskuļi.

**tech.safety**

- Было: Pietupies aptuveni līdz paralēlei pirms lēciena; piezemējies ceturtdaļpietupienā, nevis uz taisniem ceļiem.
- Стало: Pietupies aptuveni līdz paralēlei pirms lēciena; piezemējies ceturtdaļpietupienā, nevis uz taisniem ceļiem. Liela trieciena slodze ceļiem un Ahilleja cīpslai: ja sāp ceļi, potīte vai jostasvieta — neizpildi.

### `kb-windmill`

**lib.primary**

- Было: Slīpie vēdera muskuļi un jostas kvadrātmuskulis tajā pusē, kas kontrolē noliekumu.
- Стало: Slīpie vēdera muskuļi un jostas kvadrātveida muskulis tajā pusē, kas kontrolē noliekumu.

**lib.secondary**

- Было: Augšējās rokas plecs (deltveida, rotatora manšete) tur svara bumbu; apakšējās puses augšstilba aizmugure un pievilcējmuskuļi; sēžas muskulis.
- Стало: Augšējās rokas plecs (deltveida, rotatora manšete) tur svarbumbu; apakšējās puses augšstilba aizmugure un pievilcējmuskuļi; sēžas muskulis.

**lib.why**

- Было: Māca sānu noliekumu zem fiksētas svara bumbas, lai rumpis paliek garš un bumba paliek virs galvas.
- Стало: Māca sānu noliekumu zem fiksētas svarbumbas, lai rumpis paliek garš un bumba paliek virs galvas.

**tech.steps**

- Было: Svara bumba iztaisnotā rokā virs galvas, skatiens uz bumbu. Pēdas nedaudz platāk par pleciem, pirkstgali pagriezti apmēram noliekuma virzienā, prom no bumbas.<br>Gurnus virza augšējās rokas pusē, rumpis noliecas, brīvā roka slīd gar tās pašas puses kāju. Abas kājas samērā taisnas, mugura neitrāla.<br>Brīvā roka pieskaras pēdai vai apakšstilbam ērtā diapazonā. Pacelšanās stājā, iztaisnojot rumpi, svara bumba visu laiku virs pleca.
- Стало: Svarbumba iztaisnotā rokā virs galvas, skatiens uz bumbu. Pēdas nedaudz platāk par pleciem, pirkstgali pagriezti apmēram noliekuma virzienā, prom no bumbas.<br>Gurnus virza augšējās rokas pusē, rumpis noliecas, brīvā roka slīd gar tās pašas puses kāju. Abas kājas samērā taisnas, mugura neitrāla.<br>Brīvā roka pieskaras pēdai vai apakšstilbam ērtā amplitūdā. Paceļies, iztaisnojot gūžu un rumpi; svarbumba visu laiku virs pleca. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.errors**

- Было: Jostas noapaļošana<br>Augšējās rokas saliekšana<br>Svara bumba zaudē līniju virs galvas<br>Rāviens
- Стало: Jostas noapaļošana<br>Augšējās rokas saliekšana<br>Svarbumba zaudē līniju virs galvas<br>Rāviens

**tech.safety**

- Было: Līdz pieskārienam pēdai vai apakšstilbam, kamēr mugura ir neitrāla un svara bumba paliek virs pleca.
- Стало: Līdz pieskārienam pēdai vai apakšstilbam, kamēr mugura ir neitrāla un svarbumba paliek virs pleca. Sāc bez svara vai ar vieglu svarbumbu; ja sāp jostasvieta vai plecs — pārtrauc.

### `kettlebell-swing`

**lib.secondary**

- Было: Muguras taisnotāji; korpuss; priekšējie deltveida un tvēriens tur svaru bumbu. Tā ir ballistiska noliekšanās no gurniem, nevis pietupiens.
- Стало: Muguras iztaisnotājmuskuļi; rumpja muskuļi; priekšējie deltveida un tvēriens tur svarbumbu. Tā ir ballistiska noliekšanās no gurniem, nevis pietupiens.

**lib.why**

- Было: Dzen gūžas, lai šūpotu svaru bumbu, nevis celtu to ar rokām.
- Стало: Dzen gūžas, lai šūpotu svarbumbu, nevis celtu to ar rokām.

**tech.steps**

- Было: Pēdas nedaudz platāk par gurniem, svaru bumba priekšā. Satver ar abām rokām. Mugura neitrāla, ceļi mīksti.<br>Aizšūpo bumbu starp kājām, bīdot gūžas atpakaļ (noliekšanās), tad strauji iztaisno gūžas. Bumba paceļas aptuveni līdz krūtīm vai acīm. Rokas to neceļ ar deltveida spēku.<br>Augšā korpuss ir taisns, sēžas muskuļi saspiesti, un bumba ir roku līnijā. Atkal noliecies: gūžas atpakaļ, bumba starp kājām.
- Стало: Pēdas nedaudz platāk par gurniem, svarbumba priekšā. Satver ar abām rokām. Mugura neitrāla, ceļi mīksti.<br>Aizšūpo bumbu starp kājām, bīdot gūžas atpakaļ (noliekšanās), tad strauji iztaisno gūžas. Bumba paceļas līdz krūšu augstumam gūžu kustības, nevis roku dēļ; augstāk par pleciem to neceļ.<br>Augšā rumpis ir taisns, sēžas muskuļi saspiesti, un bumba ir roku līnijā. Atkal noliecies: gūžas atpakaļ, bumba starp kājām. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.errors**

- Было: Pietupiens noliekšanās vietā<br>jostasvietas apaļošana<br>bumbas celšana ar rokām<br>bumbas aiznešana virs galvas, ja tas nav atsevišķs mērķis.
- Стало: Pietupiens noliekšanās vietā<br>jostasvietas apaļošana<br>bumbas celšana ar rokām<br>svarbumbas pacelšana virs pleciem

**tech.safety**

- Было: Šūpo atpakaļ līdz aizmugurējās ķēdes stiepumam bez apaļošanas; augšā — līdz krūtīm vai acīm krievu šūpolēm.
- Стало: Aizšūpo tikai līdz augšstilba aizmugures stiepumam, nenoapaļojot muguru; bumba ne augstāk par krūtīm. Ja sāp jostasvieta — pārtrauc.

### `landmine-press`

**lib.secondary**

- Было: Priekšējais zāģzobis; tricepss; korpuss (īpaši stāvus variantā ar vienu roku).
- Стало: Priekšējais zāģzobis; tricepss; rumpja muskuļi (īpaši stāvus variantā ar vienu roku).

**lib.why**

- Было: Spiež vienu roku augšup pa loku, kamēr korpuss paliek sasprindzināts.
- Стало: Spiež vienu roku augšup pa loku, kamēr rumpis paliek sasprindzināts.

**tech.steps**

- Было: Viens stieņa gals stūra atbalstā vai sienas stūrī. Stāvies ar stieni pie viena pleca, viena pēda nedaudz priekšā, korpuss sasprindzināts.<br>Spied stieni augšup un nedaudz uz priekšu pa loku, līdz roka ir gandrīz taisna. Lāpstiņa virzās augšup un uz priekšu (zāģzobis), bez pārmērīga ieliekuma.<br>Gandrīz pilna iztaisnošana, tad nolaid lēni pie pleca.<br>Variants: Spiešana no pusceļgala (stabilāka) un spiešana ar abām rokām.
- Стало: Viens stieņa gals stūra atbalstā vai sienas stūrī. Stāvies ar stieni pie viena pleca, viena pēda nedaudz priekšā, rumpis sasprindzināts.<br>Spied stieni augšup un nedaudz uz priekšu pa loku, līdz roka ir gandrīz taisna. Lāpstiņa virzās augšup un uz priekšu (zāģzobis), bez pārmērīga ieliekuma.<br>Gandrīz pilna iztaisnošana, tad nolaid lēni pie pleca.<br>Variants: Spiešana no pusceļgala (stabilāka) un spiešana ar abām rokām. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.errors**

- Было: Spēcīgs ieliekums jostasvietā<br>plecu raustīšana<br>korpusa griešana spiešanas vietā<br>sitiens ar stieni augšā.
- Стало: Spēcīgs ieliekums jostasvietā<br>plecu raustīšana<br>rumpja griešana spiešanas vietā<br>sitiens ar stieni augšā.

**tech.safety**

- Было: No stieņa pie pleca līdz gandrīz taisnai rokai.
- Стало: No stieņa pie pleca līdz gandrīz taisnai rokai. Stieņa gals droši nostiprināts balstā; ja sāp plecs, samazini svaru.

### `lat`

**lib.primary**

- Было: Platākie muguras muskuļi
- Стало: Platie muguras muskuļi

**tech.steps**

- Было: Apsēdies, nofiksē augšstilbus zem veltņiem, tvēriens nedaudz platāks par pleciem.<br>Korpuss nedaudz atliekts, krūtis uz priekšu.<br>Izelpojot velc stieni pie krūšu augšdaļas, elkoņi uz leju un atpakaļ.<br>Lēni atgriez, pilnībā iztaisnojot rokas.
- Стало: Apsēdies, nofiksē augšstilbus zem veltņiem, tvēriens nedaudz platāks par pleciem.<br>Rumpis nedaudz atliekts, krūtis uz priekšu.<br>Izelpojot velc stieni pie krūšu augšdaļas, elkoņi uz leju un atpakaļ.<br>Lēni atgriez, pilnībā iztaisnojot rokas.

**tech.safety**

- Было: —
- Стало: Velc pie krūšu augšdaļas, nekad aiz galvas; ja sāp plecs, samazini svaru.

### `lateral-lunge-bw`

**lib.primary**

- Было: Saliektās (darba) kājas četrgalvainais un sēžas muskuļi.
- Стало: Saliektās (darba) kājas četrgalvainais muskulis un sēžas muskuļi.

**lib.secondary**

- Было: Taisnās kājas pievilcējmuskuļi iestiepjas; darba kājas vidējais sēžas muskulis stabilizē; korpuss.
- Стало: Taisnās kājas pievilcējmuskuļi iestiepjas; darba kājas vidējais sēžas muskulis stabilizē; rumpja muskuļi.

**tech.steps**

- Было: Stāvus, pēdas kopā vai šauri, rokas priekšā krūtīm vai uz gurniem.<br>Plats solis uz sāniem. Saliecas tikai tā kāja, uz kuru sper soli: gurni atpakaļ un lejā, celis virs pirkstgaliem, darba kājas papēdis uz grīdas. Otra kāja paliek gandrīz taisna.<br>Atgrūsties ar darba pēdu un atgriezties stājā. Tad solis uz otru pusi.
- Стало: Stāvus, pēdas kopā vai šauri, rokas priekšā krūtīm vai uz gurniem.<br>Plats solis uz sāniem. Saliecas tikai tā kāja, uz kuru sper soli: gurni atpakaļ un lejā, celis virs pirkstgaliem, darba kājas papēdis uz grīdas. Otra kāja paliek gandrīz taisna.<br>Atgrūsties ar darba pēdu un atgriezties stājā. Tad solis uz otru pusi. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: Līdz ērtam dziļumam, kamēr darba papēdis ir uz grīdas un celis virs pēdas.
- Стало: Līdz ērtam dziļumam, kamēr darba papēdis ir uz grīdas un celis virs pēdas. Ja sāp celis vai cirksnis, samazini dziļumu.

### `lc`

**tech.safety**

- Было: —
- Стало: Veltnis nedaudz virs papēžiem, nevis uz Ahilleja cīpslas; bez rāvieniem.

### `lc-seated`

**tech.steps**

- Было: Sēdus, rullis nedaudz virs papēžiem, iegurnis piespiests sēdeklim.<br>Ceļu saliekšana lejup pa loku, iegurnim neatraujotties.<br>Pilna saliekšana, tad lēna atgriešanās gandrīz līdz taisnai kājai.
- Стало: Sēdus, rullis nedaudz virs papēžiem, iegurnis piespiests sēdeklim.<br>Ceļu saliekšana lejup pa loku, iegurnim neatraujotties.<br>Pilna saliekšana, tad lēna atgriešanās gandrīz līdz taisnai kājai. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: No gandrīz taisnas kājas līdz pilnai saliekšanai ar fiksētu iegurni.
- Стало: No gandrīz taisnas kājas līdz pilnai saliekšanai ar fiksētu iegurni. Pirms piegājiena nofiksē augšstilbus ar veltni; ja sāp zem ceļa, samazini svaru.

### `le`

**lib.primary**

- Было: Četrgalvainais
- Стало: Četrgalvainais muskulis

### `lp`

**lib.primary**

- Было: Četrgalvainais
- Стало: Četrgalvainais muskulis

**lib.secondary**

- Было: Sēžas muskuļi, pievilcēji, ikri
- Стало: Sēžas muskuļi (gūžas iztaisnošana), lielais pievilcējmuskulis

### `lr`

**lib.secondary**

- Было: Priekšējie deltveida, trapecveida
- Стало: Virsšķautnes muskulis, deltveida muskuļa priekšējā daļa, trapecveida muskulis (nedrīkst dominēt)

**tech.steps**

- Было: Stāvus, hanteles pie augšstilbiem, elkoņi nedaudz saliekti.<br>Korpuss taisns, bez noliekšanās uz priekšu.<br>Izelpojot cel rokas uz sāniem lāpstiņas plaknē līdz plecu līmenim; kustību vada elkoņi.<br>Lēni nolaid.
- Стало: Stāvus, hanteles pie augšstilbiem, elkoņi nedaudz saliekti.<br>Rumpis taisns, bez noliekšanās uz priekšu.<br>Izelpojot cel rokas uz sāniem lāpstiņas plaknē līdz plecu līmenim; kustību vada elkoņi.<br>Lēni nolaid.

**tech.errors**

- Было: Korpusa šūpošana.<br>Celšana virs pleciem ar trapecveida muskuļu pacelšanu.<br>Pārāk liels svars.
- Стало: Rumpja šūpošana.<br>Celšana virs pleciem ar trapecveida muskuļu pacelšanu.<br>Pārāk liels svars.

**tech.safety**

- Было: —
- Стало: Viegls svars, rokas ne augstāk par pleciem, bez sāpēm plecā.

### `lun`

**lib.primary**

- Было: Četrgalvainais, sēžas muskuļi
- Стало: Četrgalvainais muskulis, sēžas muskuļi

**tech.steps**

- Было: Stāvi taisni, hanteles rokās.<br>Sper soli uz priekšu.<br>Nolaid aizmugurējo ceļgalu gandrīz līdz grīdai, abi ceļi ~90°.<br>Atgrūdies ar priekšējo kāju un atgriezies.
- Стало: Stāvi taisni, hanteles rokās.<br>Sper soli uz priekšu.<br>Ieelpojot kontrolēti nolaid aizmugurējo celi gandrīz līdz grīdai, abi ceļi apmēram 90°, rumpis vertikāli.<br>Atgrūdies ar priekšējo kāju un atgriezies.

**tech.errors**

- Было: Priekšējais ceļgals krīt uz iekšu.<br>Pārāk īss solis.<br>Korpusa noliekšana uz priekšu.
- Стало: Priekšējais celis krīt uz iekšu.<br>Pārāk īss solis.<br>Rumpis krīt uz priekšu, mugura noapaļojas.

**tech.safety**

- Было: —
- Стало: Ceļgals virs pēdas; ja sāp ceļgals — izklupieni atpakaļ vai bez svara.

### `mch`

**tech.steps**

- Было: Mugura un iegurnis pie spilvena, lāpstiņas fiksētas, rokturi krūšu vidusdaļas augstumā.<br>Spied pa trenažiera trajektoriju bez plecu raustīšanas un neatrau muguru no spilvena.<br>Gandrīz pilna iztaisnošana bez sitiena pret atduri; atgriez līdz krūšu stiepumam.<br>2 s pret sevi, 1 s projām.
- Стало: Mugura un iegurnis pie spilvena, lāpstiņas fiksētas, rokturi krūšu vidusdaļas augstumā.<br>Spied pa trenažiera trajektoriju bez plecu raustīšanas un neatrau muguru no spilvena.<br>Gandrīz pilna iztaisnošana bez sitiena pret atduri; atgriez līdz krūšu stiepumam.<br>Temps: atgriešana pie sevis (nolaišana) — 2 s, spiešana prom — 1 s. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: No krūšu stiepuma līdz gandrīz taisnām rokām, bez sitiena pret atduri.
- Стало: No krūšu stiepuma līdz gandrīz taisnām rokām, bez sitiena pret atduri. Noregulē sēdekli pirms piegājiena; ja sāp plecs, samazini amplitūdu vai svaru.

### `mch-incline`

**tech.steps**

- Было: Sēdeklis un atzveltne nosaka slīpumu ap 30° (darba diapazons 15–45°). Rokturi krūšu augšas augstumā.<br>Spiešana augšup un uz priekšu pa vadotnēm, lāpstiņas pie polstera.<br>Gandrīz taisnas rokas bez sitiena amplitūdas galā. Kontrolēta atgriešanās.
- Стало: Sēdeklis un atzveltne nosaka slīpumu ap 30° (darba diapazons 15–45°). Rokturi krūšu augšas augstumā.<br>Spiešana augšup un uz priekšu pa vadotnēm, lāpstiņas pie polstera.<br>Gandrīz taisnas rokas bez sitiena amplitūdas galā. Kontrolēta atgriešanās. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: Trenažiera slīpums ap 30° (darba diapazons 15–45°). Neieiet virs galvas spiešanas pozīcijā.
- Стало: Trenažiera slīpums ap 30° (darba diapazons 15–45°). Neieiet virs galvas spiešanas pozīcijā. Pirms piegājiena noregulē sēdekli, lai rokturi būtu krūšu augšdaļas līmenī; ja sāp plecs, samazini svaru.

### `meadows-row`

**lib.why**

- Было: Velk lendmaina stieņa galu pret gūžu caur garu plato muguras muskuļu stiepumu.
- Стало: Velk stūra stieņa galu pret gūžu caur garu plato muguras muskuļu stiepumu.

**tech.steps**

- Было: Viens stieņa gals stūra atbalstā (lendmaine) vai sienas stūrī. Stājies sāniski pret stieni ar vienu pēdu priekšā un satver resno galu ar tvērienu no augšas. Noliecies no gurniem, mugura neitrāla.<br>Velc stieņa galu uz darba puses apakšējām ribām vai gūžu. Elkonis iet atpakaļ un nedaudz uz sāniem, lāpstiņa savienojas.<br>Īsa pauze pie korpusa, tad lēni nolaid līdz stiepumam, neapaļojot muguru.
- Стало: Viens stieņa gals stūra stieņa atbalstā vai sienas stūrī. Stājies sāniski pret stieni ar vienu pēdu priekšā un satver resno galu ar tvērienu no augšas. Noliecies no gurniem, mugura neitrāla.<br>Velc stieņa galu uz darba puses apakšējām ribām vai gūžu. Elkonis iet atpakaļ un nedaudz uz sāniem, lāpstiņa savienojas.<br>Īsa pauze pie rumpja, tad lēni nolaid līdz stiepumam, neapaļojot muguru. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.errors**

- Было: Korpusa griešana<br>rāviens ar jostasvietu<br>pārvēršana par plecu raustīšanu.
- Стало: Rumpja griešana<br>rāviens ar jostasvietu<br>pārvēršana par plecu raustīšanu.

**tech.safety**

- Было: No plato muguras muskuļu stiepuma apakšā līdz elkonim pie korpusa.
- Стало: No plato muguras muskuļu stiepuma apakšā līdz elkonim pie rumpja. Noliekums noslogo jostasvietu: atbalsti brīvo apakšdelmu pret augšstilbu; ja sāp jostasvieta — hanteles vilkme ar atbalstu pret solu.

### `med-ball-slam`

**lib.why**

- Было: Met medbolu pret grīdu ātrai un stingrai korpusa savilkšanai.
- Стало: Met medbolu pret grīdu ātrai un stingrai rumpja savilkšanai.

**tech.steps**

- Было: Stāvies ar medbolu abās rokās. Pacel to virs galvas ar vieglu atlieci, ķermenis garš.<br>Met bumbu spēcīgi grīdā sev priekšā, noliekoties gurnos un saliecot korpusu. Rokas pavada bumbu lejup.<br>Bumba atsitas pret grīdu; pacel to nākamajam atkārtojumam vai iztaisnojies.
- Стало: Stāvies ar medbolu abās rokās. Pacel to virs galvas ar vieglu atlieci, ķermenis garš.<br>Met bumbu spēcīgi grīdā sev priekšā, noliekoties gurnos un saliecot rumpi. Rokas pavada bumbu lejup.<br>Bumba atsitas pret grīdu; pacel to nākamajam atkārtojumam vai iztaisnojies.

### `mk-arm-circles-front-back`

**tech.steps**

- Было: Rokas uz sāniem, ķermenis taisns.<br>Apļi no maziem uz lieliem.<br>Vispirms uz priekšu, tad atpakaļ, plecus necel.
- Стало: Nostājies taisni, rokas uz sāniem.<br>Veic apļus no maziem līdz lieliem.<br>Vispirms uz priekšu, tad atpakaļ; plecus necel.

**tech.errors**

- Было: Vispirms uz priekšu, tad atpakaļ, plecus necel.
- Стало: Pleci pacelti pie ausīm.<br>Strauji lieli apļi uzreiz.<br>Ieliekums jostasvietā.

**tech.safety**

- Было: —
- Стало: Amplitūdu palielini pakāpeniski, bez sāpēm plecā.

### `mk-band-high-face-pull`

**lib.primary**

- Было: Aizmugurējais deltveida, rombveida, trapeces vidus (iesildīšanās)
- Стало: Aizmugurējais deltveida, rombveida, trapecveida muskuļa vidusdaļa (iesildīšanās)

**tech.steps**

- Было: Gumija nostiprināta virs galvas, viegls nospriegojums.<br>Velc pie sejas, izvēršot elkoņus uz sāniem.<br>Savieno lāpstiņas un lēnām atgriez.
- Стало: Gumija nostiprināta virs galvas, viegls nospriegojums.<br>Velc pie sejas, izvēršot elkoņus uz sāniem.<br>Savieno lāpstiņas un lēnām atgriez. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.errors**

- Было: —
- Стало: Vilkšana ar rumpi, atliecoties atpakaļ.<br>Elkoņi nolaižas.<br>Pleci pie ausīm.

**tech.safety**

- Было: —
- Стало: Gumija droši piestiprināta un bez plīsumiem; viegls nostiepums.

### `mk-band-row`

**lib.primary**

- Было: Platie muguras muskuļi, rombveida, trapeces vidus
- Стало: Platie muguras muskuļi, rombveida, trapecveida muskuļa vidusdaļa

**tech.steps**

- Было: Gumija nostiepta jostas augstumā, mugura taisna.<br>Velc elkoņus atpakaļ gar ķermeni un savieno lāpstiņas.<br>Lēnām atgriez, plecus necel.
- Стало: Nostiprini gumiju vidukļa augstumā, atkāpies līdz nostiepumam, mugura neitrāla.<br>Velc elkoņus atpakaļ gar rumpi, savelc lāpstiņas.<br>Lēni atgriez, plecus necel. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.errors**

- Было: Lēnām atgriez, plecus necel.
- Стало: Pleci paceļas pie ausīm.<br>Rumpja atliekšana atpakaļ lāpstiņu darba vietā.<br>Gumija strauji atrauj rokas atpakaļ.

**tech.safety**

- Было: —
- Стало: Gumija droši piestiprināta un bez plīsumiem.

### `mk-barbell-deadlift`

**lib.primary**

- Было: Sēžas muskuļi, augšstilba aizmugure, muguras iztaisnotāji
- Стало: Sēžas muskuļi, augšstilba aizmugure, muguras iztaisnotājmuskuļi

**lib.secondary**

- Было: Četrgalvainais
- Стало: Četrgalvainais muskulis; lielais pievilcējmuskulis; trapecveida muskulis un apakšdelmi (tvēriens); vēdera muskuļi (stabilizācija)

**lib.why**

- Было: Vilkme no zemes ar kājām un gurniem.
- Стало: Pamatvingrinājums visas ķermeņa mugurējās virsmas spēkam: sēžas muskuļiem, augšstilbiem un mugurai.

**tech.steps**

- Было: Stienis virs pēdas vidus, mugura neitrāla.<br>Velc ar kājām un gurniem, stienis slīd gar kājām.<br>Augšā iztaisnojies, nepārliecot jostasvietu.
- Стало: Pēdas gūžu platumā, stienis virs pēdas vidus, gandrīz pieskaras apakšstilbiem.<br>Noliecies un satver stieni nedaudz platāk par kājām; apakšstilbi pieskaras stienim, pleci nedaudz priekšā stienim, mugura neitrāla, platie muguras muskuļi saspringti.<br>Ieelpo un saspriedz vēdera muskuļus; velc, vienlaikus iztaisnojot ceļus un gūžas, stienis slīd gar kājām; izelpo pēc grūtākās daļas.<br>Augšā stāvi taisni, sēžas muskuļi saspringti, neatliecies atpakaļ; nolaid pa to pašu ceļu: vispirms gūžas atpakaļ, tad, kad stienis paiet garām ceļiem, saliec ceļus.

**tech.errors**

- Было: —
- Стало: Apaļa mugura, ceļot vai nolaižot.<br>Stienis attālinās no kājām.<br>Gūžas paceļas ātrāk par pleciem — vilkšana ar muguru.<br>Rāviens no grīdas un atliekšanās atpakaļ augšā.

**tech.safety**

- Было: —
- Стало: Darba svaru izmanto tikai tik ilgi, kamēr mugura visos atkārtojumos paliek neitrāla. Iesācējiem vispirms apgūt noliekšanos ar gūžu atvirzīšanu un viegla svara rumāņu vilkmi. Ja sāp jostasvieta — pārtrauc.

### `mk-barbell-upright-row`

**lib.primary**

- Было: Vidējais deltveida, trapeces augšdaļa
- Стало: Vidējais deltveida, trapecveida muskuļa augšdaļa

**lib.why**

- Было: Stieņa vilkme pie zoda ne augstāk par plecu līmeni.
- Стало: Stieņa vilkme ar platu tvērienu līdz krūšu apakšai, elkoņi ne augstāk par pleciem: vidējie deltveida un trapecveida muskuļi.

**tech.steps**

- Было: Tvēriens nedaudz platāks par pleciem, stienis pie ķermeņa.<br>Velc ar elkoņiem augšup un uz sāniem, elkoņi augstāk par plaukstām.<br>Ne augstāk par plecu līmeni, bez ķermeņa rāviena.
- Стало: Tvēriens platāks par pleciem (apm. 1,5 reizes), stienis pie augšstilbiem uz taisnām rokām.<br>Velc stieni augšup gar ķermeni, elkoņi vada uz sāniem un augšu.<br>Stienis līdz krūšu apakšai, elkoņi ne augstāk par pleciem; lēnām nolaid. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.errors**

- Было: Ne augstāk par plecu līmeni, bez ķermeņa rāviena.
- Стало: Šaurs tvēriens un elkoņi virs pleciem — pleca impindžmenta risks.<br>Rāviens ar rumpi.<br>Stienis tālu no ķermeņa.

**tech.safety**

- Было: —
- Стало: Elkoņi ne augstāk par plecu līmeni. Ja sāp plecs, neizpildi — aizstāj ar hanteļu vēzieniem uz sāniem.

### `mk-broomstick-pass-throughs`

**tech.errors**

- Было: —
- Стало: Elkoņu saliekšana, lai pārnestu nūju.<br>Ieliekums jostasvietā un ribu izvirzīšana.<br>Pārāk šaurs tvēriens caur sāpēm.

**tech.safety**

- Было: —
- Стало: Tvēriens tik plats, lai pārnešana būtu bez sāpēm; ja traucē pleci — maza amplitūda.

### `mk-cable-bar-pushdown`

**tech.steps**

- Было: Elkoņi piespiesti pie ķermeņa un nekustīgi.<br>Iztaisno rokas līdz galam uz leju.<br>Lēnām atgriez līdz aptuveni 90° leņķim, ķermeni nešūpo.
- Стало: Nostājies ar seju pret bloku, pēdas gurnu platumā, rumpis nedaudz noliekts, rokturis satverts no augšas.<br>Elkoņi piespiesti pie rumpja un nekustīgi.<br>Izelpojot pilnībā iztaisno rokas uz leju.<br>Ieelpojot lēni atgriez līdz apmēram 90° leņķim, rumpi nešūpo.

**tech.errors**

- Было: Lēnām atgriez līdz aptuveni 90° leņķim, ķermeni nešūpo.
- Стало: Elkoņi attālinās no sāniem vai kustas uz priekšu un atpakaļ.<br>Rumpja noliekšana un šūpošana.<br>Nepilna iztaisnošana apakšā.

**tech.safety**

- Было: —
- Стало: Bez sāpēm elkonī; ja ir diskomforts, samazini svaru.

### `mk-cable-pec-fly`

**lib.why**

- Было: Roku savilkšana blokā krūtīm.
- Стало: Krūšu izolācija ar pastāvīgu troses spriegumu visā amplitūdā; papildina spiešanas vingrinājumus.

**tech.steps**

- Было: Solis uz priekšu, ķermenis nedaudz noliekts, elkoņi viegli saliekti un fiksēti.<br>Savieno plaukstas lokā krūšu priekšā.<br>Lēnām atver līdz krūšu izstiepumam.
- Стало: Bloki plecu augstumā vai nedaudz augstāk; satver rokturus, sper soli uz priekšu, viena kāja priekšā, rumpis nedaudz noliekts.<br>Elkoņi nedaudz saliekti; elkoņu leņķi visu kustību nemaini.<br>Izelpojot savirzi plaukstas lokā krūšu priekšā.<br>Ieelpojot lēni atvirzi rokas līdz vieglam krūšu iestiepumam, ne tālāk par plecu līniju.

**tech.errors**

- Было: —
- Стало: Elkoņu saliekšana un iztaisnošana — savilkšana pārvēršas spiešanā.<br>Pārāk plaša izvēršana ar sāpēm pleca priekšpusē.<br>Rumpja šūpošana un rāvieni.

**tech.safety**

- Было: —
- Стало: Izver rokas tikai līdz vieglam krūšu stiepumam bez sāpēm plecā; pleci neiekrīt uz priekšu.

### `mk-cable-seated-rope-face-pull`

**lib.primary**

- Было: Aizmugurējais deltveida, trapeces vidus, rombveida; ārējie rotatori
- Стало: Aizmugurējais deltveida, trapecveida muskuļa vidusdaļa, rombveida; ārējie rotatori

**tech.steps**

- Было: Trose sejas augstumā.<br>Velc pie sejas, izvēršot galus un elkoņus uz sāniem un augšup.<br>Savieno lāpstiņas un lēnām atgriez.
- Стало: Bloks sejas augstumā, virve satverta no augšas; apsēdies, mugura neitrāla, rokas taisnas.<br>Izelpojot velc virvi pie sejas, izvēršot galus uz sāniem; elkoņi plecu augstumā vai nedaudz augstāk.<br>Beigās plaukstas pie ausīm, pleci pagriezti uz āru, lāpstiņas savilktas; noturi 1 s.<br>Ieelpojot lēni atgriez.

**tech.errors**

- Было: —
- Стало: Vilkšana ar rumpi, atliecoties atpakaļ.<br>Elkoņi nolaižas — sanāk vilkme pie krūtīm.<br>Pleci paceļas pie ausīm.

**tech.safety**

- Было: —
- Стало: Viegls svars un lēna atgriešanās, bez sāpēm plecā.

### `mk-cat-camel`

**lib.primary**

- Было: Muguras iztaisnotāji, vēdera muskuļi (mugurkaula mobilizācija, iesildīšanās)
- Стало: Muguras iztaisnotājmuskuļi, vēdera muskuļi (mugurkaula mobilizācija, iesildīšanās)

**tech.errors**

- Было: —
- Стало: Strauji rāvieni.<br>Kustība tikai jostasvietā vai tikai kaklā.<br>Elpas aizturēšana.

**tech.safety**

- Было: —
- Стало: Amplitūda bez sāpēm; ja sāp jostasvieta — mazāka amplitūda.

### `mk-crunches`

**tech.steps**

- Было: Guļus, ceļi saliekti, pēdas uz grīdas.<br>Saritinies, atraujot lāpstiņas no grīdas, jostasvieta piespiesta.<br>Kaklu nevelc ar rokām, nolaižies lēnām.
- Стало: Apgulies uz muguras, ceļi saliekti, pēdas uz grīdas, rokas sakrustotas uz krūtīm vai pirksti pie deniņiem.<br>Izelpojot saliec rumpi, atraujot lāpstiņas no grīdas; jostasvieta piespiesta.<br>Kaklu ar rokām nevelc; ieelpojot lēni nolaidies.

**tech.errors**

- Было: Kaklu nevelc ar rokām, nolaižies lēnām.
- Стало: Galvas vilkšana aiz kakla ar rokām.<br>Jostasvietas atraušana — sanāk rumpja celšana.<br>Rāvieni un krišana atpakaļ.

**tech.safety**

- Было: —
- Стало: Pacel tikai lāpstiņas, jostasvieta piespiesta; ja sāp kakls, turi rokas uz krūtīm.

### `mk-diamond-push-ups`

**tech.steps**

- Было: Plaukstas tuvu zem krūtīm, ķermenis taisnā līnijā.<br>Elkoņi iet gar ķermeni.<br>Nolaiž krūtis pie plaukstām un izspied augšā.
- Стало: Plaukstas tuvu zem krūtīm, ķermenis taisnā līnijā.<br>Elkoņi iet gar ķermeni.<br>Nolaiž krūtis pie plaukstām un izspied augšā. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.errors**

- Было: —
- Стало: Jostasvietas iekrišana.<br>Elkoņi izplešas uz sāniem.<br>Nepilna amplitūda.

**tech.safety**

- Было: —
- Стало: Plaukstas locītavas un elkoņi noslogoti vairāk nekā parastajā atspiešanās: ja par grūtu vai sāp — no ceļiem vai ar plaukstām nedaudz platāk.

### `mk-dumbbell-rear-delt-fly`

**lib.primary**

- Было: Aizmugurējais deltveida, trapeces vidus, rombveida
- Стало: Aizmugurējais deltveida, trapecveida muskuļa vidusdaļa, rombveida

**tech.steps**

- Было: Ķermeni noliec gandrīz paralēli grīdai, mugura taisna.<br>Izplet rokas uz sāniem ar viegli saliektiem elkoņiem.<br>Necel plecus pie ausīm, nolaid lēnām.
- Стало: Pēdas gurnu platumā, ceļi nedaudz saliekti; atvirzi gurnus atpakaļ un noliecies gandrīz paralēli grīdai, mugura neitrāla, kakls turpina muguras līniju.<br>Izelpojot atvirzi rokas uz sāniem līdz plecu līnijai, elkoņi nedaudz saliekti.<br>Plecus necel pie ausīm; ieelpojot lēni nolaid.

**tech.errors**

- Было: Necel plecus pie ausīm, nolaid lēnām.
- Стало: Plecu celšana pie ausīm.<br>Elkoņu saliekšana — kļūst par vilkmi.<br>Rumpja šūpošana, apaļa mugura.

**tech.safety**

- Было: —
- Стало: Viegls svars; ja jostasvietā ir diskomforts, izpildi ar krūtīm atbalstītām pret slīpo solu.

### `mk-dumbbell-seated-overhead-tricep-extension`

**tech.steps**

- Было: Mugura taisna, hantele virs galvas ar abām rokām.<br>Elkoņi vērsti uz priekšu un augšup; neizpleš tos.<br>Nolaiž aiz galvas un iztaisno rokas, nekustinot plecus.
- Стало: Apsēdies uz sola ar atzveltni, mugura piespiesta, vēdera muskuļi sasprindzināti; satver hanteli ar abām plaukstām zem augšējā diska un pacel virs galvas.<br>Elkoņi vērsti uz priekšu un augšu, neizpleti tos.<br>Ieelpojot lēni nolaid hanteli aiz galvas.<br>Izelpojot iztaisno rokas, augšdelmi nekustīgi.

**tech.errors**

- Было: Elkoņi vērsti uz priekšu un augšup; neizpleš tos.
- Стало: Elkoņi izplešas uz sāniem.<br>Ieliekums jostasvietā.<br>Pleci kustas kopā ar apakšdelmiem.

**tech.safety**

- Было: —
- Стало: Hantele virs galvas: turi to stingri ar abām rokām aiz diska. Ja sāp plecs vai elkonis — mazāka amplitūda vai iztaisnošana pie bloka.

### `mk-dumbbell-shrug`

**lib.primary**

- Было: Trapeces augšdaļa
- Стало: Trapecveida muskuļa augšdaļa

**lib.secondary**

- Было: —
- Стало: lāpstiņas cēlājmuskulis; rombveida muskuļi

**tech.steps**

- Было: Hanteles sānos, rokas taisnas.<br>Cel plecus tieši uz augšu pie ausīm un izdari pauzi.<br>Lēnām nolaid, bez plecu griešanas.
- Стало: Hanteles sānos, rokas taisnas.<br>Cel plecus tieši uz augšu pie ausīm un izdari pauzi.<br>Lēnām nolaid, bez plecu griešanas. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.errors**

- Было: —
- Стало: Plecu griešana pa apli.<br>Elkoņu saliekšana — vilkšana ar rokām.<br>Rāvieni un pārāk smagas hanteles ar īsu amplitūdu.

**tech.safety**

- Было: —
- Стало: Kakls neitrāls, galvu uz priekšu nevirzi; ja sāp kakls, samazini svaru.

### `mk-dumbbell-step-up-low`

**lib.primary**

- Было: Četrgalvainais, sēžas muskuļi
- Стало: Četrgalvainais muskulis, sēžas muskuļi

**tech.steps**

- Было: Visa pēda uz paliktņa, ķermenis taisns.<br>Pacelies ar augšējo kāju, neatgrūžoties ar apakšējo.<br>Celis virs pēdas, nolaižies kontrolēti.
- Стало: Nostājies pie platformas, hanteles sānos; novieto visu vienas kājas pēdu uz platformas.<br>Izelpojot paceļies ar augšējās kājas spēku, neatsperoties ar apakšējo; rumpis taisns.<br>Celis virs pēdas; ieelpojot kontrolēti nokāp atpakaļ ar to pašu kāju; izpildi visus atkārtojumus un maini kāju.

**tech.errors**

- Было: Pacelies ar augšējo kāju, neatgrūžoties ar apakšējo.
- Стало: Atgrūšanās ar apakšējo kāju.<br>Ceļgals krīt uz iekšu.<br>Nekontrolēta nokāpšana, «krišana» lejā.

**tech.safety**

- Было: —
- Стало: Paliktnis stabils un neslīd; ja sāp ceļgals — zemāks paliktnis vai bez hantelēm.

### `mk-dumbbell-stiff-leg-deadlift`

**lib.secondary**

- Было: Muguras iztaisnotāji
- Стало: Muguras iztaisnotājmuskuļi

**tech.steps**

- Было: Ceļi nedaudz saliekti, hanteles pie gurniem.<br>Nolieciens, atvirzot gurnus atpakaļ, mugura taisna.<br>Nolaižies līdz augšstilba aizmugures izstiepumam un pacelies ar gurnu grūdienu.
- Стало: Nostājies taisni, pēdas gurnu platumā, ceļi nedaudz saliekti, hanteles pie augšstilbiem.<br>Ieelpojot virzi gurnus atpakaļ un noliecies, hanteles slīd gar kājām, mugura neitrāla.<br>Nolaidies līdz augšstilba mugurējās virsmas iestiepumam; izelpojot paceļies, virzot gurnus uz priekšu.

**tech.errors**

- Было: —
- Стало: Apaļa mugura.<br>Hanteles attālinās no kājām.<br>Nolaišanās zemāk, nekā ļauj neitrāla mugura.

**tech.safety**

- Было: —
- Стало: Dziļums — tikai līdz augšstilba aizmugures stiepumam ar neitrālu muguru; ja sāp jostasvieta — pārtrauc.

### `mk-elliptical`

**lib.primary**

- Было: Četrgalvainais, sēžas muskuļi, augšstilba aizmugure (kardio)
- Стало: Četrgalvainais muskulis, sēžas muskuļi, augšstilba aizmugure (kardio)

**tech.steps**

- Было: Stāvi taisni, nekarājies uz rokturiem.<br>Spied ar visu pēdu, papēdis neatdalās.<br>Vienmērīgs temps, rokas strādā kopā ar kājām.
- Стало: Stāvi taisni, nekaries uz margām.<br>Spied ar visu pēdu, papēdis neatraujas no pedāļa.<br>Turi vienmērīgu tempu, rokas strādā kopā ar kājām.

**tech.errors**

- Было: Stāvi taisni, nekarājies uz rokturiem.<br>Spied ar visu pēdu, papēdis neatdalās.
- Стало: Atbalstīšanās uz margām.<br>Darbs uz pirkstgaliem, papēži atraujas.<br>Saliekta mugura un skats uz leju.<br>Pārāk liela pretestība — raustīšanās.

**tech.safety**

- Было: —
- Стало: Uzkāp un nokāp tikai tad, kad pedāļi apstājušies, turoties pie nekustīgajiem rokturiem.

### `mk-ez-bar-preacher-curl`

**tech.steps**

- Было: Tricepss cieši uz polstera, rokas gandrīz taisnas.<br>Saliec, neatraujot elkoņus.<br>Lēnām nolaid, galā strauji neiztaisnojot.
- Стало: Apsēdies, paduses pie polstera malas, tricepss cieši uz tā; EZ stienis satverts no apakšas pie izliekumiem.<br>Izelpojot saliec rokas, elkoņi neatraujas no polstera.<br>Ieelpojot lēni nolaid līdz gandrīz taisnām rokām, beigās neiztaisnojot asi.

**tech.errors**

- Было: Lēnām nolaid, galā strauji neiztaisnojot.
- Стало: Elkoņi atraujas no spilvena.<br>Strauja «nomešana» līdz pilnai iztaisnošanai apakšā.<br>Plecu celšana un rumpja šūpošana.

**tech.safety**

- Было: —
- Стало: Apakšā bicepsa cīpsla ir visvairāk noslogota: nolaid lēnām, bez rāvieniem un cietas elkoņa «aizslēgšanas».

### `mk-ez-bar-skullcrusher`

**tech.steps**

- Было: Guļus, stienis virs pleciem, pleci nekustīgi.<br>Liec tikai elkoņos, stienis pie pieres vai aiz galvas.<br>Elkoņus neizplet, iztaisno līdz taisnām rokām.
- Стало: Guļus, stienis virs pleciem, pleci nekustīgi.<br>Saliec tikai elkoņus un nolaid stieni pie pieres (līdz matu līnijai).<br>Elkoņus neizplet, iztaisno līdz taisnām rokām. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.errors**

- Было: Elkoņus neizplet, iztaisno līdz taisnām rokām.
- Стало: Elkoņi izplešas uz sāniem.<br>Pleci kustas — sanāk pulovers vai spiešana.<br>Pārāk liels svars un ātra nolaišana pie galvas.

**tech.safety**

- Было: —
- Стало: Stienis nolaižas pie galvas — ņem svaru, ko kontrolē; smagi piegājieni — ar drošinātāju. Ja sāp elkoņi — iztaisnošana pie bloka.

### `mk-front-plank`

**tech.steps**

- Было: Elkoņi zem pleciem, ķermenis taisnā līnijā.<br>Prese un sēžamvieta saspringta, iegurnis neiegrimst un nav uzrauts.<br>Vienmērīga elpošana.
- Стало: Balsts uz apakšdelmiem, elkoņi zem pleciem, pēdas gurnu platumā.<br>Ķermenis taisnā līnijā no galvas līdz papēžiem, skats uz grīdu.<br>Sasprindzini vēdera un sēžas muskuļus; iegurni nenolaid un necel.<br>Elpo vienmērīgi, neaizturi elpu.

**tech.errors**

- Было: Prese un sēžamvieta saspringta, iegurnis neiegrimst un nav uzrauts.
- Стало: Jostasvietas iekrišana.<br>Iegurnis pacelts «mājiņā».<br>Elpas aizturēšana.

**tech.safety**

- Было: —
- Стало: Turi tikai tik ilgi, kamēr ķermenis ir taisnā līnijā; ja sāp jostasvieta — pārtrauc.

### `mk-hanging-knee-raises`

**lib.primary**

- Было: Taisnais vēdera muskulis, jostas-gūžas muskulis
- Стало: Taisnais vēdera muskulis, gūžas saliecēji

**lib.secondary**

- Было: —
- Стало: Slīpie vēdera muskuļi; tvēriens.

**tech.steps**

- Было: Karājies uz taisnām rokām, bez šūpošanās.<br>Pievelc ceļus pie krūtīm, piegriežot iegurni.<br>Lēnām nolaid, nemet kājas.
- Стало: Nokaries pie stieņa ar tvērienu no augšas plecu platumā, pleci nedaudz nolaisti, bez šūpošanās.<br>Izelpojot pievelc ceļus pie krūtīm, iegurni pagriežot atpakaļ.<br>Ieelpojot lēni nolaid kājas, nemet tās.

**tech.errors**

- Было: Lēnām nolaid, nemet kājas.
- Стало: Ķermeņa šūpošana.<br>Ceļi paceļas bez iegurņa pagriešanas — strādā tikai gūžas saliecēji.<br>Kāju nomešana.

**tech.safety**

- Было: —
- Стало: Ja sāp pleci vai jostasvieta — ceļu celšana guļus vai «beigtā vabole».

### `mk-hip-hinge-drill`

**lib.primary**

- Было: Augšstilba aizmugure, sēžas muskuļi, muguras iztaisnotāji (iesildīšanās)
- Стало: Augšstilba aizmugure, sēžas muskuļi, muguras iztaisnotājmuskuļi (iesildīšanās)

**tech.steps**

- Было: Pēdas gurnu platumā, ceļi nedaudz saliekti.<br>Atvirzi gurnus atpakaļ, mugura neitrāla.<br>Atgriezies ar gurnu grūdienu uz priekšu.
- Стало: Nostājies, pēdas gurnu platumā, ceļi nedaudz saliekti, plaukstas uz augšstilbiem.<br>Virzi gurnus atpakaļ, plaukstas slīd uz ceļiem, mugura neitrāla.<br>Apstājies, kad sajūti augšstilba mugurējās virsmas sasprindzinājumu.<br>Atgriezies, virzot gurnus uz priekšu. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.errors**

- Было: —
- Стало: Apaļa mugura.<br>Ceļu saliekšana gūžu atvirzīšanas vietā — sanāk pietupiens.<br>Jostasvietas pārliekšana augšā.

**tech.safety**

- Было: —
- Стало: Noliecies tikai līdz augšstilba aizmugures stiepumam ar neitrālu muguru.

### `mk-incline-treadmill-walk`

**tech.steps**

- Было: Ķermenis taisns, neturies pie rokturiem.<br>Solis no papēža uz pirkstgalu, rokas strādā.<br>Slīpums neliels, temps možs.
- Стало: Piesprād avārijas apturēšanas atslēgu, sāc bez slīpuma un lēnā tempā.<br>Pakāpeniski pievieno nelielu slīpumu.<br>Rumpis taisns, pie margām neturies, solis no papēža uz pirkstgalu, rokas strādā.

**tech.errors**

- Было: Ķermenis taisns, neturies pie rokturiem.
- Стало: Turies pie margām un atliecies atpakaļ.<br>Pārāk liels slīpums — iešana uz pirkstgaliem.<br>Rumpis noliecas uz priekšu.<br>Pēkšņa lentes apturēšana.

**tech.safety**

- Было: —
- Стало: Piestiprini avārijas atslēgu; slīpumu un ātrumu palielini pakāpeniski; ja sāp Ahilleja cīpsla vai apakšstilbs, samazini slīpumu.

### `mk-indoor-cycling-spin`

**lib.primary**

- Было: Četrgalvainais, sēžas muskuļi, ikri (kardio)
- Стало: Četrgalvainais muskulis, sēžas muskuļi, ikri (kardio)

**tech.errors**

- Было: —
- Стало: Pārāk zems sēdeklis — ceļgals apakšā stipri saliekts.<br>Ceļgali iet uz sāniem.<br>Rumpja šūpošana un visa svara atbalstīšana uz stūres.

**tech.safety**

- Было: —
- Стало: Pirms starta nofiksē sēdekli un stūri; pēdas pedāļu siksnās; spararatu aptur ar bremzi, nevis ar kājām.

### `mk-parralel-bar-dips`

**lib.primary**

- Было: Tricepss, krūšu apakšdaļa, priekšējais deltveida
- Стало: Tricepss, lielais krūšu muskulis (krūšu kaula–ribu, apakšējā daļa)

**lib.secondary**

- Было: —
- Стало: Deltveida muskuļa priekšējā daļa; mazais krūšu muskulis un trapecveida muskuļa apakšdaļa nolaiž lāpstiņas; platie muguras muskuļi un rombveida muskuļi stabilizē

**tech.steps**

- Было: Starts uz taisnām rokām, pleci nolaisti.<br>Nolaižies līdz elkoņa leņķim ~90°, plecus nebīdi uz priekšu.<br>Izspied augšā, nebloķējot elkoņus ar rāvienu.
- Стало: Balsts uz līdztekām ar taisnām rokām, pleci nolaisti, rumpis nedaudz noliekts uz priekšu.<br>Ieelpojot kontrolēti nolaidies līdz apmēram 90° leņķim elkonī; plecus nevirzi uz priekšu un leju.<br>Izelpojot izspiedies augšup, nebloķējot elkoņus ar rāvienu.

**tech.errors**

- Было: Nolaižies līdz elkoņa leņķim ~90°, plecus nebīdi uz priekšu.<br>Izspied augšā, nebloķējot elkoņus ar rāvienu.
- Стало: Nolaišanās dziļāk par ~90° elkonī vai ar sāpēm pleca priekšpusē.<br>Pleci paceļas pie ausīm vai iekrīt uz priekšu.<br>Šūpošanās un rāviens augšup.

**tech.safety**

- Было: —
- Стало: Liela slodze pleca priekšpusei: nenolaidies zemāk par ~90° elkonī. Ja sāp plecs — aizstāj ar spiešanu ar šauru tvērienu vai atspiešanos no grīdas. Ja par grūtu — gravitrons vai gumija.

### `mk-prone-y-t-raises`

**lib.primary**

- Было: Trapeces apakšdaļa un vidus, aizmugurējais deltveida
- Стало: Trapecveida muskuļa apakšējā un vidējā daļa, aizmugurējais deltveida

**lib.why**

- Было: Roku celšana guļus uz vēdera trapeces apakšdaļai un vidum.
- Стало: Roku celšana guļus uz vēdera trapecveida muskuļa apakšējai un vidējai daļai.

**tech.steps**

- Было: Guļus ar seju uz leju, rokas izstieptas.<br>Cel taisnas rokas burtā Y, tad T, īkšķi uz augšu.<br>Turi jostasvietu neitrālu, nepalīdzi ar to.
- Стало: Apgulies uz vēdera, piere uz dvieļa, rokas izstieptas uz priekšu.<br>Izelpojot pacel taisnas rokas Y burta formā, īkšķi uz augšu; ieelpojot nolaid.<br>To pašu T burta formā — rokas uz sāniem.<br>Savelc lāpstiņas uz leju un pie mugurkaula, ar jostasvietu nepalīdzi.

**tech.errors**

- Было: Turi jostasvietu neitrālu, nepalīdzi ar to.
- Стало: Ieliekums jostasvietā un krūšu pacelšana no grīdas.<br>Pleci ceļas pie ausīm.<br>Rāvieni lēnas pacelšanas vietā.<br>Galva atmesta atpakaļ.

**tech.safety**

- Было: —
- Стало: Bez svara vai ar ļoti vieglu; rokas paceļas nedaudz, bez sāpēm plecā.

### `mk-rkc-plank`

**lib.why**

- Было: Tur jostasvietu no ieliekuma, tāpat kā preses rullītis.
- Стало: Planka ar maksimālu vēdera un sēžas muskuļu sasprindzinājumu; īsi noturējumi.

**tech.steps**

- Было: Atbalsts uz apakšdelmiem, ķermenis taisnā līnijā.<br>Saspied sēžamvietu un presi, velc elkoņus uz pirkstgaliem.<br>Jostasvieta neiegrimst, elpošana vienmērīga.
- Стало: Balsts uz apakšdelmiem, elkoņi zem pleciem, ķermenis taisnā līnijā.<br>Spēcīgi saspied sēžas un vēdera muskuļus, velc elkoņus pret pirkstgaliem (bez kustības).<br>Jostasvieta neieliecas; elpo vienmērīgi, neaizturi elpu.

**tech.errors**

- Было: Jostasvieta neiegrimst, elpošana vienmērīga.
- Стало: Ieliekums jostasvietā.<br>Elpas aizturēšana.<br>Sēžas muskuļu atslābināšana pēc dažām sekundēm.<br>Pārāk ilgs piegājiens — spriedze samazinās.

**tech.safety**

- Было: —
- Стало: Ļoti intensīva planka: elpo, neaizturi elpu; ar paaugstinātu asinsspiedienu — parastā planka.

### `mk-rowing-machine-steady-state`

**lib.primary**

- Было: Platie muguras muskuļi, augšstilba aizmugure, sēžas muskuļi, četrgalvainais (kardio)
- Стало: četrgalvainais muskulis, sēžas muskuļi, augšstilba aizmugure, platie muguras muskuļi (kardio)

**tech.errors**

- Было: —
- Стало: Vilkšana ar rokām, pirms kājas pabeigušas atgrūdienu.<br>Apaļa mugura un spēcīga atliekšanās atpakaļ.<br>Ceļu saliekšana, pirms rokturis atgriežoties paiet tiem garām.

**tech.safety**

- Было: —
- Стало: Pēdas droši piesprādzētas; ja sāp jostasvieta, samazini tempu un pretestību.

### `mk-standing-calf-raise-machine`

**tech.steps**

- Было: Polsteri uz pleciem, pirkstgali uz platformas malas.<br>Pacelies maksimāli uz pirkstgaliem un izdari pauzi.<br>Lēnām nolaid papēžus zem platformas, ceļus neliec.
- Стало: Nostājies zem polsteriem, pirkstgali uz platformas malas, ceļi taisni, bet nebloķēti.<br>Izelpojot paceļies uz pirkstgaliem pēc iespējas augstāk, noturi 1 s.<br>Ieelpojot lēni nolaid papēžus zem platformas līmeņa, ceļus nesaliec.

**tech.safety**

- Было: —
- Стало: Neaizslēdz ceļus; nolaid lēnām, bez sāpēm Ahilleja cīpslā.

### `mk-treadmill-run`

**lib.primary**

- Было: Četrgalvainais, sēžas muskuļi, augšstilba aizmugure, ikri (kardio)
- Стало: Četrgalvainais muskulis, sēžas muskuļi, augšstilba aizmugure, ikri (kardio)

**tech.steps**

- Было: Ķermenis taisns, skatiens uz priekšu, neturies pie rokturiem.<br>Piezemējies zem smaguma centra, solis īss.<br>Rokas saliektas aptuveni 90° un strādā ritmā.
- Стало: Piesprād avārijas apturēšanas atslēgu pie apģērba, nostājies uz sānu malām un iedarbini lenti ar mazu ātrumu.<br>Uzkāp uz lentes un ātrumu palielini pakāpeniski.<br>Rumpis taisns, skats uz priekšu, pie margām neturies.<br>Piezemējies zem smaguma centra, solis īss; rokas saliektas apmēram 90°.

**tech.errors**

- Было: Ķermenis taisns, skatiens uz priekšu, neturies pie rokturiem.
- Стало: Turies pie margām.<br>Garš solis ar triecienu papēdī tālu ķermeņa priekšā.<br>Skriešana pašā lentes malā.<br>Nolēkšana no kustīgas lentes.

**tech.safety**

- Было: —
- Стало: Piestiprini avārijas atslēgu; ātrumu maini pakāpeniski; nenolec no kustīgas lentes.

### `mk-walking-knee-hugs`

**lib.primary**

- Было: Jostas-gūžas muskulis, sēžas muskuļi (stiepšana), četrgalvainais (iesildīšanās)
- Стало: Lielais sēžas muskulis un augšstilba aizmugure paceltajai kājai (dinamiska stiepšana); atbalsta kājas ikri (pacelšanās uz pirkstgala)

**tech.steps**

- Было: Solis, pievelc celi pie krūtīm ar rokām.<br>Stāvi uz atbalsta kājas pirkstgala, ķermenis taisns.<br>Pamīšus, mierīgā tempā.
- Стало: Sper soli, apķer otras kājas celi ar rokām un pievelc to pie krūtīm.<br>Paceļies uz balsta kājas pirkstgaliem, rumpis taisns.<br>Nolaid kāju, sper soli un atkārto ar otru kāju mierīgā tempā.

**tech.errors**

- Было: —
- Стало: Saliekta stāja, rumpja noliekšana pie ceļa.<br>Līdzsvara zaudēšana steigas dēļ.<br>Ceļa raušana pie krūtīm caur sāpēm.

**tech.safety**

- Было: —
- Стало: Bez sāpēm gūžas locītavā un ceļgalā; ja līdzsvars vājš — necelies uz pirkstgala, paliec blakus atbalstam.

### `neck-retraction`

**tech.steps**

- Было: Sēdi vai stāvi, skatiens līmenī, pleci nolaisti. Mugurkauls neitrāls.<br>Bīdi galvu taisni atpakaļ, paralēli grīdai („dubultzods”), nenolaižot zodu un nepaceļot to.<br>Īsa noturēšana, tad atgriezies neitrālā stāvoklī — nevis galvā, kas izbāzta uz priekšu.
- Стало: Sēdi vai stāvi, skatiens līmenī, pleci nolaisti. Mugurkauls neitrāls.<br>Bīdi galvu taisni atpakaļ, paralēli grīdai („dubultzods”), nenolaižot zodu un nepaceļot to.<br>Īsa noturēšana, tad atgriezies neitrālā stāvoklī — nevis galvā, kas izbāzta uz priekšu. Elpo vienmērīgi, neaizturi elpu.

**tech.safety**

- Было: Neliela amplitūda, kas paliek nesāpīga; skatiens paliek līmenī.
- Стало: Neliela amplitūda, kas paliek nesāpīga; skatiens paliek līmenī. Kustība neliela un lēna; ja reibst galva vai sāp kakls, pārtrauc.

### `negative-pullup`

**lib.secondary**

- Было: Bicepss; aizmugurējie deltveida; rombveida muskuļi; trapecveida apakšdaļa; korpuss.
- Стало: Bicepss; aizmugurējie deltveida; rombveida muskuļi; trapecveida apakšdaļa; rumpja muskuļi.

### `nlc`

**tech.steps**

- Было: Nostājies uz ceļiem, nofiksē papēžus (partneris/atbalsts).<br>Ķermenis taisns no ceļiem līdz galvai.<br>Lēni krīti uz priekšu, pretojoties ar augšstilba aizmuguri.<br>Uztver sevi ar rokām un atgriezies ar atgrūdienu.
- Стало: Nostājies uz ceļiem, nofiksē papēžus (partneris/atbalsts).<br>Ķermenis taisns no ceļiem līdz galvai.<br>Lēni krīti uz priekšu, pretojoties ar augšstilba aizmuguri.<br>Uztver sevi ar rokām un atgriezies ar atgrūdienu. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: Liela slodze: sāc ar mazu apjomu, muskuļu sāpes ir normālas.
- Стало: Liela slodze: sāc ar mazu apjomu, muskuļu sāpes ir normālas. Papēžus nostiprini droši (partneris vai smags balsts, nevis dīvāns, kas var pabīdīties); pie asām sāpēm augšstilba mugurējā virsmā nekavējoties pārtrauc.

### `ohp`

**lib.secondary**

- Было: Tricepss, krūšu augšdaļa, vēdera prese
- Стало: Tricepss, krūšu augšdaļa, vēdera muskuļi

**lib.why**

- Было: Pamata spiešana virs galvas plecu spēkam un korpusa stabilitātei.
- Стало: Pamata spiešana virs galvas plecu spēkam un rumpja stabilitātei.

**tech.steps**

- Было: Stāvus, stienis uz krūšu augšdaļas, tvēriens nedaudz platāks par pleciem.<br>Sasprindzini presi un sēžas muskuļus.<br>Izelpojot spied stieni augšup, atvirzot galvu atpakaļ, tad zem stieņa.<br>Kontrolēti nolaid uz krūšu augšdaļu.
- Стало: Noņem stieni no statīva krūšu augstumā un atkāpies soli; pēdas gurnu platumā, tvēriens nedaudz platāks par pleciem, stienis uz krūšu augšdaļas.<br>Sasprindzini presi un sēžas muskuļus.<br>Izelpojot spied stieni augšup, atvirzot galvu atpakaļ, tad zem stieņa.<br>Kontrolēti nolaid uz krūšu augšdaļu.

**tech.safety**

- Было: —
- Стало: Smagi — rāmī, noņem stieni no statīviem plecu augstumā; ja sāp jostasvieta — spiešana sēdus ar atzveltni.

### `pallof-press`

**lib.why**

- Было: Māca korpusam pretoties trosei, kas griež ķermeni.
- Стало: Māca rumpim pretoties trosei, kas griež ķermeni.

**tech.steps**

- Было: Stāvies sāniski pret bloku krūšu augstumā, rokturis abās rokās pie krūtīm, pēdas aptuveni iegurņa platumā, korpuss sasprindzināts. Trose velk korpusu griezienā — pretojies tam.<br>Izspied rokturi taisni uz priekšu līdz taisnām rokām, nepagriežot plecus vai iegurni pret bloku. Pauze.<br>Atgriez rokturi pie krūtīm lēni, joprojām negriežoties.
- Стало: Stāvies sāniski pret bloku krūšu augstumā, rokturis abās rokās pie krūtīm, pēdas aptuveni iegurņa platumā, rumpis sasprindzināts. Trose velk rumpi griezienā — pretojies tam.<br>Izspied rokturi taisni uz priekšu līdz taisnām rokām, nepagriežot plecus vai iegurni pret bloku. Pauze.<br>Atgriez rokturi pie krūtīm lēni, joprojām negriežoties. Elpo vienmērīgi, neaizturi elpu.

**tech.errors**

- Было: Korpusa pagriešanās līdzi trosei<br>noliekšanās uz sāniem<br>tik liels svars, ka zūd neitrāls stāvoklis.
- Стало: Rumpja pagriešanās līdzi trosei<br>noliekšanās uz sāniem<br>tik liels svars, ka zūd neitrāls stāvoklis.

**tech.safety**

- Было: No roktura pie krūtīm līdz taisnām rokām krūšu kaula priekšā. Korpusa griešana nav mērķis.
- Стало: No roktura pie krūtīm līdz taisnām rokām krūšu kaula priekšā. Rumpja griešana nav mērķis. Svars tāds, lai rumpis negrieztos; ja sāp jostasvieta, pārtrauc.

### `pec-deck`

**lib.secondary**

- Было: Priekšējie deltveida; bicepsa īsā galva. Tricepss gandrīz nestrādā.
- Стало: Deltveida muskuļa priekšējā daļa; knābjveida-augšdelma muskulis. Tricepss gandrīz nestrādā.

**tech.steps**

- Было: Mugura pret polsteri, lāpstiņas piespiestas, apakšdelmi uz trenažiera vertikālajiem polsteriem, elkoņi viegli saliekti un fiksēti.<br>Savilkšanas loks horizontālā plaknē. Elkoņa leņķis nemainās.<br>Savilkšana priekšā krūtīm bez sitiena. Atpakaļceļš līdz iestiepumam, plecam neizkrītot uz priekšu.
- Стало: Mugura pret polsteri, lāpstiņas piespiestas, apakšdelmi uz trenažiera vertikālajiem polsteriem, elkoņi viegli saliekti un fiksēti.<br>Savilkšanas loks horizontālā plaknē. Elkoņa leņķis nemainās.<br>Savilkšana priekšā krūtīm bez sitiena. Atpakaļceļš līdz iestiepumam, plecam neizkrītot uz priekšu. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: Līdz roku savilkšanai priekšā krūtīm un atpakaļ līdz iestiepumam, pleciem neizkrītot uz priekšu.
- Стало: Līdz roku savilkšanai priekšā krūtīm un atpakaļ līdz iestiepumam, pleciem neizkrītot uz priekšu. Neatvirzi rokas tālāk par plecu līniju; ja sāp pleca priekšpuse, samazini amplitūdu.

### `pendlay-row`

**lib.secondary**

- Было: Aizmugurējie deltveida; bicepss; muguras atliecēji tur rumpi horizontāli.
- Стало: Aizmugurējie deltveida; bicepss; muguras iztaisnotājmuskuļi tur rumpi horizontāli.

**tech.steps**

- Было: Stienis uz grīdas. Rumpis apmēram paralēls grīdai, mugura neitrāla, tvēriens no augšas nedaudz platāks par pleciem. Katrs atkārtojums sākas no pilnas apstāšanās uz grīdas.<br>Sprādzienveida vilkme uz krūšu apakšu vai vēdera augšu, lāpstiņas savilkas. Rumpis nepaceļas kopā ar stieni.<br>Stienis pieskaras rumpim, tad kontrolēti atgriežas uz grīdas līdz pilnai apstājai.
- Стало: Stienis uz grīdas. Rumpis apmēram paralēls grīdai, mugura neitrāla, tvēriens no augšas nedaudz platāks par pleciem. Katrs atkārtojums sākas no pilnas apstāšanās uz grīdas.<br>Sprādzienveida vilkme uz krūšu apakšu vai vēdera augšu, lāpstiņas savilkas. Rumpis nepaceļas kopā ar stieni.<br>Stienis pieskaras rumpim, tad kontrolēti atgriežas uz grīdas līdz pilnai apstājai. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.errors**

- Было: Rumpis ceļas augšup (tā jau ir vilkme noliekusies ar šūpošanu)<br>Stienis netiek nolikts uz grīdas<br>Jostas noapaļošana
- Стало: Rumpis ceļas augšup (tā jau ir vilkme noliekusies ar šūpošanu)<br>Stienis starp atkārtojumiem netiek nolikts uz grīdas.<br>Jostas noapaļošana

**tech.safety**

- Было: No grīdas līdz pieskārienam krūšu apakšai, rumpim paralēli grīdai.
- Стало: No grīdas līdz pieskārienam krūšu apakšai, rumpim paralēli grīdai. Liela slodze jostasvietai: katrs atkārtojums ar neitrālu muguru; ja sāp jostasvieta — vilkme ar krūšu atbalstu.

### `pistol-squat`

**lib.primary**

- Было: Atbalsta kājas četrgalvainais; sēžas muskuļi.
- Стало: Atbalsta kājas četrgalvainais muskulis; sēžas muskuļi.

**lib.secondary**

- Было: Pievilcēji; augšstilba aizmugure; ikri; korpuss. Brīvā kāja izmanto gūžas saliecējus, lai noturētu to priekšā.
- Стало: Pievilcēji; augšstilba aizmugure; ikri; rumpja muskuļi. Brīvā kāja izmanto gūžas saliecējus, lai noturētu to priekšā.

**tech.steps**

- Было: Stāvies uz vienas kājas, brīvā kāja izstiepta uz priekšu, rokas priekšā līdzsvaram.<br>Pietupies lēni uz atbalsta kājas: gūžas atpakaļ un lejup, celis virzienā uz pirkstiem, papēdis uz grīdas. Brīvā kāja nepieskaras grīdai.<br>Apakšā atbalsta augšstilbs ir aptuveni paralēli grīdai vai zemāk, ja to vēl vari kontrolēt. Pieceļies, neatspiežoties ar brīvo kāju.<br>Variants: Vieglāks variants: turi atbalstu vai sēdies uz boksa.
- Стало: Stāvies uz vienas kājas, brīvā kāja izstiepta uz priekšu, rokas priekšā līdzsvaram.<br>Pietupies lēni uz atbalsta kājas: gūžas atpakaļ un lejup, celis virzienā uz pirkstiem, papēdis uz grīdas. Brīvā kāja nepieskaras grīdai.<br>Apakšā atbalsta augšstilbs ir aptuveni paralēli grīdai vai zemāk, ja to vēl vari kontrolēt. Pieceļies, neatspiežoties ar brīvo kāju.<br>Variants: Vieglāks variants: turi atbalstu vai sēdies uz boksa. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: Tikai tik dziļi, cik papēdis paliek uz grīdas un mugura paliek kontrolē, parasti ap paralēli vai zemāk.
- Стало: Tikai tik dziļi, cik papēdis paliek uz grīdas un mugura paliek kontrolē, parasti ap paralēli vai zemāk. Sāc ar atbalstu rokai vai pietupienu uz kastes; ja sāp celis, pārtrauc.

### `plank-advanced`

**tech.steps**

- Было: Planka uz apakšdelmiem, pēdas uz stabila paaugstinājuma (sols vai bokss), ķermenis taisnā līnijā.<br>Statiska noturēšana: iegurnis neiekrīt un nepaceļas „mājiņā”, ribas nolaistas.<br>Noturi bez iegurņa iekrīšanas, tad nolaid ceļus uz grīdas.<br>Statiska noturēšana.
- Стало: Planka uz apakšdelmiem, pēdas uz stabila paaugstinājuma (sols vai bokss), ķermenis taisnā līnijā.<br>Statiska noturēšana: iegurnis neiekrīt un nepaceļas „mājiņā”, ribas nolaistas.<br>Noturi bez iegurņa iekrīšanas, tad nolaid ceļus uz grīdas.

### `plate-pinch`

**tech.steps**

- Было: Stāvies un saspied vienu gludu disku šķipsnā: īkšķis pret pārējiem pirkstiem, roka gar ķermeni.<br>Noturi šķipsnu ar nolaistu plecu. Disks nekarājas uz pirkstiem no augšas kā āķī (tas ir parasts tvēriens).<br>Noliec disku uz grīdas kontrolēti. Nemet to uz pirkstiem.<br>Statiska noturēšana.
- Стало: Stāvies un saspied vienu gludu disku šķipsnā: īkšķis pret pārējiem pirkstiem, roka gar ķermeni.<br>Noturi šķipsnu ar nolaistu plecu. Disks nekarājas uz pirkstiem no augšas kā āķī (tas ir parasts tvēriens).<br>Noliec disku uz grīdas kontrolēti. Nemet to uz pirkstiem.<br>Statiska noturēšana. Elpo vienmērīgi, neaizturi elpu.

**tech.safety**

- Было: Disks turēts šķipsnā taisnā rokā gar ķermeni.
- Стало: Disks turēts šķipsnā taisnā rokā gar ķermeni. Turi disku sānis zemu virs grīdas, ne virs pēdas; ja sāp pirksti, pārtrauc.

### `ppu`

**tech.safety**

- Было: —
- Стало: Nolaidies lēnām, nesit galvu; ja sāp pleci — parastā atspiešanās.

### `pu`

**lib.secondary**

- Было: Tricepss, priekšējie deltveida, vēdera prese
- Стало: Tricepss, priekšējie deltveida, vēdera muskuļi

**lib.why**

- Было: Pamatvingrinājums bez inventāra krūtīm un rokām, kas trenē arī korpusa stabilitāti. Piemērots mājām un iesildīšanai.
- Стало: Pamatvingrinājums bez inventāra krūtīm un rokām, kas trenē arī rumpja stabilitāti. Piemērots mājām un iesildīšanai.

**tech.steps**

- Было: Balsts guļus, plaukstas aptuveni zem pleciem, ķermenis taisnā līnijā no galvas līdz papēžiem.<br>Sasprindzini vēdera presi un sēžas muskuļus.<br>Ieelpojot nolaidies, līdz krūtis gandrīz pieskaras grīdai, elkoņi ~45° pret korpusu.<br>Izelpojot atspiedies augšup.
- Стало: Balsts guļus, plaukstas aptuveni zem pleciem, ķermenis taisnā līnijā no galvas līdz papēžiem.<br>Sasprindzini vēdera muskuļus un sēžas muskuļus.<br>Ieelpojot nolaidies, līdz krūtis gandrīz pieskaras grīdai, elkoņi ~45° pret rumpi.<br>Izelpojot atspiedies augšup.

### `pull`

**lib.primary**

- Было: Platākie muguras muskuļi
- Стало: Platie muguras muskuļi

### `push-press`

**lib.secondary**

- Было: Tricepss; četrgalvainie un sēžas muskuļi pietupienā un atspērienā; korpuss; trapecveida augšdaļa un priekšējais zobainais muskulis augšējā punktā.
- Стало: Tricepss; četrgalvainie muskuļi un sēžas muskuļi pietupienā un atspērienā; rumpja muskuļi; trapecveida augšdaļa un priekšējais zobainais muskulis augšējā punktā.

**tech.steps**

- Было: Stāvus, pēdas gūžu vai plecu platumā. Hanteles pie pleciem, plaukstas uz priekšu vai pret otru, elkoņi nedaudz korpusa priekšā. Korpuss sasprindzināts, ribas lejā.<br>Īss pietupiens (ceturtdaļpietupiens), ceļi virzās uz priekšu, korpuss vertikāls. Uzreiz spēcīgi iztaisno kājas un ar šo atspērienu izspied hanteles uz augšu.<br>Rokas taisnas virs galvas, hanteles virs pleciem, bicepss pie ausīm. Nolaid hanteles līdz pleciem kontrolēti, nedaudz mīkstinot ceļus.
- Стало: Stāvus, pēdas gūžu vai plecu platumā. Hanteles pie pleciem, plaukstas uz priekšu vai pret otru, elkoņi nedaudz rumpja priekšā. Rumpis sasprindzināts, ribas lejā.<br>Īss pietupiens (ceturtdaļpietupiens), ceļi virzās uz priekšu, rumpis vertikāls. Uzreiz spēcīgi iztaisno kājas un ar šo atspērienu izspied hanteles uz augšu.<br>Rokas taisnas virs galvas, hanteles virs pleciem, bicepss pie ausīm. Nolaid hanteles līdz pleciem kontrolēti, nedaudz mīkstinot ceļus. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.errors**

- Было: Pārāk dziļš vai lēns pietupiens<br>korpusa noliekšana uz priekšu pietupienā<br>jostasvietas ieliekums augšējā punktā<br>hanteles aiziet uz priekšu<br>spiešana ar rokām, pirms kājas pabeigušas atspērienu.
- Стало: Pārāk dziļš vai lēns pietupiens<br>rumpja noliekšana uz priekšu pietupienā<br>jostasvietas ieliekums augšējā punktā<br>hanteles aiziet uz priekšu<br>spiešana ar rokām, pirms kājas pabeigušas atspērienu.

**tech.safety**

- Было: No pleciem līdz pilnai roku iztaisnošanai virs galvas. Ja sāp plecs vai jostasvieta — neveikt. Karodziņi s/p: tikai bez sūdzībām un pēc stingrās spiešanas apgūšanas.
- Стало: No pleciem līdz pilnai roku iztaisnošanai virs galvas. Ja sāp plecs vai jostasvieta — neveikt. Tikai pēc stingrās spiešanas stāvus apgūšanas.

### `rdl`

**lib.secondary**

- Было: Muguras taisnotāji, apakšdelmi
- Стало: Muguras iztaisnotājmuskuļi, apakšdelmi

**tech.safety**

- Было: —
- Стало: Dziļums — tikai kamēr mugura neitrāla; ja sāp jostasvieta — pārtrauc.

### `rdl-band`

**lib.secondary**

- Было: Muguras iztaisnotāji
- Стало: Muguras iztaisnotājmuskuļi

**tech.steps**

- Было: Nostājies uz gumijas vidus, pēdas gurnu platumā, gumijas gali rokās.<br>Ceļi nedaudz saliekti; atbīdot gurnus atpakaļ, noliecies ar taisnu muguru, rokas slīd gar kājām.<br>Nolaidies līdz augšstilba aizmugures stiepumam, mugura paliek taisna.<br>Atgriezies stāvus, virzot gurnus uz priekšu un saspiežot sēžas muskuļus.
- Стало: Nostājies uz gumijas vidus, pēdas gurnu platumā, gumijas gali rokās.<br>Ceļi nedaudz saliekti; atbīdot gurnus atpakaļ, noliecies ar taisnu muguru, rokas slīd gar kājām.<br>Nolaidies līdz augšstilba aizmugures stiepumam, mugura paliek taisna.<br>Atgriezies stāvus, virzot gurnus uz priekšu un saspiežot sēžas muskuļus. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: Ar muguras ierobežojumu — uzmanīgi: viegla gumija un īsa amplitūda; ja sāp, nedari.
- Стало: Ja traucē mugura, izvēlies vieglu gumiju un īsu amplitūdu; pirms piegājiena pārbaudi, vai gumija nav ieplīsusi; ja sāp, neizpildi.

### `rdl-db`

**lib.secondary**

- Было: Muguras iztaisnotāji, tvēriens
- Стало: Muguras iztaisnotājmuskuļi, tvēriens

**tech.steps**

- Было: Hanteles rokās pie augšstilbiem; vienu kāju atliec pussoli atpakaļ uz pirkstgala — galvenais svars uz priekšējās kājas.<br>Priekšējās kājas celis nedaudz saliekts; atbīdot gurnus atpakaļ, noliecies ar taisnu muguru, hanteles slīd gar kāju.<br>Nolaidies līdz spēcīgam augšstilba aizmugures stiepumam (parasti nedaudz zem ceļa).<br>Atgriezies, virzot gurnus uz priekšu; izpildi visus atkārtojumus un maini kāju.
- Стало: Hanteles rokās pie augšstilbiem; vienu kāju atliec pussoli atpakaļ uz pirkstgala — galvenais svars uz priekšējās kājas.<br>Priekšējās kājas celis nedaudz saliekts; virzot gurnus atpakaļ, noliecies ar neitrālu muguru, hanteles slīd gar kāju.<br>Nolaidies līdz spēcīgam augšstilba aizmugures stiepumam (parasti nedaudz zem ceļa).<br>Atgriezies, virzot gurnus uz priekšu; izpildi visus atkārtojumus un maini kāju. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: Ar muguras ierobežojumu — uzmanīgi: viegls svars un īsa amplitūda; ja sāp, nedari.
- Стало: Ja traucē mugura, ņem vieglu svaru un īsu amplitūdu; ja sāp, neizpildi.

### `rdl-kb`

**lib.secondary**

- Было: Muguras iztaisnotāji, tvēriens
- Стало: Muguras iztaisnotājmuskuļi, tvēriens

**lib.why**

- Было: Rumāņu vilkme iesācējiem zālē: viena svaru bumba abās rokās, viegli noturēt taisnu muguru.
- Стало: Rumāņu vilkme iesācējiem zālē: viena svarbumba abās rokās, viegli noturēt taisnu muguru.

**tech.steps**

- Было: Nostājies taisni, pēdas gurnu platumā, svaru bumba abās rokās aiz roktura augšstilbu priekšā.<br>Ceļi nedaudz saliekti; atbīdot gurnus atpakaļ, noliecies ar taisnu muguru, bumba slīd gar kājām.<br>Nolaidies līdz augšstilba aizmugures stiepumam, bumba aptuveni apakšstilba līmenī.<br>Atgriezies stāvus, virzot gurnus uz priekšu un saspiežot sēžas muskuļus.
- Стало: Nostājies taisni, pēdas gurnu platumā, svarbumba abās rokās aiz roktura augšstilbu priekšā.<br>Ceļi nedaudz saliekti; atbīdot gurnus atpakaļ, noliecies ar taisnu muguru, bumba slīd gar kājām.<br>Nolaidies līdz augšstilba aizmugures stiepumam, bumba aptuveni apakšstilba līmenī.<br>Atgriezies stāvus, virzot gurnus uz priekšu un saspiežot sēžas muskuļus. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: Ar muguras ierobežojumu — uzmanīgi: viegla bumba un īsa amplitūda; ja sāp, nedari.
- Стало: Ja traucē mugura, ņem vieglu svarbumbu un īsu amplitūdu; ja sāp, neizpildi.

### `reverse-hyper`

**lib.secondary**

- Было: Muguras atliecēji.
- Стало: Muguras iztaisnotājmuskuļi.

**tech.steps**

- Было: Vēders un iegurnis uz apgrieztās hiperekstensijas polstera, kājas karājas lejā, rokas tur rokturus. Mugurkauls neitrāls.<br>Kāju pacelšana atpakaļ un augšup, atliecot gūžas, bez stipra jostas izliekuma.<br>Kājas apmēram līdz rumpja līnijai vai nedaudz augstāk, bez pārmērīga jostas izliekuma. Kontrolēta nolaišana.
- Стало: Apgulies ar vēderu un iegurni uz trenažiera polstera, kājas nokarājas, ar rokām turies pie rokturiem; mugurkauls neitrāls.<br>Kāju pacelšana atpakaļ un augšup, atliecot gūžas, bez stipra jostas izliekuma.<br>Kājas apmēram līdz rumpja līnijai vai nedaudz augstāk, bez pārmērīga jostas izliekuma. Kontrolēta nolaišana. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: Līdz rumpja līnijai vai nedaudz augstāk bez sāpēm jostas daļā.
- Стало: Līdz rumpja līnijai vai nedaudz augstāk bez sāpēm jostas daļā. Bez šūpošanās un rāvieniem; ja sāp jostasvieta, pārtrauc.

### `reverse-lunge`

**lib.primary**

- Было: Priekšējās kājas četrgalvainais un sēžas muskuļi.
- Стало: Priekšējās kājas četrgalvainais muskulis un sēžas muskuļi.

**lib.secondary**

- Было: Augšstilba aizmugure; pievilcējmuskuļi; vidējais sēžas muskulis; korpuss.
- Стало: Augšstilba aizmugure; pievilcējmuskuļi; vidējais sēžas muskulis; rumpja muskuļi.

**tech.steps**

- Было: Stāja bez roku balsta, pēdas zem gurniem.<br>Solis atpakaļ, gurni nolaižas vertikāli, priekšējais papēdis paliek uz grīdas.<br>Abi ceļi ap 90°. Atgriešanās caur priekšējo pēdu.
- Стало: Nostājies taisni, pēdas zem gurniem, rokas uz vidukļa.<br>Ieelpojot sper soli atpakaļ un nolaid iegurni vertikāli, priekšējais papēdis uz grīdas.<br>Abi ceļi apmēram 90°, aizmugurējais celis nesitas pret grīdu.<br>Izelpojot atgriezies, atsperoties ar priekšējo pēdu.

**tech.safety**

- Было: Abi ceļi ap 90°, priekšējais papēdis uz grīdas.
- Стало: Abi ceļi ap 90°, priekšējais papēdis uz grīdas. Ja zaudē līdzsvaru, pieturies ar roku pie balsta; ja sāp celis, samazini dziļumu.

### `reverse-lunge-db`

**lib.secondary**

- Было: Pievilcēji, augšstilba aizmugure, korpusa muskuļi
- Стало: Pievilcēji, augšstilba aizmugure, rumpja muskuļi

**tech.steps**

- Было: Nostājies taisni, hanteles nolaistās rokās.<br>Sper platu soli atpakaļ un nolaid aizmugurējo celi gandrīz līdz grīdai.<br>Priekšējais celis virs pēdas, ķermenis taisns.<br>Atsperies ar priekšējo kāju un atgriezies stāvus; maini kājas vai izpildi visus atkārtojumus uz vienas.
- Стало: Nostājies taisni, hanteles nolaistās rokās.<br>Sper platu soli atpakaļ un nolaid aizmugurējo celi gandrīz līdz grīdai.<br>Priekšējais celis virs pēdas, ķermenis taisns.<br>Atsperies ar priekšējo kāju un atgriezies stāvus; maini kājas vai izpildi visus atkārtojumus uz vienas. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.errors**

- Было: Īss solis: celis aiziet tālu aiz pirkstgaliem.<br>Ķermenis krīt uz priekšu.<br>Sitiens ar celi pret grīdu.
- Стало: Pārāk īss solis: priekšējais papēdis atraujas no grīdas.<br>Ķermenis krīt uz priekšu.<br>Sitiens ar celi pret grīdu.

**tech.safety**

- Было: Ar ceļu ierobežojumu — bez hantelēm un ar īsu amplitūdu; ja sāp, nedari.
- Стало: Ja traucē ceļi, bez hantelēm un ar īsu amplitūdu; ja sāp, neizpildi.

### `reverse-lunge-supported`

**lib.primary**

- Было: Priekšējās kājas četrgalvainais un sēžas muskuļi.
- Стало: Priekšējās kājas četrgalvainais muskulis un sēžas muskuļi.

**lib.secondary**

- Было: Augšstilba aizmugure; pievilcējmuskuļi. Vidējais sēžas muskulis un korpuss strādā mazāk nekā bez balsta.
- Стало: Augšstilba aizmugure; pievilcējmuskuļi. Vidējais sēžas muskulis un rumpja muskuļi strādā mazāk nekā bez balsta.

### `reverse-pec-deck`

**tech.steps**

- Было: Sēdus ar seju pret trenažieri, krūtis pret polsteri, apakšdelmi uz polsteriem, elkoņi viegli saliekti un fiksēti.<br>Horizontāla roku atvilkšana plecu līnijā. Šī nav vilkme: elkonis nesaliecas vairāk.<br>Augšdelms rumpja līnijā vai nedaudz tālāk, bez plecu pacelšanas. Lēna atgriešanās.
- Стало: Sēdus ar seju pret trenažieri, krūtis pret polsteri, apakšdelmi uz polsteriem, elkoņi viegli saliekti un fiksēti.<br>Horizontāla roku atvilkšana plecu līnijā. Šī nav vilkme: elkonis nesaliecas vairāk.<br>Augšdelms rumpja līnijā vai nedaudz tālāk, bez plecu pacelšanas. Lēna atgriešanās. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: Līdz rumpja līnijai bez sāpēm pleca priekšpusē.
- Стало: Līdz rumpja līnijai bez sāpēm pleca priekšpusē. Svars mērens, bez rāvieniem; ja sāp pleca priekšpuse, samazini amplitūdu.

### `reverse-wrist-curl`

**tech.steps**

- Было: Sēdi, apakšdelmi uz atbalsta, plaukstas uz leju, plaukstas locītavas nedaudz aiz malas, stienis ar tvērienu no augšas.<br>Iztaisno tikai plaukstas locītavas (cel delnas muguru augšup). Apakšdelmi paliek nekustīgi.<br>Tik daudz iztaisnošanas, cik ir pieejams, tad nolaid lēni.
- Стало: Sēdi, apakšdelmi uz atbalsta, plaukstas uz leju, plaukstas locītavas nedaudz aiz malas, stienis ar tvērienu no augšas.<br>Iztaisno tikai plaukstas locītavas (cel delnas muguru augšup). Apakšdelmi paliek nekustīgi.<br>Tik daudz iztaisnošanas, cik ir pieejams, tad nolaid lēni. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

### `row`

**lib.primary**

- Было: Platākie, rombveida, trapecveida
- Стало: Platie muguras muskuļi, rombveida, trapecveida

**lib.secondary**

- Было: Aizmugurējie deltveida, bicepss, muguras taisnotāji
- Стало: Aizmugurējie deltveida, bicepss, muguras iztaisnotājmuskuļi

**tech.steps**

- Было: Pēdas gurnu platumā, korpuss aptuveni paralēls grīdai vai 30–45° leņķī, ceļi nedaudz saliekti.<br>Mugura neitrāla, stienis taisnās rokās.<br>Izelpojot velc stieni pie ribu apakšdaļas, savelkot lāpstiņas.<br>Nolaid kontrolēti.
- Стало: Pēdas gurnu platumā, rumpis aptuveni paralēls grīdai vai 30–45° leņķī, ceļi nedaudz saliekti.<br>Mugura neitrāla, tvēriens no augšas nedaudz platāks par pleciem, stienis taisnās rokās zem pleciem.<br>Izelpojot velc stieni pie ribu apakšdaļas, savelkot lāpstiņas.<br>Nolaid kontrolēti.

**tech.errors**

- Было: Apaļa mugura.<br>Korpusa iztaisnošana, lai parautu svaru.<br>Pārāk liels svars un saīsināta amplitūda.
- Стало: Apaļa mugura.<br>Rumpja iztaisnošana, lai parautu svaru.<br>Pārāk liels svars un saīsināta amplitūda.

**tech.safety**

- Было: Ja sāp jostasvieta, izvēlies vilkmi ar atbalstu pret solu.
- Стало: Ja sāp jostasvieta, izvēlies vilkmi ar atbalstu pret solu. Noliekums noslogo jostasvietu: mugura neitrāla katrā atkārtojumā.

### `rt`

**lib.why**

- Было: Korpusa rotācijas vingrinājums slīpajiem muskuļiem.
- Стало: Rumpja rotācijas vingrinājums slīpajiem muskuļiem.

**tech.steps**

- Было: Apsēdies, ceļi saliekti, pēdas uz grīdas, korpuss atliekts ~45°, mugura taisna.<br>Rokas sev priekšā (var ar svaru).<br>Pagriez korpusu pārmaiņus uz sāniem.<br>Elpo vienmērīgi.
- Стало: Apsēdies, ceļi saliekti, pēdas uz grīdas, rumpis atliekts ~45°, mugura taisna.<br>Rokas sev priekšā (var ar svaru).<br>Pagriez krūškurvi un plecus pamīšus uz sāniem; jostasvieta paliek neitrāla.<br>Elpo vienmērīgi.

### `scap-pullup`

**tech.steps**

- Было: Pakāries pie stieņa uz taisnām rokām, tvēriens nedaudz platāks par pleciem.<br>Nesaliecot elkoņus, nolaid plecus un savelc lāpstiņas uz leju — ķermenis nedaudz paceļas.<br>Noturi 1–2 s.<br>Plūdeni atgriezies pilnā karāšanās stāvoklī; 6–10 atkārtojumi.
- Стало: Pakāries pie stieņa uz taisnām rokām, tvēriens nedaudz platāks par pleciem.<br>Nesaliecot elkoņus, nolaid plecus un savelc lāpstiņas uz leju — ķermenis nedaudz paceļas.<br>Noturi 1–2 s.<br>Plūdeni atgriezies pilnā karāšanās stāvoklī; 6–10 atkārtojumi. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: Ar plecu ierobežojumu — īsi piegājieni; ja sāp, nedari.
- Стало: Ja traucē pleci, īsi piegājieni; ja sāp, neizpildi.

### `seated-calf`

**tech.steps**

- Было: Sēdus, ceļi ap 90°, pēdu priekšdaļa uz platformas, rullis uz augšstilbu lejasdaļas.<br>Papēži lejā, tad pacelšanās uz pirkstgaliem. Ceļa leņķis nemainās.<br>Pauze augšā, lēna nolaišana.
- Стало: Sēdus, ceļi ap 90°, pēdu priekšdaļa uz platformas, rullis uz augšstilbu lejasdaļas.<br>Papēži lejā, tad pacelšanās uz pirkstgaliem. Ceļa leņķis nemainās.<br>Pauze augšā, lēna nolaišana. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: Pilna dorsālā un plantārā fleksija ar fiksētu celi ap 90°.
- Стало: Pilna dorsālā un plantārā fleksija ar fiksētu celi ap 90°. Fiksatoru noņem un uzliec, kad veltnis jau atrodas uz augšstilbiem; ja sāp Ahilleja cīpsla, samazini amplitūdu un svaru.

### `sglb`

**lib.secondary**

- Было: Augšstilba aizmugure, vēdera prese
- Стало: Augšstilba aizmugure, vēdera muskuļi

**tech.safety**

- Было: —
- Стало: Neieliec jostasvietu augšā; ja sāp jostasvieta — tilts uz abām kājām.

### `shoulder-rolls`

**lib.secondary**

- Было: Deltveida muskuļi
- Стало: Lāpstiņas cēlājmuskulis; priekšējais zobainais muskulis

**tech.safety**

- Было: Ar plecu ierobežojumu — maza amplitūda, bez sāpēm.
- Стало: Ja traucē pleci, neliela amplitūda, bez sāpēm.

### `single-arm-cable-lateral`

**tech.steps**

- Было: Stāvies sāniski pret apakšējo bloku, rokturis rokā, kas tālāk no bloka, trose iet korpusa priekšā, neliels fiksēts elkoņa saliekums, plecs nolaists.<br>Cel roku lāpstiņas plaknē līdz pleca augstumam. Trosi turi nospriegotu visu laiku.<br>Augšdelms aptuveni paralēli grīdai. Nolaid lēni; neļauj trosei krist.
- Стало: Stāvies sāniski pret apakšējo bloku, rokturis rokā, kas tālāk no bloka, trose iet rumpja priekšā, neliels fiksēts elkoņa saliekums, plecs nolaists.<br>Cel roku lāpstiņas plaknē līdz pleca augstumam. Trosi turi nospriegotu visu laiku.<br>Augšdelms aptuveni paralēli grīdai. Nolaid lēni; neļauj trosei krist. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: Līdz plecu augstumam. Augstāk kustību bieži pārņem trapecveida augšdaļa.
- Стало: Līdz plecu augstumam. Augstāk kustību bieži pārņem trapecveida augšdaļa. Svars viegls; ja sāp plecs, pārtrauc.

### `single-leg-press`

**lib.primary**

- Было: Darba kājas četrgalvainais un sēžas muskulis.
- Стало: Darba kājas četrgalvainais muskulis un sēžas muskulis.

**lib.secondary**

- Было: Augšstilba aizmugure; pievilcējmuskuļi; vidējais sēžas muskulis un korpuss (pretrotācija).
- Стало: Augšstilba aizmugure; pievilcējmuskuļi; vidējais sēžas muskulis un rumpja muskuļi (pretrotācija).

**tech.steps**

- Было: Kā kāju spiešanā, viena pēda uz platformas, iegurnis līdzens.<br>Tā pati līnija kā spiešanā ar abām kājām; iegurnis nepagriežas.<br>Gandrīz pilna atliekšana bez aizslēgšanas.
- Стало: Apsēdies, jostasvieta piespiesta, viena pēda platformas centrā, otra uz grīdas vai rāmja.<br>Atbrīvo fiksatorus.<br>Ieelpojot nolaid platformu, kamēr iegurnis piespiests pie atzveltnes; celis pirkstgalu virzienā.<br>Izelpojot izspied līdz gandrīz taisnai kājai, bez bloķēšanas.

**tech.safety**

- Было: Līdz leņķim, kurā iegurnis vēl turas piespiests polsterim.
- Стало: Līdz leņķim, kurā iegurnis vēl turas piespiests polsterim. Sāc ar daudz mazāku svaru nekā spiešanā ar abām kājām; celi zem svara nebloķē; ja sāp celis vai jostasvieta, pārtrauc.

### `ski-erg`

**lib.secondary**

- Было: Augšstilba aizmugure un sēžas muskuļi vieglā noliekšanās; pleci; korpuss.
- Стало: Augšstilba aizmugure un sēžas muskuļi vieglā noliekšanās; pleci; rumpja muskuļi.

**tech.safety**

- Было: No rokturiem virs galvas līdz plaukstām pie gurniem, ar neitrālu muguru.
- Стало: No rokturiem virs galvas līdz plaukstām pie gurniem, ar neitrālu muguru. Mugura neitrāla; ja sāp jostasvieta, pārtrauc.

### `skull-db`

**tech.steps**

- Было: Apgulies uz sola, hanteles virs krūtīm uz taisnām rokām, plaukstas viena pret otru.<br>Nekustinot augšdelmus, saliec elkoņus un lēni nolaid hanteles pie deniņiem.<br>Elkoņi vērsti uz augšu, neizplešas.<br>Iztaisno rokas līdz galam, bez rāviena.
- Стало: Apgulies uz sola, hanteles virs krūtīm uz taisnām rokām, plaukstas viena pret otru.<br>Nekustinot augšdelmus, saliec elkoņus un lēni nolaid hanteles pie deniņiem.<br>Elkoņi vērsti uz augšu, neizplešas.<br>Iztaisno rokas līdz galam, bez rāviena. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: Ar plecu ierobežojumu — viegls svars; ja sāp, aizvieto ar bloka spiešanu vai šauro atspiešanos.
- Стало: Ja traucē pleci, ņem vieglu svaru; ja sāp, aizstāj ar roku iztaisnošanu blokā vai šauriem atspiešanās vingrinājumiem.

### `sl-rdl`

**lib.secondary**

- Было: Vidējais sēžas muskulis (iegurņa stabilitāte); muguras atliecēji; ikri; korpuss.
- Стало: Vidējais sēžas muskulis (iegurņa stabilitāte); muguras iztaisnotājmuskuļi; ikri; rumpja muskuļi.

**tech.steps**

- Было: Stāvus uz vienas kājas, hantele pretējā rokā. Viegls mīksts saliekums atbalsta celī, lāpstiņas savāktas.<br>Locījums gurnos: rumpis noliecas uz priekšu, brīvā kāja iet atpakaļ vienā līnijā ar rumpi. Hantele slīd gar atbalsta apakšstilbu.<br>Līdz rumpja paralēlei ar grīdu vai mazākam noliekumam, kamēr mugura ir neitrāla un iegurnis nepagriežas. Atgriešanās, atliecot atbalsta kājas gūžu.
- Стало: Stāvus uz vienas kājas, hantele pretējā rokā. Viegls mīksts saliekums atbalsta celī, lāpstiņas savāktas.<br>Locījums gurnos: rumpis noliecas uz priekšu, brīvā kāja iet atpakaļ vienā līnijā ar rumpi. Hantele slīd gar atbalsta apakšstilbu.<br>Līdz rumpja paralēlei ar grīdu vai mazākam noliekumam, kamēr mugura ir neitrāla un iegurnis nepagriežas. Atgriešanās, atliecot atbalsta kājas gūžu. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: Noliekums līdz tam dziļumam, kur mugura paliek neitrāla un iegurnis skatās lejup, nevis sānis.
- Стало: Noliekums līdz tam dziļumam, kur mugura paliek neitrāla un iegurnis skatās lejup, nevis sānis. Ja zaudē līdzsvaru, turies ar roku pie balsta; ja sāp jostasvieta, pārtrauc.

### `sled-push`

**lib.primary**

- Было: Četrgalvainais; sēžas muskuļi.
- Стало: Četrgalvainais muskulis; sēžas muskuļi.

**lib.secondary**

- Было: Ikri; korpuss; plecu josla tur rokturus.
- Стало: Ikri; rumpja muskuļi; plecu josla tur rokturus.

**tech.steps**

- Было: Rokas uz augstajiem rokturiem, korpuss nolieks uz priekšu, viena pēda jau solī. Mugura neitrāla.<br>Spēcīgi soļi uz priekšu, atspiežoties ar pēdas priekšdaļu. Ragavas turpina braukt pa grīdu.<br>Vairāki soļi pēc kārtas, saglabājot noliekumu un neitrālu muguru.
- Стало: Rokas uz augstajiem rokturiem, rumpis nolieks uz priekšu, viena pēda jau solī. Mugura neitrāla.<br>Spēcīgi soļi uz priekšu, atspiežoties ar pēdas priekšdaļu. Ragavas turpina braukt pa grīdu.<br>Vairāki soļi pēc kārtas, saglabājot noliekumu un neitrālu muguru. Elpo vienmērīgi, neaizturi elpu.

**tech.safety**

- Было: Pilns solis, darba kājas gūžai un celim iztaisnojoties.
- Стало: Pilns solis, darba kājas gūžai un celim iztaisnojoties. Stum pa brīvu celiņu; ja sāp jostasvieta, pārtrauc.

### `smith-bench`

**tech.steps**

- Было: Novieto solu zem stieņa tā, lai apakšā stienis skartu krūšu vidu, bet augšā būtu virs pleciem. Pieci atbalsta punkti, lāpstiņas savilktas. Drošības atdures nedaudz zem apakšējā punkta.<br>Noņem āķus un nolaid stieni uz krūšu vidu pa rāmja fiksēto ceļu. Elkoņi 45–75°.<br>Pieskaries krūtīm bez atsitiena, tad spied līdz gandrīz taisnām rokām. Pagriez plaukstas, lai aizķertu āķus.
- Стало: Novieto solu zem stieņa tā, lai apakšā stienis skartu krūšu vidu, bet augšā būtu virs pleciem. Pieci atbalsta punkti, lāpstiņas savilktas. Drošības atdures nedaudz zem apakšējā punkta.<br>Noņem āķus un nolaid stieni uz krūšu vidu pa rāmja fiksēto ceļu. Elkoņi 45–75°.<br>Pieskaries krūtīm bez atsitiena, tad spied līdz gandrīz taisnām rokām. Pagriez plaukstas, lai aizķertu āķus. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: Līdz pieskārienam krūšu vidum bez atsitiena un līdz gandrīz taisnām rokām.
- Стало: Līdz pieskārienam krūšu vidum bez atsitiena un līdz gandrīz taisnām rokām. Vadotnes neaizsargā no stieņa krišanas uz krūtīm: vienmēr uzstādi drošības atdurus nedaudz zem apakšējā punkta. Pēc piegājiena aizāķē stieni, pagriežot plaukstas.

### `smith-bss`

**lib.primary**

- Было: Priekšējās kājas četrgalvainais un sēžas muskuļi.
- Стало: Priekšējās kājas četrgalvainais muskulis un sēžas muskuļi.

### `smith-calf`

**lib.secondary**

- Было: Plekstveida muskulis (celis ir atliekts).
- Стало: Plekstveida muskulis — arī galvenais darba muskulis; ikru muskulis ar taisnu celi strādā vairāk nekā sēžot.

**tech.steps**

- Было: Stienis uz trapecveida augšdaļas. Pēdu priekšdaļa uz platformas vai diska, ceļi gandrīz taisni, bet nav aizslēgti. Drošības atdures nedaudz zem apakšējā iestiepuma.<br>Papēži nolaižas dorsālajā fleksijā, tad pacelšanās uz pirkstgaliem līdz pilnai plantārajai fleksijai.<br>Pauze augšā, lēna nolaišana.
- Стало: Stienis uz trapecveida augšdaļas. Pēdu priekšdaļa uz platformas vai diska, ceļi gandrīz taisni, bet nav aizslēgti. Drošības atdures nedaudz zem apakšējā iestiepuma.<br>Papēži nolaižas (pacel pirkstgalus), tad pacelies pirkstgalos līdz galam.<br>Pauze augšā, lēna nolaišana. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: Pilna dorsālā un plantārā fleksija uz platformas, Ahileja cīpslas bezsāpju diapazonā.
- Стало: Pilna dorsālā un plantārā fleksija uz platformas, Ahilleja cīpslas bezsāpju diapazonā. Drošības balstus uzstādi nedaudz zem zemākā punkta; pēc piegājiena aizāķē stieni; ja sāp Ahilleja cīpsla, samazini amplitūdu.

### `smith-close-grip`

**tech.steps**

- Было: Kā horizontālajā Smita spiešanā. Tvēriens apmēram plecu platumā, nevis plaukstas kopā. Elkoņi tuvāk sāniem. Drošības atdures uzliktas.<br>Nolaišana uz krūšu apakšu vai vidu pa vadotnēm, elkoņi gar rumpi.<br>Pieskāriens bez atsitiena, tad spiešana līdz gandrīz taisnām rokām.
- Стало: Apgulies zem stieņa, acis zem tā; tvēriens plecu platumā, elkoņi tuvāk rumpim; drošības balsti uzstādīti.<br>Nolaišana uz krūšu apakšu vai vidu pa vadotnēm, elkoņi gar rumpi.<br>Pieskāriens bez atsitiena, tad spiešana līdz gandrīz taisnām rokām. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: Līdz pieskārienam krūtīm un gandrīz pilnai atliekšanai. Tvēriens ap plecu platumu.
- Стало: Līdz pieskārienam krūtīm un gandrīz pilnai atliekšanai. Tvēriens ap plecu platumu. Vadotnes neaizsargā no stieņa krišanas uz krūtīm: uzstādi drošības atdurus; ja sāp plaukstas locītavas vai elkoņi — tvēriens nedaudz platāk.

### `smith-incline-bench`

**tech.steps**

- Было: Sola atzveltne ap 30° (darba diapazons 15–45°), novietota tā, lai stienis nolaistos uz krūšu augšu. Lāpstiņas savilktas, drošības atdures nedaudz zem krūtīm.<br>Nolaišana uz krūšu augšu pa vadotnēm. Elkoņi 45–75°.<br>Pieskāriens krūšu augšai bez atsitiena, tad spiešana līdz gandrīz taisnām rokām.
- Стало: Sols apmēram 30° (diapazons 15–45°); novieto to tā, lai stienis nolaistos uz krūšu augšdaļu.<br>Uzstādi drošības balstus nedaudz zem krūšu līmeņa, lāpstiņas savelc.<br>Noņem stieni, pagriežot plaukstas; ieelpojot nolaid līdz krūšu augšdaļai, elkoņi 45–75°.<br>Pieskaries bez atsitiena, izelpojot izspied līdz gandrīz taisnām rokām.

**tech.errors**

- Было: Sols stāvāks par 45° stipri pārnes slodzi uz priekšējiem deltveida muskuļiem (tuvāk plecu spiešanai)<br>Spiešana no kakla<br>Nepareiza orientācija uz slīpā Smita rāmja
- Стало: Sols stāvāks par 45° stipri pārnes slodzi uz priekšējiem deltveida muskuļiem (tuvāk plecu spiešanai)<br>Spiešana no kakla<br>Sols novietots tā, ka stienis nolaižas uz kaklu vai vēderu.

**tech.safety**

- Было: Sols ap 30° (darba diapazons 15–45°). Līdz pieskārienam krūšu augšai, nevis no kakla.
- Стало: Sols ap 30° (darba diapazons 15–45°). Līdz pieskārienam krūšu augšai, nevis no kakla. Vadotnes neaizsargā no stieņa krišanas uz krūtīm: vienmēr uzstādi drošības atdurus nedaudz zem apakšējā punkta.

### `smith-rdl`

**lib.secondary**

- Было: Muguras atliecēji; apakšdelmi.
- Стало: Muguras iztaisnotājmuskuļi; apakšdelmi.

### `smith-row`

**lib.secondary**

- Было: Aizmugurējie deltveida; bicepss; muguras atliecēji (noliekuma izometrija).
- Стало: Aizmugurējie deltveida; bicepss; muguras iztaisnotājmuskuļi (noliekuma izometrija).

**tech.steps**

- Было: Gūžas locījums, mugura neitrāla. Rumpja leņķi izvēlas tā, lai fiksētais stieņa ceļš trāpītu ribu apakšā, nevis ceļos vai kaklā.<br>Vilkme uz ribu apakšu gar vadotnēm, lāpstiņas savilkas.<br>Stienis pie rumpja, tad kontrolēta nolaišana līdz gandrīz taisnām rokām.
- Стало: Noliecies no gurniem, mugura neitrāla; izvēlies leņķi tā, lai stienis virzītos uz apakšējām ribām.<br>Vilkme uz ribu apakšu gar vadotnēm, lāpstiņas savilkas.<br>Stienis pie rumpja, tad kontrolēta nolaišana līdz gandrīz taisnām rokām. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: No gandrīz taisnām rokām līdz pieskārienam ribu apakšai ar neitrālu muguru.
- Стало: No gandrīz taisnām rokām līdz pieskārienam ribu apakšai ar neitrālu muguru. Noliekums noslogo jostasvietu: ja tā sāp — vilkme ar krūšu atbalstu.

### `smith-seated-press`

**lib.secondary**

- Было: Tricepss; krūšu augšdaļa. Korpuss strādā mazāk nekā stieņa spiešanā stāvus.
- Стало: Tricepss; krūšu augšdaļa. Rumpja muskuļi strādā mazāk nekā stieņa spiešanā stāvus.

**tech.steps**

- Было: Novieto solu ar atzveltni rāmī tā, lai stienis apakšā būtu pie krūšu augšdaļas, bet augšā ietu gar seju un beigtos virs pleciem. Drošības atdures nedaudz zem krūšu augšdaļas.<br>Noņem āķus un spied gar vadotnēm bez jostasvietas ieliekuma un bez plecu raustīšanas.<br>Gandrīz taisnas rokas virs galvas. Nolaišana līdz krūšu augšdaļai.
- Стало: Novieto solu ar atzveltni rāmī tā, lai stienis apakšā būtu pie krūšu augšdaļas, bet augšā ietu gar seju un beigtos virs pleciem. Drošības atdures nedaudz zem krūšu augšdaļas.<br>Noņem āķus un spied gar vadotnēm bez jostasvietas ieliekuma un bez plecu raustīšanas.<br>Gandrīz taisnas rokas virs galvas. Nolaišana līdz krūšu augšdaļai. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: No krūšu augšdaļas līdz gandrīz taisnām rokām virs galvas, ar neitrālu jostasvietu.
- Стало: No krūšu augšdaļas līdz gandrīz taisnām rokām virs galvas, ar neitrālu jostasvietu. Uzstādi drošības atdurus nedaudz zem krūšu augšdaļas; ja sāp plecs vai jostasvieta — pārtrauc.

### `smith-shrug`

**tech.steps**

- Было: Stāvus, stienis taisnās rokās priekšā augšstilbiem. Pēdas tā, lai stienis varētu iet uz augšu gar ķermeni, nevis gurnos.<br>Taisna plecu pacelšana pa vadotnēm un nolaišana. Bez plecu apļiem.<br>Maksimāla lāpstiņu pacelšana, pauze, lēna nolaišana.
- Стало: Stāvus, stienis taisnās rokās priekšā augšstilbiem. Pēdas tā, lai stienis varētu iet uz augšu gar ķermeni, nevis gurnos.<br>Taisna plecu pacelšana pa vadotnēm un nolaišana. Bez plecu apļiem.<br>Maksimāla lāpstiņu pacelšana, pauze, lēna nolaišana. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: Tikai lāpstiņu pacelšana un nolaišana pa rāmja līniju, bezsāpju diapazonā.
- Стало: Tikai lāpstiņu pacelšana un nolaišana pa rāmja līniju, bezsāpju diapazonā. Pēc piegājiena aizāķē stieni; ja sāp kakls, samazini svaru.

### `smith-split-squat`

**lib.primary**

- Было: Priekšējās kājas četrgalvainais un sēžas muskuļi.
- Стало: Priekšējās kājas četrgalvainais muskulis un sēžas muskuļi.

**lib.secondary**

- Было: Pievilcējmuskuļi; ikri; vidējais sēžas muskulis un korpuss kā stabilizatori (mazāk nekā bez vadotnēm).
- Стало: Pievilcējmuskuļi; ikri; vidējais sēžas muskulis un rumpja muskuļi kā stabilizatori (mazāk nekā bez vadotnēm).

### `smith-squat`

**lib.primary**

- Было: Četrgalvainais; sēžas muskuļi.
- Стало: Četrgalvainais muskulis; sēžas muskuļi.

**lib.secondary**

- Было: Pievilcēji; plekstveida muskulis; muguras taisnotāji; korpuss. Stabilizatori strādā mazāk nekā pietupienos ar stieni, jo ir vadotnes.
- Стало: Pievilcēji; plekstveida muskulis; muguras iztaisnotājmuskuļi; rumpja muskuļi. Stabilizatori strādā mazāk nekā pietupienos ar stieni, jo ir vadotnes.

**tech.steps**

- Было: Stienis uz trapecveida augšdaļas (augstais stieņa novietojums). Pēdas parasti nedaudz priekšā stienim, aptuveni plecu platumā, pirksti viegli uz āru. Āķi noņemti, drošības atdures nedaudz zem apakšējā punkta.<br>Saliec gūžas un ceļus vienlaikus pa fiksēto ceļu. Ceļi virzienā uz pirkstiem, papēži uz grīdas.<br>Gūžas locījums ceļa augstumā vai zemāk, ar neitrālu muguru. Pieceļies līdz pilnai iztaisnošanai.
- Стало: Stienis uz trapecveida augšdaļas (augstais stieņa novietojums). Pēdas parasti nedaudz priekšā stienim, aptuveni plecu platumā, pirksti viegli uz āru. Āķi noņemti, drošības atdures nedaudz zem apakšējā punkta.<br>Saliec gūžas un ceļus vienlaikus pa fiksēto ceļu. Ceļi virzienā uz pirkstiem, papēži uz grīdas.<br>Gūžas locījums ceļa augstumā vai zemāk, ar neitrālu muguru. Pieceļies līdz pilnai iztaisnošanai. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: Līdz paralēlei vai zemāk, ar papēžiem uz grīdas un neitrālu muguru.
- Стало: Līdz paralēlei vai zemāk, ar papēžiem uz grīdas un neitrālu muguru. Uzstādi drošības atdurus nedaudz zem apakšējā punkta; ja sāp ceļgals vai jostasvieta — pārtrauc.

### `sq`

**lib.primary**

- Было: Četrgalvainais, sēžas muskuļi
- Стало: Četrgalvainais muskulis, sēžas muskuļi

**lib.secondary**

- Было: Pievilcēji, ikri (plekstveida), muguras taisnotāji
- Стало: Pievilcēji, ikri (plekstveida), muguras iztaisnotājmuskuļi

**tech.steps**

- Было: Stienis uz trapecveida muskuļu augšdaļas, pēdas nedaudz platāk par pleciem, pirkstgali nedaudz uz āru.<br>Ieelpo, sasprindzini presi.<br>Nolaidies, virzot gurnus atpakaļ un saliecot ceļus pirkstgalu virzienā.<br>Nolaidies līdz augšstilba paralēlei ar grīdu vai zemāk (ja mugura taisna), celies izelpojot.
- Стало: Uzstādi drošības balstus nedaudz zem zemākā punkta. Nostājies zem stieņa, stienis uz trapecveida muskuļa augšdaļas, noņem to no statīva un atkāpies 1–2 soļus; pēdas nedaudz platāk par pleciem, pirkstgali nedaudz uz āru.<br>Ieelpo, sasprindzini vēdera muskuļus.<br>Nolaidies, virzot gurnus atpakaļ un saliecot ceļus pirkstgalu virzienā.<br>Nolaidies līdz augšstilba paralēlei ar grīdu vai zemāk (ja mugura taisna), celies izelpojot.

**tech.errors**

- Было: Ceļi krīt uz iekšu.<br>Papēži atraujas no grīdas.<br>Apaļa mugura apakšā.<br>Pārāk liels korpusa slīpums — «labrīt».
- Стало: Ceļi krīt uz iekšu.<br>Papēži atraujas no grīdas.<br>Apaļa mugura apakšā.<br>Pārāk liels rumpja slīpums — «labrīt».

### `stair`

**lib.primary**

- Было: Sirds un asinsvadu sistēma
- Стало: Sēžas muskuļi, četrgalvainais muskulis (kardio)

**lib.secondary**

- Было: Sēžas muskuļi, četrgalvainais, ikri
- Стало: Ikri

**tech.steps**

- Было: Stāvi taisni, pēdas pilnībā uz pakāpieniem.<br>Turies pie margām tikai līdzsvaram.<br>Kāp vienmērīgi.<br>Iesildīšanās un atdzišana.
- Стало: Stāvi taisni, pēdas pilnībā uz pakāpieniem.<br>Turies pie margām tikai līdzsvaram.<br>Kāp vienmērīgi.<br>Sāc un beidz lēnā tempā.

**tech.safety**

- Было: —
- Стало: Margas — tikai līdzsvaram; ātrumu palielini pakāpeniski; nokāp tikai pēc pilnīgas apstāšanās.

### `standing-db-press`

**lib.secondary**

- Было: Tricepss; korpuss un sēžas muskuļi strādā vairāk nekā sēdus spiešanā.
- Стало: Tricepss; rumpja muskuļi un sēžas muskuļi strādā vairāk nekā sēdus spiešanā.

**tech.steps**

- Было: Stāvus, hanteles pie pleciem, korpuss stingrs.<br>Spiešana uz augšu bez ietupiena ar kājām un bez stipra izliekuma.<br>Hanteles virs galvas tuvu kopā, bez sitiena. Nolaišana līdz ausīm.
- Стало: Nostājies, pēdas gurnu platumā, hanteles pie pleciem, vēdera un sēžas muskuļi sasprindzināti.<br>Izelpojot izspied hanteles augšup bez pietupiena un ieliekuma.<br>Hanteles virs galvas satuvinās bez sitiena.<br>Ieelpojot nolaid līdz ausu līmenim.

**tech.safety**

- Было: No ausu līmeņa līdz gandrīz taisnām rokām virs galvas.
- Стало: No ausu līmeņa līdz gandrīz taisnām rokām virs galvas. Neieliecies jostasvietā — ja bez ieliekuma neizdodas, samazini svaru; ja sāp plecs, pārtrauc piegājienu.

### `step-bw`

**lib.secondary**

- Было: Vidējais sēžas muskulis, ikri, korpusa muskuļi
- Стало: Vidējais sēžas muskulis, ikri, rumpja muskuļi

**tech.steps**

- Было: Nostājies ar vienu kāju uz stabila pakāpiena vai kāpņu apakšējā pakāpiena, otra kāja karājas sānis.<br>Lēni (2–3 s) saliec atbalsta kāju un nolaid brīvās kājas papēdi pret grīdu.<br>Pieskaries grīdai ar papēdi, nepārnesot uz to svaru; atbalsta kājas celis vērsts uz priekšu pēdas virzienā.<br>Iztaisnojies ar darba kāju; izpildi visus atkārtojumus un maini kāju.
- Стало: Nostājies ar vienu kāju uz stabila pakāpiena vai kāpņu apakšējā pakāpiena, otra kāja karājas sānis.<br>Lēni (2–3 s) saliec atbalsta kāju un nolaid brīvās kājas papēdi pret grīdu.<br>Pieskaries grīdai ar papēdi, nepārnesot uz to svaru; atbalsta kājas celis vērsts uz priekšu pēdas virzienā.<br>Iztaisnojies ar darba kāju; izpildi visus atkārtojumus un maini kāju. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: Ar ceļu ierobežojumu — zems pakāpiens un nepilna amplitūda; ja sāp, nedari.
- Стало: Ja traucē ceļi, izvēlies zemu pakāpienu un nepilnu amplitūdu; ja sāp, neizpildi.

### `straight-arm-pulldown`

**tech.steps**

- Было: Ar seju pret augšējo bloku, taisns rokturis vai virve. Rokas gandrīz taisnas, viegls fiksēts elkoņu saliekums, rumpis nedaudz noliekts, krūtis atvērtas.<br>Loks no līmeņa virs galvas uz gurniem, atliecot plecu. Elkoņi nelokās tā, kā augšējā bloka vilkmē.<br>Plaukstas pie gurniem, platie muguras muskuļi saspiesti. Kontrolēta atgriešanās pa to pašu loku.
- Стало: Ar seju pret augšējo bloku, taisns rokturis vai virve. Rokas gandrīz taisnas, viegls fiksēts elkoņu saliekums, rumpis nedaudz noliekts, krūtis atvērtas.<br>Loks no līmeņa virs galvas uz gurniem, atliecot plecu. Elkoņi nelokās tā, kā augšējā bloka vilkmē.<br>Plaukstas pie gurniem, platie muguras muskuļi saspiesti. Kontrolēta atgriešanās pa to pašu loku. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: No rokām virs galvas līdz rokturim pie gurniem, ar gandrīz nemainīgu elkoņa leņķi.
- Стало: No rokām virs galvas līdz rokturim pie gurniem, ar gandrīz nemainīgu elkoņa leņķi. Svars mērens, bez rāvieniem; ja sāp plecs, samazini amplitūdu augšā.

### `stretch-calf`

**tech.steps**

- Было: Stāvies ar seju pret sienu, rokas uz sienas. Aizmugurējā kāja ir aiz tevis, papēdis tiecas uz grīdu.<br>Vispirms turi aizmugurējo celi taisnu (ikru muskulis). Tad viegli saliec to pašu celi, neatraujott papēdi (plekstveida muskulis).<br>Noturi katru fāzi bez sāpēm Ahileja cīpslā.<br>Statiska noturēšana katrā fāzē.
- Стало: Stāvies ar seju pret sienu, rokas uz sienas. Aizmugurējā kāja ir aiz tevis, papēdis tiecas uz grīdu.<br>Vispirms turi aizmugurējo celi taisnu (ikru muskulis). Tad viegli saliec to pašu celi, neatraujott papēdi (plekstveida muskulis).<br>Noturi katru fāzi bez sāpēm Ahilleja cīpslā.<br>Statiska noturēšana katrā fāzē.

**tech.errors**

- Было: Papēža atraušanās<br>rāviens<br>pēdas iekrīšana uz iekšu<br>stiepšana caur sāpēm Ahileja cīpslā.
- Стало: Papēža atraušanās<br>rāviens<br>pēdas iekrīšana uz iekšu<br>stiepšana caur sāpēm Ahilleja cīpslā.

### `stretch-chest-doorway`

**tech.steps**

- Было: Stāvies durvju ailē vai pie statīva, apakšdelms uz aplodas, elkonis aptuveni pleca augstumā vai nedaudz zemāk, korpuss vērsts uz priekšu.<br>Sper mazu soli uz priekšu, lai krūtis atvērtos. Lāpstiņa paliek viegli savilkta — neļauj plecam iekrist uz priekšu.<br>Noturi krūšu stiepumu bez sāpēm pleca priekšpusē.<br>Statiska noturēšana, elpojot vienmērīgi.
- Стало: Stāvies durvju ailē vai pie statīva, apakšdelms uz aplodas, elkonis aptuveni pleca augstumā vai nedaudz zemāk, rumpis vērsts uz priekšu.<br>Sper mazu soli uz priekšu, lai krūtis atvērtos. Lāpstiņa paliek viegli savilkta — neļauj plecam iekrist uz priekšu.<br>Noturi krūšu stiepumu bez sāpēm pleca priekšpusē.<br>Statiska noturēšana, elpojot vienmērīgi.

**tech.errors**

- Было: Pleca ievelšanās uz priekšu<br>rāviens ar korpusu<br>sāpes pleca priekšējā kapsulā.
- Стало: Pleca ievelšanās uz priekšu<br>rāviens ar rumpi<br>sāpes pleca priekšējā kapsulā.

### `stretch-hamstring`

**lib.secondary**

- Было: Ikru muskulis, ja pēda ir pievilkta pret sevi; jostas atliecējiem nevajadzētu stiepties augšstilba vietā.
- Стало: Ikru muskulis, ja pēda ir pievilkta pret sevi; muguras iztaisnotājmuskuļiem jostas daļā nevajadzētu stiepties augšstilba vietā.

### `stretch-hip-flexor`

**lib.primary**

- Было: Aizmugurējās kājas jostas-gūžas muskulis un taisnais augšstilba muskulis (tie tiek stiepti).
- Стало: Aizmugurējās kājas gūžas saliecēji un taisnais augšstilba muskulis (tie tiek stiepti).

### `suitcase-carry`

**lib.primary**

- Было: Slīpie vēdera muskuļi un pretējās puses jostas kvadrātmuskulis (pretošanās sānu noliekumam).
- Стало: Slīpie vēdera muskuļi un pretējās puses jostas kvadrātveida muskulis (pretošanās sānu noliekumam).

**lib.secondary**

- Было: Darba rokas tvēriens; vidējais sēžas muskulis; korpuss kopumā.
- Стало: Darba rokas tvēriens; vidējais sēžas muskulis; rumpja muskuļi kopumā.

**lib.why**

- Было: Soļo ar svaru vienā pusē, lai korpusam jāpaliek līmenī.
- Стало: Soļo ar svaru vienā pusē, lai rumpim jāpaliek līmenī.

**tech.steps**

- Было: Viens svars taisnā rokā sānos, kā čemodāns. Brīvā roka gar ķermeni. Pleci un iegurnis paliek līmenī.<br>Soļo taisni, nenoliecoties pret svaru vai prom no tā.<br>Vairāki soļi ar līdzenu iegurni. Noliec svaru kontrolēti.
- Стало: Viens svars taisnā rokā sānos, kā čemodāns. Brīvā roka gar ķermeni. Pleci un iegurnis paliek līmenī.<br>Soļo taisni, nenoliecoties pret svaru vai prom no tā.<br>Vairāki soļi ar līdzenu iegurni. Noliec svaru kontrolēti. Elpo vienmērīgi, neaizturi elpu.

**tech.errors**

- Было: Noliekšanās pret svaru<br>pretējā pleca pacelšana<br>korpusa griešana.
- Стало: Noliekšanās pret svaru<br>pretējā pleca pacelšana<br>rumpja griešana.

**tech.safety**

- Было: Pilns solis ar pleciem un iegurni līmenī.
- Стало: Pilns solis ar pleciem un iegurni līmenī. Pacel un noliec hanteli ar neitrālu muguru, saliecot ceļus; ja sāp jostasvieta, pārtrauc.

### `superman`

**lib.why**

- Было: Stiprina muguras iztaisnotājus un sēžas muskuļus bez inventāra; līdzsvaro vēdera preses un spiešanas vingrinājumus, palīdz noturēt taisnu muguru pietupienos un slīpumos.
- Стало: Stiprina muguras iztaisnotājmuskuļus un sēžas muskuļus bez inventāra; līdzsvaro vēdera preses un spiešanas vingrinājumus, palīdz noturēt taisnu muguru pietupienos un slīpumos.

**tech.safety**

- Было: Neliela: rokas un kājas paceļas 5–15 cm no grīdas, bez sāpēm jostasvietā. Vilkmē (vilkme ≥ spiešana) neieskaita — tas ir muguras iztaisnotāju darbs. Ar ierobežojumu "mugura" — neizpildīt vai samazināt amplitūdu (pamīšus roka/kāja).
- Стало: Neliela amplitūda: rokas un kājas paceļas 5–15 cm no grīdas, bez sāpēm jostasvietā. Ja traucē mugura, neizpildi vai samazini amplitūdu (pamīšus roka/kāja).

### `tbar-row`

**lib.secondary**

- Было: Aizmugurējie deltveida; bicepss. Muguras atliecēji paliek gandrīz nenoslogoti, jo krūtis ir uz polstera.
- Стало: Aizmugurējie deltveida muskuļi; bicepss; muguras iztaisnotājmuskuļi, sēžas muskuļi un augšstilba aizmugure izometriski notur noliekumu — jostasvietas slodze ir ievērojama.

**lib.why**

- Было: Veido muguras biezumu smagā vilkmē ar krūšu atbalstu un stabilu stieņa ceļu.
- Стало: Smaga vilkme noliecoties ar vienu stieņa galu atbalstā: muguras biezumam.

**tech.steps**

- Было: Krūtis uz T-stieņa polstera, rokas karājas pie roktura, pēdas stabili uz platformas.<br>Vilkme uz krūšu apakšu. Šaurs tvēriens vairāk noslogo platos muguras muskuļus; plats — aizmugurējos deltveida muskuļus un trapecveida vidusdaļu.<br>Lāpstiņu savilkšana bez rumpja rāviena.
- Стало: Viens stieņa gals stūra stieņa atbalstā vai T-stieņa trenažierī bez krūšu atbalsta. Nostājies virs stieņa, pēdas plecu platumā, ceļi saliekti, rumpis noliekts apmēram 45° vai zemāk, mugura neitrāla.<br>Satver V-rokturi zem stieņa (vai trenažiera rokturus), rokas taisnas, lāpstiņas nolaistas.<br>Izelpojot velc rokturi pie krūšu apakšas / vēdera augšdaļas, savelkot lāpstiņas; rumpis nepaceļas.<br>Lēnām nolaid līdz taisnām rokām, nenoapaļojot muguru.

**tech.errors**

- Было: Rāviens<br>Krūtis atraujas no polstera<br>Muguras noapaļošana
- Стало: Muguras noapaļošana.<br>Rumpja rāviens augšup, lai «uzmestu» svaru.<br>Pārāk liels svars un saīsināta amplitūda.

**tech.safety**

- Было: No karājuma līdz roktura pieskārienam krūšu apakšai.
- Стало: Liela slodze jostasvietai: mugura neitrāla visos atkārtojumos. Ja sāp jostasvieta vai ir ierobežojums «mugura» — vilkme ar krūšu atbalstu.

### `thoracic-rotation`

**tech.safety**

- Было: Ar plecu ierobežojumu — maza amplitūda; ja sāp, nedari.
- Стало: Ja traucē pleci, neliela amplitūda; ja sāp, neizpildi.

### `tibialis-raise`

**tech.steps**

- Было: Stāvus ar muguru pret sienu, pēdas nedaudz priekšā, lāpstiņas balstās pret sienu. Papēži uz grīdas.<br>Papēži paliek uz grīdas, pirkstgali ceļas pret sevi (dorsālā fleksija).<br>Maksimāli ērta pirkstgalu pacelšana, tad lēna nolaišana līdz pieskārienam grīdai.
- Стало: Stāvus ar muguru pret sienu, pēdas nedaudz priekšā, lāpstiņas balstās pret sienu. Papēži uz grīdas.<br>Papēži paliek uz grīdas, pirkstgali ceļas pret sevi (pacel pirkstgalus).<br>Maksimāli ērta pirkstgalu pacelšana, tad lēna nolaišana līdz pieskārienam grīdai. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: No pirkstgalu pieskāriena grīdai līdz maksimālai bezsāpju dorsālajai fleksijai.
- Стало: No pirkstgalu pieskāriena grīdai līdz maksimālai bezsāpju dorsālajai fleksijai. Ja sāp apakšstilba priekšpuse, samazini amplitūdu vai pārtrauc.

### `towel-iso-curl`

**tech.steps**

- Было: Stāvus uzkāp uz dvieļa vidus ar vienu pēdu (vai sēdus piespied to pie grīdas ar pēdu); satver galus ar plaukstām uz augšu, elkoņi piespiesti sāniem un saliekti apmēram 90° leņķī.<br>Velc dvieli uz augšu kā saliekot rokas ar apmēram 70–100 % no maksimālā spēka; dvielis neļauj rokai kustēties. Elpo vienmērīgi, neaizturi elpu.<br>Noturi sasprindzinājumu 10–20 s, vienmērīgi atslābsti, atpūties un atkārto.
- Стало: Stāvus uzkāp uz dvieļa vidus ar vienu pēdu (vai sēdus piespied to pie grīdas ar pēdu); satver galus ar plaukstām uz augšu, elkoņi piespiesti sāniem un saliekti apmēram 90° leņķī.<br>Velc dvieli uz augšu kā saliekot rokas, apmēram ar pusi spēka (50–70 % no maksimālā); dvielis neļauj rokai kustēties. Elpo vienmērīgi, neaizturi elpu.<br>Noturi sasprindzinājumu 5–10 s, vienmērīgi atslābsti, atpūties un atkārto 3–5 reizes.

**tech.safety**

- Было: Kustības nav — izometrija (noturēšana). Elkoņa leņķis apmēram 90°; pa piegājieniem var mainīt leņķus 60°, 90° un 120°. Noturēšanas vingrinājums: programmā — sekundes, 10–20 s. Ar paaugstinātu asinsspiedienu — mērens sasprindzinājums, bez sasprindzināšanās.
- Стало: Kustības nav — noturēšana. Elkoņa leņķis apmēram 90°; pa piegājieniem var mainīt 60°, 90° un 120°. Noturi 5–10 s. Ar paaugstinātu asinsspiedienu — mērena piepūle, elpo vienmērīgi, neaizturi elpu un nespiedies. Ja reibst galva vai galvā pulsē — pārtrauc.

### `towel-leg-curl`

**tech.safety**

- Было: No gandrīz taisnām kājām līdz papēžiem pie sēžas (ceļi ap 90° un mazāk), iegurnis visu laiku pacelts. Iesācējam — īsāka amplitūda vai tikai papēžu atvilkšana. Vajadzīga gluda grīda (lamināts, flīzes); uz paklāja — paliec maisiņu vai slīdni. Ja ceļos ir diskomforts — samazini amplitūdu (kā guļus kāju saliekšanai, ierobežojuma karodziņa nav).
- Стало: No gandrīz taisnām kājām līdz papēžiem pie sēžas (ceļi ap 90° un mazāk), iegurnis visu laiku pacelts. Iesācējam — īsāka amplitūda vai tikai papēžu atvilkšana. Vajadzīga gluda grīda (lamināts, flīzes); uz paklāja — paliec maisiņu vai slīdni. Ja ceļos ir diskomforts — samazini amplitūdu.

### `towel-row`

**tech.safety**

- Было: No taisnām rokām līdz plaukstas pieskaras krūtīm (vai cik tuvu iespējams) ar pilnu lāpstiņu savilkšanu. Pārbaudi durvju un stendera drošību; durvis nedrīkst atvērties. Dvielis biezs, bez plīsumiem.
- Стало: Pārbaudi, vai durvju aplodas ir stipras un dvielis biezs, bez plīsumiem; aptin dvieli ap aplodu tā, lai velkot durvis nevarētu pakustēties; sāc ar nelielu slīpumu.

### `tpd-rope`

**tech.steps**

- Было: Virve, elkoņi piespiesti sāniem.<br>Atliekšana elkonī. Apakšā virves galus var viegli atvērt.<br>Gandrīz taisnas rokas, virves gali nedaudz šķirti. Atgriešanās līdz apmēram 90°.
- Стало: Virve, elkoņi piespiesti sāniem.<br>Atliekšana elkonī. Apakšā virves galus var viegli atvērt.<br>Gandrīz taisnas rokas, virves gali nedaudz šķirti. Atgriešanās līdz apmēram 90°. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: No elkoņa ap 90° līdz gandrīz pilnai atliekšanai.
- Стало: No elkoņa ap 90° līdz gandrīz pilnai atliekšanai. Bez rāvieniem; ja sāp elkonis, samazini svaru.

### `turkish-getup`

**lib.primary**

- Было: Korpuss (taisnais vēdera muskulis, slīpie, šķērseniskais vēdera muskulis) stabilizē visu ceļu.
- Стало: Rumpja muskuļi (taisnais vēdera muskulis, slīpie, šķērseniskais vēdera muskulis) stabilizē visu ceļu.

**lib.secondary**

- Было: Darba rokas plecs (deltveida, rotatora manšete, zāģzobis) tur svaru bumbu; sēžas muskuļi un četrgalvainais iztaisno kājas.
- Стало: Darba rokas plecs (deltveida, rotatora manšete, zāģzobis) tur svarbumbu; sēžas muskuļi un četrgalvainais muskulis iztaisno kājas.

**tech.steps**

- Было: Guli uz muguras, svaru bumba taisnā rokā virs pleca, skatiens uz bumbu. Tās pašas puses kāja ir saliekta, pēda uz grīdas; pretējā roka un kāja guļ sānis leņķī.<br>Parastā secība: atbalsts uz brīvā elkoņa, tad uz plaukstas; pacel gūžas tiltā; pabīdi taisno kāju zem sevis pusceļos; pieceļies. Darba roka visu laiku paliek vertikāla.<br>Stabila pozīcija pusceļos, bumba vertikāli virs pleca; tad pieceļies un kāp lejā apgrieztā secībā.<br>Dari lēni, pa vienam solim: pilns ceļš augšup un lejup parasti ir 12–20 s.
- Стало: Guli uz muguras, svarbumba taisnā rokā virs pleca, skatiens uz bumbu. Tās pašas puses kāja ir saliekta, pēda uz grīdas; pretējā roka un kāja guļ sānis leņķī.<br>Pēc kārtas: atbalsts uz elkoņa, tad uz plaukstas; pacel iegurni; pavelc taisno kāju zem sevis pusceļa stāvoklī; piecelies. Darba roka visu laiku vertikāla.<br>Stabila pozīcija pusceļos, bumba vertikāli virs pleca; tad pieceļies un kāp lejā apgrieztā secībā.<br>Dari lēni, pa vienam solim: pilns ceļš augšup un lejup parasti ir 12–20 s. Elpo vienmērīgi, neaizturi elpu.

**tech.safety**

- Было: Katrs solis tikai tik tālu, cik atbalsts ir stabils, bumbai paliekot vertikāli virs pleca.
- Стало: Vispirms apgūsti visus soļus bez svara, tad ar vieglu svarbumbu; ja bumba novirzās no vertikāles, nolaid to sānis, neķer; ja sāp plecs, pārtrauc.

### `w_glb`

**lib.secondary**

- Было: Augšstilba aizmugure, muguras iztaisnotāji
- Стало: Augšstilba aizmugure, muguras iztaisnotājmuskuļi

**tech.steps**

- Было: Apgulies uz muguras, ceļi saliekti, pēdas uz grīdas gūžu platumā, rokas gar sāniem.<br>Sasprindzini vēdera presi un atspiedies ar papēžiem.<br>Izelpā cel iegurni, saspiežot sēžas muskuļus, līdz taisnai līnijai pleci–iegurnis–ceļi.<br>Paturi 1 s un vienmērīgi nolaid iegurni līdz grīdai.
- Стало: Apgulies uz muguras, ceļi saliekti, pēdas uz grīdas gūžu platumā, rokas gar sāniem.<br>Sasprindzini vēdera muskuļus un atspiedies ar papēžiem.<br>Izelpā cel iegurni, saspiežot sēžas muskuļus, līdz taisnai līnijai pleci–iegurnis–ceļi.<br>Paturi 1 s un vienmērīgi nolaid iegurni līdz grīdai.

**tech.safety**

- Было: —
- Стало: Neieliec jostasvietu augšā; ja sāp jostasvieta — pacel iegurni mazāk.

### `w_scpull`

**tech.steps**

- Было: Pakāries pie stieņa uz taisnām rokām, tvēriens nedaudz platāks par pleciem.<br>Nesaliecot elkoņus, nolaid plecus un savelc lāpstiņas — ķermenis pacelsies pāris centimetrus.<br>Paturi 1 s.<br>Vienmērīgi atgriezies pilnā karā.
- Стало: Pakāries pie stieņa uz taisnām rokām, tvēriens nedaudz platāks par pleciem.<br>Nesaliecot elkoņus, nolaid plecus un savelc lāpstiņas — ķermenis pacelsies pāris centimetrus.<br>Paturi 1 s.<br>Vienmērīgi atgriezies pilnā karā. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

### `walk-brisk`

**lib.primary**

- Было: Sirds un asinsvadi, kāju muskuļi
- Стало: Kāju muskuļi (ikri, četrgalvainais muskulis, sēžas muskuļi)

**tech.steps**

- Было: Ej tādā tempā, lai vari runāt, bet ne dziedāt.<br>Solis no papēža uz pirkstgaliem, rokas saliektas un kustas ritmā.<br>Uz vietas mājās: augstu cel ceļus un aktīvi strādā ar rokām.<br>Iesildīšanā — viegls temps, kardio blokā — možs.
- Стало: Ej tādā tempā, lai vari runāt, bet ne dziedāt.<br>Solis no papēža uz pirkstgaliem, rokas saliektas un kustas ritmā.<br>Mājās: iešana uz vietas vai pa istabu; kardio blokā cel ceļus augstāk un aktīvāk strādā ar rokām.<br>Iesildīšanā — viegls temps, kardio blokā — možs.

**tech.safety**

- Было: Ar ceļu ierobežojumu — līdzena virsma, bez kāpumiem.
- Стало: Ja traucē ceļi, ej pa līdzenu virsmu, bez kāpumiem.

### `woodchop`

**lib.why**

- Было: Griež korpusu pa diagonāli pret trosi.
- Стало: Griež rumpi pa diagonāli pret trosi.

**tech.steps**

- Было: Stāvies sāniski pret augšējo bloku, rokturis abās rokās pie pleca, kas tālāk no bloka, virs galvas. Pēdas nedaudz platāk par pleciem, ceļi mīksti.<br>Pagriez korpusu un ved rokturi lejup pa diagonāli līdz pretējam gurnam. Gūžas un krūtis griežas kopā, rokas gandrīz taisnas. Tā ir korpusa griešana, nevis vilkme ar rokām.<br>Rokturis pie pretējā gurna, tad ved to atpakaļ augšup pa to pašu diagonāli kontrolēti.<br>Variants: No apakšas uz augšu (apgrieztā skaldīšana) ir atsevišķa iespēja.
- Стало: Stāvies sāniski pret augšējo bloku, rokturis abās rokās pie pleca, kas tālāk no bloka, virs galvas. Pēdas nedaudz platāk par pleciem, ceļi mīksti.<br>Pagriez rumpi un ved rokturi lejup pa diagonāli līdz pretējam gurnam. Gūžas un krūtis griežas kopā, rokas gandrīz taisnas. Tā ir rumpja griešana, nevis vilkme ar rokām.<br>Rokturis pie pretējā gurna, tad ved to atpakaļ augšup pa to pašu diagonāli kontrolēti.<br>Variants: No apakšas uz augšu (apgrieztā skaldīšana) ir atsevišķa iespēja. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.errors**

- Было: Tikai rokas, bez korpusa griešanas<br>jostasvieta stipri iekrīt<br>ceļi raujas uz iekšu<br>roktura atlaišana.
- Стало: Tikai rokas, bez rumpja griešanas<br>jostasvieta stipri iekrīt<br>ceļi raujas uz iekšu<br>roktura atlaišana.

**tech.safety**

- Было: No rokām virs tālākā pleca līdz rokturim pie pretējā gurna, nezaudējot neitrālu jostasvietu.
- Стало: No rokām virs tālākā pleca līdz rokturim pie pretējā gurna, nezaudējot neitrālu jostasvietu. Svars mērens, bez rāvieniem; ja sāp jostasvieta, pārtrauc.

### `worlds-greatest-stretch`

**lib.secondary**

- Было: Priekšējās kājas augšstilba aizmugure, ja ir ceļa iztaisnošanas fāze; ikri; korpuss tur neitrāli.
- Стало: Priekšējās kājas augšstilba aizmugure, ja ir ceļa iztaisnošanas fāze; ikri; rumpja muskuļi tur neitrāli.

### `wrist-curl`

**tech.steps**

- Было: Sēdi, apakšdelmi uz augšstilbiem vai sola, plaukstas uz augšu, plaukstas locītavas nedaudz aiz atbalsta malas, stienis pirkstos.<br>Locies tikai plaukstas locītavās, tinot plaukstas pret sevi. Apakšdelmi paliek nekustīgi.<br>Pilna plaukstas locītavas saliekšana, tad lēna nolaišana līdz saliecēju stiepumam.
- Стало: Sēdus, apakšdelmi uz augšstilbiem vai sola, plaukstas uz augšu, plaukstas locītavas nedaudz aiz balsta malas, stienis vai hanteles pirkstos.<br>Locies tikai plaukstas locītavās, tinot plaukstas pret sevi. Apakšdelmi paliek nekustīgi.<br>Pilna plaukstas locītavas saliekšana, tad lēna nolaišana līdz saliecēju stiepumam. Izelpo piepūles fāzē, ieelpo, nolaižot svaru.

**tech.safety**

- Было: No stiepuma plaukstas locītavas mugurpusē līdz pilnai plaukstas saliekšanai, nesāpīgā amplitūdā.
- Стало: No stiepuma plaukstas locītavas mugurpusē līdz pilnai plaukstas saliekšanai, nesāpīgā amplitūdā. Svars viegls, bez rāvieniem; ja sāp plaukstas locītava, pārtrauc.

