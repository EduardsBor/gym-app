# LV strings new or changed in D-209

Для Claude: новые/изменённые латышские строки. В LV-REVIEW.md и файл Эдуарда не добавлялись. D-216 не начинался.

## Новые строки (i18n)

| Ключ (RU) | EN | LV |
|---|---|---|
| упражнение: 3D-анимация, техника, твоя история | exercise: 3D animation, technique, your history | vingrinājums: 3D animācija, tehnika, tava vēsture |
| упражнения: 3D-анимация, техника, твоя история | exercises: 3D animation, technique, your history | vingrinājumi: 3D animācija, tehnika, tava vēsture |
| упражнений: 3D-анимация, техника, твоя история | exercises: 3D animation, technique, your history | vingrinājumi: 3D animācija, tehnika, tava vēsture |
| Для набора массы лучше тренироваться 3+ дня в неделю | For muscle gain it is better to train 3+ days a week | Masas uzņemšanai labāk trenēties 3+ dienas nedēļā |
| Для силы нужен зал: со своим весом присед и тягу трудно сделать тяжёлыми. | For strength you need a gym: bodyweight squats and deadlifts are hard to make heavy enough. | Spēkam vajadzīga zāle: ar ķermeņa svaru pietupienus un vilkmi grūti padarīt pietiekami smagus. |
| В дни без зала — 30–40 мин быстрой ходьбы. Худеть лучше на 0,5–1 % веса в неделю. Белок — 1,6–2,2 г на кг веса в день; при болезнях почек, диабете, беременности сначала посоветуйтесь с врачом. | On rest days — 30–40 min of brisk walking. Aim to lose 0.5–1% of body weight per week. Protein — 1.6–2.2 g per kg of body weight per day; if you have kidney disease, diabetes or are pregnant, talk to a doctor first. | Dienās bez zāles — 30–40 min raitas iešanas. Svara samazināšanai labāk 0,5–1 % ķermeņa svara nedēļā. Olbaltumvielas — 1,6–2,2 g uz kg ķermeņa svara dienā; nieru slimību, diabēta vai grūtniecības gadījumā vispirms konsultējieties ar ārstu. |
| В дни без зала — 30–40 мин быстрой ходьбы. Белок — 1,6–2,2 г на кг веса в день; при болезнях почек, диабете, беременности сначала посоветуйтесь с врачом. | On rest days — 30–40 min of brisk walking. Protein — 1.6–2.2 g per kg of body weight per day; if you have kidney disease, diabetes or are pregnant, talk to a doctor first. | Dienās bez zāles — 30–40 min raitas iešanas. Olbaltumvielas — 1,6–2,2 g uz kg ķermeņa svara dienā; nieru slimību, diabēta vai grūtniecības gadījumā vispirms konsultējieties ar ārstu. |
| Жим: грудь, плечи, трицепс | Press: chest, shoulders, triceps | Spiešana: krūtis, pleci, tricepss |
| Тяга: спина, бицепс | Pull: back, biceps | Vilkme: mugura, bicepss |
| Жим B: грудь, плечи, трицепс | Press B: chest, shoulders, triceps | Spiešana B: krūtis, pleci, tricepss |
| Тяга B: спина, бицепс | Pull B: back, biceps | Vilkme B: mugura, bicepss |
| Ноги B | Legs B | Kājas B |
| 8–10 повторов, легко | 8–10 reps, easy | 8–10 atkārtojumi, viegli |
| на устройстве данные другого аккаунта. Выйди и войди заново | this device has data from another account. Sign out and sign in again | šajā ierīcē ir cita konta dati. Izeji un ieej no jauna |
| На этом устройстве сохранены данные другого аккаунта. Объединить их с этим аккаунтом? (далее ОК/Отмена) | This device has data from another account. Merge it with this account? (OK / Cancel) | Šajā ierīcē ir saglabāti cita konta dati. Apvienot tos ar šo kontu? (OK — apvienot. Atcelt — iziet, dati paliks kā ir.) |
| Не удалось удалить данные в облаке. Проверь интернет и попробуй ещё раз. Данные на этом устройстве пока не удалены. | Could not delete the data in the cloud. Check your internet connection and try again. Data on this device has not been deleted yet. | Neizdevās dzēst datus mākonī. Pārbaudi internetu un mēģini vēlreiz. Dati šajā ierīcē pagaidām nav dzēsti. |
| Данные удалены. Аккаунт (почту для входа) удалить не удалось — войди ещё раз и повтори удаление позже. | The data was deleted. The account (sign-in email) could not be deleted — sign in again and retry the deletion later. | Dati ir dzēsti. Kontu (e-pastu ieiešanai) neizdevās dzēst — ieej vēlreiz un atkārto dzēšanu vēlāk. |
| ⚠ Не удалось сохранить: память браузера заполнена. Сделай экспорт в «Ещё». | ⚠ Could not save: the browser storage is full. Export a backup under “More”. | ⚠ Neizdevās saglabāt: pārlūka atmiņa ir pilna. Izveido kopiju sadaļā “Vēl”. |
| Вход выполнен, но синхронизация не удалась: | Signed in, but sync failed: | Ieiešana izdevās, bet sinhronizācija neizdevās: |

Префиксы «упражнение / упражнения / упражнений» используются в подписи библиотеки вместе с динамическим числом (`EX.length`).

## Изменённые строки (убраны устаревшие числа)

| Было (LV) | Стало (LV) | Где |
|---|---|---|
| 68 vingrinājumi: 3D animācija, tehnika, tava vēsture | vingrinājums / vingrinājumi: 3D animācija, tehnika, tava vēsture (число берётся из библиотеки) | `i18n/dict.js`, подпись в «Vēl» |
| Pilna bibliotēka: 68 vingrinājumi ar 3D video | Pilna bibliotēka ar 3D video | `i18n/dict2.js` |
| Pilna bibliotēka ar 3D video — Premium. Bez maksas: 20 pamata vingrinājumi. | Pilna bibliotēka ar 3D video — Premium. | `i18n/dict2.js` (и fallback в lib.js) |
| Visu 68 vingrinājumu 3D video pieejami Premium | Tehnikas 3D video pieejami Premium | `i18n/dict2.js` |
| Versija 22 | удалено (неиспользуемый ключ; в «Vēl» теперь «Versija» + APP_VERSION) | `i18n/dict2.js` |

## Встроенная политика (`legal.js`)

| Было (LV) | Стало (LV) | Раздел |
|---|---|---|
| ES, pašlaik Īrija / eu-west-1 | ES, pašlaik Frankfurte / eu-central-1 | Политика, «3. Kur dati tiek glabāti» |

Слово «Русский» в переключателе языка не переводится (название языка остаётся на русском). Тексты техники упражнений (библиотека / warm / tech) не менялись.
