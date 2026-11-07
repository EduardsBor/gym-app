const C = 'moyzal-v29';
const A3 = 'moyzal-anim3d-v7';
const REVALIDATE_BUDGET_MS = 8000;
const F = ['./','index.html','style.css','app.js','tech.js','lib.js','features.js','legal.js','i18n/i18n.js','i18n/dict.js','i18n/dict2.js','i18n/dict3.js','i18n/apply.js','warm.js','supabase-config.js','vendor/supabase.js','sync.js','i18n/lib.en.js','i18n/lib.lv.js','i18n/tech.en.js','i18n/tech.lv.js','manifest.json','icon.svg','icon-192.png','icon-512.png'];
// A3 is intentionally not bumped. Watched clips stay in this cache so offline
// playback survives the worker update. Same-URL replacements are picked up by
// revalidation below, and only for URLs the user actually requests.
const inflight = new Map();

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(C).then(c => c.addAll(F.map(u => new Request(u, {cache:'reload'})))));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C && x !== A3).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).pathname.includes('/anim3d/')) { e.respondWith(anim(e.request)); return; }
  e.respondWith(shell(e.request));
});

async function shell(q) {
  try {
    const r = await fetch(q, {cache:'no-store'});
    if (r.ok) { const c = r.clone(); caches.open(C).then(x => x.put(q, c)).catch(() => {}); }
    return r;
  } catch (e) {
    return caches.match(q, {ignoreSearch:true}).then(m => m || caches.match('index.html'));
  }
}

// Online: one conditional GET of the full file (not the media element's Range),
// then answer from the fresh bytes. Unchanged files come back as 304 and are
// not downloaded again. Offline, a stall longer than REVALIDATE_BUDGET_MS, an
// HTTP 5xx / 408 / 429, an upstream 206, or a 200 whose body length does not
// match Content-Length keeps the last complete cached file. Nothing here
// prefetches the library. GitHub Pages Cache-Control max-age=600 can still
// delay the new bytes at the edge; this worker does not add another hold.
async function anim(q) {
  const u = q.url.split('#')[0];
  if (!inflight.has(u)) inflight.set(u, loadFull(u));
  let full;
  try { full = await inflight.get(u); } catch (e) { full = null; }
  if (!full || full.status !== 200) return full || new Response('', {status:504});
  return withRange(q, full);
}
async function loadFull(u) {
  try {
    const cache = await caches.open(A3), cached = await cache.match(u);
    return await revalidate(u, cache, cached);
  } finally { inflight.delete(u); }
}
async function revalidate(u, cache, cached) {
  const headers = new Headers();
  if (cached) {
    const etag = cached.headers.get('etag'), lm = cached.headers.get('last-modified');
    if (etag) headers.set('If-None-Match', etag);
    if (lm) headers.set('If-Modified-Since', lm);
  }
  headers.set('Cache-Control', 'no-cache');
  const ctrl = new AbortController();
  const budget = cached ? setTimeout(() => ctrl.abort(), REVALIDATE_BUDGET_MS) : 0;
  let net;
  try {
    net = await fetch(u, {method:'GET', headers, cache:'no-store', redirect:'follow', signal:ctrl.signal});
  } catch (e) {
    return cached || null;
  } finally { if (budget) clearTimeout(budget); }
  if (net.status === 304 && cached) return cached;
  if (net.status === 200) {
    const stored = await storeComplete(cache, u, net);
    if (stored) return stored;
    return cached || null;
  }
  if (cached && (net.status === 206 || net.status === 408 || net.status === 429 || net.status >= 500)) return cached;
  return cached || net;
}
async function storeComplete(cache, u, net) {
  if (net.type === 'opaque' || net.headers.has('content-range')) return null;
  let buf;
  try { buf = await net.arrayBuffer(); } catch (e) { return null; }
  const declared = net.headers.get('content-length');
  if (declared !== null && Number(declared) !== buf.byteLength) return null;
  if (!buf.byteLength) return null;
  const headers = new Headers(net.headers);
  for (const n of ['content-encoding','content-length','transfer-encoding','content-range','set-cookie','vary','connection']) headers.delete(n);
  headers.set('Content-Length', String(buf.byteLength));
  headers.set('Accept-Ranges', 'bytes');
  const res = new Response(buf, {status:200, statusText:'OK', headers});
  try { await cache.put(u, res.clone()); } catch (e) {}
  return res;
}
async function withRange(q, res) {
  const h = q.headers.get('range');
  if (!h) return res.clone();
  const buf = await res.clone().arrayBuffer(), L = buf.byteLength, span = byteSpan(h, L);
  if (!span) return new Response(null, {status:416, headers:{'Content-Range':`bytes */${L}`}});
  const type = res.headers.get('content-type') || (q.url.split('?')[0].endsWith('.jpg') ? 'image/jpeg' : 'video/mp4');
  return new Response(buf.slice(span.start, span.end + 1), {status:206, headers:{
    'Content-Type':type,
    'Content-Range':`bytes ${span.start}-${span.end}/${L}`,
    'Content-Length':String(span.end - span.start + 1),
    'Accept-Ranges':'bytes'
  }});
}
function byteSpan(header, L) {
  const m = /^bytes=(\d*)-(\d*)$/i.exec(String(header).trim());
  if (!m || L <= 0) return null;
  const hasStart = m[1] !== '', hasEnd = m[2] !== '';
  if (!hasStart && !hasEnd) return null;
  if (!hasStart) {
    const suffix = Number(m[2]);
    if (!Number.isInteger(suffix) || suffix <= 0) return null;
    return {start:suffix >= L ? 0 : L - suffix, end:L - 1};
  }
  const start = Number(m[1]), end = hasEnd ? Number(m[2]) : L - 1;
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start >= L || start > end) return null;
  return {start, end:Math.min(end, L - 1)};
}
