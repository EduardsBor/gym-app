const test=require('node:test'),assert=require('node:assert'),fs=require('fs');
const app=fs.readFileSync(__dirname+'/../app.js','utf8'),d3=fs.readFileSync(__dirname+'/../i18n/dict3.js','utf8');
test('D-228: trainer catalog descriptions, no 30-min express, limitation programs hidden',()=>{
  assert.ok(app.includes("['Похудение для начинающих','Для новичков, кто хочет похудеть"));
  assert.ok(!app.includes("['Похудение: экспресс 30 мин'"));
  assert.ok(!/^\['Здоровая спина'/m.test(app)&&!/^\['Бережно к коленям'/m.test(app));
  assert.ok(app.includes('Турник не обязателен'));
  assert.ok(d3.includes("'Weight loss for beginners'"));
});
