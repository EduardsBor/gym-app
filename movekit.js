'use strict';
// Licensed MoveKit clips and posters. Exercise id -> clip file name in the private "movekit" bucket.
// File names only: never put a public URL, a signed URL, or media bytes in this file.
// A poster is posters/<clip-name>.jpg next to the clip. Signed URLs stay in memory until near expiry.
// After the first successful load the bytes are stored in Cache Storage under a stable key
// (movekit/<file> for a clip, movekit/posters/<name>.jpg for a poster), never under the signed URL.
// That copy is what plays, or what the card shows, offline or when signing fails.
// Posters in a long list are signed only once they are near the viewport, a few at a time.

const MOVEKIT = {
  "bp": "barbell-bench-press.mp4",
  "dbp": "dumbbell-bench-press.mp4",
  "ibp": "barbell-incline-bench-press.mp4",
  "idb": "dumbbell-incline-bench-press.mp4",
  "fly": "dumbbell-chest-fly.mp4",
  "pu": "push-up.mp4",
  "mch": "machine-chest-press.mp4",
  "mch-incline": "incline-machine-chest-press.mp4",
  "pec-deck": "machine-pec-fly.mp4",
  "pull": "pull-ups.mp4",
  "row": "barbell-bent-over-row.mp4",
  "dbr": "dumbbell-single-arm-row.mp4",
  "cr": "machine-seated-cable-row.mp4",
  "hyp": "back-extension.mp4",
  "inv": "inverted-row.mp4",
  "chest-supported-2db": "chest-supported-dumbbell-row.mp4",
  "tbar-row": "landmine-t-bar-rows.mp4",
  "sq": "barbell-squat.mp4",
  "lp": "machine-leg-press.mp4",
  "rdl": "barbell-romanian-deadlift.mp4",
  "lun": "dumbbell-alternating-forward-lunge.mp4",
  "bss": "bulgarian-split-squat.mp4",
  "le": "machine-leg-extension.mp4",
  "lc": "lying-leg-curl.mp4",
  "ht": "barbell-hip-thrust.mp4",
  "bwsq": "bodyweight-squat.mp4",
  "box-jump": "box-jump.mp4",
  "nlc": "nordic-hamstring-curl.mp4",
  "sglb": "single-leg-glute-bridge.mp4",
  "single-leg-press": "single-leg-press.mp4",
  "seated-calf": "seated-calf-raise.mp4",
  "ohp": "barbell-overhead-press.mp4",
  "dsp": "dumbbell-seated-overhead-press.mp4",
  "ppu": "pike-push-up.mp4",
  "standing-db-press": "standing-dumbbell-overhead-press.mp4",
  "bc": "barbell-curl.mp4",
  "dbc": "dumbbell-curl.mp4",
  "hc": "dumbbell-hammer-curl.mp4",
  "chin": "chin-ups.mp4",
  "cgb": "barbell-close-grip-bench-press.mp4",
  "bd": "bench-dips.mp4",
  "rt": "bodyweight-russian-twist.mp4",
  "dbug": "dead-bug.mp4",
  "bdog": "bird-dog.mp4",
  "bpl": "elbow-side-plank.mp4",
  "cable-crunch": "kneeling-cable-crunch.mp4",
  "stair": "stair-climber.mp4",
  "w_hip": "hip-circles.mp4",
  "w_legsw": "leg-swings.mp4",
  "w_glb": "glute-bridge.mp4",
  "w_scpull": "scapular-pull-up.mp4",
  "smith-bench": "smith-machine-bench-press.mp4",
  "smith-incline-bench": "smith-machine-incline-bench-press.mp4",
  "smith-close-grip": "smith-machine-close-grip-bench-press.mp4",
  "smith-seated-press": "smith-machine-seated-overhead-press.mp4",
  "smith-squat": "smith-machine-squat.mp4",
  "smith-calf": "smith-machine-calf-raise.mp4",
  "smith-row": "smith-machine-bent-over-row.mp4",
  "smith-shrug": "smith-machine-standing-shrugs.mp4",
  "hack-squat": "machine-hack-squat.mp4",
  "hip-abduction": "machine-hip-abduction.mp4",
  "hip-adduction": "machine-hip-adduction.mp4",
  "reverse-hyper": "reverse-hyperextension.mp4",
  "decline-db-press": "dumbbell-decline-bench-press.mp4",
  "incline-db-fly": "dumbbell-incline-chest-fly.mp4",
  "straight-arm-pulldown": "straight-arm-lat-pulldown.mp4",
  "meadows-row": "meadows-row.mp4",
  "pendlay-row": "pendlay-row.mp4",
  "reverse-pec-deck": "reverse-pec-deck.mp4",
  "single-arm-cable-lateral": "cable-low-single-arm-lateral-raise.mp4",
  "cable-external-rotation": "cable-external-rotation.mp4",
  "incline-db-curl": "dumbbell-incline-curl.mp4",
  "concentration-curl": "dumbbell-concentration-curl.mp4",
  "cable-overhead-extension": "cable-rope-overhead-tricep-extension.mp4",
  "pallof-press": "pallof-press.mp4",
  "suitcase-carry": "dumbbell-suitcase-carry.mp4",
  "kettlebell-swing": "kettlebell-swing.mp4",
  "sled-push": "sled-push.mp4",
  "worlds-greatest-stretch": "worlds-greatest-stretch.mp4",
  "lateral-lunge-bw": "bodyweight-alternating-lateral-lunge.mp4",
  "dead-hang": "dead-hang.mp4",
  "tibialis-raise": "tibialis-raise.mp4",
  "hanging-knee-raise": "hanging-knee-raises.mp4",
  "sl-rdl": "single-leg-dumbbell-romanian-deadlift.mp4",
  "copenhagen-plank": "copenhagen-plank.mp4",
  "jump-rope": "jump-rope.mp4",
  "jump-squat": "jump-squats.mp4",
  "landmine-press": "landmine-press.mp4",
  "turkish-getup": "turkish-get-up.mp4",
  "pistol-squat": "pistol-squat.mp4",
  "broad-jump": "broad-jump.mp4",
  "ski-erg": "ski-erg.mp4",
  "kb-windmill": "kettlebell-windmill.mp4",
  "plate-pinch": "plate-pinch.mp4",
  "cuban-press": "cuban-press.mp4",
  "lat": "lat-pulldown.mp4",
  "fsq": "front-squat.mp4",
  "lr": "dumbbell-lateral-raise.mp4",
  "jump": "jumping-jack.mp4",
  "gsq": "dumbbell-goblet-squat.mp4",
  "mk-rkc-plank": "rkc-plank.mp4",
  "mk-indoor-cycling-spin": "indoor-cycling-spin.mp4",
  "mk-standing-calf-raise-machine": "standing-calf-raise-machine.mp4",
  "mk-cable-pec-fly": "cable-pec-fly.mp4",
  "mk-crunches": "crunches.mp4",
  "mk-dumbbell-stiff-leg-deadlift": "dumbbell-stiff-leg-deadlift.mp4",
  "mk-parralel-bar-dips": "parralel-bar-dips.mp4",
  "mk-barbell-deadlift": "barbell-deadlift.mp4",
  "mk-diamond-push-ups": "diamond-push-ups.mp4",
  "mk-elliptical": "elliptical.mp4",
  "mk-cable-seated-rope-face-pull": "cable-seated-rope-face-pull.mp4",
  "mk-hanging-knee-raises": "hanging-knee-raises.mp4",
  "mk-dumbbell-seated-overhead-tricep-extension": "dumbbell-seated-overhead-tricep-extension.mp4",
  "mk-ez-bar-preacher-curl": "ez-bar-preacher-curl.mp4",
  "mk-front-plank": "front-plank.mp4",
  "mk-dumbbell-rear-delt-fly": "dumbbell-rear-delt-fly.mp4",
  "mk-rowing-machine-steady-state": "rowing-machine-steady-state.mp4",
  "mk-dumbbell-shrug": "dumbbell-shrug.mp4",
  "mk-ez-bar-skullcrusher": "ez-bar-skullcrusher.mp4",
  "mk-dumbbell-step-up-low": "dumbbell-step-up-low.mp4",
  "mk-treadmill-run": "treadmill-run.mp4",
  "mk-cable-bar-pushdown": "cable-bar-pushdown.mp4",
  "mk-barbell-upright-row": "barbell-upright-row.mp4",
  "mk-arm-circles-front-back": "arm-circles-front-back.mp4",
  "mk-band-row": "band-row.mp4",
  "mk-cat-camel": "cat-camel.mp4",
  "mk-broomstick-pass-throughs": "broomstick-pass-throughs.mp4",
  "mk-hip-hinge-drill": "hip-hinge-drill.mp4",
  "mk-walking-knee-hugs": "walking-knee-hugs.mp4",
  "mk-band-high-face-pull": "band-high-face-pull.mp4",
  "mk-incline-treadmill-walk": "incline-treadmill-walk.mp4",
  "mk-prone-y-t-raises": "prone-y-t-raises.mp4",
  // v1.2c (D-214, 14.11.2026): 22 new clips in the private bucket + existing clips for new place ids.
  "adductor-stretch": "adductor-groin-stretch.mp4",
  "ankle-circles": "seated-ankle-circles.mp4",
  "assisted-pullup": "machine-assisted-pull-up.mp4",
  "band-pulldown": "band-kneeling-pulldown.mp4",
  "calf-bw": "single-leg-standing-calf-raise.mp4",
  "calf-db": "dumbbell-single-leg-calf-raise.mp4",
  "chest-wall-stretch": "standing-wall-shoulder-opening-stretch.mp4",
  "hamstring-sweep": "romanian-deadlift-hamstring-sweeps.mp4",
  "hip-90-90": "90-90-hip-switches.mp4",
  "hip-flexor-rock": "half-kneeling-hip-flexor-rock.mp4",
  "ht-bw": "glute-bridge.mp4",
  "ht-db": "glute-bridge.mp4",
  "lc-seated": "seated-leg-curl.mp4",
  "open-book": "open-book-rotation.mp4",
  "rdl-band": "band-romanian-deadlift.mp4",
  "rdl-db": "kickstand-dumbbell-romanian-deadlift.mp4",
  "rdl-kb": "kettlebell-romanian-deadlift.mp4",
  "reverse-lunge": "bodyweight-reverse-lunge.mp4",
  "reverse-lunge-db": "dumbbell-reverse-lunge.mp4",
  "scap-pullup": "scapular-pull-up.mp4",
  "shoulder-rolls": "seated-shoulder-rolls-scapular-retraction.mp4",
  "skull-db": "dumbbell-skullcrusher.mp4",
  "step-bw": "single-leg-step-down.mp4",
  "thoracic-rotation": "quadruped-thoracic-rotation.mp4",
  "wrist-flexor-stretch": "seated-wrist-flexor-stretch.mp4"
};
const MK_CACHE = 'moyzal-movekit-v1';
const MK_TTL_MS = 3600 * 1000;
const MK_SKEW_MS = 120 * 1000;
const mkMem = new Map();
const mkSign = new Map();
const mkSave = new Map();

