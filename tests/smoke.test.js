'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),{spawn}=require('node:child_process');
async function freePort(){return new Promise((resolve,reject)=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});s.on('error',reject);});}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function setup(t,oldData){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'relay-v3-'));if(oldData){fs.writeFileSync(path.join(dir,'relay-data.json'),JSON.stringify(oldData));}
 const port=await freePort(),base=`http://127.0.0.1:${port}`;
 const proc=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:String(port),DATA_DIR:dir,DATABASE_URL:'',TEACHER_PASSWORD:'teacher-test-password',SESSION_SECRET:'test-session-secret-value-at-least-32-chars',NODE_ENV:'development'},stdio:['ignore','pipe','pipe']});
 let log='';proc.stdout.on('data',b=>log+=b);proc.stderr.on('data',b=>log+=b);
 t.after(()=>{proc.kill();fs.rmSync(dir,{recursive:true,force:true});});
 let ready=false;for(let i=0;i<120;i++){try{const r=await fetch(base+'/health');if(r.ok){ready=true;break;}}catch{}await sleep(60);}assert.ok(ready,log);
 const cookie={teacher:'',member1:'',member2:'',member3:''};
 async function query(id,url,method='GET',data){const r=await fetch(base+url,{method,headers:{...(cookie[id]?{cookie:cookie[id]}:{}),...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});const c=r.headers.get('set-cookie');if(c)cookie[id]=c.split(';')[0];const type=r.headers.get('content-type')||'';const value=type.includes('json')?await r.json():await r.text();return {status:r.status,data:value};}
 return {query,base,cookie,dir};
}
test('teacher preloads multiple tasks, quiz, students automatically progress, private photos, grading, next round',async t=>{
 const {query,base,cookie,dir}=await setup(t);
 assert.equal((await query('member1','/api/public')).data.phase,'setup');
 assert.equal((await query('teacher','/api/teacher/login','POST',{password:'teacher-test-password'})).status,200);
 let adm=(await query('teacher','/api/admin')).data;
 assert.equal(adm.teams.length,7);assert.equal(adm.questions.length,20);
 const first=adm.teams[0],second=adm.teams[1];
 const teams=adm.teams.map((team,i)=>({id:team.id,name:`Команда ${i+1}`,pin:team.pin,tasks:[{id:1,ru:`Разное задание ${i+1} — первое`,kk:`Қазақша ${i+1} №1`},{id:2,ru:`Разное задание ${i+1} — второе`,kk:`Қазақша ${i+1} №2`},{id:3,ru:`Разное задание ${i+1} — третье`,kk:`Қазақша ${i+1} №3`}] }));
 assert.equal((await query('teacher','/api/admin/teams','POST',{teams})).status,200);
 assert.equal((await query('member1','/api/member/register','POST',{name:'Айдос',teamId:first.id,pin:first.pin})).status,403);
 assert.equal((await query('teacher','/api/admin/quiz','POST',{answers:Array(19).fill(0)})).status,400);
 assert.equal((await query('teacher','/api/admin/quiz','POST',{answers:adm.questions.map(q=>q.correct)})).data.score,20);
 assert.equal((await query('teacher','/api/admin/teams','POST',{teams})).status,409);
 assert.equal((await query('teacher','/api/admin/open','POST',{})).status,200);
 const registration=(await query('member1','/api/member/register','POST',{name:'Айдос',teamId:first.id,pin:first.pin}));assert.equal(registration.status,200);assert.equal(registration.data.captain,true);
 assert.equal((await query('member2','/api/member/register','POST',{name:'Аружан',teamId:first.id,pin:first.pin})).status,200);
 assert.equal((await query('member3','/api/member/register','POST',{name:'Ермек',teamId:second.id,pin:second.pin})).status,200);
 let me=(await query('member1','/api/member')).data;
 assert.equal(me.team.tasks.length,3);assert.equal(me.team.activeId,1);assert.equal(me.team.tasks[1].ru,'','future assignment is hidden');
 assert.equal(me.team.tasks[0].kk,'Қазақша 1 №1');
 assert.equal((await query('member3','/api/member')).data.team.tasks[0].kk,'Қазақша 2 №1');
 assert.equal((await query('member2','/api/member/submit','POST',{taskId:1,answer:'I am not captain'})).status,403);
 assert.equal((await query('member1','/api/member/submit','POST',{taskId:2,answer:'Try skipping'})).status,409);
 const png='data:image/png;base64,'+Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489', 'hex').toString('base64');
 assert.equal((await query('member1','/api/member/submit','POST',{taskId:1,answer:'Бірінші ортақ жауап',photo:png})).status,200);
 me=(await query('member1','/api/member')).data;
 assert.equal(me.team.activeId,2,'second task should unlock without teacher intervention');
 assert.equal(me.team.tasks[0].submitted,true);
 assert.equal(me.team.tasks[0].submission.hasPhoto,true);
 assert.equal(me.team.tasks[0].submission.photo,undefined);
 assert.equal((await query('member1','/api/member/submit','POST',{taskId:1,answer:'Overwrite'})).status,409);
 assert.equal((await query('member1','/api/member/submit','POST',{taskId:2,answer:'Екінші жауап'})).status,200);
 assert.equal((await query('member1','/api/member/submit','POST',{taskId:3,answer:'Үшінші жауап'})).status,200);
 me=(await query('member1','/api/member')).data;
 assert.equal(me.team.activeId,null,'completed all preloaded tasks');
 assert.equal(me.team.tasks.filter(k=>k.submitted).length,3);
 const pic=await fetch(base+`/api/photo/${first.id}/1`,{headers:{cookie:cookie.member1}});assert.equal(pic.status,200);
 const other=await fetch(base+`/api/photo/${first.id}/1`,{headers:{cookie:cookie.member3}});assert.equal(other.status,401,'other team photo blocked');
 assert.equal((await query('member1','/api/admin')).status,401);
 const grade=await query('teacher','/api/admin/grade','POST',{teamId:first.id,taskId:1,score:9,feedback:'Жақсы'});assert.equal(grade.status,200);
 assert.equal((await query('teacher','/api/admin/grade','POST',{teamId:first.id,taskId:2,score:8,feedback:''})).status,200);
 const pub=(await query('member3','/api/public')).data;
 assert.equal(pub.leaderboard.find(x=>x.id===first.id).score,17);
 assert.equal(pub.leaderboard.find(x=>x.id===first.id).maxScore,30);
 const csv=(await query('teacher','/api/admin/csv'));assert.equal(csv.status,200);assert.ok(csv.data.includes('Қазақша 1 №2'));
 const exportJSON=(await query('teacher','/api/admin/export')).data;assert.equal(exportJSON.teacherHash,undefined);assert.equal(exportJSON.teams[0].pin_hash,undefined);
 assert.equal((await query('teacher','/api/admin/close','POST',{})).status,200);
 assert.equal((await query('member3','/api/member/submit','POST',{taskId:1,answer:'Closed'})).status,403);
 assert.equal((await query('teacher','/api/admin/next','POST',{confirm:'NEW ROUND'})).status,200);
 adm=(await query('teacher','/api/admin')).data;assert.equal(adm.round,2);assert.equal(adm.history[0].teams[0].score,17);assert.equal(adm.teams[0].tasks.length,3);assert.equal(adm.teams[0].tasks[0].submission,null);
 assert.equal((await query('member1','/api/member')).status,401);
 assert.ok(fs.existsSync(path.join(dir,'relay-data.json')));
});
test('migrate old single-task schema without losing answers',async t=>{
 const old={schema:2,phase:'quiz_done',round:1,teacherHash:'',teacherEpoch:1,quiz:{completed:true,answers:[],score:10},questions:[],teams:[{id:1,name:'Old team',task_ru:'Old task',task_kk:'Ескі тапсырма',submission:{answer:'Preserved answer',score:7,feedback:''},pin_hash:'abc:abc',pin_cipher:'abc',members:[]}],nextMemberId:1,history:[]};
 const {query}=await setup(t,old);
 assert.equal((await query('teacher','/api/teacher/login','POST',{password:'teacher-test-password'})).status,200);
 const adm=(await query('teacher','/api/admin')).data;
 assert.equal(adm.teams[0].tasks[0].ru,'Old task');assert.equal(adm.teams[0].tasks[0].submission.answer,'Preserved answer');assert.equal(adm.teams[0].tasks[0].submission.score,7);
});
