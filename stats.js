'use strict';
// P-303: weekly muscle volume, personal records, estimated 1RM (Epley).
// Pure logic, no DOM. History is read through histList() / the workouts array (D-207 IndexedDB store).

function isWarmupSet(s){
 if(!s||typeof s!=='object')return false;
 if(s.wu||s.warmup||s.warm||s.isWarmup||s.isWu)return true;
 const k=String(s.kind||s.type||s.role||'').toLowerCase();
 return k==='warmup'||k==='wu'||k==='warm';
}
function isWorkingSet(s){
 if(!s||typeof s!=='object')return false;
 if(isWarmupSet(s))return false;
 if(s.done===false)return false;
 return true;
}
function setWeight(s){const w=+s.w;return isFinite(w)&&w>0?w:0}
function setReps(s){const r=+s.r;return isFinite(r)&&r>0?r:0}

// Epley: w×(1+reps/30) only for 1–10 reps. Otherwise no estimate (null).
function epley1RM(w,r){
 w=+w;r=+r;
 if(!(w>0)||!isFinite(w)||!isFinite(r))return null;
 if(r<1||r>10)return null;
 return w*(1+r/30);
}

// Monday 00:00:00.000 – next Monday 00:00:00.000, local time. setDate keeps DST correct.
function weekBounds(now){
 now=now==null?Date.now():+now;
 const d=new Date(now);
 d.setHours(0,0,0,0);
 const day=d.getDay();
 d.setDate(d.getDate()+(day===0?-6:1-day));
 const curStart=d.getTime();
 const nxt=new Date(d);nxt.setDate(d.getDate()+7);
 const prev=new Date(d);prev.setDate(d.getDate()-7);
 return{current:{start:curStart,end:nxt.getTime()},previous:{start:prev.getTime(),end:curStart}};
}
function workoutTime(w){return w?+(w.start||w.end||0):0}

function defaultGroupOf(id){try{if(typeof exBy==='function')return exBy(id).group||''}catch(e){}return ''}
function defaultIsBW(id){try{if(typeof BWX!=='undefined'&&BWX&&BWX.has)return BWX.has(id)}catch(e){}return false}

function weeklyVolume(workouts,opts){
 opts=opts||{};
 const now=opts.now!=null?+opts.now:Date.now();
 const groupOf=opts.groupOf||defaultGroupOf;
 const isBW=opts.isBodyweight||defaultIsBW;
 const bounds=weekBounds(now);
 const empty=()=>({sets:0,tonnage:0,byGroup:{}});
 const acc={current:empty(),previous:empty()};
 const add=(bucket,group,sets,tonnage)=>{
  if(!group||group==='Кардио'||group==='Разминка')return;
  bucket.sets+=sets;bucket.tonnage+=tonnage;
  const g=bucket.byGroup[group]||{group,sets:0,tonnage:0};
  g.sets+=sets;g.tonnage+=tonnage;bucket.byGroup[group]=g;
 };
 (workouts||[]).forEach(w=>{
  const t=workoutTime(w);
  let which=null;
  if(t>=bounds.current.start&&t<bounds.current.end)which='current';
  else if(t>=bounds.previous.start&&t<bounds.previous.end)which='previous';
  else return;
  (w.items||[]).forEach(it=>{
   const g=groupOf(it.exId);
   let sets=0,tonnage=0,bw=isBW(it.exId);
   (it.sets||[]).forEach(s=>{
    if(!isWorkingSet(s))return;
    sets++;
    if(!bw){const ww=setWeight(s),rr=setReps(s);if(ww&&rr)tonnage+=ww*rr}
   });
   add(acc[which],g,sets,tonnage);
  });
 });
 const toList=b=>Object.values(b.byGroup).sort((a,c)=>c.sets-a.sets||a.group.localeCompare(c.group,'ru'));
 return{
  bounds,
  current:{sets:acc.current.sets,tonnage:acc.current.tonnage,groups:toList(acc.current)},
  previous:{sets:acc.previous.sets,tonnage:acc.previous.tonnage,groups:toList(acc.previous)}
 };
}

function recordsForExercise(workouts,exId){
 let bestW=0,bestWReps=0,bestReps=0,bestRepsW=0,best1=null,best1set=null;
 (workouts||[]).forEach(w=>{
  (w.items||[]).forEach(it=>{
   if(it.exId!==exId)return;
   (it.sets||[]).forEach(s=>{
    if(!isWorkingSet(s))return;
    const ww=setWeight(s),rr=setReps(s);
    if(ww>bestW||(ww===bestW&&rr>bestWReps)){bestW=ww;bestWReps=rr}
    if(rr>bestReps||(rr===bestReps&&ww>bestRepsW)){bestReps=rr;bestRepsW=ww}
    const e=epley1RM(ww,rr);
    if(e!=null&&(best1==null||e>best1)){best1=e;best1set={w:ww,r:rr}}
   });
  });
 });
 return{
  bestWeight:bestW||null,
  bestWeightReps:bestW?bestWReps:null,
  bestRepsAtWeight:bestRepsW&&bestReps?{w:bestRepsW,r:bestReps}:null,
  best1RM:best1,
  best1RMSet:best1set
 };
}

function allRecords(workouts,ids){
 return(ids||[]).map(id=>({exId:id,...recordsForExercise(workouts,id)}));
}

// New records in `fresh` versus prior history. First ever set is not a record (nothing to beat).
// At most one entry per (exercise, type[, weight for reps]) — not spammy.
function detectNewRecords(prior,fresh){
 const items=(fresh&&fresh.items)||[];
 const out=[];
 items.forEach(it=>{
  const before=recordsForExercise(prior,it.exId);
  const after=recordsForExercise((prior||[]).concat([fresh]),it.exId);
  if(after.bestWeight&&before.bestWeight&&after.bestWeight>before.bestWeight)
   out.push({exId:it.exId,type:'weight',prev:before.bestWeight,next:after.bestWeight,reps:after.bestWeightReps});
  const weights=new Set();
  (it.sets||[]).forEach(s=>{if(isWorkingSet(s)&&setWeight(s))weights.add(setWeight(s))});
  weights.forEach(ww=>{
   let prevR=0;
   (prior||[]).forEach(pw=>(pw.items||[]).forEach(x=>{
    if(x.exId!==it.exId)return;
    (x.sets||[]).forEach(s=>{if(isWorkingSet(s)&&setWeight(s)===ww)prevR=Math.max(prevR,setReps(s))});
   }));
   let newR=0;
   (it.sets||[]).forEach(s=>{if(isWorkingSet(s)&&setWeight(s)===ww)newR=Math.max(newR,setReps(s))});
   if(newR>prevR&&prevR>0)out.push({exId:it.exId,type:'reps',weight:ww,prev:prevR,next:newR});
  });
  if(after.best1RM!=null&&before.best1RM!=null&&after.best1RM>before.best1RM+0.05)
   out.push({exId:it.exId,type:'e1rm',prev:before.best1RM,next:after.best1RM});
 });
 const seen=new Set();
 return out.filter(r=>{const k=r.type==='reps'?r.type+':'+r.exId+':'+r.weight:r.type+':'+r.exId;if(seen.has(k))return false;seen.add(k);return true});
}

if(typeof module!=='undefined'&&module.exports)module.exports={isWarmupSet,isWorkingSet,epley1RM,weekBounds,weeklyVolume,recordsForExercise,allRecords,detectNewRecords,setWeight,setReps,workoutTime};
