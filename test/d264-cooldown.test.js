'use strict';
// D-264: gym cooldown spin bike → «Лёгкое кардио» (incline-treadmill-walk); home cooldown «Лёгкая ходьба»; walk-brisk name in the cardio block unchanged.
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
      querySelector(sel) { const m = /^#([\w-]+)/.exec(sel || ''); return el(m ? m[1] : ''); },
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
  return { run: code => vm.runInContext(code, ctx) };
}

const NOTE = 'лёгкий темп, пульс снижается';
const CAP_G = 'Без наклона или с малым наклоном, в лёгком темпе; можно на том же тренажёре, что в кардио-блоке';
const CAP_H = 'Ходьба на месте или по комнате в лёгком темпе, дыхание спокойное';
const WALK_NAME = 'Быстрая ходьба (улица или на месте)';

test('D-264: gym spin-bike cooldown row becomes light cardio with the same duration and D-261 caption', () => {
  const b = boot();
  const r = JSON.parse(b.run(`JSON.stringify(cdRows({cardio:{id:'mk-indoor-cycling-spin',min:5,note:${JSON.stringify(NOTE)}},pl:'g',stretch:[]})[0])`));
  assert.deepEqual(r, { id: 'mk-incline-treadmill-walk', n: 'Лёгкое кардио', d: '5 мин', x: NOTE, c: CAP_G });
  assert.equal(b.run('movekitFile("mk-incline-treadmill-walk")'), 'incline-treadmill-walk.mp4');
  assert.ok(b.run(`cdHTML({cardio:{id:'mk-indoor-cycling-spin',min:8,note:''},pl:'g',stretch:[]})`).includes('8 мин'));
  // duration 8 kept; name is light cardio, not the spin bike
  const html = b.run(`cdHTML({cardio:{id:'mk-indoor-cycling-spin',min:8,note:''},pl:'g',stretch:[]})`);
  assert.ok(html.includes('Лёгкое кардио'));
  assert.ok(!html.includes('Сайкл') && !html.includes(b.run('exBy("mk-indoor-cycling-spin").name')));
});

test('D-264: home cooldown walk-brisk is «Лёгкая ходьба» with the new caption; global name and cardio-block id unchanged', () => {
  const b = boot();
  const r = JSON.parse(b.run(`JSON.stringify(cdRows({cardio:{id:'walk-brisk',min:4,note:${JSON.stringify(NOTE)}},pl:'b',stretch:[]})[0])`));
  assert.deepEqual(r, { id: 'walk-brisk', n: 'Лёгкая ходьба', d: '4 мин', x: NOTE, c: CAP_H });
  const rd = JSON.parse(b.run(`JSON.stringify(cdRows({cardio:{id:'walk-brisk',min:4,note:''},pl:'d',stretch:[]})[0])`));
  assert.equal(rd.n, 'Лёгкая ходьба');
  assert.equal(b.run('exBy("walk-brisk").name'), WALK_NAME);
  assert.ok(!b.run('movekitFile("walk-brisk")'));
  assert.match(read('place.js'), /'walk-brisk','Быстрая ходьба \(улица или на месте\)'/);
});

