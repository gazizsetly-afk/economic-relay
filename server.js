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

const defaultQuestions = [
  ['Что такое доход?', 'Табыс деген не?', 'Деньги, которые получает человек', 'Любые покупки', 'Штраф', 'Реклама', 'Адам алатын ақша', 'Кез келген сатып алу', 'Айыппұл', 'Жарнама', 0],
  ['Что такое расход?', 'Шығыс деген не?', 'Получение зарплаты', 'Трата денег', 'Получение подарка', 'Сбережение', 'Жалақы алу', 'Ақша жұмсау', 'Сыйлық алу', 'Жинақтау', 1],
  ['Что такое сбережения?', 'Жинақ ақша деген не?', 'Кредит', 'Отложенные деньги', 'Покупка товара', 'Налог', 'Несие', 'Жиналған ақша', 'Тауар сатып алу', 'Салық', 1],
  ['Что помогает управлять личными деньгами?', 'Жеке қаржыны не арқылы басқаруға болады?', 'Планирование бюджета', 'Реклама', 'Импульсивные покупки', 'Лотерея', 'Бюджетті жоспарлау', 'Жарнама', 'Ойланбай сатып алу', 'Лотерея', 0],
  ['Кто такой покупатель?', 'Сатып алушы кім?', 'Тот, кто покупает товар', 'Тот, кто устанавливает налоги', 'Только производитель', 'Только кассир', 'Тауар сатып алатын адам', 'Салық белгілейтін адам', 'Тек өндіруші', 'Тек кассир', 0],
  ['Что называют товаром?', 'Тауар деген не?', 'Заработную плату', 'Предмет, который продают', 'Школьный урок', 'Банковский долг', 'Жалақыны', 'Сатылатын затты', 'Мектеп сабағын', 'Банк қарызын', 1],
  ['Что относится к услугам?', 'Қызмет көрсетуге қайсысы жатады?', 'Хлеб', 'Рюкзак', 'Стрижка', 'Книга', 'Нан', 'Сөмке', 'Шаш қию', 'Кітап', 2],
  ['Что такое спрос?', 'Сұраныс деген не?', 'Желание и возможность приобрести товар', 'Количество складов', 'Расходы магазина', 'Реклама товара', 'Тауарды алуға тілек пен мүмкіндік', 'Қойма саны', 'Дүкен шығыны', 'Тауар жарнамасы', 0],
  ['Что означает предложение на рынке?', 'Нарықтағы ұсыныс деген не?', 'Количество покупателей', 'Товары, предлагаемые к продаже', 'Размер кредита', 'Личные сбережения', 'Сатып алушылар саны', 'Сатуға ұсынылған тауарлар', 'Несие мөлшері', 'Жеке жинақ', 1],
  ['При росте спроса и неизменном предложении цена обычно…', 'Сұраныс өсіп, ұсыныс өзгермесе баға әдетте…', 'Снижается', 'Не меняется никогда', 'Растёт', 'Становится нулевой', 'Төмендейді', 'Ешқашан өзгермейді', 'Өседі', 'Нөлге тең болады', 2],
  ['Что такое кредит?', 'Несие деген не?', 'Подаренные деньги', 'Заём с обязательством вернуть', 'Премия', 'Скидка', 'Сыйға берілген ақша', 'Қайтарылуы тиіс қарыз ақша', 'Сыйақы', 'Жеңілдік', 1],
  ['Что такое банковский вклад?', 'Банк салымы деген не?', 'Размещённые в банке деньги', 'Штраф', 'Покупка билета', 'Цена товара', 'Банкке салынған ақша', 'Айыппұл', 'Билет сатып алу', 'Тауар бағасы', 0],
  ['Скидка 20% означает, что цена…', '20% жеңілдік бағаның… білдіреді', 'Увеличилась на 20%', 'Уменьшилась на 20%', 'Стала равной нулю', 'Удвоена', '20% өскенін', '20% төмендегенін', 'Нөл болғанын', 'Екі есе өскенін', 1],
  ['Товар стоил 1000 ₸. Скидка 10%. Сколько платить?', 'Тауар 1000 ₸, жеңілдік 10%. Қанша төлейміз?', '990 ₸', '800 ₸', '900 ₸', '1100 ₸', '990 ₸', '800 ₸', '900 ₸', '1100 ₸', 2],
  ['Что такое прибыль?', 'Пайда деген не?', 'Выручка минус затраты', 'Сумма всех расходов', 'Заемные деньги', 'Любая скидка', 'Түсімнен шығындарды шегеру', 'Барлық шығындар қосындысы', 'Қарыз ақша', 'Кез келген жеңілдік', 0],
  ['Что такое конкуренция?', 'Бәсекелестік деген не?', 'Соперничество продавцов за покупателей', 'Хранение денег', 'Только государственная помощь', 'Налог', 'Сатушылардың сатып алушы үшін жарысы', 'Ақша сақтау', 'Тек мемлекеттік көмек', 'Салық', 0],
  ['Какая трата является необходимой?', 'Қай шығын міндетті болып саналады?', 'Третья подписка на игру', 'Проезд до учёбы', 'Случайный сувенир', 'Дорогая игрушка', 'Үшінші ойын жазылымы', 'Оқуға бару жолақысы', 'Кездейсоқ кәдесый', 'Қымбат ойыншық', 1],
  ['Зачем сравнивать цены разных магазинов?', 'Неге дүкендер бағасын салыстырады?', 'Чтобы выбрать выгодное предложение', 'Чтобы больше задолжать', 'Чтобы не планировать', 'Чтобы платить дороже', 'Тиімді ұсынысты таңдау үшін', 'Көбірек қарыз алу үшін', 'Жоспарламау үшін', 'Қымбат төлеу үшін', 0],
  ['Что такое инфляция?', 'Инфляция деген не?', 'Рост общего уровня цен', 'Уменьшение числа студентов', 'Одна распродажа', 'Рост количества магазинов', 'Бағалардың жалпы деңгейінің өсуі', 'Студенттер санының азаюы', 'Бір реттік акция', 'Дүкен санының өсуі', 0],
  ['Как разумно распределить недельные деньги?', 'Апталық ақшаны қалай дұрыс бөлу керек?', 'Сначала потратить на развлечения', 'Отложить на важное и резерв', 'Потратить всё за два дня', 'Не считать расходы', 'Алдымен ойын-сауыққа жұмсау', 'Маңызды қажеттіліктер мен қорға бөлу', 'Екі күнде бәрін жұмсау', 'Шығындарды есептемеу', 1]
].map((q,i)=>({id:i+1,ru:q[0],kk:q[1],options_ru:q.slice(2,6),options_kk:q.slice(6,10),correct:q[10]}));

