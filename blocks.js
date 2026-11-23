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

// tech-fix-1: program variants (pilot-rework-3). Own ids and files in data/blocks/variants/ — not in BLOCK_INDEX / the catalog,
// so there is one catalog card per base program. The base block id and file do not change; active plans keep S.block.id.
// Variants are used only with the pilot switch (?pilot=1 or localStorage gc_pilot=1); default off = old behaviour.
const BLOCK_VARIANTS={
  loss_nov_6_g_b36:{def:'loss_nov_4_g_b36_vb',opts:['loss_nov_4_g_b36_vb','loss_nov_6_g_b36_va']},
  loss_nov_4_g_b36:{def:'loss_nov_4_g_b36_vb',opts:['loss_nov_4_g_b36_vb']},
  mass_nov_3_g_b36:{def:'mass_nov_3_g_b36_v3',opts:['mass_nov_3_g_b36_v3']},
  str_adv_5_g_b35:{def:'str_adv_5_g_b35_voe',opts:['str_adv_5_g_b35_voe','str_adv_5_g_b35_vfree']},
  loss_mid_4_g_pr_abs_b36:{def:'loss_mid_4_g_pr_abs_b36_v3',opts:['loss_mid_4_g_pr_abs_b36_v3']}
};
const BLOCK_VARIANT_RU={loss_nov_4_g_b36_vb:['Вариант B — 4 тренировки в неделю','Рекомендуем: между тренировками есть дни отдыха.'],
  loss_nov_6_g_b36_va:['Вариант A — 6 тренировок в неделю','Дополнительный вариант: шесть тренировок в неделю без дня отдыха — только при хорошем восстановлении.'],
  str_adv_5_g_b35_voe:['Исходное оборудование (Смит)','Рекомендуем: жим и присед в Смите, можно без страхующего.'],
  str_adv_5_g_b35_vfree:['Свободная штанга','Для опытных: нужен уверенный жим и присед со штангой и страхующий.'],
  mass_nov_3_g_b36_v3:['Доработанная версия',''],loss_mid_4_g_pr_abs_b36_v3:['Доработанная версия','']};
// tech-fix-2: home base of every variant = variant_of of its file (one fixed value). Before it was built from BLOCK_VARIANTS
// in key order, so B (4 days) was tied back to the 6-day base and a 4-day user got the 6-day A offered.
// The base that OFFERS a variant (the questionnaire base) is passed separately (generate → variantBase).
const BLOCK_VARIANT_OF={loss_nov_4_g_b36_vb:'loss_nov_4_g_b36',loss_nov_6_g_b36_va:'loss_nov_6_g_b36',mass_nov_3_g_b36_v3:'mass_nov_3_g_b36',
  str_adv_5_g_b35_voe:'str_adv_5_g_b35',str_adv_5_g_b35_vfree:'str_adv_5_g_b35',loss_mid_4_g_pr_abs_b36_v3:'loss_mid_4_g_pr_abs_b36'};
