'use strict';
// C-112: program blocks. Workouts come from data/blocks/*.json in order; they are not generated.
// Files are loaded on demand (one block, the one the questionnaire picked); the service worker keeps it for offline use.
const BLOCK_FILES=[];
const BLOCKS={};
// Questionnaire key goal_level_days_place → block id (blocks-v2d, 180 blocks: g, b_bar, b_nobar; Claude PASS 19.11.2026).
// place: g | d | b_bar | b_nobar (bodyweight asks «Есть турник?»).
const BLOCK_MAP={"mass_nov_2_g":"mass_nov_2_g_b32","mass_nov_2_b_bar":"mass_nov_2_b_bar_b32","mass_nov_2_b_nobar":"mass_nov_2_b_nobar_b32","mass_nov_3_g":"mass_nov_3_g_b36","mass_nov_3_b_bar":"mass_nov_3_b_bar_b36","mass_nov_3_b_nobar":"mass_nov_3_b_nobar_b36","mass_nov_4_g":"mass_nov_4_g_b36","mass_nov_4_b_bar":"mass_nov_4_b_bar_b36","mass_nov_4_b_nobar":"mass_nov_4_b_nobar_b36","mass_nov_5_g":"mass_nov_5_g_b35","mass_nov_5_b_bar":"mass_nov_5_b_bar_b35","mass_nov_5_b_nobar":"mass_nov_5_b_nobar_b35","mass_nov_6_g":"mass_nov_6_g_b36","mass_nov_6_b_bar":"mass_nov_6_b_bar_b36","mass_nov_6_b_nobar":"mass_nov_6_b_nobar_b36","mass_mid_2_g":"mass_mid_2_g_b32","mass_mid_2_b_bar":"mass_mid_2_b_bar_b32","mass_mid_2_b_nobar":"mass_mid_2_b_nobar_b32","mass_mid_3_g":"mass_mid_3_g_b36","mass_mid_3_b_bar":"mass_mid_3_b_bar_b36","mass_mid_3_b_nobar":"mass_mid_3_b_nobar_b36","mass_mid_4_g":"mass_mid_4_g_b36","mass_mid_4_b_bar":"mass_mid_4_b_bar_b36","mass_mid_4_b_nobar":"mass_mid_4_b_nobar_b36","mass_mid_5_g":"mass_mid_5_g_b35","mass_mid_5_b_bar":"mass_mid_5_b_bar_b35","mass_mid_5_b_nobar":"mass_mid_5_b_nobar_b35","mass_mid_6_g":"mass_mid_6_g_b36","mass_mid_6_b_bar":"mass_mid_6_b_bar_b36","mass_mid_6_b_nobar":"mass_mid_6_b_nobar_b36","mass_adv_2_g":"mass_adv_2_g_b32","mass_adv_2_b_bar":"mass_adv_2_b_bar_b32","mass_adv_2_b_nobar":"mass_adv_2_b_nobar_b32","mass_adv_3_g":"mass_adv_3_g_b36","mass_adv_3_b_bar":"mass_adv_3_b_bar_b36","mass_adv_3_b_nobar":"mass_adv_3_b_nobar_b36","mass_adv_4_g":"mass_adv_4_g_b36","mass_adv_4_b_bar":"mass_adv_4_b_bar_b36","mass_adv_4_b_nobar":"mass_adv_4_b_nobar_b36","mass_adv_5_g":"mass_adv_5_g_b35","mass_adv_5_b_bar":"mass_adv_5_b_bar_b35","mass_adv_5_b_nobar":"mass_adv_5_b_nobar_b35","mass_adv_6_g":"mass_adv_6_g_b36","mass_adv_6_b_bar":"mass_adv_6_b_bar_b36","mass_adv_6_b_nobar":"mass_adv_6_b_nobar_b36","str_nov_2_g":"str_nov_2_g_b32","str_nov_2_b_bar":"str_nov_2_b_bar_b32","str_nov_2_b_nobar":"str_nov_2_b_nobar_b32","str_nov_3_g":"str_nov_3_g_b36","str_nov_3_b_bar":"str_nov_3_b_bar_b36","str_nov_3_b_nobar":"str_nov_3_b_nobar_b36","str_nov_4_g":"str_nov_4_g_b36","str_nov_4_b_bar":"str_nov_4_b_bar_b36","str_nov_4_b_nobar":"str_nov_4_b_nobar_b36","str_nov_5_g":"str_nov_5_g_b35","str_nov_5_b_bar":"str_nov_5_b_bar_b35","str_nov_5_b_nobar":"str_nov_5_b_nobar_b35","str_nov_6_g":"str_nov_6_g_b36","str_nov_6_b_bar":"str_nov_6_b_bar_b36","str_nov_6_b_nobar":"str_nov_6_b_nobar_b36","str_mid_2_g":"str_mid_2_g_b32","str_mid_2_b_bar":"str_mid_2_b_bar_b32","str_mid_2_b_nobar":"str_mid_2_b_nobar_b32","str_mid_3_g":"str_mid_3_g_b36","str_mid_3_b_bar":"str_mid_3_b_bar_b36","str_mid_3_b_nobar":"str_mid_3_b_nobar_b36","str_mid_4_g":"str_mid_4_g_b36","str_mid_4_b_bar":"str_mid_4_b_bar_b36","str_mid_4_b_nobar":"str_mid_4_b_nobar_b36","str_mid_5_g":"str_mid_5_g_b35","str_mid_5_b_bar":"str_mid_5_b_bar_b35","str_mid_5_b_nobar":"str_mid_5_b_nobar_b35","str_mid_6_g":"str_mid_6_g_b36","str_mid_6_b_bar":"str_mid_6_b_bar_b36","str_mid_6_b_nobar":"str_mid_6_b_nobar_b36","str_adv_2_g":"str_adv_2_g_b32","str_adv_2_b_bar":"str_adv_2_b_bar_b32","str_adv_2_b_nobar":"str_adv_2_b_nobar_b32","str_adv_3_g":"str_adv_3_g_b36","str_adv_3_b_bar":"str_adv_3_b_bar_b36","str_adv_3_b_nobar":"str_adv_3_b_nobar_b36","str_adv_4_g":"str_adv_4_g_b36","str_adv_4_b_bar":"str_adv_4_b_bar_b36","str_adv_4_b_nobar":"str_adv_4_b_nobar_b36","str_adv_5_g":"str_adv_5_g_b35","str_adv_5_b_bar":"str_adv_5_b_bar_b35","str_adv_5_b_nobar":"str_adv_5_b_nobar_b35","str_adv_6_g":"str_adv_6_g_b36","str_adv_6_b_bar":"str_adv_6_b_bar_b36","str_adv_6_b_nobar":"str_adv_6_b_nobar_b36","loss_nov_2_g":"loss_nov_2_g_b32","loss_nov_2_b_bar":"loss_nov_2_b_bar_b32","loss_nov_2_b_nobar":"loss_nov_2_b_nobar_b32","loss_nov_3_g":"loss_nov_3_g_b36","loss_nov_3_b_bar":"loss_nov_3_b_bar_b36","loss_nov_3_b_nobar":"loss_nov_3_b_nobar_b36","loss_nov_4_g":"loss_nov_4_g_b36","loss_nov_4_b_bar":"loss_nov_4_b_bar_b36","loss_nov_4_b_nobar":"loss_nov_4_b_nobar_b36","loss_nov_5_g":"loss_nov_5_g_b35","loss_nov_5_b_bar":"loss_nov_5_b_bar_b35","loss_nov_5_b_nobar":"loss_nov_5_b_nobar_b35","loss_nov_6_g":"loss_nov_6_g_b36","loss_nov_6_b_bar":"loss_nov_6_b_bar_b36","loss_nov_6_b_nobar":"loss_nov_6_b_nobar_b36","loss_mid_2_g":"loss_mid_2_g_b32","loss_mid_2_b_bar":"loss_mid_2_b_bar_b32","loss_mid_2_b_nobar":"loss_mid_2_b_nobar_b32","loss_mid_3_g":"loss_mid_3_g_b36","loss_mid_3_b_bar":"loss_mid_3_b_bar_b36","loss_mid_3_b_nobar":"loss_mid_3_b_nobar_b36","loss_mid_4_g":"loss_mid_4_g_b36","loss_mid_4_b_bar":"loss_mid_4_b_bar_b36","loss_mid_4_b_nobar":"loss_mid_4_b_nobar_b36","loss_mid_5_g":"loss_mid_5_g_b35","loss_mid_5_b_bar":"loss_mid_5_b_bar_b35","loss_mid_5_b_nobar":"loss_mid_5_b_nobar_b35","loss_mid_6_g":"loss_mid_6_g_b36","loss_mid_6_b_bar":"loss_mid_6_b_bar_b36","loss_mid_6_b_nobar":"loss_mid_6_b_nobar_b36","loss_adv_2_g":"loss_adv_2_g_b32","loss_adv_2_b_bar":"loss_adv_2_b_bar_b32","loss_adv_2_b_nobar":"loss_adv_2_b_nobar_b32","loss_adv_3_g":"loss_adv_3_g_b36","loss_adv_3_b_bar":"loss_adv_3_b_bar_b36","loss_adv_3_b_nobar":"loss_adv_3_b_nobar_b36","loss_adv_4_g":"loss_adv_4_g_b36","loss_adv_4_b_bar":"loss_adv_4_b_bar_b36","loss_adv_4_b_nobar":"loss_adv_4_b_nobar_b36","loss_adv_5_g":"loss_adv_5_g_b35","loss_adv_5_b_bar":"loss_adv_5_b_bar_b35","loss_adv_5_b_nobar":"loss_adv_5_b_nobar_b35","loss_adv_6_g":"loss_adv_6_g_b36","loss_adv_6_b_bar":"loss_adv_6_b_bar_b36","loss_adv_6_b_nobar":"loss_adv_6_b_nobar_b36","fit_nov_2_g":"fit_nov_2_g_b32","fit_nov_2_b_bar":"fit_nov_2_b_bar_b32","fit_nov_2_b_nobar":"fit_nov_2_b_nobar_b32","fit_nov_3_g":"fit_nov_3_g_b36","fit_nov_3_b_bar":"fit_nov_3_b_bar_b36","fit_nov_3_b_nobar":"fit_nov_3_b_nobar_b36","fit_nov_4_g":"fit_nov_4_g_b36","fit_nov_4_b_bar":"fit_nov_4_b_bar_b36","fit_nov_4_b_nobar":"fit_nov_4_b_nobar_b36","fit_nov_5_g":"fit_nov_5_g_b35","fit_nov_5_b_bar":"fit_nov_5_b_bar_b35","fit_nov_5_b_nobar":"fit_nov_5_b_nobar_b35","fit_nov_6_g":"fit_nov_6_g_b36","fit_nov_6_b_bar":"fit_nov_6_b_bar_b36","fit_nov_6_b_nobar":"fit_nov_6_b_nobar_b36","fit_mid_2_g":"fit_mid_2_g_b32","fit_mid_2_b_bar":"fit_mid_2_b_bar_b32","fit_mid_2_b_nobar":"fit_mid_2_b_nobar_b32","fit_mid_3_g":"fit_mid_3_g_b36","fit_mid_3_b_bar":"fit_mid_3_b_bar_b36","fit_mid_3_b_nobar":"fit_mid_3_b_nobar_b36","fit_mid_4_g":"fit_mid_4_g_b36","fit_mid_4_b_bar":"fit_mid_4_b_bar_b36","fit_mid_4_b_nobar":"fit_mid_4_b_nobar_b36","fit_mid_5_g":"fit_mid_5_g_b35","fit_mid_5_b_bar":"fit_mid_5_b_bar_b35","fit_mid_5_b_nobar":"fit_mid_5_b_nobar_b35","fit_mid_6_g":"fit_mid_6_g_b36","fit_mid_6_b_bar":"fit_mid_6_b_bar_b36","fit_mid_6_b_nobar":"fit_mid_6_b_nobar_b36","fit_adv_2_g":"fit_adv_2_g_b32","fit_adv_2_b_bar":"fit_adv_2_b_bar_b32","fit_adv_2_b_nobar":"fit_adv_2_b_nobar_b32","fit_adv_3_g":"fit_adv_3_g_b36","fit_adv_3_b_bar":"fit_adv_3_b_bar_b36","fit_adv_3_b_nobar":"fit_adv_3_b_nobar_b36","fit_adv_4_g":"fit_adv_4_g_b36","fit_adv_4_b_bar":"fit_adv_4_b_bar_b36","fit_adv_4_b_nobar":"fit_adv_4_b_nobar_b36","fit_adv_5_g":"fit_adv_5_g_b35","fit_adv_5_b_bar":"fit_adv_5_b_bar_b35","fit_adv_5_b_nobar":"fit_adv_5_b_nobar_b35","fit_adv_6_g":"fit_adv_6_g_b36","fit_adv_6_b_bar":"fit_adv_6_b_bar_b36","fit_adv_6_b_nobar":"fit_adv_6_b_nobar_b36"};
// D-236: blocks-v2d has no d-blocks («Дом» = b_bar / b_nobar). v2c d-blocks stay only for existing profiles with place d; the questionnaire does not offer d.
const LEGACY_D_BLOCK_MAP={"mass_nov_2_d":"mass_nov_2_d_b32","mass_nov_3_d":"mass_nov_3_d_b36","mass_nov_4_d":"mass_nov_4_d_b36","mass_nov_5_d":"mass_nov_5_d_b35","mass_nov_6_d":"mass_nov_6_d_b36","mass_mid_2_d":"mass_mid_2_d_b32","mass_mid_3_d":"mass_mid_3_d_b36","mass_mid_4_d":"mass_mid_4_d_b36","mass_mid_5_d":"mass_mid_5_d_b35","mass_mid_6_d":"mass_mid_6_d_b36","mass_adv_2_d":"mass_adv_2_d_b32","mass_adv_3_d":"mass_adv_3_d_b36","mass_adv_4_d":"mass_adv_4_d_b36","mass_adv_5_d":"mass_adv_5_d_b35","mass_adv_6_d":"mass_adv_6_d_b36","str_nov_2_d":"str_nov_2_d_b32","str_nov_3_d":"str_nov_3_d_b36","str_nov_4_d":"str_nov_4_d_b36","str_nov_5_d":"str_nov_5_d_b35","str_nov_6_d":"str_nov_6_d_b36","str_mid_2_d":"str_mid_2_d_b32","str_mid_3_d":"str_mid_3_d_b36","str_mid_4_d":"str_mid_4_d_b36","str_mid_5_d":"str_mid_5_d_b35","str_mid_6_d":"str_mid_6_d_b36","str_adv_2_d":"str_adv_2_d_b32","str_adv_3_d":"str_adv_3_d_b36","str_adv_4_d":"str_adv_4_d_b36","str_adv_5_d":"str_adv_5_d_b35","str_adv_6_d":"str_adv_6_d_b36","loss_nov_2_d":"loss_nov_2_d_b32","loss_nov_3_d":"loss_nov_3_d_b36","loss_nov_4_d":"loss_nov_4_d_b36","loss_nov_5_d":"loss_nov_5_d_b35","loss_nov_6_d":"loss_nov_6_d_b36","loss_mid_2_d":"loss_mid_2_d_b32","loss_mid_3_d":"loss_mid_3_d_b36","loss_mid_4_d":"loss_mid_4_d_b36","loss_mid_5_d":"loss_mid_5_d_b35","loss_mid_6_d":"loss_mid_6_d_b36","loss_adv_2_d":"loss_adv_2_d_b32","loss_adv_3_d":"loss_adv_3_d_b36","loss_adv_4_d":"loss_adv_4_d_b36","loss_adv_5_d":"loss_adv_5_d_b35","loss_adv_6_d":"loss_adv_6_d_b36","fit_nov_2_d":"fit_nov_2_d_b32","fit_nov_3_d":"fit_nov_3_d_b36","fit_nov_4_d":"fit_nov_4_d_b36","fit_nov_5_d":"fit_nov_5_d_b35","fit_nov_6_d":"fit_nov_6_d_b36","fit_mid_2_d":"fit_mid_2_d_b32","fit_mid_3_d":"fit_mid_3_d_b36","fit_mid_4_d":"fit_mid_4_d_b36","fit_mid_5_d":"fit_mid_5_d_b35","fit_mid_6_d":"fit_mid_6_d_b36","fit_adv_2_d":"fit_adv_2_d_b32","fit_adv_3_d":"fit_adv_3_d_b36","fit_adv_4_d":"fit_adv_4_d_b36","fit_adv_5_d":"fit_adv_5_d_b35","fit_adv_6_d":"fit_adv_6_d_b36"};

