// Desktop Chrome, headless. This is not a phone test and does not emulate a device.
// Requires the system Chrome (CHROME_PATH overrides /usr/local/bin/google-chrome).
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer-core';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const swSrc=()=>fs.readFileSync(path.join(root,'sw.js'),'utf8');
const budget=Number(swSrc().match(/REVALIDATE_BUDGET_MS\s*=\s*(\d+)/)[1]);
function sumBuf(buf){let s=0; for(const b of buf) s=(s+b)>>>0; return s;}
const play1=fs.readFileSync(path.join(root,'anim3d/bp.mp4'));
const play2=fs.readFileSync(path.join(root,'anim3d/dbp.mp4'));
const GYM=JSON.stringify({v:2,workouts:[{id:'w-keep',start:1700000000000,items:[{exId:'bp',sets:[{w:40,r:8,done:true}]}]}],program:[{name:'Day',items:[{exId:'sq'}]}],body:[],custom:[]});

const state={
  rev:0,
  mode:'normal',
  delayMs:0,
  shellFail:false,
  hits:[],
  assets:{
    '/anim3d/bp.mp4':{type:'video/mp4',body:Buffer.from('VIDEO-OLD-aaaaaaaa'),etag:'"mp4-1"',lm:'Tue, 01 Jan 2026 00:00:00 GMT'},
    '/anim3d/bp.jpg':{type:'image/jpeg',body:Buffer.from('POSTER-OLD-aaaaaa'),etag:'"jpg-1"',lm:'Tue, 01 Jan 2026 00:00:00 GMT'},
    '/anim3d/lm.mp4':{type:'video/mp4',body:Buffer.from('LM-OLD-aaaaaaaaaa'),etag:null,lm:'Wed, 02 Jan 2026 00:00:00 GMT'},
    '/anim3d/play.mp4':{type:'video/mp4',body:play1,etag:'"play-1"',lm:'Tue, 01 Jan 2026 00:00:00 GMT'}
  }
};

function startServer(){
  const sockets=new Set();
  const server=http.createServer((req,res)=>{
    const url=new URL(req.url,'http://127.0.0.1');
    const pathname=decodeURIComponent(url.pathname);
    if(pathname==='/sw.js'){
      const body=Buffer.from(swSrc()+(state.rev?`\n// rev ${state.rev}\n`:''));
      res.writeHead(200,{'Content-Type':'application/javascript; charset=utf-8','Content-Length':String(body.length),'Cache-Control':'no-store','ETag':`"sw-${state.rev}"`});
      res.end(req.method==='HEAD'?'':body);
      return;
    }
    if(pathname==='/harness.html'){
      const body=Buffer.from('<!doctype html><meta charset="utf-8"><title>sw harness</title><p id="ok">harness</p>');
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Length':String(body.length),'Cache-Control':'no-store'});
      res.end(body);
      return;
    }
    if(pathname.startsWith('/anim3d/')) return serveAnim(req,res,pathname);
    if(state.shellFail){res.destroy();return}
    const rel=pathname==='/'?'index.html':pathname.replace(/^\/+/,'');
    const full=path.normalize(path.join(root,rel));
    if(!full.startsWith(root+path.sep)&&full!==root){res.writeHead(403);res.end();return}
    fs.readFile(full,(err,buf)=>{
      if(err){res.writeHead(404,{'Cache-Control':'no-store'});res.end('missing');return}
      res.writeHead(200,{'Content-Length':String(buf.length),'Cache-Control':'no-store'});
      res.end(req.method==='HEAD'?'':buf);
    });
  });
  server.on('connection',s=>{sockets.add(s);s.on('close',()=>sockets.delete(s));});
  return new Promise(resolve=>{
    server.listen(0,'127.0.0.1',()=>resolve({
      server,port:server.address().port,
      close(){for(const s of sockets)s.destroy();return new Promise(r=>server.close(r))}
    }));
  });
}

