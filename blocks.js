'use strict';
// C-112: program blocks. Workouts come from data/blocks/*.json in order; they are not generated.
const BLOCK_FILES=['data/blocks/mass_nov_3_g_b36.json'];
const BLOCKS={};
// Questionnaire → block id. Almost empty; the v2 sample is listed here but used only when the feature flag is on.
const BLOCK_MAP={'mass_nov_3_g':'mass_nov_3_g_b36'};

function unwrapBlock(raw){if(!raw||typeof raw!=='object')return null;return raw.block&&typeof raw.block==='object'?raw.block:raw}

function registerBlock(raw){
  const b=unwrapBlock(raw);
  if(!b||!b.id)return null;
  BLOCKS[b.id]=b;
  return b;
}

function getBlock(id){return id&&BLOCKS[id]||null}

function blocksEnabled(){
  try{
    const search=(typeof location!=='undefined'&&location.search)||'';
    const m=/[?&]blocks=(0|1)\b/.exec(search);
    const ls=typeof localStorage!=='undefined'?localStorage:null;
    if(m){
      if(m[1]==='1'){if(ls)ls.setItem('gc_blocks','1');return true}
      if(ls)ls.removeItem('gc_blocks');
      return false;
    }
    return !!(ls&&ls.getItem('gc_blocks')==='1');
  }catch(e){return false}
}

function blockIdForProfile(a){
  if(!a||!blocksEnabled())return null;
  const key=[a.goal,a.level,a.days,a.place].join('_');
  return BLOCK_MAP[key]||null;
}

function parseWarmTemplate(ref, fallbackLen){
  const fb=fallbackLen||75;
  if(!ref)return{template:null,len:fb};
  if(typeof ref==='string'){
    const m=/(?:templates\.)?([a-z][a-z0-9]*(?:_[a-z0-9]+)*)/.exec(ref);
    const len=/len\s*(\d+)/.exec(ref);
    return{template:m?m[1]:null,len:len?+len[1]:fb};
  }
  const t=ref.template||ref.id||ref.from||ref.key||null;
  return{template:t,len:ref.len||fb};
}

function normalizeEndActions(ea){
  if(Array.isArray(ea)){
    let next=null,repeat=false;
    ea.forEach(x=>{
      if(x==='repeat'||(x&&x.repeat))repeat=true;
      if(typeof x==='string'&&x!=='repeat'&&x!=='next_level')next=x;
      else if(x&&typeof x==='object'){
        if(x.repeat)repeat=true;
        if(typeof x.next_level==='string'&&x.next_level)next=x.next_level;
      }
    });
    return{repeat:repeat||ea.includes('repeat'),next_level:next};
  }
  if(ea&&typeof ea==='object'){
    const nl=ea.next_level;
    return{repeat:ea.repeat!==false,next_level:typeof nl==='string'&&nl?nl:null};
  }
  return{repeat:true,next_level:null};
}

function catalogHasEx(id){
  if(!id)return false;
  if(typeof exBy==='function'){const e=exBy(id);if(e&&e.name&&e.name!=='?')return true}
  if(typeof LEGACY_TO!=='undefined'&&LEGACY_TO[id])return true;
  if(typeof LEGACY!=='undefined'&&LEGACY[id])return true;
  if(typeof EX!=='undefined'&&Array.isArray(EX)&&EX.some(e=>(e&&(e.id||e[0]))===id))return true;
  return false;
}

function resolveExId(id){
  if(typeof LEGACY_TO!=='undefined'&&LEGACY_TO[id])return LEGACY_TO[id];
  return id;
}

