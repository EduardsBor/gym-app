const test=require('node:test'),assert=require('node:assert'),fs=require('fs');
const app=fs.readFileSync(__dirname+'/../app.js','utf8'),bl=fs.readFileSync(__dirname+'/../blocks.js','utf8');
test('D-227: workouts are a collapsible list grouped by week with readable names',()=>{
  assert.match(bl,/function blockDayName\(w\)/);
  assert.match(bl,/U1:'Верх тела A'/);
  assert.match(app,/<details class="card dayc"/);
  assert.match(app,/function weekHead\(days,di\)/);
  assert.match(app,/Нажми на тренировку, чтобы открыть упражнения\./);
  assert.match(app,/PRG_OPEN/);
  assert.match(app,/function progSummary\(days\)/);
  assert.ok(!app.includes("generate(c.a).days.map(d=>esc(d.name)).join(' · ')"));
});
