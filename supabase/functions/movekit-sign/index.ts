// Выдаёт временную ссылку (1 час) на один ролик или постер MoveKit из закрытого бакета `movekit`.
// Только для вошедшего пользователя: JWT проверяет шлюз (verify_jwt=true) и сама функция через auth.getUser().
// Анонимный ключ недостаточен. Удалённый аккаунт (надгробие public.deleted_accounts) получает 403.
// Белый список имён — файлы, которые использует приложение; лимит частоты — на user.id.
//
// Развёртывание — только ПОСЛЕ того, как клиент из этого PR уже на сайте (иначе у текущих
// пользователей ролики перестанут открываться, потому что старый клиент шлёт anon в Authorization):
//   supabase functions deploy movekit-sign
// НЕ указывать --no-verify-jwt.
// В supabase/config.toml: [functions.movekit-sign] verify_jwt = true
// Ключи только из переменных окружения (Deno.env). В этом файле секретов нет.
import { createClient } from "jsr:@supabase/supabase-js@2";

const ORIGINS = new Set([
  "https://eduardsbor.github.io",
  "http://localhost:8767",
  "capacitor://localhost",
  "https://localhost",
]);
// Только файлы, которые использует приложение (ролик + постер с тем же именем).
const NAMES = new Set([
  "90-90-hip-switches",
  "adductor-groin-stretch",
  "arm-circles-front-back",
  "assault-bike",
  "back-extension",
  "backpack-row",
  "band-high-face-pull",
  "band-kneeling-pulldown",
  "band-romanian-deadlift",
  "band-row",
  "banded-ankle-dorsiflexion-mobilization",
  "barbell-bench-press",
  "barbell-bent-over-row",
  "barbell-close-grip-bench-press",
  "barbell-curl",
  "barbell-deadlift",
  "barbell-hip-thrust",
  "barbell-incline-bench-press",
  "barbell-overhead-press",
  "barbell-romanian-deadlift",
  "barbell-squat",
  "barbell-upright-row",
  "barbell-wrist-curl",
  "bench-dips",
  "bird-dog",
  "bodyweight-alternating-lateral-lunge",
  "bodyweight-reverse-lunge",
  "bodyweight-russian-twist",
  "bodyweight-squat",
  "box-jump",
  "broad-jump",
  "broomstick-pass-throughs",
  "bulgarian-split-squat",
  "cable-bar-pushdown",
  "cable-external-rotation",
  "cable-low-single-arm-lateral-raise",
  "cable-pec-fly",
  "cable-rope-overhead-tricep-extension",
  "cable-rope-pushdown",
  "cable-seated-rope-face-pull",
  "cable-wood-chopper",
  "cat-camel",
  "chest-supported-dumbbell-row",
  "chin-ups",
  "copenhagen-plank",
  "crunches",
  "cuban-press",
  "dead-bug",
  "dead-hang",
  "diamond-push-ups",
  "dumbbell-alternating-forward-lunge",
  "dumbbell-bench-press",
  "dumbbell-chest-fly",
  "dumbbell-concentration-curl",
  "dumbbell-curl",
  "dumbbell-decline-bench-press",
  "dumbbell-farmer-carry",
  "dumbbell-goblet-squat",
  "dumbbell-hammer-curl",
  "dumbbell-incline-bench-press",
  "dumbbell-incline-chest-fly",
  "dumbbell-incline-curl",
  "dumbbell-lateral-raise",
  "dumbbell-push-press",
  "dumbbell-rear-delt-fly",
  "dumbbell-reverse-lunge",
  "dumbbell-seated-overhead-press",
  "dumbbell-seated-overhead-tricep-extension",
  "dumbbell-shrug",
  "dumbbell-single-arm-row",
  "dumbbell-single-leg-calf-raise",
  "dumbbell-skullcrusher",
  "dumbbell-step-up-low",
  "dumbbell-stiff-leg-deadlift",
  "dumbbell-suitcase-carry",
  "dumbbell-wrist-curl",
  "dumbbell-wrist-extension",
  "elbow-side-plank",
  "elliptical",
  "ez-bar-preacher-curl",
  "ez-bar-skullcrusher",
  "front-plank",
  "front-squat",
  "glute-bridge",
  "half-kneeling-hip-flexor-rock",
  "hanging-knee-raises",
  "hip-circles",
  "hip-hinge-drill",
  "incline-machine-chest-press",
  "incline-treadmill-walk",
  "indoor-cycling-spin",
  "inverted-row",
  "jump-rope",
  "jump-squats",
  "jumping-jack",
  "kettlebell-romanian-deadlift",
  "kettlebell-swing",
  "kettlebell-windmill",
  "kickstand-dumbbell-romanian-deadlift",
  "kneeling-cable-crunch",
  "landmine-press",
  "landmine-t-bar-rows",
  "lat-pulldown",
  "leg-swings",
  "lying-leg-curl",
  "machine-assisted-pull-up",
  "machine-chest-press",
  "machine-crunch",
  "machine-hack-squat",
  "machine-hip-abduction",
  "machine-hip-adduction",
  "machine-leg-extension",
  "machine-leg-press",
  "machine-pec-fly",
  "machine-seated-cable-row",
  "meadows-row",
  "narrow-pulldown",
  "nordic-hamstring-curl",
  "open-book-rotation",
  "pallof-press",
  "parralel-bar-dips",
  "pendlay-row",
  "pike-push-up",
  "pistol-squat",
  "plate-pinch",
  "prone-y-t-raises",
  "pull-ups",
  "push-up",
  "quadruped-thoracic-rotation",
  "reverse-hyperextension",
  "reverse-pec-deck",
  "rkc-plank",
  "romanian-deadlift-hamstring-sweeps",
  "rowing-machine-steady-state",
  "scapular-pull-up",
  "seated-ankle-circles",
  "seated-calf-raise",
  "seated-chin-tuck-neck-retraction",
  "seated-leg-curl",
  "seated-shoulder-rolls-scapular-retraction",
  "seated-wrist-flexor-stretch",
  "single-leg-dumbbell-romanian-deadlift",
  "single-leg-glute-bridge",
  "single-leg-press",
  "single-leg-standing-calf-raise",
  "single-leg-step-down",
  "ski-erg",
  "sled-push",
  "smith-machine-bench-press",
  "smith-machine-bent-over-row",
  "smith-machine-calf-raise",
  "smith-machine-close-grip-bench-press",
  "smith-machine-incline-bench-press",
  "smith-machine-seated-overhead-press",
  "smith-machine-squat",
  "smith-machine-standing-shrugs",
  "stair-climber",
  "standing-calf-raise-machine",
  "standing-dumbbell-overhead-press",
  "standing-wall-shoulder-opening-stretch",
  "straight-arm-lat-pulldown",
  "supermans",
  "tibialis-raise",
  "towel-doorframe-row",
  "towel-isometric-curls",
  "towel-slide-leg-curl",
  "treadmill-run",
  "turkish-get-up",
  "walking-knee-hugs",
  "worlds-greatest-stretch",
]);
const PATH_RE = /^(posters\/)?([a-z0-9-]+)\.(mp4|jpg)$/;
function allowed(p: string) {
  const m = PATH_RE.exec(p);
  if (!m || !NAMES.has(m[2])) return false;
  return m[1] ? m[3] === "jpg" : m[3] === "mp4";
}
const LIMIT_PER_MIN = 400; // библиотека подписывает постеры порциями; ролики потом берутся из кэша
const hits = new Map<string, { n: number; t: number }>();

