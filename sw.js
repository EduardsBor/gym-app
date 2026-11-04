const C='moyzal-v18',F=['./','index.html','style.css','app.js','tech.js','lib.js','manifest.json','icon.svg','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(F.map(u=>new Request(u,{cache:'reload'})))))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!=='moyzal-anim3d-v2').map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;if(new URL(e.request.url).pathname.includes('/anim3d/')){e.respondWith(anim(e.request));return}e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{if(r.ok){const c=r.clone();caches.open(C).then(x=>x.put(e.request,c))}return r}).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(m=>m||caches.match('index.html'))))});
const A3='moyzal-anim3d-v2';
async function anim(q){const u=q.url.split('#')[0],c=await caches.open(A3);let r=await c.match(u);
if(!r){try{const n=await fetch(u);if(n.ok&&n.status===200){await c.put(u,n.clone());r=n}else return n}catch(x){return fetch(q)}}
const h=q.headers.get('range');if(!h)return r.clone();
const b=await r.clone().arrayBuffer(),m=/bytes=(\d*)-(\d*)/.exec(h)||[],L=b.byteLength;let a=m[1]?+m[1]:0,z=m[2]?+m[2]:L-1;if(!m[1]&&m[2]){a=L-+m[2];z=L-1}z=Math.min(z,L-1);
return new Response(b.slice(a,z+1),{status:206,headers:{'Content-Type':r.headers.get('Content-Type')||(u.endsWith('.jpg')?'image/jpeg':'video/mp4'),'Content-Range':`bytes ${a}-${z}/${L}`,'Content-Length':String(z-a+1),'Accept-Ranges':'bytes'}})}
