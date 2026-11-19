'use strict';
// D-225 step 2: five colour themes, default captain, choice only in localStorage, no hardcoded colours outside theme blocks.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const IDS = ['classic', 'captain', 'light', 'ocean', 'berry'];
const COLOR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;
const THEME_BLOCK = /(?:^|\n)((?::root,)?\[data-theme=([a-z]+)\])\{([^}]*)\}/g;

function themeBlocks() {
  const css = read('style.css'), out = {};
  let m;
  while ((m = THEME_BLOCK.exec(css))) {
    const vars = {};
    m[3].split(';').forEach(d => { const i = d.indexOf(':'); if (d.trim().startsWith('--')) vars[d.slice(0, i).trim()] = d.slice(i + 1).trim(); });
    out[m[2]] = { sel: m[1], vars };
  }
  return out;
}
function usedVars() {
  const files = ['style.css', ...fs.readdirSync(root).filter(f => f.endsWith('.js'))];
  const s = new Set();
  files.forEach(f => (read(f).match(/var\(--[a-z0-9-]+|cssVar\('--[a-z0-9-]+/g) || []).forEach(v => s.add(v.replace(/^var\(|^cssVar\('/, ''))));
  return s;
}
function lum(h) {
  h = h.replace('#', ''); if (h.length <= 4) h = h.slice(0, 3).split('').map(c => c + c).join('');
  const c = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

function loadTheme(store) {
  const meta = { attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } };
  const html = { attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } };
  const ctx = {
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
    document: { documentElement: html, querySelector: () => meta },
    getComputedStyle: () => ({ getPropertyValue: () => '#123456' }),
    window: {}
  };
  vm.createContext(ctx);
  vm.runInContext(read('theme.js') + '\nthis.T={THEMES,themeGet,themeSet,THEME_DEF,THEME_NAMES};', ctx);
  return { T: ctx.T, html, meta };
}

test('D-225: five themes with the exact table colours; captain is the :root default', () => {
  const b = themeBlocks();
  assert.deepEqual(Object.keys(b).sort(), [...IDS].sort());
  assert.match(b.captain.sel, /^:root,/);
  const TABLE = {
    classic: ['#0f1115', '#1a1d24', '#242832', '#eef0f4', '#8b93a3', '#ff6b35', '#0f1115'],
    captain: ['#090a07', '#15170f', '#20231a', '#f2f5ec', '#9aa38c', '#8be83a', '#090a07'],
    light: ['#f5f6f8', '#ffffff', '#eceef2', '#15181e', '#5b6372', '#c2410c', '#ffffff'],
    ocean: ['#0b1220', '#121b2e', '#1a2540', '#e8eef8', '#8a9ab5', '#38bdf8', '#0b1220'],
    berry: ['#121014', '#1d1a21', '#28232e', '#f1edf4', '#9a90a5', '#f0568a', '#121014']
  };
  const K = ['--bg', '--card', '--card2', '--txt', '--mut', '--acc', '--on-acc'];
  for (const id of IDS) assert.deepEqual(K.map(k => b[id].vars[k]), TABLE[id], id);
});

test('D-225: every theme defines every colour variable used in CSS/JS', () => {
  const b = themeBlocks(), used = usedVars();
  assert.ok(used.size > 20);
  const names = Object.keys(b.captain.vars).sort();
  for (const id of IDS) {
    assert.deepEqual(Object.keys(b[id].vars).sort(), names, id + ' defines the same set');
    for (const v of used) assert.ok(v in b[id].vars, id + ' misses ' + v);
    for (const v of Object.values(b[id].vars)) assert.ok(COLOR.test(v), id + ' value ' + v);
  }
});

test('D-225: readable contrast in every theme (text, muted, accent button, ok/gold on light)', () => {
  const b = themeBlocks();
  for (const id of IDS) {
    const v = b[id].vars;
    assert.ok(contrast(v['--txt'], v['--card']) >= 4.5, id + ' txt');
    assert.ok(contrast(v['--mut'], v['--card']) >= 4.5, id + ' mut');
    assert.ok(contrast(v['--on-acc'], v['--acc']) >= 4.5, id + ' on-acc');
    assert.ok(contrast(v['--on-ok'], v['--ok']) >= 4.5, id + ' on-ok');
    assert.ok(contrast(v['--gold'], v['--card']) >= 4.5, id + ' gold text');
  }
  assert.ok(contrast(b.light.vars['--ok'], b.light.vars['--card']) >= 4.5, 'light ok');
  assert.equal(b.classic.vars['--on-acc'], '#0f1115', 'classic: dark text on orange');
});

