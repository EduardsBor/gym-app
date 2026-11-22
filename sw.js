importScripts('./cache-ver.js');
const C=SW_CACHE,F=['./','index.html','cache-ver.js','style.css','theme.js','alt.js','stats.js','app.js','health.js','tech.js','lib.js','nutrition.js','cards.js','premium.js','features.js','csv.js','legal.js','i18n/i18n.js','i18n/dict.js','i18n/dict2.js','i18n/dict3.js','i18n/apply.js','warm.js','cd.js','place.js','prog.js','plan.js','data/blocks-index.js','blocks.js','data/blocks/mass_nov_3_g_b36.json','supabase-config.js','movekit.js','progress.js','autow.js','exscreen.js','vendor/supabase.js','sync.js','notify.js','profile.js','i18n/lib.en.js','i18n/lib.lv.js','i18n/tech.en.js','i18n/tech.lv.js','manifest.json','icon.svg','icon-192.png','icon-512.png','icon-512-maskable.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(F.map(u=>new Request(u,{cache:'reload'})))))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!=='moyzal-movekit-v1').map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.hostname==='supabase.co'||u.hostname.endsWith('.supabase.co'))return;if(/\/(privacy|terms|auth-callback|delete-account)\.html$/.test(u.pathname))return;e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{if(r.ok){const c=r.clone();caches.open(C).then(x=>x.put(e.request,c))}return r}).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(m=>m||caches.match('index.html'))))});

self.addEventListener('message',e=>{
  const d=e.data||{};
  if(d.type!=='cache-block')return;
  const url=String(d.url||'');
  if(!/^data\/blocks\/[a-z0-9_]+\.json$/.test(url)&&!/^data\/blocks\/variants\/[a-z0-9_]+\.json$/.test(url))return;  // tech-fix-1: pilot variants
  const p=caches.open(C).then(c=>fetch(new Request(url,{cache:'reload'})).then(r=>{if(r.ok)return c.put(url,r)}));
  if(e.waitUntil)e.waitUntil(p);
});
