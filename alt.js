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
  "dip"
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
  "dip"
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
  "cc",
  "incline-db-fly"
 ],
 "cc": [
  "pec-deck",
  "fly",
  "incline-db-fly"
 ],
 "dip": [
  "decline-db-press",
  "dbp",
  "bp",
  "smith-bench",
  "mch",
  "pu",
  "cgb",
  "smith-close-grip",
  "dpu",
  "bd"
 ],
 "pu": [
  "band-chest-press",
  "dbp",
  "bp",
  "mch",
  "smith-bench",
  "decline-db-press",
  "dip",
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
  "dip"
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
  "cc",
  "fly",
  "incline-db-fly"
 ],
 "dl": [
  "rdl",
  "smith-rdl",
  "dbrdl",
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
  "dl"
 ],
 "shr": [
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
  "step"
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
  "step"
 ],
 "rdl": [
  "smith-rdl",
  "dbrdl",
  "sl-rdl",
  "dl",
  "reverse-hyper",
  "kettlebell-swing"
 ],
 "lun": [
  "reverse-lunge",
  "reverse-lunge-supported",
  "smith-split-squat",
  "bss",
  "smith-bss",
  "step",
  "single-leg-press",
  "pistol-squat"
 ],
 "bss": [
  "smith-bss",
  "smith-split-squat",
  "reverse-lunge",
  "lun",
  "step",
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
  "dbrdl",
  "rdl",
  "smith-rdl",
  "kettlebell-swing"
 ],
 "calf": [
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
  "step"
 ],
 "bwsq": [
  "gsq",
  "smith-squat",
  "sq",
  "fsq",
  "lp",
  "hack-squat",
  "reverse-lunge",
  "step",
  "bss",
  "lun",
  "pistol-squat"
 ],
 "step": [
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
 "dbrdl": [
  "rdl",
  "smith-rdl",
  "sl-rdl",
  "dl",
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
  "dbrdl",
  "rdl",
  "smith-rdl"
 ],
 "reverse-lunge": [
  "lun",
  "reverse-lunge-supported",
  "smith-split-squat",
  "bss",
  "smith-bss",
  "step",
  "single-leg-press",
  "pistol-squat"
 ],
 "reverse-lunge-supported": [
  "reverse-lunge",
  "smith-split-squat",
  "lun",
  "step",
  "smith-bss",
  "bss",
  "single-leg-press"
 ],
 "single-leg-press": [
  "lp",
  "smith-bss",
  "bss",
  "smith-split-squat",
  "step",
  "reverse-lunge",
  "lun",
  "reverse-lunge-supported",
  "hack-squat",
  "pistol-squat"
 ],
 "seated-calf": [
  "calf",
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
  "ur",
  "smith-upright-row"
 ],
 "rfly": [
  "reverse-pec-deck",
  "fp",
  "yr"
 ],
 "fp": [
  "rfly",
  "reverse-pec-deck",
  "yr"
 ],
 "ur": [
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
 "yr": [
  "rfly",
  "reverse-pec-deck",
  "fp",
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
  "pc",
  "incline-db-curl",
  "concentration-curl",
  "hc"
 ],
 "dbc": [
  "bc",
  "incline-db-curl",
  "concentration-curl",
  "pc",
  "hc"
 ],
 "hc": [
  "dbc",
  "bc",
  "concentration-curl",
  "pc",
  "incline-db-curl"
 ],
 "pc": [
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
  "dpu",
  "dip",
  "bd",
  "tpd",
  "tpd-rope",
  "skull",
  "ote",
  "cable-overhead-extension"
 ],
 "tpd": [
  "tpd-rope",
  "skull",
  "cable-overhead-extension",
  "ote",
  "cgb",
  "smith-close-grip",
  "dpu",
  "bd"
 ],
 "tpd-rope": [
  "tpd",
  "cable-overhead-extension",
  "skull",
  "ote",
  "cgb",
  "smith-close-grip",
  "dpu",
  "bd"
 ],
 "skull": [
  "ote",
  "cable-overhead-extension",
  "tpd",
  "tpd-rope",
  "cgb",
  "smith-close-grip",
  "dpu",
  "bd"
 ],
 "ote": [
  "cable-overhead-extension",
  "skull",
  "tpd-rope",
  "tpd",
  "cgb",
  "smith-close-grip",
  "dpu",
  "bd"
 ],
 "bd": [
  "dpu",
  "dip",
  "cgb",
  "smith-close-grip",
  "tpd",
  "tpd-rope",
  "skull",
  "ote",
  "cable-overhead-extension"
 ],
 "dpu": [
  "cgb",
  "smith-close-grip",
  "bd",
  "dip",
  "tpd",
  "tpd-rope",
  "skull",
  "ote",
  "cable-overhead-extension"
 ],
 "pl": [
  "plank-advanced",
  "dbug",
  "abw",
  "standing-ab-wheel"
 ],
 "cru": [
  "cru-machine",
  "cable-crunch"
 ],
 "cru-machine": [
  "cable-crunch",
  "cru"
 ],
 "hlr": [
  "hanging-knee-raise"
 ],
 "abw": [
  "plank-advanced",
  "pl",
  "dbug",
  "standing-ab-wheel"
 ],
 "rt": [
  "woodchop"
 ],
 "dbug": [
  "pl",
  "plank-advanced",
  "abw"
 ],
 "bdog": [],
 "bpl": [
  "suitcase-carry",
  "pallof-press",
  "kb-windmill"
 ],
 "cable-crunch": [
  "cru-machine",
  "cru"
 ],
 "plank-advanced": [
  "pl",
  "abw",
  "dbug",
  "standing-ab-wheel"
 ],
 "tm": [
  "wlk",
  "stair",
  "ell",
  "bike",
  "air-bike",
  "rowm",
  "ski-erg",
  "jump-rope",
  "jump"
 ],
 "bike": [
  "air-bike",
  "ell",
  "stair",
  "tm",
  "wlk",
  "rowm",
  "ski-erg",
  "jump-rope",
  "jump"
 ],
 "ell": [
  "air-bike",
  "tm",
  "stair",
  "wlk",
  "bike",
  "ski-erg",
  "rowm",
  "jump-rope",
  "jump"
 ],
 "rowm": [
  "ski-erg",
  "air-bike",
  "ell",
  "bike",
  "tm",
  "wlk",
  "stair",
  "jump-rope",
  "jump"
 ],
 "stair": [
  "tm",
  "wlk",
  "ell",
  "bike",
  "air-bike",
  "rowm",
  "ski-erg",
  "jump-rope",
  "jump"
 ],
 "jump": [
  "jump-rope",
  "stair",
  "tm",
  "wlk",
  "ell",
  "bike",
  "air-bike",
  "rowm",
  "ski-erg"
 ],
 "wlk": [
  "tm",
  "stair",
  "ell",
  "bike",
  "air-bike",
  "rowm",
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
  "dip"
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
  "dpu",
  "dip",
  "bd",
  "tpd",
  "tpd-rope",
  "skull",
  "ote",
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
  "ur",
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
  "step"
 ],
 "smith-bss": [
  "bss",
  "smith-split-squat",
  "reverse-lunge-supported",
  "reverse-lunge",
  "lun",
  "single-leg-press",
  "step"
 ],
 "smith-rdl": [
  "rdl",
  "dbrdl",
  "sl-rdl",
  "dl",
  "reverse-hyper",
  "kettlebell-swing"
 ],
 "smith-hip-thrust": [
  "ht",
  "sglb",
  "reverse-hyper",
  "rdl",
  "dbrdl",
  "smith-rdl",
  "kettlebell-swing"
 ],
 "smith-calf": [
  "calf",
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
  "shr",
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
  "dbrdl",
  "rdl",
  "smith-rdl",
  "sl-rdl",
  "ht",
  "smith-hip-thrust",
  "sglb",
  "kettlebell-swing",
  "dl",
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
  "dip",
  "pu",
  "band-chest-press",
  "idb",
  "ibp",
  "mch-incline",
  "smith-incline-bench"
 ],
 "incline-db-fly": [
  "fly",
  "cc",
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
  "rfly",
  "fp",
  "yr"
 ],
 "single-arm-cable-lateral": [
  "lr",
  "ur",
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
  "pc",
  "hc"
 ],
 "concentration-curl": [
  "pc",
  "dbc",
  "incline-db-curl",
  "bc",
  "hc"
 ],
 "cable-overhead-extension": [
  "ote",
  "skull",
  "tpd-rope",
  "tpd",
  "cgb",
  "smith-close-grip",
  "dpu",
  "bd"
 ],
 "wrist-curl": [],
 "reverse-wrist-curl": [],
 "pallof-press": [
  "bpl",
  "suitcase-carry"
 ],
 "standing-ab-wheel": [
  "abw",
  "plank-advanced",
  "pl",
  "dbug"
 ],
 "farmers-walk": [
  "suitcase-carry",
  "shr",
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
  "dbrdl",
  "rdl",
  "smith-rdl",
  "reverse-hyper",
  "sl-rdl",
  "dl"
 ],
 "sled-push": [
  "step",
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
  "hlr"
 ],
 "sl-rdl": [
  "dbrdl",
  "rdl",
  "smith-rdl",
  "reverse-hyper",
  "dl",
  "kettlebell-swing"
 ],
 "copenhagen-plank": [
  "hip-adduction"
 ],
 "wall-slide": [
  "yr"
 ],
 "jump-rope": [
  "jump",
  "stair",
  "tm",
  "wlk",
  "ell",
  "bike",
  "air-bike",
  "rowm",
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
  "dip"
 ],
 "pistol-squat": [
  "bss",
  "smith-bss",
  "step",
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
  "bike",
  "ell",
  "rowm",
  "ski-erg",
  "tm",
  "wlk",
  "stair",
  "jump-rope",
  "jump"
 ],
 "ski-erg": [
  "rowm",
  "air-bike",
  "ell",
  "tm",
  "wlk",
  "stair",
  "bike",
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
