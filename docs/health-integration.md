# Health integration

Web phase of calories and heart rate for Мой Зал. A store build (Capacitor) can add Apple Health and Health Connect later without changing the workout math or the history shape.

## What the site does now

- **Calories with no device.** MET × body weight × hours, split by block:
  - warm-up 3.0 MET, cool-down 2.3 MET (low);
  - strength 6.0 MET for multi-joint compounds, 3.5 MET for isolation and core;
  - cardio by exercise type (treadmill, bike, elliptical, rower, stepper, jumping jack, brisk walk, and the extra cardio ids).
- Sex, when the profile has it, scales the MET result (female × 0.9). Unknown sex is not guessed.
- If body weight is missing, the workout asks once (kg, optional). It can be changed under «Ещё».
- The number is always labelled approximate: «≈ ккал, оценка».
- **Heart rate** only where `navigator.bluetooth` exists (Android Chrome). Service `heart_rate` (`0x180D`), measurement `heart_rate_measurement` (`0x2A37`). The button is «Подключить пульсометр». Disconnects retry with backoff; the user can connect again. Elsewhere, including iOS Safari and the home-screen PWA, the workout shows: «Пульсометр будет доступен в версии из магазина приложений.»
- When samples, weight, age and sex are all present, calories use Keytel et al. 2005 (kJ/min ÷ 4.184). Gaps longer than 20 seconds fall back to the MET rate for that gap. If age or sex is missing, the whole session stays on METs. Age is asked once, the first time a sample arrives.
- Zones use Tanaka HRmax = 208 − 0.7 × age. Zone 1 is everything under 60%, then 60–70, 70–80, 80–90, 90–100+.

## Provider

`health.js` exposes `hr`:

| | |
|---|---|
| `hr.source` | `'ble' \| 'manual' \| 'healthkit' \| 'healthconnect'` |
| `hr.connect()` | Open the current source. Must be called from a user gesture for Web Bluetooth. |
| `hr.disconnect()` | Stop the source and cancel reconnects. |
| `hr.onSample(fn)` | `fn({ t, bpm, source })`. Returns an unsubscribe function. |
| `hr.onStatus(fn)` | `'idle' \| 'connecting' \| 'live' \| 'reconnecting' \| 'disconnected' \| 'error'`. |
| `hr.ingest(bpm, t, source)` | Push one sample. Native code and tests use this. |
| `hr.use(adapter)` | Replace the transport. `adapter` is `{ source, connect(), disconnect() }`. |
| `hr.ready(name)` / `hr.fail()` | The adapter reports a live monitor or a drop. |

`hrConnectOffer(hasBluetooth, source)` is `'button'` when Web Bluetooth exists or the source is `healthkit` / `healthconnect`, and `'note'` otherwise. The store shell should call `hr.use(...)` before the first workout screen so the button appears on iOS too.

Manual entry and screenshots set `hr.source = 'manual'` and call `hr.ingest`.

## History

Finished workouts gain optional fields only. Older records have none of these and still open:

```js
{
  kcal: 240,            // integer, approximate
  kcalSource: 'met',    // or 'hr'
  hr: {                 // omitted when no samples were stored
    source: 'ble',      // ble | manual | healthkit | healthconnect
    avg: 128,
    max: 164,
    hrMax: 184.2,       // only if age was known
    zones: [60, 120, 300, 80, 0]  // seconds, zone 1..5
  }
}
```

Raw samples are kept only on the in-progress workout (`S.active.hrSamples`) and are removed before the record is saved. `weightKg`, `age`, `weightAsked` and `ageAsked` live on the profile and sync with other settings.

## Native plan (not in this web build)

Wrap the app with Capacitor. One small plugin, `GymHealth`, should speak the provider above. Do not pull Garmin, Samsung, Huawei or Fitbit SDKs into the app.

### iOS — HealthKit

- Read `HKQuantityTypeIdentifierHeartRate` and `HKQuantityTypeIdentifierActiveEnergyBurned` for the workout interval.
- Write one `HKWorkout` (traditional strength training, or the session’s real activity) with duration and active energy. Prefer `HKWorkoutBuilder`.
- **Apple Watch, live.** Start an `HKWorkoutSession` plus `HKLiveWorkoutBuilder` (watchOS companion, or a mirrored session the phone starts). Forward each heart-rate sample to `hr.ingest(bpm, t, 'healthkit')` and call `hr.ready()` / `hr.fail()` around the session. After the session, if HealthKit has active energy for that interval, the shell may show it beside the in-app estimate; the in-app number stays the Keytel/MET figure so history from the website and the app match.
- The web view on iOS still has no Web Bluetooth. The plugin is what makes «Подключить пульсометр» real there (`hr.use({ source: 'healthkit', connect, disconnect })`).

### Android — Health Connect

- Read `HeartRateRecord` and `ActiveCaloriesBurnedRecord`. Write `ExerciseSessionRecord` for the workout.
- Permissions: read heart rate, read active calories, write exercise.
- Garmin Connect, Samsung Health, Huawei Health and Fitbit already write into Health Connect when the user turns that on in those apps. Reading Health Connect covers those watches. A live Bluetooth strap on Android Chrome keeps using the web Heart Rate service (`source: 'ble'`).
- Install the plugin with `hr.use({ source: 'healthconnect', connect, disconnect })`.

### Wiring sketch

```js
hr.use({
  source: platform === 'ios' ? 'healthkit' : 'healthconnect',
  connect() { return GymHealth.startWorkout(); },
  disconnect() { return GymHealth.stopWorkout(); }
});
GymHealth.addListener('sample', (s) => hr.ingest(s.bpm, s.t, hr.source));
GymHealth.addListener('status', (s) => { if (s.live) hr.ready(s.name); else hr.fail(); });
```

Keep `summarizeHealth` / `applyHealthFields` as the only writers of `kcal` and `hr` on the workout record, so the website and the store build store the same shape.
