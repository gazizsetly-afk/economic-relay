'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net');
const {spawn}=require('node:child_process');
const tasks=require('../official-team-assignments.json');
const privateKeys={answerKeys:Object.fromEntries(Array.from({length:10},(_,i)=>[String(i+1),{ru:['Эталонный анализ '+(i+1),'Обоснованный расчёт '+(i+1),'Вывод '+(i+1)],kk:['Талдау '+(i+1),'Есептеу '+(i+1),'Қорытынды '+(i+1)]}]))};
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
async function launch(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'relay-teams-v4-'));
 const port=await new Promise((resolve,reject)=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const port=s.address().port;s.close(()=>resolve(port));});s.on('error',reject);});
 const base=`http://127.0.0.1:${port}`;
 const proc=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:String(port),DATA_DIR:dir,DATABASE_URL:'',TEACHER_PASSWORD:'my-testing-private-strong-password',SESSION_SECRET:'strong-test-cookie-secret-2026-many-chars',NODE_ENV:'development'},stdio:['ignore','pipe','pipe']});
 let log='';proc.stdout.on('data',x=>log+=x);proc.stderr.on('data',x=>log+=x);
 t.after(()=>{proc.kill();fs.rmSync(dir,{recursive:true,force:true});});
 let ready=false;for(let i=0;i<100;i++){try{if((await fetch(base+'/health')).ok){ready=true;break;}}catch{}await sleep(60);}assert.ok(ready,log);
 const cookies={teacher:'',a:'',b:'',c:''};
 async function call(who,url,method='GET',body){const r=await fetch(base+url,{method,headers:{...(cookies[who]?{cookie:cookies[who]}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});const c=r.headers.get('set-cookie');if(c)cookies[who]=c.split(';')[0];const ct=r.headers.get('content-type')||'';return {status:r.status,data:ct.includes('json')?await r.json():await r.text()};}
 return {call,dir,base,cookies};
}

test('10 original bilingual complex assignments: original stages, private jury keys, exact 50 point rubric',()=>{
 assert.equal(tasks.teams.length,10);
 assert.equal(Object.keys(privateKeys.answerKeys).length,10);
 for(let i=0;i<10;i++){
  const t=tasks.teams[i];assert.equal(t.id,i+1);
  for(const l of ['ru','kk']){
    assert.ok(t[l].title.length>7);
    assert.equal(t[l].stages.length,3);
    assert.ok(t[l].stages.every(x=>x.heading&&x.body.length>40));
    assert.equal(t[l].key,undefined,'model answers must never be shipped to public GitHub');
    assert.equal(privateKeys.answerKeys[String(i+1)][l].length,3);
  }
 }
 assert.deepEqual(tasks.instructions.ru.rubric.map(x=>x.max),[10,15,15,10]);
 assert.deepEqual(tasks.instructions.kk.rubric.map(x=>x.max),[10,15,15,10]);
 assert.match(tasks.teams[0].ru.stages[0].body,/18 000/);
 assert.match(tasks.teams[9].kk.stages[1].body,/200 000/);
 assert.match(tasks.instructions.ru.poster,/А3/);
});

test('teacher loads 7 then 10 original assignments without breaking teacher quiz; student privacy; detailed jury grades',async t=>{
 const {call}=await launch(t);
 let publicInfo=(await call('a','/api/public')).data;
 assert.equal(publicInfo.phase,'setup');assert.equal(publicInfo.teams.length,0);
 assert.equal((await call('a','/api/admin/answers/import','POST',{answerKeys:privateKeys.answerKeys})).status,401);
 assert.equal((await call('teacher','/api/teacher/login','POST',{password:'my-testing-private-strong-password'})).status,200);
 let admin=(await call('teacher','/api/admin')).data;
 assert.equal(admin.teams.length,7);
 assert.equal(admin.teams[0].tasks[0].maxScore,50);
 assert.equal(admin.teams[0].tasks[0].officialId,1);
 assert.equal(admin.teams[0].tasks[0].officialContent.ru.stages.length,3);
 assert.deepEqual(admin.answerKeys,{});
 assert.equal((await call('teacher','/api/admin/tasks/official','POST',{count:9})).status,400);
 assert.equal((await call('teacher','/api/admin/tasks/official','POST',{count:7})).status,200);
 assert.equal((await call('teacher','/api/admin/tasks/official','POST',{count:10})).status,200);
 const imported=await call('teacher','/api/admin/answers/import','POST',{answerKeys:privateKeys.answerKeys});assert.equal(imported.status,200);
 admin=(await call('teacher','/api/admin')).data;
 assert.equal(admin.teams.length,10);assert.equal(admin.questions.length,20);
 assert.equal(admin.teams[9].tasks[0].maxScore,50);
 assert.equal(admin.answerKeys['3'].ru.length,3);
 assert.ok(!JSON.stringify((await call('a','/api/public')).data).includes('14 000 × 10%'));
 assert.equal((await call('a','/api/admin')).status,401);
 // teacher submits 20 correct answers, starts class
 assert.equal((await call('teacher','/api/admin/quiz','POST',{answers:admin.questions.map(q=>q.correct)})).data.score,20);
 assert.equal((await call('teacher','/api/admin/tasks/official','POST',{count:7})).status,409);
 assert.equal((await call('teacher','/api/admin/open','POST',{})).status,200);
 let a=(await call('a','/api/member/register','POST',{name:'Алия',teamId:admin.teams[0].id,pin:admin.teams[0].pin}));assert.equal(a.status,200);
 assert.equal((await call('b','/api/member/register','POST',{name:'Бекзат',teamId:admin.teams[9].id,pin:admin.teams[9].pin})).status,200);
 let memberA=(await call('a','/api/member')).data;
 let memberB=(await call('b','/api/member')).data;
 assert.equal(memberA.team.tasks.length,1);assert.equal(memberA.team.tasks[0].officialId,1);
 assert.equal(memberB.team.tasks[0].officialId,10);
 assert.ok(!JSON.stringify(memberA).includes('Чайник'));
 assert.ok(!JSON.stringify(memberA).includes('10 000 тг. Итоговая сумма'));
 assert.equal(memberA.team.maxScore,50);
 const submitted=await call('a','/api/member/submit','POST',{taskId:1,answer:'Этап 1 — анализ:\nРасходы;\n\nЭтап 2 — расчёт:\n15000;\n\nЭтап 3 — решение:\nСбережения'});
 assert.equal(submitted.status,200);
 assert.equal((await call('teacher','/api/admin/grade','POST',{teamId:1,taskId:1,rubric:{analysis:11,calculation:15,decision:15,defense:10}})).status,400);
 assert.equal((await call('teacher','/api/admin/grade','POST',{teamId:1,taskId:1,rubric:{analysis:10,calculation:13,decision:12,defense:9},feedback:'Хороший ответ, плакат понятный'})).data.score,44);
 memberA=(await call('a','/api/member')).data;
 assert.equal(memberA.team.score,44);assert.equal(memberA.team.maxScore,50);
 assert.deepEqual(memberA.team.tasks[0].submission.rubric,{analysis:10,calculation:13,decision:12,defense:9});
 publicInfo=(await call('b','/api/public')).data;
 assert.equal(publicInfo.leaderboard.find(x=>x.id===1).score,44);
 assert.equal(publicInfo.leaderboard.find(x=>x.id===1).maxScore,50);
 assert.equal((await call('b','/api/admin/answers/import','POST',{answerKeys:privateKeys.answerKeys})).status,401);
 const csv=(await call('teacher','/api/admin/csv')).data;
 assert.ok(csv.includes('Расчёт (15)')&&csv.includes('Хороший ответ'));
 assert.equal((await call('teacher','/api/admin/close','POST',{})).status,200);
 assert.equal((await call('teacher','/api/admin/next','POST',{confirm:'NEW ROUND'})).status,200);
 admin=(await call('teacher','/api/admin')).data;
 assert.equal(admin.round,2);assert.equal(admin.history[0].teams[0].score,44);
 assert.equal(admin.teams[0].tasks[0].officialId,1);
 assert.equal(admin.teams[0].tasks[0].submission,null);
 assert.equal(admin.answerKeys['1'].ru.length,3);
});