function cors(origin: string | null) {
  const allow = origin && ORIGINS.has(origin) ? origin : "https://eduardsbor.github.io";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function env(name: string) {
  const v = Deno.env.get(name);
  if (!v) throw new Error("missing env");
  return v;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const h = cors(origin);
  if (req.method === "OPTIONS") return new Response(null, { headers: h });
  if (req.method !== "POST") return new Response("method", { status: 405, headers: h });
  if (origin && !ORIGINS.has(origin)) return new Response("origin", { status: 403, headers: h });

  const auth = req.headers.get("Authorization") || "";
  const jwt = auth.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return new Response("auth", { status: 401, headers: h });

  let path: unknown;
  try { path = (await req.json()).path; } catch { path = null; }
  if (typeof path !== "string" || !allowed(path)) return new Response("bad path", { status: 400, headers: h });

  const url = env("SUPABASE_URL");
  const anon = env("SUPABASE_ANON_KEY");
  const service = env("SUPABASE_SERVICE_ROLE_KEY");

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: "Bearer " + jwt } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser(jwt);
  const user = userData && userData.user;
  if (userErr || !user || !user.id) return new Response("auth", { status: 401, headers: h });

  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: gone, error: goneErr } = await admin
    .from("deleted_accounts")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (goneErr) return new Response("tombstone", { status: 500, headers: h });
  if (gone) return new Response("deleted", { status: 403, headers: h });

  const now = Date.now();
  const rec = hits.get(user.id);
  if (!rec || now - rec.t > 60_000) hits.set(user.id, { n: 1, t: now });
  else if (++rec.n > LIMIT_PER_MIN) return new Response("rate", { status: 429, headers: h });

  const { data, error } = await admin.storage.from("movekit").createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) return new Response("not found", { status: 404, headers: h });
  return new Response(JSON.stringify({ signedUrl: data.signedUrl }), {
    headers: { ...h, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
});
