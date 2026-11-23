'use strict';
// GC-166-F1 (independent QA by GPT): same workout ids of different owners, tombstones of another owner,
// U1 → U2 → U1 in one session, unmarked (pre-v165) bases. A same id of DIFFERENT owners is no proof of ownership.
const test = require('node:test');
const assert = require('node:assert/strict');
const { boot, restart, settle, ids, W, seed } = require('./fixtures/hist-boot.js');
const bundle = (b, owner) => { const x = (b.hist().quarantine || []).find(y => y && y.owner === owner); return x ? x.workouts : null; };
const Wn = (id, end, note, w) => Object.assign(W(id, end, w), { notes: note });

// ---------- 1. same id, different owners
test('F1-1: IndexedDB U1 w123 (newer) + device U2 w123 (older) → U2 keeps ONLY its own record; U1 record kept whole in its quarantine', async () => {
  const b = boot(seed({ ownerUid: 'U2', workouts: [Wn('w123', 1000, 'U2-own', 50)] }), { preHist: [Wn('w123', 9000, 'U1-own', 99)], preOwner: 'U1' });
  await b.run('histReady');
  const mine = b.J('S.workouts');
  assert.equal(mine.length, 1);
  assert.equal(mine[0].notes, 'U2-own', 'the newer date of U1 does not replace U2');
  assert.equal(mine[0].items[0].sets[0].w, 50);
  assert.equal(b.ls().workouts[0].notes, 'U2-own');
  assert.equal(b.hist().workouts[0].notes, 'U2-own');
  const q1 = bundle(b, 'U1');
  assert.ok(q1, 'U1 bundle exists');
  assert.equal(q1.length, 1);
  assert.equal(q1[0].notes, 'U1-own', 'U1 record not lost');
  assert.equal(q1[0].items[0].sets[0].w, 99);
});

test('F1-1b: the same with an UNMARKED (pre-v165) base — different content under the same id is isolated, the device record stays', async () => {
  const b = boot(seed({ ownerUid: 'U2', workouts: [Wn('w123', 1000, 'U2-own')] }), { preHist: [Wn('w123', 9000, 'other'), W('w9', 500)] });
  await b.run('histReady');
  assert.deepEqual(b.J('S.workouts').map(w => w.notes), ['U2-own']);
  assert.deepEqual(bundle(b, 'legacy').map(w => w.id + ':' + (w.notes || '')).sort(), ['w123:other', 'w9:']);
});

test('F1-1c: identical record under the same id (the same workout, e.g. an unmarked base of this device) is not duplicated into the quarantine', async () => {
  const w = Wn('w1', 1000, 'same');
  const b = boot(seed({ ownerUid: 'U1', workouts: [w] }), { preHist: [JSON.parse(JSON.stringify(w))] });
  await b.run('histReady');
  assert.deepEqual(ids(b.J('S.workouts')), ['w1']);
  assert.equal(bundle(b, 'legacy'), null);
});

test('F1-1d: guarded write (save / account switch): IndexedDB U1 w123 + device U2 w123 → U1 record isolated, not dropped', async () => {
  const b = boot(seed({ ownerUid: 'U2', workouts: [Wn('w123', 1000, 'U2-own')] }), { preHist: [Wn('w123', 9000, 'U1-own')], preOwner: 'U1', failPut: true });
  await b.run('histReady');                     // start-up write fails → IndexedDB still U1
  b.idb.ctl.failPut = false;
  await b.run('histWrite(S.workouts,S.ownerUid)');
  assert.equal(b.hist().owner, 'U2');
  assert.deepEqual(b.hist().workouts.map(w => w.notes), ['U2-own']);
  assert.deepEqual(bundle(b, 'U1').map(w => w.notes), ['U1-own']);
});

// ---------- 2. tombstones of another owner
test('F1-2: U2 deletedWorkouts containing an id of U1 do not destroy the U1 record (start-up isolation)', async () => {
  const b = boot(seed({ ownerUid: 'U2', workouts: [W('b1', 5000)], deletedWorkouts: ['a1'] }), { preHist: [W('a1', 1000), W('a2', 2000)], preOwner: 'U1' });
  await b.run('histReady');
  assert.deepEqual(ids(b.J('S.workouts')), ['b1']);
  assert.deepEqual(ids(bundle(b, 'U1')), ['a1', 'a2'], 'a1 kept for U1');
});