function movekitFile(id) {
  const f = MOVEKIT[id];
  return typeof f === 'string' && /^[a-z0-9.-]+\.mp4$/.test(f) ? f : '';
}

function movekitCacheUrl(file) {
  const base = (typeof document !== 'undefined' && document.baseURI) || (typeof location !== 'undefined' && location.href);
  if (!base) throw new Error('movekit cache');
  return new URL('movekit/' + file, base).href;
}

function movekitCfg() {
  const cfg = (typeof window !== 'undefined' && window.MZ_SB) || {};
  return { url: String(cfg.url || '').replace(/\/$/, ''), anon: String(cfg.anon || '') };
}

function movekitVideoBlob(blob) {
  if (blob && blob.type === 'video/mp4') return blob;
  return new Blob([blob], { type: 'video/mp4' });
}


// Подпись ссылки: сначала серверная функция movekit-sign (без анонимного доступа к списку бакета),
// если функция ещё не развёрнута (404) — прежняя прямая подпись. После sql/002 прямая подпись перестанет работать.
const MK_FN_RETRY_MS = 5 * 60 * 1000;
let mkFnOffUntil = 0;
async function movekitSignPath(objectPath) {
  const cfg = movekitCfg();
  if (!cfg.url || !cfg.anon) throw new Error('movekit config');
  const headers = { apikey: cfg.anon, Authorization: 'Bearer ' + cfg.anon, 'Content-Type': 'application/json' };
  let res = null;
  if (Date.now() >= mkFnOffUntil) {
    try {
      res = await fetch(cfg.url + '/functions/v1/movekit-sign', { method: 'POST', headers, body: JSON.stringify({ path: objectPath }) });
    } catch (e) { res = null; }
    if (res && res.ok) {
      const d = await res.json();
      if (d && typeof d.signedUrl === 'string') return d.signedUrl;
    }
    if (res && res.status !== 404) throw new Error('movekit sign ' + res.status);
    // Функции нет (404 или сетевой/CORS отказ): не повторяем запрос к ней для каждого файла 5 минут.
    mkFnOffUntil = Date.now() + MK_FN_RETRY_MS;
  }
  const direct = await fetch(cfg.url + '/storage/v1/object/sign/movekit/' + objectPath.split('/').map(encodeURIComponent).join('/'), {
    method: 'POST', headers, body: JSON.stringify({ expiresIn: 3600 })
  });
  if (!direct.ok) throw new Error('movekit sign ' + direct.status);
  const data = await direct.json();
  const path = data && (data.signedURL || data.signedUrl);
  if (!path || typeof path !== 'string') throw new Error('movekit sign empty');
  return /^https?:\/\//i.test(path) ? path : cfg.url + '/storage/v1' + (path.charAt(0) === '/' ? path : '/' + path);
}

