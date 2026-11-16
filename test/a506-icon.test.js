const test=require('node:test');const assert=require('node:assert');const fs=require('fs');
test('A-506: PWA icons and maskable entry',()=>{const m=JSON.parse(fs.readFileSync('manifest.json','utf8'));
assert.ok(m.icons.some(i=>i.src==='icon-512-maskable.png'&&i.purpose==='maskable'));
for(const f of ['icon-192.png','icon-512.png','icon-512-maskable.png','icon.svg'])assert.ok(fs.existsSync(f));
assert.match(fs.readFileSync('sw.js','utf8'),/icon-512-maskable\.png/);});
test('A-506: Android adaptive icon with monochrome and splash',()=>{const r='android/app/src/main/res/';
for(const x of ['ic_launcher.xml','ic_launcher_round.xml']){const s=fs.readFileSync(r+'mipmap-anydpi-v26/'+x,'utf8');assert.match(s,/monochrome/);assert.match(s,/@mipmap\/ic_launcher_background/);}
for(const d of ['mdpi','hdpi','xhdpi','xxhdpi','xxxhdpi']){for(const f of ['ic_launcher','ic_launcher_round','ic_launcher_foreground','ic_launcher_background','ic_launcher_monochrome'])assert.ok(fs.existsSync(`${r}mipmap-${d}/${f}.png`));assert.ok(fs.existsSync(`${r}drawable-${d}/splash_icon.png`));}
const st=fs.readFileSync(r+'values/styles.xml','utf8');assert.match(st,/windowSplashScreenBackground">#090A07/);assert.match(st,/splash_icon/);});
