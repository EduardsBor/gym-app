'use strict';
// Design-test themes: five palettes, default captain first, localStorage only, typography/outline vars allowed.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const IDS = ['captain', 'studio', 'cobalt', 'copper', 'mono'];
const COLOR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;
const SHAPE = new Set(['--font', '--radius', '--radius-btn', '--line-w', '--track']);
const THEME_BLOCK = /(?:^|\n)((?::root,)?\[data-theme=([a-z]+)\])\{([^}]*)\}/g;

function themeBlocks() {
  const css = read('style.css'), out = {};
  let m;
  while ((m = THEME_BLOCK.exec(css))) {
    const vars = (out[m[2]] && out[m[2]].vars) || {};
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
  vm.runInContext(read('theme.js') + '\nthis.T={THEMES,themeGet,themeSet,THEME_DEF,THEME_NAMES,THEME_LIGHT,themeCardHTML};', ctx);
  return { T: ctx.T, html, meta };
}

test('themes: five palettes with the brief colours; captain is first and the :root default', () => {
  const b = themeBlocks();
  assert.deepEqual(Object.keys(b).sort(), [...IDS].sort());
  assert.match(b.captain.sel, /^:root,/);
  const TABLE = {
    captain: ['#090a07', '#15170f', '#20231a', '#f2f5ec', '#9aa38c', '#8be83a', '#090a07'],
    studio: ['#faf7f0', '#ffffff', '#efe8dc', '#1a1916', '#6b655c', '#195447', '#faf7f0'],
    cobalt: ['#f2f6ff', '#ffffff', '#e4eaf8', '#121826', '#5a6478', '#244cc8', '#ffffff'],
    copper: ['#201820', '#2a2028', '#3a2c36', '#f6ede6', '#b8a59a', '#ffad78', '#201820'],
    mono: ['#ffffff', '#ffffff', '#f2f2f2', '#181818', '#5c5c5c', '#181818', '#ffffff']
  };
  const K = ['--bg', '--card', '--card2', '--txt', '--mut', '--acc', '--on-acc'];
  for (const id of IDS) assert.deepEqual(K.map(k => b[id].vars[k]), TABLE[id], id);
});

test('themes: every theme defines every colour/shape variable used in CSS/JS', () => {
  const b = themeBlocks(), used = usedVars();
  assert.ok(used.size > 20);
  const names = Object.keys(b.captain.vars).sort();
  for (const id of IDS) {
    assert.deepEqual(Object.keys(b[id].vars).sort(), names, id + ' defines the same set');
    for (const v of used) assert.ok(v in b[id].vars, id + ' misses ' + v);
    for (const [k, v] of Object.entries(b[id].vars)) {
      if (SHAPE.has(k) || k === 'color-scheme') continue;
      assert.ok(COLOR.test(v), id + ' ' + k + ' value ' + v);
    }
  }
});

test('themes: readable contrast in every theme (text, muted, accent button, ok/gold on card)', () => {
  const b = themeBlocks();
  for (const id of IDS) {
    const v = b[id].vars;
    assert.ok(contrast(v['--txt'], v['--card']) >= 4.5, id + ' txt ' + contrast(v['--txt'], v['--card']));
    assert.ok(contrast(v['--mut'], v['--card']) >= 4.5, id + ' mut ' + contrast(v['--mut'], v['--card']));
    assert.ok(contrast(v['--on-acc'], v['--acc']) >= 4.5, id + ' on-acc');
    assert.ok(contrast(v['--on-ok'], v['--ok']) >= 4.5, id + ' on-ok');
    assert.ok(contrast(v['--gold'], v['--card']) >= 4.5, id + ' gold text');
  }
  assert.equal(b.captain.vars['--on-acc'], '#090a07', 'captain: dark text on lime');
  assert.equal(b.copper.vars['--on-acc'], '#201820', 'copper: dark text on copper');
});

test('themes: no hardcoded colours in CSS/JS outside the theme blocks', () => {
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

test('themes: default captain without saved choice; choice persists after reload; bad and retired ids fall back', () => {
  const store = {};
  let r = loadTheme(store);
  assert.deepEqual([...r.T.THEMES], IDS);
  assert.equal(r.T.THEMES[0], 'captain');
  assert.equal(r.T.THEME_DEF, 'captain');
  assert.equal(r.T.themeGet(), 'captain');
  assert.equal(r.html.attrs['data-theme'], 'captain');
  assert.equal(r.meta.attrs.content, '#123456', 'theme-color follows --bg');
  r.T.themeSet('studio');
  assert.equal(store.gc_theme, 'studio');
  assert.equal(r.html.attrs['data-theme'], 'studio');
  r = loadTheme(store); // "restart"
  assert.equal(r.html.attrs['data-theme'], 'studio');
  r.T.themeSet('nope');
  assert.equal(store.gc_theme, 'studio');
  r = loadTheme({ gc_theme: 'pink' });
  assert.equal(r.html.attrs['data-theme'], 'captain');
  r = loadTheme({ gc_theme: 'classic' });
  assert.equal(r.html.attrs['data-theme'], 'captain', 'retired classic falls back');
  assert.deepEqual(Object.keys(r.T.THEME_NAMES), IDS);
});

test('themes: switching mid-workout does not touch logged sets or gym storage', () => {
  const gym = JSON.stringify({
    active: { id: 'w1', items: [{ exId: 'dbp', ns: 3, sets: [{ w: 16, r: 10, done: true }, { w: 16, r: 10, done: false }, { w: '', r: 10, done: false }] }] }
  });
  const store = { gym };
  const r = loadTheme(store);
  r.T.themeSet('cobalt');
  r.T.themeSet('mono');
  assert.equal(store.gym, gym);
  assert.equal(store.gc_theme, 'mono');
  const th = read('theme.js');
  assert.equal(/\bS\b|workouts|localStorage\.(get|set)Item\(['"]gym['"]/.test(th), false, 'theme.js must not touch workout state');
});

test('themes: settings list Капитан first; selected marked with a check and the name', () => {
  const r = loadTheme({});
  const html = r.T.themeCardHTML();
  assert.match(html, /<b>Оформление<\/b>/);
  const order = [...html.matchAll(/data-th="([a-z]+)"/g)].map(m => m[1]);
  assert.deepEqual(order, IDS);
  assert.match(html, /data-th="captain"[^>]*>[\s\S]*Капитан[\s\S]*thmark[^>]*>✓/);
  assert.equal((html.match(/thmark/g) || []).length, 1);
  for (const name of Object.values(r.T.THEME_NAMES)) assert.ok(html.includes(name), name);
});

test('themes: theme.js loads early; switcher in profile; local only; free; precached', () => {
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
  assert.match(read('cache-ver.js'), /var SW_CACHE='moyzal-v141'/);
  assert.match(read('sw.js'), /const C=SW_CACHE/);
  assert.match(read('sw.js'), /'style\.css','theme\.js'/);
  assert.match(read('scripts/build-web.js'), /'theme\.js'/);
  const man = JSON.parse(read('manifest.json'));
  assert.equal(man.background_color, '#0f1115');
  assert.equal(read('android/app/src/main/res/values/styles.xml').includes('#090A07'), true);
  const log = read('CHANGELOG.md');
  assert.match(log, /v139/);
  assert.match(log, /Капитан/);
});

test('themes: names RU/EN/LV; new LV strings only in docs/LV-NEW-THEMES.md', () => {
  const d = read('i18n/dict3.js');
  for (const row of [
    "['Оформление','Appearance','Noformējums']",
    "['Капитан','Captain','Kapteinis']",
    "['Студия','Studio','Studija']",
    "['Кобальт','Cobalt','Kobalts']",
    "['Медь','Copper','Varš']",
    "['Моно','Mono','Mono']",
    "['Тема хранится только на этом устройстве.','The theme is saved only on this device.','Tēma tiek saglabāta tikai šajā ierīcē.']"
  ]) assert.ok(d.includes(row), row);
  const lv = read('docs/LV-NEW-THEMES.md');
  for (const w of ['Noformējums', 'Kapteinis', 'Studija', 'Kobalts', 'Varš', 'Mono', 'Tēma tiek saglabāta tikai šajā ierīcē.']) assert.ok(lv.includes(w), w);
  assert.equal(read('LV-REVIEW.md').includes('v138-design'), false);
  assert.equal(fs.existsSync(path.join(root, 'LV-проверка.xlsx')), false);
});