function validateBlock(raw,ctx){
  const errors=[];
  const block=unwrapBlock(raw);
  if(!block||typeof block!=='object')return{ok:false,errors:['block missing'],block:null};
  if(!block.id||typeof block.id!=='string')errors.push('id is required');
  if(!Array.isArray(block.workouts)||!block.workouts.length)errors.push('workouts must be a non-empty array');
  const hasEx=ctx&&ctx.exerciseIds?id=>ctx.exerciseIds.has(id)||catalogHasEx(id):catalogHasEx;
  const templates=ctx&&ctx.templateKeys?ctx.templateKeys:(typeof PROG!=='undefined'&&PROG.T?new Set(Object.keys(PROG.T)):null);
  const warm=parseWarmTemplate(block.warmup_cooldown_from,block.len||75);
  if(!warm.template)errors.push('warmup_cooldown_from must reference a template');
  else if(templates&&!templates.has(warm.template))errors.push('warmup template not found: '+warm.template);
  else if(!templates&&typeof PROG!=='undefined'&&PROG.T&&!PROG.T[warm.template])errors.push('warmup template not found: '+warm.template);
  (block.workouts||[]).forEach((w,i)=>{
    const label='workout '+(w&&w.n!=null?w.n:i+1);
    if(!w||typeof w!=='object'){errors.push(label+': missing');return}
    if(!Array.isArray(w.items)||!w.items.length){errors.push(label+': items required');return}
    w.items.forEach((it,j)=>{
      if(!it||typeof it.exId!=='string'||!it.exId){errors.push(label+' item '+(j+1)+': exId required');return}
      if(!hasEx(it.exId)&&!hasEx(resolveExId(it.exId)))errors.push(label+': unknown exercise id '+it.exId);
      ['sets','min','max','rest'].forEach(k=>{
        if(it[k]==null||typeof it[k]!=='number'||!isFinite(it[k]))errors.push(label+' '+it.exId+': '+k+' must be a number');
      });
    });
  });
  const ea=normalizeEndActions(block.end_actions);
  if(ea.next_level&&typeof ea.next_level!=='string')errors.push('end_actions.next_level must be a block id');
  return{ok:errors.length===0,errors,block,warmup:warm,end_actions:ea};
}

function migrateBlockState(state){
  if(!state)return state;
  if(state.block==null)return state;
  if(typeof state.block!=='object'||Array.isArray(state.block)||typeof state.block.id!=='string'||!state.block.id){
    delete state.block;
    return state;
  }
  let n=state.block.next;
  if(typeof n!=='number'||!isFinite(n)||n<0)n=0;
  const dueOn=typeof state.block.dueOn==='string'?state.block.dueOn:undefined;
  state.block={id:state.block.id,next:n|0};
  if(dueOn)state.block.dueOn=dueOn;
  return state;
}

function blockWorkoutCount(block){const b=unwrapBlock(block);return b&&Array.isArray(b.workouts)?b.workouts.length:0}

function blockIsComplete(state,block){return((state&&state.block&&state.block.next)|0)>=blockWorkoutCount(block)}

function skipBlockWorkout(state){
  if(!state||!state.block)return 0;
  const today=new Date();
  const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const base=state.block.dueOn&&/^\d{4}-\d{2}-\d{2}$/.test(state.block.dueOn)?new Date(state.block.dueOn+'T00:00:00'):today;
  const next=new Date(base.getTime());
  next.setDate(next.getDate()+1);
  state.block.dueOn=iso(next);
  state.block.skippedAt=Date.now();
  return state.block.next|0;
}

function finishBlockWorkout(state,block){
  if(!state||!state.block)return 0;
  const n=blockWorkoutCount(block);
  state.block.next=Math.min((state.block.next|0)+1,n);
  state.next=state.block.next;
  return state.block.next;
}

function repeatBlock(state){
  if(!state||!state.block)return;
  state.block.next=0;
  state.next=0;
  delete state.block.dueOn;
}

function goNextLevel(state,block){
  const ea=normalizeEndActions(unwrapBlock(block)&&unwrapBlock(block).end_actions);
  if(!ea.next_level)return false;
  if(!state)return false;
  state.block={id:ea.next_level,next:0};
  state.next=0;
  return true;
}

function itemFromBlock(it){
  const row={exId:resolveExId(it.exId),sets:+it.sets,min:+it.min,max:+it.max,rest:+it.rest};
  if(it.unit==='sec'||it.sec)row.sec=1;
  return row;
}