// Workouts per week of each variant (= days_per_week of its file; checked by test).
const BLOCK_VARIANT_DAYS={loss_nov_4_g_b36_vb:4,loss_nov_6_g_b36_va:6,mass_nov_3_g_b36_v3:3,str_adv_5_g_b35_voe:5,str_adv_5_g_b35_vfree:5,loss_mid_4_g_pr_abs_b36_v3:4};
function blockVariantsOn(){
  try{
    const search=(typeof location!=='undefined'&&location.search)||'';
    const m=/[?&]pilot=(0|1)\b/.exec(search);const ls=typeof localStorage!=='undefined'?localStorage:null;
    if(m){if(ls)ls.setItem('gc_pilot',m[1]);return m[1]==='1'}
    return!!(ls&&ls.getItem('gc_pilot')==='1');
  }catch(e){return false}
}
function blockVariantFor(baseId,a){
  const v=baseId&&BLOCK_VARIANTS[baseId];if(!v||!blockVariantsOn())return baseId;
  const pick=a&&a.variant;return v.opts.includes(pick)?pick:v.def;
}
// Options shown for a variant id: those of the questionnaire base when it offers this id, else of its home base.
function blockVariantBase(id,baseId){if(baseId&&BLOCK_VARIANTS[baseId]&&(baseId===id||BLOCK_VARIANTS[baseId].opts.includes(id)))return baseId;return BLOCK_VARIANT_OF[id]||(BLOCK_VARIANTS[id]?id:null)}
function blockVariantOpts(id,baseId){const base=blockVariantBase(id,baseId);const v=base&&BLOCK_VARIANTS[base];return v&&blockVariantsOn()?v.opts.slice():[]}
// tech-fix-2: reopening the questionnaire after a pilot variant: the answer «days» is what the user asked (6), not the
// frequency of the accepted variant (B = 4), so the same base and the A / B choice come back.
function quizDaysAsked(){const p=typeof S!=='undefined'&&S&&S.prof;return p&&p.variant&&BLOCK_VARIANT_OF[p.variant]&&+p.daysAsked>0?{days:+p.daysAsked}:{}}
// v158 review-nov-2 r2: new revisions of 7 accepted novice pilot programs, ONLY for new assignments (questionnaire / catalog →
// generate → blockBaseForProfile). Own ids <id>_r2 and files data/blocks/r2/ (draft files of review-nov-2-final-check, only "id"
// changed so that loading never overwrites the old block). Saved plans keep S.block.id and the old file; history and S.pg untouched.
// OFF until Eduards says yes (Grok PASS D1/D3 is there). The 3 b_bar programs stay blocked until D2 at home is ready.
const R2_READY=['mass_nov_4_g_b36','mass_nov_4_b_nobar_b36','mass_nov_5_g_b35','mass_nov_6_g_b36','fit_nov_6_g_b36','fit_nov_6_b_nobar_b36','loss_nov_6_b_nobar_b36'];
const R2_BLOCKED=['mass_nov_5_b_bar_b35','mass_nov_6_b_bar_b36','loss_nov_6_b_bar_b36'];
const R2_OF={};R2_READY.forEach(id=>{R2_OF[id+'_r2']=id});
let R2_ON=false;
// GC-163-01: per-program switch. Ids listed here (only from R2_READY) get «<id>_r2» for NEW assignments; R2_ON=true = all of R2_READY.
// Instant rollback = empty list: no file is deleted, plans already started on r2 keep loading (blockFilePath does not read this).
// GC-164-01 (owner approval via GPT, 23.11.2026): exactly these five. NOT fit_nov_6_b_nobar / loss_nov_6_b_nobar (audit) and NOT the 3 b_bar (R2_BLOCKED).
let R2_ACTIVE=['mass_nov_4_g_b36','mass_nov_4_b_nobar_b36','mass_nov_5_g_b35','mass_nov_6_g_b36','fit_nov_6_g_b36'];
function r2On(id){return!!id&&R2_READY.includes(id)&&!R2_BLOCKED.includes(id)&&(R2_ON||R2_ACTIVE.includes(id))}
function blockR2For(id){return r2On(id)?id+'_r2':id}
function blockFilePath(id){return R2_OF[id]?('data/blocks/r2/'+id+'.json'):BLOCK_VARIANT_OF[id]?('data/blocks/variants/'+id+'.json'):('data/blocks/'+id+'.json')}