async function requestMovekitUrl(file) {
  const full = await movekitSignPath(file);
  mkMem.set(file, { url: full, exp: Date.now() + MK_TTL_MS });
  return full;
}

async function movekitSignedUrl(id) {
  const file = movekitFile(id);
  if (!file) return null;
  const hit = mkMem.get(file);
  if (hit && hit.exp - MK_SKEW_MS > Date.now()) return hit.url;
  if (mkSign.has(file)) return mkSign.get(file);
  const pending = requestMovekitUrl(file);
  mkSign.set(file, pending);
  try {
    return await pending;
  } finally {
    if (mkSign.get(file) === pending) mkSign.delete(file);
  }
}

async function movekitCachedBlob(file) {
  if (typeof caches === 'undefined') return null;
  const cache = await caches.open(MK_CACHE);
  const res = await cache.match(movekitCacheUrl(file));
  if (!res) return null;
  const blob = await res.blob();
  return blob && blob.size ? blob : null;
}

function playMovekitBlob(video, blob) {
  const typed = movekitVideoBlob(blob);
  if (video.dataset.blob) {
    try { URL.revokeObjectURL(video.dataset.blob); } catch (e) {}
  }
  const url = URL.createObjectURL(typed);
  const token = video._mkToken;
  video.dataset.blob = url;
  video.dataset.mkSrc = 'cache';
  video.muted = true;
  video.playsInline = true;
  video.onerror = function () {
    video.onerror = null;
    if (video._mkToken !== token) return;
    if (typeof animFallback === 'function') animFallback(video, video.dataset.mk);
  };
  video.src = url;
  const p = video.play();
  if (p && p.catch) p.catch(function () {});
}

