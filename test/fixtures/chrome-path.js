'use strict';
// GC-163-04: one place to find a Chrome / Chromium binary for the headless tests on Linux, Windows and macOS.
// Order: CHROME_PATH env → platform candidates. Returns null when none is installed (tests then skip with a reason).
const fs = require('fs');
const path = require('path');

function chromeCandidates() {
  const env = process.env;
  const list = [];
  if (env.CHROME_PATH) list.push(env.CHROME_PATH);
  if (process.platform === 'win32') {
    for (const base of [env.PROGRAMFILES, env['PROGRAMFILES(X86)'], env.LOCALAPPDATA, 'C:/Program Files', 'C:/Program Files (x86)']) {
      if (!base) continue;
      list.push(path.join(base, 'Google/Chrome/Application/chrome.exe'), path.join(base, 'Chromium/Application/chrome.exe'));
    }
  } else if (process.platform === 'darwin') {
    list.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium');
  }
  list.push('/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/opt/google/chrome/chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium');
  return list;
}

function findChrome() {
  for (const p of chromeCandidates()) { try { if (p && fs.existsSync(p)) return p; } catch (e) {} }
  return null;
}

module.exports = { findChrome, chromeCandidates };
