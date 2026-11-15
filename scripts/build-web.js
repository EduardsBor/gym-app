#!/usr/bin/env node
'use strict';
/**
 * Copy static PWA files into www/ for the Capacitor Android wrapper.
 * GitHub Pages still serves from the repository root; www/ is a gitignored build output.
 * Do not include test/, docs/, sql/, tools/, node_modules/, android/, or any MoveKit clips.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dest = path.join(root, 'www');

const FILES = [
  'index.html',
  'style.css',
  'manifest.json',
  'sw.js',
  'supabase-config.js',
  'alt.js',
  'app.js',
  'stats.js',
  'autow.js',
  'cards.js',
  'cd.js',
  'csv.js',
  'features.js',
  'health.js',
  'legal.js',
  'lib.js',
  'movekit.js',
  'place.js',
  'plan.js',
  'premium.js',
  'prog.js',
  'progress.js',
  'sync.js',
  'tech.js',
  'warm.js',
  'icon-192.png',
  'icon-512.png',
  'icon.svg',
  'beep3.wav',
  'tick.wav'
];
const DIRS = ['i18n', 'vendor'];

function copyFile(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dst, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else copyFile(s, d);
  }
}

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });

for (const f of FILES) {
  const s = path.join(root, f);
  if (!fs.existsSync(s)) {
    console.warn('skip missing', f);
    continue;
  }
  copyFile(s, path.join(dest, f));
}
for (const d of DIRS) {
  const s = path.join(root, d);
  if (!fs.existsSync(s)) {
    console.warn('skip missing dir', d);
    continue;
  }
  copyDir(s, path.join(dest, d));
}

console.log('www/ ready (' + FILES.length + ' root files + ' + DIRS.join(', ') + ')');
