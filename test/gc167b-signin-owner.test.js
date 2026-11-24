'use strict';
// GC-167b (found in the real-account test on LIVE v168): on a fresh sign-in the account history from the cloud was saved once
// with NO owner (ownerUid is set only after pullAndMerge), so the next save isolated the account's own workouts as a «guest»
// bundle — a restorable copy of the account's data labelled «guest». The owner must be set as soon as the account data is taken,
// and binding the device's own guest data to an account must not duplicate identical records into the quarantine.
const test = require('node:test');
const assert = require('node:assert/strict');
const { server, device, start, W } = require('./fixtures/int-boot.js');
const U1 = { id: 'u1-test-0000', email: 'u1@example.invalid' }, U2 = { id: 'u2-test-0000', email: 'u2@example.invalid' };
const Q = a => (a.hist().quarantine || []).map(b => b.owner + ':' + b.workouts.length);

// the real server answers sign-in without the app knowing the owner yet: the session user is set, ownerUid is not
test('GC-167b: fresh device, account with history signs in → no quarantine bundle at all; IndexedDB owner = the account', async () => {
  const srv = server(), A = device('A');
  srv.rows.set(U1.id, { payload: { workouts: [W('c1', 1000), W('c2', 2000)], deletedWorkouts: [], goal: 'mass', program: [{ name: 'A', items: [] }] }, updated_at: new Date(2000).toISOString() });
  const a = await start(srv, A);
  await a.signIn(U1);
  await a.sync();
  assert.deepEqual(a.ids(), ['c1', 'c2']);
  assert.deepEqual(Q(a), [], 'no «guest» copy of the account history');
  assert.equal(a.hist().owner, U1.id);
  // a restart does not create one either
  const a2 = await start(srv, A);
  assert.deepEqual(Q(a2), []);
});

test('GC-167b: guest data transferred to an EMPTY account (consent path) → bound, no duplicate «guest» bundle', async () => {
  const srv = server(), A = device('A');
  const a = await start(srv, A);
  a.run('S.goal="mass";S.program=[{name:"A",items:[]}];S.obDone=1;save()');
  await a.addWorkout(W('g1', 1000));
  await a.signIn(U1);
  await a.sync();
  assert.deepEqual(a.ids(), ['g1']);
  assert.equal(a.run('S.ownerUid'), U1.id);
  assert.deepEqual(Q(a), []);
});

test('GC-167b: a guest bundle of REALLY different guest data is still isolated (declined transfer), identical copies are not', async () => {
  const srv = server(), A = device('A');
  srv.rows.set(U1.id, { payload: { workouts: [W('acc', 9000)], deletedWorkouts: [], goal: 'mass', program: [{ name: 'A', items: [] }] }, updated_at: new Date(9000).toISOString() });
  const a = await start(srv, A);
  a.run('S.goal="mass";S.program=[{name:"A",items:[]}];S.obDone=1;save()');
  await a.addWorkout(W('g-own', 1000));
  await a.signIn(U1);
  await a.run('__mz.snapshotUnboundGuest().then(()=>__mz.adoptAccountFromCloud())'); await a.settle();
  assert.deepEqual(a.ids(), ['acc']);
  assert.deepEqual(a.bundle('guest'), ['g-own']);
});

test('GC-167b: different ACCOUNTS with byte-identical records are still isolated (GC-167 scenario 6 rule kept)', async () => {
  const srv = server(), A = device('A');
  const same = W('same-1', 4000, { notes: 'identical' });
  srv.rows.set(U2.id, { payload: { workouts: [same], deletedWorkouts: [], goal: 'mass', program: [{ name: 'A', items: [] }] }, updated_at: new Date(3000).toISOString() });
  const a = await start(srv, A);
  await a.signIn(U1); await a.sync();
  A.online = false; await a.addWorkout(same);
  await a.run('__mz.finishLogout(false)'); await a.settle();
  A.online = true;
  await a.signIn(U2); await a.sync();
  assert.deepEqual(a.bundle(U1.id), ['same-1']);
});