function unwrapBlock(raw){if(!raw||typeof raw!=='object')return null;return raw.block&&typeof raw.block==='object'?raw.block:raw}

function registerBlock(raw){
  const b=unwrapBlock(raw);
  if(!b||!b.id)return null;
  BLOCKS[b.id]=b;
  return b;
}

function fetchBlockFile(id){
  if(!/^[a-z0-9_]+$/.test(String(id||''))||typeof XMLHttpRequest==='undefined')return null;
  try{const x=new XMLHttpRequest();x.open('GET','data/blocks/'+id+'.json',false);x.send();
    if(x.status>=200&&x.status<300&&x.responseText)return registerBlock(JSON.parse(x.responseText));}catch(e){}
  return null;
}
function getBlock(id){if(!id)return null;return BLOCKS[id]||fetchBlockFile(id)||null}

function blocksEnabled(){
  try{
    const search=(typeof location!=='undefined'&&location.search)||'';
    const m=/[?&]blocks=(0|1)\b/.exec(search);
    const ls=typeof localStorage!=='undefined'?localStorage:null;
    if(m){
      if(m[1]==='0'){if(ls)ls.setItem('gc_blocks','0');return false}
      if(ls)ls.removeItem('gc_blocks');
      return true;
    }
    return !(ls&&ls.getItem('gc_blocks')==='0');
  }catch(e){return true}
}

