'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./fixtures/tf1-boot.js');

test('Starter no-jump: exactly 3 eligible home blocks, preserving all durations, doses and non-cardio exercise data',()=>{
  const {J,failed}=boot();
  assert.deepEqual(failed,[]);
  const result=J(`(()=>{
    const three=['fit_nov_3_b_nobar_b36','loss_nov_3_b_nobar_b36','fit_nov_2_b_nobar_b32'];
    const bar=new Set(['w_scpull','scap-pullup','dead-hang','pull','chin','inv','hanging-knee-raise','mk-hanging-knee-raises','mk-parralel-bar-dips']);
    const ids=d=>d.items.map(i=>i.exId).concat(wuRows(d.wu).map(i=>i.id),cdRows(d.cd).map(i=>i.id));
    const items=d=>d.items.filter(i=>!blockIsCardio(i));
    const errors=[],r={};
    for(const id of three){
      const a={place:'b',bar:'0',lim:[]},n=planFromBlock(getBlock(id),a),before=JSON.stringify(n);
      const w=starterLowImpact(n,a);
      r[id]=[n.days.length,n.days.filter(d=>d.items.some(i=>i.exId==='jump')).length,n.days.filter(d=>d.wu.cardio.id==='jump').length,
        w.days.filter(d=>d.items.some(i=>i.exId==='walk-brisk')).length,w.days.filter(d=>d.wu.cardio.id==='walk-brisk').length];
      if(JSON.stringify(n)!==before||w.blockId!==n.blockId||w.timeLabel!==n.timeLabel||w.why!==n.why||
        JSON.stringify(a)!=='{"place":"b","bar":"0","lim":[]}')errors.push(id+': state changed');
      w.days.forEach((d,i)=>{
        const base=n.days[i];
        if(ids(d).some(x=>starterLowImpactIsJump(x)||bar.has(x)))errors.push(id+': jump or bar');
        if(d.wu.cardio.min!==base.wu.cardio.min||d.wu.cardio.note!==base.wu.cardio.note||d.wu.mob!==base.wu.mob||d.wu.ramp!==base.wu.ramp||d.cd!==base.cd)errors.push(id+': non-cardio phase info');
        const numeric=it=>[it.sets,it.min,it.max,it.rest];
        if(JSON.stringify(d.items.filter(blockIsCardio).map(numeric))!==JSON.stringify(base.items.filter(blockIsCardio).map(numeric)))errors.push(id+': prescribed cardio dose');
        if(JSON.stringify(items(d))!==JSON.stringify(items(base)))errors.push(id+': strength');
        if(d.est!==base.est||d.est0!==base.est0||dayMin(d,a)!==dayMin(base,a)||d.n!==base.n||d.deload!==base.deload||d.rirTarget!==base.rirTarget)errors.push(id+': day info');
      });
      const unaffected=starterLowImpact(planFromBlock(getBlock(id),{...a,lim:['k']}),{...a,lim:['k']});
      if(unaffected.days.some(d=>ids(d).some(starterLowImpactIsJump)))errors.push(id+': existing knee rule');
    }
    const scope=BLOCK_INDEX.filter(x=>starterLowImpactAvailable(x.id)).map(x=>x.id).sort();
    const technique=['ru','en','lv'].map(l=>!!(l==='en'?TECH_EN:l==='lv'?TECH_LV:TECH)['walk-brisk']);
    return {counts:r,scope,errors,technique,clipAllowed:clipOk('walk-brisk','b'),noActualClip:!movekitFile('walk-brisk')};
  })()`);
  assert.deepEqual(result.errors,[]);
  assert.deepEqual(result.scope,['fit_nov_2_b_nobar_b32','fit_nov_3_b_nobar_b36','loss_nov_3_b_nobar_b36']);
  assert.deepEqual(result.counts,{
    fit_nov_3_b_nobar_b36:[36,24,36,36,36],
    loss_nov_3_b_nobar_b36:[36,36,36,36,36],
    fit_nov_2_b_nobar_b32:[32,16,32,32,32],
  });
  assert.deepEqual(result.technique,[true,true,true]);
  assert.equal(result.clipAllowed,true);
  assert.equal(result.noActualClip,true);
});

