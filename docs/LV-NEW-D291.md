# LV-NEW-D291 — правки LV на проверку Claude

В коде: `i18n/dict3.js`. Правила D-216 соблюдены. Файлы `docs/LV-проверка.xlsx` и `docs/LV-REVIEW.md` не менялись.

## Уточнения к D-290

Строки из `docs/LV-NEW-D290.md` заменены так:

| RU | EN | было (D-290) | стало (D-291) |
|---|---|---|---|
| Не выполнен вход | Not signed in | Nav veikta pieteikšanās | Nav ieiets kontā |
| Удалятся данные только на этом устройстве. Аккаунт, копия в облаке и подписка останутся. Чтобы удалить аккаунт и данные в облаке — «Удалить аккаунт». | Only the data on this device will be deleted. Your account, cloud copy and subscription will remain. To delete your account and cloud data, use “Delete account”. | Tiks dzēsti tikai dati šajā ierīcē. Konts, mākoņa kopija un abonements paliks. Lai dzēstu kontu un datus mākonī, izmanto «Dzēst kontu». | Dati tiks dzēsti tikai šajā ierīcē. Konts, mākoņa kopija un abonements paliks. Lai dzēstu kontu un datus mākonī, izmanto «Dzēst kontu». |

## Каталог: из описаний убрана фиксированная длительность

Хвост «по 60–70 минут» / «60–70 minutes each» / «katrs 60–70 minūtes» снят с описаний программ. Реальная длительность остаётся в строке `duration_label` под описанием. Новых LV-фраз нет — только укороченные уже существующие описания (в словаре 10 карточек, включая скрытую «Дом с гантелями»). Шаблон сводки без минут: `{n} {workoutWord}, около {w} {weekWord}` → `{n} {workoutWord}, apmēram {w} {weekWord}`.