function serveAnim(req,res,pathname){
  const fault=['/anim3d/none.mp4','/anim3d/boom.mp4','/anim3d/slice.mp4','/anim3d/short.mp4'].includes(pathname);
  const asset=state.assets[pathname];
  const mode=fault?{ '/anim3d/none.mp4':'drop','/anim3d/boom.mp4':'500','/anim3d/slice.mp4':'206','/anim3d/short.mp4':'partial' }[pathname]:(asset?state.mode:'404');
  const hit={pathname,method:req.method,range:req.headers.range||null,inm:req.headers['if-none-match']||null,ims:req.headers['if-modified-since']||null,mode,sent:0};
  state.hits.push(hit);
  const finish=()=>{
    if(mode==='404'||(!asset&&mode==='normal')){hit.sent=404;res.writeHead(404,{'Cache-Control':'no-store'});res.end('missing');return}
    if(mode==='drop'||mode==='hang'){hit.sent=mode==='drop'?0:0;if(mode==='drop')res.destroy();return}
    if(mode==='500'){hit.sent=500;res.writeHead(500,{'Content-Type':'text/plain','Cache-Control':'no-store','Content-Length':'4'});res.end('nope');return}
    if(mode==='partial'){hit.sent=200;res.writeHead(200,{'Content-Type':(asset&&asset.type)||'video/mp4','Content-Length':'100','ETag':'"broken"','Cache-Control':'no-store','Accept-Ranges':'bytes'});res.end(Buffer.from('x'));return}
    if(mode==='206'){hit.sent=206;res.writeHead(206,{'Content-Type':asset?asset.type:'video/mp4','Content-Length':'4','Content-Range':'bytes 0-3/99','ETag':'"slice"','Cache-Control':'no-store'});res.end(Buffer.from('nope'));return}
    if(asset.etag&&req.headers['if-none-match']===asset.etag){hit.sent=304;res.writeHead(304,headers(asset));res.end();return}
    if(!asset.etag&&asset.lm&&req.headers['if-modified-since']===asset.lm){hit.sent=304;res.writeHead(304,headers(asset));res.end();return}
    const h=headers(asset);
    h['Content-Length']=String(asset.body.length);
    hit.sent=200;
    res.writeHead(200,h);
    res.end(req.method==='HEAD'?'':asset.body);
  };
  if(state.delayMs&&asset) setTimeout(finish,state.delayMs); else finish();
}

function headers(asset){
  const h={'Content-Type':asset.type,'Cache-Control':'no-store','Accept-Ranges':'bytes','Last-Modified':asset.lm};
  if(asset.etag)h.ETag=asset.etag;
  return h;
}

function hitsFor(pathname){return state.hits.filter(h=>h.pathname===pathname)}

async function boot(page,port){
  await page.goto(`http://127.0.0.1:${port}/harness.html`,{waitUntil:'domcontentloaded'});
  await page.evaluate(async gym=>{
    localStorage.setItem('gym',gym);
    const stale=await caches.open('unrelated-old');
    await stale.put(new Request('/sentinel'),new Response('bye'));
    const reg=await navigator.serviceWorker.register('/sw.js');
    const ready=await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_,rej)=>setTimeout(()=>rej(new Error('service worker did not activate')),20000))
    ]);
    if(!navigator.serviceWorker.controller) await new Promise(res=>navigator.serviceWorker.addEventListener('controllerchange',res,{once:true}));
    const worker=ready.installing||reg.installing;
    if(worker&&worker.state!=='activated') await new Promise(res=>{worker.addEventListener('statechange',()=>{if(worker.state==='activated')res()});if(worker.state==='activated')res()});
  },GYM);
}

