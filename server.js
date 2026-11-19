'use strict';
// Economic Relay v3. Node 22+; local JSON development storage or durable PostgreSQL.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { URL } = require('node:url');

const PORT = Number(process.env.PORT || 3000);
const PROD = process.env.NODE_ENV === 'production';
const SECRET = process.env.SESSION_SECRET || 'development-only-change-this-secret-before-deployment';
const INITIAL_PASSWORD = process.env.TEACHER_PASSWORD || '';
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const DATA_FILE = path.join(DATA_DIR, 'relay-data.json');
const HTML_PATH = fs.existsSync(path.join(__dirname, 'index.html')) ? path.join(__dirname, 'index.html') : path.join(__dirname, 'public', 'index.html');
if (PROD && (SECRET.length < 24 || !INITIAL_PASSWORD)) {
  console.error('Set SESSION_SECRET (24+ characters) and TEACHER_PASSWORD in Render Environment.');
  process.exit(1);
}
if (!INITIAL_PASSWORD) console.warn('TEACHER_PASSWORD not configured: teacher login disabled.');

// Original 20-question, five-choice bilingual teacher test supplied for the lesson.
// Keep answers on the server. Teachers can replace/edit it before they begin.
const defaultQuestions = require('./teacher-test.json');
// The participant tasks and model answers are loaded only on the server.
// Never serve this JSON through public routes or commit real student responses to GitHub.
const officialAssignments = require('./official-team-assignments.json');
const officialById = new Map(officialAssignments.teams.map(t => [t.id,t]));
function officialText(source, locale){
  const v=source[locale];
  return v.title+'\n\n'+v.stages.map(x=>x.heading+'\n'+x.body).join('\n\n');
}
function officialTask(num){
  const source=officialById.get(num);
  if(!source) throw new Error('Unknown official team task');
  return {id:1,ru:officialText(source,'ru'),kk:officialText(source,'kk'),officialId:num,maxScore:50,submission:null};
}
function isUnchangedOfficial(item){
 const ref=officialById.get(Number(item.officialId));
 return ref && item.ru===officialText(ref,'ru') && item.kk===officialText(ref,'kk');
}
function taskMax(t){return t.officialId&&isUnchangedOfficial(t)?50:10;}
function sanitizedAnswerKeys(value){
 if(!value||typeof value!=='object'||Array.isArray(value))err('invalid_answer_key');
 const out={};
 for(let i=1;i<=10;i++){
   const item=value[i];
   if(!item||typeof item!=='object')err('invalid_answer_key');
   out[i]={};
   for(const lang of ['ru','kk']){
     if(!Array.isArray(item[lang])||item[lang].length!==3)err('invalid_answer_key');
     out[i][lang]=item[lang].map(v=>{const t=clean(v,3500);if(!t)err('invalid_answer_key');return t;});
   }
 }
 return out;
}

const OFFICIAL_QUIZ_ID = 'teacher-economics-finance-20-2026-11';
// Only migrate the untouched four-option sample quiz; do not overwrite teachers' edited tests.
const OLD_SAMPLE_FINGERPRINT = '0a8a2edb1aac39219676b91c0c523a8bc371d77f5e39799fdb8e8c5cdcb89d42';
function questionFingerprint(questions) {
  if (!Array.isArray(questions)) return '';
  return crypto.createHash('sha256').update(JSON.stringify(questions.map(q => [q.ru,q.kk,q.options_ru,q.options_kk,q.correct]))).digest('hex');
}
function replaceUntouchedSampleQuiz(s) {
  if (s.phase === 'setup' && !s.quiz.completed && questionFingerprint(s.questions) === OLD_SAMPLE_FINGERPRINT) {
    s.questions = structuredClone(defaultQuestions);
    s.quizSourceId = OFFICIAL_QUIZ_ID;
    return true;
  }
  return false;
}

