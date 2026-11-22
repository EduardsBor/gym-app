'use strict';
// tech-fix-2 P1: the limitation check on every path an exercise reaches a workout.
const test = require('node:test');
const assert = require('node:assert/strict');
const { boot, DAY } = require('./fixtures/tf1-boot.js');

const now = Date.now();
const LIMS = [['s'], ['k'], ['p'], ['s', 'k'], ['s', 'p'], ['k', 'p'], ['s', 'k', 'p']];
function st(extra) {
  return Object.assign({ lang: 'ru', goal: 'str', days: 5, next: 0, prof: { goal: 'str', sex: 'm', level: 'adv', days: 5, len: 90, place: 'g', prio: [], lim: [] },
    workouts: [], custom: [], body: [], pg: {}, pgSince: now - 40 * DAY }, extra || {});
}
// a plan saved before the limitation (or by the old code): built without limitations, then the limitation is set
function oldPlan(b, blockId, lim) {
  b.run(`S.block={id:${JSON.stringify(blockId)},next:0};S.program=planFromBlock(getBlock(${JSON.stringify(blockId)}),{goal:'str',level:'adv',days:5,place:'g',lim:[]}).days;S.prof.lim=${JSON.stringify(lim)};save()`);
}

test('tf2 wu/cd: 244 blocks × 7 limitation sets — warm-up / cool-down have no risky exercise, every removal or swap has a note', () => {
  const b = boot({ state: st() });
  const r = b.J(`(()=>{const L=${JSON.stringify(LIMS)};let bad=[],notes=0,blocks=0;
    for(const e of BLOCK_INDEX){const B=getBlock(e.id);if(!B)continue;blocks++;for(const lim of L){const a={lim,place:String(e.place||'g')[0],bar:/nobar/.test(e.place)?'0':'1'};
      const p=planFromBlock(B,a);p.days.forEach((d,i)=>{const ids=[];const wu=d.wu||{},cd=d.cd||{};if(wu.cardio)ids.push(wu.cardio.id);(wu.mob||[]).forEach(x=>ids.push(x.id));(wu.ramp||[]).forEach(x=>ids.push(x.exId));
        if(cd.cardio)ids.push(cd.cardio.id);(cd.stretch||[]).forEach(x=>ids.push(x.id));d.items.forEach(x=>ids.push(x.exId));
        ids.forEach(id=>{if(!blockLimOk(id,a))bad.push(e.id+' '+lim.join('')+' '+i+' '+id)});notes+=(d.limWarn||[]).filter(w=>w.part).length})}}
    return{bad:bad.slice(0,10),n:bad.length,notes,blocks}})()`);
  assert.equal(r.blocks, 244);
  assert.equal(r.n, 0, r.bad.join('\n'));
  assert.ok(r.notes > 0);
});

test('tf2 wu: the ramp follows the main lift that replaced the risky one (str_adv_5_g_b35, knees: smith-squat ramp → replacement)', () => {
  const b = boot({ state: st() });
  const r = b.J(`(()=>{const B=getBlock('str_adv_5_g_b35');const p0=planFromBlock(B,{lim:[],place:'g'}),p=planFromBlock(B,{lim:['k'],place:'g'});
    const out=[];p0.days.forEach((d,i)=>{const r0=(d.wu&&d.wu.ramp||[])[0];if(!r0||blockLimOk(r0.exId,{lim:['k']}))return;const r1=(p.days[i].wu&&p.days[i].wu.ramp||[])[0];
      const w=(p.days[i].limWarn||[]).find(x=>x.from===r0.exId&&!x.part);out.push({from:r0.exId,ramp:r1&&r1.exId,to:w&&w.to,first:p.days[i].items[0].exId})});return out})()`);
  assert.ok(r.length > 0);
  for (const x of r) { assert.ok(x.to, x.from + ' has a replacement'); assert.equal(x.ramp, x.to, JSON.stringify(x)); }
});

test('tf2 eqAdapt: the equipment swap never brings in an exercise that conflicts with the limitations', () => {
  const b = boot({ state: st() });
  const r = b.J(`(()=>{const out={checked:0,bad:[],blockedRisky:0};for(const lim of ${JSON.stringify(LIMS)}){S.prof.lim=lim;for(const e of allEx()){for(const pl of ['d','b','db']){
      const x=eqSwapFor(e.id,pl,new Set());if(x===e.id)continue;out.checked++;if(!blockLimOk(x,{lim}))out.bad.push(lim.join('')+' '+e.id+'→'+x)}}}
    // the same swaps without limitations: some of them were risky before (proof the filter matters)
    for(const lim of ${JSON.stringify(LIMS)}){S.prof.lim=[];for(const e of allEx())for(const pl of ['d','b']){const x=eqSwapFor(e.id,pl,new Set());if(x!==e.id&&!blockLimOk(x,{lim})&&blockLimOk(e.id,{lim}))out.blockedRisky++}}
    return out})()`);
  assert.ok(r.checked > 50, String(r.checked));
  assert.deepEqual(r.bad, []);
  assert.ok(r.blockedRisky > 0, 'without the filter the equipment swap would bring risky exercises');
});