function stopMovekitVideo(video) {
  if (!video) return;
  video._mkToken = (video._mkToken || 0) + 1;
  video.onerror = null;
  try { video.pause(); } catch (e) {}
  if (video.dataset && video.dataset.blob) {
    try { URL.revokeObjectURL(video.dataset.blob); } catch (e) {}
    video.dataset.blob = '';
  }
  video.removeAttribute('src');
  try { video.load(); } catch (e) {}
}

function movekitPosterName(id) {
  const file = movekitFile(id);
  if (!file) return '';
  const name = file.slice(0, -4) + '.jpg';
  return /^[a-z0-9.-]+\.jpg$/.test(name) ? name : '';
}

function movekitPosterPath(id) {
  const name = movekitPosterName(id);
  return name ? 'posters/' + name : '';
}

function movekitImageBlob(blob) {
  if (blob && blob.type === 'image/jpeg') return blob;
  return new Blob([blob], { type: 'image/jpeg' });
}

function jpegBytes(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function posterObjectUrl(blob) {
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') return URL.createObjectURL(blob);
  return 'blob:poster';
}

function posterRevoke(url) {
  if (!url || typeof URL === 'undefined' || typeof URL.revokeObjectURL !== 'function') return;
  try { URL.revokeObjectURL(url); } catch (e) {}
}

const mkPosterUrls = new Map();
const MK_POSTER_LIMIT = 4;
let mkPosterActive = 0;
const mkPosterQueue = [];
let mkPosterIO = null;

function rememberPosterUrl(el, url) {
  const prev = mkPosterUrls.get(el);
  if (prev && prev !== url) posterRevoke(prev);
  mkPosterUrls.set(el, url);
}

function forgetPosterUrl(el) {
  const prev = mkPosterUrls.get(el);
  if (prev) posterRevoke(prev);
  mkPosterUrls.delete(el);
}

function sweepPosterUrls() {
  for (const el of mkPosterUrls.keys()) {
    if (el && el.isConnected === false) forgetPosterUrl(el);
  }
}

async function requestMovekitPosterUrl(name) {
  if (!/^[a-z0-9.-]+\.jpg$/.test(name)) throw new Error('movekit poster name');
  const objectPath = 'posters/' + name;
  const full = await movekitSignPath(objectPath);
  mkMem.set(objectPath, { url: full, exp: Date.now() + MK_TTL_MS });
  return full;
}

async function movekitPosterSignedUrl(id) {
  const name = movekitPosterName(id);
  if (!name) return null;
  const objectPath = 'posters/' + name;
  const hit = mkMem.get(objectPath);
  if (hit && hit.exp - MK_SKEW_MS > Date.now()) return hit.url;
  if (mkSign.has(objectPath)) return mkSign.get(objectPath);
  const pending = requestMovekitPosterUrl(name);
  mkSign.set(objectPath, pending);
  try {
    return await pending;
  } finally {
    if (mkSign.get(objectPath) === pending) mkSign.delete(objectPath);
  }
}

async function readPosterBlob(objectPath) {
  let blob = null;
  try { blob = await movekitCachedBlob(objectPath); } catch (e) { blob = null; }
  if (!blob) return null;
  try {
    const head = new Uint8Array(await blob.slice(0, 3).arrayBuffer());
    if (!jpegBytes(head)) return null;
  } catch (e) { return null; }
  return blob;
}

async function movekitStorePoster(objectPath, signed) {
  const key = 'poster:' + objectPath;
  if (mkSave.has(key)) return mkSave.get(key);
  const job = (async function () {
    const res = await fetch(signed, { referrerPolicy: 'no-referrer', cache: 'no-store' });
    if (!res.ok) throw new Error('movekit poster fetch ' + res.status);
    const buf = await res.arrayBuffer();
    if (!jpegBytes(buf)) throw new Error('movekit poster type');
    const typed = new Blob([buf], { type: 'image/jpeg' });
    if (typeof caches === 'undefined') return typed;
    const cache = await caches.open(MK_CACHE);
    await cache.put(movekitCacheUrl(objectPath), new Response(typed, {
      status: 200,
      headers: { 'Content-Type': 'image/jpeg' }
    }));
    return typed;
  })();
  mkSave.set(key, job);
  try {
    return await job;
  } finally {
    if (mkSave.get(key) === job) mkSave.delete(key);
  }
}

function posterFailed(el) {
  if (!el || !el.dataset) return;
  el.dataset.mkPosterState = 'fail';
  forgetPosterUrl(el);
  const wide = el.classList && el.classList.contains && el.classList.contains('mkwide');
  if (wide && typeof el.remove === 'function') el.remove();
}

function showMovekitPoster(el, blob) {
  const url = posterObjectUrl(movekitImageBlob(blob));
  rememberPosterUrl(el, url);
  if (String(el.tagName || '').toUpperCase() === 'VIDEO') {
    el.poster = url;
    el.dataset.mkPosterState = 'ok';
    return;
  }
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    const img = document.createElement('img');
    img.alt = '';
    img.decoding = 'async';
    if ('referrerPolicy' in img) img.referrerPolicy = 'no-referrer';
    img.onload = function () { if (el.dataset) el.dataset.mkPosterState = 'ok'; };
    img.onerror = function () {
      img.onerror = null;
      if (typeof img.remove === 'function') img.remove();
      posterFailed(el);
    };
    img.src = url;
    if (typeof el.replaceChildren === 'function') el.replaceChildren(img);
    else if (typeof el.appendChild === 'function') el.appendChild(img);
    else {
      el.style = el.style || {};
      el.style.backgroundImage = 'url("' + url + '")';
      el.dataset.mkPosterState = 'ok';
    }
    return;
  }
  el.style = el.style || {};
  el.style.backgroundImage = 'url("' + url + '")';
  el.dataset.mkPosterState = 'ok';
}

