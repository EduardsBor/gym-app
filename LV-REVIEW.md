# LV translation — NEEDS NATIVE-SPEAKER REVIEW

All Latvian (LV) strings were machine-assisted drafts. Before release a native Latvian speaker must review them, and a lawyer must also review the legal texts.

| File | What it contains | Status |
|---|---|---|
| `i18n/dict.js` | 3rd column of `DICT` / `DICT_EXACT`: the whole UI (tabs, today/workout, program, progress, history, body, more, science, library, catalog, quiz, exercise names, units) | ⚠️ needs review |
| `i18n/dict2.js` | 3rd column: onboarding, paywall, consent, privacy & data, owner mode | ⚠️ needs review |
| `i18n/lib.lv.js` | `LIB_LV`: 68 exercises (muscles, description, steps, mistakes) | ⚠️ needs review (anatomy terms) |
| `i18n/tech.lv.js` | `TECH_LV`: 68 technique sheets | ⚠️ needs review |
| `legal.js` (`LEGAL.lv`) | Privacy Policy + Terms of Use (DRAFT, placeholders) | ⚠️ needs native review **and** a lawyer |
| `features.js` | One LV-only note in «Vēl»: "Latviešu tulkojums ir melnraksts…" | remove after review |

Notes for the reviewer:
- Citations or scientific sources are intentionally left in their original language.
- Terms to check: 1RM → "1MA" (1 maksimālais atkārtojums), BMI → "ĶMI", GDPR → "VDAR".
- Exercise names may follow gym slang (for example "Pietupieni ar stieni"); align them with common Latvian gym usage.
