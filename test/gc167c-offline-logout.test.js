'use strict';
// GC-167c (found in the real-account test on LIVE v169): «Выйти» while OFFLINE did not sign out — supabase-js signOut() needs the
// network, so the saved session stayed; when the network came back the «online» handler restored it and the app signed the
// user back in by itself (and synced). Sign-out must drop the session on the device whatever the network.
const test = require('node:test');
const assert = require('node:assert/strict');
const { server, device, start, W, cloudIds } = require('./fixtures/int-boot.js');
const U1 = { id: 'u1-test-0000', email: 'u1@example.invalid' }, U2 = { id: 'u2-test-0000', email: 'u2@example.invalid' };

test('GC-167c: «sign out anyway» OFFLINE → after the network is back the app stays signed out (no silent sign-in, no sync)', async () => {
  const srv = server(), A = device('A');
  const a = await start(srv, A);
  await a.signIn(U1); await a.addWorkout(W('t1', 1000)); await a.sync();
  A.online = false;
  await a.addWorkout(W('t2', 2000));
  await a.run('__mz.finishLogout(false)'); await a.settle();
  assert.equal(a.run('mzSignedIn()'), false);
  assert.equal(A.ls.has('sb-example-auth-token'), false, 'saved session removed on the device even offline');
  assert.equal(A.ls.has('gc_auth'), false);
  A.online = true;
  await a.fire('online');
  assert.equal(a.run('mzSignedIn()'), false, 'not signed back in when the network returns');
  assert.deepEqual(cloudIds(srv, U1.id), ['t1'], 'nothing synced without a session');
  // a restart does not restore it either
  const a2 = await start(srv, A);
  assert.equal(a2.run('mzSignedIn()'), false);
  // the unsynced workout is still on the device for U1
  assert.deepEqual(a2.ids(), ['t1', 't2']);
});

test('GC-167c: after the offline sign-out the NEXT account signs in normally; U1 unsynced workout isolated, not in U2', async () => {
  const srv = server(), A = device('A');
  const a = await start(srv, A);
  await a.signIn(U1); await a.addWorkout(W('t1', 1000)); await a.sync();
  A.online = false; await a.addWorkout(W('t2', 2000));
  await a.run('__mz.finishLogout(false)'); await a.settle();
  A.online = true; await a.fire('online');
  await a.signIn(U2); await a.sync();
  assert.deepEqual(a.ids(), []);
  assert.deepEqual(a.bundle(U1.id), ['t1', 't2']);
  assert.deepEqual(cloudIds(srv, U2.id), []);
  assert.deepEqual(cloudIds(srv, U1.id), ['t1']);
});

test('GC-167c: online sign-out still signs out on the server too (global) and clears the device as before', async () => {
  const srv = server(), A = device('A');
  const a = await start(srv, A);
  await a.signIn(U1); await a.addWorkout(W('t1', 1000)); await a.sync();
  await a.run('__mz.doLogout()'); await a.settle();
  assert.equal(a.run('mzSignedIn()'), false);
  assert.equal(A.user, null);
  assert.equal(A.ls.has('sb-example-auth-token'), false);
  assert.equal(a.run('S.workouts.length'), 0);
});