function hash(text){ const salt=crypto.randomBytes(16).toString('hex');return salt+':'+crypto.scryptSync(String(text),salt,32).toString('hex'); }
function verify(text, encoded){try{const [salt,correct]=encoded.split(':');const a=crypto.scryptSync(String(text),salt,32),b=Buffer.from(correct,'hex');return a.length===b.length&&crypto.timingSafeEqual(a,b);}catch{return false;}}
const AES_KEY=crypto.createHash('sha256').update(SECRET).digest();
function encrypt(text){const iv=crypto.randomBytes(12), cipher=crypto.createCipheriv('aes-256-gcm',AES_KEY,iv); const content=Buffer.concat([cipher.update(String(text),'utf8'),cipher.final()]); return [iv.toString('base64url'),cipher.getAuthTag().toString('base64url'),content.toString('base64url')].join('.');}
function decrypt(s){try{const [a,b,c]=s.split('.'); const dec=crypto.createDecipheriv('aes-256-gcm',AES_KEY,Buffer.from(a,'base64url'));dec.setAuthTag(Buffer.from(b,'base64url'));return Buffer.concat([dec.update(Buffer.from(c,'base64url')),dec.final()]).toString('utf8');}catch{return 'Кодты жаңартыңыз / Смените код';}}
function newCode(){return String(crypto.randomInt(100000,999999));}
function makeDefault(){return {schema:3,phase:'setup',round:1,teacherHash:'',teacherEpoch:1,quiz:{completed:false,answers:[],score:null},questions:defaultQuestions,teams:Array.from({length:7},(_,i)=>{const c=newCode();return {id:i+1,name:`Команда ${i+1}`,tasks:[{id:1,ru:'',kk:'',submission:null}],pin_hash:hash(c),pin_cipher:encrypt(c),members:[]};}),nextMemberId:1,history:[]};}
// Safely migrate the previously deployed single-task database: keep submitted work and scores.
function upgrade(s){
 if(s.schema>=3&&s.teams.every(t=>Array.isArray(t.tasks)))return s;
 for(const t of s.teams){if(!Array.isArray(t.tasks)){
   t.tasks=[{id:1,ru:String(t.task_ru||''),kk:String(t.task_kk||''),submission:t.submission||null}];
   delete t.task_ru;delete t.task_kk;delete t.submission;
 }}
 s.schema=3;return s;
}
function publicTask(t){return {id:t.id,ru:t.ru,kk:t.kk,submitted:!!t.submission,submission:t.submission?{...t.submission,photo:undefined,hasPhoto:!!t.submission.photo}:null};}
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
   const old=(await pool.query('SELECT payload FROM economic_relay_state WHERE id=1')).rows[0].payload; if(old.schema<3){await pool.query('UPDATE economic_relay_state SET payload=$1 WHERE id=1',[JSON.stringify(upgrade(old))]);console.log('Upgraded PostgreSQL data to schema 3.');}
   console.log('Persistent PostgreSQL storage connected.');
 }else{
   fs.mkdirSync(DATA_DIR,{recursive:true});
   memory=fs.existsSync(DATA_FILE)?JSON.parse(fs.readFileSync(DATA_FILE,'utf8')):makeDefault();
   if(memory.schema<3)upgrade(memory);
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
function exposedTeam(t){return {id:t.id,name:t.name,tasks:t.tasks.map(publicTask),pin:decrypt(t.pin_cipher),members:t.members.map(m=>({...m})),score:taskTotal(t),graded:taskGraded(t)};}
function leaderboard(s){return s.teams.map(t=>({id:t.id,name:t.name,members:t.members.length,submitted:t.tasks.some(k=>!!k.submission),completed:t.tasks.filter(k=>!!k.submission).length,taskCount:t.tasks.length,graded:taskGraded(t),maxScore:t.tasks.length*10,score:taskGraded(t)?taskTotal(t):null})).sort((a,b)=>(b.score??-1)-(a.score??-1)||a.name.localeCompare(b.name));}
function publicInfo(s,req){const tok=readToken(req);const admin=!!tok&&tok.role==='teacher'&&tok.epoch===s.teacherEpoch;const team=s.teams.find(t=>t.id===tok?.teamId);const participant=!!tok&&tok.role==='member'&&tok.round===s.round&&team?.members.some(m=>m.id===tok.memberId);return {phase:s.phase,round:s.round,teacher:admin,member:participant,quizDone:s.quiz.completed,teams:s.phase==='open'||s.phase==='closed'||admin?s.teams.map(({id,name})=>({id,name})):[],leaderboard:s.phase==='open'||s.phase==='closed'||admin?leaderboard(s):[]};}
function checkPhoto(data){if(!data)return null;if(typeof data!=='string'||data.length>3900000)err('image_too_large',413);const match=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(data);if(!match)err('invalid_image');const bytes=Buffer.from(match[2],'base64');if(bytes.length>2700000||bytes.length<12)err('image_too_large',413);const type=match[1],hex=bytes.subarray(0,12).toString('hex');if(!(type==='image/png'&&hex.startsWith('89504e470d0a1a0a')||type==='image/jpeg'&&hex.startsWith('ffd8')||type==='image/webp'&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'))err('invalid_image');return {type,data:bytes.toString('base64')};}
function validateQuestions(questions){if(!Array.isArray(questions)||questions.length!==20)err('need_20_questions');return questions.map((q,i)=>{const ru=clean(q.ru,450),kk=clean(q.kk,450),r=q.options_ru,k=q.options_kk,correct=Number(q.correct);if(!ru||!kk||!Array.isArray(r)||!Array.isArray(k)||r.length!==4||k.length!==4||r.some(x=>!clean(x,220))||k.some(x=>!clean(x,220))||!Number.isInteger(correct)||correct<0||correct>3)err('question_incomplete');return {id:i+1,ru,kk,options_ru:r.map(x=>clean(x,220)),options_kk:k.map(x=>clean(x,220)),correct};});}
const rate=new Map();function limit(req,key){const ip=String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'unknown').split(',')[0].trim();const k=ip+':'+key;const now=Date.now();const v=rate.get(k)||[];const recent=v.filter(time=>time>now-600000);if(recent.length>=12)err('try_later',429);recent.push(now);rate.set(k,recent);if(rate.size>5000){for(const [id,v] of rate)if(v.every(t=>t<now-600000))rate.delete(id);}}
function csvCell(v){let s=String(v??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}

async function handle(req,res){
 const url=new URL(req.url||'/', 'http://localhost');const p=url.pathname;const method=req.method;
 if(method==='GET'&&(p==='/'||p==='/index.html'))return text(res,200,fs.readFileSync(HTML_PATH),'text/html; charset=utf-8');
 if(method==='GET'&&p==='/styles.css')return text(res,200,fs.readFileSync(path.join(__dirname,'styles.css')),'text/css; charset=utf-8');
 if(method==='GET'&&p==='/app.js')return text(res,200,fs.readFileSync(path.join(__dirname,'app.js')),'text/javascript; charset=utf-8');
 if(method==='GET'&&p==='/health')return send(res,200,{ok:true,storage:pool?'postgres':'local',ready:true});
 if(method==='GET'&&p==='/api/public')return send(res,200,publicInfo(await readState(),req));
 if(method==='GET'&&p==='/api/qr'){
   const qr=require('qrcode');const origin=clean(process.env.PUBLIC_URL||`${(PROD?'https':(req.headers['x-forwarded-proto']||'http'))}://${req.headers.host||'localhost:'+PORT}`,500);const png=await qr.toBuffer(origin,{type:'png',width:420,margin:2,color:{dark:'#25205aff',light:'#ffffffff'}});res.writeHead(200,{'Content-Type':'image/png','Cache-Control':'public,max-age=60'});return res.end(png);
 }
 if(method==='POST'&&p==='/api/logout'){clearAuth(res);return send(res,200,{ok:true});}
 if(method==='POST'&&p==='/api/teacher/login'){
   limit(req,'teacher');const b=await readBody(req);const s=await readState();const pass=clean(b.password,300);if(!pass||!(s.teacherHash?verify(pass,s.teacherHash):INITIAL_PASSWORD&&safeSame(pass,INITIAL_PASSWORD)))err('incorrect_password',401);setAuth(res,{role:'teacher',epoch:s.teacherEpoch});return send(res,200,{ok:true});
 }
 if(method==='GET'&&p==='/api/admin'){
   const s=await readState();teacher(s,req);return send(res,200,{phase:s.phase,round:s.round,quiz:s.quiz,questions:s.questions,teams:s.teams.map(exposedTeam),history:s.history,storage:pool?'postgres':'local'});
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
         return {id,ru,kk,submission:null};
       });
       const prev=s.teams.find(x=>x.id===Number(t.id));return {id:prev?.id??next++,name,tasks,pin_hash:prev&&verify(pin,prev.pin_hash)?prev.pin_hash:hash(pin),pin_cipher:prev&&verify(pin,prev.pin_hash)?prev.pin_cipher:encrypt(pin),members:[]};
     });s.teams=arr;return {ok:true};
   }));
 }
 if(method==='POST'&&p==='/api/admin/questions'){
   const b=await readBody(req);return send(res,200,await changeState(s=>{teacher(s,req);if(s.phase!=='setup'||s.quiz.completed)err('edit_before_quiz',409);s.questions=validateQuestions(b.questions);return {ok:true};}));
 }
 if(method==='POST'&&p==='/api/admin/quiz'){
   const b=await readBody(req);return send(res,200,await changeState(s=>{teacher(s,req);if(s.quiz.completed||s.phase!=='setup')err('quiz_already_done',409);if(!s.teams.length||s.teams.some(t=>!t.tasks.length||t.tasks.some(k=>!k.ru&&!k.kk)))err('tasks_incomplete',409);if(!Array.isArray(b.answers)||b.answers.length!==20||b.answers.some(a=>!Number.isInteger(a)||a<0||a>3))err('answer_all');const correct=s.questions.map(q=>q.correct),score=b.answers.filter((a,i)=>a===correct[i]).length;s.quiz={completed:true,answers:b.answers,score,finishedAt:new Date().toISOString()};s.phase='quiz_done';return {ok:true,score,correct};}));
 }
 if(method==='POST'&&p==='/api/admin/open'){
   return send(res,200,await changeState(s=>{teacher(s,req);if(!s.quiz.completed)err('quiz_first',409);if(s.teams.some(t=>!t.tasks.length||t.tasks.some(k=>!k.ru&&!k.kk))||!s.teams.length)err('tasks_incomplete',409);if(!['quiz_done','closed'].includes(s.phase))err('invalid_phase',409);s.phase='open';return {ok:true};}));
 }
 if(method==='POST'&&p==='/api/admin/close')return send(res,200,await changeState(s=>{teacher(s,req);if(s.phase!=='open')err('invalid_phase',409);s.phase='closed';return {ok:true};}));
 if(method==='POST'&&p==='/api/admin/next'){
   const b=await readBody(req);if(b.confirm!=='NEW ROUND')err('confirm_required');
   return send(res,200,await changeState(s=>{teacher(s,req);
     s.history.unshift({round:s.round,finishedAt:new Date().toISOString(),quizScore:s.quiz.score,teams:s.teams.map(t=>({name:t.name,members:t.members.map(m=>m.name),score:taskTotal(t),maxScore:t.tasks.length*10,tasks:t.tasks.map(k=>({ru:k.ru,kk:k.kk,answer:k.submission?.answer||'',score:k.submission?.score??null,feedback:k.submission?.feedback||''}))}))});
     s.history=s.history.slice(0,30);s.round++;s.phase='setup';s.quiz={completed:false,answers:[],score:null};
     for(const t of s.teams){t.members=[];t.tasks.forEach(k=>k.submission=null);}return {ok:true};
   }));
 }
 if(method==='POST'&&p==='/api/admin/password'){
   const b=await readBody(req);const old=clean(b.old,300),newPass=clean(b.next,300);if(newPass.length<10)err('password_too_short');const result=await changeState(s=>{teacher(s,req);if(!(s.teacherHash?verify(old,s.teacherHash):safeSame(old,INITIAL_PASSWORD)))err('incorrect_password',401);s.teacherHash=hash(newPass);s.teacherEpoch++;return {ok:true,epoch:s.teacherEpoch};});setAuth(res,{role:'teacher',epoch:result.epoch});return send(res,200,{ok:true});
 }
 if(method==='POST'&&p==='/api/admin/grade'){
   const b=await readBody(req),id=Number(b.teamId),taskId=Number(b.taskId),score=Number(b.score);
   if(!Number.isInteger(score)||score<0||score>10)err('score_range');
   return send(res,200,await changeState(s=>{teacher(s,req);
     const t=s.teams.find(x=>x.id===id),k=t?.tasks.find(x=>x.id===taskId);
     if(!k?.submission)err('no_submission',404);k.submission.score=score;
     k.submission.feedback=clean(b.feedback,1500);k.submission.gradedAt=new Date().toISOString();return {ok:true};
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
   const rows=[['Команда','Участники','Задание №','Задание RU','Тапсырма KZ','Ответ','Балл (0–10)','Комментарий'],
     ...s.teams.flatMap(t=>t.tasks.map((k,i)=>[t.name,t.members.map(m=>m.name).join('; '),i+1,k.ru,k.kk,k.submission?.answer||'',k.submission?.score??'',k.submission?.feedback||'']))];
   const body='\ufeff'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n');res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="economic-relay-results.csv"'});return res.end(body);
 }
 if(method==='POST'&&p==='/api/member/register'){
   limit(req,'join');const b=await readBody(req),name=clean(b.name,90),id=Number(b.teamId),pin=clean(b.pin,80);if(name.length<2||!Number.isInteger(id))err('name_required');const out=await changeState(s=>{if(s.phase!=='open')err('not_open',403);const t=s.teams.find(x=>x.id===id);if(!t||!verify(pin,t.pin_hash))err('invalid_team_code',401);if(t.members.some(m=>m.name.toLocaleLowerCase()===name.toLocaleLowerCase()))err('name_taken',409);const m={id:s.nextMemberId++,name,isCaptain:t.members.length===0,joinedAt:new Date().toISOString()};t.members.push(m);return {id:m.id,teamId:t.id,round:s.round,captain:m.isCaptain};});setAuth(res,{role:'member',memberId:out.id,teamId:out.teamId,round:out.round});return send(res,200,{ok:true,captain:out.captain});
 }
 if(method==='GET'&&p==='/api/member'){
   const s=await readState(),tok=member(s,req),t=s.teams.find(x=>x.id===tok.teamId),m=t.members.find(x=>x.id===tok.memberId);
   const active=t.tasks.find(k=>!k.submission)||null;
   // Do not disclose later assignments before the captain submits the current one.
   const taskViews=t.tasks.map((k,i)=>{const item=publicTask(k),isFuture=!k.submission&&k.id!==active?.id;return isFuture?{...item,ru:'',kk:''}:item;});
   return send(res,200,{phase:s.phase,round:s.round,team:{id:t.id,name:t.name,taskCount:t.tasks.length,tasks:taskViews,activeId:active?.id??null,score:taskTotal(t),maxScore:t.tasks.length*10},me:m,members:t.members});
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
