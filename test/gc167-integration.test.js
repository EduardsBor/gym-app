'use strict';
// GC-167: integration — real app.js + sync.js on simulated devices with one fake Supabase server (row per user, sessions per
// device, offline). Accounts U1 / U2 are test ids; the real e-mail code step is replaced by opening the session on the server.
const test = require('node:test');
const assert = require('node:assert/strict');
const { server, device, start, W, cloudIds, cloudDeleted } = require('./fixtures/int-boot.js');
const U1 = { id: 'u1-test-0000', email: 'u1@example.invalid' }, U2 = { id: 'u2-test-0000', email: 'u2@example.invalid' };
// «owned» = ids each user really created; the cloud row of a user must never contain an id created by the other
function noForeign(srv, owned) {
  for (const e of srv.log) {
    const mine = owned[e.user] || new Set();
    for (const id of e.ids) assert.ok(mine.has(id), `cloud row of ${e.user} got a foreign record ${id} (upsert from ${e.dev})`);
  }
}

test('1+2+8: U1 → U2 → U1 on one device (normal sign-out): each sees only its own history, clouds stay separate', async () => {
  const srv = server(), A = device('A');
  let a = await start(srv, A);
  await a.signIn(U1); await a.addWorkout(W('u1-a', 1000)); await a.sync();
  assert.deepEqual(cloudIds(srv, U1.id), ['u1-a']);
  await a.run('__mz.doLogout()'); await a.settle();
  assert.equal(a.run('S.workouts.length'), 0, 'synced sign-out clears the device');
  await a.signIn(U2); await a.addWorkout(W('u2-a', 2000)); await a.sync();
  assert.deepEqual(a.ids(), ['u2-a']);
  await a.run('__mz.doLogout()'); await a.settle();
  a = await start(srv, A);   // even after a restart
  await a.signIn(U1); await a.sync();
  assert.deepEqual(a.ids(), ['u1-a']);
  assert.deepEqual(cloudIds(srv, U1.id), ['u1-a']);
  assert.deepEqual(cloudIds(srv, U2.id), ['u2-a']);
  noForeign(srv, { [U1.id]: new Set(['u1-a']), [U2.id]: new Set(['u2-a']) });
});

test('2b+7: U1 signs out with an UNSYNCED workout («sign out anyway») → U2 → U1: U1 gets it back, never in U2’s cloud', async () => {
  const srv = server(), A = device('A');
  const a = await start(srv, A);
  await a.signIn(U1); await a.addWorkout(W('u1-a', 1000)); await a.sync();
  A.online = false; await a.addWorkout(W('u1-x', 1500));        // trained offline, not synced
  await a.run('__mz.finishLogout(false)'); await a.settle();      // «Выйти всё равно» keeps the device copy
  A.online = true;
  await a.signIn(U2); await a.addWorkout(W('u2-a', 2000)); await a.sync();
  assert.deepEqual(a.ids(), ['u2-a'], 'U2 does not see U1');
  assert.deepEqual(a.bundle(U1.id), ['u1-a', 'u1-x'], 'U1 kept isolated on the device');
  A.online = false; await a.addWorkout(W('u2-x', 2500));        // U2 also leaves something unsynced and signs out anyway
  await a.run('__mz.finishLogout(false)'); await a.settle();
  A.online = true;
  await a.signIn(U1); await a.sync();
  assert.deepEqual(a.ids(), ['u1-a', 'u1-x'], 'U1 unsynced workout is back (same session, no restart)');
  assert.deepEqual(cloudIds(srv, U1.id), ['u1-a', 'u1-x'], 'and now it reached U1’s cloud');
  assert.deepEqual(cloudIds(srv, U2.id), ['u2-a']);
  assert.deepEqual(a.bundle(U2.id), ['u2-a', 'u2-x'], 'U2 unsynced kept for U2');
  noForeign(srv, { [U1.id]: new Set(['u1-a', 'u1-x']), [U2.id]: new Set(['u2-a', 'u2-x']) });
});

test('3: offline — workouts saved on the device, nothing lost on a restart offline, synced when the network is back', async () => {
  const srv = server(), A = device('A');
  let a = await start(srv, A);
  await a.signIn(U1); await a.sync();
  A.online = false;
  await a.addWorkout(W('o1', 1000)); await a.addWorkout(W('o2', 2000)); await a.sync();
  assert.equal(a.run('__mz.status'), 'offline');
  assert.deepEqual(cloudIds(srv, U1.id), []);
  a = await start(srv, A);                                    // app restarted while still offline
  assert.deepEqual(a.ids(), ['o1', 'o2']);
  A.online = true; await a.sync();
  assert.deepEqual(cloudIds(srv, U1.id), ['o1', 'o2']);
});

test('4: interrupted save (IndexedDB write fails, app killed) → after restart the workout is there and gets synced', async () => {
  const srv = server(), A = device('A');
  let a = await start(srv, A);
  await a.signIn(U1); await a.addWorkout(W('k0', 500)); await a.sync();
  A.failIdbPut = true; A.online = false;
  await a.addWorkout(W('k1', 1000));                           // localStorage written, IndexedDB write fails
  A.failIdbPut = false; A.online = true;
  a = await start(srv, A);                                    // «killed» and started again
  assert.deepEqual(a.ids(), ['k0', 'k1']);
  await a.sync();
  assert.deepEqual(cloudIds(srv, U1.id), ['k0', 'k1']);
  assert.deepEqual((a.hist().workouts || []).map(w => w.id).sort(), ['k0', 'k1'], 'IndexedDB caught up');
});

