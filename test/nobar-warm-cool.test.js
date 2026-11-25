'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { boot } = require('./fixtures/tf1-boot.js');

test('Home without pull-up bar: all 60 blocks keep their main work and duration, with no hanging rows', () => {
  const { J, failed } = boot();
  assert.deepEqual(failed, []);
  const r = J(`(()=>{
    const picked=BLOCK_INDEX.filter(x=>x.place==='b_nobar');
    const bar=new Set(['w_scpull','scap-pullup','dead-hang','pull','chin','inv','hanging-knee-raise','mk-hanging-knee-raises','mk-parralel-bar-dips']);
    const issue=[];let days=0,warmChanged=0,coolChanged=0;const resolved=[];
    for(const x of picked){
      const b=getBlock(x.id),a={goal:x.goal,level:x.level,days:x.days,place:'b',bar:'0',lim:[]};
      const g=planFromBlock(b,a);
      if(!b||g.blockId!==x.id)issue.push(x.id+' identity');
      const live=generate(a);
      resolved.push(live.blockId);
      if(live.blockId!==blockIdForProfile(a)||!String(live.blockId).includes('_b_nobar_'))issue.push(x.id+' resolved identity');
      if(live.days.some(d=>wuRows(d.wu).concat(cdRows(d.cd)).some(r=>bar.has(r.id))||d.items.some(y=>bar.has(y.exId))))issue.push(x.id+' resolved hanging row');
      for(const [i,d] of g.days.entries()){
        days++;const w=b.workouts[i],rows=wuRows(d.wu).concat(cdRows(d.cd));
        const wrong=rows.map(r=>r.id).concat(d.items.map(y=>y.exId)).filter(id=>bar.has(id));
        if(wrong.length)issue.push(x.id+' day '+d.n+': '+wrong.join(','));
        if(JSON.stringify(d.items)!==JSON.stringify(w.items.map(itemFromBlock)))issue.push(x.id+' main changed');
        const base=blockItemsMin(w.items.map(itemFromBlock)),trimmed=d.items.slice(1);
        if(d.est!==w.est_min||d.est0!==base||dayMin(d,a)!==dayMin({...d,wu:null,cd:null},a)||
          dayMin({...d,items:trimmed},a)!==Math.max(1,Math.round(w.est_min+blockItemsMin(trimmed)-base)))issue.push(x.id+' duration');
        warmChanged+=d.wu.mob.filter(m=>m.id==='mk-prone-y-t-raises').length;
        coolChanged+=d.cd.stretch.filter(m=>m.id==='thoracic-rotation').length;
      }
    }
    return {profiles:picked.length,days,warmChanged,coolChanged,resolved:new Set(resolved).size,activeR2:resolved.some(id=>R2_OF[id]),issue:issue.slice(0,12)};
  })()`);
  assert.deepEqual(r.issue, []);
  assert.deepEqual([r.profiles,r.days,r.warmChanged,r.coolChanged,r.resolved,r.activeR2],[60,2100,528,1604,60,true]);
});

test('Bar-enabled and gym shells stay intact; no-bar replacements honor shoulder limitations and use existing clips', () => {
  const { J } = boot();
  const r = J(`(()=>{
    const count=(suffix,a)=>{const x=BLOCK_INDEX.filter(q=>q.place===suffix);let warm=0,cool=0;for(const it of x)for(const d of planFromBlock(getBlock(it.id),a).days){
      warm+=d.wu.mob.filter(r=>r.id==='w_scpull').length;
      cool+=d.cd.stretch.filter(r=>r.id==='dead-hang').length;
    }return [x.length,warm,cool]};
    const ids=['w_scpull','scap-pullup','dead-hang','thoracic-rotation'];
    const a={place:'b',bar:0,lim:['s','k','p']},x=BLOCK_INDEX.filter(q=>q.place==='b_nobar');
    const conflicts=x.flatMap(it=>planFromBlock(getBlock(it.id),a).days.flatMap(d=>wuRows(d.wu).concat(cdRows(d.cd)).map(row=>row.id)
      .filter(id=>ids.includes(id)||(id&&!blockLimOk(id,a)))));
    return {homeBar:count('b_bar',{place:'b',bar:'1',lim:[]}),gym:count('g',{place:'g',lim:[]}),conflicts:conflicts.slice(0,12),
      media:['mk-prone-y-t-raises','thoracic-rotation'].map(id=>[!!movekitFile(id),!!TECH[id],!!TECH_LV[id],!!TECH_EN[id]])};
  })()`);
  assert.deepEqual(r.homeBar,[60,528,1604]);
  assert.deepEqual(r.gym,[64,650,1444]);
  assert.deepEqual(r.conflicts,[]);
  assert.deepEqual(r.media,[[true,true,true,true],[true,true,true,true]]);
});

test('Saved no-bar block projects corrected day only when viewed/started; history, active snapshot and program stay untouched', () => {
  const { J } = boot();
  const r = J(`(()=>{
    const x='fit_nov_3_b_nobar_b36',a={place:'b',goal:'fit',level:'nov',days:3,bar:'0',lim:[]};
    const b=getBlock(x),d=planFromBlock(b,a).days[0];
    d.wu.mob.push({id:'w_scpull',dose:'8–12 повторов'});
    d.cd.stretch.push({id:'dead-hang',dose:'2 × 20–30 с'});
    S.prof=a;eqSetActive('body',{silent:true});S.program=[d];S.goal='fit';S.block={id:x,next:0,passAt:123};
    S.workouts=[{id:'old',start:2,items:[{exId:'pu',sets:[]}],warmDone:2,coolDone:1}];
    S.active={id:'opened-before-update',start:10,dayIdx:0,dayName:'A',items:[],notes:'preserve',warm:{t:1,wu:d.wu,c:[true]},cool:{cd:d.cd,c:[true]}};
    const active=JSON.stringify(S.active),plan=JSON.stringify(S.program),past=JSON.stringify(S.workouts),block=JSON.stringify(S.block);
    const shown=eqAdaptDay(d);
    const invariant=JSON.stringify(S.active)===active;
    S.active=null;startW(0);
    const W=S.active,rows=(wu,cd)=>wuRows(wu).concat(cdRows(cd)).map(r=>r.id).filter(id=>id==='dead-hang'||id==='w_scpull');
    return {oldAffected:rows(d.wu,d.cd).length>=2,view:rows(shown.wu,shown.cd),started:rows(W.warm.wu,W.cool.cd),
      before:invariant,program:JSON.stringify(S.program)===plan,history:JSON.stringify(S.workouts)===past,block:JSON.stringify(S.block)===block};
  })()`);
  assert.deepEqual(r,{oldAffected:true,view:[],started:[],before:true,program:true,history:true,block:true});
});