async function loadMovekitPoster(el) {
  if (!el || !el.dataset) return;
  if (el.isConnected === false) return;
  const state = el.dataset.mkPosterState;
  if (state === 'ok' || state === 'fail' || state === 'pending') return;
  const id = el.dataset.mkPoster || el.dataset.mk || '';
  const objectPath = movekitPosterPath(id);
  if (!objectPath) { posterFailed(el); return; }
  el.dataset.mkPosterState = 'pending';
  const alive = function () { return el.isConnected !== false && el.dataset && el.dataset.mkPosterState === 'pending'; };
  let blob = await readPosterBlob(objectPath);
  if (!alive()) return;
  if (blob) { showMovekitPoster(el, blob); return; }
  let signed = null;
  try { signed = await movekitPosterSignedUrl(id); } catch (e) { signed = null; }
  if (!alive()) return;
  if (!signed) {
    blob = await readPosterBlob(objectPath);
    if (!alive()) return;
    if (blob) { showMovekitPoster(el, blob); return; }
    posterFailed(el);
    return;
  }
  try { blob = await movekitStorePoster(objectPath, signed); } catch (e) { blob = null; }
  if (!alive()) return;
  if (!blob) blob = await readPosterBlob(objectPath);
  if (!alive()) return;
  if (blob && blob.size) showMovekitPoster(el, blob);
  else posterFailed(el);
}