test('5: deletion on one device is honoured on the other one (cloud tombstone), not resurrected from its IndexedDB after a restart', async () => {
  const srv = server(), A = device('A'), B = device('B');
  const a = await start(srv, A);
  await a.signIn(U1); await a.addWorkout(W('d1', 1000)); await a.addWorkout(W('d2', 2000)); await a.sync();
  let b = await start(srv, B);
  await b.signIn(U1); await b.sync();
  assert.deepEqual(b.ids(), ['d1', 'd2']);
  await a.deleteWorkout('d1'); await a.sync();
  assert.deepEqual(cloudIds(srv, U1.id), ['d2']);
  assert.deepEqual(cloudDeleted(srv, U1.id), ['d1']);
  await b.sync();
  assert.deepEqual(b.ids(), ['d2']);
  b = await start(srv, B);
  assert.deepEqual(b.ids(), ['d2'], 'not back from B’s IndexedDB');
  await b.sync();
  assert.deepEqual(cloudIds(srv, U1.id), ['d2']);
});

test('6: byte-identical records of DIFFERENT owners (same id, same content) — neither owner loses its copy', async () => {
  const srv = server(), A = device('A');
  const same = W('same-1', 4000, { notes: 'identical' });
  // U2's cloud already has an identical record (e.g. both accounts imported the same backup file)
  srv.rows.set(U2.id, { payload: { workouts: [same], deletedWorkouts: [], goal: 'mass', program: [{ name: 'A', items: [] }] }, updated_at: new Date(3000).toISOString() });
  const a = await start(srv, A);
  await a.signIn(U1); await a.sync();
  A.online = false; await a.addWorkout(same);                  // U1 has it only on the device (unsynced)
  await a.run('__mz.finishLogout(false)'); await a.settle();
  A.online = true;
  await a.signIn(U2); await a.sync();
  assert.deepEqual(a.ids(), ['same-1'], 'U2 has its own copy');
  assert.deepEqual(a.bundle(U1.id), ['same-1'], 'U1 copy isolated too, not dropped because U2 has the same bytes');
  A.online = false; await a.addWorkout(W('u2-x', 5000));
  await a.run('__mz.finishLogout(false)'); await a.settle();
  A.online = true;
  await a.signIn(U1); await a.sync();
  assert.deepEqual(a.ids(), ['same-1'], 'U1 got its record back');
  assert.deepEqual(cloudIds(srv, U1.id), ['same-1']);
  assert.deepEqual(cloudIds(srv, U2.id), ['same-1']);
});

test('7: guest declines the transfer → guest history isolated; restored into the account only by the explicit restore', async () => {
  const srv = server(), A = device('A');
  srv.rows.set(U1.id, { payload: { workouts: [W('acc-1', 9000)], deletedWorkouts: [], goal: 'mass', program: [{ name: 'A', items: [] }] }, updated_at: new Date(9000).toISOString() });
  const a = await start(srv, A);
  a.run('S.goal="mass";S.program=[{name:"A",items:[]}];S.obDone=1;save()');
  await a.addWorkout(W('g-1', 1000));
  await a.signIn(U1);                                         // account has data → transfer question
  assert.equal(a.run('view'), 'transfer');
  await a.run('__mz.snapshotUnboundGuest().then(()=>__mz.adoptAccountFromCloud())'); await a.settle();   // «Не переносить»
  assert.deepEqual(a.ids(), ['acc-1']);
  assert.deepEqual(a.bundle('guest'), ['g-1']);
  await a.sync();
  assert.deepEqual(cloudIds(srv, U1.id), ['acc-1'], 'guest data not in the account without consent');
  a.g.confirm = () => false;
  assert.equal(a.run('histQuarantineRestore("guest")'), false, 'refused → nothing changes');
  a.g.confirm = () => true;
  assert.equal(a.run('histQuarantineRestore("guest")'), true);
  await a.settle(); a.run('save()'); await a.sync();
  assert.deepEqual(cloudIds(srv, U1.id), ['acc-1', 'g-1'], 'after the explicit restore');
});

test('8: a second device of U2 never receives U1 records, whatever happened on device A', async () => {
  const srv = server(), A = device('A'), B = device('B');
  const a = await start(srv, A);
  await a.signIn(U1); await a.addWorkout(W('u1-a', 1000)); await a.sync();
  A.online = false; await a.addWorkout(W('u1-x', 1100)); await a.run('__mz.finishLogout(false)'); await a.settle(); A.online = true;
  await a.signIn(U2); await a.addWorkout(W('u2-a', 2000)); await a.sync();
  const b = await start(srv, B);
  await b.signIn(U2); await b.sync();
  assert.deepEqual(b.ids(), ['u2-a']);
  noForeign(srv, { [U1.id]: new Set(['u1-a', 'u1-x']), [U2.id]: new Set(['u2-a']) });
});