test('tf2 swapModal: conflicting alternatives are shown greyed with the reason and cannot be tapped', () => {
  const b = boot({ state: st() });
  const r = b.J(`(()=>{const res={};for(const [cur,lim] of [['sq',['k']],['ohp',['p']],['rdl',['s']],['mk-treadmill-run',['k']]]){const a={place:'g',lim};
    swapModal(cur,a,()=>{});const h=$('#modal').innerHTML;const tap=[...h.matchAll(/data-p="([^"]+)"/g)].map(m=>m[1]);
    res[cur]={tap,badTap:tap.filter(x=>!blockLimOk(x,a)),risky:(h.match(/class="row lgrisky"/g)||[]).length,head:/Не подходит при твоих ограничениях:/.test(h)}}return res})()`);
  for (const [cur, x] of Object.entries(r)) {
    assert.deepEqual(x.badTap, [], cur);
    assert.ok(x.risky > 0 && x.head, cur + ' shows the conflicting ones separately');
  }
  assert.ok(!r['mk-treadmill-run'].tap.includes('jump') && !r['mk-treadmill-run'].tap.includes('jump-rope'));
});

test('tf2 add by hand: risky exercise is marked, needs a confirm, the added item keeps the acknowledgement', () => {
  const b = boot({ state: st() });
  b.run(`S.prof.lim=['k'];globalThis.__ask=0;globalThis.confirm=()=>{__ask++;return false}`);
  assert.equal(b.run(`lgConfirmAdd('sq')`), false);
  assert.equal(b.run(`lgConfirmAdd('lc')`), true);
  assert.equal(b.run('__ask'), 1);
  b.run(`pickEx(()=>{});`);
  const h = b.run(`$('#el').innerHTML`);
  assert.match(h, /data-p="sq">⚠ /);
  assert.equal(b.run(`lgAckOf('sq')`), 'k');
  assert.equal(b.run(`lgAckOf('lc')`), undefined);
});

test('tf2 final check: a saved plan with a risky exercise does not start silently — modal; nothing changes until the user decides', () => {
  const b = boot({ state: st() });
  oldPlan(b, 'str_adv_5_g_b35', ['k']);
  b.run(`S.workouts.push({id:'h1',start:Date.now()-3*864e5,end:Date.now()-3*864e5+3600e3,dayIdx:0,dayName:'x',notes:'',items:[{exId:'smith-squat',ns:3,min:3,max:5,rest:180,sets:[{w:100,r:5,done:true}]}]});S.pg['smith-squat']={st:{success:1,miss:0},next:{weight:100,sets:3,target:5},first:Date.now()-60*864e5,last:Date.now()-3*864e5};save()`);
  const di = b.run(`S.program.findIndex(d=>lgAuditDay(d))`);
  assert.ok(di >= 0);
  const before = b.run('JSON.stringify({p:S.program,w:S.workouts,pg:S.pg})');
  b.run(`today()`);
  b.run(`startW(${di})`);
  assert.equal(b.run('!!S.active'), false, 'not started');
  assert.match(b.run(`$('#modal').innerHTML`), /id="lgstart"/);
  assert.equal(b.run('JSON.stringify({p:S.program,w:S.workouts,pg:S.pg})'), before, 'plan, history and weights untouched before consent');
  b.run(`lgStartFix(${di})`);
  const A = b.J(`S.active.items.map(i=>i.exId)`);
  assert.ok(A.length > 0);
  assert.equal(b.run(`S.active.items.every(i=>blockLimOk(i.exId,{lim:['k']}))`), true);
  assert.equal(b.run(`S.program[${di}].items.every(i=>blockLimOk(i.exId,{lim:['k']}))`), true);
  assert.equal(b.run(`!!(S.program[${di}].wu&&S.program[${di}].wu.cardio&&!blockLimOk(S.program[${di}].wu.cardio.id,{lim:['k']}))`), false);
  assert.ok(b.run(`S.program[${di}].limWarn.filter(w=>w.user).length`) > 0);
  assert.equal(b.run('JSON.stringify(S.workouts)'), JSON.stringify(JSON.parse(before).w));
  assert.equal(b.run(`JSON.stringify(S.pg['smith-squat'])`), JSON.stringify(JSON.parse(before).pg['smith-squat']));
  assert.ok(b.run(`S.limLog.filter(x=>x.kind==='fix').length`) > 0);
});

test('tf2 final check: «Начать без изменений» keeps the exercises with an acknowledgement; a new limitation asks again', () => {
  const b = boot({ state: st() });
  oldPlan(b, 'str_adv_5_g_b35', ['k']);
  const di = b.run(`S.program.findIndex(d=>lgAuditDay(d))`);
  const ex = b.J(`S.program[${di}].items.map(i=>i.exId)`);
  b.run(`lgStartKeep(${di})`);
  assert.deepEqual(b.J('S.active.items.map(i=>i.exId)').filter(x => ex.includes(x)).length > 0, true);
  b.run(`S.active=null;save()`);
  assert.equal(b.run(`lgAuditDay(S.program[${di}])`), null, 'acknowledged for knees');
  b.run(`startW(${di})`);
  assert.ok(b.run('!!S.active'), 'starts without the modal');
  b.run(`S.active=null;S.prof.lim=['k','s'];save()`);
  assert.ok(b.run(`!!lgAuditPlan().length`), 'a new limitation is checked again');
});

