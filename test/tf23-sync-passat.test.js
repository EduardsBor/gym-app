'use strict';
// tech-fix-2.3: two devices through sync.js applyMerged (no server, no real data): S.block.passAt is not lost when the newer copy
// comes from an app that does not know it (same block, same pass); it is not carried into another pass; a device left without
// passAt behaves conservatively (limguard: last day done out of order is not changed).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { boot, DAY } = require('./fixtures/tf1-boot.js');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

function loadSync(opts) {
  const store = (opts && opts.store) || new Map();
  const toasts = [];
  const g = {
    console, Date, JSON, TextEncoder, Promise, URL, Uint8Array,
    crypto: { getRandomValues(a) { for (let i = 0; i < a.length; i++) a[i] = (i * 17 + 3) & 255; return a; } },
    S: { workouts: [], body: [], updatedAt: Date.now() },
    localStorage: {
      getItem(k) { return store.has(k) ? store.get(k) : null; },
      setItem(k, v) { store.set(k, String(v)); },
      removeItem(k) { store.delete(k); }
    },
    location: { href: 'https://eduardsbor.github.io/gym-app/' },
    document: { hidden: true, visibilityState: 'hidden', addEventListener() {}, querySelector() { return null; } },
    navigator: { onLine: true },
    MZ_SB: { url: 'https://krrhwuldkwkkcegxhyqq.supabase.co', anon: 'test-anon' },
    supabase: {
      createClient() {
        return {
          auth: {
            onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; },
            getSession: async () => ({ data: { session: null } })
          },
          from() { return { upsert: async () => ({ error: null }), select() { return { eq() { return { maybeSingle: async () => ({ data: null, error: null }) }; } }; } }; }
        };
      }
    },
    toasts,
    toast(msg) { toasts.push(msg); },
    view: 'home',
    render() {},
    setInterval() { return 0; },
    clearInterval() {},
    addEventListener() {}
  };
  g.window = g;
  g.self = g;
  g.globalThis = g;
  vm.runInNewContext(read('sync.js').replace(/\n  init\(\);\n\}\)\(\);\s*$/, '\n  window.__mzApplyMerged=applyMerged;\n})();'), g);
  return g;
}


const now = Date.now();
const BID = 'str_adv_5_g_b35';
// two devices: A = this app (2.3), B = an older app (drops passAt). The cloud copy of B is merged on A (sync.js applyMerged).
function device() {
  const b = boot({ state: { lang: 'ru', goal: 'str', days: 5, next: 0, prof: { goal: 'str', sex: 'm', level: 'adv', days: 5, len: 90, place: 'g', prio: [], lim: [] }, workouts: [], custom: [], body: [], pg: { sq: { st: { success: 1, miss: 0 }, next: { weight: 100 } } } } });
  b.run(`S.block={id:${JSON.stringify(BID)},next:0};S.program=planFromBlock(getBlock(${JSON.stringify(BID)}),{goal:'str',level:'adv',days:5,place:'g',lim:[]}).days;save()`);
  return b;
}
const W = (S, i, at) => ({ id: 'w' + i + '_' + at, start: at, end: at + 3600e3, dayIdx: i, dayName: S.program[i].name, n: S.program[i].n, notes: '', items: [{ exId: 'sq', ns: 3, sets: [{ w: 50, r: 5, done: true }] }] });
function merge(local, remote, remoteAt) {
  const g = loadSync();
  g.S = JSON.parse(JSON.stringify(local));
  g.__mzApplyMerged(JSON.parse(JSON.stringify(remote)), remoteAt);
  return g.S;
}
const reboot = S => boot({ ls: { gym: JSON.stringify(S) } });

test('tf2.3 sync: same pass, the newer copy comes from an app without passAt → passAt is kept; a day done out of order stays finished', () => {
  const A = device().J('S');
  const P = now - 10 * DAY, n = A.program.length;
  A.block = { id: BID, next: 1, passAt: P }; A.progAt = now - 5 * DAY; A.updatedAt = now - 5 * DAY;
  A.workouts = [W(A, 0, now - 9 * DAY)];
  const B = JSON.parse(JSON.stringify(A));
  delete B.block.passAt; B.block.next = 2; B.progAt = now - DAY; B.updatedAt = now - DAY;
  B.workouts = A.workouts.concat([W(A, 4, now - 3 * DAY), W(A, 1, now - 2 * DAY)]);  // day 5 out of order, then day 2
  const M = merge(A, B, B.updatedAt);
  assert.equal(M.block.next, 2);
  assert.equal(M.block.passAt, P, 'passAt not lost');
  assert.equal(M.workouts.length, 3);
  const b = reboot(M);
  assert.equal(b.run('S.block.passAt'), P, 'kept after restart (migrateBlockState)');
  assert.equal(b.J('lgDayLocked(4)'), 'done');
  assert.ok(n > 5);
});