function blockIdForProfile(a){
  if(!a||!blocksEnabled())return null;
  const key=blockKey(a);
  const acc=blockAcc(a);
  return(acc&&PRIO_BLOCK_MAP[key+'_pr_'+acc])||BLOCK_MAP[key]||LEGACY_D_BLOCK_MAP[key]||null;
}
// D-229: accent (blocks-priority-v2, Claude 17.11.2026). Key {base}_pr_{muscle}; no block → base block. Sex is not used.
// next_level of an accent block is the base advanced block (no advanced accent blocks yet), so the accent is dropped there.
const PRIO_BLOCK_MAP={"mass_mid_4_g_pr_back":"mass_mid_4_g_pr_back_b36","mass_mid_5_g_pr_arms":"mass_mid_5_g_pr_arms_b35","mass_mid_4_g_pr_glutes":"mass_mid_4_g_pr_glutes_b36","loss_mid_4_g_pr_abs":"loss_mid_4_g_pr_abs_b36"};
const ACC_RU={back:'Спина',arms:'Руки',glutes:'Ягодицы и ноги',abs:'Пресс'};
const ACC_ONLY={back:'Акцент «Спина» пока есть только для: масса, средний уровень, 4 тренировки в неделю, зал. Показана базовая программа.',arms:'Акцент «Руки» пока есть только для: масса, средний уровень, 5 тренировок в неделю, зал. Показана базовая программа.',glutes:'Акцент «Ягодицы и ноги» пока есть только для: масса, средний уровень, 4 тренировки в неделю, зал. Показана базовая программа.',abs:'Акцент «Пресс» пока есть только для: похудение, средний уровень, 4 тренировки в неделю, зал. Показана базовая программа.'};
function blockAcc(a){const v=a&&a.acc;return v&&ACC_RU[v]?v:null}
function blockAccNote(a){const acc=blockAcc(a);if(!acc||!blocksEnabled())return null;return PRIO_BLOCK_MAP[blockKey(a)+'_pr_'+acc]?null:ACC_ONLY[acc]}

