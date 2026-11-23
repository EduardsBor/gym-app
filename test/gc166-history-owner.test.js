'use strict';
// GC-166: history ownership edge cases — guest vs account (01), IndexedDB written before v165 without an owner mark (02),
// a failing IndexedDB write during an account switch (03), full regression (04).
// Rule: history of different owners is never merged; history whose owner cannot be proven is never assigned —
// it is kept isolated in IndexedDB ('quarantine') and can be restored, never destroyed.
const test = require('node:test');
const assert = require('node:assert/strict');
const { boot, restart, settle, ids, W, seed, read } = require('./fixtures/hist-boot.js');
const q = (b, owner) => { const Q = b.hist().quarantine || []; const x = Q.find(y => y && y.owner === owner); return x ? ids(x.workouts) : null; };

// ---------- GC-166-01
test('01: IndexedDB of account U1 + guest G1 history on the device → not merged, guest gets no ownerUid, U1 kept isolated', async () => {
  const b = boot(seed({ workouts: [W('g1', 5000)] }), { preHist: [W('u1a', 1000), W('u1b', 2000)], preOwner: 'U1' });
  await b.run('histReady');
  assert.deepEqual(ids(b.J('S.workouts')), ['g1']);
  assert.equal(b.run('S.ownerUid'), undefined, 'no foreign ownerUid for the guest');
  assert.deepEqual(ids(b.ls().workouts), ['g1']);
  assert.deepEqual(q(b, 'U1'), ['u1a', 'u1b'], 'U1 history isolated, not destroyed');
  assert.equal(b.hist().owner, null, 'IndexedDB now belongs to the guest');
  assert.deepEqual(ids(b.hist().workouts), ['g1']);
});

test('01b: guest with only a program (no workouts yet) is also «local data» — U1 history not assigned to it', async () => {
  const b = boot(seed({ workouts: [] }), { preHist: [W('u1a', 1000)], preOwner: 'U1' });
  await b.run('histReady');
  assert.deepEqual(ids(b.J('S.workouts')), []);
  assert.equal(b.run('S.ownerUid'), undefined);
  assert.deepEqual(q(b, 'U1'), ['u1a']);
});

test('01c: device copy really lost (no localStorage at all) + IndexedDB of U1 → history restored with its PROVEN owner U1', async () => {
  const b = boot(undefined, { preHist: [W('u1a', 1000)], preOwner: 'U1' });
  await b.run('histReady');
  assert.deepEqual(ids(b.J('S.workouts')), ['u1a']);
  assert.equal(b.run('S.ownerUid'), 'U1');
});

// ---------- GC-166-02 (IndexedDB from before v165: no owner mark)
test('02.1: old base of U1 without mark, the same U1 on the device → records already on the device stay; IndexedDB-only ones are isolated, not assigned', async () => {
  const b = boot(seed({ ownerUid: 'U1', workouts: [W('w1', 1000)] }), { preHist: [W('w1', 1000), W('w2', 2000)] });
  await b.run('histReady');
  assert.deepEqual(ids(b.J('S.workouts')), ['w1']);
  assert.deepEqual(q(b, 'legacy'), ['w2']);
  assert.equal(b.hist().owner, 'U1', 'mark written from now on');
  // the owner restores them on purpose → back in history, bundle gone
  b.run('histQuarantineRestore("legacy")');
  await settle();
  assert.deepEqual(ids(b.J('S.workouts')), ['w1', 'w2']);
  assert.equal(q(b, 'legacy'), null);
});

test('02.2: old base (U1, no mark) + new sign-in U2 on the device → U1 records never in U2, kept isolated', async () => {
  const b = boot(seed({ ownerUid: 'U2', workouts: [W('b1', 5000)] }), { preHist: [W('a1', 1000), W('a2', 2000)] });
  await b.run('histReady');
  assert.deepEqual(ids(b.J('S.workouts')), ['b1']);
  assert.deepEqual(q(b, 'legacy'), ['a1', 'a2']);
});