function enqueueMovekitPoster(el) {
  if (!el || !el.dataset || el.dataset.mkPosterQueued) return;
  const state = el.dataset.mkPosterState;
  if (state === 'ok' || state === 'fail' || state === 'pending') return;
  el.dataset.mkPosterQueued = '1';
  mkPosterQueue.push(el);
  pumpMovekitPosters();
}

function pumpMovekitPosters() {
  while (mkPosterActive < MK_POSTER_LIMIT && mkPosterQueue.length) {
    const el = mkPosterQueue.shift();
    if (!el || el.isConnected === false) continue;
    const state = el.dataset && el.dataset.mkPosterState;
    if (state === 'ok' || state === 'fail' || state === 'pending') continue;
    mkPosterActive++;
    Promise.resolve()
      .then(function () { return loadMovekitPoster(el); })
      .catch(function () { if (el.dataset && el.dataset.mkPosterState === 'pending') posterFailed(el); })
      .then(function () {
        mkPosterActive--;
        pumpMovekitPosters();
      });
  }
}

function watchMovekitPoster(el) {
  if (!el || !el.dataset || el.dataset.mkPosterWatch) return;
  el.dataset.mkPosterWatch = '1';
  if (el.dataset.mkPosterState === 'ok' || el.dataset.mkPosterState === 'fail') return;
  if (mkPosterIO) mkPosterIO.observe(el);
}

