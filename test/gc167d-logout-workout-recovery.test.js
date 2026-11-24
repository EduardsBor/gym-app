'use strict';
// Real app.js + sync.js, isolated simulated devices and an in-memory Supabase.
const test = require('node:test');
const assert = require('node:assert/strict');
const { server, device, start, W, cloudIds } = require('./fixtures/int-boot.js');
const owner = { id: 'owner-test-0000', email: 'owner@example.invalid' };
const other = { id: 'other-test-0000', email: 'other@example.invalid' };

function logout(a) {
  return a.run('mzDoLogout()');
}
const screen = a => a.run('document.querySelector("#app").innerHTML');
const forceLogout = a => a.run('document.querySelector("#mzoutanyway").onclick()');

test('GC-167: shared phone, the other account’s normal logout preserves an isolated offline workout', async () => {
  const srv = server(), phone = device('shared phone'), second = device('second phone');
  let a = await start(srv, phone);
  await a.signIn(owner);
  await a.addWorkout(W('t1', 1_000));
  await a.sync();
  a.run(`Date.now = () => ${a.run('S.updatedAt') + 1000}`);
  phone.online = false;
  await a.addWorkout(W('t2', 2_000));
  await logout(a);
  assert.match(screen(a), /id="mzunsynced"/);
  await forceLogout(a);
  await a.settle();
  phone.online = true;
  await a.fire('online');
  assert.equal(a.run('mzSignedIn()'), false);
  assert.deepEqual(cloudIds(srv, owner.id), ['t1']);

  await a.signIn(other);
  assert.deepEqual(a.ids(), []);
  await a.addWorkout(W('other-1', 3_000));
  await a.sync();
  assert.deepEqual(a.ids(), ['other-1']);
  assert.deepEqual(cloudIds(srv, other.id), ['other-1']);
  assert.ok(!srv.log.some(e => e.user === other.id && e.ids.some(id => id === 't1' || id === 't2')));
  await logout(a);
  await a.settle();
  assert.equal(a.run('mzSignedIn()'), false);

  a = await start(srv, phone);
  assert.equal(a.run('mzSignedIn()'), false);
  await a.signIn(owner);
  await a.sync();
  assert.deepEqual(a.ids(), ['t1', 't2'], 'owner should recover T2 after the other account signs out');
  assert.deepEqual(cloudIds(srv, owner.id), ['t1', 't2']);
  const a2 = await start(srv, second);
  await a2.signIn(owner);
  await a2.sync();
  assert.deepEqual(a2.ids(), ['t1', 't2']);
  assert.ok(!srv.log.some(e => e.user === other.id && e.ids.some(id => id === 't1' || id === 't2')));
});

test('GC-167: a local save in the same millisecond as the cloud acknowledgment still warns on logout', async () => {
  const srv = server(), phone = device('phone');
  let a = await start(srv, phone);
  await a.signIn(owner);
  await a.addWorkout(W('t1', 1_000));
  await a.sync();
  const acknowledgedAt = a.run('S.updatedAt');
  a.run(`Date.now = () => ${acknowledgedAt}`);
  phone.online = false;
  await a.addWorkout(W('t2', 2_000));
  assert.equal(a.run('S.updatedAt'), acknowledgedAt, 'the timestamps really match');
  await logout(a);
  assert.match(screen(a), /id="mzunsynced"/, 'normal logout warns before clearing the phone');
  await forceLogout(a);
  await a.settle();
  assert.equal(a.run('mzSignedIn()'), false);
  assert.equal(phone.ls.has('sb-example-auth-token'), false);
  assert.equal(phone.ls.has('gc_auth'), false);
  phone.online = true;
  await a.fire('online');
  assert.equal(a.run('mzSignedIn()'), false, 'network return never signs the owner in automatically');
  assert.deepEqual(cloudIds(srv, owner.id), ['t1']);
  a = await start(srv, phone);
  assert.equal(a.run('mzSignedIn()'), false, 'restart does not restore the closed session either');
  await a.signIn(owner);
  await a.sync();
  assert.deepEqual(a.ids(), ['t1', 't2']);
  assert.deepEqual(cloudIds(srv, owner.id), ['t1', 't2']);
});

test('GC-167: a late cloud acknowledgment must not mark a newer workout as synced', async () => {
  const srv = server(), phone = device('phone');
  const a = await start(srv, phone);
  await a.signIn(owner);
  await a.addWorkout(W('t1', 1_000));
  let acknowledge;
  phone.nextUpsertAck = new Promise(resolve => { acknowledge = resolve; });
  const uploading = a.run('__mz.sync()');
  await a.settle();
  assert.deepEqual(cloudIds(srv, owner.id), ['t1'], 'the server got the earlier snapshot');
  const sentAt = a.run('S.updatedAt');
  a.run(`Date.now = () => ${sentAt}`);
  phone.online = false;
  await a.addWorkout(W('t2', 2_000));
  acknowledge();
  await uploading;
  assert.equal(a.run('mzHasUnsyncedWorkouts()'), true, 'the acknowledgment did not include the newer workout');
  assert.equal(JSON.parse(phone.ls.get('gym')).syncPending, true, 'the marker survives a restart');
  assert.equal(srv.rows.get(owner.id).payload.syncPending, undefined, 'the device marker is never uploaded');
  await logout(a);
  assert.match(screen(a), /id="mzunsynced"/);
  await forceLogout(a);
  phone.online = true;
  await a.signIn(owner);
  assert.deepEqual(cloudIds(srv, owner.id), ['t1', 't2']);
});

test('GC-167: if IndexedDB is unwritable, switching accounts does not overwrite the only copy of an offline workout', async () => {
  const srv = server(), phone = device('phone');
  const a = await start(srv, phone);
  await a.signIn(owner);
  await a.addWorkout(W('t1', 1_000)); await a.sync();
  phone.online = false; phone.failIdbPut = true;
  await a.addWorkout(W('t2', 2_000));
  await logout(a);
  assert.match(screen(a), /id="mzunsynced"/);
  await forceLogout(a);
  phone.online = true;
  await a.signIn(other);
  assert.equal(a.run('mzSignedIn()'), false, 'reject the switch rather than replace the only durable copy');
  assert.match(screen(a), /id="mzgate"/);
  assert.deepEqual(cloudIds(srv, other.id), null);
  assert.deepEqual(JSON.parse(phone.ls.get('gym')).workouts.map(w => w.id), ['t1', 't2']);
  phone.failIdbPut = false;
  await a.signIn(owner);
  assert.deepEqual(cloudIds(srv, owner.id), ['t1', 't2']);
});

test('GC-167: explicit clear-this-phone still erases isolated workouts, without deleting either cloud history', async () => {
  const srv = server(), phone = device('phone');
  const a = await start(srv, phone);
  await a.signIn(owner);
  await a.addWorkout(W('t1', 1_000)); await a.sync();
  phone.online = false;
  await a.addWorkout(W('t2', 2_000));
  await logout(a);
  assert.match(screen(a), /id="mzunsynced"/);
  await forceLogout(a);
  phone.online = true;
  await a.signIn(other);
  await a.addWorkout(W('other-1', 3_000)); await a.sync();
  assert.deepEqual(a.bundle(owner.id), ['t1', 't2']);
  await a.run('mzDoLogout({wipeLocal:true})');
  assert.equal(a.run('mzSignedIn()'), false);
  assert.equal(phone.dbs.has('moyzal'), false, 'device-only clear really deletes isolated copies');
  assert.deepEqual(cloudIds(srv, owner.id), ['t1']);
  assert.deepEqual(cloudIds(srv, other.id), ['other-1']);
});