function fetchBlockFile(id){
  if(!/^[a-z0-9_]+$/.test(String(id||''))||typeof XMLHttpRequest==='undefined')return null;
  try{const x=new XMLHttpRequest();x.open('GET',blockFilePath(id),false);x.send();
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

function blockIdForProfile(a){return blockVariantFor(blockBaseForProfile(a),a)}
// Base block of the questionnaire (before the pilot variant).
function blockBaseForProfile(a){
  if(!a||!blocksEnabled())return null;
  const key=blockKey(a);
  const acc=blockAcc(a);
  return blockR2For((acc&&PRIO_BLOCK_MAP[key+'_pr_'+acc])||BLOCK_MAP[key]||LEGACY_D_BLOCK_MAP[key]||null);
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
  const passAt=+state.block.passAt;  // tech-fix-2.2: start of the current pass (limguard.js lgPassStart)
  state.block={id:state.block.id,next:n|0};
  if(dueOn)state.block.dueOn=dueOn;
  if(isFinite(passAt)&&passAt>0)state.block.passAt=passAt;
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
  state.block.passAt=Date.now();
}

function goNextLevel(state,block){
  const ea=normalizeEndActions(unwrapBlock(block)&&unwrapBlock(block).end_actions);
  if(!ea.next_level)return false;
  if(!state)return false;
  state.block={id:ea.next_level,next:0,passAt:Date.now()};
  state.next=0;
  return true;
}

function itemFromBlock(it){
  const row={exId:resolveExId(it.exId),sets:+it.sets,min:+it.min,max:+it.max,rest:+it.rest};
  if(it.cardio){row.cardio=1;row.sets=1;row.rest=0;return row}  // cardio finish: min/max are minutes
  if(it.unit==='sec'||it.sec)row.sec=1;
  if(it.role==='c'||it.role==='a')row.role=it.role;  // tech-fix-1 UI RIR: optional trainer role in the block JSON
  return row;
}

// tech-fix-1 UI RIR: role of an exercise for the RIR table — 'c' main multi-joint, 'a' accessory / single-joint.
const BLOCK_ROLE_A=new Set(['calf-bw','calf-db','calf','seated-calf','smith-calf','mk-standing-calf-raise-machine','hip-abduction','lc','lc-seated','le','nlc','towel-leg-curl','reverse-hyper','sglb','tibialis-raise',
  'fly','incline-db-fly','mk-cable-pec-fly','pec-deck','straight-arm-pulldown','mk-dumbbell-shrug','smith-shrug','shr','superman','hyp',
  'lr','mk-dumbbell-rear-delt-fly','mk-prone-y-t-raises','reverse-pec-deck','rfly','single-arm-cable-lateral','mk-cable-seated-rope-face-pull','fp','mk-barbell-upright-row','yr','mk-band-row']);
const BLOCK_ROLE_C=new Set(['cgb','smith-close-grip','chin']);
const BLOCK_ROLE_A_GROUPS=new Set(['Бицепс','Трицепс','Пресс','Разминка']);
function blockRole(it){
  if(it&&(it.role==='c'||it.role==='a'))return it.role;
  const id=it&&it.exId;if(!id)return'c';
  if(BLOCK_ROLE_C.has(id))return'c';
  if(BLOCK_ROLE_A.has(id))return'a';
  const e=typeof exBy==='function'?exBy(id):null;
  return e&&BLOCK_ROLE_A_GROUPS.has(e.group)?'a':'c';
}
// rir_target of one workout: phase (by workout number) → block → null (the app falls back to PR_RIR of the level).
// tech-fix-2: also lo ≤ hi (an inverted range [3,1] is invalid → level fallback)
function blockRirOk(t){return!!(t&&Array.isArray(t.c)&&Array.isArray(t.a)&&t.c.length===2&&t.a.length===2&&[...t.c,...t.a].every(x=>typeof x==='number'&&isFinite(x)&&x>=0&&x<=6)&&t.c[0]<=t.c[1]&&t.a[0]<=t.a[1])}
function blockRirTarget(b,w){
  if(!b||!w)return null;const n=+w.n;
  const ph=(b.phases||[]).find(p=>p&&Array.isArray(p.workouts)&&n>=p.workouts[0]&&n<=p.workouts[1]&&blockRirOk(p.rir_target));
  const t=ph?ph.rir_target:(blockRirOk(b.rir_target)?b.rir_target:null);
  return t?{c:t.c.slice(),a:t.a.slice()}:null;
}
// Workout of the block for a plan day (by its number n): used at run time, so plans saved before this change work too.
function blockWorkoutOf(b,day,dayIdx){
  b=unwrapBlock(b);if(!b||!Array.isArray(b.workouts))return null;
  const n=day&&day.n!=null?+day.n:(dayIdx|0)+1;
  return b.workouts.find(w=>+w.n===n)||b.workouts[n-1]||null;
}
// Day context for auto-weight: block deload (GC-07), block has its own deloads (awDeload), rir_target (UI RIR).
function blockDayCtx(dayIdx){
  if(typeof S==='undefined'||!S||!S.block||!S.block.id)return null;
  const b=getBlock(S.block.id);if(!b)return null;
  const day=S.program&&S.program[dayIdx];
  const w=blockWorkoutOf(b,day,dayIdx);
  return{deload:!!((w&&w.deload)||(day&&day.deload)),blockHasDeload:(b.workouts||[]).some(x=>x&&x.deload),rirTarget:(day&&day.rirTarget)||blockRirTarget(b,w)};
}

// Limitations (back / knees / shoulders): swap inside the block for a trainer alternative of the same main muscles.
// tech-fix-1 GC-03: impact cardio has a knee risk letter here (jump / jump-rope already have «k» in META).
const BLOCK_CARDIO_RISK={'mk-treadmill-run':'k'};
function blockRisk(id){
  const m=typeof META!=='undefined'&&META[id];
  return(m?(String(m).split('|')[1]||''):'')+(BLOCK_CARDIO_RISK[id]||'');
}
function blockLimOk(id,a){
  const lim=Array.isArray(a&&a.lim)?a.lim:[];if(!lim.length)return true;  // tech-fix-2: old data may hold a non-array
  const r=blockRisk(id);return!lim.some(l=>r.includes(l));
}
// tech-fix-1 GC-02: replacement candidates in order: 1) trainer ALT of the exercise; 2) ALT of those alternatives;
// 3) exercises that list this one as their alternative (and their ALT); 4) BLOCK_LIM_FALLBACK (trainer table for ids with an empty ALT).
const BLOCK_LIM_FALLBACK={'rdl-db':['ht-db','ht','ht-bw','sglb','lc','lc-seated'],'rdl-kb':['ht-db','ht-bw','sglb'],'rdl-band':['ht-bw','sglb'],
  'hyp':['ht','ht-db','ht-bw','sglb','lc'],'superman':['ht-bw','sglb'],'mk-rkc-plank':['mk-front-plank','dbug','bdog'],'suitcase-carry':['mk-front-plank','dbug','bdog'],
  'mk-barbell-deadlift':['ht','ht-db','ht-bw','sglb','lc'],'backpack-row':['towel-row','inv'],'nlc':['towel-leg-curl','sglb','ht-bw'],
  // overhead press with a shoulder limitation → lateral / rear-delt work below shoulder height (proposal, see questions.md)
  'ohp':['lr','single-arm-cable-lateral','mk-prone-y-t-raises'],'dsp':['lr','single-arm-cable-lateral','mk-prone-y-t-raises'],'standing-db-press':['lr','single-arm-cable-lateral','mk-prone-y-t-raises'],
  'smith-seated-press':['lr','single-arm-cable-lateral','mk-prone-y-t-raises'],'ppu':['mk-prone-y-t-raises','lr']};
function blockLimCands(id){
  const A=(typeof ALT!=='undefined'&&ALT)||{};const L=[],seen=new Set([id]);
  const add=x=>{if(x&&!seen.has(x)){seen.add(x);L.push(x)}};
  const own=A[id]||[];
  own.forEach(add);
  own.forEach(x=>(A[x]||[]).forEach(add));
  for(const k in A){const l=A[k];if(Array.isArray(l)&&l.includes(id)){add(k);l.forEach(add)}}
  (BLOCK_LIM_FALLBACK[id]||[]).forEach(add);
  return L;
}
// Home without a pull-up bar: these need the bar (same split as the b_bar / b_nobar blocks).
const BLOCK_NEEDS_BAR=new Set(['chin','hanging-knee-raise','inv','pull','scap-pullup','dead-hang']);
function blockHasClip(id){return typeof movekitFile!=='function'||!!movekitFile(id)}
// review-nov-2 (v155): a limitation swap may pick an exercise Eduards allowed without a clip (plan.js NO_CLIP_OK: walk-brisk only at
// home / bodyweight). Before, jump with a knee limitation found walk-brisk but dropped it for the missing clip → cardio removed.
function blockClipOk(id,a){const place=(a&&a.place)||'g';return typeof clipOk==='function'?clipOk(id,place):blockHasClip(id)}
function blockIsCardio(it){return!!(it&&it.cardio)||(typeof isCardio==='function'&&isCardio(it.exId))}
// tech-fix-2: one safe pick for one item (block builder, plan check of saved plans, open workout).
// used = ids already in the workout. a.places (equipment profile) wins over a.place.
function blockLimAvail(a){
  const place=(a&&a.place)||'g',places=(a&&a.places)||place;
  const noBar=place==='b'&&!(a.bar===true||a.bar==='1'||a.bar===1);
  return x=>(typeof eqAvail!=='function'||eqAvail(x,places))&&!(noBar&&BLOCK_NEEDS_BAR.has(x));
}
function blockLimConf(id,a){const lim=Array.isArray(a&&a.lim)?a.lim:[];if(!id||!lim.length)return[];const r=blockRisk(id);return lim.filter(l=>r.includes(l))}
function blockLimPick(it,a,used){
  used=used||new Set();
  const same=(x,y)=>typeof eqSameMuscle!=='function'||eqSameMuscle(x,y);
  const avail=blockLimAvail(a);
  const cardio=blockIsCardio(it);
  const fb=new Set(BLOCK_LIM_FALLBACK[it.exId]||[]);  // trainer fallback table: may cross the muscle group (hyp → hip thrust)
  return blockLimCands(it.exId).find(x=>x&&!used.has(x)&&blockLimOk(x,a)&&avail(x)&&blockClipOk(x,a)&&
    (cardio?(typeof isCardio!=='function'||isCardio(x)):((fb.has(x)||same(it.exId,x))&&!(typeof isCardio==='function'&&isCardio(x)))))||null;
}
function blockLimSwap(items,a,warn){
  if(!a||!(a.lim||[]).length)return items;
  const used=new Set(items.map(i=>i.exId));
  const out=[];
  items.forEach(it=>{
    if(blockLimOk(it.exId,a)){out.push(it);return}
    const lim=blockLimConf(it.exId,a);
    const ok=blockLimPick(it,a,used);
    if(ok){used.add(ok);out.push(Object.assign({},it,{exId:ok,swapped:1}));if(warn)warn.push({from:it.exId,to:ok,lim});return}
    // No safe replacement: the exercise is not kept silently — it is left out of this workout with a visible note.
    out.push({__rm:it,lim});
  });
  // v160 (task 3): the only safe replacement is often already in this workout (knees at home: reverse-lunge / bwsq → step-bw).
  // Then its sets are added to that exercise (same main muscles, no risk letter, clip, place), up to BLOCK_MERGE_CAP sets per
  // exercise, so the training goal and the muscle volume stay. Nothing risky comes back. Otherwise: left out with a note.
  const res=out.filter(x=>!x.__rm);
  out.filter(x=>x.__rm).forEach(({__rm:it,lim})=>{
    const add=blockLimMerge(it,res,a);
    if(warn)warn.push(add?{from:it.exId,to:add.to,lim,add:add.n}:{from:it.exId,to:null,lim});
  });
  return res;
}
const BLOCK_MERGE_CAP=5;
// Adds the sets of a removed item to the safe same-muscle exercise already in list (copy of that item; list changed in place).
// Returns {to, n} or null. Used by the plan builder (blockLimSwap) and by the fix of a saved plan (limguard lgApplyDay).
function blockLimMerge(it,list,a,skip){
  if(!it||blockIsCardio(it))return null;
  const fb=new Set(BLOCK_LIM_FALLBACK[it.exId]||[]),avail=blockLimAvail(a);
  const same=x=>typeof eqSameMuscle!=='function'||eqSameMuscle(it.exId,x);
  const ok=(y,k)=>y&&!y.cardio&&!(skip&&skip.has(k))&&blockLimOk(y.exId,a)&&avail(y.exId)&&blockClipOk(y.exId,a)&&(fb.has(y.exId)||same(y.exId))&&(+y.sets||0)<BLOCK_MERGE_CAP;
  let k=-1;for(const id of blockLimCands(it.exId)){k=list.findIndex((y,j)=>y&&y.exId===id&&ok(y,j));if(k>=0)break}
  if(k<0)return null;
  const n=Math.min(+it.sets||1,BLOCK_MERGE_CAP-(+list[k].sets||0)),cp=Object.assign({},list[k]);
  cp.sets=(+cp.sets||0)+n;cp.merged=(cp.merged||0)+n;list[k]=cp;return{to:cp.exId,n};
}
// tech-fix-2: warm-up and cool-down of a block day (wu.cardio / wu.mob / wu.ramp / cd.cardio / cd.stretch) were built
// without the limitations (shell profile lim:[]) and the ramp followed the original first exercise. Same rule here:
// cardio → safe cardio with a clip; ramp → the exercise that replaced the main lift, or no ramp; mobility / stretch with a
// risk letter → left out with a note. Returns {wu,cd} copies; notes go to warn with part 'wu' / 'cd'.
function blockLimWuCd(wu,cd,a,swapMap,warn){
  const lim=(a&&a.lim)||[];if(!lim.length)return{wu,cd};
  const W=wu?JSON.parse(JSON.stringify(wu)):wu,C=cd?JSON.parse(JSON.stringify(cd)):cd;
  const note=(part,from,to)=>{if(warn&&!warn.some(w=>w.part===part&&w.from===from))warn.push({from,to:to||null,lim:blockLimConf(from,a),part})};
  const cardio=(part,o)=>{if(!o||!o.cardio||!o.cardio.id||blockLimOk(o.cardio.id,a))return;const from=o.cardio.id;
    const to=blockLimPick({exId:from,cardio:1},a,new Set());note(part,from,to);if(to)o.cardio.id=to;else delete o.cardio};
  const list=(part,arr,key)=>(arr||[]).filter(x=>{const id=x&&x[key];if(!id||blockLimOk(id,a))return true;note(part,id,null);return false});
  if(W){cardio('wu',W);if(W.mob)W.mob=list('wu',W.mob,'id');
    if(W.ramp){W.ramp=W.ramp.map(r=>{if(!r||!r.exId||blockLimOk(r.exId,a))return r;const to=swapMap&&swapMap[r.exId];note('wu',r.exId,to);return to?Object.assign({},r,{exId:to}):null}).filter(Boolean);if(!W.ramp.length)delete W.ramp}}
  if(C){cardio('cd',C);if(C.stretch)C.stretch=list('cd',C.stretch,'id')}
  return{wu:W,cd:C};
}
// Text of the limitation notes of a day (RU source; i18n translates the fixed phrases and exercise names).
const BLOCK_LIM_RU={s:'спина',k:'колени',p:'плечи'};
function blockLimWarnHTML(day){
  const W=(day&&day.limWarn)||[];if(!W.length)return'';
  const nm=id=>{const e=typeof exBy==='function'?exBy(id):null;const n=e&&e.name&&e.name!=='?'?e.name:id;return typeof esc==='function'?esc(n):n};
  const lims=l=>(l||[]).map(x=>BLOCK_LIM_RU[x]||x).map(x=>`<span>${x}</span>`).join(', ');
  const pt=w=>w.part==='wu'?'<span>Разминка</span>: ':w.part==='cd'?'<span>Заминка</span>: ':'';
  const rows=W.map(w=>w.to?`<div>⚠ <span>Ограничение</span> (${lims(w.lim)}): ${pt(w)}<b>${nm(w.from)}</b> → <b>${nm(w.to)}</b>${w.add?` <span>(подходы добавлены:</span> +${w.add})`:''}</div>`
    :`<div>⚠ <span>Ограничение</span> (${lims(w.lim)}): ${pt(w)}<b>${nm(w.from)}</b> — <span>убрано из тренировки: безопасной замены нет</span></div>`);
  const removed=W.some(w=>!w.to);
  return`<div class="mut limwarn" style="font-size:13px;margin:4px 0">${rows.join('')}${removed?'<div><span>Если хочешь вернуть упражнение — сначала посоветуйся с врачом или тренером.</span></div>':''}</div>`;
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
// tech-fix-2.1: workout duration after limitation / equipment swaps and removals. est_min of the block is kept as the base;
// the difference of the main items (same item time as dayMin: sets × (40 s + rest), cardio = max minutes) is added.
// est0 = item minutes of the block workout as written; old saved plans without est0 → taken from the block file by the day number.
function blockItemsMin(items){return typeof itemTime==='function'?(items||[]).reduce((t,i)=>t+(i&&i.exId?itemTime(i):0),0)/60:null}
function blockEstBase(d){
  if(!d)return null;if(d.est0!=null)return d.est0;
  if(typeof S==='undefined'||!S||!S.block||!S.block.id||typeof getBlock!=='function')return null;
  const b=unwrapBlock(getBlock(S.block.id)),w=b&&(b.workouts||[]).find(x=>+x.n===+d.n);
  return w&&w.est_min!=null&&+w.est_min===+d.est?blockItemsMin((w.items||[]).map(itemFromBlock)):null;
}
function blockEstMin(d){
  const base=blockEstBase(d),now=blockItemsMin(d&&d.items);
  if(base==null||now==null)return Math.round(d.est);
  return Math.max(1,Math.round(d.est+now-base));
}
function planFromBlock(block,a){
  const b=unwrapBlock(block);
  const shell=warmCoolShell(b,a||{});
  const dayIdx=blockDayIndex(b);
  const days=(b.workouts||[]).map((w,i)=>{
    const wc=attachWarmCool(shell,w,dayIdx);
    const warn=[];
    const day={name:blockDayName(w),n:w.n!=null&&+w.n>0?+w.n:i+1,items:blockLimSwap((w.items||[]).map(itemFromBlock),a,warn)};
    if(w.deload)day.deload=1;  // tech-fix-1 GC-07: the block deload reaches auto-weight
    const rt=blockRirTarget(b,w);if(rt)day.rirTarget=rt;
    // tech-fix-2: warm-up / cool-down pass the same limitation check (ramp follows the replaced main lift)
    const sm={};warn.forEach(w=>{if(w.to)sm[w.from]=w.to});
    const wc2=blockLimWuCd(wc.wu,wc.cd,a,sm,warn);
    if(warn.length)day.limWarn=warn;
    if(wc2.wu)day.wu=wc2.wu;
    if(wc2.cd)day.cd=wc2.cd;
    if(w.est_min!=null){day.est=w.est_min;day.est0=blockItemsMin((w.items||[]).map(itemFromBlock))}  // tech-fix-2.1: base for the duration after swaps
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


function blockFileUrl(id){return id&&/^[a-z0-9_]+$/.test(id)?((typeof R2_OF!=='undefined'&&R2_OF[id])?'data/blocks/r2/'+id+'.json':(typeof BLOCK_VARIANT_OF!=='undefined'&&BLOCK_VARIANT_OF[id])?'data/blocks/variants/'+id+'.json':'data/blocks/'+id+'.json'):null}
function cacheBlockFile(id){
  const url=blockFileUrl(id);
  if(!url)return;
  try{
    const sw=typeof navigator!=='undefined'&&navigator.serviceWorker;
    if(sw&&sw.controller&&typeof sw.controller.postMessage==='function'){
      sw.controller.postMessage({type:'cache-block',url:url});
      return;
    }
    if(typeof caches!=='undefined'&&caches.open){
      const name=typeof SW_CACHE==='string'?SW_CACHE:(typeof C==='string'?C:null);
      if(!name)return;
      Promise.resolve(caches.open(name)).then(c=>fetch(new Request(url,{cache:'reload'})).then(r=>{if(r.ok)return c.put(url,r)})).catch(function(){});
    }
  }catch(e){}
}
function blockOnApplied(gen){
  if(typeof S==='undefined'||!S)return;
  if(gen&&gen.blockId)S.block={id:gen.blockId,next:0,passAt:Date.now()};
  else if(S.block)delete S.block;
  if(S.block&&S.block.id)cacheBlockFile(S.block.id);
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

function blockVariantHTML(gen){
  const cur=gen.blockId,E=typeof esc==='function'?esc:(x=>x);
  return`<div class="card bvar"><b>Вариант программы</b>${gen.variantOpts.map(id=>{const t=BLOCK_VARIANT_RU[id]||[id,''];
    return`<button class="full${id===cur?' pri sel':''}" data-bv="${E(id)}" style="margin-top:6px;text-align:left;height:auto;padding:10px 12px">${id===cur?'✓ ':''}${E(t[0])}${t[1]?`<br><span class="mut" style="font-size:13px">${E(t[1])}</span>`:''}</button>`}).join('')}</div>`;
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
      S.program=plan.days;S.progName=nb.title||S.progName;S.why=plan.why;S.next=0;cacheBlockFile(S.block.id);
    }
    if(typeof save==='function')save();
    if(typeof go==='function')go('today');
  };
}

function renderBlockToday(pick){
  const b=getBlock(S.block.id);
  if(!b)return false;
  migrateBlockState(S);
  if(blockIsComplete(S,b)){renderBlockEnd(b);return true}
  const plan0=S.block.next|0;
  if(!S.program||!S.program[plan0]){
    const plan=planFromBlock(b,S.prof||{});
    S.program=plan.days;
    if(b.title)S.progName=b.title;
  }
  // D-238/v139: overview or an opened workout; planned day stays S.block.next
  if(typeof renderTodayScreen==='function'){renderTodayScreen(pick);return true}
  return false;
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
        if(b){const p=planFromBlock(b,a);const note=blockAccNote(a);if(note)p.advice=note;else if(b.equipment_note_ru)p.advice=b.equipment_note_ru;
          if(BLOCK_VARIANT_OF[b.id]){const base=blockBaseForProfile(a);p.variantOf=BLOCK_VARIANT_OF[b.id];p.variantBase=blockVariantBase(b.id,base);p.variantOpts=blockVariantOpts(b.id,base);
            const vd=BLOCK_VARIANT_DAYS[b.id]||+b.days_per_week||0;if(vd&&a&&+a.days!==vd)p.variantDays=vd}
          return p}
      }
      return orig(a);
    };
  }
  if(typeof today==='function'){
    const orig=today;
    today=function(sel){
      if(blockActive()&&!S.active){if(renderBlockToday(sel))return}
      return orig(sel);
    };
  }
  if(typeof renderPreview==='function'){
    const orig=renderPreview;
    renderPreview=function(){
      // tech-fix-2: the preview shows the real frequency of the chosen variant (B = 4×/week even when 6 was asked);
      // PV.pr.a keeps the questionnaire answer so the A / B choice stays available on the next click.
      const g0=typeof PV!=='undefined'&&PV&&PV.gen;
      if(g0&&g0.variantOf&&PV.pr&&PV.pr.a){const ask=PV.pr.a,vd=BLOCK_VARIANT_DAYS[g0.blockId]||+ask.days;
        const disp=Object.assign({},ask,{days:vd,daysAsked:+ask.daysAsked||+ask.days,variant:g0.blockId});
        PV.pr=Object.assign({},PV.pr,{a:disp});try{orig()}finally{PV.pr=Object.assign({},PV.pr,{a:ask})}}
      else orig();
      const gen=typeof PV!=='undefined'&&PV&&PV.gen;
      if(gen&&gen.variantOpts&&gen.variantOpts.length>1&&typeof app!=='undefined'&&app&&app.insertAdjacentHTML)app.insertAdjacentHTML('afterbegin',blockVariantHTML(gen));
      if(typeof app!=='undefined'&&app&&app.querySelectorAll)app.querySelectorAll('[data-bv]').forEach(x=>x.onclick=()=>{PV.pr.a=Object.assign({},PV.pr.a,{variant:x.dataset.bv});PV.gen=generate(PV.pr.a);renderPreview()});
      const btn=typeof $==='function'?$('#pstart'):null;
      if(!btn)return;
      const prev=btn.onclick;
      btn.onclick=function(){
        const was=S.program;
        if(prev)prev.apply(this,arguments);
        if(S.program===was)return;
        const g=typeof PV!=='undefined'&&PV&&PV.gen;
        blockOnApplied(g);
        if(g&&g.variantOf){const vd=BLOCK_VARIANT_DAYS[g.blockId]||g.variantDays||S.days;S.prof=Object.assign({},S.prof||{},{variant:g.blockId,days:vd});S.days=vd;
          if(!S.prof.daysAsked)S.prof.daysAsked=vd}
        if(typeof save==='function')save();
      };
    };
  }
  if(typeof migrateLegacyPlans==='function'){
    const orig=migrateLegacyPlans;
    migrateLegacyPlans=function(){orig();if(typeof S!=='undefined')migrateBlockState(S)};
  }
})();
