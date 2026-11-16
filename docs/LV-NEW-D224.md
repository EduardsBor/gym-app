# Новые LV-строки: D-224 (ошибки икры, название pulldown, analītika)

Нужна проверка носителем. В LV-REVIEW.md и в файл Эдуарда не добавлялись. Формат: RU → LV (тексты заданы Claude в разделе 5 задания D-216/D-224).

## 1. Ошибки: Pacelšanās uz pirkstgaliem stāvus trenažierī (`mk-standing-calf-raise-machine`)

Поле ошибок заменено целиком (раньше там была строка из техники). Техника не менялась.

1. RU: Пружинить внизу вместо медленного движения.
   EN: Bouncing at the bottom instead of moving slowly.
   LV: Atsperošana apakšā lēnas kustības vietā.

2. RU: Неполная амплитуда: пятки не опускаются ниже платформы.
   EN: Partial range: heels don't drop below the platform.
   LV: Nepilna amplitūda — papēži nenolaižas zem platformas.

3. RU: Сгибать колени — работают бёдра, а не икры.
   EN: Bending the knees, so the thighs work instead of the calves.
   LV: Ceļu saliekšana — strādā augšstilbi, nevis ikri.

## 2. Название: Пуловер на блоке прямыми руками (`straight-arm-pulldown`)

Только `nameLv`, id без изменений.

- Было: Taisno roku vilkme uz bloka
- Стало: Taisno roku vilkšana blokā

## 3. Исправление орфографии: analitika → analītika

Только LV, только `legal.js` и `i18n/dict3.js`.

`legal.js` (раздел 4):

- Было: Anonīmo analitiku var ieslēgt…
- Стало: Anonīmo analītiku var ieslēgt…

`i18n/dict3.js`:

- Anonīma analitika → Anonīma analītika
- Analitika ieslēgta → Analītika ieslēgta
- Analitika izslēgta → Analītika izslēgta
- Anonīmo analitiku var ieslēgt atsevišķi sadaļā “Vēl”. → Anonīmo analītiku var ieslēgt atsevišķi sadaļā “Vēl”.
