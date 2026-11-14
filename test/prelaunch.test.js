'use strict';
// Launch safeguard: the paywall must never ship without a launch date.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.join(__dirname, '..', 'premium.js'), 'utf8');

function cfg() {
  const store = new Map();
  const ctx = vm.createContext({ localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) }, location: { search: '' } });
  vm.runInContext(src, ctx);
  return { run: c => vm.runInContext(c, ctx), store };
}

test('release guard: PAYWALL_ENABLED=true requires a valid PAYWALL_LAUNCH in premium.js', () => {
  const b = cfg();
  const on = b.run('PREM_CFG.PAYWALL_ENABLED'), L = b.run('PREM_CFG.PAYWALL_LAUNCH');
  if (on) {
    assert.ok(L != null && L !== '', 'Перед PAYWALL_ENABLED=true задать PAYWALL_LAUNCH');
    const t = typeof L === 'number' ? L : Date.parse(L);
    assert.ok(Number.isFinite(t) && t > 0, 'PAYWALL_LAUNCH must be a valid date');
  } else {
    assert.equal(on, false);
  }
});

test('runtime fallback: paywall on + empty launch = first run date, stored locally and reused', () => {
  const b = cfg();
  b.run('PREM_CFG.PAYWALL_ENABLED=true; PREM_CFG.PAYWALL_LAUNCH=null');
  const t1 = b.run('premLaunchAt()');
  assert.ok(t1 > 0 && Math.abs(t1 - Date.now()) < 60e3);
  assert.equal(+b.store.get('gymPwLaunch'), t1);
  b.store.set('gymPwLaunch', String(t1 - 5e3));
  assert.equal(b.run('premLaunchAt()'), t1 - 5e3);
  b.run("PREM_CFG.PAYWALL_LAUNCH=''");
  assert.equal(b.run('premLaunchAt()'), t1 - 5e3);
  // paywall off: no launch, nothing stored
  const c = cfg();
  assert.equal(c.run('premLaunchAt()'), 0);
  assert.equal(c.store.has('gymPwLaunch'), false);
  // explicit launch wins
  c.run('PREM_CFG.PAYWALL_ENABLED=true; PREM_CFG.PAYWALL_LAUNCH="2027-01-01T00:00:00Z"');
  assert.equal(c.run('premLaunchAt()'), Date.parse('2027-01-01T00:00:00Z'));
});
