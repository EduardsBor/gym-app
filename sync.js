'use strict';
// Stage 2: optional account, offline-first sync to Supabase (EU), opt-in analytics.
(function(){
  const CFG=window.MZ_SB||(typeof MZ_SB!=='undefined'?MZ_SB:null);const READY=!!(CFG&&CFG.url&&CFG.anon&&window.supabase&&supabase.createClient);
  let sb=null,user=null,status='off',lastErr='',lastAt=0,timer=0,syncing=false;

  function appUrl(){
    try{const u=new URL(location.href);return u.origin+u.pathname.replace(/index\.html$/,'')}
    catch(e){return 'https://eduardsbor.github.io/gym-app/'}
  }
  function friendly(err){
    const m=(err&&(err.message||err.error_description||err))+'';
    const map=[
      [/invalid login credentials/i,'Неверная почта или пароль'],
      [/email not confirmed/i,'Подтверди почту — мы отправили письмо'],
      [/already registered/i,'Такой аккаунт уже есть — войди'],
      [/password should be at least/i,'Пароль не короче 6 символов'],
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
    return !!(S.program||(S.workouts&&S.workouts.length)||(S.body&&S.body.length)||S.goal);
  }
  function ensureMeta(){
    let ch=false;
    if(!S.installId){S.installId=nid();ch=true}
    if(!S.updatedAt){S.updatedAt=hasLocalData()?Date.now():0;ch=true}
    S.deletedWorkouts=S.deletedWorkouts||[];
    S.deletedBody=S.deletedBody||[];
    S.deletedCustom=S.deletedCustom||[];
    return ch;
  }
  function persistLocal(){
    if(typeof S_RO!=='undefined'&&S_RO) return;
    try{localStorage.setItem('gym',JSON.stringify(S))}catch(e){}
  }
  // Отпечаток программы: по его изменению ставим отдельную метку времени progAt,
  // чтобы правка настроек на одном устройстве не затирала новую программу с другого.
  function progSigOf(){try{return JSON.stringify([S.program||null,S.prof||null,S.progName||null])}catch(e){return ''}}
  let progSig=progSigOf();
  // Локальные данные принадлежат другому аккаунту (вход сменили на этом устройстве).
  function foreignData(){return !!(user&&S.ownerUid&&S.ownerUid!==user.id&&hasLocalData())}
  function adoptLS(){
    try{const cur=JSON.parse(localStorage.getItem('gym')||'null');if(cur) Object.keys(cur).forEach(k=>{S[k]=cur[k]})}catch(e){}
  }
  function payloadOf(src){
    const p=JSON.parse(JSON.stringify(src));
    delete p.ownerPremium;delete p.active;delete p.tEnd;delete p.ownerUid;
    // Данные о здоровье (замеры, рост, вес тела, возраст) уходят в облако только при явном согласии.
    if(!p.consentHealth){delete p.body;delete p.height;delete p.weightKg;delete p.age}
    return p;
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
  function applyRemoteFresh(R){
    const keepOwner=S.ownerPremium,keepActive=S.active,keepTEnd=S.tEnd,installId=S.installId;
    const az=S.consentAnalytics,lang=S.lang;
    Object.keys(R).forEach(k=>{S[k]=R[k]});
    S.ownerPremium=keepOwner;
    if(keepActive) S.active=keepActive;
    if(keepTEnd) S.tEnd=keepTEnd;
    if(installId) S.installId=installId;
    if(az&&!S.consentAnalytics) S.consentAnalytics=az;
    if(lang&&!S.lang) S.lang=lang;
    if(typeof migrateLegacyPlans==='function') migrateLegacyPlans();
  }
  function applyMerged(R,remoteAt){
    const keepOwner=S.ownerPremium,keepActive=S.active,keepTEnd=S.tEnd;
    const w=mergeLists(S.workouts,R.workouts,S.deletedWorkouts,R.deletedWorkouts,'id',x=>x.end||x.start||0);
    const b=mergeLists(S.body,R.body,S.deletedBody,R.deletedBody,'id',x=>Date.parse(x.date||'')||0);
    const c=mergeLists(S.custom,R.custom,S.deletedCustom,R.deletedCustom,'id',x=>+(String(x.id).replace(/\D/g,'')||0));
    const localNewer=(S.updatedAt||0)>=(remoteAt||0);
    const pick=(k)=>{
      if(localNewer) return S[k]!==undefined?S[k]:R[k];
      return R[k]!==undefined?R[k]:S[k];
    };
    S.workouts=w.list;S.deletedWorkouts=w.deleted;
    if(S.consentHealth||R.consentHealth){S.body=b.list;S.deletedBody=b.deleted}
    S.custom=c.list;S.deletedCustom=c.deleted;
    // Программа сравнивается по своей метке progAt; если её нет ни там, ни там — по общей updatedAt, как раньше.
    const progLocal=(S.progAt||R.progAt)?(S.progAt||0)>=(R.progAt||0):localNewer;
    ['program','progName','why','prof','goal','days'].forEach(k=>{
      const v=progLocal?(S[k]!==undefined?S[k]:R[k]):(R[k]!==undefined?R[k]:S[k]);
      if(v!==undefined) S[k]=v;
    });
    const pa=Math.max(S.progAt||0,R.progAt||0);if(pa) S.progAt=pa;
    ['next','lang','sound','wake','autoW','restOverride','premium','consentHealth','consentAnalytics','obDone','obOffer','schema','v','weightAsked','ageAsked'].forEach(k=>{
      const v=pick(k);if(v!==undefined) S[k]=v;
    });
    if(S.consentHealth||R.consentHealth){['height','weightKg','age'].forEach(k=>{const h=pick(k);if(h!==undefined) S[k]=h})}
    S.ownerPremium=keepOwner;
    if(keepActive) S.active=keepActive;
    if(keepTEnd) S.tEnd=keepTEnd;
    if(typeof migrateLegacyPlans==='function') migrateLegacyPlans();
    S.updatedAt=Math.max(S.updatedAt||0,remoteAt||0,Date.now());
  }
  async function pushNow(){
    if(!sb||!user) return;
    ensureMeta();
    S.updatedAt=Date.now();
    const {error}=await sb.from('user_state').upsert({
      user_id:user.id,
      payload:payloadOf(S),
      updated_at:new Date(S.updatedAt).toISOString()
    });
    if(error) throw error;
    persistLocal();
    lastAt=Date.now();
  }
  async function pullAndMerge(){
    if(!sb||!user) return;
    const {data,error}=await sb.from('user_state').select('payload,updated_at').eq('user_id',user.id).maybeSingle();
    if(error) throw error;
    if(!data){await pushNow();return}
    const remoteAt=data.updated_at?Date.parse(data.updated_at):0;
    const R=data.payload||{};
    if(!hasLocalData()) applyRemoteFresh(R);
    else applyMerged(R,remoteAt);
    progSig=progSigOf(); // программа из облака — не «локальная правка», метку progAt не трогаем
    persistLocal();
    await pushNow();
  }
  async function sync(){
    if(!READY||!user||syncing) return;
    if(typeof navigator!=='undefined'&&navigator.onLine===false){status='offline';paint();return}
    if(foreignData()){status='err';lastErr='на устройстве данные другого аккаунта. Выйди и войди заново';paint();return}
    syncing=true;status='syncing';lastErr='';paint();
    try{await pullAndMerge();status='ok';if(S.ownerUid!==user.id){S.ownerUid=user.id;persistLocal()}}
    catch(e){status='err';lastErr=friendly(e)}
    syncing=false;paint();
  }
  function schedule(){
    if(!user) return;
    S.updatedAt=Date.now();
    persistLocal();
    clearTimeout(timer);
    timer=setTimeout(()=>sync(),2000);
  }
  window.mzOnSave=function(){
    const sg=progSigOf();if(sg!==progSig){progSig=sg;S.progAt=Date.now()}
    if(S.obDone&&!S._azOb){S._azOb=1;persistLocal();mzTrack('onboarding_done')}
    schedule();
  };

  function canTrack(){return !!(S.consentAnalytics&&S.consentAnalytics.v)}
  async function mzTrack(name,props){
    if(!canTrack()||!READY||!sb) return;
    try{
      ensureMeta();
      await sb.from('events').insert({name,install_id:S.installId,props:props||{},user_id:user?user.id:null});
    }catch(e){}
  }
  window.mzTrack=mzTrack;
  function bootAnalytics(){
    if(!canTrack()) return;
    ensureMeta();
    if(!S.azInstall){S.azInstall=Date.now();persistLocal();mzTrack('install')}
    const day=new Date().toISOString().slice(0,10);
    if(S.azOpen!==day){S.azOpen=day;persistLocal();mzTrack('app_open')}
  }

  async function afterAuth(){
    if(foreignData()){
      if(confirm('На этом устройстве сохранены данные другого аккаунта. Объединить их с этим аккаунтом?\n\nОК — объединить. Отмена — выйти, данные останутся как есть.')) S.ownerUid=user.id;
      else{await doLogout();return}
    }
    ensureMeta();persistLocal();
    await sync();
    toast(status==='err'?'Вход выполнен, но синхронизация не удалась: '+lastErr:'Вход выполнен. Данные синхронизируются');
    if(view==='more') more();
  }
  function creds(){
    return {email:($('#mzemail')&&$('#mzemail').value||'').trim(),password:($('#mzpass')&&$('#mzpass').value)||''};
  }
  function msg(t){const n=$('#mzmsg');if(n) n.textContent=t;else toast(t)}
  async function doSignup(){
    if(!sb) return msg('Облако недоступно');
    const {email,password}=creds();
    if(!email||!email.includes('@')) return msg('Укажи почту');
    if(password.length<6) return msg('Пароль не короче 6 символов');
    msg('…');
    const {data,error}=await sb.auth.signUp({email,password,options:{emailRedirectTo:appUrl()}});
    if(error) return msg(friendly(error));
    if(data.session){user=data.session.user;await afterAuth()}
    else msg('Проверь почту и подтверди аккаунт, затем войди');
  }
  async function doLogin(){
    if(!sb) return msg('Облако недоступно');
    const {email,password}=creds();
    if(!email||!password) return msg('Укажи почту и пароль');
    msg('…');
    const {data,error}=await sb.auth.signInWithPassword({email,password});
    if(error) return msg(friendly(error));
    user=data.user;await afterAuth();
  }
  async function doMagic(){
    if(!sb) return msg('Облако недоступно');
    const {email}=creds();
    if(!email||!email.includes('@')) return msg('Укажи почту');
    msg('…');
    const {error}=await sb.auth.signInWithOtp({email,options:{emailRedirectTo:appUrl(),shouldCreateUser:true}});
    if(error) return msg(friendly(error));
    const box=$('#mzotpbox');if(box) box.classList.remove('hidden');
    msg('Письмо отправлено. Нажми ссылку или введи код из письма');
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
  async function doReset(){
    if(!sb) return;
    const {email}=creds();
    if(!email||!email.includes('@')) return msg('Укажи почту');
    msg('…');
    const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:appUrl()});
    if(error) return msg(friendly(error));
    msg('Если аккаунт есть, отправили письмо для смены пароля');
  }
  async function doLogout(){
    try{await sb.auth.signOut()}catch(e){}
    user=null;status='off';
    toast('Выход выполнен. Данные на этом устройстве на месте');
    if(view==='more') more();
  }
  // Удаление данных в облаке. Возвращает:
  //  'none'    — входа нет, в облаке удалять нечего;
  //  'account' — удалены и данные, и аккаунт;
  //  'data'    — данные удалены, аккаунт (почта для входа) остался;
  //  'fail'    — удалить не удалось (нет сети, ошибка сервера). Локальные данные при этом трогать нельзя.
  // supabase-js не бросает исключение при ошибке, а возвращает её в поле error — его и проверяем.
  async function mzDeleteCloud(){
    if(!sb||!user) return 'none';
    let res='fail';
    try{const {error}=await sb.rpc('delete_my_account');if(!error) res='account'}catch(e){}
    if(res==='fail'){
      try{const {error}=await sb.from('user_state').delete().eq('user_id',user.id);if(!error) res='data'}catch(e){}
    }
    if(res==='fail') return res;
    clearTimeout(timer);
    try{await sb.auth.signOut({scope:'local'})}catch(e){}
    // На случай, если signOut не сработал (аккаунт уже удалён): убираем сохранённую сессию вручную.
    try{Object.keys(localStorage).filter(k=>/^sb-.*-auth-token/.test(k)).forEach(k=>localStorage.removeItem(k))}catch(e){}
    user=null;status='off';
    return res;
  }
  window.mzDeleteCloud=mzDeleteCloud;

  function statusText(){
    if(!READY) return 'Облако недоступно';
    if(!user) return 'Без входа данные только на этом устройстве';
    if(status==='syncing') return 'Синхронизация…';
    if(status==='offline') return 'Нет сети — работаем офлайн, синхронизируется позже';
    if(status==='err') return 'Синхронизация не удалась: '+lastErr;
    if(status==='ok'&&lastAt) return 'Синхронизировано '+new Date(lastAt).toLocaleString(typeof LOC!=='undefined'?LOC:undefined);
    return 'Вход выполнен';
  }
  function accountHTML(){
    const az=!!(S.consentAnalytics&&S.consentAnalytics.v);
    const azLab=`<label class="li"><span class="grow">Анонимная аналитика<br><span class="mut">Короткие события (открытие, онбординг, показ оплаты) без имени, почты и тренировок</span></span><input type="checkbox" id="mzaz" style="width:28px;min-height:28px" ${az?'checked':''}></label>`;
    if(user){
      return `<div class="card" id="mzacc"><b>☁️ Аккаунт и синхронизация</b>
        <p class="mut" style="margin:4px 0">Вход: ${esc(user.email||'')}</p>
        <p class="mut" id="mzst">${esc(statusText())}</p>
        <button class="pri full" id="mzsync">Синхронизировать сейчас</button>
        <button class="full" id="mzout" style="margin-top:8px">Выйти</button>
        <p class="mut" style="font-size:12px;margin-top:8px">Выход не удаляет данные на этом устройстве. Программа, история, рекорды и настройки копируются в облако в ЕС. Замеры тела — только при согласии. Фото тела остаются на устройстве.</p>
        ${azLab}</div>`;
    }
    return `<div class="card" id="mzacc"><b>☁️ Аккаунт и синхронизация</b>
      <p class="mut" style="margin:4px 0">Без входа всё остаётся только на этом устройстве. После входа программа, история, рекорды и настройки копируются в облако (серверы в ЕС) и не затирают то, что уже есть.</p>
      <input id="mzemail" type="email" autocomplete="username" inputmode="email" placeholder="Почта">
      <input id="mzpass" type="password" autocomplete="current-password" placeholder="Пароль (не короче 6 символов)">
      <div class="row" style="margin-top:8px"><button class="pri grow" id="mzin">Войти</button><button class="grow" id="mzup">Создать аккаунт</button></div>
      <button class="full" id="mzmagic" style="margin-top:8px">Войти по ссылке на почту</button>
      <button class="full sm" id="mzreset" style="margin-top:8px">Забыли пароль?</button>
      <div id="mzotpbox" class="hidden" style="margin-top:8px">
        <input id="mzotp" inputmode="numeric" autocomplete="one-time-code" placeholder="Код из письма">
        <button class="pri full" id="mzotpgo" style="margin-top:8px">Подтвердить код</button>
      </div>
      <p class="mut" id="mzmsg" style="margin-top:8px"></p>
      <p class="mut" style="font-size:12px">На iPhone в приложении с домашнего экрана надёжнее вход с паролем: ссылка из письма откроется в Safari.</p>
      ${azLab}</div>`;
  }
  function bindAccount(){
    const az=$('#mzaz');
    if(az) az.onchange=e=>{
      S.consentAnalytics=e.target.checked?{v:1,at:new Date().toISOString()}:null;
      save();
      if(e.target.checked) bootAnalytics();
      toast(e.target.checked?'Аналитика включена':'Аналитика выключена');
    };
    if($('#mzsync')) $('#mzsync').onclick=()=>sync();
    if($('#mzout')) $('#mzout').onclick=doLogout;
    if($('#mzin')) $('#mzin').onclick=doLogin;
    if($('#mzup')) $('#mzup').onclick=doSignup;
    if($('#mzmagic')) $('#mzmagic').onclick=doMagic;
    if($('#mzreset')) $('#mzreset').onclick=doReset;
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

  if(typeof more==='function'){const _more=more;more=function(){_more();inject()}}
  if(typeof wipeAll==='function'){
    wipeAll=async function(){
      if(!confirm('Удалить ВСЕ данные: тренировки, программу, замеры, фото и настройки?')) return;
      if(!confirm('Это необратимо. Сначала можно скачать копию. Точно удалить всё без возможности восстановления?')) return;
      let cloud='fail';
      try{cloud=await mzDeleteCloud()}catch(e){}
      if(cloud==='fail'){
        // Облако не очищено: локальные данные оставляем, иначе после перезагрузки они вернутся из облака.
        alert('Не удалось удалить данные в облаке. Проверь интернет и попробуй ещё раз. Данные на этом устройстве пока не удалены.');
        return;
      }
      try{
        localStorage.removeItem('gym');
        await new Promise(r=>{const q=indexedDB.deleteDatabase('moyzal');q.onsuccess=q.onerror=q.onblocked=()=>r()});
        // Кэш сервис-воркера мог содержать ответы сервера с личными данными (версии до v39).
        if(window.caches){const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}
      }catch(e){}
      if(cloud==='data') alert('Данные удалены. Аккаунт (почту для входа) удалить не удалось — войди ещё раз и повтори удаление позже.');
      location.reload();
    };
  }
  if(typeof paywall==='function'){
    const _pw=paywall;
    paywall=function(reason){mzTrack('paywall_shown',{reason:String(reason||'').slice(0,80)});return _pw(reason)};
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
    sb=supabase.createClient(CFG.url,CFG.anon,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}
    });
    sb.auth.onAuthStateChange(async(ev,session)=>{
      user=session&&session.user||null;
      if(ev==='PASSWORD_RECOVERY'){
        const np=prompt('Новый пароль (не короче 6 символов)');
        if(np&&np.length>=6){
          const {error}=await sb.auth.updateUser({password:np});
          toast(error?friendly(error):'Пароль обновлён');
        }
      }
    });
    const {data}=await sb.auth.getSession();
    user=data&&data.session&&data.session.user||null;
    stripAuthParams();
    adoptLS();
    if(ensureMeta()) persistLocal();
    bootAnalytics();
    if(user) sync();
    window.addEventListener('online',()=>{if(user) sync()});
  }
  init();
})();
