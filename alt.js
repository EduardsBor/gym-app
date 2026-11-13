// Замены ⇄: те же основные мышцы, порядок тренера (лучше → хуже). Пустой список — кнопки замены нет.
const ALT={
 "bp": [
  "smith-bench",
  "dbp",
  "mch",
  "decline-db-press",
  "pu",
  "band-chest-press",
  "ibp",
  "smith-incline-bench",
  "idb",
  "mch-incline",
  "mk-parralel-bar-dips"
 ],
 "dbp": [
  "bp",
  "mch",
  "smith-bench",
  "decline-db-press",
  "pu",
  "band-chest-press",
  "idb",
  "ibp",
  "mch-incline",
  "smith-incline-bench",
  "mk-parralel-bar-dips"
 ],
 "ibp": [
  "smith-incline-bench",
  "idb",
  "mch-incline",
  "bp",
  "dbp",
  "smith-bench",
  "mch",
  "pu",
  "band-chest-press"
 ],
 "idb": [
  "ibp",
  "mch-incline",
  "smith-incline-bench",
  "dbp",
  "bp",
  "mch",
  "smith-bench",
  "pu",
  "band-chest-press"
 ],
 "fly": [
  "pec-deck",
  "mk-cable-pec-fly",
  "incline-db-fly"
 ],
 "mk-cable-pec-fly": [
  "pec-deck",
  "fly",
  "incline-db-fly"
 ],
 "mk-parralel-bar-dips": [
  "decline-db-press",
  "dbp",
  "bp",
  "smith-bench",
  "mch",
  "pu",
  "cgb",
  "smith-close-grip",
  "mk-diamond-push-ups",
  "bd"
 ],
 "pu": [
  "band-chest-press",
  "dbp",
  "bp",
  "mch",
  "smith-bench",
  "decline-db-press",
  "mk-parralel-bar-dips",
  "idb",
  "ibp",
  "mch-incline",
  "smith-incline-bench"
 ],
 "mch": [
  "smith-bench",
  "bp",
  "dbp",
  "decline-db-press",
  "band-chest-press",
  "pu",
  "mch-incline",
  "smith-incline-bench",
  "ibp",
  "idb",
  "mk-parralel-bar-dips"
 ],
 "mch-incline": [
  "smith-incline-bench",
  "ibp",
  "idb",
  "mch",
  "smith-bench",
  "bp",
  "dbp",
  "band-chest-press",
  "pu"
 ],
 "pec-deck": [
  "mk-cable-pec-fly",
  "fly",
  "incline-db-fly"
 ],
 "mk-barbell-deadlift": [
  "rdl",
  "smith-rdl",
  "mk-dumbbell-stiff-leg-deadlift",
  "sl-rdl",
  "hyp",
  "reverse-hyper",
  "kettlebell-swing"
 ],
 "pull": [
  "assisted-pullup",
  "negative-pullup",
  "chin",
  "lat",
  "close-pulldown",
  "straight-arm-pulldown",
  "cr",
  "dbr",
  "row",
  "chest-supported-2db",
  "tbar-row",
  "smith-row",
  "inv",
  "chest-supported-1db",
  "meadows-row",
  "pendlay-row"
 ],
 "lat": [
  "close-pulldown",
  "pull",
  "assisted-pullup",
  "chin",
  "negative-pullup",
  "straight-arm-pulldown",
  "cr",
  "dbr",
  "row",
  "chest-supported-2db",
  "tbar-row",
  "smith-row",
  "inv",
  "chest-supported-1db",
  "meadows-row",
  "pendlay-row"
 ],
 "row": [
  "pendlay-row",
  "smith-row",
  "tbar-row",
  "chest-supported-2db",
  "dbr",
  "meadows-row",
  "cr",
  "chest-supported-1db",
  "inv"
 ],
 "dbr": [
  "chest-supported-1db",
  "meadows-row",
  "chest-supported-2db",
  "cr",
  "row",
  "tbar-row",
  "smith-row",
  "pendlay-row",
  "inv"
 ],
 "cr": [
  "chest-supported-2db",
  "tbar-row",
  "dbr",
  "row",
  "smith-row",
  "chest-supported-1db",
  "meadows-row",
  "inv",
  "pendlay-row"
 ],
 "hyp": [
  "mk-barbell-deadlift"
 ],
 "mk-dumbbell-shrug": [
  "smith-shrug",
  "farmers-walk"
 ],
 "inv": [
  "cr",
  "chest-supported-2db",
  "dbr",
  "row",
  "tbar-row",
  "smith-row",
  "chest-supported-1db",
  "meadows-row",
  "pendlay-row"
 ],
 "chest-supported-2db": [
  "tbar-row",
  "chest-supported-1db",
  "cr",
  "dbr",
  "row",
  "smith-row",
  "pendlay-row",
  "meadows-row",
  "inv"
 ],
 "chest-supported-1db": [
  "dbr",
  "chest-supported-2db",
  "meadows-row",
  "tbar-row",
  "cr",
  "row",
  "smith-row",
  "pendlay-row",
  "inv"
 ],
 "tbar-row": [
  "chest-supported-2db",
  "row",
  "smith-row",
  "pendlay-row",
  "meadows-row",
  "cr",
  "chest-supported-1db",
  "dbr",
  "inv"
 ],
 "close-pulldown": [
  "lat",
  "chin",
  "assisted-pullup",
  "pull",
  "negative-pullup",
  "straight-arm-pulldown",
  "cr",
  "dbr",
  "row",
  "chest-supported-2db",
  "tbar-row",
  "smith-row",
  "inv",
  "chest-supported-1db",
  "meadows-row",
  "pendlay-row"
 ],
 "sq": [
  "smith-squat",
  "fsq",
  "hack-squat",
  "lp",
  "gsq",
  "bwsq",
  "bss",
  "smith-split-squat",
  "lun",
  "mk-dumbbell-step-up-low"
 ],
 "fsq": [
  "gsq",
  "smith-squat",
  "hack-squat",
  "sq",
  "lp",
  "bwsq",
  "bss",
  "smith-bss",
  "single-leg-press"
 ],
 "lp": [
  "hack-squat",
  "single-leg-press",
  "smith-squat",
  "sq",
  "fsq",
  "gsq",
  "bwsq",
  "mk-dumbbell-step-up-low"
 ],
 "rdl": [
  "smith-rdl",
  "mk-dumbbell-stiff-leg-deadlift",
  "sl-rdl",
  "mk-barbell-deadlift",
  "reverse-hyper",
  "kettlebell-swing"
 ],
 "lun": [
  "reverse-lunge",
  "reverse-lunge-supported",
  "smith-split-squat",
  "bss",
  "smith-bss",
  "mk-dumbbell-step-up-low",
  "single-leg-press",
  "pistol-squat"
 ],
 "bss": [
  "smith-bss",
  "smith-split-squat",
  "reverse-lunge",
  "lun",
  "mk-dumbbell-step-up-low",
  "single-leg-press",
  "reverse-lunge-supported",
  "pistol-squat"
 ],
 "le": [
  "lp",
  "hack-squat",
  "fsq",
  "single-leg-press"
 ],
 "lc": [
  "lc-seated",
  "standing-single-leg-curl",
  "nlc"
 ],
 "lc-seated": [
  "lc",
  "standing-single-leg-curl",
  "nlc"
 ],
 "ht": [
  "smith-hip-thrust",
  "sglb",
  "reverse-hyper",
  "mk-dumbbell-stiff-leg-deadlift",
  "rdl",
  "smith-rdl",
  "kettlebell-swing"
 ],
 "mk-standing-calf-raise-machine": [
  "smith-calf",
  "seated-calf"
 ],
 "gsq": [
  "fsq",
  "bwsq",
  "sq",
  "smith-squat",
  "hack-squat",
  "lp",
  "bss",
  "lun",
  "reverse-lunge",
  "mk-dumbbell-step-up-low"
 ],
 "bwsq": [
  "gsq",
  "smith-squat",
  "sq",
  "fsq",
  "lp",
  "hack-squat",
  "reverse-lunge",
  "mk-dumbbell-step-up-low",
  "bss",
  "lun",
  "pistol-squat"
 ],
 "mk-dumbbell-step-up-low": [
  "reverse-lunge",
  "lun",
  "bss",
  "smith-bss",
  "reverse-lunge-supported",
  "smith-split-squat",
  "single-leg-press",
  "pistol-squat"
 ],
 "box-jump": [
  "jump-squat",
  "broad-jump"
 ],
 "mk-dumbbell-stiff-leg-deadlift": [
  "rdl",
  "smith-rdl",
  "sl-rdl",
  "mk-barbell-deadlift",
  "reverse-hyper",
  "kettlebell-swing"
 ],
 "nlc": [
  "lc",
  "lc-seated",
  "standing-single-leg-curl"
 ],
 "sglb": [
  "ht",
  "smith-hip-thrust",
  "sl-rdl",
  "reverse-hyper",
  "mk-dumbbell-stiff-leg-deadlift",
  "rdl",
  "smith-rdl"
 ],
 "reverse-lunge": [
  "lun",
  "reverse-lunge-supported",
  "smith-split-squat",
  "bss",
  "smith-bss",
  "mk-dumbbell-step-up-low",
  "single-leg-press",
  "pistol-squat"
 ],
 "reverse-lunge-supported": [
  "reverse-lunge",
  "smith-split-squat",
  "lun",
  "mk-dumbbell-step-up-low",
  "smith-bss",
  "bss",
  "single-leg-press"
 ],
 "single-leg-press": [
  "lp",
  "smith-bss",
  "bss",
  "smith-split-squat",
  "mk-dumbbell-step-up-low",
  "reverse-lunge",
  "lun",
  "reverse-lunge-supported",
  "hack-squat",
  "pistol-squat"
 ],
 "seated-calf": [
  "mk-standing-calf-raise-machine",
  "smith-calf"
 ],
 "ohp": [
  "standing-db-press",
  "dsp",
  "smith-seated-press",
  "push-press",
  "landmine-press",
  "ppu"
 ],
 "dsp": [
  "standing-db-press",
  "smith-seated-press",
  "ohp",
  "landmine-press",
  "ppu",
  "push-press"
 ],
 "lr": [
  "single-arm-cable-lateral",
  "mk-barbell-upright-row",
  "smith-upright-row"
 ],
 "mk-dumbbell-rear-delt-fly": [
  "reverse-pec-deck",
  "mk-cable-seated-rope-face-pull",
  "mk-prone-y-t-raises"
 ],
 "mk-cable-seated-rope-face-pull": [
  "mk-dumbbell-rear-delt-fly",
  "reverse-pec-deck",
  "mk-prone-y-t-raises"
 ],
 "mk-barbell-upright-row": [
  "smith-upright-row",
  "lr",
  "single-arm-cable-lateral"
 ],
 "ppu": [
  "dsp",
  "standing-db-press",
  "ohp",
  "smith-seated-press",
  "landmine-press",
  "push-press"
 ],
 "mk-prone-y-t-raises": [
  "mk-dumbbell-rear-delt-fly",
  "reverse-pec-deck",
  "mk-cable-seated-rope-face-pull",
  "wall-slide"
 ],
 "standing-db-press": [
  "dsp",
  "ohp",
  "smith-seated-press",
  "landmine-press",
  "push-press",
  "ppu"
 ],
 "bc": [
  "dbc",
  "mk-ez-bar-preacher-curl",
  "incline-db-curl",
  "concentration-curl",
  "hc"
 ],
 "dbc": [
  "bc",
  "incline-db-curl",
  "concentration-curl",
  "mk-ez-bar-preacher-curl",
  "hc"
 ],
 "hc": [
  "dbc",
  "bc",
  "concentration-curl",
  "mk-ez-bar-preacher-curl",
  "incline-db-curl"
 ],
 "mk-ez-bar-preacher-curl": [
  "concentration-curl",
  "bc",
  "dbc",
  "incline-db-curl",
  "hc"
 ],
 "chin": [
  "close-pulldown",
  "pull",
  "assisted-pullup",
  "negative-pullup",
  "lat",
  "straight-arm-pulldown",
  "cr",
  "dbr",
  "row",
  "chest-supported-2db",
  "tbar-row",
  "smith-row",
  "inv",
  "chest-supported-1db",
  "meadows-row",
  "pendlay-row"
 ],
 "cgb": [
  "smith-close-grip",
  "mk-diamond-push-ups",
  "mk-parralel-bar-dips",
  "bd",
  "mk-cable-bar-pushdown",
  "tpd-rope",
  "mk-ez-bar-skullcrusher",
  "mk-dumbbell-seated-overhead-tricep-extension",
  "cable-overhead-extension"
 ],
 "mk-cable-bar-pushdown": [
  "tpd-rope",
  "mk-ez-bar-skullcrusher",
  "cable-overhead-extension",
  "mk-dumbbell-seated-overhead-tricep-extension",
  "cgb",
  "smith-close-grip",
  "mk-diamond-push-ups",
  "bd"
 ],
 "tpd-rope": [
  "mk-cable-bar-pushdown",
  "cable-overhead-extension",
  "mk-ez-bar-skullcrusher",
  "mk-dumbbell-seated-overhead-tricep-extension",
  "cgb",
  "smith-close-grip",
  "mk-diamond-push-ups",
  "bd"
 ],
 "mk-ez-bar-skullcrusher": [
  "mk-dumbbell-seated-overhead-tricep-extension",
  "cable-overhead-extension",
  "mk-cable-bar-pushdown",
  "tpd-rope",
  "cgb",
  "smith-close-grip",
  "mk-diamond-push-ups",
  "bd"
 ],
 "mk-dumbbell-seated-overhead-tricep-extension": [
  "cable-overhead-extension",
  "mk-ez-bar-skullcrusher",
  "tpd-rope",
  "mk-cable-bar-pushdown",
  "cgb",
  "smith-close-grip",
  "mk-diamond-push-ups",
  "bd"
 ],
 "bd": [
  "mk-diamond-push-ups",
  "mk-parralel-bar-dips",
  "cgb",
  "smith-close-grip",
  "mk-cable-bar-pushdown",
  "tpd-rope",
  "mk-ez-bar-skullcrusher",
  "mk-dumbbell-seated-overhead-tricep-extension",
  "cable-overhead-extension"
 ],
 "mk-diamond-push-ups": [
  "cgb",
  "smith-close-grip",
  "bd",
  "mk-parralel-bar-dips",
  "mk-cable-bar-pushdown",
  "tpd-rope",
  "mk-ez-bar-skullcrusher",
  "mk-dumbbell-seated-overhead-tricep-extension",
  "cable-overhead-extension"
 ],
 "mk-front-plank": [
  "plank-advanced",
  "dbug",
  "mk-rkc-plank",
  "standing-ab-wheel"
 ],
 "mk-crunches": [
  "cru-machine",
  "cable-crunch"
 ],
 "cru-machine": [
  "cable-crunch",
  "mk-crunches"
 ],
 "mk-hanging-knee-raises": [
  "hanging-knee-raise"
 ],
 "mk-rkc-plank": [
  "plank-advanced",
  "mk-front-plank",
  "dbug",
  "standing-ab-wheel"
 ],
 "rt": [
  "woodchop"
 ],
 "dbug": [
  "mk-front-plank",
  "plank-advanced",
  "mk-rkc-plank"
 ],
 "bdog": [],
 "bpl": [
  "suitcase-carry",
  "pallof-press",
  "kb-windmill"
 ],
 "cable-crunch": [
  "cru-machine",
  "mk-crunches"
 ],
 "plank-advanced": [
  "mk-front-plank",
  "mk-rkc-plank",
  "dbug",
  "standing-ab-wheel"
 ],
 "mk-treadmill-run": [
  "mk-incline-treadmill-walk",
  "stair",
  "mk-elliptical",
  "mk-indoor-cycling-spin",
  "air-bike",
  "mk-rowing-machine-steady-state",
  "ski-erg",
  "jump-rope",
  "jump"
 ],
 "mk-indoor-cycling-spin": [
  "air-bike",
  "mk-elliptical",
  "stair",
  "mk-treadmill-run",
  "mk-incline-treadmill-walk",
  "mk-rowing-machine-steady-state",
  "ski-erg",
  "jump-rope",
  "jump"
 ],
 "mk-elliptical": [
  "air-bike",
  "mk-treadmill-run",
  "stair",
  "mk-incline-treadmill-walk",
  "mk-indoor-cycling-spin",
  "ski-erg",
  "mk-rowing-machine-steady-state",
  "jump-rope",
  "jump"
 ],
 "mk-rowing-machine-steady-state": [
  "ski-erg",
  "air-bike",
  "mk-elliptical",
  "mk-indoor-cycling-spin",
  "mk-treadmill-run",
  "mk-incline-treadmill-walk",
  "stair",
  "jump-rope",
  "jump"
 ],
 "stair": [
  "mk-treadmill-run",
  "mk-incline-treadmill-walk",
  "mk-elliptical",
  "mk-indoor-cycling-spin",
  "air-bike",
  "mk-rowing-machine-steady-state",
  "ski-erg",
  "jump-rope",
  "jump"
 ],
 "jump": [
  "jump-rope",
  "stair",
  "mk-treadmill-run",
  "mk-incline-treadmill-walk",
  "mk-elliptical",
  "mk-indoor-cycling-spin",
  "air-bike",
  "mk-rowing-machine-steady-state",
  "ski-erg"
 ],
 "mk-incline-treadmill-walk": [
  "mk-treadmill-run",
  "stair",
  "mk-elliptical",
  "mk-indoor-cycling-spin",
  "air-bike",
  "mk-rowing-machine-steady-state",
  "ski-erg",
  "jump-rope",
  "jump"
 ],
 "smith-bench": [
  "bp",
  "mch",
  "dbp",
  "decline-db-press",
  "pu",
  "band-chest-press",
  "smith-incline-bench",
  "ibp",
  "mch-incline",
  "idb",
  "mk-parralel-bar-dips"
 ],
 "smith-incline-bench": [
  "ibp",
  "mch-incline",
  "idb",
  "smith-bench",
  "bp",
  "mch",
  "dbp",
  "pu",
  "band-chest-press"
 ],
 "smith-close-grip": [
  "cgb",
  "mk-diamond-push-ups",
  "mk-parralel-bar-dips",
  "bd",
  "mk-cable-bar-pushdown",
  "tpd-rope",
  "mk-ez-bar-skullcrusher",
  "mk-dumbbell-seated-overhead-tricep-extension",
  "cable-overhead-extension"
 ],
 "smith-seated-press": [
  "dsp",
  "ohp",
  "standing-db-press",
  "landmine-press",
  "ppu",
  "push-press"
 ],
 "smith-upright-row": [
  "mk-barbell-upright-row",
  "lr",
  "single-arm-cable-lateral"
 ],
 "smith-squat": [
  "sq",
  "hack-squat",
  "fsq",
  "lp",
  "gsq",
  "bwsq",
  "smith-split-squat",
  "smith-bss"
 ],
 "smith-split-squat": [
  "smith-bss",
  "bss",
  "reverse-lunge-supported",
  "reverse-lunge",
  "lun",
  "single-leg-press",
  "mk-dumbbell-step-up-low"
 ],
 "smith-bss": [
  "bss",
  "smith-split-squat",
  "reverse-lunge-supported",
  "reverse-lunge",
  "lun",
  "single-leg-press",
  "mk-dumbbell-step-up-low"
 ],
 "smith-rdl": [
  "rdl",
  "mk-dumbbell-stiff-leg-deadlift",
  "sl-rdl",
  "mk-barbell-deadlift",
  "reverse-hyper",
  "kettlebell-swing"
 ],
 "smith-hip-thrust": [
  "ht",
  "sglb",
  "reverse-hyper",
  "rdl",
  "mk-dumbbell-stiff-leg-deadlift",
  "smith-rdl",
  "kettlebell-swing"
 ],
 "smith-calf": [
  "mk-standing-calf-raise-machine",
  "seated-calf"
 ],
 "smith-row": [
  "row",
  "pendlay-row",
  "tbar-row",
  "chest-supported-2db",
  "cr",
  "dbr",
  "meadows-row",
  "chest-supported-1db",
  "inv"
 ],
 "smith-shrug": [
  "mk-dumbbell-shrug",
  "farmers-walk"
 ],
 "hack-squat": [
  "lp",
  "smith-squat",
  "fsq",
  "sq",
  "single-leg-press",
  "gsq",
  "bwsq"
 ],
 "hip-abduction": [],
 "hip-adduction": [
  "copenhagen-plank"
 ],
 "reverse-hyper": [
  "mk-dumbbell-stiff-leg-deadlift",
  "rdl",
  "smith-rdl",
  "sl-rdl",
  "ht",
  "smith-hip-thrust",
  "sglb",
  "kettlebell-swing",
  "mk-barbell-deadlift",
  "hyp"
 ],
 "standing-single-leg-curl": [
  "lc",
  "lc-seated",
  "nlc"
 ],
 "decline-db-press": [
  "dbp",
  "bp",
  "smith-bench",
  "mch",
  "mk-parralel-bar-dips",
  "pu",
  "band-chest-press",
  "idb",
  "ibp",
  "mch-incline",
  "smith-incline-bench"
 ],
 "incline-db-fly": [
  "fly",
  "mk-cable-pec-fly",
  "pec-deck"
 ],
 "straight-arm-pulldown": [
  "close-pulldown",
  "lat",
  "assisted-pullup",
  "pull",
  "chin",
  "negative-pullup"
 ],
 "meadows-row": [
  "dbr",
  "chest-supported-1db",
  "tbar-row",
  "row",
  "chest-supported-2db",
  "smith-row",
  "pendlay-row",
  "cr",
  "inv"
 ],
 "pendlay-row": [
  "row",
  "smith-row",
  "tbar-row",
  "chest-supported-2db",
  "dbr",
  "meadows-row",
  "cr",
  "chest-supported-1db",
  "inv"
 ],
 "reverse-pec-deck": [
  "mk-dumbbell-rear-delt-fly",
  "mk-cable-seated-rope-face-pull",
  "mk-prone-y-t-raises"
 ],
 "single-arm-cable-lateral": [
  "lr",
  "mk-barbell-upright-row",
  "smith-upright-row"
 ],
 "cable-external-rotation": [
  "cable-external-rotation-90",
  "cuban-press"
 ],
 "incline-db-curl": [
  "dbc",
  "bc",
  "concentration-curl",
  "mk-ez-bar-preacher-curl",
  "hc"
 ],
 "concentration-curl": [
  "mk-ez-bar-preacher-curl",
  "dbc",
  "incline-db-curl",
  "bc",
  "hc"
 ],
 "cable-overhead-extension": [
  "mk-dumbbell-seated-overhead-tricep-extension",
  "mk-ez-bar-skullcrusher",
  "tpd-rope",
  "mk-cable-bar-pushdown",
  "cgb",
  "smith-close-grip",
  "mk-diamond-push-ups",
  "bd"
 ],
 "wrist-curl": [],
 "reverse-wrist-curl": [],
 "pallof-press": [
  "bpl",
  "suitcase-carry"
 ],
 "standing-ab-wheel": [
  "mk-rkc-plank",
  "plank-advanced",
  "mk-front-plank",
  "dbug"
 ],
 "farmers-walk": [
  "suitcase-carry",
  "mk-dumbbell-shrug",
  "smith-shrug",
  "dead-hang",
  "plate-pinch"
 ],
 "suitcase-carry": [
  "bpl",
  "pallof-press",
  "kb-windmill",
  "farmers-walk"
 ],
 "kettlebell-swing": [
  "mk-dumbbell-stiff-leg-deadlift",
  "rdl",
  "smith-rdl",
  "reverse-hyper",
  "sl-rdl",
  "mk-barbell-deadlift"
 ],
 "sled-push": [
  "mk-dumbbell-step-up-low",
  "lun",
  "reverse-lunge"
 ],
 "assisted-pullup": [
  "lat",
  "negative-pullup",
  "close-pulldown",
  "pull",
  "chin",
  "straight-arm-pulldown",
  "cr",
  "dbr",
  "row",
  "chest-supported-2db",
  "tbar-row",
  "smith-row",
  "inv",
  "chest-supported-1db",
  "meadows-row",
  "pendlay-row"
 ],
 "negative-pullup": [
  "assisted-pullup",
  "pull",
  "lat",
  "close-pulldown",
  "chin",
  "straight-arm-pulldown",
  "cr",
  "dbr",
  "row",
  "chest-supported-2db",
  "tbar-row",
  "smith-row",
  "inv",
  "chest-supported-1db",
  "meadows-row",
  "pendlay-row"
 ],
 "dead-hang": [
  "farmers-walk",
  "plate-pinch"
 ],
 "stretch-hip-flexor": [],
 "stretch-chest-doorway": [],
 "stretch-hamstring": [],
 "stretch-glute-figure4": [],
 "stretch-calf": [],
 "tibialis-raise": [],
 "neck-retraction": [],
 "neck-flexion-extension": [],
 "cable-internal-rotation": [],
 "cable-external-rotation-90": [
  "cable-external-rotation",
  "cuban-press"
 ],
 "hanging-knee-raise": [
  "mk-hanging-knee-raises"
 ],
 "sl-rdl": [
  "mk-dumbbell-stiff-leg-deadlift",
  "rdl",
  "smith-rdl",
  "reverse-hyper",
  "mk-barbell-deadlift",
  "kettlebell-swing"
 ],
 "copenhagen-plank": [
  "hip-adduction"
 ],
 "wall-slide": [
  "mk-prone-y-t-raises"
 ],
 "jump-rope": [
  "jump",
  "stair",
  "mk-treadmill-run",
  "mk-incline-treadmill-walk",
  "mk-elliptical",
  "mk-indoor-cycling-spin",
  "air-bike",
  "mk-rowing-machine-steady-state",
  "ski-erg"
 ],
 "jump-squat": [
  "box-jump",
  "broad-jump"
 ],
 "woodchop": [
  "rt"
 ],
 "landmine-press": [
  "standing-db-press",
  "dsp",
  "ohp",
  "smith-seated-press",
  "ppu",
  "push-press",
  "idb",
  "ibp"
 ],
 "turkish-getup": [],
 "med-ball-slam": [],
 "band-chest-press": [
  "pu",
  "mch",
  "dbp",
  "bp",
  "smith-bench",
  "decline-db-press",
  "idb",
  "mch-incline",
  "ibp",
  "smith-incline-bench",
  "mk-parralel-bar-dips"
 ],
 "pistol-squat": [
  "bss",
  "smith-bss",
  "mk-dumbbell-step-up-low",
  "reverse-lunge",
  "lun",
  "single-leg-press",
  "smith-split-squat",
  "reverse-lunge-supported"
 ],
 "push-press": [
  "ohp",
  "standing-db-press",
  "dsp",
  "smith-seated-press",
  "landmine-press",
  "ppu"
 ],
 "broad-jump": [
  "box-jump",
  "jump-squat"
 ],
 "air-bike": [
  "mk-indoor-cycling-spin",
  "mk-elliptical",
  "mk-rowing-machine-steady-state",
  "ski-erg",
  "mk-treadmill-run",
  "mk-incline-treadmill-walk",
  "stair",
  "jump-rope",
  "jump"
 ],
 "ski-erg": [
  "mk-rowing-machine-steady-state",
  "air-bike",
  "mk-elliptical",
  "mk-treadmill-run",
  "mk-incline-treadmill-walk",
  "stair",
  "mk-indoor-cycling-spin",
  "jump-rope",
  "jump"
 ],
 "kb-windmill": [
  "suitcase-carry",
  "bpl"
 ],
 "plate-pinch": [
  "farmers-walk",
  "dead-hang"
 ],
 "cuban-press": [
  "cable-external-rotation-90",
  "cable-external-rotation"
 ]
};
