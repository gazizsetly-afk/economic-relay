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

test('official bilingual test from supplied document has five choices and exact answer key; results persist',async t=>{
 const {query}=await setup(t);
 const official=require('../teacher-test.json');
 const letters='АБВГД';
 assert.equal(official.length,20);
 assert.equal(official.map(q=>letters[q.correct]).join(' '),'Б В Г А Б В Б Б Г В Б В В Б Б В Б В Б В');
 assert.equal(official[0].ru,'Что изучает экономика как наука?');
 assert.equal(official[0].kk,'Экономика ғылымы нені зерттейді?');
 assert.match(official[19].kk,/SMS/);
 for(const q of official){assert.equal(q.options_ru.length,5);assert.equal(q.options_kk.length,5);}
 assert.equal((await query('teacher','/api/teacher/login','POST',{password:'teacher-test-password'})).status,200);
 let adm=(await query('teacher','/api/admin')).data;
 assert.deepEqual(adm.questions,official);
 assert.equal(adm.quiz.completed,false);
 const teams=adm.teams.map(t=>({id:t.id,name:t.name,pin:t.pin,tasks:[{id:1,ru:'Упражнение перед уроком',kk:'Сабақ тапсырмасы'}]}));
 assert.equal((await query('teacher','/api/admin/teams','POST',{teams})).status,200);
 assert.equal((await query('teacher','/api/admin/quiz','POST',{answers:Array(20).fill(5)})).status,400);
 let answers=official.map(q=>q.correct);answers[0]=answers[0]===0?1:0;
 const done=await query('teacher','/api/admin/quiz','POST',{answers});
 assert.equal(done.status,200);assert.equal(done.data.score,19);
 adm=(await query('teacher','/api/admin')).data;
 assert.equal(adm.quiz.score,19);assert.equal(adm.quiz.answers.length,20);
 assert.equal(adm.teams[0].tasks[0].ru,'Упражнение перед уроком');
 assert.equal((await query('teacher','/api/admin/questions/official','POST',{})).status,409);
 assert.equal((await query('teacher','/api/admin/open','POST',{})).status,200);
});

test('teacher may restore the official five-choice test before class without deleting saved team tasks',async t=>{
 const {query}=await setup(t);
 assert.equal((await query('teacher','/api/teacher/login','POST',{password:'teacher-test-password'})).status,200);
 const initial=(await query('teacher','/api/admin')).data;
 const edited=initial.questions.map(q=>({...q,ru:q.ru+' (edited)'}));
 assert.equal((await query('teacher','/api/admin/questions','POST',{questions:edited})).status,200);
 const teams=initial.teams.map(t=>({id:t.id,name:t.name,pin:t.pin,tasks:[{id:1,ru:'Сохранённое задание',kk:'Сақталған тапсырма'}]}));
 assert.equal((await query('teacher','/api/admin/teams','POST',{teams})).status,200);
 const reset=await query('teacher','/api/admin/questions/official','POST',{});
 assert.equal(reset.status,200);
 const refreshed=(await query('teacher','/api/admin')).data;
 assert.deepEqual(refreshed.questions,require('../teacher-test.json'));
 assert.equal(refreshed.teams[0].tasks[0].kk,'Сақталған тапсырма');
});

test('existing unmodified legacy sample quiz is automatically upgraded, preserving PostgreSQL-style state data',async t=>{
 const old=require('./legacy-sample.json');
 const info={schema:3,phase:'setup',round:2,teacherHash:'',teacherEpoch:1,quiz:{completed:false,answers:[],score:null},questions:old,teams:[{id:7,name:'Экономистер',tasks:[{id:1,ru:'Saved old task',kk:'Ескі тапсырма',submission:null}],pin_hash:'somehash',pin_cipher:'encrypted',members:[]}],nextMemberId:1,history:[{round:1,quizScore:18}]};
 const {query}=await setup(t,info);
 assert.equal((await query('teacher','/api/teacher/login','POST',{password:'teacher-test-password'})).status,200);
 const adm=(await query('teacher','/api/admin')).data;
 assert.deepEqual(adm.questions,require('../teacher-test.json'));
 assert.equal(adm.teams[0].tasks[0].ru,'Saved old task');
 assert.equal(adm.round,2);assert.equal(adm.history.length,1);
});

