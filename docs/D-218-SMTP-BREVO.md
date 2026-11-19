# D-218 — письма входа Supabase через Brevo SMTP

Проект Supabase: **krrhwuldkwkkcegxhyqq** (GymCaptain, Europe).
Дашборд SMTP: https://supabase.com/dashboard/project/krrhwuldkwkkcegxhyqq/auth/smtp
Шаблоны: https://supabase.com/dashboard/project/krrhwuldkwkkcegxhyqq/auth/templates
Лимиты: https://supabase.com/dashboard/project/krrhwuldkwkkcegxhyqq/auth/rate-limits

## 1. SMTP (Authentication → Emails → SMTP Settings → Enable Custom SMTP)
| Поле | Значение |
|---|---|
| Sender email | no-reply@gymcaptain.app |
| Sender name | GymCaptain |
| Host | smtp-relay.brevo.com |
| Port | 587 |
| Username | SMTP-логин из Brevo (SMTP & API → SMTP) — вводится только в дашборде, в репо не пишется |
| Password | SMTP-ключ Brevo — вводит только Эдуард / браузерный шаг. В файлы, PR, чаты не попадает. |
| Minimum interval per user | 60 секунд (по умолчанию) |

## 2. Rate limits (Authentication → Rate Limits)
- Rate limit for sending emails: **60 в час** (Brevo Free — 300 писем в день; 60/ч хватает на пики, дневной потолок держит Brevo).
- Email OTP length: **6** (Authentication → Providers → Email; приложение ждёт 6 цифр). Email OTP expiration: 3600 с.

## 3. Шаблоны (Authentication → Emails → Templates) — вставить HTML из репо
| Шаблон | Subject | Файл |
|---|---|---|
| Confirm signup | GymCaptain: код подтверждения · confirmation code · apstiprinājuma kods | supabase/templates/confirm_signup.html |
| Magic Link | GymCaptain: код входа · sign-in code · pieteikšanās kods | supabase/templates/magic_link.html |
| Reset Password | GymCaptain: новый пароль · new password · jauna parole | supabase/templates/reset_password.html |

Одно письмо на трёх языках (RU → EN → LV): язык пользователя Supabase в шаблон не передаётся.
Код `{{ .Token }}` крупно, ссылка `{{ .ConfirmationURL }}` — запасной путь. Reset — только ссылка (в приложении сброс по ссылке).

## 4. Приложение
- Вход по коду уже есть: «Войти по ссылке/коду» → поле кода → `verifyOtp({email, token, type:'email'})`.
- D-218: после регистрации с паролем (без сессии) тоже открывается поле кода — код из письма «Confirm signup» подтверждает и сразу входит.

## 5. Проверка доставки
1. Регистрация нового тестового адреса Gmail и Outlook → письмо во «Входящих», код работает.
2. В заголовках (Gmail: «Показать оригинал»; Outlook: «Просмотреть исходный текст»): `Authentication-Results: … dkim=pass header.d=gymcaptain.app`, `dmarc=pass (p=NONE) header.from=gymcaptain.app`; `spf=pass` будет по домену Brevo (Return-Path …brevo…) — это нормально, DMARC проходит через DKIM.
3. Brevo → Transactional → Logs: статус Delivered.