function warmCoolShell(block,a){
  const ref=parseWarmTemplate(block.warmup_cooldown_from,block.len||75);
  const key=ref.template;
  const len=ref.len||block.len||75;
  if(!key||typeof planFromTemplate!=='function')return[];
  const parts=String(key).split('_');
  const prof={
    goal:parts[0]||block.goal||(a&&a.goal)||'mass',
    level:parts[1]||block.level||(a&&a.level)||'nov',
    days:parts[2]?+parts[2]:(block.days_per_week||(a&&a.days)||3),
    place:parts[3]||block.place||(a&&a.place)||'g',
    sex:(a&&a.sex)||'m',prio:[],lim:[],len
  };
  const p=planFromTemplate(prof);
  return p&&p.days||[];
}

function attachWarmCool(shellDays,workout){
  const label=String(workout.day_label||'A').toUpperCase();
  const idx=Math.max(0,'ABCDE'.indexOf(label));
  const src=shellDays[idx]||shellDays[0]||{};
  const first=workout.items&&workout.items[0]?resolveExId(workout.items[0].exId):null;
  const wu=src.wu?JSON.parse(JSON.stringify(src.wu)):null;
  const cd=src.cd?JSON.parse(JSON.stringify(src.cd)):null;
  if(wu&&first&&Array.isArray(wu.ramp))wu.ramp=wu.ramp.map(r=>Object.assign({},r,{exId:first}));
  return{wu,cd};
}

function planFromBlock(block,a){
  const b=unwrapBlock(block);
  const shell=warmCoolShell(b,a||{});
  const days=(b.workouts||[]).map(w=>{
    const wc=attachWarmCool(shell,w);
    const day={name:'Тренировка '+w.n,items:(w.items||[]).map(itemFromBlock)};
    if(wc.wu)day.wu=wc.wu;
    if(wc.cd)day.cd=wc.cd;
    if(w.est_min!=null)day.est=w.est_min;
    return day;
  });
  return{
    days,
    why:[[b.rules||'Программа по блоку тренера',[]]],
    advice:null,
    timeLabel:b.duration_label||'',
    shorter:false,
    blockId:b.id
  };
}

function loadBlockFiles(loader){
  if(loader){loader(BLOCK_FILES).forEach(registerBlock);return}
  if(typeof XMLHttpRequest==='undefined')return;
  const xhr=new XMLHttpRequest();
  BLOCK_FILES.forEach(f=>{
    try{
      xhr.open('GET',f,false);
      xhr.send();
      if(xhr.status>=200&&xhr.status<300&&xhr.responseText)registerBlock(JSON.parse(xhr.responseText));
    }catch(e){}
  });
}

function ymdPlus(iso,days){
  const d=iso?new Date(iso+'T00:00:00'):new Date();
  d.setDate(d.getDate()+(days||0));
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}

function blockOnApplied(gen){
  if(typeof S==='undefined'||!S)return;
  if(gen&&gen.blockId)S.block={id:gen.blockId,next:0};
  else if(S.block)delete S.block;
}

function blockOnFinished(A){
  if(typeof S==='undefined'||!S||!S.block||!S.block.id)return;
  const b=getBlock(S.block.id);
  if(!b)return;
  if(A&&(A.fromTemplate||A.dayName==='Своя тренировка'))return;
  const planned=S.block.next|0;
  if(A&&A.dayIdx!=null&&A.dayIdx!==planned)return;
  finishBlockWorkout(S,b);
}

function blockActive(){return !!(typeof S!=='undefined'&&S&&S.block&&S.block.id&&getBlock(S.block.id))}

function renderBlockEnd(b){
  const ea=normalizeEndActions(b.end_actions);
  if(typeof $('#title')!=='undefined'&&$('#title'))$('#title').textContent='Блок завершён';
  const nextBtn=ea.next_level?`<button class="pri full" id="blk-next" style="margin-top:8px">Следующий уровень</button>`:'';
  app.innerHTML=`<div class="card"><h2 style="margin-top:0">Блок завершён</h2>
<p>Выбери, что дальше.</p>
<button class="pri full" id="blk-repeat">Повторить блок</button>${nextBtn}
</div>`;
  const rep=$('#blk-repeat');
  if(rep)rep.onclick=()=>{repeatBlock(S);if(typeof save==='function')save();if(typeof go==='function')go('today')};
  const nx=$('#blk-next');
  if(nx)nx.onclick=()=>{
    if(!goNextLevel(S,b))return;
    const nb=getBlock(S.block.id);
    if(nb){
      const plan=planFromBlock(nb,S.prof||{});
      S.program=plan.days;S.progName=nb.title||S.progName;S.why=plan.why;S.next=0;
    }
    if(typeof save==='function')save();
    if(typeof go==='function')go('today');
  };
}

