'use strict';
// Stage 2: required account, offline-first sync to Supabase (EU) after sign-in, opt-in analytics.
(function(){
  const CFG=window.MZ_SB||(typeof MZ_SB!=='undefined'?MZ_SB:null);const READY=!!(CFG&&CFG.url&&CFG.anon&&window.supabase&&supabase.createClient);
  let sb=null,user=null,status='off',lastErr='',lastAt=0,timer=0,running=null,again=false;
  const AUTH_FLAG='gc_auth';
  // D-232: fixed storage key = the Supabase default for this project, so existing sessions stay valid across versions.
  const AUTH_KEY=(()=>{try{return 'sb-'+new URL(CFG.url).hostname.split('.')[0]+'-auth-token'}catch(e){return 'sb-gym-auth-token'}})();
  let authReady=false;
  function markAuthed(){try{if(user) localStorage.setItem(AUTH_FLAG,user.id||'1')}catch(e){}}

  function appUrl(){
    try{const u=new URL(location.href);return u.origin+u.pathname.replace(/index\.html$/,'')}
    catch(e){return 'https://eduardsbor.github.io/gym-app/'}
  }
  function friendly(err){
    const m=(err&&(err.message||err.error_description||err))+'';
    const map=[
      [/invalid login credentials/i,'Неверная почта или код'],
      [/email not confirmed/i,'Подтверди почту — мы отправили письмо'],
      [/already registered/i,'Такой аккаунт уже есть — войди'],
      [/invalid format/i,'Проверь адрес почты'],
      [/unable to validate email/i,'Проверь адрес почты'],
      [/rate limit/i,'Слишком много попыток. Подожди минуту'],
      [/for security purposes/i,'Подожди минуту и попробуй снова'],
      [/signup is disabled/i,'Регистрация временно недоступна'],
      [/network|failed to fetch/i,'Нет сети — данные остаются на устройстве']
    ];
    for(const[re,t] of map) if(re.test(m)) return t;
    return m||'Не получилось';
  }
  function nid(){
    const a=new Uint8Array(16);
    if(crypto&&crypto.getRandomValues) crypto.getRandomValues(a);
    else for(let i=0;i<a.length;i++) a[i]=Math.floor(Math.random()*256);
    return Array.from(a,x=>x.toString(16).padStart(2,'0')).join('');
  }
  function hasLocalData(){
    return !!(S.program||(S.workouts&&S.workouts.length)||(S.body&&S.body.length)||S.goal||(S.templates&&S.templates.length));
  }
  function canTrack(){return !!(S.consentAnalytics&&S.consentAnalytics.v)}
  // G6 / ePrivacy: do not create or keep the analytics id until the user consents. On withdraw, drop it.
  function ensureMeta(){
    let ch=false;
    if(canTrack()){if(!S.installId){S.installId=nid();ch=true}}
    else if(S.installId){delete S.installId;ch=true}
    if(!S.updatedAt){S.updatedAt=hasLocalData()?Date.now():0;ch=true}
    S.deletedWorkouts=S.deletedWorkouts||[];
    S.deletedBody=S.deletedBody||[];
    S.deletedCustom=S.deletedCustom||[];
    S.templates=S.templates||[];
    S.deletedTemplates=S.deletedTemplates||[];
    S.eqProfiles=S.eqProfiles||[];
    S.deletedEqProfiles=S.deletedEqProfiles||[];
    if(typeof eqEnsure==='function') eqEnsure();
    return ch;
  }
  function persistLocal(){
    if(typeof S_RO!=='undefined'&&S_RO) return;
    try{localStorage.setItem('gym',JSON.stringify(S))}catch(e){}
    if(typeof saveHistory==='function') try{saveHistory()}catch(e){}
  }
  // Отпечаток программы: по его изменению ставим отдельную метку времени progAt,
  // чтобы правка настроек на одном устройстве не затирала новую программу с другого.
  function progSigOf(){try{return JSON.stringify([S.program||null,S.prof||null,S.progName||null,S.block||null])}catch(e){return ''}}
  let progSig=progSigOf();
  // Локальные данные принадлежат другому аккаунту (вход сменили на этом устройстве).
  function foreignData(){return !!(user&&S.ownerUid&&S.ownerUid!==user.id&&hasLocalData())}
  function adoptLS(){
    try{const cur=JSON.parse(localStorage.getItem('gym')||'null');if(cur) Object.keys(cur).forEach(k=>{S[k]=cur[k]})}catch(e){}
  }
  function payloadOf(src){
    const p=JSON.parse(JSON.stringify(src));
    delete p.ownerPremium;delete p.premium;delete p.active;delete p.tEnd;delete p.ownerUid;
    // D-217: install_id остаётся только на устройстве, чтобы анонимные события нельзя было связать с аккаунтом.
    delete p.installId;
    // D-222: флаг first_workout тоже только на устройстве.
    delete p.azFirstWo;
    delete p.healthConsentQueue;
    delete p.replacePending;delete p.replaceBody;
    // Данные о здоровье (замеры, рост, вес тела, возраст) уходят в облако только при явном согласии.
    if(!p.consentHealth){delete p.body;delete p.height;delete p.weightKg;delete p.age;stripLimits(p)}
    return p;
  }
  // D-217: ограничения из анкеты (спина/колени/плечи) и отметки «боль» — тоже данные о здоровье: без согласия только на устройстве.
  const isLimWhy=w=>Array.isArray(w)&&typeof w[0]==='string'&&/^Ограничения \(/.test(w[0]);
  function stripLimits(p){
    if(p.prof&&typeof p.prof==='object') delete p.prof.lim;
    delete p.limSeen;  // v160: local «limitations confirmed on this device» flag
    if(Array.isArray(p.why)) p.why=p.why.filter(w=>!isLimWhy(w));
    (p.workouts||[]).forEach(w=>(w&&w.items||[]).forEach(it=>{if(it) delete it.pain}));
    if(p.pg&&typeof p.pg==='object') Object.keys(p.pg).forEach(k=>{const n=p.pg[k]&&p.pg[k].next;if(n&&n.note==='pain') n.note='same'});
    // tech-fix-1/2: limitation notes and acknowledgements in the plan / history name the limitation — health data too.
    const clean=it=>{if(it&&typeof it==='object'){delete it.limAck;delete it.swapped;delete it.limFrom;delete it.limStop;delete it.merged}};  // v160: + merged (sets added for a limitation)  // tech-fix-2.1: + limFrom / limStop (partly done exercise)
    (Array.isArray(p.program)?p.program:[]).forEach(d=>{if(!d||typeof d!=='object')return;delete d.limWarn;delete d.limAckWuCd;(d.items||[]).forEach(clean)});
    (p.workouts||[]).forEach(w=>(w&&w.items||[]).forEach(clean));
    if(p.active&&typeof p.active==='object')(p.active.items||[]).forEach(clean);
    delete p.limLog;
  }
  // Облако без ограничений не должно стирать их на этом устройстве.
  function keepLocalLimits(L){
    if(!L) return;
    if(S.prof&&typeof S.prof==='object'&&S.prof.lim===undefined&&L.lim) S.prof.lim=L.lim;
    if(Array.isArray(S.why)&&L.why&&!S.why.some(isLimWhy)) S.why=S.why.concat(L.why);
    // Без согласия облако без отметок «боль» не должно стирать их в истории на этом устройстве.
    (L.pain||[]).forEach(p=>{
      const w=(S.workouts||[]).find(x=>x&&x.id===p.id);if(!w||!w.items) return;
      let it=w.items[p.i];
      if(!it||(p.exId!=null&&it.exId!==p.exId)) it=w.items.find(x=>x&&x.exId===p.exId);
      if(it&&it.pain===undefined) it.pain=true;
    });
  }
  function localLimits(){
    const pain=[];
    (S.workouts||[]).forEach(w=>(w&&w.items||[]).forEach((it,i)=>{if(it&&it.pain) pain.push({id:w.id,i,exId:it.exId})}));
    return {lim:S.prof&&Array.isArray(S.prof.lim)?S.prof.lim.slice():null,why:Array.isArray(S.why)?S.why.filter(isLimWhy):null,pain};
  }
  function mergePg(a,b){
    const o={};
    // D1 (v152 QA): S.pg entries carry `last` (start of the workout that updated them), not at/updatedAt/ts — before this fix every
    // timestamp was 0 and the cloud copy (b) always won, so progression was rolled back after each sync. Now the newer `last` wins;
    // equal or missing timestamps keep the local entry (a). Non-object values never replace an object.
    // O1 (v154): `upd` (moment of the update = end of the workout, set by awFinish) orders two overlapping workouts on two devices
    // by which one finished later; entries written before v154 have no upd and fall back to `last` (backward compatible).
    function ts(x){if(!x||typeof x!=='object')return 0;const v=+(x.upd||x.last||x.at||x.updatedAt||x.ts||0);return isFinite(v)?v:0}
    [a,b].forEach(src=>{
      if(!src||typeof src!=='object') return;
      Object.keys(src).forEach(k=>{
        const x=src[k],y=o[k];
        if(y==null) o[k]=x;
        else if(x&&typeof x==='object'&&(!y||typeof y!=='object'||ts(x)>ts(y))) o[k]=x;
      });
    });
    return o;
  }
  function mergeLists(local,remote,delA,delB,idKey,timeFn){
    const del=new Set([].concat(delA||[],delB||[]));
    const map=new Map();
    (remote||[]).forEach(x=>{if(x&&x[idKey]!=null&&!del.has(x[idKey])) map.set(x[idKey],x)});
    (local||[]).forEach(x=>{
      if(!x||x[idKey]==null||del.has(x[idKey])) return;
      const y=map.get(x[idKey]);
      if(!y) map.set(x[idKey],x);
      else map.set(x[idKey], (timeFn(x)||0)>=(timeFn(y)||0)?x:y);
    });
    return {list:[...map.values()],deleted:[...del]};
  }
  // P-307: health-consent withdrawal always wins. Compare grant.at vs the latest revocation timestamp.
  function tsAt(v){if(v==null||v==='')return 0;if(typeof v==='number'&&isFinite(v)&&v>0)return v;const t=Date.parse(v);return isFinite(t)?t:0}
  function consentGrantAt(c){return c&&c.at?tsAt(c.at):0}
  function applyHealthConsent(cA,rA,cB,rB){
    const rev=Math.max(tsAt(rA),tsAt(rB));
    const gA=consentGrantAt(cA),gB=consentGrantAt(cB);
    let grant=null;if(gA||gB) grant=gA>=gB?cA:cB;
    if(rev&&(!grant||consentGrantAt(grant)<=rev)) grant=null;
    S.consentHealth=grant||null;
    if(rev) S.healthConsentRevokedAt=new Date(rev).toISOString();
  }
  function bodyPhotoKeys(list){const s=new Set();(list||[]).forEach(b=>(b&&b.photos||[]).forEach(k=>{if(typeof k==='string')s.add(k)}));return s}
  function dropBodyPhotos(prev,next){
    try{
      const keep=bodyPhotoKeys(next),drop=[...bodyPhotoKeys(prev)].filter(k=>!keep.has(k));
      if(!drop.length||typeof idb==='undefined'||!idb||!idb.del) return;
      drop.forEach(k=>{Promise.resolve(idb.del(k)).catch(()=>{})});
    }catch(e){}
  }
  function applyRemoteFresh(R){
    const keepOwner=S.ownerPremium,keepPrem=S.premium,keepActive=S.active,keepTEnd=S.tEnd,installId=S.installId,azFirst=S.azFirstWo;
    const locCons=S.consentHealth,locRev=S.healthConsentRevokedAt;
    const prevBody=S.body;
    const az=S.consentAnalytics,lang=S.lang,LL=localLimits(),ds=S.demoStart;
    Object.keys(R).forEach(k=>{S[k]=R[k]});
    keepEarliestDemo(ds,R.demoStart);
    // premium is never taken from the cloud: the row is writable by the client. Keep the device value.
    if(keepPrem!==undefined) S.premium=keepPrem; else delete S.premium;
    keepLocalLimits(LL);
    S.ownerPremium=keepOwner;
    if(keepActive) S.active=keepActive;
    if(keepTEnd) S.tEnd=keepTEnd;
    if(installId) S.installId=installId;
    if(azFirst) S.azFirstWo=azFirst;
    seedFirstWorkoutFlag();
    if(az&&!S.consentAnalytics) S.consentAnalytics=az;
    if(lang&&!S.lang) S.lang=lang;
    applyHealthConsent(locCons,locRev,R.consentHealth,R.healthConsentRevokedAt);
    if(typeof migrateLegacyPlans==='function') migrateLegacyPlans();
    if(typeof eqEnsure==='function') eqEnsure();
    dropBodyPhotos(prevBody,S.body);
  }
  // P-305b: demo start (first completed workout) — always the earliest of local and cloud, never a later date.
  function keepEarliestDemo(a,b){const m=[a,b].filter(x=>typeof x==='number'&&isFinite(x)&&x>0);if(m.length) S.demoStart=Math.min(...m)}
  function applyMerged(R,remoteAt){
    const keepOwner=S.ownerPremium,keepActive=S.active,keepTEnd=S.tEnd,LL=localLimits();
    const locCons=S.consentHealth,locRev=S.healthConsentRevokedAt;
    const prevBody=S.body;
    const w=mergeLists(S.workouts,R.workouts,S.deletedWorkouts,R.deletedWorkouts,'id',x=>x.end||x.start||0);
    const b=mergeLists(S.body,R.body,S.deletedBody,R.deletedBody,'id',x=>Date.parse(x.date||'')||0);
    const c=mergeLists(S.custom,R.custom,S.deletedCustom,R.deletedCustom,'id',x=>+(String(x.id).replace(/\D/g,'')||0));
    const tpl=mergeLists(S.templates,R.templates,S.deletedTemplates,R.deletedTemplates,'id',x=>x.updatedAt||0);
    const eqp=mergeLists(S.eqProfiles,R.eqProfiles,S.deletedEqProfiles,R.deletedEqProfiles,'id',x=>x.updatedAt||0);
    const localNewer=(S.updatedAt||0)>=(remoteAt||0);
    const pick=(k)=>{
      if(localNewer) return S[k]!==undefined?S[k]:R[k];
      return R[k]!==undefined?R[k]:S[k];
    };
    S.workouts=w.list;S.deletedWorkouts=w.deleted;
    if(S.consentHealth||R.consentHealth){S.body=b.list;S.deletedBody=b.deleted;dropBodyPhotos(prevBody,S.body)}
    S.custom=c.list;S.deletedCustom=c.deleted;
    S.templates=tpl.list;S.deletedTemplates=tpl.deleted;
    S.eqProfiles=eqp.list;S.deletedEqProfiles=eqp.deleted;
    // Records come from workout history (union by id above). Auto-weight state S.pg is also united by exercise id so no exercise is dropped.
    S.pg=mergePg(S.pg,R.pg);
    // Активный профиль — по своей метке eqActiveAt, чтобы смена места не затиралась чужим сохранением.
    if((R.eqActiveAt||0)>(S.eqActiveAt||0)){S.eqActive=R.eqActive;S.eqActiveAt=R.eqActiveAt}
    else if(S.eqActiveAt||S.eqActive){/* local wins or equal */}
    else if(R.eqActive){S.eqActive=R.eqActive;S.eqActiveAt=R.eqActiveAt||0}
    if(typeof eqEnsure==='function') eqEnsure();
    // Программа сравнивается по своей метке progAt; если её нет ни там, ни там — по общей updatedAt, как раньше.
    const blkL=S.block,blkR=R.block;
    const progLocal=(S.progAt||R.progAt)?(S.progAt||0)>=(R.progAt||0):localNewer;
    ['program','progName','why','prof','goal','days','block'].forEach(k=>{
      const v=progLocal?(S[k]!==undefined?S[k]:R[k]):(R[k]!==undefined?R[k]:S[k]);
      if(v!==undefined) S[k]=v;
    });
    // tech-fix-2.3: a copy without S.block.passAt (older app) must not drop it: same block, not restarted (next not lower,
    // no last day done since passAt) → keep the other side's passAt; otherwise limguard derives the pass from history.
    {const B=S.block,O=B===blkL?blkR:blkL,oPa=O&&+O.passAt,n=Array.isArray(S.program)?S.program.length:0;
      if(B&&typeof B==='object'&&!(+B.passAt>0)&&O&&O.id===B.id&&oPa>0&&(B.next|0)>=(O.next|0)&&!(S.workouts||[]).some(w=>w&&w.dayIdx===n-1&&(+w.start||0)>=oPa)) B.passAt=oPa}
    const pa=Math.max(S.progAt||0,R.progAt||0);if(pa) S.progAt=pa;
    ['next','lang','sound','wake','autoW','restOverride','consentAnalytics','obDone','obOffer','schema','v','weightAsked','ageAsked'].forEach(k=>{
      const v=pick(k);if(v!==undefined) S[k]=v;
    });
    applyHealthConsent(locCons,locRev,R.consentHealth,R.healthConsentRevokedAt);
    keepEarliestDemo(S.demoStart,R.demoStart);
    if(S.consentHealth||R.consentHealth){['height','weightKg','age'].forEach(k=>{const h=pick(k);if(h!==undefined) S[k]=h})}
    keepLocalLimits(LL);
    S.ownerPremium=keepOwner;
    if(keepActive) S.active=keepActive;
    if(keepTEnd) S.tEnd=keepTEnd;
    if(typeof migrateLegacyPlans==='function') migrateLegacyPlans();
    S.updatedAt=Math.max(S.updatedAt||0,remoteAt||0,Date.now());
    seedFirstWorkoutFlag();
  }
  const HEALTH_CONSENT_TEXT_V='2026-11-21';
  function isAccountDeletedErr(e){
    const m=(e&&(e.message||e.code||e.code_||e))+'';
    return /account_deleted/i.test(m);
  }
  function queueHealthConsent(action){
    if(action!=='grant'&&action!=='revoke') return;
    S.healthConsentQueue=Array.isArray(S.healthConsentQueue)?S.healthConsentQueue:[];
    S.healthConsentQueue.push({action,text_version:HEALTH_CONSENT_TEXT_V,at:new Date().toISOString()});
    persistLocal();
  }
  async function flushHealthConsentLog(){
    if(!sb||!user) return;
    if(typeof navigator!=='undefined'&&navigator.onLine===false) return;
    const q=S.healthConsentQueue;
    if(!Array.isArray(q)||!q.length) return;
    while(q.length){
      const row=q[0];
      const {error}=await sb.from('health_consent_log').insert({
        action:row.action,
        text_version:row.text_version||HEALTH_CONSENT_TEXT_V,
        created_at:row.at||new Date().toISOString()
      });
      // Журнал не должен останавливать синхронизацию (таблицы ещё нет / сбой): очередь остаётся до следующего раза.
      if(error){if(isAccountDeletedErr(error)) throw error;return}
      q.shift();
      persistLocal();
    }
  }
  async function onAccountGone(){
    clearTimeout(timer);
    try{if(sb&&sb.auth) await sb.auth.signOut({scope:'local'})}catch(e){}
    try{Object.keys(localStorage).filter(k=>/^sb-.*-auth-token/.test(k)).forEach(k=>localStorage.removeItem(k))}catch(e){}
    user=null;status='off';
    try{localStorage.removeItem(AUTH_FLAG)}catch(e){}
    try{
      if(typeof clearLocalData==='function') await clearLocalData();
      else{
        localStorage.removeItem('gym');
        try{if(typeof idb!=='undefined'&&idb&&idb.close)idb.close()}catch(e){}
        await new Promise(r=>{if(typeof indexedDB==='undefined')return r();const q=indexedDB.deleteDatabase('moyzal');q.onsuccess=q.onerror=q.onblocked=()=>r()});
      }
    }catch(e){}
    resetLocalState(); // QA-13
    toast('Аккаунт удалён. Данные на этом устройстве очищены.');
    if(typeof authView==='function') authView();
  }
  async function checkAccountTombstone(){
    if(!sb||!user) return false;
    try{
      const {data,error}=await sb.rpc('account_is_deleted');
      if(!error&&data===true){await onAccountGone();return true}
    }catch(e){}
    return false;
  }
  window.mzLogHealthConsent=queueHealthConsent;
  window.mzHealthConsentTextV=HEALTH_CONSENT_TEXT_V;

  const USER_STATE_MAX=900*1024;
  function utf8Len(str){try{return new TextEncoder().encode(str).length}catch(e){return unescape(encodeURIComponent(str)).length}}
  function payloadForUpload(){
    const raw=payloadOf(S), pack=o=>JSON.stringify(o);
    if(utf8Len(pack(raw))<=USER_STATE_MAX)return{payload:raw,trimmed:false};
    const t=JSON.parse(pack(raw));
    const fit=()=>utf8Len(pack(t))<=USER_STATE_MAX;
    if(Array.isArray(t.workouts)&&t.workouts.length){
      t.workouts=t.workouts.slice();
      while(!fit()&&t.workouts.length)t.workouts.shift();
    }
    if(!fit()&&Array.isArray(t.body)){
      t.body=t.body.map(e=>{const x=Object.assign({},e);if(x.photos)delete x.photos;return x});
      while(!fit()&&t.body.length)t.body.shift();
    }
    if(!fit())return{payload:null,trimmed:'refuse'};
    return{payload:t,trimmed:true};
  }
  // D-282 follow-up: the shortened-copy toast at most once per launch and once per calendar day.
  let trimToastLaunch=false;
  const TRIM_TOAST_KEY='gc_trim_toast_day';
  function todayKey(){
    const d=new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  function toastTrimmedCopy(){
    if(trimToastLaunch) return false;
    const day=todayKey();
    try{if(localStorage.getItem(TRIM_TOAST_KEY)===day){trimToastLaunch=true;return false}}catch(e){}
    trimToastLaunch=true;
    try{localStorage.setItem(TRIM_TOAST_KEY,day)}catch(e){}
    if(typeof toast==='function')toast('В облако ушла сокращённая копия истории. На устройстве все данные на месте.');
    return true;
  }
  // QA-02b (Claude 23.11): syncedAt = when a record first reached the cloud. «Заменить» keeps records that
  // reached the cloud after the backup even if the workout itself is older (done offline, synced later).
  // Records already in the cloud before this version get syncedAt=1 («long ago») so old records are not kept by mistake.
  const SYNC_LISTS=['workouts','custom','templates','eqProfiles','body'];
  let cloudKnown=null; // ids per list from the last select/upsert in this session; null = cloud not read yet, nothing is stamped
  // id → syncedAt of the cloud copy (1 when the cloud copy has none: it was there before this version).
  function noteCloudIds(R){const k={};SYNC_LISTS.forEach(l=>{const m=new Map();(Array.isArray(R&&R[l])?R[l]:[]).forEach(x=>{if(x&&x.id!=null)m.set(x.id,+x.syncedAt>0?+x.syncedAt:1)});k[l]=m});cloudKnown=k}
  // Returns the records stamped now; if the upload fails, the caller removes the stamp (the record has not reached the cloud).
  function stampSyncedAt(now){
    const done=[];
    if(!cloudKnown) return done;
    SYNC_LISTS.forEach(l=>(Array.isArray(S[l])?S[l]:[]).forEach(x=>{
      if(!x||typeof x!=='object'||x.id==null||x.syncedAt!=null) return;
      if(cloudKnown[l].has(x.id)){x.syncedAt=cloudKnown[l].get(x.id);return} // already in the cloud: keep its time
      x.syncedAt=now;done.push(x);
    }));
    return done;
  }
  async function pushNow(){
    if(!sb||!user) return;
    if(await checkAccountTombstone()) return;
    await flushHealthConsentLog();
    ensureMeta();
    S.updatedAt=Date.now();
    const stamped=stampSyncedAt(S.updatedAt);
    const unstamp=xs=>xs.forEach(x=>{try{delete x.syncedAt}catch(e){}});
    const up=payloadForUpload();
    if(!up.payload){
      unstamp(stamped);
      persistLocal();
      if(typeof toast==='function')toast('Слишком много данных для облака. На устройстве всё на месте.');
      return;
    }
    let res;
    try{res=await sb.from('user_state').upsert({
      user_id:user.id,
      payload:up.payload,
      updated_at:new Date(S.updatedAt).toISOString()
    })}catch(e){unstamp(stamped);throw e}
    if(res.error){unstamp(stamped);throw res.error}
    noteCloudIds(up.payload);
    // A shortened copy (trim) may leave some records out: they have not reached the cloud yet.
    unstamp(stamped.filter(x=>!SYNC_LISTS.some(l=>cloudKnown[l].has(x.id)&&(S[l]||[]).includes(x))));
    persistLocal();
    if(up.trimmed) toastTrimmedCopy();
    lastAt=S.updatedAt||Date.now();
  }
  function remoteHasData(R){
    return !!(R&&(R.program||(R.workouts&&R.workouts.length)||(R.body&&R.body.length)||R.goal||(R.templates&&R.templates.length)));
  }
  // Guest data (never bound to an account: no ownerUid) must not be overwritten or deleted on first sign-in.
  // Empty or blank cloud: push local. Cloud already has data: leave local as-is (no apply, no push) until the transfer dialog (PR 2).
  // The guard runs only during afterAuth (first sign-in), not on later sync of an already signed-in session.
  let protectGuestOnAuth=false;
  function isUnboundGuest(){return hasLocalData()&&!S.ownerUid}
  async function pullAndMerge(){
    if(!sb||!user) return;
    if(await checkAccountTombstone()) return 'gone';
    await flushHealthConsentLog();
    const {data,error}=await sb.from('user_state').select('payload,updated_at').eq('user_id',user.id).maybeSingle();
    if(error) throw error;
    if(!data){noteCloudIds(null);await pushNow();return}
    const remoteAt=data.updated_at?Date.parse(data.updated_at):0;
    const R=data.payload||{};
    noteCloudIds(R);
    if(S.replacePending){ // QA-02: «Заменить». Records another device wrote after the backup (exportedAt) stay.
      const cutoff=+S.exportedAt>0?+S.exportedAt:(+S.replacePending>0?+S.replacePending:0);
      let keptN=0;
      const tsOf=(kind,x)=>{if(!x||typeof x!=='object')return 0;let t;
        if(kind==='workouts')t=+x.end||+x.start||0;
        else if(kind==='body'){const d=Date.parse(x.date||'');t=Number.isFinite(d)?d+86400000-1:(+x.updatedAt||0)}
        else t=+x.updatedAt||0;
        return Math.max(t||0,+x.syncedAt||0)}; // QA-02b: reached the cloud after the backup → stays
      const mark=(lk,dk,idk,kind)=>{const keep=new Set((S[lk]||[]).map(x=>x&&x[idk]));const del=new Set([].concat(S[dk]||[],R[dk]||[]));const newer=[];
        (R[lk]||[]).forEach(x=>{if(!x||x[idk]==null||keep.has(x[idk]))return;if(cutoff&&tsOf(kind,x)>cutoff){newer.push(x);del.delete(x[idk]);return}del.add(x[idk])});
        keep.forEach(id=>del.delete(id));newer.forEach(x=>del.delete(x[idk]));S[dk]=[...del];
        if(newer.length){const have=new Set((S[lk]||[]).map(x=>x&&x[idk]));newer.forEach(x=>{if(!have.has(x[idk])){(S[lk]=S[lk]||[]).push(x);have.add(x[idk]);keptN++}})}};
      mark('workouts','deletedWorkouts','id','workouts');mark('custom','deletedCustom','id','custom');mark('templates','deletedTemplates','id','templates');mark('eqProfiles','deletedEqProfiles','id','eq');
      if(S.consentHealth&&S.replaceBody) mark('body','deletedBody','id','body');
      delete S.replacePending;delete S.replaceBody;S.updatedAt=Date.now();S.progAt=Date.now();progSig=progSigOf();persistLocal();
      if(keptN&&typeof toast==='function')toast('Оставлены записи с другого устройства, сделанные после этой копии.');
      await pushNow();return;
    }
    // Blank cloud never overwrites guest data (even after the user agrees to transfer).
    if(isUnboundGuest()&&!remoteHasData(R)){await pushNow();return}
    if(protectGuestOnAuth&&isUnboundGuest()){return 'held'}
    if(!hasLocalData()) applyRemoteFresh(R);
    else applyMerged(R,remoteAt);
    progSig=progSigOf(); // программа из облака — не «локальная правка», метку progAt не трогаем
    persistLocal();
    await pushNow();
  }
  // D-253 (Eduards: «Нужна автоматическая синхронизация»): sync runs by itself — on start, when the app becomes visible,
  // 3 s after any saved change (workout finished/saved too), when the network is back, and every 5 min while open.
  // One run at a time: a call during a run is queued once (again). Offline / network errors only show the offline note.
  const isOffline=()=>typeof navigator!=='undefined'&&navigator.onLine===false;
  const netErr=e=>!!e&&(e.name==='TypeError'||/failed to fetch|networkerror|load failed|network request failed|fetch/i.test(String(e.message||e)));
  // Account delete and «clear this phone» must not race with an automatic sync.
  let syncHold=0;
  function holdSync(){syncHold++;clearTimeout(timer)}
  function releaseSync(){syncHold=Math.max(0,syncHold-1)}
  function resetSyncHold(){syncHold=0}
  function sync(){
    if(syncHold>0) return Promise.resolve();
    if(!READY||!user) return Promise.resolve();
    if(running){again=true;return running}
    if(isOffline()){status='offline';paint();return Promise.resolve()}
    if(foreignData()){status='err';lastErr='на устройстве данные другого аккаунта. Выйди и войди заново';paint();return Promise.resolve()}
    status='syncing';lastErr='';paint();
    running=(async()=>{
      try{
        const r=await pullAndMerge();
        if(r==='gone'||!user){status='off'}
        else {status='ok';if(r!=='held'&&S.ownerUid!==user.id){S.ownerUid=user.id;persistLocal()}}
      }
      catch(e){
        if(isAccountDeletedErr(e)){await onAccountGone();status='off'}
        else if(isOffline()||netErr(e))status='offline';
        else {status='err';lastErr=friendly(e)}
      }
      finally{running=null;paint()}
      if(again&&user){again=false;return sync()}
    })();
    return running;
  }
  function syncNow(){clearTimeout(timer);return sync()}
  const SYNC_DEBOUNCE=3000,SYNC_EVERY=5*60e3;
  function schedule(){
    if(!user||syncHold>0) return;
    S.updatedAt=Date.now();
    persistLocal();
    clearTimeout(timer);
    timer=setTimeout(()=>sync(),SYNC_DEBOUNCE);
  }
  window.mzOnSave=function(){
    const sg=progSigOf();if(sg!==progSig){progSig=sg;S.progAt=Date.now()}
    if(S.obDone&&!S._azOb){S._azOb=1;persistLocal();mzTrack('onboarding_done')}
    schedule();
  };

  // D-217: анонимная аналитика — только случайный install_id с устройства; без user_id, email и auth uid.
  function eventRow(name,props){
    const pr={};Object.entries(props||{}).forEach(([k,v])=>{if(!/^(user_?id|uid|email)$/i.test(k)) pr[k]=v});
    return {name,install_id:S.installId,props:pr};
  }
  function isFinishedWorkout(w){
    return !!(w&&(w.items||[]).some(it=>(it.sets||[]).some(s=>s&&s.done)));
  }
  function hasFinishedWorkout(){
    return ((S.workouts)||[]).some(isFinishedWorkout);
  }
  function firstWorkoutProps(){
    const place=(typeof eqPrimaryPlace==='function'&&eqPrimaryPlace())||(S.prof&&S.prof.place)||'';
    const goal=S.goal||(S.prof&&S.prof.goal)||'';
    const pr={};
    if(place==='g'||place==='d'||place==='b') pr.place=place;
    if(goal==='mass'||goal==='str'||goal==='loss'||goal==='fit') pr.goal=goal;
    return pr;
  }
  // D-222: если в истории уже есть завершённая тренировка, только ставим флаг — событие не отправляем.
  function seedFirstWorkoutFlag(){
    if(S.azFirstWo) return;
    if(hasFinishedWorkout()){S.azFirstWo=1;persistLocal()}
  }
  function mzOnWorkoutFinished(W){
    if(S.azFirstWo) return;
    if(!isFinishedWorkout(W)) return;
    S.azFirstWo=1;persistLocal();
    mzTrack('first_workout', firstWorkoutProps());
  }
  async function mzTrack(name,props){
    if(!canTrack()||!READY||!sb) return;
    try{
      ensureMeta();
      if(name==='first_workout'){
        const allow={place:1,goal:1},pr={};
        Object.entries(props||{}).forEach(([k,v])=>{if(allow[k]) pr[k]=v});
        props=pr;
      }
      await sb.from('events').insert(eventRow(name,props));
    }catch(e){}
  }
  window.mzTrack=mzTrack;
  window.mzOnWorkoutFinished=mzOnWorkoutFinished;
  window.mzSignedIn=()=>!!user;
  // D-276: MoveKit signs with the user access token, never the anon key.
  window.mzAccessToken=async function(){
    if(!sb) return '';
    try{
      const {data}=await sb.auth.getSession();
      const tok=data&&data.session&&data.session.access_token;
      return typeof tok==='string'&&tok ? tok : '';
    }catch(e){return ''}
  };
  function bootAnalytics(){
    seedFirstWorkoutFlag();
    if(!canTrack()) return;
    ensureMeta();
    if(!S.azInstall){S.azInstall=Date.now();persistLocal();mzTrack('install')}
    const day=new Date().toISOString().slice(0,10);
    if(S.azOpen!==day){S.azOpen=day;persistLocal();mzTrack('app_open')}
  }

  async function adoptAccountFromCloud(){
    if(!sb||!user) return;
    const lang=S&&S.lang;
    if(isOffline()) throw new Error('offline');
    const {data,error}=await sb.from('user_state').select('payload,updated_at').eq('user_id',user.id).maybeSingle();
    if(error) throw error;
    Object.keys(S||{}).forEach(k=>{delete S[k]});
    if(lang) S.lang=lang;
    S.workouts=[];S.body=[];S.custom=[];S.templates=[];S.eqProfiles=[];
    S.deletedWorkouts=[];S.deletedBody=[];S.deletedCustom=[];S.deletedTemplates=[];S.deletedEqProfiles=[];
    if(data&&data.payload) applyRemoteFresh(data.payload);
    S.ownerUid=user.id;
    persistLocal();
    if(!data) await pushNow();
    else {lastAt=S.updatedAt||Date.now();status='ok'}
  }
  function clearBodyPhotos(){
    try{
      if(typeof idb!=='undefined'&&idb&&idb.all) return idb.all().then(async o=>{for(const k of Object.keys(o||{})) try{await idb.del(k)}catch(e){}});
    }catch(e){}
    return Promise.resolve();
  }
  const GUEST_COPY_KEY='gym_guest_copy',GUEST_IDB='moyzal_guest';
  function guestIdbPut(list){
    if(typeof indexedDB==='undefined') return Promise.resolve();
    return new Promise(res=>{
      try{
        const r=indexedDB.open(GUEST_IDB,1);
        r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains('history'))db.createObjectStore('history')};
        r.onerror=()=>res();
        r.onsuccess=()=>{
          try{
            const db=r.result;
            db.onversionchange=()=>{try{db.close()}catch(e){}};
            const t=db.transaction('history','readwrite');
            t.objectStore('history').put(list||[],'workouts');
            t.oncomplete=()=>{try{db.close()}catch(e){} res()};t.onerror=()=>{try{db.close()}catch(e){} res()};
          }catch(e){res()}
        };
      }catch(e){res()}
    });
  }
  async function snapshotUnboundGuest(){
    let hist=Array.isArray(S.workouts)?S.workouts.slice():[];
    try{if(typeof idb!=='undefined'&&idb&&idb.histGet){const h=await idb.histGet();if(Array.isArray(h)&&h.length) hist=h}}catch(e){}
    const snap=JSON.parse(JSON.stringify(Object.assign({},S,{workouts:hist})));
    try{localStorage.setItem(GUEST_COPY_KEY,JSON.stringify(snap))}catch(e){}
    try{await guestIdbPut(hist)}catch(e){}
  }
  async function finishSignedIn(){
    toast(status==='err'?'Вход выполнен, но синхронизация не удалась: '+lastErr:'Вход выполнен. Данные синхронизируются');
    if(view==='more') more();
    if(view==='auth'||view==='transfer') go('today');
  }
  async function transferGuestToAccount(){
    ensureMeta();persistLocal();
    protectGuestOnAuth=false;
    await sync();
    await finishSignedIn();
  }
  function showTransferDialog(){
    view='transfer';
    // While the choice is open, background sync (timer, return to the app, network back) must not merge or push guest data.
    protectGuestOnAuth=true;
    $('#title').textContent='Вход';$('#nav').classList.add('hidden');
    app.innerHTML=`<div class="card" id="mztransfer"><p style="margin-top:0"><b>Перенести данные в аккаунт?</b></p>
      <p class="mut">В аккаунте уже есть данные. На этом устройстве есть данные, сохранённые без входа.</p>
      <button class="pri full" id="mzmerge">Объединить с аккаунтом</button>
      <button class="full" id="mzkeep" style="margin-top:8px">Не переносить</button>
      <p class="mut" style="font-size:12px;margin:8px 0 0">Если не переносить, копия этих данных останется на устройстве.</p></div>`;
    let busy=false;
    if($('#mzmerge')) $('#mzmerge').onclick=()=>{if(busy)return;busy=true;transferGuestToAccount()};
    if($('#mzkeep')) $('#mzkeep').onclick=async()=>{
      if(busy) return;busy=true;
      try{await snapshotUnboundGuest();await adoptAccountFromCloud()}
      catch(e){busy=false;status='err';lastErr=friendly(e);toast('Не удалось загрузить данные аккаунта: '+lastErr);return}
      protectGuestOnAuth=false;
      await finishSignedIn();
    };
  }
  async function afterAuth(){
    markAuthed();
    // Previous signed-in user's data on this device is never offered to another account and must not be visible.
    if(foreignData()){
      try{await clearBodyPhotos();await adoptAccountFromCloud()}
      catch(e){status='err';lastErr=friendly(e);toast('Не удалось загрузить данные аккаунта: '+lastErr);authView();return}
      await finishSignedIn();
      return;
    }
    if(isUnboundGuest()){
      // Empty account: transfer guest data with no question. Account already has data: ask with explicit buttons (not confirm()).
      let remote=null;
      if(!isOffline()&&sb){
        try{
          const {data,error}=await sb.from('user_state').select('payload,updated_at').eq('user_id',user.id).maybeSingle();
          if(error) throw error;
          remote=data||null;
        }catch(e){status='err';lastErr=friendly(e);toast('Не удалось загрузить данные аккаунта: '+lastErr);return}
      }
      if(!remote||!remoteHasData(remote.payload||{})){
        await transferGuestToAccount();
        return;
      }
      showTransferDialog();
      return;
    }
    ensureMeta();persistLocal();
    await sync();
    await finishSignedIn();
  }
  function creds(){
    return {email:($('#mzemail')&&$('#mzemail').value||'').trim()};
  }
  function msg(t){const n=$('#mzmsg');if(n) n.textContent=t;else toast(t)}
  async function doMagic(){
    if(!sb) return msg('Облако недоступно');
    const {email}=creds();
    if(!email||!email.includes('@')) return msg('Укажи почту');
    msg('…');
    const {error}=await sb.auth.signInWithOtp({email,options:{emailRedirectTo:appUrl(),shouldCreateUser:true}});
    if(error) return msg(friendly(error));
    const box=$('#mzotpbox');if(box) box.classList.remove('hidden');
    msg('Письмо отправлено. Введи код из письма');
  }
  async function doOtp(){
    if(!sb) return;
    const {email}=creds();
    const token=($('#mzotp')&&$('#mzotp').value||'').trim();
    if(!email||token.length<6) return msg('Введи почту и код из 6 цифр');
    msg('…');
    const {data,error}=await sb.auth.verifyOtp({email,token,type:'email'});
    if(error) return msg(friendly(error));
    user=data.user;await afterAuth();
  }
  function hasUnsyncedWorkouts(){
    return (S.updatedAt||0)>(lastAt||0);
  }
  let logoutWipe=false;
  function resetLocalState(){
    const lang=S&&S.lang;
    try{Object.keys(S||{}).forEach(k=>{delete S[k]})}catch(e){}
    if(lang) S.lang=lang;
    S.workouts=[];S.body=[];S.custom=[];S.templates=[];S.eqProfiles=[];
    S.deletedWorkouts=[];S.deletedBody=[];S.deletedCustom=[];S.deletedTemplates=[];S.deletedEqProfiles=[];
  }
  async function finishLogout(clearLocal){
    clearTimeout(timer);
    try{if(sb) await sb.auth.signOut()}catch(e){}
    user=null;status='off';
    try{localStorage.removeItem(AUTH_FLAG)}catch(e){}
    if(clearLocal){
      try{if(typeof clearLocalData==='function') await clearLocalData()}catch(e){}
      resetLocalState();
      toast('Выход выполнен. Данные остаются в облаке и вернутся после входа');
    }else{
      toast('Выход выполнен');
    }
    resetSyncHold();
    authView();
  }
  function showUnsyncedLogout(){
    const wipe=logoutWipe;
    const lead=wipe?'Есть тренировки, которые ещё не сохранены в облаке. Очистка удалит их с этого телефона. Аккаунт и облако не изменятся.':'Есть тренировки, которые ещё не сохранены в облаке';
    app.innerHTML=`<div class="card" id="mzunsynced"><p style="margin-top:0">${lead}</p>
      <p class="mut">Если на этом устройстве войдёт другой аккаунт, несохранённые тренировки и фото тела удалятся.</p>
      <button class="pri full" id="mzwaitsync">Подождать синхронизацию</button>
      <button class="full" id="mzoutanyway" style="margin-top:8px">Выйти всё равно</button>
      ${wipe?'<button class="full" id="mzclearcancel" style="margin-top:8px">Отмена</button>':''}</div>`;
    if($('#mzwaitsync')) $('#mzwaitsync').onclick=async()=>{
      if(wipe) releaseSync();
      if(!isOffline()) await syncNow();
      if(wipe) holdSync();
      if(hasUnsyncedWorkouts()){toast('Синхронизация не удалась. Данные на устройстве на месте');return}
      await finishLogout(true);
    };
    if($('#mzoutanyway')) $('#mzoutanyway').onclick=()=>finishLogout(!!wipe);
    if($('#mzclearcancel')) $('#mzclearcancel').onclick=()=>{logoutWipe=false;resetSyncHold();if(typeof more==='function')more()};
  }
  async function doLogout(opts){
    logoutWipe=!!(opts&&opts.wipeLocal);
    clearTimeout(timer);
    if(user&&!isOffline()) await sync(); // D-253: last changes go to the cloud before signing out
    if(logoutWipe) holdSync();
    if(hasUnsyncedWorkouts()){showUnsyncedLogout();return}
    await finishLogout(true);
  }
  // Удаление данных в облаке. Возвращает:
  //  'none'    — входа нет, в облаке удалять нечего;
  //  'account' — удалены и данные, и аккаунт;
  //  'data'    — данные удалены, аккаунт (почта для входа) остался;
  //  'fail'    — удалить не удалось (нет сети, ошибка сервера). Локальные данные при этом трогать нельзя.
  // supabase-js не бросает исключение при ошибке, а возвращает её в поле error — его и проверяем.
  async function mzDeleteCloud(){
    if(!sb||!user) return 'none';
    holdSync();
    try{
    if(isOffline()) return 'offline';
    let res='fail', err=null;
    const once=async()=>{
      try{const {error}=await sb.rpc('delete_my_account');if(!error) return 'account';err=error}catch(e){err=e}
      return 'fail';
    };
    res=await once();
    // One automatic retry on a server error. A network failure is reported as-is, without a second attempt.
    if(res==='fail'&&!(isOffline()||netErr(err))) res=await once();
    // Lost response: the server may already have written the tombstone. Never delete user_state by itself.
    if(res==='fail'){
      try{const {data,error}=await sb.rpc('account_is_deleted');if(!error&&data===true) res='account';else if(error) err=err||error}catch(e){err=err||e}
    }
    if(res==='fail') return (isOffline()||netErr(err))?'offline':'fail';
    clearTimeout(timer);
    try{await sb.auth.signOut({scope:'local'})}catch(e){}
    // На случай, если signOut не сработал (аккаунт уже удалён): убираем сохранённую сессию вручную.
    try{Object.keys(localStorage).filter(k=>/^sb-.*-auth-token/.test(k)).forEach(k=>localStorage.removeItem(k))}catch(e){}
    user=null;status='off';
    try{localStorage.removeItem(AUTH_FLAG)}catch(e){}
    return res;
    }finally{releaseSync()}
  }
  window.mzDeleteCloud=mzDeleteCloud;

  function statusText(){
    if(!READY) return 'Облако недоступно';
    if(!user) return 'Нужен вход';
    if(status==='syncing') return 'Синхронизация…';
    if(status==='offline') return 'Нет сети — работаем офлайн, синхронизируется позже';
    if(status==='err') return 'Синхронизация не удалась: '+lastErr;
    if(status==='ok'&&lastAt) return 'Синхронизировано '+new Date(lastAt).toLocaleString(typeof LOC!=='undefined'?LOC:undefined);
    return 'Вход выполнен';
  }
  // D-290: compact «Аккаунт» menu row — email or «Не выполнен вход», plus a short sync status.
  function mzAccountRowStatus(){
    const email=(user&&user.email)||'';
    const who=email||'Не выполнен вход';
    let sync='';
    if(status==='offline') sync='Нет сети';
    else if(status==='err') sync='Ошибка синхронизации';
    else if(status==='syncing') sync='Синхронизация…';
    else if(email||status==='ok') sync='Синхронизировано';
    return sync?who+' · '+sync:who;
  }
  window.mzAccountRowStatus=mzAccountRowStatus;
  function accountHTML(){
    const az=!!(S.consentAnalytics&&S.consentAnalytics.v);
    const azLab=`<label class="li"><span class="grow">Анонимная аналитика<br><span class="mut">Короткие события (открытие, онбординг, показ оплаты) без имени, почты и тренировок</span></span><input type="checkbox" id="mzaz" style="width:28px;min-height:28px" ${az?'checked':''}></label>`;
    if(user){
      return `<div class="card" id="mzacc"><b>☁️ Аккаунт и синхронизация</b>
        <p class="mut" style="margin:4px 0">Вход: ${esc(user.email||'')}</p>
        <p class="mut" id="mzst">${esc(statusText())}</p>
        <p class="mut" style="font-size:12px;margin:0 0 8px">Синхронизация автоматическая: при открытии приложения, после тренировки и изменений, при появлении сети.</p>
        <button class="full" id="mzout">Выйти</button>
        <p class="mut" style="font-size:12px;margin-top:8px">При выходе данные остаются в облаке и вернутся после входа. Фото тела хранятся только на этом устройстве.</p>
        ${azLab}</div>`;
    }
    // Eduards 20.11: sign-in only with Google or an email code (no password, no «forgot password»); one block on the sign-in screen.
    // Accounts created with a password sign in with the code too — same account, same data.
    return `<div class="card" id="mzacc">
      <p class="mut" style="margin:0 0 8px">Введи почту — пришлём код из 6 цифр. Новый аккаунт создастся автоматически.</p>
      <input id="mzemail" type="email" autocomplete="email" inputmode="email" placeholder="Почта" aria-label="Почта">
      <button class="pri full" id="mzcode" style="margin-top:8px">Получить код на почту</button>
      <div id="mzotpbox" class="hidden" style="margin-top:8px">
        <input id="mzotp" inputmode="numeric" autocomplete="one-time-code" placeholder="Код из письма" aria-label="Код из письма">
        <button class="pri full" id="mzotpgo" style="margin-top:8px">Подтвердить код</button>
      </div>
      <p class="mut" id="mzmsg" style="margin-top:8px"></p>
      ${azLab}</div>`;
  }
  function bindAccount(){
    const az=$('#mzaz');
    if(az) az.onchange=e=>{
      S.consentAnalytics=e.target.checked?{v:1,at:new Date().toISOString()}:null;
      if(!e.target.checked) delete S.installId;
      save();
      if(e.target.checked) bootAnalytics();
      toast(e.target.checked?'Аналитика включена':'Аналитика выключена');
    };
    if($('#mzout')) $('#mzout').onclick=doLogout;
    if($('#mzcode')) $('#mzcode').onclick=doMagic;
    if($('#mzotpgo')) $('#mzotpgo').onclick=doOtp;
  }
  function inject(){
    const html=accountHTML();
    if($('#mzacc')) {$('#mzacc').outerHTML=html;bindAccount();return}
    const prem=$('#pwopen')&&$('#pwopen').closest('.card');
    if(prem) prem.insertAdjacentHTML('afterend',html);
    else {
      const ver=[...app.querySelectorAll('p.mut')].pop();
      if(ver) ver.insertAdjacentHTML('beforebegin',html);
      else app.insertAdjacentHTML('beforeend',html);
    }
    bindAccount();
  }
  function paint(){
    const st=$('#mzst');if(st) st.textContent=statusText();
  }

  // Sign-in is required: no guest / «continue without signing in» path. Supabase keeps the session in localStorage,
  // so after one sign-in the app opens offline without signing in again. Guest local data is kept and not overwritten.
  function storedSession(){
    try{
      const ls=localStorage;if(ls.getItem(AUTH_FLAG)) return true;
      // A session saved by an older version (before the flag existed) also counts; remember it so a failed refresh never brings the sign-in back.
      if(ls.getItem(AUTH_KEY)){ls.setItem(AUTH_FLAG,'1');return true}
    }catch(e){}
    return false;
  }
  function needAuth(){return !user&&!storedSession()}
  // Returning from an email link / OAuth: the session is still being restored — show «Вход…» instead of the form.
  function authInUrl(){try{return /[?&](code|token_hash)=/.test(location.search||'')||/access_token=/.test(location.hash||'')}catch(e){return false}}
  function authWaitView(){view='auth';$('#title').textContent='Вход';$('#nav').classList.add('hidden');app.innerHTML='<div class="card" id="mzwait"><p class="mut" style="margin:0">Вход…</p></div>'}
  // D-265: Android app (Capacitor). Google forbids sign-in inside the app WebView, and the WebView used to hand the whole
  // OAuth flow to the external browser — which returned to the website there (without the app's PKCE verifier), not to the app.
  // Now: Google opens in an in-app Custom Tab; Supabase returns to the bounce page auth-callback.html on the site,
  // which hands ?code= back to the app via app.gymcaptain://auth-callback; the app exchanges the code (PKCE) itself.
  const NATIVE_CB='https://eduardsbor.github.io/gym-app/auth-callback.html';
  const NATIVE_SCHEME='app.gymcaptain://auth-callback';
  function capPlugin(n){try{const C=window.Capacitor;if(!C||typeof C.isNativePlatform!=='function'||!C.isNativePlatform())return null;return (C.Plugins&&C.Plugins[n])||null}catch(e){return null}}
  function isNativeApp(){try{const C=window.Capacitor;return !!(C&&typeof C.isNativePlatform==='function'&&C.isNativePlatform())}catch(e){return false}}
  let nativeCodeSeen='';
  async function handleNativeAuthUrl(url){
    if(!url||String(url).indexOf(NATIVE_SCHEME)!==0) return false;
    let u;try{u=new URL(String(url).replace(/^app\.gymcaptain:\/\//,'https://app.gymcaptain/'))}catch(e){return false}
    const B=capPlugin('Browser');if(B&&B.close){try{await B.close()}catch(e){}}
    const hp=new URL('https://x/?'+(u.hash||'').replace(/^#/,'')).searchParams;
    const code=u.searchParams.get('code');
    const err=u.searchParams.get('error_description')||hp.get('error_description')||u.searchParams.get('error')||hp.get('error');
    if(!code){if(err){if(view==='auth')msg(friendly(err));else toast(friendly(err))}return true}
    if(code===nativeCodeSeen) return true;
    nativeCodeSeen=code;
    if(!sb) return true;
    if(view==='auth') msg('…');
    const {data,error}=await sb.auth.exchangeCodeForSession(code);
    if(error){if(view==='auth')msg(friendly(error));else toast(friendly(error));return true}
    user=data&&data.session&&data.session.user||data&&data.user||null;
    if(user){markAuthed();await afterAuth()}
    return true;
  }
  function bootNativeAuth(){
    const A=capPlugin('App');if(!A) return;
    try{if(A.addListener) A.addListener('appUrlOpen',e=>{handleNativeAuthUrl(e&&e.url)})}catch(e){}
    try{if(A.getLaunchUrl) Promise.resolve(A.getLaunchUrl()).then(r=>{if(r&&r.url)handleNativeAuthUrl(r.url)}).catch(()=>{})}catch(e){}
  }
  async function doGoogle(){
    if(!sb) return msg('Облако недоступно');
    msg('…');
    if(isNativeApp()){
      const B=capPlugin('Browser');
      const {data,error}=await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:NATIVE_CB,skipBrowserRedirect:!!B}});
      if(error) return msg(friendly(error));
      if(B&&data&&data.url){try{await B.open({url:data.url})}catch(e){msg(friendly(e))}}
      return;
    }
    const {error}=await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:appUrl()}});
    if(error) msg(friendly(error));
  }
  function authView(){
    view='auth';
    $('#title').textContent='Вход';$('#nav').classList.add('hidden');
    const off=typeof navigator!=='undefined'&&navigator.onLine===false;
    const locked=!READY;
    const googleBtn=(!locked&&CFG&&CFG.googleAuth)?'<button class="pri full" id="mzgoogle" style="margin:4px 0 0;padding:16px;font-size:18px;font-weight:700">Войти через Google</button><p class="mut" id="mzgnote" style="margin:6px 0 12px;text-align:center">Новый аккаунт создастся автоматически</p>':'';
    app.innerHTML=`<div class="card" id="mzgate"><h2 style="margin-top:0">Вход</h2>
      ${googleBtn}
      <p class="mut" style="margin:0">Войди или создай аккаунт: программа, история и рекорды сохранятся в облаке. Данные, которые уже есть на этом устройстве, не пропадут.</p></div>
      ${locked?'<div class="card" id="mzcloudoff"><p class="mut" style="margin:0">Облако недоступно. Вход сейчас невозможен. Попробуй позже.</p></div>':accountHTML()}
      <p class="mut" id="mzlegal" style="font-size:12px;text-align:center;margin:4px 0 16px"><a href="privacy.html" target="_blank" rel="noopener" style="color:inherit">Конфиденциальность</a> · <a href="terms.html" target="_blank" rel="noopener" style="color:inherit">Условия</a></p>
      ${off&&!locked?'<div class="card" id="mznetoff"><p class="mut" style="margin-top:0">Нет сети. Войти можно, когда появится интернет.</p></div>':''}`;
    if(!locked) bindAccount();
    if($('#mzgoogle')) $('#mzgoogle').onclick=doGoogle;
  }
  window.mzNeedAuth=needAuth;window.mzFriendly=friendly;window.mzPayloadForUpload=payloadForUpload;window.mzToastTrimmedCopy=toastTrimmedCopy;window.USER_STATE_MAX=USER_STATE_MAX;window.mzHasLocalData=hasLocalData;window.mzIsUnboundGuest=isUnboundGuest;window.mzDoLogout=doLogout;window.mzHasUnsyncedWorkouts=hasUnsyncedWorkouts;window.mzFinishLogout=finishLogout;window.mzKeepEarliestDemo=keepEarliestDemo;window.mzMergeLists=mergeLists;window.mzMergePg=mergePg;window.mzGuestCopyKey=GUEST_COPY_KEY;window.mzGuestIdbName=GUEST_IDB;window.mzSnapshotUnboundGuest=snapshotUnboundGuest;window.mzHoldSync=holdSync;window.mzReleaseSync=releaseSync;window.mzSyncHold=()=>syncHold;
  if(typeof render==='function'){
    const _render=render;
    render=function(){
      if(needAuth()&&view!=='legal') return !authReady&&authInUrl()?authWaitView():authView();
      if(view==='auth') view='today';
      return _render();
    };
  }

  if(typeof more==='function'){const _more=more;more=function(){if(needAuth())return authView();_more();inject()}}
  if(typeof wipeAll==='function'){
    wipeAll=async function(){
      if(!confirm('Удалить ВСЕ данные: тренировки, программу, замеры, фото и настройки?')) return;
      if(!confirm('Это необратимо. Сначала можно скачать копию. Точно удалить всё без возможности восстановления?')) return;
      holdSync();
      let cloud='fail';
      try{cloud=await mzDeleteCloud()}catch(e){cloud=(isOffline()||netErr(e))?'offline':'fail'}
      if(cloud==='fail'||cloud==='offline'){
        releaseSync();
        // Облако не очищено: локальные данные оставляем, иначе после перезагрузки они вернутся из облака.
        alert(cloud==='offline'
          ?'Нет сети. Аккаунт не удалён. Данные в облаке и на этом устройстве на месте. Повтори, когда появится интернет.'
          :'Сервер не подтвердил удаление аккаунта. Данные в облаке и на этом устройстве пока не удалены. Нажми «Удалить аккаунт» ещё раз.');
        return;
      }
      try{
        if(typeof clearLocalData==='function') await clearLocalData();
        else{
          localStorage.removeItem('gym');
          try{if(typeof idb!=='undefined'&&idb&&idb.close)idb.close()}catch(e){}
          await new Promise(r=>{const q=indexedDB.deleteDatabase('moyzal');q.onsuccess=q.onerror=q.onblocked=()=>r()});
        }
        try{localStorage.removeItem(GUEST_COPY_KEY)}catch(e){}
        try{await new Promise(r=>{const q=indexedDB.deleteDatabase(GUEST_IDB);q.onsuccess=q.onerror=q.onblocked=()=>r()})}catch(e){}
        // Кэш сервис-воркера мог содержать ответы сервера с личными данными (версии до v39).
        if(window.caches){const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}
      }catch(e){}
      resetLocalState(); // QA-13: и в памяти тоже
      resetSyncHold();
      authView();
      location.reload();
    };
  }
  if(typeof paywall==='function'){
    const _pw=paywall;
    paywall=function(reason,o){const r=_pw(reason,o);if(r!==false)mzTrack('paywall_shown',{reason:String(reason||'').slice(0,80)});return r};
  }
  document.addEventListener('click',e=>{if(e.target.closest('#pwbuy')) mzTrack('trial_start',{demo:1})});

  function stripAuthParams(){
    try{
      const u=new URL(location.href);
      let dirty=false;
      ['code','token_hash','type','next','error','error_description','error_code'].forEach(k=>{if(u.searchParams.has(k)){u.searchParams.delete(k);dirty=true}});
      const h=u.hash.replace(/^#/,'');
      if(/access_token|refresh_token|type=recovery/.test(h)){u.hash='';dirty=true}
      if(dirty) history.replaceState({},'',u.pathname+u.search+u.hash);
    }catch(e){}
  }

  async function init(){
    if(!READY){status='off';return}
    storedSession(); // remember a saved session before Supabase may drop it after a failed refresh
    sb=supabase.createClient(CFG.url,CFG.anon,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce',storageKey:AUTH_KEY}
    });
    sb.auth.onAuthStateChange(async(ev,session)=>{
      user=session&&session.user||null;
      // SIGNED_OUT after a failed refresh does NOT clear the sign-in flag: only «Выйти» and account deletion do.
      if(user) markAuthed();
    });
    // An expired access token is refreshed here with the refresh token; a network error keeps the saved session.
    try{const {data}=await sb.auth.getSession();user=data&&data.session&&data.session.user||null}catch(e){user=null}
    authReady=true;
    stripAuthParams();
    bootNativeAuth();
    adoptLS();
    if(ensureMeta()) persistLocal();
    seedFirstWorkoutFlag();
    bootAnalytics();
    if(user){markAuthed();if(view==='auth') afterAuth();else sync()}
    else if(view==='auth'&&typeof render==='function') render();
    // Started offline with a saved session: restore it in the background when the network is back.
    window.addEventListener('online',async()=>{
      if(!user&&storedSession()){try{const {data}=await sb.auth.getSession();user=data&&data.session&&data.session.user||null}catch(e){}}
      if(user){markAuthed();sync()}
    });
    if(typeof document!=='undefined'&&document.addEventListener) document.addEventListener('visibilitychange',()=>{if(user&&(document.visibilityState==='visible'||document.visibilityState==='hidden'))syncNow()});
    // D-253b: also when the app is minimised or closed (hidden / pagehide) — the same sync(), single-flight, silent without sign-in or network.
    window.addEventListener('pagehide',()=>{if(user)syncNow()});
    setInterval(()=>{if(user&&!(typeof document!=='undefined'&&document.visibilityState==='hidden'))sync()},SYNC_EVERY);
  }
  init();
})();
