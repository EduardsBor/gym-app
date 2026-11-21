# Какие SQL-файлы применены на живой базе

Проект Supabase: `krrhwuldkwkkcegxhyqq` (EU, `eu-central-1`).

Этот файл — журнал того, что запускали в SQL Editor (не через `supabase migration`). Официальный журнал миграций (`supabase_migrations.schema_migrations` / `list_migrations`) на 21.11.2026 пуст — это ожидаемо: файлы из `sql/` выполнялись вручную.

Проверено только чтением: git, заголовки `sql/*`, TASKS.md, описание PR, и read-only запросы через user-Supabase MCP 21.11.2026 (список таблиц и функций, `cron.job`, `storage.buckets`). Запись в базу не выполнялась.

Время — Europe/Riga (UTC+2), если не указано иное.

| Файл | Применён? | Когда (Europe/Riga) | Как подтверждено | Примечание |
|---|---|---|---|---|
| `sql/001_stage2.sql` | да | точное время **не подтверждено** | Заголовок файла: «Applied to project krrhwuldkwkkcegxhyqq as migration stage2_user_state_and_events». На живой базе есть `public.user_state` и функция `delete_my_account`. К 14.11.2026 16:15 (D-203, Claude принял проверку прода) таблицы и удаление аккаунта уже работали. | Сам файл попал в репозиторий позже (копия после факта, PR #72, 19.11). Точной даты/часа запуска в SQL Editor в git нет. |
| `sql/002_movekit_private.sql` | эффект на базе есть; сам файл в текущем репозитории **отсутствует** | 13.11.2026 21:57 (TASKS, D-213) | D-213: после деплоя `movekit-sign` политика публичного доступа снята. Живой бакет `movekit`: `public = false`. | Историческая копия файла была в рабочей папке (не в текущем `sql/`). Официальный журнал миграций пуст, поэтому факт именно запуска этого файла (а не ручной правки политики) **не подтверждён** журналом; результат на базе совпадает с целью D-213. |
| `sql/003_anon_analytics.sql` | да | 14.11.2026 ~13:50 | Факт из постановки задачи и TASKS (D-217): Claude принял, SQL запущен в `krrhwuldkwkkcegxhyqq`. Живая таблица `events` без колонки `user_id`. Функция `public.purge_old_events()` есть. Cron-задача `purge-old-events` активна: расписание `17 3 * * *` (03:17 UTC = 05:17 Europe/Riga), команда `select public.purge_old_events()`, база `postgres`. | Откат: `sql/003_anon_analytics_rollback.sql`. В TASKS время cron указано как ежедневно 03:17 UTC (05:17 Рига) — совпадает с живой базой. |
| `sql/004_preplay_consent_tombstone.sql` | да | 21.11.2026 16:24 | Применил CoS; Claude принял (запись в TASKS, D-273: «SQL-004 применена шефом 16:24»). На живой базе есть `health_consent_log`, `deleted_accounts`, функции `health_consent_log_set_uid` и `user_state_guard`. | Откат: `sql/004_preplay_consent_tombstone_rollback.sql`. В этом PR SQL на базу не накатывался. |

## Что специально не подтверждено

- Точные дата и час запуска `001_stage2.sql` в SQL Editor.
- Наличие файла `sql/002_movekit_private.sql` в git на момент применения и запись об этом в журнале миграций (журнала нет).
- Содержимое `supabase_migrations.schema_migrations` — список пуст, отдельных версий миграций там нет.

Если позже накатывать SQL через CLI, имеет смысл начать вести этот журнал вместе с `list_migrations`, не удаляя историю ручных запусков.