function hash(text){ const salt=crypto.randomBytes(16).toString('hex');return salt+':'+crypto.scryptSync(String(text),salt,32).toString('hex'); }
function verify(text, encoded){try{const [salt,correct]=encoded.split(':');const a=crypto.scryptSync(String(text),salt,32),b=Buffer.from(correct,'hex');return a.length===b.length&&crypto.timingSafeEqual(a,b);}catch{return false;}}
const AES_KEY=crypto.createHash('sha256').update(SECRET).digest();
function encrypt(text){const iv=crypto.randomBytes(12), cipher=crypto.createCipheriv('aes-256-gcm',AES_KEY,iv); const content=Buffer.concat([cipher.update(String(text),'utf8'),cipher.final()]); return [iv.toString('base64url'),cipher.getAuthTag().toString('base64url'),content.toString('base64url')].join('.');}
function decrypt(s){try{const [a,b,c]=s.split('.'); const dec=crypto.createDecipheriv('aes-256-gcm',AES_KEY,Buffer.from(a,'base64url'));dec.setAuthTag(Buffer.from(b,'base64url'));return Buffer.concat([dec.update(Buffer.from(c,'base64url')),dec.final()]).toString('utf8');}catch{return 'Кодты жаңартыңыз / Смените код';}}
function newCode(){return String(crypto.randomInt(100000,999999));}
function makeDefault(){return {schema:3,phase:'setup',round:1,teacherHash:'',teacherEpoch:1,quiz:{completed:false,answers:[],score:null},questions:structuredClone(defaultQuestions),quizSourceId:OFFICIAL_QUIZ_ID,teams:Array.from({length:7},(_,i)=>{const c=newCode();return {id:i+1,name:`Команда ${i+1}`,tasks:[officialTask(i+1)],pin_hash:hash(c),pin_cipher:encrypt(c),members:[]};}),nextMemberId:1,history:[]};}
// Safely migrate the previously deployed single-task database: keep submitted work and scores.
function upgrade(s){
 if(s.schema>=3&&s.teams.every(t=>Array.isArray(t.tasks)))return s;
 for(const t of s.teams){if(!Array.isArray(t.tasks)){
   t.tasks=[{id:1,ru:String(t.task_ru||''),kk:String(t.task_kk||''),submission:t.submission||null}];
   delete t.task_ru;delete t.task_kk;delete t.submission;
 }}
 s.schema=3;return s;
}
function publicTask(t){
 const official=isUnchangedOfficial(t)?officialById.get(t.officialId):null;
 return {id:t.id,ru:t.ru,kk:t.kk,officialId:official?t.officialId:null,
   officialContent:official?{ru:{title:official.ru.title,stages:official.ru.stages},kk:{title:official.kk.title,stages:official.kk.stages}}:null,
   maxScore:taskMax(t),submitted:!!t.submission,
   submission:t.submission?{...t.submission,photo:undefined,hasPhoto:!!t.submission.photo}:null};
}
function taskTotal(t){return t.tasks.reduce((sum,k)=>sum+(Number.isInteger(k.submission?.score)?k.submission.score:0),0);}
function taskGraded(t){return t.tasks.filter(k=>Number.isInteger(k.submission?.score)).length;}

const clone=v=>structuredClone(v);
let memory;
let mutex=Promise.resolve();
let pool=null;
async function initStore(){
 if(process.env.DATABASE_URL){
   const {Pool}=require('pg');pool=new Pool({connectionString:process.env.DATABASE_URL,max:5,connectionTimeoutMillis:12000});
   await pool.query('CREATE TABLE IF NOT EXISTS economic_relay_state (id INTEGER PRIMARY KEY CHECK(id=1), payload JSONB NOT NULL)');
   await pool.query('INSERT INTO economic_relay_state(id,payload) VALUES(1,$1) ON CONFLICT(id) DO NOTHING',[JSON.stringify(makeDefault())]);
   const old=(await pool.query('SELECT payload FROM economic_relay_state WHERE id=1')).rows[0].payload; const migrated=old.schema<3; if(migrated)upgrade(old); const officialUpdated=replaceUntouchedSampleQuiz(old); if(migrated||officialUpdated){await pool.query('UPDATE economic_relay_state SET payload=$1 WHERE id=1',[JSON.stringify(old)]);console.log('Updated stored quiz/schema without deleting lesson data.');}
   console.log('Persistent PostgreSQL storage connected.');
 }else{
   fs.mkdirSync(DATA_DIR,{recursive:true});
   memory=fs.existsSync(DATA_FILE)?JSON.parse(fs.readFileSync(DATA_FILE,'utf8')):makeDefault();
   if(memory.schema<3)upgrade(memory);
   replaceUntouchedSampleQuiz(memory);
   writeLocal(memory);
   console.warn('Local JSON storage active. Render Free restarts DELETE local data. Add DATABASE_URL for real classes.');
 }
}
function writeLocal(obj){const temp=DATA_FILE+'.new';fs.writeFileSync(temp,JSON.stringify(obj),'utf8');fs.renameSync(temp,DATA_FILE);}
async function readState(){if(pool){const row=(await pool.query('SELECT payload FROM economic_relay_state WHERE id=1')).rows[0];return row.payload;}return clone(memory);}
async function changeState(fn){if(pool){const c=await pool.connect();try{await c.query('BEGIN');const r=await c.query('SELECT payload FROM economic_relay_state WHERE id=1 FOR UPDATE');const s=r.rows[0].payload;const out=await fn(s);await c.query('UPDATE economic_relay_state SET payload=$1 WHERE id=1',[JSON.stringify(s)]);await c.query('COMMIT');return out;}catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}finally{c.release();}}
 const run=mutex.then(async()=>{const s=clone(memory);const result=await fn(s);writeLocal(s);memory=s;return result;});mutex=run.catch(()=>{});return run;}