function blockPlace(a){
  if(!a)return'g';
  if(a.place!=='b')return a.place||'g';
  return(a.bar===true||a.bar==='1'||a.bar===1)?'b_bar':'b_nobar';
}
function blockKey(a){return[a.goal,a.level,a.days,blockPlace(a)].join('_')}

function blockWarmRef(block){return block&&(block.warmup||block.warmup_cooldown_from)}

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
  const warm=parseWarmTemplate(blockWarmRef(block),block.len||75);
  if(!warm.template)errors.push('warmup (or warmup_cooldown_from) must reference a template');
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
  if(it.cardio){row.cardio=1;row.sets=1;row.rest=0;return row}  // cardio finish: min/max are minutes
  if(it.unit==='sec'||it.sec)row.sec=1;
  return row;
}

// Limitations (back / knees / shoulders): swap inside the block for a trainer alternative of the same main muscles.
function blockLimOk(id,a){
  const lim=(a&&a.lim)||[];if(!lim.length)return true;
  const m=typeof META!=='undefined'&&META[id];if(!m)return true;
  const r=String(m).split('|')[1]||'';return!lim.some(l=>r.includes(l));
}
function blockLimSwap(items,a){
  if(!a||!(a.lim||[]).length)return items;
  const used=new Set(items.map(i=>i.exId));
  return items.map(it=>{
    if(it.cardio||blockLimOk(it.exId,a))return it;
    const alts=(typeof ALT!=='undefined'&&ALT[it.exId])||[];
    const same=(x,y)=>typeof eqSameMuscle!=='function'||eqSameMuscle(x,y);
    const place=a.place||'g';
    const ok=alts.find(x=>x&&!used.has(x)&&blockLimOk(x,a)&&same(it.exId,x)&&(typeof eqAvail!=='function'||eqAvail(x,place)));
    if(!ok)return it;
    used.add(ok);return Object.assign({},it,{exId:ok,swapped:1});
  });
}