test('02.3: old base + guest with local history → not merged, guest gets no ownerUid', async () => {
  const b = boot(seed({ workouts: [W('g1', 5000)] }), { preHist: [W('a1', 1000)] });
  await b.run('histReady');
  assert.deepEqual(ids(b.J('S.workouts')), ['g1']);
  assert.equal(b.run('S.ownerUid'), undefined);
  assert.deepEqual(q(b, 'legacy'), ['a1']);
});

test('02.4: old base + localStorage lost → history restored as unbound device data (no ownerUid); binding needs the transfer consent at sign-in', async () => {
  const b = boot(undefined, { preHist: [W('a1', 1000), W('a2', 2000)] });
  await b.run('histReady');
  assert.deepEqual(ids(b.J('S.workouts')), ['a1', 'a2']);
  assert.equal(b.run('S.ownerUid'), undefined);
});

test('02.5: app closed during the migration (localStorage written, IndexedDB write not done) → next start gives the same result, nothing mixed or lost', async () => {
  const b = boot(seed({ ownerUid: 'U2', workouts: [W('b1', 5000)] }), { preHist: [W('a1', 1000)], failPut: true });   // write never lands = killed before it
  await b.run('histReady');
  assert.deepEqual(ids(b.J('S.workouts')), ['b1']);
  assert.equal(b.hist().owner, undefined, 'IndexedDB untouched');
  const b2 = restart(b);
  await b2.run('histReady');
  assert.deepEqual(ids(b2.J('S.workouts')), ['b1']);
  assert.deepEqual(q(b2, 'legacy'), ['a1']);
});

test('02.6: IndexedDB write keeps failing → history on the device stays, old records are not mixed in on any restart', async () => {
  const b = boot(seed({ ownerUid: 'U2', workouts: [W('b1', 5000)] }), { preHist: [W('a1', 1000)], preOwner: 'U1', failPut: true });
  await b.run('histReady');
  b.run('S.workouts.push(' + JSON.stringify(W('b2', 6000)) + ');save()');
  await settle();
  const b2 = restart(b, { failPut: true });
  await b2.run('histReady');
  assert.deepEqual(ids(b2.J('S.workouts')), ['b1', 'b2']);
  assert.deepEqual(ids(b2.hist().workouts), ['a1'], 'old IndexedDB content untouched (not destroyed)');
});

// ---------- GC-166-03
test('03: adoptAccountFromCloud uses the guarded write (isolates what is there, then writes) and awaits it BEFORE localStorage', () => {
  const s = read('sync.js');
  const fn = s.slice(s.indexOf('async function adoptAccountFromCloud'), s.indexOf('function clearBodyPhotos'));
  const iW = fn.indexOf('await histWrite('), iLS = fn.indexOf('persistLocal();');
  assert.ok(iW > 0 && iLS > iW, 'IndexedDB first, then localStorage');
});

test('03b: the IndexedDB write of an account switch FAILS (U1 marked) → after restart U1 is not in U2; a later successful save isolates U1 instead of destroying it', async () => {
  // state right after adoptAccountFromCloud with a failed IndexedDB write: localStorage = U2, IndexedDB still U1
  const b = boot(seed({ ownerUid: 'U2', workouts: [W('b1', 5000)] }), { preHist: [W('a1', 1000), W('a2', 2000)], preOwner: 'U1', failPut: true });
  await b.run('histWrite(S.workouts,S.ownerUid)').catch(() => {});
  await b.run('histReady');
  assert.deepEqual(ids(b.J('S.workouts')), ['b1']);
  const b2 = restart(b);   // IndexedDB works again
  await b2.run('histReady');
  assert.deepEqual(ids(b2.J('S.workouts')), ['b1']);
  assert.deepEqual(q(b2, 'U1'), ['a1', 'a2']);
  b2.run('S.workouts.push(' + JSON.stringify(W('b2', 6000)) + ');save()');
  await settle();
  assert.deepEqual(ids(b2.hist().workouts), ['b1', 'b2']);
  assert.deepEqual(q(b2, 'U1'), ['a1', 'a2'], 'still isolated after more saves');
});