function err(code,status=400){const e=new Error(code);e.status=status;throw e;}
const cookieName='economic_relay_session';
function signToken(payload){const value=Buffer.from(JSON.stringify({...payload,exp:Date.now()+1000*60*60*24})).toString('base64url');const mac=crypto.createHmac('sha256',SECRET).update(value).digest('base64url');return `${value}.${mac}`;}
function readToken(req){try{const cookies=String(req.headers.cookie||'').split(';').map(s=>s.trim());const v=cookies.find(s=>s.startsWith(cookieName+'='));if(!v)return null;const token=v.slice(cookieName.length+1);const [body,mac]=token.split('.');const expected=crypto.createHmac('sha256',SECRET).update(body).digest('base64url');const a=Buffer.from(mac||''),b=Buffer.from(expected);if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return null;const obj=JSON.parse(Buffer.from(body,'base64url').toString());return obj.exp>Date.now()?obj:null;}catch{return null;}}
function setAuth(res,body){res.setHeader('Set-Cookie',`${cookieName}=${signToken(body)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400${PROD?'; Secure':''}`);}
function clearAuth(res){res.setHeader('Set-Cookie',`${cookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${PROD?'; Secure':''}`);}
function permission(s,req,role){const t=readToken(req);if(!t||t.role!==role)err('not_authorized',401);if(role==='teacher'){if(t.epoch!==s.teacherEpoch)err('session_expired',401);return t;}if(t.round!==s.round)err('session_expired',401);const team=s.teams.find(x=>x.id===t.teamId);if(!team||!team.members.some(m=>m.id===t.memberId))err('session_expired',401);return t;}
function teacher(s,req){return permission(s,req,'teacher');}
function member(s,req){return permission(s,req,'member');}
function send(res,status,data,headers={}){const bytes=Buffer.from(JSON.stringify(data));res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(bytes);}
function text(res,status,body,type){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(body);}
async function readBody(req,max=4500000){let size=0, chunks=[];for await(const c of req){size+=c.length;if(size>max)err('request_too_large',413);chunks.push(c);}let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');}catch{err('invalid_json');}if(!body||typeof body!=='object'||Array.isArray(body))err('invalid_json');return body;}
const clean=(v,max=6000)=>String(v??'').trim().slice(0,max);
function exposedTeam(t){return {id:t.id,name:t.name,tasks:t.tasks.map(publicTask),pin:decrypt(t.pin_cipher),members:t.members.map(m=>({...m})),score:taskTotal(t),graded:taskGraded(t),maxScore:t.tasks.reduce((n,k)=>n+taskMax(k),0)};}
function leaderboard(s){return s.teams.map(t=>({id:t.id,name:t.name,members:t.members.length,submitted:t.tasks.some(k=>!!k.submission),completed:t.tasks.filter(k=>!!k.submission).length,taskCount:t.tasks.length,graded:taskGraded(t),maxScore:t.tasks.reduce((n,k)=>n+taskMax(k),0),score:taskGraded(t)?taskTotal(t):null})).sort((a,b)=>(b.score??-1)-(a.score??-1)||a.name.localeCompare(b.name));}
function publicInfo(s,req){const tok=readToken(req);const admin=!!tok&&tok.role==='teacher'&&tok.epoch===s.teacherEpoch;const team=s.teams.find(t=>t.id===tok?.teamId);const participant=!!tok&&tok.role==='member'&&tok.round===s.round&&team?.members.some(m=>m.id===tok.memberId);return {phase:s.phase,round:s.round,teacher:admin,member:participant,quizDone:s.quiz.completed,teacherTestCode:!!s.teacherTestCode,teams:s.phase==='open'||s.phase==='closed'||admin?s.teams.map(({id,name})=>({id,name})):[],leaderboard:s.phase==='open'||s.phase==='closed'||admin?leaderboard(s):[]};}
function checkPhoto(data){if(!data)return null;if(typeof data!=='string'||data.length>3900000)err('image_too_large',413);const match=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(data);if(!match)err('invalid_image');const bytes=Buffer.from(match[2],'base64');if(bytes.length>2700000||bytes.length<12)err('image_too_large',413);const type=match[1],hex=bytes.subarray(0,12).toString('hex');if(!(type==='image/png'&&hex.startsWith('89504e470d0a1a0a')||type==='image/jpeg'&&hex.startsWith('ffd8')||type==='image/webp'&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'))err('invalid_image');return {type,data:bytes.toString('base64')};}
function validateQuestions(questions){if(!Array.isArray(questions)||questions.length!==20)err('need_20_questions');return questions.map((q,i)=>{const ru=clean(q.ru,450),kk=clean(q.kk,450),r=q.options_ru,k=q.options_kk,correct=Number(q.correct);if(!ru||!kk||!Array.isArray(r)||!Array.isArray(k)||r.length<4||r.length>5||k.length!==r.length||r.some(x=>!clean(x,350))||k.some(x=>!clean(x,350))||!Number.isInteger(correct)||correct<0||correct>=r.length)err('question_incomplete');return {id:i+1,ru,kk,options_ru:r.map(x=>clean(x,350)),options_kk:k.map(x=>clean(x,350)),correct};});}
const rate=new Map();function limit(req,key,max=12){const ip=String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'unknown').split(',')[0].trim();const k=ip+':'+key;const now=Date.now();const v=rate.get(k)||[];const recent=v.filter(time=>time>now-600000);if(recent.length>=max)err('try_later',429);recent.push(now);rate.set(k,recent);if(rate.size>5000){for(const [id,v] of rate)if(v.every(t=>t<now-600000))rate.delete(id);}}
function quizLevel(score){return score>=18?'high':score>=14?'good':score>=10?'basic':'repeat';}
function publicQuestions(s){return s.questions.map(q=>({id:q.id,ru:q.ru,kk:q.kk,options_ru:q.options_ru,options_kk:q.options_kk}));}
function checkTestCode(s,code){if(s.teacherTestCode&&!safeSame(clean(code,60),s.teacherTestCode))err('invalid_test_code',401);}
function csvCell(v){let s=String(v??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}

async function handle(req,res){
 const url=new URL(req.url||'/', 'http://localhost');const p=url.pathname;const method=req.method;
 if(method==='GET'&&(p==='/'||p==='/index.html'))return text(res,200,fs.readFileSync(HTML_PATH),'text/html; charset=utf-8');
 if(method==='GET'&&p==='/styles.css')return text(res,200,fs.readFileSync(path.join(__dirname,'styles.css')),'text/css; charset=utf-8');
 if(method==='GET'&&p==='/app.js')return text(res,200,fs.readFileSync(path.join(__dirname,'app.js')),'text/javascript; charset=utf-8');
 const pic=/^\/images\/(campus-[12]\.jpg)$/.exec(p);
 if(method==='GET'&&pic){res.writeHead(200,{'Content-Type':'image/jpeg','Cache-Control':'public,max-age=86400','X-Content-Type-Options':'nosniff'});return res.end(fs.readFileSync(path.join(__dirname,'images',pic[1])));}
 if(method==='GET'&&p==='/health')return send(res,200,{ok:true,storage:pool?'postgres':'local',ready:true});
 if(method==='GET'&&p==='/api/public')return send(res,200,publicInfo(await readState(),req));
 if(method==='GET'&&p==='/api/qr'){
   const qr=require('qrcode');const origin=clean(process.env.PUBLIC_URL||`${(PROD?'https':(req.headers['x-forwarded-proto']||'http'))}://${req.headers.host||'localhost:'+PORT}`,500);const png=await qr.toBuffer(origin,{type:'png',width:420,margin:2,color:{dark:'#25205aff',light:'#ffffffff'}});res.writeHead(200,{'Content-Type':'image/png','Cache-Control':'public,max-age=60'});return res.end(png);
 }
 if(method==='POST'&&p==='/api/logout'){clearAuth(res);return send(res,200,{ok:true});}
 // Open 20-question test for any number of teachers: each enters a name, answers, sees the result.
 if(method==='POST'&&p==='/api/teacher-test/start'){
   limit(req,'ttest-start',120);const b=await readBody(req,10000);const s=await readState();checkTestCode(s,b.code);
   return send(res,200,{questions:publicQuestions(s)});
 }
 if(method==='POST'&&p==='/api/teacher-test/submit'){
   limit(req,'ttest-submit',60);const b=await readBody(req,20000),name=clean(b.name,120);if(name.length<3)err('name_required');
   return send(res,200,await changeState(s=>{checkTestCode(s,b.code);
     if(!Array.isArray(b.answers)||b.answers.length!==s.questions.length||b.answers.some((a,i)=>!Number.isInteger(a)||a<0||a>=s.questions[i].options_ru.length))err('answer_all');
     const correct=s.questions.map(q=>q.correct),score=b.answers.filter((a,i)=>a===correct[i]).length;
     s.teacherAttempts=Array.isArray(s.teacherAttempts)?s.teacherAttempts:[];
     const id=(s.nextAttemptId||1);s.nextAttemptId=id+1;
     s.teacherAttempts.unshift({id,name,score,total:correct.length,level:quizLevel(score),answers:b.answers,finishedAt:new Date().toISOString()});
     s.teacherAttempts=s.teacherAttempts.slice(0,3000);
     return {ok:true,score,total:correct.length,correct};
   }));
 }
 if(method==='POST'&&p==='/api/admin/teacher-test'){
   const b=await readBody(req,10000);return send(res,200,await changeState(s=>{teacher(s,req);
     if(b.action==='code'){const code=clean(b.code,60);if(code&&code.length<4)err('code_too_short');s.teacherTestCode=code;}
     else if(b.action==='delete'){const id=Number(b.id);s.teacherAttempts=(s.teacherAttempts||[]).filter(a=>a.id!==id);}
     else if(b.action==='clear'){if(b.confirm!=='CLEAR')err('confirm_required');s.teacherAttempts=[];}
     else err('invalid_action');return {ok:true};
   }));
 }
 if(method==='GET'&&p==='/api/admin/teacher-csv'){
   const s=await readState();teacher(s,req);const letters=['А','Б','В','Г','Д'];
   const rows=[['ФИО / Аты-жөні','Балл','Из / Барлығы','Уровень / Деңгей','Дата',...s.questions.map((q,i)=>'В'+(i+1))],...(s.teacherAttempts||[]).map(a=>[a.name,a.score,a.total,a.level,a.finishedAt,...a.answers.map(x=>letters[x]||'')])];
   const body='﻿'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n');res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="teacher-test-results.csv"','Cache-Control':'no-store'});return res.end(body);
 }
 if(method==='POST'&&p==='/api/teacher/login'){
   limit(req,'teacher');const b=await readBody(req);const s=await readState();const pass=clean(b.password,300);if(!pass||!(s.teacherHash?verify(pass,s.teacherHash):INITIAL_PASSWORD&&safeSame(pass,INITIAL_PASSWORD)))err('incorrect_password',401);setAuth(res,{role:'teacher',epoch:s.teacherEpoch});return send(res,200,{ok:true});
 }
 if(method==='GET'&&p==='/api/admin'){
   const s=await readState();teacher(s,req);return send(res,200,{phase:s.phase,round:s.round,quiz:s.quiz,questions:s.questions,teams:s.teams.map(exposedTeam),history:s.history,answerKeys:s.officialAnswerKeys||{},officialGuide:officialAssignments.instructions,teacherAttempts:s.teacherAttempts||[],teacherTestCode:s.teacherTestCode||'',storage:pool?'postgres':'local'});
 }
 if(method==='POST'&&p==='/api/admin/teams'){
   const b=await readBody(req);return send(res,200,await changeState(s=>{teacher(s,req);if(s.phase!=='setup')err('edit_before_quiz',409);
     if(!Array.isArray(b.teams)||!b.teams.length||b.teams.length>20)err('teams_count');const names=new Set();let next=Math.max(0,...s.teams.map(x=>x.id))+1;
     const arr=b.teams.map(t=>{
       const name=clean(t.name,60),pin=clean(t.pin,32);if(!name||pin.length<4)err('team_fields');
       if(names.has(name.toLowerCase()))err('team_duplicate');names.add(name.toLowerCase());
       if(!Array.isArray(t.tasks)||!t.tasks.length||t.tasks.length>30)err('tasks_count');
       const ids=new Set();const tasks=t.tasks.map((item,i)=>{
         const ru=clean(item.ru,3000),kk=clean(item.kk,3000),id=Number(item.id)||i+1;
         if(!ru&&!kk)err('task_empty');if(ids.has(id)||!Number.isInteger(id)||id<1)err('duplicate_task_id');ids.add(id);
         return {id,ru,kk,...(isUnchangedOfficial({ru,kk,officialId:Number(item.officialId)})?{officialId:Number(item.officialId),maxScore:50}:{}),submission:null};
       });
       const prev=s.teams.find(x=>x.id===Number(t.id));return {id:prev?.id??next++,name,tasks,pin_hash:prev&&verify(pin,prev.pin_hash)?prev.pin_hash:hash(pin),pin_cipher:prev&&verify(pin,prev.pin_hash)?prev.pin_cipher:encrypt(pin),members:[]};
     });s.teams=arr;return {ok:true};
   }));
 }
 if(method==='POST'&&p==='/api/admin/tasks/official'){
   const b=await readBody(req),count=Number(b.count);
   if(![7,10].includes(count))err('official_team_count');
   return send(res,200,await changeState(s=>{
     teacher(s,req);
     if(s.phase!=='setup'||s.quiz.completed)err('edit_before_quiz',409);
     if(s.teams.some(t=>t.members.length||t.tasks.some(k=>k.submission)))err('existing_responses',409);
     // Explicit action only. Never replace existing team work just because the app redeploys.
     const old=s.teams.slice();let next=Math.max(0,...old.map(t=>t.id))+1;
     s.teams=Array.from({length:count},(_,i)=>{
       const prev=old[i],pin=prev?decrypt(prev.pin_cipher):newCode();
       return {id:prev?.id??next++,name:prev?.name||`Команда ${i+1}`,tasks:[officialTask(i+1)],
         pin_hash:prev?.pin_hash||hash(pin),pin_cipher:prev?.pin_cipher||encrypt(pin),members:[]};
     });
     return {ok:true,teamCount:count};
   }));
 }
 if(method==='POST'&&p==='/api/admin/answers/import'){
   const b=await readBody(req,250000);
   return send(res,200,await changeState(s=>{
     teacher(s,req);s.officialAnswerKeys=sanitizedAnswerKeys(b.answerKeys);
     return {ok:true,count:Object.keys(s.officialAnswerKeys).length};
   }));
 }
 if(method==='POST'&&p==='/api/admin/questions'){
   const b=await readBody(req);return send(res,200,await changeState(s=>{teacher(s,req);if(s.phase!=='setup'||s.quiz.completed)err('edit_before_quiz',409);s.questions=validateQuestions(b.questions);s.quizSourceId='custom';return {ok:true};}));
 }
 if(method==='POST'&&p==='/api/admin/questions/official'){
   return send(res,200,await changeState(s=>{teacher(s,req);if(s.phase!=='setup'||s.quiz.completed)err('edit_before_quiz',409);s.questions=structuredClone(defaultQuestions);s.quizSourceId=OFFICIAL_QUIZ_ID;return {ok:true};}));
 }
 if(method==='POST'&&p==='/api/admin/quiz'){
   const b=await readBody(req);return send(res,200,await changeState(s=>{teacher(s,req);if(s.quiz.completed||s.phase!=='setup')err('quiz_already_done',409);if(!s.teams.length||s.teams.some(t=>!t.tasks.length||t.tasks.some(k=>!k.ru&&!k.kk)))err('tasks_incomplete',409);if(!Array.isArray(b.answers)||b.answers.length!==20||b.answers.some((a,i)=>!Number.isInteger(a)||a<0||a>=s.questions[i].options_ru.length))err('answer_all');const correct=s.questions.map(q=>q.correct),score=b.answers.filter((a,i)=>a===correct[i]).length;s.quiz={completed:true,answers:b.answers,score,finishedAt:new Date().toISOString()};s.phase='quiz_done';return {ok:true,score,correct};}));
 }
 if(method==='POST'&&p==='/api/admin/open'){
   return send(res,200,await changeState(s=>{teacher(s,req);if(!s.quiz.completed)err('quiz_first',409);if(s.teams.some(t=>!t.tasks.length||t.tasks.some(k=>!k.ru&&!k.kk))||!s.teams.length)err('tasks_incomplete',409);if(!['quiz_done','closed'].includes(s.phase))err('invalid_phase',409);s.phase='open';return {ok:true};}));
 }
 if(method==='POST'&&p==='/api/admin/close')return send(res,200,await changeState(s=>{teacher(s,req);if(s.phase!=='open')err('invalid_phase',409);s.phase='closed';return {ok:true};}));
 if(method==='POST'&&p==='/api/admin/next'){
   const b=await readBody(req);if(b.confirm!=='NEW ROUND')err('confirm_required');
   return send(res,200,await changeState(s=>{teacher(s,req);
     s.history.unshift({round:s.round,finishedAt:new Date().toISOString(),quizScore:s.quiz.score,teams:s.teams.map(t=>({name:t.name,members:t.members.map(m=>m.name),score:taskTotal(t),maxScore:t.tasks.reduce((n,k)=>n+taskMax(k),0),tasks:t.tasks.map(k=>({ru:k.ru,kk:k.kk,answer:k.submission?.answer||'',score:k.submission?.score??null,rubric:k.submission?.rubric||null,feedback:k.submission?.feedback||''}))}))});
     s.history=s.history.slice(0,30);s.round++;s.phase='setup';s.quiz={completed:false,answers:[],score:null};replaceUntouchedSampleQuiz(s);
     for(const t of s.teams){t.members=[];t.tasks.forEach(k=>k.submission=null);}return {ok:true};
   }));
 }
 if(method==='POST'&&p==='/api/admin/password'){
   const b=await readBody(req);const old=clean(b.old,300),newPass=clean(b.next,300);if(newPass.length<10)err('password_too_short');const result=await changeState(s=>{teacher(s,req);if(!(s.teacherHash?verify(old,s.teacherHash):safeSame(old,INITIAL_PASSWORD)))err('incorrect_password',401);s.teacherHash=hash(newPass);s.teacherEpoch++;return {ok:true,epoch:s.teacherEpoch};});setAuth(res,{role:'teacher',epoch:result.epoch});return send(res,200,{ok:true});
 }
 if(method==='POST'&&p==='/api/admin/grade'){
   const b=await readBody(req),id=Number(b.teamId),taskId=Number(b.taskId);
   return send(res,200,await changeState(s=>{teacher(s,req);
     const t=s.teams.find(x=>x.id===id),k=t?.tasks.find(x=>x.id===taskId);
     if(!k?.submission)err('no_submission',404);
     let score;
     if(taskMax(k)===50){
       const rubric=b.rubric;
       if(!rubric||typeof rubric!=='object'||Array.isArray(rubric))err('rubric_required');
       const caps={analysis:10,calculation:15,decision:15,defense:10};
       const vals={};
       for(const [key,max] of Object.entries(caps)){
         const v=Number(rubric[key]);
         if(rubric[key]==null||rubric[key]===''||!Number.isInteger(v)||v<0||v>max)err('rubric_range');
         vals[key]=v;
       }
       score=Object.values(vals).reduce((n,v)=>n+v,0);
       k.submission.rubric=vals;
     }else{
       score=Number(b.score);
       if(!Number.isInteger(score)||score<0||score>10)err('score_range');
       delete k.submission.rubric;
     }
     k.submission.score=score;
     k.submission.feedback=clean(b.feedback,1500);
     k.submission.gradedAt=new Date().toISOString();return {ok:true,score};
   }));
 }
 if(method==='POST'&&p==='/api/admin/member'){
   const b=await readBody(req),id=Number(b.teamId),memberId=Number(b.memberId);return send(res,200,await changeState(s=>{teacher(s,req);const t=s.teams.find(x=>x.id===id),m=t?.members.find(x=>x.id===memberId);if(!m)err('member_not_found',404);if(b.action==='captain'){t.members.forEach(x=>x.isCaptain=x.id===memberId);}else if(b.action==='remove'){t.members=t.members.filter(x=>x.id!==memberId);if(!t.members.some(x=>x.isCaptain)&&t.members.length)t.members[0].isCaptain=true;}else err('invalid_action');return {ok:true};}));
 }
 if(method==='GET'&&p==='/api/admin/export'){
   const s=await readState();teacher(s,req);const sanitized={...s,teams:s.teams.map(t=>({...t,pin_hash:undefined,pin_cipher:undefined})) ,teacherHash:undefined};const body=JSON.stringify(sanitized,null,2);res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Content-Disposition':`attachment; filename="economic-relay-round-${s.round}.json"`,'Cache-Control':'no-store'});return res.end(body);
 }
 if(method==='GET'&&p==='/api/admin/csv'){
   const s=await readState();teacher(s,req);
   const rows=[['Команда','Участники','Задание №','Задание RU','Тапсырма KZ','Ответ','Балл','Максимум','Анализ (10)','Расчёт (15)','Решение (15)','Защита (10)','Комментарий'],
     ...s.teams.flatMap(t=>t.tasks.map((k,i)=>[t.name,t.members.map(m=>m.name).join('; '),i+1,k.ru,k.kk,k.submission?.answer||'',k.submission?.score??'',taskMax(k),k.submission?.rubric?.analysis??'',k.submission?.rubric?.calculation??'',k.submission?.rubric?.decision??'',k.submission?.rubric?.defense??'',k.submission?.feedback||'']))];
   const body='\ufeff'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n');res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="economic-relay-results.csv"'});return res.end(body);
 }
 if(method==='POST'&&p==='/api/member/register'){
   limit(req,'join');const b=await readBody(req),name=clean(b.name,90),id=Number(b.teamId),pin=clean(b.pin,80);if(name.length<2||!Number.isInteger(id))err('name_required');const out=await changeState(s=>{if(s.phase!=='open')err('not_open',403);const t=s.teams.find(x=>x.id===id);if(!t||!verify(pin,t.pin_hash))err('invalid_team_code',401);if(t.members.some(m=>m.name.toLocaleLowerCase()===name.toLocaleLowerCase()))err('name_taken',409);const m={id:s.nextMemberId++,name,isCaptain:t.members.length===0,joinedAt:new Date().toISOString()};t.members.push(m);return {id:m.id,teamId:t.id,round:s.round,captain:m.isCaptain};});setAuth(res,{role:'member',memberId:out.id,teamId:out.teamId,round:out.round});return send(res,200,{ok:true,captain:out.captain});
 }
 if(method==='GET'&&p==='/api/member'){
   const s=await readState(),tok=member(s,req),t=s.teams.find(x=>x.id===tok.teamId),m=t.members.find(x=>x.id===tok.memberId);
   const active=t.tasks.find(k=>!k.submission)||null;
   // Do not disclose later assignments before the captain submits the current one.
   const taskViews=t.tasks.map((k,i)=>{const item=publicTask(k),isFuture=!k.submission&&k.id!==active?.id;return isFuture?{...item,ru:'',kk:'',officialContent:null}:item;});
   return send(res,200,{phase:s.phase,round:s.round,team:{id:t.id,name:t.name,taskCount:t.tasks.length,tasks:taskViews,activeId:active?.id??null,score:taskTotal(t),maxScore:t.tasks.reduce((n,k)=>n+taskMax(k),0)},me:m,members:t.members});
 }
 if(method==='POST'&&p==='/api/member/submit'){
   const b=await readBody(req),answer=clean(b.answer,12000),photo=typeof b.photo==='string'&&b.photo?checkPhoto(b.photo):null,taskId=Number(b.taskId);
   return send(res,200,await changeState(s=>{const tok=member(s,req);if(s.phase!=='open')err('not_open',403);
     const t=s.teams.find(x=>x.id===tok.teamId),m=t.members.find(x=>x.id===tok.memberId);
     if(!m?.isCaptain)err('captain_only',403);
     const next=t.tasks.find(k=>!k.submission);if(!next||next.id!==taskId)err('task_not_active',409);
     if(!answer&&!photo)err('empty_answer');next.submission={answer,photo,score:null,feedback:'',updatedAt:new Date().toISOString()};
     return {ok:true,nextTaskId:t.tasks.find(k=>!k.submission)?.id??null};
   }));
 }
 const image=/^\/api\/photo\/(\d+)\/(\d+)$/.exec(p);
 if(method==='GET'&&image){
   const s=await readState(),t=s.teams.find(x=>x.id===Number(image[1])),k=t?.tasks.find(x=>x.id===Number(image[2]));
   if(!k?.submission?.photo)err('image_not_found',404);
   const auth=readToken(req);const isTeacher=auth?.role==='teacher'&&auth.epoch===s.teacherEpoch;
   const isTeam=auth?.role==='member'&&auth.round===s.round&&auth.teamId===t.id&&t.members.some(m=>m.id===auth.memberId);
   if(!isTeacher&&!isTeam)err('not_authorized',401);
   const data=Buffer.from(k.submission.photo.data,'base64');res.writeHead(200,{'Content-Type':k.submission.photo.type,'Content-Length':data.length,'Content-Security-Policy':"default-src 'none'; sandbox",'Cache-Control':'private,no-store','X-Content-Type-Options':'nosniff'});return res.end(data);
 }
 return err('not_found',404);
}
function safeSame(a,b){const x=crypto.createHash('sha256').update(a).digest(),y=crypto.createHash('sha256').update(b).digest();return crypto.timingSafeEqual(x,y);}
function start(){const server=http.createServer(async(req,res)=>{try{await handle(req,res);}catch(e){const status=e.status||500;if(status===500)console.error('Server error:',e);if(!res.headersSent)send(res,status,{error:status===500?'server_error':e.message});else res.end();}});server.listen(PORT,'0.0.0.0',()=>console.log(`Economic Relay v3 ready on http://localhost:${PORT}`));}
initStore().then(start).catch(e=>{console.error('Database initialization failed:',e);process.exit(1);});
