# Changelog

## Unreleased — not a release, not deployed

Production `https://eduardsbor.github.io/gym-app/` is unchanged. Cache names stay `moyzal-v29` (shell) and `moyzal-anim3d-v7` (clips and posters). No exercise, animation, technique, reference, or billing change.

### Fixed

- A clip or poster that was already watched no longer stays stale after the file at the same URL is replaced.
- While online, the service worker revalidates that one URL (ETag, or Last-Modified when there is no ETag) and then responds. An unchanged file is a 304 and is not downloaded again. A changed file replaces the cached copy on that request.
- Offline, a network error, HTTP 5xx / 408 / 429, an upstream 206, a stalled revalidation (8 seconds), or a 200 whose body length does not match `Content-Length` keeps the last complete cached file, including HTTP Range playback.
- The worker still does not download the library ahead of time. Only a URL the app actually requests can enter the clip cache.

### Why the cache names did not change

Wiping `moyzal-anim3d-v7` on activate would delete every watched clip, including clips that were not replaced, and offline playback would fail until each one was opened online again. A filename version (`id.v2.mp4`) would also miss a same-URL replacement and would point an updated shell at a file that is not cached yet. Revalidation fixes the same-URL case and leaves the watched files in place.