test('tf2 limitations changed after the plan: Today shows the check; «Заменить безопасными» fixes every day, history kept', () => {
  const b = boot({ state: st() });
  oldPlan(b, 'str_adv_5_g_b35', []);
  assert.deepEqual(b.J('lgAuditPlan()'), []);
  b.run(`S.prof.lim=['p'];save()`);
  const P = b.J('lgAuditPlan().map(x=>x.d)');
  assert.ok(P.length > 0);
  assert.match(b.run('lgPlanCardHTML(lgAuditPlan())'), /Проверка ограничений[\s\S]*Заменить безопасными[\s\S]*Оставить как есть/);
  const n = b.run('S.program.length');
  b.run('lgFixAll()');
  assert.deepEqual(b.J('lgAuditPlan()'), []);
  assert.equal(b.run('S.program.length'), n);
  assert.equal(b.run(`S.program.some(d=>d.items.some(i=>blockLimConf(i.exId,{lim:['p']}).length&&!i.limAck))`), false);
  assert.equal(b.run(`S.program.every(d=>d.items.length>0)`), true);
});

test('tf2 open / resumed workout: flagged items not done yet → replace / remove / keep with consent; done sets untouched', () => {
  const b = boot({ state: st() });
  b.run(`S.prof.lim=['k'];S.program=[{name:'x',items:[{exId:'sq',sets:3,min:5,max:8,rest:120}]}];
    S.active={id:'a1',start:Date.now(),dayIdx:0,dayName:'x',notes:'',items:[
      {exId:'sq',ns:3,min:5,max:8,rest:120,sets:[{w:60,r:8,done:true},{w:60,r:8,done:false}]},
      {exId:'lp',ns:3,min:8,max:12,rest:90,sets:[{w:'',r:12,done:false}]},
      {exId:'jump',ns:1,min:10,max:20,rest:0,sets:[{w:'',r:20,done:false}]},
      {exId:'lc',ns:3,min:8,max:12,rest:90,sets:[{w:'',r:12,done:false}]}]};save()`);
  const L = b.J('lgAuditActive()');
  // tech-fix-2.1: the partly done sq is checked for its remaining set (before: one done set hid it); lc is safe
  assert.deepEqual(L.map(x => x.exId), ['sq', 'lp', 'jump']);
  assert.deepEqual(L[0].partial, { done: 1, left: 1 });
  const lp = L.find(x => x.exId === 'lp');
  b.run(`lgActiveFix(${lp.i},'swap')`);
  const it = b.J(`S.active.items[${lp.i}]`);
  if (lp.to) assert.equal(it.exId, lp.to); else assert.notEqual(it.exId, 'lp');
  const j = b.J('lgAuditActive()').find(x => x.exId === 'jump');
  b.run(`lgActiveFix(${j.i},'keep')`);
  assert.equal(b.run(`S.active.items.find(i=>i.exId==='jump').limAck`), 'k');
  assert.deepEqual(b.J('S.active.items[0].sets'), [{ w: 60, r: 8, done: true }, { w: 60, r: 8, done: false }]);
  assert.deepEqual(b.J('lgAuditActive().map(x=>x.exId)'), ['sq'], 'only the partly done sq is left (tf21-partial-exercise covers its options)');
});

test('tf2 ladder hint: «Пора усложнить» is not offered when the next step conflicts with the limitations', () => {
  const b = boot({ state: st() });
  b.run(`S.prof.lim=['s'];S.autoW=true`);
  const r = b.J(`(()=>{const it={exId:'pl',sets:[{w:'',r:30,done:false}],sug:{to:'mk-rkc-plank',target:30}};return{conf:lgConf('mk-rkc-plank'),h:awSugHTML(it,0)}})()`);
  assert.deepEqual(r.conf, ['s']);
  assert.doesNotMatch(r.h, /Пора усложнить/);
});

test('tf2 without limitations nothing changes: no plan check, no modal, swap list as before', () => {
  const b = boot({ state: st() });
  oldPlan(b, 'str_adv_5_g_b35', []);
  assert.deepEqual(b.J('lgAuditPlan()'), []);
  b.run('startW(0)');
  assert.ok(b.run('!!S.active'));
  assert.deepEqual(b.J('lgAuditActive()'), []);
});

test('tf2 health data: limitation notes / acknowledgements are stripped from the cloud copy without consent (sync.js)', () => {
  const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'sync.js'), 'utf8');
  const fn = src.slice(src.indexOf('function stripLimits'), src.indexOf('function keepLocalLimits'));
  for (const k of ['limAck', 'limWarn', 'limAckWuCd', 'limLog', 'limFrom', 'limStop']) assert.match(fn, new RegExp('delete [a-z.]*' + k));
});