test('D-264: gym/home template days — every spin cooldown is replaced; home cardio-block walk stays brisk; IDs in stored cd.cardio unchanged', () => {
  const b = boot();
  const summary = JSON.parse(b.run(`
    JSON.stringify((function(){
      const out={gymDays:0,gymSpinStored:0,gymSpinShown:0,gymLightShown:0,homeDays:0,homeWalkStored:0,homeEasyShown:0,homeCardioBrisk:0,homeCardioRenamed:0};
      for (const key of Object.keys(PROG.T)) {
        const parts=key.split('_');
        const place=parts[3]||'g';
        const prof={goal:parts[0],level:parts[1],days:+parts[2],place,sex:'m',prio:[],lim:[],len:75};
        const plan=planFromTemplate(prof);
        if(!plan) continue;
        for (const d of plan.days) {
          const rows=cdRows(d.cd);
          const cardio=d.cd&&d.cd.cardio;
          if (place==='g') {
            out.gymDays++;
            if (cardio&&cardio.id==='mk-indoor-cycling-spin') {
              out.gymSpinStored++;
              const row=rows[0];
              if (row.id==='mk-incline-treadmill-walk' && row.n==='Лёгкое кардио' && row.d===(cardio.min+' мин') && row.c===${JSON.stringify(CAP_G)}) out.gymLightShown++;
              if (row.id==='mk-indoor-cycling-spin') out.gymSpinShown++;
            }
          } else {
            out.homeDays++;
            if (cardio&&cardio.id==='walk-brisk') {
              out.homeWalkStored++;
              const row=rows[0];
              if (row.n==='Лёгкая ходьба' && row.id==='walk-brisk' && row.d===(cardio.min+' мин') && row.c===${JSON.stringify(CAP_H)}) out.homeEasyShown++;
            }
            (d.items||[]).forEach(it=>{
              if(it.exId==='walk-brisk' || it.cardio&&it.exId==='walk-brisk'){
                if (exBy('walk-brisk').name===${JSON.stringify(WALK_NAME)}) out.homeCardioBrisk++;
                else out.homeCardioRenamed++;
              }
            });
          }
        }
      }
      return out;
    })())
  `));
  assert.equal(summary.gymSpinShown, 0);
  assert.ok(summary.gymSpinStored > 0, 'expected gym days with stored spin cooldown');
  assert.equal(summary.gymLightShown, summary.gymSpinStored);
  assert.ok(summary.homeWalkStored > 0, 'expected home days with stored walk-brisk cooldown');
  assert.equal(summary.homeEasyShown, summary.homeWalkStored);
  assert.equal(summary.homeCardioRenamed, 0);
  // block days: 60 gym base blocks × (32+36+36+35+36)/5 = 2100; half have spin cooldown
  const blocks = JSON.parse(b.run(`
    JSON.stringify((function(){
      const ids=Object.values(BLOCK_MAP).filter(id=>/_g_/.test(id));
      let total=0, spinStored=0, light=0, leftover=0;
      for (const id of ids) {
        const block=getBlock(id);
        if(!block) continue;
        const plan=planFromBlock(block,{goal:block.goal,level:block.level,days:block.days_per_week,place:'g',sex:'m',prio:[],lim:[],len:block.len||75});
        for (const d of plan.days) {
          total++;
          const cardio=d.cd&&d.cd.cardio;
          if (cardio&&cardio.id==='mk-indoor-cycling-spin') {
            spinStored++;
            const row=cdRows(d.cd)[0];
            if (row.id==='mk-incline-treadmill-walk' && row.n==='Лёгкое кардио' && row.d===(cardio.min+' мин')) light++;
            if (row.id==='mk-indoor-cycling-spin') leftover++;
          }
        }
      }
      return {total,spinStored,light,leftover,blocks:ids.length};
    })())
  `));
  assert.equal(blocks.total, 2100);
  assert.equal(blocks.spinStored, 1050);
  assert.equal(blocks.light, 1050);
  assert.equal(blocks.leftover, 0);
});

test('D-264: LV caption fix + new EN/LV strings; SW cache moyzal-v127', () => {
  const d3 = read('i18n/dict3.js');
  assert.ok(d3.includes("'Bez slīpuma vai ar nelielu slīpumu, vieglā tempā; vari izmantot to pašu trenažieri, ko izmantoji kardio blokā'"));
  assert.ok(!d3.includes('var izmantot to pašu trenažieri, kas kardio blokā'));
  assert.ok(d3.includes("['Лёгкая ходьба','Easy walk','Viegla iešana']"));
  assert.ok(d3.includes("['Ходьба на месте или по комнате в лёгком темпе, дыхание спокойное','Walking on the spot or around the room at an easy pace, breathing calmly','Soļošana uz vietas vai pa istabu vieglā tempā, elpošana mierīga']"));
  assert.match(read('sw.js'), /moyzal-v127/);
  assert.ok(fs.existsSync(path.join(root, 'docs/LV-NEW-D264.md')));
});