function mountMovekitPosters() {
  if (typeof document === 'undefined' || !document.body) return;
  if (typeof IntersectionObserver !== 'function' || typeof MutationObserver !== 'function' || typeof requestAnimationFrame !== 'function') return;
  mkPosterIO = new IntersectionObserver(function (entries) {
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (!entry.isIntersecting) continue;
      mkPosterIO.unobserve(entry.target);
      enqueueMovekitPoster(entry.target);
    }
  }, { root: null, rootMargin: '240px 0px', threshold: 0.01 });
  const scan = function () {
    sweepPosterUrls();
    const list = document.querySelectorAll('[data-mk-poster]');
    for (let i = 0; i < list.length; i++) watchMovekitPoster(list[i]);
  };
  let scheduled = false;
  const mo = new MutationObserver(function () {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () { scheduled = false; scan(); });
  });
  mo.observe(document.body, { childList: true, subtree: true });
  scan();
}

async function movekitStore(file, signed) {
  if (mkSave.has(file)) return mkSave.get(file);
  const job = (async function () {
    const res = await fetch(signed);
    if (!res.ok) throw new Error('movekit fetch ' + res.status);
    const blob = await res.blob();
    if (!blob || !blob.size) throw new Error('movekit empty');
    if (typeof caches === 'undefined') return;
    const cache = await caches.open(MK_CACHE);
    await cache.put(movekitCacheUrl(file), new Response(movekitVideoBlob(blob), {
      status: 200,
      headers: { 'Content-Type': 'video/mp4' }
    }));
  })();
  mkSave.set(file, job);
  try {
    await job;
  } finally {
    if (mkSave.get(file) === job) mkSave.delete(file);
  }
}

async function loadMovekit(video) {
  if (!video || !video.isConnected || !video.dataset || !video.dataset.mk) return;
  const id = video.dataset.mk;
  const file = movekitFile(id);
  const token = video._mkToken = (video._mkToken || 0) + 1;
  const alive = function () { return video.isConnected && video._mkToken === token; };
  await Promise.resolve();
  if (!alive()) return;
  if (!file) {
    if (typeof animFallback === 'function') animFallback(video, id);
    return;
  }
  loadMovekitPoster(video);
  let blob = null;
  try { blob = await movekitCachedBlob(file); } catch (e) { blob = null; }
  if (!alive()) return;
  if (blob) { playMovekitBlob(video, blob); return; }
  let signed = null;
  try { signed = await movekitSignedUrl(id); } catch (e) { signed = null; }
  if (!alive()) return;
  if (!signed) {
    try { blob = await movekitCachedBlob(file); } catch (e) { blob = null; }
    if (!alive()) return;
    if (blob) { playMovekitBlob(video, blob); return; }
    if (typeof animFallback === 'function') animFallback(video, id);
    return;
  }
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.referrerPolicy = 'no-referrer';
  video.dataset.mkSrc = 'signed';
  video.onerror = function () {
    video.onerror = null;
    movekitCachedBlob(file).then(function (cached) {
      if (!alive()) return;
      if (cached) playMovekitBlob(video, cached);
      else if (typeof animFallback === 'function') animFallback(video, id);
    }).catch(function () {
      if (alive() && typeof animFallback === 'function') animFallback(video, id);
    });
  };
  video.src = signed;
  const play = video.play();
  if (play && play.catch) play.catch(function () {});
  movekitStore(file, signed).catch(function () {});
}

mountMovekitPosters();