test('legacy completed test remains coherent until the next round, then uses official questions',async t=>{
 const old=require('./legacy-sample.json');
 const info={schema:3,phase:'closed',round:1,teacherHash:'',teacherEpoch:1,quiz:{completed:true,score:12,answers:Array(20).fill(0)},questions:old,teams:[{id:1,name:'X',tasks:[{id:1,ru:'Do not delete',kk:'Жоймаңыз',submission:null}],pin_hash:'somehash',pin_cipher:'encrypted',members:[]}],nextMemberId:1,history:[]};
 const {query}=await setup(t,info);
 assert.equal((await query('teacher','/api/teacher/login','POST',{password:'teacher-test-password'})).status,200);
 let adm=(await query('teacher','/api/admin')).data;assert.equal(adm.questions[0].ru,'Что такое доход?');
 assert.equal((await query('teacher','/api/admin/next','POST',{confirm:'NEW ROUND'})).status,200);
 adm=(await query('teacher','/api/admin')).data;
 assert.deepEqual(adm.questions,require('../teacher-test.json'));
 assert.equal(adm.quiz.completed,false);assert.equal(adm.teams[0].tasks[0].ru,'Do not delete');
 assert.equal(adm.history[0].quizScore,12);
});

test('many teachers can take the open 20-question test without the admin password',async t=>{
 const {query}=await setup(t);
 const start=await query('member1','/api/teacher-test/start','POST',{});
 assert.equal(start.status,200);assert.equal(start.data.questions.length,20);
 assert.ok(start.data.questions.every(q=>q.correct===undefined),'answer key is not sent before submitting');
 assert.equal((await query('member1','/api/teacher-test/submit','POST',{name:'Ай',answers:Array(20).fill(0)})).status,400);
 assert.equal((await query('member1','/api/teacher-test/submit','POST',{name:'Айгүл Серікова',answers:Array(19).fill(0)})).status,400);
 const a=await query('member1','/api/teacher-test/submit','POST',{name:'Айгүл Серікова',answers:Array(20).fill(1)});
 assert.equal(a.status,200);assert.equal(a.data.total,20);assert.equal(a.data.correct.length,20);
 const b=await query('member2','/api/teacher-test/submit','POST',{name:'Иван Петров',answers:a.data.correct});
 assert.equal(b.data.score,20);
 assert.equal((await query('member1','/api/admin')).status,401);
 assert.equal((await query('teacher','/api/teacher/login','POST',{password:'teacher-test-password'})).status,200);
 let adm=(await query('teacher','/api/admin')).data;
 assert.equal(adm.teacherAttempts.length,2);assert.equal(adm.teacherAttempts[0].name,'Иван Петров');assert.equal(adm.teacherAttempts[0].score,20);
 assert.equal(adm.quiz.completed,false,'teachers\' test does not change the lesson phase');
 assert.equal((await query('teacher','/api/admin/teacher-test','POST',{action:'code',code:'4321'})).status,200);
 assert.equal((await query('member1','/api/public')).data.teacherTestCode,true);
 assert.equal((await query('member1','/api/teacher-test/start','POST',{code:'0000'})).status,401);
 assert.equal((await query('member1','/api/teacher-test/start','POST',{code:'4321'})).status,200);
 const csv=await query('teacher','/api/admin/teacher-csv');assert.equal(csv.status,200);
 assert.equal((await query('teacher','/api/admin/teacher-test','POST',{action:'delete',id:adm.teacherAttempts[1].id})).status,200);
 adm=(await query('teacher','/api/admin')).data;assert.equal(adm.teacherAttempts.length,1);
});