async function playReal(page){
  return page.evaluate(async ()=>{
    let v=document.getElementById('clip');
    if(!v){v=document.createElement('video');v.id='clip';v.muted=true;v.playsInline=true;document.body.append(v)}
    v.pause();
    v.removeAttribute('src');
    v.load();
    const ready=new Promise((res,rej)=>{
      const t=setTimeout(()=>rej(new Error('loadeddata timeout')),10000);
      v.addEventListener('loadeddata',()=>{clearTimeout(t);res()},{once:true});
      v.addEventListener('error',()=>{clearTimeout(t);rej(new Error('media error '+(v.error&&v.error.code)))},{once:true});
    });
    v.src='/anim3d/play.mp4';
    await ready;
    await v.play();
    await new Promise((res,rej)=>{
      const t=setTimeout(()=>rej(new Error('seek timeout')),5000);
      v.addEventListener('seeked',()=>{clearTimeout(t);res()},{once:true});
      v.currentTime=Math.min(1,v.duration/2);
    });
    const res=await fetch('/anim3d/play.mp4',{cache:'no-store'});
    const buf=new Uint8Array(await res.arrayBuffer());
    let s=0; for(const b of buf) s=(s+b)>>>0;
    return {status:res.status,n:buf.length,sum:s,w:v.videoWidth,h:v.videoHeight,d:v.duration,t:v.currentTime};
  });
}

async function grab(page,url,headers){
  return page.evaluate(async (url,headers)=>{
    const res=await fetch(url,{headers:headers||{},cache:'no-store'});
    const buf=new Uint8Array(await res.arrayBuffer());
    let body=''; for(const b of buf) body+=String.fromCharCode(b);
    return {status:res.status,type:res.headers.get('content-type'),range:res.headers.get('content-range'),len:res.headers.get('content-length'),accept:res.headers.get('accept-ranges'),body};
  },url,headers||null);
}