test('D-225: no hardcoded colours in CSS/JS outside the theme blocks', () => {
  const css = read('style.css').replace(THEME_BLOCK, '');
  assert.equal(COLOR.test(css), false, 'style.css: ' + (css.match(COLOR) || [''])[0]);
  const jsFiles = fs.readdirSync(root).filter(f => f.endsWith('.js') && f !== 'supabase-config.js');
  const bad = [];
  const RE = [/\b(?:fill|stroke|color|background(?:-color)?|fillStyle|strokeStyle|stop-color)\s*[:=]\s*['"]?\s*#[0-9a-fA-F]{3,8}\b/, /['"`]#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?['"`]/, /\brgba?\(\s*\d/, /\bhsla?\(\s*\d/];
  for (const f of jsFiles) {
    const s = read(f);
    RE.forEach(r => { const m = s.match(r); if (m) bad.push(f + ': ' + m[0]); });
  }
  assert.deepEqual(bad, []);
});

test('D-225: default captain without saved choice; choice persists after reload; bad value falls back', () => {
  const store = {};
  let r = loadTheme(store);
  assert.deepEqual([...r.T.THEMES], IDS);
  assert.equal(r.T.THEME_DEF, 'captain');
  assert.equal(r.T.themeGet(), 'captain');
  assert.equal(r.html.attrs['data-theme'], 'captain');
  assert.equal(r.meta.attrs.content, '#123456', 'theme-color follows --bg');
  r.T.themeSet('light');
  assert.equal(store.gc_theme, 'light');
  assert.equal(r.html.attrs['data-theme'], 'light');
  r = loadTheme(store); // "restart"
  assert.equal(r.html.attrs['data-theme'], 'light');
  r.T.themeSet('nope');
  assert.equal(store.gc_theme, 'light');
  r = loadTheme({ gc_theme: 'pink' });
  assert.equal(r.html.attrs['data-theme'], 'captain');
  assert.deepEqual(Object.keys(r.T.THEME_NAMES), IDS);
});

test('D-225: theme.js loads early; switcher in «Ещё»; local only; free; precached; icons untouched', () => {
  const html = read('index.html');
  assert.match(html, /<link rel="stylesheet" href="style.css"><script src="theme.js"><\/script><\/head>/);
  const app = read('app.js');
  assert.match(app, /themeCardHTML\(\)/);
  assert.match(app, /themeBind\(app\)/);
  const th = read('theme.js');
  assert.match(th, /<b>Оформление<\/b>/);
  assert.equal(/premium|isPro|mzTrack|sb\.|supabase/i.test(th), false, 'free, no analytics, no cloud');
  for (const f of ['sync.js', 'app.js', 'csv.js', 'features.js', 'premium.js']) assert.equal(read(f).includes('gc_theme'), false, f);
  assert.match(th, /SystemBars/);
  assert.match(read('sw.js'), /const C='moyzal-v104'/);
  assert.match(read('sw.js'), /'style\.css','theme\.js'/);
  assert.match(read('scripts/build-web.js'), /'theme\.js'/);
  const man = JSON.parse(read('manifest.json'));
  assert.equal(man.background_color, '#0f1115');
  assert.equal(read('android/app/src/main/res/values/styles.xml').includes('#090A07'), true);
  const log = read('CHANGELOG.md');
  assert.match(log, /D-225/);
  assert.match(log, /moyzal-v70/);
});

test('D-225: theme names RU/EN/LV; new LV strings only in docs/LV-NEW-D225.md', () => {
  const d = read('i18n/dict3.js');
  for (const r of ["['Оформление','Appearance','Noformējums']", "['Классика','Classic','Klasiskā']", "['Капитан','Captain','Kapteinis']", "['Светлая','Light','Gaišā']", "['Океан','Ocean','Okeāns']", "['Ягода','Berry','Oga']"]) assert.ok(d.includes(r), r);
  const lv = read('docs/LV-NEW-D225.md');
  for (const w of ['Noformējums', 'Klasiskā', 'Kapteinis', 'Gaišā', 'Okeāns', 'Oga', 'Tēma tiek saglabāta tikai šajā ierīcē.']) assert.ok(lv.includes(w), w);
  assert.equal(read('LV-REVIEW.md').includes('D-225'), false);
});
