'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname,'..');
const s = fs.readFileSync(path.join(root,'sync.js'),'utf8');
const slice = (a,b) => {const i=s.indexOf(a),j=s.indexOf(b,i);assert.ok(i>=0&&j>i);return s.slice(i,j);};
const payload = new Function(slice('  function payloadOf(src)','  // Облако без ограничений')+'\n'+slice('  function tsAt(','  function bodyPhotoKeys(')+'\nreturn payloadOf;')();
const now='2026-11-21T00:00:00Z';
const grant={v:1,at:now};
const cases=[['missing',{},false],['boolean',{consentHealth:true},false],['empty',{consentHealth:{}},false],['invalid date',{consentHealth:{v:1,at:'wrong'}},false],['valid',{consentHealth:grant},true],['revoked',{consentHealth:grant,healthConsentRevokedAt:'2026-11-23T00:00:00Z'},false],['equal',{consentHealth:grant,healthConsentRevokedAt:now},false],['regrant',{consentHealth:grant,healthConsentRevokedAt:'2026-11-20T00:00:00Z'},true],['invalid revoke',{consentHealth:grant,healthConsentRevokedAt:'bad'},false],['unknown version',{consentHealth:{v:2,at:now}},false]];
for(const [name,patch,expected] of cases)test('GC-168 '+name,()=>{
  const inp={prof:{sex:'f',lim:['k']},why:[['Пол: женский',['sx']]],weightKg:70,body:[{id:'b1'}],workouts:[{id:'w1',hr:{avg:123,max:143},kcal:246,kcalSource:'hr',items:[{pain:true,sets:[{w:20,r:8,done:true}]}]}],...patch};
  const before=JSON.stringify(inp), out=payload(inp);
  assert.equal(out.prof.sex==='f',expected);
  assert.equal(out.weightKg===70,expected);
  assert.equal(Array.isArray(out.body),expected);
  assert.equal(out.workouts[0].items[0].pain===true,expected);
  for (const key of ['hr','kcal','kcalSource']) assert.equal(Object.hasOwn(out.workouts[0],key),expected);
  assert.equal(out.workouts[0].id,'w1');
  assert.deepEqual(out.workouts[0].items[0].sets,inp.workouts[0].items[0].sets);
  assert.equal(out.why.length>0,expected);
  assert.equal(JSON.stringify(inp),before,'local state unchanged');
  assert.equal(out.workouts.length,1);
});

const {server,device,start,W}=require('./fixtures/int-boot.js');
const user={id:'gc168-test-user',email:'gc168@example.invalid'};
const health={hr:{source:'ble',avg:123,max:143,zones:[5,15,25,35,45],hrMax:177},kcal:246,kcalSource:'hr'};
const fields=['hr','kcal','kcalSource'];
const workout=(app,id)=>app.J(`S.workouts.find(w=>w.id===${JSON.stringify(id)})`);
const cloudWorkout=(srv,id)=>srv.rows.get(user.id).payload.workouts.find(w=>w.id===id);
const assertScrubbed=w=>{
  assert.ok(w, 'the ordinary workout is preserved');
  for(const k of fields) assert.equal(Object.hasOwn(w,k),false,`no synced ${k}`);
  assert.deepEqual(w.items[0].sets,[{w:60,r:10,done:true}]);
};
const assertHealth=w=>{
  assert.deepEqual(Object.fromEntries(fields.map(k=>[k,w[k]])),health);
};

function setConsentClock(a,ms) {
  a.run(`Date = class ConsentTestClock extends Date {
    constructor(...args){super(...(args.length?args:[${ms}]));}
    static now(){return ${ms};}
  }`);
}

function grantViaBody(a) {
  a.run('consentView(); document.querySelector("#cs").onchange({target:{checked:true}}); document.querySelector("#csok").onclick()');
}

function withdraw(a) {
  // The simulated DOM doesn't parse assigned innerHTML; provide the two anchors the Profile wrapper needs.
  a.run('app.querySelector = sel => sel==="#helpc"?document.querySelector(sel):null; app.querySelectorAll = sel => sel==="p.mut"?[document.querySelector("#version")]:[];');
  a.run('more(); document.querySelector("#cwd").onclick()');
}

test('GC-168: no cloud health summary without consent, including MET estimates; local workouts stay intact',async()=>{
  const srv=server(),a=await start(srv,device('android'));
  await a.signIn(user);
  await a.addWorkout(W('with-hr',2000,health));
  await a.addWorkout(W('met-only',3000,{kcal:165,kcalSource:'met'}));
  await a.sync();
  assertScrubbed(cloudWorkout(srv,'with-hr'));
  assertScrubbed(cloudWorkout(srv,'met-only'));
  assertHealth(workout(a,'with-hr'));
  assert.equal(workout(a,'met-only').kcal,165);
  assert.equal(workout(a,'met-only').kcalSource,'met');
});

test('GC-168: offline Profile withdrawal reaches two devices; explicit later consent restores cloud summary',async()=>{
  const srv=server(),phone=device('android'),a=await start(srv,phone);
  const t=Date.now();
  setConsentClock(a,t);
  await a.signIn(user);
  grantViaBody(a);
  await a.addWorkout(W('w',2000,health));
  await a.sync();
  assertHealth(cloudWorkout(srv,'w'));
  const b=await start(srv,device('second phone'));
  await b.signIn(user);
  await b.sync();
  assertHealth(workout(b,'w'));

  phone.online=false;
  setConsentClock(a,t+1000);
  withdraw(a);
  await a.sync();
  assertHealth(cloudWorkout(srv,'w')); // an offline action can't reach the cloud yet
  assertHealth(workout(a,'w'));
  phone.online=true;
  await a.fire('online');
  assertScrubbed(cloudWorkout(srv,'w'));
  assert.equal(srv.rows.get(user.id).payload.consentHealth,null);
  assert.equal(srv.rows.get(user.id).payload.healthConsentRevokedAt,new Date(t+1000).toISOString());
  assertHealth(workout(a,'w'));
  await b.sync();
  assertScrubbed(cloudWorkout(srv,'w'));
  assert.equal(b.run('S.consentHealth'),null);
  const c=await start(srv,device('clean browser'));
  await c.signIn(user);
  await c.sync();
  assertScrubbed(workout(c,'w'));

  setConsentClock(a,t+2000);
  grantViaBody(a);
  await a.sync();
  assertHealth(cloudWorkout(srv,'w'));
  await b.sync();
  assert.equal(b.run('S.consentHealth.v'),1);
  assertHealth(workout(b,'w'));
  assert.deepEqual(srv.consent.map(x=>x.row.action),['grant','revoke','grant']);
});

test('GC-168: a newer sanitized cloud version does not erase local metrics for the matching workout',async()=>{
  const srv=server(),phone=device('android'),a=await start(srv,phone);
  await a.signIn(user);
  await a.addWorkout(W('w',2000,health));
  await a.sync();
  const row=srv.rows.get(user.id);
  const synced=cloudWorkout(srv,'w');
  synced.end+=1000;
  synced.items[0].sets[0].w=62;
  row.payload.workouts.push(W('different',4000));
  await a.sync();
  assertHealth(workout(a,'w'));
  assert.equal(workout(a,'w').items[0].sets[0].w,62);
  for(const k of fields) {
    assert.equal(Object.hasOwn(workout(a,'different'),k),false);
    assert.equal(Object.hasOwn(cloudWorkout(srv,'w'),k),false);
  }
});