// day_code → template day index: codes in order of first appearance follow the template rotation (FA,FB,FC / U1,L1,U2,L2 / PU,PL,LG,…).
function blockDayIndex(block){
  const idx={};let n=0;
  (block.workouts||[]).forEach(w=>{const c=w&&w.day_code;if(c&&!(c in idx))idx[c]=n++});
  return idx;
}

function warmCoolShell(block,a){
  const ref=parseWarmTemplate(blockWarmRef(block),block.len||75);
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

function attachWarmCool(shellDays,workout,dayIdx){
  let idx;
  if(dayIdx&&workout.day_code&&workout.day_code in dayIdx)idx=dayIdx[workout.day_code];
  else{const label=String(workout.day_label||'A').toUpperCase();idx=Math.max(0,'ABCDE'.indexOf(label))}
  const src=shellDays[idx]||shellDays[0]||{};
  const first=workout.items&&workout.items[0]?resolveExId(workout.items[0].exId):null;
  const wu=src.wu?JSON.parse(JSON.stringify(src.wu)):null;
  const cd=src.cd?JSON.parse(JSON.stringify(src.cd)):null;
  if(wu&&first&&Array.isArray(wu.ramp))wu.ramp=wu.ramp.map(r=>Object.assign({},r,{exId:first}));
  return{wu,cd};
}

const DAY_RU={U1:'Верх тела A',U2:'Верх тела B',L1:'Низ тела A',L2:'Низ тела B',FA:'Всё тело A',FB:'Всё тело B',FC:'Всё тело C',PU:'Жимовая A',PL:'Тяговая A',LG:'Ноги A',PU2:'Жимовая B',PL2:'Тяговая B',LG2:'Ноги B'};
function blockDayName(w){const t=DAY_RU[w.day_code]||('Тренировка '+w.n);return w.week?('Неделя '+w.week+' · '+t+(w.deload?' (разгрузка)':'')):t}
function planFromBlock(block,a){
  const b=unwrapBlock(block);
  const shell=warmCoolShell(b,a||{});
  const dayIdx=blockDayIndex(b);
  const days=(b.workouts||[]).map(w=>{
    const wc=attachWarmCool(shell,w,dayIdx);
    const day={name:blockDayName(w),items:blockLimSwap((w.items||[]).map(itemFromBlock),a)};
    if(wc.wu)day.wu=wc.wu;
    if(wc.cd)day.cd=wc.cd;
    if(w.est_min!=null)day.est=w.est_min;
    if(w.week)day.week=w.week;
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
  app.innerHTML=`<div class="card"><div class="mut">${(typeof goalName==='function'?goalName(S.goal,S.prof&&S.prof.place):GOALS[S.goal])||''} · ${S.days}× в неделю · на этой неделе: ${wk}/${S.days} · ${sel+1}/${total}</div><h2 style="margin-top:6px">${esc(d.name)}</h2><div class="mut">По плану сегодня · ≈ ${mins} мин · ${d.items.length} упражн.</div>
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
        if(b){const p=planFromBlock(b,a);const note=blockAccNote(a);if(note)p.advice=note;else if(b.equipment_note_ru)p.advice=b.equipment_note_ru;return p}
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
