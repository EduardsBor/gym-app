# D-268 — новые строки для проверки (RU / EN / LV)

Источник: `/workspace/legal-auth-21-11/20-auth-required-review.md`.
RU — исходные строки в интерфейсе. EN и LV — перевод для проверки (в файле разбора готовых EN/LV не было).

## Кнопки переноса данных (когда в аккаунте уже есть данные)

| RU | EN | LV |
|---|---|---|
| Объединить с аккаунтом | Merge with the account | Apvienot ar kontu |
| Не переносить | Do not transfer | Nepārnest |

Заголовок диалога («Перенести данные в аккаунт?») не новый: LV уже правили отдельно — «Pārnest datus uz kontu?».

## Предупреждение при выходе, если есть несохранённые тренировки

Стоит под строкой «Есть тренировки, которые ещё не сохранены в облаке».

| RU | EN | LV |
|---|---|---|
| Если на этом устройстве войдёт другой аккаунт, несохранённые тренировки и фото тела удалятся. | If another account signs in on this device, unsaved workouts and body photos will be deleted. | Ja šajā ierīcē pieteiksies cits konts, nesaglabātie treniņi un ķermeņa foto tiks dzēsti. |

Хранение фото по владельцу в D-268 не делается — только предупреждение.

## Пять обязательных LV-замен (уже в dict3.js)

| Было | Стало |
|---|---|
| Esi izgājis | Izgāji no konta |
| Esi izgājis. Dati paliek mākonī un pēc pieteikšanās atgriezīsies | Izgāji no konta. Dati paliek mākonī un pēc pieteikšanās atgriezīsies |
| Pārcelt datus uz kontu? | Pārnest datus uz kontu? |
| Iziet tik un tā | Tomēr iziet |
| Nav tīkla. Ieiet varēsi, kad būs internets. | Nav tīkla. Pieteikties varēsi, kad būs internets. |

`docs/LV-проверка.xlsx` и `docs/LV-REVIEW.md` в этом PR не трогались.