test('F1-2b: … nor in the guarded write, and U1 gets a1 back when U1 owns the device again (U1 tombstones apply, U2 ones do not)', async () => {
  const b = boot(seed({ ownerUid: 'U2', workouts: [W('b1', 5000)], deletedWorkouts: ['a1'] }), { preHist: [W('a1', 1000)], preOwner: 'U1', failPut: true });
  await b.run('histReady');
  b.idb.ctl.failPut = false;
  await b.run('histWrite(S.workouts,S.ownerUid)');
  assert.deepEqual(ids(bundle(b, 'U1')), ['a1']);
  const st = b.ls(); st.ownerUid = 'U1'; st.workouts = []; st.deletedWorkouts = [];
  const b2 = boot(st, { dbs: b.idb.dbs });
  await b2.run('histReady');
  assert.deepEqual(ids(b2.J('S.workouts')), ['a1']);
  // U1's OWN tombstone does remove it on restore
  const st3 = b.ls(); st3.ownerUid = 'U1'; st3.workouts = []; st3.deletedWorkouts = ['a1'];
  const b3 = boot(seed({ ownerUid: 'U2', workouts: [W('b1', 5000)], deletedWorkouts: ['a1'] }), { preHist: [W('a1', 1000)], preOwner: 'U1' });
  await b3.run('histReady');
  const b4 = boot(st3, { dbs: b3.idb.dbs });
  await b4.run('histReady');
  assert.deepEqual(ids(b4.J('S.workouts')), []);
});

test('F1-2c: unmarked base — the device owner’s tombstones do not delete isolated records; restoring into this account applies them', async () => {
  const b = boot(seed({ ownerUid: 'U1', workouts: [W('w1', 1000)], deletedWorkouts: ['w3'] }), { preHist: [W('w2', 2000), W('w3', 3000)] });
  await b.run('histReady');
  assert.deepEqual(ids(bundle(b, 'legacy')), ['w2', 'w3'], 'nothing destroyed: owner of w3 is unknown');
  b.run('histQuarantineRestore("legacy")');
  await settle();
  assert.deepEqual(ids(b.J('S.workouts')), ['w1', 'w2'], 'restored into U1 → U1 tombstone w3 applies');
});

// ---------- 3. U1 → U2 → U1 in one open session (no restart)
test('F1-3: U1 → U2 → U1 in one session: U1 unsynced workouts are back right away, U2 records isolated, nothing mixed', async () => {
  const b = boot(seed({ ownerUid: 'U1', workouts: [W('u1', 1000), W('u1x', 1500)] }), { preOwner: 'U1', preHist: [W('u1', 1000), W('u1x', 1500)] });
  await b.run('histReady');
  // U2 signs in (adoptAccountFromCloud: S replaced by U2 cloud copy, guarded write before localStorage)
  await b.run(`S.ownerUid="U2";S.workouts=${JSON.stringify([W('b1', 5000)])};S.deletedWorkouts=[];histWrite(S.workouts,S.ownerUid)`);
  b.run('localStorage.setItem("gym",JSON.stringify(S))');
  assert.deepEqual(ids(b.J('S.workouts')), ['b1']);
  assert.deepEqual(ids(bundle(b, 'U1')), ['u1', 'u1x']);
  // U1 signs in again — cloud copy of U1 has only u1 (u1x was never synced)
  await b.run(`S.ownerUid="U1";S.workouts=${JSON.stringify([W('u1', 1000)])};S.deletedWorkouts=[];histWrite(S.workouts,S.ownerUid)`);
  assert.deepEqual(ids(b.J('S.workouts')), ['u1', 'u1x'], 'unsynced u1x visible without a restart');
  assert.deepEqual(ids(b.hist().workouts), ['u1', 'u1x']);
  assert.equal(bundle(b, 'U1'), null);
  assert.deepEqual(ids(bundle(b, 'U2')), ['b1'], 'U2 isolated, not merged into U1');
  assert.deepEqual(b.J('histQuarantineList()').map(x => x.owner), ['U2'], 'list is current without a restart');
});

test('F1-3b: the account switch path in sync.js takes the list returned by the guarded write (own bundle) before localStorage', () => {
  const s = require('./fixtures/hist-boot.js').read('sync.js');
  const fn = s.slice(s.indexOf('async function adoptAccountFromCloud'), s.indexOf('function clearBodyPhotos'));
  assert.match(fn, /await histWrite\(Array\.isArray\(S\.workouts\)\?S\.workouts:\[\],S\.ownerUid\)/);
  assert.ok(fn.indexOf('await histWrite(') < fn.indexOf('persistLocal();'));
});

// ---------- 4. regression: normal life unchanged
test('F1-4: same owner — newer edit in IndexedDB still wins over the device copy (same owner, same id = same workout)', async () => {
  const b = boot(seed({ ownerUid: 'U1', workouts: [Wn('w1', 1000, 'old')] }), { preHist: [Object.assign(Wn('w1', 1000, 'new'), { updatedAt: 5000 })], preOwner: 'U1' });
  await b.run('histReady');
  assert.deepEqual(b.J('S.workouts').map(w => w.notes), ['new']);
});