test('tf2.3 sync: the merge on the old-app side direction — local copy without passAt, remote with it → passAt taken over', () => {
  const A = device().J('S');
  const P = now - 10 * DAY;
  const R = JSON.parse(JSON.stringify(A)); R.block = { id: BID, next: 1, passAt: P }; R.progAt = now - 5 * DAY; R.updatedAt = now - 5 * DAY; R.workouts = [W(A, 0, now - 9 * DAY)];
  const L = JSON.parse(JSON.stringify(R)); delete L.block.passAt; L.block.next = 2; L.progAt = now - DAY; L.updatedAt = now - DAY; L.workouts = R.workouts.concat([W(A, 1, now - 2 * DAY)]);
  const M = merge(L, R, R.updatedAt);
  assert.equal(M.block.next, 2);
  assert.equal(M.block.passAt, P);
});

test('tf2.3 sync: the other device repeated the block (next went down) or finished the pass → passAt is NOT carried; this device then behaves conservatively (last day not changed)', () => {
  const A = device().J('S');
  const P = now - 80 * DAY, n = A.program.length;
  const full = Array.from({ length: n }, (_, i) => W(A, i, P + (i + 1) * DAY / 2));
  A.block = { id: BID, next: n - 2, passAt: P }; A.progAt = now - 50 * DAY; A.updatedAt = now - 50 * DAY; A.workouts = full.slice(0, n - 2);
  // B (old app): finished the pass, repeated (no passAt), then last day first, then day 1
  const B = JSON.parse(JSON.stringify(A)); B.block = { id: BID, next: 1 }; B.progAt = now - DAY; B.updatedAt = now - DAY;
  B.workouts = full.concat([W(A, n - 1, now - 3 * DAY), W(A, 0, now - 2 * DAY)]);
  const M = merge(A, B, B.updatedAt);
  assert.equal(M.block.next, 1);
  assert.equal(M.block.passAt, undefined, 'a passAt of the previous pass must not be carried');
  M.prof.lim = ['k'];
  const b = reboot(M);
  const before = b.run(`JSON.stringify(S.program[${n - 1}])`), H = b.run('JSON.stringify({w:S.workouts,pg:S.pg})');
  assert.equal(b.J(`lgDayLocked(${n - 1})`), 'unsure');
  b.run('lgFixAll()');
  assert.equal(b.run(`JSON.stringify(S.program[${n - 1}])`), before);
  assert.equal(b.run('JSON.stringify({w:S.workouts,pg:S.pg})'), H);
  // same pass number but the last day done after passAt (pass finished) with next not lower → not carried either
  const B2 = JSON.parse(JSON.stringify(B)); B2.block = { id: BID, next: n - 1 }; B2.workouts = full.slice(0, n - 2).concat([W(A, n - 1, now - 3 * DAY)]);
  assert.equal(merge(A, B2, B2.updatedAt).block.passAt, undefined);
});

test('tf2.3 sync: another block on the other device, or both copies with passAt → nothing is mixed', () => {
  const A = device().J('S');
  A.block = { id: BID, next: 2, passAt: now - 10 * DAY }; A.progAt = now - 5 * DAY; A.updatedAt = now - 5 * DAY;
  const B = JSON.parse(JSON.stringify(A)); B.block = { id: 'other_block', next: 3 }; B.progAt = now - DAY; B.updatedAt = now - DAY;
  assert.equal(merge(A, B, B.updatedAt).block.passAt, undefined);
  const C = JSON.parse(JSON.stringify(A)); C.block = { id: BID, next: 3, passAt: now - 4 * DAY }; C.progAt = now - DAY; C.updatedAt = now - DAY;
  assert.equal(merge(A, C, C.updatedAt).block.passAt, now - 4 * DAY);
});
