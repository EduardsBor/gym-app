'use strict';
// Localization engine. UI source strings are Russian; DICT (dict.js) maps them to EN/LV.
// Rendered DOM is translated automatically (text nodes + placeholder/aria-label/title), longest phrase first.
const LANGS={ru:'Русский',en:'English',lv:'Latviešu'};
const LANG=(()=>{try{const s=JSON.parse(localStorage.getItem('gym')||'null');if(s&&LANGS[s.lang])return s.lang}catch(e){}
 const n=(navigator.languages||[navigator.language||'']).map(x=>String(x).slice(0,2).toLowerCase()).find(x=>LANGS[x]);return n||'ru'})();
const LOC={ru:'ru-RU',en:'en-GB',lv:'lv-LV'}[LANG];
document.documentElement.lang=LANG;
const CYR=/[А-Яа-яЁё]/;
let TRM=null,TRE=null,TRX=null;
function trInit(){if(TRM||LANG==='ru')return;const i=LANG==='en'?1:2;TRM=new Map();TRE=new Map();
 DICT.concat(typeof DICT2!=='undefined'?DICT2:[]).forEach(r=>{if(r[i]!=null)TRM.set(r[0],r[i])});DICT_EXACT.forEach(r=>TRE.set(r[0],r[i]));
 const keys=[...TRM.keys()].sort((a,b)=>b.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
 TRX=new RegExp('(?<![\\p{L}])(?:'+keys.join('|')+')(?![\\p{L}])','gu')}
function tr(s){if(LANG==='ru'||s==null)return s;s=String(s);if(!CYR.test(s))return s;trInit();const t=s.trim();
 if(TRE.has(t))return s.replace(t,TRE.get(t));if(TRM.has(t))return s.replace(t,TRM.get(t));return s.replace(TRX,m=>TRM.get(m))}
const SKIP=new Set(['SCRIPT','STYLE','TEXTAREA']);
function trText(n){const p=n.parentNode;if(!p||SKIP.has(p.nodeName)||(p.closest&&p.closest('[data-noi18n]')))return;if(!CYR.test(n.data))return;const v=tr(n.data);if(v!==n.data)n.data=v}
function trAttrs(el){if(el.closest('[data-noi18n]'))return;for(const a of ['placeholder','aria-label','title']){const v=el.getAttribute(a);if(v&&CYR.test(v)){const t=tr(v);if(t!==v)el.setAttribute(a,t)}}}
function trTree(root){if(LANG==='ru')return;if(root.nodeType===3)return trText(root);if(root.nodeType!==1||SKIP.has(root.nodeName))return;
 trAttrs(root);root.querySelectorAll('[placeholder],[aria-label],[title]').forEach(trAttrs);
 const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;const L=[];while((n=w.nextNode()))L.push(n);L.forEach(trText)}
if(LANG!=='ru'){
 new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')trText(m.target);else m.addedNodes.forEach(trTree)}})
  .observe(document.documentElement,{childList:true,subtree:true,characterData:true});
 const oc=window.confirm.bind(window),oa=window.alert.bind(window);window.confirm=m=>oc(tr(m));window.alert=m=>oa(tr(m));
 document.addEventListener('DOMContentLoaded',()=>{trTree(document.body);document.title=tr(document.title)});
}