test('03c: the same with an OLD base without mark → after restart nothing of the old base appears in U2', async () => {
  const b = boot(seed({ ownerUid: 'U2', workouts: [W('b1', 5000)] }), { preHist: [W('a1', 1000)], failPut: true });
  await b.run('histReady');
  const b2 = restart(b);
  await b2.run('histReady');
  assert.deepEqual(ids(b2.J('S.workouts')), ['b1']);
  assert.deepEqual(q(b2, 'legacy'), ['a1']);
});

test('03d: isolated U1 history comes back automatically only when U1 is the owner on this device again', async () => {
  const b = boot(seed({ ownerUid: 'U2', workouts: [W('b1', 5000)] }), { preHist: [W('a1', 1000)], preOwner: 'U1' });
  await b.run('histReady');
  assert.deepEqual(q(b, 'U1'), ['a1']);
  // U1 signs in again on this device (adoptAccountFromCloud → localStorage = U1 cloud copy)
  const st = b.ls(); st.ownerUid = 'U1'; st.workouts = [W('a0', 500)];
  const b2 = boot(st, { dbs: b.idb.dbs });
  await b2.run('histReady');
  assert.deepEqual(ids(b2.J('S.workouts')), ['a0', 'a1'], 'U1 gets its unsynced workout back');
  assert.equal(q(b2, 'U1'), null, 'U1 bundle consumed');
  assert.deepEqual(q(b2, 'U2'), ['b1'], 'U2 workouts left on the device are now isolated for U2, not merged into U1');
});

test('03e: another account cannot restore an account bundle by hand; legacy / guest bundles only with confirmation', async () => {
  const b = boot(seed({ ownerUid: 'U2', workouts: [W('b1', 5000)] }), { preHist: [W('a1', 1000)], preOwner: 'U1' });
  await b.run('histReady');
  assert.equal(b.run('histQuarantineRestore("U1")'), false);
  assert.deepEqual(ids(b.J('S.workouts')), ['b1']);
  b.g.confirm = () => false;
  assert.equal(b.J('histQuarantineList()').length, 1);
});

// ---------- GC-166-04
test('04: tombstones apply by owner — kept in an unproven bundle, applied when it is restored into this account; quarantine never reaches the cloud copy', async () => {
  const b = boot(seed({ ownerUid: 'U1', workouts: [W('w1', 1000)], deletedWorkouts: ['w3'] }), { preHist: [W('w2', 2000), W('w3', 3000)] });
  await b.run('histReady');
  assert.deepEqual(q(b, 'legacy'), ['w2', 'w3'], 'GC-166-F1: owner of w3 unknown → this device owner’s tombstone does not destroy it');
  b.run('histQuarantineRestore("legacy")');
  await settle();
  assert.deepEqual(ids(b.J('S.workouts')), ['w1', 'w2']);
  assert.doesNotMatch(read('sync.js').slice(read('sync.js').indexOf('function payloadOf')), /quarantine/, 'quarantine is IndexedDB-only');
  assert.equal(b.run('"quarantine" in S'), false);
});

test('04b: normal life is unchanged — same owner merges IndexedDB-only records (closed before the write), no duplicates', async () => {
  const b = boot(seed({ ownerUid: 'U1', workouts: [W('w1', 1000), W('w3', 3000)] }), { preHist: [W('w1', 1000), W('w2', 2000)], preOwner: 'U1' });
  await b.run('histReady');
  assert.deepEqual(ids(b.J('S.workouts')), ['w1', 'w2', 'w3']);
  assert.equal(b.hist().quarantine === undefined || b.hist().quarantine.length === 0, true);
  const g = boot(seed({ workouts: [W('g2', 2000)] }), { preHist: [W('g1', 1000)], preOwner: null });
  await g.run('histReady');
  assert.deepEqual(ids(g.J('S.workouts')), ['g1', 'g2'], 'guest ↔ guest merges as before');
});
