# Сборка Android (GymCaptain)

Обёртка Capacitor 8 вокруг той же PWA. Сайт GitHub Pages по-прежнему отдаётся из корня репозитория (`index.html` в корне). Каталог `www/` — только выход `npm run build:web`, в git он не входит.

Публикация в Google Play, подпись релиза и регистрации — только по явной команде Эдуарда. В репозиторий нельзя класть ключи, keystore, пароли и токены.

## Идентификатор приложения

- `appId`: `app.gymcaptain`
- Можно сменить **до первой загрузки** в Google Play. После первой публикации идентификатор пакета менять нельзя.
- `appName`: GymCaptain
- Первая debug-сборка: `versionName` `1.0`, `versionCode` `1` (`android/app/build.gradle`).

## Что уже есть / что ещё нет

- Иконка и сплеш — стандартные от Capacitor. Подставить свои, когда Бизнес сдаст **B-409**.
- Подпись release/keystore и загрузка в Play — позже (**A-502**, **A-506**). Сейчас только debug APK.
- Health Connect и серверный статус подписки — позже, не в этой задаче (A-501).

## Сборка debug APK

Нужны JDK 21 (подойдёт и 17) и Android SDK (platform android-36 и build-tools, которые запросит Gradle / Capacitor 8).

```bash
# 1. Зависимости Node (один раз)
npm install

# 2. Скопировать веб-файлы в www/ и синхронизировать нативный проект
npm run build:web
npx cap sync android

# 3. Собрать debug APK
#    JAVA_HOME — JDK 17/21; ANDROID_HOME / ANDROID_SDK_ROOT — каталог SDK
cd android
./gradlew assembleDebug
```

Готовый файл: `android/app/build/outputs/apk/debug/app-debug.apk`.

Встроенный service worker уже регистрируется с `.catch(()=>{})` в `app.js`. Если регистрация в WebView Capacitor не удастся, приложение всё равно работает офлайн из файлов, упакованных в APK.

## Что не входит в обёртку

- `test/`, `docs/`, `sql/`, `tools/`, `node_modules/`, `android/`
- ролики MoveKit (их нет в репозитории; они только в закрытом бакете Supabase и отдаются через `movekit-sign`)
