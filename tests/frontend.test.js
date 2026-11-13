'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const code=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8').replace(/\nrefresh\(\);\s*$/,'\n');
const elem={addEventListener(){},classList:{add(){},remove(){},toggle(){}},style:{},textContent:'',innerHTML:'',value:'',scrollIntoView(){},showModal(){},close(){}};
const context={console,setInterval(){},clearTimeout(){},setTimeout(){},navigator:{clipboard:{writeText:()=>Promise.resolve()}},localStorage:{getItem(){return null;},setItem(){}},window:{addEventListener(){}},document:{documentElement:{},getElementById(){return {...elem,classList:{toggle(){},add(){},remove(){}}};}},location:{origin:'https://example.onrender.com'},confirm:()=>true,crypto:require('crypto').webcrypto,structuredClone};
vm.createContext(context);vm.runInContext(code,context);
function run(s){return vm.runInContext(s,context);}
test('frontend renders landing, hidden teacher login is not a public card',()=>{
 const result=run("pub={phase:'setup',teacher:false,member:false,teams:[],leaderboard:[]};landingUI()");
 assert.ok(result.includes('Участвовать в эстафете'));
 assert.ok(result.includes('Игра пока закрыта'));
 assert.ok(!result.includes('Кабинет преподавателя'));
});
test('frontend renders teacher task editor and supports team bulk pasting',()=>{
 const admin={phase:'setup',round:1,teams:Array.from({length:7},(_,i)=>({id:i+1,name:'Команда '+(i+1),pin:'123456',tasks:[{id:1,ru:'Задание 1',kk:'Тапсырма 1',submitted:false,submission:null}],members:[],score:0,graded:0})),quiz:{completed:false,score:null,answers:[]},history:[],storage:'local',questions:Array.from({length:20},(_,i)=>({id:i+1,ru:'Вопрос',kk:'Сұрақ',options_ru:['А','Б','В','Г'],options_kk:['А','Б','В','Г'],correct:0}))};
 context.__admin=admin;
 const html=run("admin=__admin;pub={phase:'setup',teacher:true,member:false,leaderboard:[]};taskDraft=null;taskDraft=structuredClone(admin.teams).map(x=>({id:x.id,name:x.name,pin:x.pin,tasks:x.tasks.map(k=>({id:k.id,ru:k.ru,kk:k.kk}))}));tasksUI()");
 assert.ok(html.includes('Добавить много заданий за раз'));
 assert.ok(html.includes('Сохранить все изменения'));
 assert.ok(html.includes('Команда 7'));
 assert.ok(html.includes('Задание 1'));
 const overview=run('overviewUI()');assert.ok(overview.includes('Пройти тест'));
 const quiz=run('quizUI()');assert.ok(quiz.includes('Вопрос 1/20'));
 const reviews=run('reviewsUI()');assert.ok(reviews.includes('Ответы семи команд'));
 const settings=run('questionDraft=structuredClone(admin.questions);settingsUI()');assert.ok(settings.includes('Редактор теста'));
});
test("frontend renders student queued tasks without other team tasks",()=>{
 context.__member={phase:'open',round:1,me:{name:'Айдос',isCaptain:true},members:[{name:'Айдос',isCaptain:true}],team:{id:1,name:'Алғырлар',taskCount:3,activeId:2,score:0,maxScore:30,tasks:[{id:1,ru:'Task 1',kk:'Тапсырма 1',submitted:true,submission:{answer:'Жауап 1',hasPhoto:false,score:null}},{id:2,ru:'Task 2',kk:'Тапсырма 2',submitted:false,submission:null},{id:3,ru:'Task 3',kk:'Тапсырма 3',submitted:false,submission:null}]}};
 const html=run("member=__member;pub={phase:'open',member:true,teacher:false,leaderboard:[]};memberUI()");
 assert.ok(html.includes('Текущее задание'));
 assert.ok(html.includes('Task 2'));
 assert.ok(html.includes('Жауап 1'));
 assert.ok(!html.includes('Task 3'),'future task not shown to students');
});
