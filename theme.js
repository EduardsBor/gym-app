'use strict';
// Design-test themes. All colours, type, outlines and radii live in style.css ([data-theme=…] blocks); this file only switches them.
// The choice is stored only on this device (localStorage 'gc_theme'): not synced, not in the backup, not in analytics.
// Loaded in <head> right after style.css, so the theme is applied before the first paint (no flash).
const THEMES=['captain','studio','cobalt','copper','mono'];
const THEME_DEF='captain',THEME_KEY='gc_theme';
const THEME_LIGHT=['studio','cobalt','mono'];
const THEME_NAMES={captain:'Капитан',studio:'Студия',cobalt:'Кобальт',copper:'Медь',mono:'Моно'};
let _gcBars=null;
function themeGet(){try{const t=localStorage.getItem(THEME_KEY);if(THEMES.includes(t))return t}catch(e){}return THEME_DEF}
function cssVar(n){try{return getComputedStyle(document.documentElement).getPropertyValue(n).trim()}catch(e){return''}}
function themeBars(t){// Android (Capacitor 8 SystemBars, edge-to-edge): the bar shows the page background; only icon colour changes.
 try{const C=window.Capacitor;if(!C||!C.isNativePlatform||!C.isNativePlatform())return;
  if(!_gcBars)_gcBars=(C.Plugins&&C.Plugins.SystemBars)||(C.registerPlugin?C.registerPlugin('SystemBars'):null);
  if(_gcBars&&_gcBars.setStyle){const p=_gcBars.setStyle({style:THEME_LIGHT.includes(t)?'LIGHT':'DARK'});if(p&&p.catch)p.catch(()=>{})}}catch(e){}}
function themeApply(t){if(!THEMES.includes(t))t=THEME_DEF;document.documentElement.setAttribute('data-theme',t);
 const bg=cssVar('--bg'),m=document.querySelector('meta[name=theme-color]');if(m&&bg)m.setAttribute('content',bg);
 themeBars(t);return t}
function themeSet(t){if(!THEMES.includes(t))return themeGet();try{localStorage.setItem(THEME_KEY,t)}catch(e){}return themeApply(t)}
function themeCardHTML(){const cur=themeGet();
 return `<div class="card"><b>Оформление</b><div class="thsw">${THEMES.map(t=>`<button type="button" data-th="${t}" class="${t===cur?'on':''}" aria-pressed="${t===cur}"><span class="ring"><i data-theme="${t}"></i></span><span class="thnm">${THEME_NAMES[t]}</span>${t===cur?'<span class="thmark" aria-hidden="true">✓</span>':''}</button>`).join('')}</div><p class="mut">Тема хранится только на этом устройстве.</p></div>`}
function themeMark(btn,on){btn.classList.toggle('on',on);btn.setAttribute('aria-pressed',String(on));
 let m=btn.querySelector('.thmark');if(on&&!m){m=document.createElement('span');m.className='thmark';m.setAttribute('aria-hidden','true');m.textContent='✓';btn.appendChild(m)}else if(!on&&m)m.remove()}
function themeBind(root){const bs=[...(root||document).querySelectorAll('.thsw button')];
 bs.forEach(b=>b.onclick=()=>{themeSet(b.dataset.th);bs.forEach(x=>themeMark(x,x===b))})}
themeApply(themeGet());
if(typeof module!=='undefined')module.exports={THEMES,THEME_DEF,THEME_KEY,THEME_NAMES,THEME_LIGHT,themeGet,themeSet,themeApply,themeCardHTML};
