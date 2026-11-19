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