function renderBlockToday(){
  const b=getBlock(S.block.id);
  if(!b)return false;
  migrateBlockState(S);
  if(blockIsComplete(S,b)){renderBlockEnd(b);return true}
  const sel=S.block.next|0;
  if(!S.program||!S.program[sel]){
    const plan=planFromBlock(b,S.prof||{});
    S.program=plan.days;
    if(b.title)S.progName=b.title;
  }
  const d0=S.program[sel];
  if(!d0)return false;
  const d=typeof eqAdaptDay==='function'?eqAdaptDay(d0):d0;
  const mins=typeof dayMin==='function'?dayMin(d):(d.est||0);
  const total=blockWorkoutCount(b);
  const wk=(S.workouts||[]).filter(w=>Date.now()-w.start<7*864e5).length;
  $('#title').textContent='Сегодня';
  app.innerHTML=`<div class="card"><div class="mut">${GOALS[S.goal]||''} · ${S.days}× в неделю · на этой неделе: ${wk}/${S.days} · ${sel+1}/${total}</div><h2 style="margin-top:6px">${esc(d.name)}</h2><div class="mut">По плану сегодня · ≈ ${mins} мин · ${d.items.length} упражн.</div>
${d.wu&&typeof wuHTML==='function'?wuHTML(d.wu):`<details class="wud"><summary>🔥 <b>Разминка</b> <span class="mut">≈ ${warmPlan(d,S.prof).min} мин</span></summary>${warmHTML(warmPlan(d,S.prof))}</details>`}${d.items.map(it=>`<div class="li">${typeof animShot==='function'?animShot(it.exId):''}<div class="grow">${esc(exBy(it.exId).name)}${typeof hint==='function'?hint(it):''}</div>${typeof techBtn==='function'?techBtn(it.exId):''}<span class="mut">${esc(typeof setTxt==='function'?setTxt(it):'')}</span></div>`).join('')}${d.cd&&typeof cdHTML==='function'?cdHTML(d.cd):''}
<button class="pri full" id="start" style="margin-top:14px">▶ Начать тренировку</button>
<button class="full" id="blk-skip" style="margin-top:8px">Пропустить тренировку</button></div>`;
  const st=$('#start');if(st)st.onclick=()=>startW(sel);
  const sk=$('#blk-skip');if(sk)sk.onclick=()=>{skipBlockWorkout(S);if(typeof save==='function')save();if(typeof toast==='function')toast('Тренировка перенесена');if(typeof go==='function')go('today')};
  return true;
}

(function hookBlocks(){
  loadBlockFiles();
  if(typeof S!=='undefined'&&S)migrateBlockState(S);
  if(typeof generate==='function'){
    const orig=generate;
    generate=function(a){
      if(blocksEnabled()){
        const id=blockIdForProfile(a);
        const b=id&&getBlock(id);
        if(b)return planFromBlock(b,a);
      }
      return orig(a);
    };
  }
  if(typeof today==='function'){
    const orig=today;
    today=function(sel){
      if(blockActive()&&!S.active){if(renderBlockToday())return}
      return orig(sel);
    };
  }
  if(typeof renderPreview==='function'){
    const orig=renderPreview;
    renderPreview=function(){
      orig();
      const btn=typeof $==='function'?$('#pstart'):null;
      if(!btn)return;
      const prev=btn.onclick;
      btn.onclick=function(){
        const was=S.program;
        if(prev)prev.apply(this,arguments);
        if(S.program===was)return;
        blockOnApplied(typeof PV!=='undefined'&&PV&&PV.gen);
        if(typeof save==='function')save();
      };
    };
  }
  if(typeof migrateLegacyPlans==='function'){
    const orig=migrateLegacyPlans;
    migrateLegacyPlans=function(){orig();if(typeof S!=='undefined')migrateBlockState(S)};
  }
})();