test('cached clips and posters update online and still play offline',{timeout:120000},async ()=>{
  assert.equal(budget,8000);
  const srv=await startServer();
  const browser=await puppeteer.launch({
    executablePath:process.env.CHROME_PATH||'/usr/local/bin/google-chrome',
    headless:true,
    args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--autoplay-policy=no-user-gesture-required']
  });
  const page=await browser.newPage();
  const logs=[];
  page.on('pageerror',err=>logs.push('pageerror '+err.message));
  page.on('console',msg=>logs.push('console '+msg.text()));
  try{
    await boot(page,srv.port);
    const gym=await page.evaluate(()=>localStorage.getItem('gym'));
    assert.equal(gym,GYM);
    const names=await page.evaluate(async ()=>{
      const keys=await caches.keys();
      const anim=await caches.open('moyzal-anim3d-v7');
      const animKeys=await anim.keys();
      return {keys,anim:animKeys.map(k=>new URL(k.url).pathname)};
    });
    assert.ok(names.keys.includes('moyzal-v29'),JSON.stringify(names));
    assert.equal(names.keys.includes('moyzal-anim3d-v7'),false);
    assert.equal(names.keys.includes('unrelated-old'),false);
    assert.deepEqual(names.anim,[]);

    const oldMp4=await grab(page,'/anim3d/bp.mp4');
    assert.equal(oldMp4.status,200);
    assert.equal(oldMp4.body,'VIDEO-OLD-aaaaaaaa');
    assert.equal(oldMp4.type,'video/mp4');
    const oldJpg=await grab(page,'/anim3d/bp.jpg');
    assert.equal(oldJpg.status,200);
    assert.equal(oldJpg.body,'POSTER-OLD-aaaaaa');
    assert.equal(oldJpg.type,'image/jpeg');
    const cachedPaths=await page.evaluate(async ()=>{
      const anim=await caches.open('moyzal-anim3d-v7');
      return (await anim.keys()).map(k=>new URL(k.url).pathname).sort();
    });
    assert.deepEqual(cachedPaths,['/anim3d/bp.jpg','/anim3d/bp.mp4']);

    state.hits.length=0;
    const again=await grab(page,'/anim3d/bp.mp4');
    assert.equal(again.body,'VIDEO-OLD-aaaaaaaa');
    assert.equal(again.status,200);
    const cond=hitsFor('/anim3d/bp.mp4');
    assert.equal(cond.length,1);
    assert.equal(cond[0].range,null);
    assert.equal(cond[0].inm,'"mp4-1"');
    assert.equal(cond[0].sent,304);
    assert.ok(cond.some(h=>h.mode==='normal'));

    state.hits.length=0;
    state.delayMs=400;
    const parallel=await page.evaluate(async ()=>{
      const read=async ()=>{const res=await fetch('/anim3d/bp.mp4',{cache:'no-store'});return {status:res.status,body:await res.text()};};
      return Promise.all([read(),read()]);
    });
    state.delayMs=0;
    assert.deepEqual(parallel,[{status:200,body:'VIDEO-OLD-aaaaaaaa'},{status:200,body:'VIDEO-OLD-aaaaaaaa'}]);
    assert.equal(hitsFor('/anim3d/bp.mp4').length,1,'overlapping plays should share one revalidation');
    assert.equal(hitsFor('/anim3d/bp.mp4')[0].sent,304);

    state.assets['/anim3d/bp.mp4'].body=Buffer.from('VIDEO-NEW-bbbbbbbb');
    state.assets['/anim3d/bp.mp4'].etag='"mp4-2"';
    state.assets['/anim3d/bp.mp4'].lm='Thu, 03 Jun 2026 00:00:00 GMT';
    state.assets['/anim3d/bp.jpg'].body=Buffer.from('POSTER-NEW-bbbbbb');
    state.assets['/anim3d/bp.jpg'].etag='"jpg-2"';
    state.hits.length=0;
    const neu=await grab(page,'/anim3d/bp.mp4');
    assert.equal(neu.status,200);
    assert.equal(neu.body,'VIDEO-NEW-bbbbbbbb');
    assert.equal(hitsFor('/anim3d/bp.mp4')[0].inm,'"mp4-1"');
    assert.equal(hitsFor('/anim3d/bp.mp4')[0].range,null);
    const neuJpg=await grab(page,'/anim3d/bp.jpg');
    assert.equal(neuJpg.status,200);
    assert.equal(neuJpg.body,'POSTER-NEW-bbbbbb');

    const ranged=await grab(page,'/anim3d/bp.mp4',{Range:'bytes=0-5'});
    assert.equal(ranged.status,206);
    assert.equal(ranged.body,'VIDEO-');
    assert.equal(ranged.range,'bytes 0-5/18');
    assert.equal(ranged.len,'6');
    assert.equal(ranged.accept,'bytes');
    assert.equal(ranged.type,'video/mp4');
    const open=await grab(page,'/anim3d/bp.mp4',{Range:'bytes=12-'});
    assert.equal(open.status,206);
    assert.equal(open.body,'bbbbbb');
    assert.equal(open.range,'bytes 12-17/18');
    const suffix=await grab(page,'/anim3d/bp.jpg',{Range:'bytes=-6'});
    assert.equal(suffix.status,206);
    assert.equal(suffix.body,'bbbbbb');
    assert.equal(suffix.type,'image/jpeg');
    const over=await grab(page,'/anim3d/bp.mp4',{Range:'bytes=0-999'});
    assert.equal(over.status,206);
    assert.equal(over.body,'VIDEO-NEW-bbbbbbbb');
    assert.equal(over.range,'bytes 0-17/18');
    const bad=await grab(page,'/anim3d/bp.mp4',{Range:'bytes=40-50'});
    assert.equal(bad.status,416);
    assert.equal(bad.range,'bytes */18');
    const junk=await grab(page,'/anim3d/bp.mp4',{Range:'bytes=foo'});
    assert.equal(junk.status,416);
    const multi=await grab(page,'/anim3d/bp.mp4',{Range:'bytes=0-1,2-3'});
    assert.equal(multi.status,416);
    assert.ok(hitsFor('/anim3d/bp.mp4').every(h=>h.range===null),'revalidation must fetch the full file, not the media Range');
    assert.ok(hitsFor('/anim3d/bp.jpg').every(h=>h.range===null));

    assert.notEqual(sumBuf(play1),sumBuf(play2));
    state.hits.length=0;
    const played1=await playReal(page);
    assert.equal(played1.status,200);
    assert.equal(played1.sum,sumBuf(play1));
    assert.equal(played1.n,play1.length);
    assert.ok(played1.w>0&&played1.h>0);
    assert.ok(played1.d>1);
    assert.ok(played1.t>0);
    state.assets['/anim3d/play.mp4'].body=play2;
    state.assets['/anim3d/play.mp4'].etag='"play-2"';
    state.hits.length=0;
    const played2=await playReal(page);
    assert.equal(played2.sum,sumBuf(play2));
    assert.equal(played2.n,play2.length);
    assert.notEqual(played2.sum,played1.sum);
    assert.ok(played2.w>0&&played2.d>1&&played2.t>0);
    const playHits=hitsFor('/anim3d/play.mp4');
    assert.ok(playHits.some(h=>h.inm==='"play-1"'&&h.sent===200),JSON.stringify(playHits));
    assert.ok(playHits.every(h=>h.range===null),JSON.stringify(playHits));

    const lm1=await grab(page,'/anim3d/lm.mp4');
    assert.equal(lm1.body,'LM-OLD-aaaaaaaaaa');
    state.assets['/anim3d/lm.mp4'].body=Buffer.from('LM-NEW-bbbbbbbbbb');
    state.assets['/anim3d/lm.mp4'].lm='Fri, 04 Jul 2026 00:00:00 GMT';
    state.hits.length=0;
    const lm2=await grab(page,'/anim3d/lm.mp4');
    assert.equal(lm2.body,'LM-NEW-bbbbbbbbbb');
    assert.equal(hitsFor('/anim3d/lm.mp4')[0].inm,null);
    assert.equal(hitsFor('/anim3d/lm.mp4')[0].ims,'Wed, 02 Jan 2026 00:00:00 GMT');

    state.mode='500';
    const err=await grab(page,'/anim3d/bp.mp4');
    assert.equal(err.status,200);
    assert.equal(err.body,'VIDEO-NEW-bbbbbbbb');
    state.mode='partial';
    const partial=await grab(page,'/anim3d/bp.mp4');
    assert.equal(partial.status,200);
    assert.equal(partial.body,'VIDEO-NEW-bbbbbbbb');
    state.mode='206';
    const upstreamPartial=await grab(page,'/anim3d/bp.jpg');
    assert.equal(upstreamPartial.status,200);
    assert.equal(upstreamPartial.body,'POSTER-NEW-bbbbbb');
    state.mode='normal';
    const still=await page.evaluate(async ()=>{
      const cache=await caches.open('moyzal-anim3d-v7');
      const mp4=await cache.match('/anim3d/bp.mp4');
      const jpg=await cache.match('/anim3d/bp.jpg');
      return {mp4:mp4&&await mp4.text(),jpg:jpg&&await jpg.text()};
    });
    assert.equal(still.mp4,'VIDEO-NEW-bbbbbbbb');
    assert.equal(still.jpg,'POSTER-NEW-bbbbbb');

    const missed=await grab(page,'/anim3d/boom.mp4');
    assert.equal(missed.status,500);
    const dropped=await grab(page,'/anim3d/none.mp4');
    assert.equal(dropped.status,504);
    const sliced=await grab(page,'/anim3d/slice.mp4');
    assert.equal(sliced.status,206);
    assert.equal(sliced.body,'nope');
    const shorts=await grab(page,'/anim3d/short.mp4');
    assert.equal(shorts.status,504);
    const poisoned=await page.evaluate(async ()=>{
      const cache=await caches.open('moyzal-anim3d-v7');
      const keys=(await cache.keys()).map(k=>new URL(k.url).pathname);
      return keys.filter(k=>/none|boom|slice|short/.test(k));
    });
    assert.deepEqual(poisoned,[]);

    state.mode='hang';
    const hungAt=Date.now();
    const hung=await grab(page,'/anim3d/bp.mp4');
    const hungMs=Date.now()-hungAt;
    assert.equal(hung.status,200);
    assert.equal(hung.body,'VIDEO-NEW-bbbbbbbb');
    assert.ok(hungMs<budget+4000,`fallback took ${hungMs}ms`);
    assert.ok(hungMs>budget-1000,`fallback returned too fast (${hungMs}ms), budget ${budget}`);
    state.mode='normal';

    state.shellFail=true;
    state.mode='drop';
    await page.setOfflineMode(true);
    const offMp4=await grab(page,'/anim3d/bp.mp4');
    const offJpg=await grab(page,'/anim3d/bp.jpg');
    const offRange=await grab(page,'/anim3d/bp.mp4',{Range:'bytes=6-8'});
    const offCss=await grab(page,'/style.css');
    const offSync=await grab(page,'/sync.js');
    assert.equal(offMp4.status,200);
    assert.equal(offMp4.body,'VIDEO-NEW-bbbbbbbb');
    assert.equal(offJpg.status,200);
    assert.equal(offJpg.body,'POSTER-NEW-bbbbbb');
    assert.equal(offRange.status,206);
    assert.equal(offRange.body,'NEW');
    assert.equal(offCss.status,200);
    assert.ok(offCss.body.includes('--acc:#ff6b35'));
    assert.equal(offSync.status,200);
    assert.ok(offSync.body.includes('persistLocal'));
    state.assets['/anim3d/bp.mp4'].body=Buffer.from('VIDEO-OFF-cccccccc');
    state.assets['/anim3d/bp.mp4'].etag='"mp4-3"';
    const offStale=await grab(page,'/anim3d/bp.mp4');
    assert.equal(offStale.status,200);
    assert.equal(offStale.body,'VIDEO-NEW-bbbbbbbb');
    await page.setOfflineMode(false);
    state.shellFail=false;
    state.mode='normal';
    const onlineAgain=await grab(page,'/anim3d/bp.mp4');
    assert.equal(onlineAgain.status,200);
    assert.equal(onlineAgain.body,'VIDEO-OFF-cccccccc');
    assert.equal(await page.evaluate(()=>localStorage.getItem('gym')),GYM);

    await page.evaluate(async ()=>{
      const extra=await caches.open('unrelated-new');
      await extra.put(new Request('/later'),new Response('x'));
    });
    state.rev=2;
    await page.evaluate(async ()=>{
      const reg=await navigator.serviceWorker.getRegistration();
      const changed=new Promise(res=>navigator.serviceWorker.addEventListener('controllerchange',res,{once:true}));
      await reg.update();
      await changed;
      const ready=await navigator.serviceWorker.ready;
      const worker=ready.installing||ready.waiting||ready.active;
      if(worker&&worker.state!=='activated') await new Promise(res=>worker.addEventListener('statechange',()=>{if(worker.state==='activated')res()}));
    });
    const after=await page.evaluate(async ()=>{
      const keys=await caches.keys();
      const anim=await caches.open('moyzal-anim3d-v7');
      const mp4=await anim.match('/anim3d/bp.mp4');
      const shell=await caches.open('moyzal-v29');
      const css=await shell.match('/style.css');
      return {keys,mp4:mp4&&await mp4.text(),css:!!css,gym:localStorage.getItem('gym')};
    });
    assert.ok(after.keys.includes('moyzal-v29'),JSON.stringify(after.keys));
    assert.ok(after.keys.includes('moyzal-anim3d-v7'),JSON.stringify(after.keys));
    assert.equal(after.keys.includes('unrelated-new'),false);
    assert.equal(after.mp4,'VIDEO-OFF-cccccccc');
    assert.equal(after.css,true);
    assert.equal(after.gym,GYM);
    const shellNames=await page.evaluate(async ()=>{
      const shell=await caches.open('moyzal-v29');
      return (await shell.keys()).map(k=>new URL(k.url).pathname);
    });
    assert.equal(shellNames.some(n=>n.endsWith('.mp4')),false);
  }catch(err){
    err.message+=`\nrecent hits ${JSON.stringify(state.hits.slice(-12))}\nlogs ${logs.slice(-20).join(' | ')}`;
    throw err;
  }finally{
    await page.setOfflineMode(false).catch(()=>{});
    await browser.close();
    await srv.close();
  }
});
