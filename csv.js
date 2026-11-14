'use strict';
// P-306: CSV export of the workout history. Always free, offline, works for guests (reads only local S).
// UTF-8 with BOM (Excel opens Cyrillic correctly), ';' separator everywhere, CRLF rows, RFC 4180 quoting.
// Text cells starting with = + - @ get a leading ' so spreadsheets don't run them as formulas.
const CSV_SEP=';';
const CSV_HEAD=['Дата','Тренировка','Упражнение','ID упражнения','Подход','Вес, кг','Повторы','Секунды','Уровень/км','Минуты','Оценка','Боль','Заметки'];
const CSV_FEEL={easy:'легко',ok:'нормально',hard:'тяжело'};
function csvCell(v,text){if(v==null)return'';let s=String(v);if(text&&/^[=+\-@\t\r]/.test(s))s="'"+s;
 return /[;"\r\n]/.test(s)||/^\s|\s$/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
function csvDate(t){const d=new Date(+t);if(!isFinite(d))return'';const p=n=>String(n).padStart(2,'0');
 return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes())}
function csvNum(v){return v===''||v==null||!isFinite(+v)?'':String(+v).replace('.',',')}
// workouts: S.workouts; nameOf(id) -> display name; trf -> translator (optional); cardioOf(id) -> bool (optional)
function workoutsCsv(workouts,nameOf,trf,cardioOf){const T=trf||(x=>x);const rows=[CSV_HEAD.map(h=>csvCell(T(h),1)).join(CSV_SEP)];
 (workouts||[]).slice().sort((a,b)=>(+a.start||0)-(+b.start||0)).forEach(w=>{if(!w)return;const date=csvDate(w.start);
  (w.items||[]).forEach(it=>{if(!it)return;const sets=(it.sets||[]).filter(s=>s&&s.done!==false);const nm=nameOf?nameOf(it.exId):it.exId;
   const cardio=!!(cardioOf&&cardioOf(it.exId));const feel=it.feel&&CSV_FEEL[it.feel]?T(CSV_FEEL[it.feel]):'';const pain=it.pain?T('да'):'';
   (sets.length?sets:[{}]).forEach((s,k)=>{const r=csvNum(s.r),wt=csvNum(s.w);
    rows.push([csvCell(date),csvCell(w.dayName,1),csvCell(nm,1),csvCell(it.exId,1),sets.length?k+1:'',
     cardio?'':(it.sec?'':wt),cardio||it.sec?'':r,!cardio&&it.sec?r:'',cardio?wt:'',cardio?r:'',
     csvCell(feel,1),csvCell(pain,1),csvCell(w.notes,1)].join(CSV_SEP))})})});
 return '\uFEFF'+rows.join('\r\n')+'\r\n'}
// Interface language (same lookup as the UI: tr(exBy(id).name)); custom exercises keep the stored name.
function csvExName(id){const e=typeof exBy==='function'?exBy(id):null;const raw=e&&e.name&&e.name!=='?'?e.name:id;
 return typeof tr==='function'?tr(raw):raw}
function exportCsv(){if(typeof S==='undefined'||!S)return;const T=typeof tr==='function'?tr:null;
 const data=workoutsCsv(S.workouts,csvExName,T,typeof isCardio==='function'?isCardio:null);
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'text/csv;charset=utf-8'}));
 a.download='moy-zal-'+new Date().toISOString().slice(0,10)+'.csv';document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}
