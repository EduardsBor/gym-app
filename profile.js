'use strict';
// Eduards 20.11 (docs/17-claude-ux-review.md, Б11): «Профиль» is a short menu of screens instead of one long list:
// Аккаунт, Программа, Оборудование, Тренировка, Данные, Язык и оформление, Справка.
// Loaded last: wraps the final more() (after features.js / sync.js have injected their cards) and only regroups the
// rendered cards — every card keeps its own markup, ids and handlers. Unknown cards stay visible under the menu.
(function(){
  if(typeof more!=='function') return;
  const SECTIONS=[
    {k:'acc',ic:'👤',t:'Аккаунт',sel:['#mzacc','#pwopen']},
    {k:'prog',ic:'📋',t:'Программа',sel:['#progrow','#obre']},
    {k:'equip',ic:'🏋️',t:'Оборудование',sel:['#awequip','#eqdb']},
    {k:'train',ic:'⏱',t:'Тренировка',d:'Таймер, звук, экран, подстановка веса',sel:['#snd','#aw','#ro','#bwkg']},
    {k:'data',ic:'💾',t:'Данные',d:'Резервная копия, экспорт, удаление, согласия',sel:['#expcsv','#wipe']},
    {k:'look',ic:'🎨',t:'Язык и оформление',sel:['[data-theme]','[data-lang]']},
    {k:'help',ic:'ℹ️',t:'Справка',d:'Библиотека упражнений, научная основа, питание',sel:['#helpc']}
  ];
  let open=null;
  window.pfOpenSection=k=>{open=k||null;more()};
  window.pfSection=()=>open;
  // A tap on the «Профиль» tab always starts from the menu.
  document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('nav button');if(b&&b.dataset.v==='more')open=null},true);
  function topCard(el){let c=el;while(c&&c.parentNode!==app)c=c.parentNode;return c}
  function regroup(){
    if(typeof view!=='undefined'&&view!=='more') return;
    const kids=[...app.children];
    if(!kids.length||app.querySelector('#pfmenu')) return;
    const by={};SECTIONS.forEach(s=>by[s.k]=[]);
    const used=new Set();
    SECTIONS.forEach(s=>s.sel.forEach(q=>{
      app.querySelectorAll(q).forEach(el=>{const c=topCard(el);if(c&&!used.has(c)){used.add(c);by[s.k].push(c)}});
    }));
    const ver=kids.filter(c=>c.tagName==='P'&&!used.has(c)).pop();
    if(ver) used.add(ver);
    const rest=kids.filter(c=>!used.has(c));
    const sub={
      acc:()=>{try{return (window.mzSignedIn&&mzSignedIn()&&app.querySelector('#mzacc p'))?app.querySelector('#mzacc p').textContent:''}catch(e){return ''}},
      prog:()=>{try{return S.progName||''}catch(e){return ''}}
    };
    if(open&&by[open]&&by[open].length){
      const s=SECTIONS.find(x=>x.k===open);
      kids.forEach(c=>{if(!by[open].includes(c))c.remove()});
      app.insertAdjacentHTML('afterbegin',`<div id="pfhead" style="margin:0 0 8px"><button class="sm" id="pfback">← Профиль</button><h2 style="margin:10px 0 0">${s.ic} ${s.t}</h2></div>`);
      app.querySelector('#pfback').onclick=()=>{open=null;more();try{scrollTo(0,0)}catch(e){}};
      return;
    }
    open=null;
    const subs={};SECTIONS.forEach(s=>{subs[s.k]=(sub[s.k]&&sub[s.k]())||s.d||''}); // read before the cards leave the page
    kids.forEach(c=>c.remove());
    const items=SECTIONS.filter(s=>by[s.k].length).map(s=>{
      const d=subs[s.k];
      return `<button class="full card pfitem" data-pf="${s.k}" style="text-align:left;display:flex;align-items:center;gap:10px"><span style="font-size:22px">${s.ic}</span><span class="grow"><b>${s.t}</b>${d?`<br><span class="mut" style="font-size:13px">${esc(d)}</span>`:''}</span><span class="mut" aria-hidden="true">›</span></button>`;
    }).join('');
    app.insertAdjacentHTML('afterbegin',`<div id="pfmenu">${items}</div>`);
    rest.forEach(c=>app.append(c));
    if(ver) app.append(ver);
    app.querySelectorAll('[data-pf]').forEach(b=>b.onclick=()=>{open=b.dataset.pf;more();try{scrollTo(0,0)}catch(e){}});
  }
  const _more=more;
  more=function(){const r=_more.apply(this,arguments);try{regroup()}catch(e){}return r};
})();
