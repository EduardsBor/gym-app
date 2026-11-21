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
  'theme.js',
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
  'nutrition.js',
  'movekit.js',
  'place.js',
  'plan.js',
  'premium.js',
  'prog.js',
  'progress.js',
  'sync.js',
  'blocks.js',
  'exscreen.js',
  'tech.js',
  'warm.js',
  'notify.js',
  'profile.js',
  'sentry.js',
  'icon-192.png',
  'icon-512.png',
  'icon-512-maskable.png',
  'icon.svg',
  'beep3.wav',
  'tick.wav'
];
const DIRS = ['i18n', 'vendor', 'data'];

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

const SentryBuild = require('../sentry.js');
const esbuild = require('esbuild');

function appRelease() {
  let ver = '1.0', cache = 'unknown';
  try {
    const m = fs.readFileSync(path.join(root, 'app.js'), 'utf8').match(/APP_VERSION\s*=\s*'([^']+)'/);
    if (m) ver = m[1];
  } catch (e) {}
  try {
    const m = fs.readFileSync(path.join(root, 'sw.js'), 'utf8').match(/const C='([^']+)'/);
    if (m) cache = m[1];
  } catch (e) {}
  return ver + '+' + cache;
}

function writeSentryArtifacts() {
  const dsn = process.env.GC_SENTRY_DSN || '';
  const environment = process.env.GC_SENTRY_ENV === 'production' ? 'production' : 'debug';
  const release = appRelease();
  const enabled = !!SentryBuild.validateDsn(dsn);
  fs.writeFileSync(path.join(dest, 'sentry-config.js'), SentryBuild.makeConfigJs({ dsn, environment, release }));
  esbuild.buildSync({
    absWorkingDir: root,
    entryPoints: [path.join(__dirname, 'sentry-sdk-entry.js')],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    outfile: path.join(dest, 'vendor', 'sentry-sdk.js'),
    alias: { '@capacitor/core': path.join(__dirname, 'capacitor-runtime.js') },
    logLevel: 'warning'
  });
  const indexPath = path.join(dest, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');
  const tags = '<script src="sentry-config.js"></script><script src="vendor/sentry-sdk.js"></script><script src="sentry.js"></script>';
  if (!html.includes('src="sentry.js"')) {
    if (html.includes('<body>')) html = html.replace('<body>', '<body>' + tags);
    else html = tags + html;
    fs.writeFileSync(indexPath, html);
  }
  return enabled;
}

const sentryOn = writeSentryArtifacts();
console.log('www/ ready (' + FILES.length + ' root files + ' + DIRS.join(', ') + '; sentry ' + (sentryOn ? 'enabled' : 'disabled') + ')');
