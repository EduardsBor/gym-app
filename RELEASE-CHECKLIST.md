# Release checklist

This branch is not a release. Production (https://eduardsbor.github.io/gym-app/) was not modified, and nothing here was merged, tagged, or deployed. Cache keys are still `moyzal-v29` and `moyzal-anim3d-v7`.

Do not mark a box passed unless that exact check was run. Headless desktop Chrome is not a phone. Mobile emulation would not count as a device test either, and it was not used.

## Tested here (2026-11-07, desktop Chrome headless, local fixture server)

- [x] Same-URL MP4 replacement reaches a client that already cached the old file, on the next online request (ETag).
- [x] Same-URL poster replacement, on the next online request.
- [x] Same-URL replacement when the only validator is Last-Modified.
- [x] Unchanged file is revalidated with `If-None-Match` and not downloaded as a new body (origin returned 304).
- [x] Overlapping requests for one URL share a single origin check.
- [x] Offline playback of the last complete watched MP4, including after the origin file changed again while offline.
- [x] Offline poster from cache.
- [x] Offline shell (`style.css`) and cached `sync.js`.
- [x] HTTP 500, truncated 200 (`Content-Length` longer than the body), and upstream 206 do not replace a good cached file.
- [x] Those bad responses are not stored when there was no cached file.
- [x] A stalled revalidation falls back to the cached file within the 8 second budget.
- [x] Range: `bytes=0-5`, open `bytes=12-`, suffix `bytes=-6`, an end past the file, unsatisfiable `416`, and a malformed Range. The worker asks the origin for the full file (no `Range` on that request).
- [x] Desktop Chrome media element: a real cached `bp.mp4` plays and seeks, then a same-URL swap to `dbp.mp4` plays. Not a phone, and not a technique review.
- [x] Activate keeps `moyzal-v29` and `moyzal-anim3d-v7`, drops other caches, and keeps the watched clip across a worker update.
- [x] Install does not put MP4s in the shell cache and does not prefetch the clip library.
- [x] `localStorage` key `gym` (workout log) is unchanged across install, offline playback, and worker update.
- [x] Source check: 80 catalog ids (51 + 17 + 12), matching `anim3d/*.mp4` and `*.jpg`, free-tier ids, `SLOT` ids, and warmup links. `sw.js` does not read `localStorage`.

Run: `npm test` (uses system Chrome via `puppeteer-core`; set `CHROME_PATH` if needed).

## Observed on production, read-only, before this branch (not a deploy test)

Fetched 2026-11-07 from https://eduardsbor.github.io/gym-app/sw.js. The live worker matched this repo before the change: cache name `moyzal-anim3d-v7`, cache-first, no revalidation. `anim3d/bp.mp4` and `bp.jpg` responded with `ETag`, `Last-Modified`, `Accept-Ranges`, and `Cache-Control: max-age=600`. `If-None-Match` and `If-Modified-Since` returned 304. `GET` with `Range: bytes=0-15` returned 206. `HEAD` with `Range` stayed 200, so Range behavior must be checked with GET.

That 10 minute edge cache is outside the service worker. After a future publish, a replaced file can stay stale at GitHub's edge until that `max-age` expires. This was not measured with a real file replacement, because nothing was published.

## Mandatory before any future release

- [ ] Real iPhone (Safari, installed or standalone): open a clip once, publish a same-URL replacement, open it online and see the new clip, then play that clip offline. Confirm an older watched clip that was not replaced still plays offline. Confirm workout history is still there.
- [ ] Real Android (Chrome): the same sequence.
- [ ] Desktop browsers are not a substitute for those two devices.

## Still untested (launch-readiness audit, 2026-11-07). Unknown is not a pass.

- [ ] Video full review 68/68 (audit: 15 pass, 52 revise, 1 conflict).
- [ ] Text vs v2 contradictions and variant questions (trainer decision). Do not treat this branch as resolving them.
- [ ] Approved `w_gm`, `w_glb`, `dbrdl` publishing. Not part of this branch.
- [ ] Square-clip framing.
- [ ] Safety review. Not a medical certification.
- [ ] Logging and monitoring.
- [ ] Supabase auth, RLS, sync conflicts, and account deletion on the server. No credentials were used and the production database was not touched.
- [ ] Privacy / GDPR behavior beyond the presence of the existing text.
- [ ] Billing. Premium is still a client-side flag. No payment was added or tested.
- [ ] App Store / Google Play listings.