test('Starter no-jump: existing risk filters win, default is reversible, and unrelated or previously saved plans are untouched',()=>{
  const {J}=boot();
  const r=J(`(()=>{
    const a={place:'b',bar:'0',lim:['s','p']},id='loss_nov_3_b_nobar_b36';
    S.program=[{name:'Saved',items:[{exId:'jump'}]}];
    S.active={id:'Started',items:[{exId:'jump',sets:[{r:2,done:true}]}]};
    S.workouts=[{id:'Logged',items:[{exId:'jump',sets:[{r:2,done:true}]}]}];
    S.block={id,next:2};S.prof={...a};S.consentHealth=false;
    const snapshot=()=>JSON.stringify([S.program,S.active,S.workouts,S.block,S.prof,S.consentHealth]);
    const before=snapshot();
    const b=getBlock(id),original=planFromBlock(b,a),opt=starterLowImpact(original,a),back=planFromBlock(b,a);
    const flags={...a,lim:['s','k','p']},byLim=planFromBlock(b,flags);
    const edited=planFromBlock(b,a);
    edited.days[0].items.find(it=>it.exId==='jump').exId='jump-rope';
    const editConverted=starterLowImpact(edited,a);
    const nonStarter=planFromBlock(getBlock('mass_nov_3_b_nobar_b36'),a);
    const unaffected=starterLowImpact(nonStarter,a)===nonStarter;
    return [
      JSON.stringify(original)===JSON.stringify(back),
      original.days.some(d=>d.items.some(i=>i.exId==='jump')),
      opt.days.every(d=>d.items.every(i=>!starterLowImpactIsJump(i.exId))&&d.cd.stretch.every(i=>blockLimOk(i.id,a))),
      starterLowImpact(byLim,flags)===byLim,
      opt.days.every((d,i)=>d.limWarn===original.days[i].limWarn),
      editConverted.days[0].items.some(i=>i.exId==='walk-brisk')&&edited.days[0].items.some(i=>i.exId==='jump-rope'),
      unaffected,before===snapshot()
    ];
  })()`);
  assert.deepEqual(r,[true,true,true,true,true,true,true,true]);
});

test('Featured Home assignment guards all six generated blocks and scoped replacements without expanding profile, history, or generic modes', () => {
  const b=boot();
  const r=b.J(`(()=>{
    const result={days:0,fail:[],accepted:[],mode:[]};
    for(const [id,,,kit] of CATALOG_STARTERS.filter(x=>x[3].startsWith('home'))){
      for(const mode of starterLowImpactAvailable(id)?[1,2]:[1]){
        const a0={place:'g',places:'gd',bar:1,sex:'m',lim:[]};
        const ctx=starterHomeContext(id,mode,a0);
        result.accepted.push([kit,mode,ctx.place,ctx.places,ctx.bar,ctx.starterSlides]);
        for(let mask=0;mask<8;mask++){
          const lim=['s','k','p'].filter((x,i)=>mask&(1<<i));
          const scoped=starterHomeContext(id,mode,{...a0,lim});
          const generated=planFromBlock(getBlock(id),scoped);
          const plan=mode===2?starterLowImpact(generated,scoped):generated;
          const allow=blockLimAvail(scoped);
          for(const day of plan.days){
            result.days++;
            const all=day.items.map(i=>i.exId).concat(wuRows(day.wu).map(i=>i.id),cdRows(day.cd).map(i=>i.id));
            const bad=all.filter(id=>!allow(id)||!blockLimOk(id,scoped));
            if(bad.length)result.fail.push([id,mode,lim,bad]);
          }
        }
      }
    }
    const home='loss_nov_3_b_nobar_b36',otherHome='mass_nov_3_b_nobar_b36',gym='fit_nov_3_g_b36';
    for(const [id,x] of [[home,1],[home,2],[home,'2'],[home,0],[home,3],[otherHome,1],[otherHome,2],[gym,1],[gym,2]]){
      const holder={block:{id,next:0,starterMode:x}};migrateBlockState(holder);result.mode.push(holder.block.starterMode||0);
    }
    S.block={id:home,next:0,starterMode:2};S.prof={place:'b',bar:'0',lim:['p']};
    S.active={blk:home,starterMode:2,items:[{exId:'dbug',sug:{to:'hanging-knee-raise'},sets:[{r:5,w:'',done:false}]}]};
    result.progression=[awLadderSwap(S.active,0),S.active.items[0].exId,starterReplacementOk(S.active,'bd'),starterReplacementOk(S.active,'jump'),starterReplacementOk(S.active,'mk-diamond-push-ups')];
    const unchanged=JSON.stringify(S.active);delete S.active.starterMode;const old=JSON.stringify(S.active);
    result.legacy=[starterReplacementOk(S.active,'mk-parralel-bar-dips'),starterReplacementOk(S.active,'jump'),old===JSON.stringify(S.active),unchanged!==old];
    return result;
  })()`);
  assert.equal(b.failed.length,0,b.failed.join('\n'));
  assert.equal(r.days,2528);
  assert.deepEqual(r.fail,[]);
  assert.ok(r.accepted.every(([kit,,place,places,bar,slides])=>place==='b'&&places==='b'&&bar==='0'&&slides===(kit==='homeSlide')));
  assert.deepEqual(r.mode,[1,2,0,0,0,1,0,0,0]);
  assert.deepEqual(r.progression,[false,'dbug',false,false,true]);
  assert.deepEqual(r.legacy,[true,true,true,true]);
});
