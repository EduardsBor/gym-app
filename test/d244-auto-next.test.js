'use strict';
// D-244: after a saved prescribed working set finishes the prescription, open the next exercise with rest still running.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
function boot(opts) {
  const store = new Map();
  if (opts && opts.ls) for (const [k, v] of Object.entries(opts.ls)) store.set(k, String(v));
  const nodes = new Map();
  function el(id) {
    if (id && nodes.has(id)) return nodes.get(id);
    const node = {
      id: id || '', innerHTML: '', textContent: '', className: '', value: '', style: {}, dataset: {},
      classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
      append() {}, remove() {}, play() { return null; }, pause() {}, addEventListener() {}, insertAdjacentHTML() {}, setAttribute() {}, getAttribute() { return null; },
      closest() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; },
      onclick: null
    };
    if (id) nodes.set(id, node);
    return node;
  }
  const search = (opts && opts.search) || '';
  const g = {
    console, setTimeout() { return 0; }, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {}, scrollTo() {}, scrollY: 0, Audio: function () { this.play = () => ({ catch() {} }); this.pause = () => {}; this.addEventListener = () => {}; this.load = () => {}; }, confirm: () => true, prompt: () => null,
    URL, Blob, navigator: { language: 'ru', languages: ['ru'] },
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
    location: { href: 'http://127.0.0.1/' + search, origin: 'http://127.0.0.1', pathname: '/', search },
    document: {
      documentElement: { lang: 'ru' }, title: '', body: { append() {}, style: {} },
      querySelector(sel) { if (sel === '#modal:not(.hidden)') return null; const m = /^#([\w-]+)/.exec(sel || ''); return el(m ? m[1] : ''); },
      querySelectorAll() { return []; }, getElementById(id) { return el(id); }, addEventListener() {}, createElement() { return el(); }
    }
  };
  g.window = g; g.globalThis = g; g.self = g;
  g.XMLHttpRequest = function () {
    this.status = 0; this.responseText = '';
    this.open = function (method, url) { this._url = url; };
    this.send = function () {
      const rel = String(this._url || '').replace(/^\.\//, '');
      const fp = path.join(root, rel);
      if (fs.existsSync(fp)) { this.status = 200; this.responseText = fs.readFileSync(fp, 'utf8'); }
      else { this.status = 404; this.responseText = ''; }
    };
  };
  const ctx = vm.createContext(g);
  const files = ['alt.js', 'i18n/dict.js', 'i18n/dict2.js', 'i18n/dict3.js', 'i18n/i18n.js', 'app.js', 'tech.js', 'lib.js', 'i18n/lib.en.js', 'i18n/lib.lv.js', 'i18n/tech.en.js', 'i18n/tech.lv.js', 'cards.js', 'warm.js', 'cd.js', 'place.js', 'prog.js', 'plan.js', 'blocks.js', 'legal.js', 'premium.js', 'features.js', 'movekit.js', 'progress.js', 'autow.js', 'exscreen.js'];
  for (const f of files) vm.runInContext(read(f), ctx, { filename: f });
  return { run: code => vm.runInContext(code, ctx), app: () => vm.runInContext('app.innerHTML', ctx) };
}
function withProgram() {
  const r = boot();
  r.run('armAudio=function(){};S.weightAsked=1;S.goal=null;S.program=null;preview(CATALOG[0],"catalog");$("#pstart").onclick();view="today";render()');
  return r;
}

test('D-244: sets-done circle shows «1/N» and does not use the .ok button class (number was invisible)', () => {
  const { run, app } = withProgram();
  run('exOpen("m",0);$("#exw").value="20";$("#exr").value="10";exLog()');
  const plan = run('S.active.items[0].ns');
  assert.match(app(), new RegExp('<div class="excirc " id="exsets"><b>1/' + plan + '</b>'));
  assert.doesNotMatch(app(), /class="excirc ok"/);
  assert.match(read('style.css'), /\.excirc\{color:var\(--txt\)\}\.excirc\.exdone\{border-color:var\(--ok\)\}/);
});

test('D-244: the next exercise opens after the three-second notice; rest keeps running', () => {
  const { run } = withProgram();
  run('exOpen("m",0)');
  const plan = run('exDay().d.items[0].sets');
  const pos = run('EXS.pos');
  for (let k = 0; k < plan - 1; k++) run('$("#exw").value="20";$("#exr").value="10";exLog()');
  assert.equal(run('EXS.pos'), pos, 'stays while sets remain');
  run('$("#exw").value="20";$("#exr").value="10";exLog()');
  assert.equal(run('S.active.items[0].sets.filter(s=>s.done).length'), plan);
  assert.equal(run('view'), 'ex');
  assert.equal(run('EXS.pos'), pos);
  assert.ok(run('EX_ADVANCE.until-Date.now()>2900'));
  run('EX_ADVANCE.until=Date.now();exAdvanceTick(EX_ADVANCE)');
  assert.equal(run('EXS.pos'), pos + 1);
  assert.equal(run('JSON.stringify([exList()[EXS.pos].src,exList()[EXS.pos].i])'), '["m",1]');
  assert.ok(run('tEnd') > Date.now(), 'rest timer still running on the next exercise');
});

test('warm-up and cooldown do not advance automatically, including the final exercise', () => {
  const { run } = withProgram();
  run('exOpen("w",0);exLog()');
  assert.equal(run('JSON.stringify([exList()[EXS.pos].src,exList()[EXS.pos].i])'), '["w",0]');
  const last = run('exList().length-1');
  run(`EXS.pos=${last};exView()`);
  assert.equal(run('exList()[EXS.pos].src'), 'c');
  const n = run('exInfo(exList()[EXS.pos]).plan');
  for (let k = 0; k < n; k++) run('exLog()');
  assert.equal(run('view'), 'ex');
  assert.equal(run('EXS.pos'), last);
  assert.ok(run('!!S.active'), 'workout stays active for manual finish');
});

test('bonus sets do not count towards the prescribed threshold; an extra recorded set does not advance again', () => {
  const { run } = withProgram();
  run('startW(0);exOpen("m",0);const first=S.active.items[0];first.sets.push({w:20,r:10,done:true})');
  const pos = run('EXS.pos'), plan = run('first.ns');
  for(let k=0;k<plan-1;k++) run('exLog()');
  assert.equal(run('EXS.pos'),pos,'an already recorded bonus set cannot complete the prescription');
  run('exLog()');
  assert.equal(run('EXS.pos'),pos);
  run('EX_ADVANCE.until=Date.now();exAdvanceTick(EX_ADVANCE)');
  assert.equal(run('EXS.pos'),pos+1);
  run('$("#exprev").onclick();exLog()');
  assert.equal(run('EXS.pos'),pos,'logging an extra set after completion does not advance');
  assert.equal(run('first.sets.filter(s=>s.done).length'),plan+2);
});

test('no auto advance when the prescription is absent, the set is rejected or local persistence fails', () => {
  for(const mode of ['no prescription','rejected set','storage failure']){
    const { run }=withProgram();
    run('startW(0);exOpen("m",0);const first=S.active.items[0];first.sets=[{w:30,r:10,done:false}];first.ns=1;save()');
    if(mode==='no prescription')run('delete first.ns');
    if(mode==='rejected set')run('setDone=()=>{}');
    if(mode==='storage failure')run('localStorage.setItem=()=>{throw Error("synthetic write failure")}');
    const pos=run('EXS.pos');
    run('exLog()');
    assert.equal(run('EXS.pos'),pos,mode);
    const persisted=run('JSON.parse(localStorage.getItem("gym")).active.items[0].sets[0].done');
    assert.equal(persisted,mode==='no prescription',mode);
  }
});

test('completing the final working exercise with no cooldown stays on detail and keeps rest and workout active', () => {
  const { run }=withProgram();
  run('startW(0);S.active.cool=null;S.active.items=[S.active.items.find(it=>!isCardio(it.exId))];const i=0;const it=S.active.items[i];it.ns=1;it.rest=90;it.sets=[{w:20,r:10,done:false}];exOpen("m",i)');
  const pos=run('EXS.pos');
  run('exLog()');
  assert.equal(run('EXS.pos'),pos);
  assert.equal(run('view'),'ex');
  assert.ok(run('S.active&&tEnd>Date.now()'));
  assert.ok(run('JSON.parse(localStorage.getItem("gym")).active.items.at(-1).sets[0].done'));
});

test('D-245: exercise screen — rest lives only in the circle (bottom bar hidden); other screens keep the bar', () => {
  const { run, app } = withProgram();
  run('document.body.classList={_s:new Set(),toggle(c,on){on?this._s.add(c):this._s.delete(c)},contains(c){return this._s.has(c)}}');
  run('exOpen("m",0)');
  assert.ok(run('document.body.classList.contains("exv")'));
  assert.match(read('style.css'), /body\.exv #timer\{display:none!important\}/);
  assert.match(app(), /<div class="exrestw"><button class="excirc" id="exrest"[^>]*><b id="exrt">/);
  assert.doesNotMatch(app(), /exskip|tstop|Пропустить отдых|exrestc/);
  assert.doesNotMatch(app(), /exm30|exp30|−30|\+30/);
  run('$("#exw").value="20";$("#exr").value="10";exLog()');
  const t0 = run('tEnd');
  assert.ok(t0 > Date.now());
  // auto-next keeps the running rest; the next exercise circle reads the same tEnd
  const plan = run('S.active.items[0].ns');
  for (let k = 1; k < plan; k++) run('$("#exw").value="20";$("#exr").value="10";exLog()');
  run('EX_ADVANCE.until=Date.now();exAdvanceTick(EX_ADVANCE)');
  assert.equal(run('exList()[EXS.pos].i'), 1);
  assert.ok(run('tEnd') > Date.now());
  // D-288: logging the next set restarts rest (no stuck leftover timer, no skip button)
  run('tEnd-=5000;S.tEnd=tEnd');
  const mid = run('tEnd');
  run('$("#exw").value="20";$("#exr").value="10";exLog()');
  const t2 = run('tEnd');
  assert.ok(t2 > Date.now());
  assert.ok(t2 > mid, 'logging a set must call startTimer again');
  run('go("today")');
  assert.equal(run('document.body.classList.contains("exv")'), false);
});

test('extra rest ±30 and skip ✕ are removed from the bottom bar and the circle', () => {
  const h = read('index.html') + read('exscreen.js') + read('app.js');
  assert.doesNotMatch(h, /id="tstop"|id="exskip"|Пропустить отдых|exrestc/);
  assert.doesNotMatch(h, /exm30|exp30|data-t="-30"|data-t="30"|function timerAdd/);
  assert.doesNotMatch(h, />−30<|>\+30</);
});
