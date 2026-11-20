'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), net = require('node:net');
const { spawn } = require('node:child_process');
const QUESTIONS = require('../teacher-test.json');
const SUP = 'supervisor-test-password';
const keys = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [String(i + 1), { ru: ['Анализ ' + (i + 1), 'Расчёт ' + (i + 1), 'Вывод ' + (i + 1)], kk: ['Талдау ' + (i + 1), 'Есептеу ' + (i + 1), 'Қорытынды ' + (i + 1)] }]));
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function launch(t, { legacy, env = {} } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'relay-v5-'));
  if (legacy) fs.writeFileSync(path.join(dir, 'relay-data.json'), JSON.stringify(legacy));
  const port = await new Promise((ok, no) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)); }); s.on('error', no); });
  const base = `http://127.0.0.1:${port}`;
  const proc = spawn(process.execPath, ['server.js'], { cwd: path.resolve(__dirname, '..'), env: { ...process.env, PORT: String(port), DATA_DIR: dir, DATABASE_URL: process.env.TEST_DATABASE_URL || '', NODE_ENV: '', TEACHER_PASSWORD: SUP, SESSION_SECRET: 'test-session-secret-value-at-least-32-chars', ...env } });
  let log = ''; proc.stdout.on('data', b => log += b); proc.stderr.on('data', b => log += b);
  t.after(() => { proc.kill(); fs.rmSync(dir, { recursive: true, force: true }); });
  let ready = false; for (let i = 0; i < 120; i++) { try { if ((await fetch(base + '/health')).ok) { ready = true; break; } } catch {} await sleep(50); }
  assert.ok(ready, log);
  const jar = {};
  async function call(who, url, method = 'GET', body) {
    const r = await fetch(base + url, { method, headers: { ...(jar[who] ? { cookie: jar[who] } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const c = r.headers.get('set-cookie'); if (c) jar[who] = c.split(';')[0];
    const type = r.headers.get('content-type') || '';
    return { status: r.status, data: type.includes('json') ? await r.json() : await r.text(), type };
  }
  return { call, base };
}
const correct = QUESTIONS.map(q => q.correct);
// Only the director creates teacher accounts; then the teacher signs in.
async function addTeacher(call, who, name, login, password) {
  await call('boss', '/api/supervisor/login', 'POST', { login: 'admin', password: SUP });
  const r = await call('boss', '/api/supervisor/create-teacher', 'POST', { name, login, password });
  if (r.status !== 200) return r;
  return call(who, '/api/teacher/login', 'POST', { login, password });
}

test('static files and background image are served', async t => {
  const { call } = await launch(t);
  assert.equal((await call('x', '/')).status, 200);
  const img = await call('x', '/images/campus.webp'); assert.equal(img.status, 200); assert.equal(img.type, 'image/webp');
  assert.equal((await call('x', '/server.js')).status, 404);
  assert.equal((await call('x', '/api/session')).data.role, null);
});

test('two teachers with their own accounts, classes, quiz and students; supervisor oversees them', async t => {
  const { call } = await launch(t);
  // no self-registration: only the director creates accounts
  assert.equal((await call('t1', '/api/teacher/register', 'POST', { name: 'Айгүл Серікова', login: 'aigul', password: 'secret1' })).status, 404);
  assert.equal((await call('t1', '/api/supervisor/create-teacher', 'POST', { name: 'Айгүл Серікова', login: 'aigul', password: 'secret1' })).status, 401);
  assert.equal((await addTeacher(call, 't1', 'Ай', 'aigul', 'secret1')).status, 400);
  assert.equal((await addTeacher(call, 't1', 'Айгүл Серікова', 'Ай гүл', 'secret1')).data.error, 'login_format');
  assert.equal((await addTeacher(call, 't1', 'Айгүл Серікова', 'aigul', '123')).data.error, 'password_too_short');
  assert.equal((await addTeacher(call, 't1', 'Айгүл Серікова', 'Aigul', 'secret1')).status, 200);
  assert.equal((await addTeacher(call, 't2', 'Иван Петров', 'aigul', 'secret2')).data.error, 'login_taken');
  assert.equal((await addTeacher(call, 't2', 'Иван Петров', 'ivan', 'secret2')).status, 200);
  assert.equal((await call('t1', '/api/session')).data.role, 'teacher');

  let a = (await call('t1', '/api/teacher')).data, b = (await call('t2', '/api/teacher')).data;
  assert.match(a.classCode, /^\d{6}$/); assert.notEqual(a.classCode, b.classCode);
  assert.equal(a.teams.length, 7); assert.equal(a.teams[0].case.ru.stages.length, 3);
  assert.ok(a.questions.every(q => q.correct === undefined), 'answer key hidden before the test');

  // login again from another device
  assert.equal((await call('t1b', '/api/teacher/login', 'POST', { login: 'AIGUL', password: 'wrong' })).status, 401);
  assert.equal((await call('t1b', '/api/teacher/login', 'POST', { login: 'AIGUL', password: 'secret1' })).status, 200);

  // students can't join before the teacher's quiz + open
  assert.equal((await call('s1', '/api/class/' + a.classCode)).data.phase, 'setup');
  assert.equal((await call('t1', '/api/teacher/open', 'POST', {})).data.error, 'quiz_first');
  assert.equal((await call('t1', '/api/teacher/teams', 'POST', { count: 1 })).data.error, 'team_count');
  assert.equal((await call('t1', '/api/teacher/teams', 'POST', { count: 21 })).data.error, 'team_count');
  assert.equal((await call('t1', '/api/teacher/teams', 'POST', { count: 13 })).status, 200);
  const thirteen = (await call('t1', '/api/teacher')).data.teams;
  assert.equal(thirteen.length, 13); assert.equal(thirteen[10].officialId, 1); assert.equal(thirteen[12].case.ru.title, thirteen[2].case.ru.title);
  assert.equal((await call('t1', '/api/teacher/teams', 'POST', { count: 4 })).status, 200);
  assert.equal((await call('t1', '/api/teacher')).data.teams.length, 4);
  assert.equal((await call('t1', '/api/teacher/teams', 'POST', { count: 10 })).status, 200);
  assert.equal((await call('t1', '/api/teacher/quiz', 'POST', { answers: Array(19).fill(0) })).status, 400);
  const quiz = await call('t1', '/api/teacher/quiz', 'POST', { answers: correct });
  assert.equal(quiz.data.score, 20);
  assert.equal((await call('t1', '/api/teacher/quiz', 'POST', { answers: correct })).status, 409);
  assert.equal((await call('t2', '/api/teacher/quiz', 'POST', { answers: Array(20).fill(0) })).status, 200);
  a = (await call('t1', '/api/teacher')).data;
  assert.equal(a.teams.length, 10); assert.equal(a.questions[0].correct, QUESTIONS[0].correct);
  assert.equal((await call('t1', '/api/teacher/open', 'POST', {})).status, 200);
  assert.equal((await call('t1', '/api/teacher/teams', 'POST', { count: 7 })).status, 409);

  // students of teacher 1
  const info = (await call('s1', '/api/class/' + a.classCode)).data;
  assert.equal(info.teacher, 'Айгүл Серікова'); assert.equal(info.teams.length, 10);
  assert.equal((await call('s1', '/api/class/000000')).status, 404);
  assert.equal((await call('s1', '/api/student/join', 'POST', { code: a.classCode, name: 'Алия', teamId: 1, pin: '0' })).status, 401);
  assert.equal((await call('s1', '/api/student/join', 'POST', { code: b.classCode, name: 'Алия', teamId: 1, pin: a.teams[0].pin })).status, 403, 'other teacher class is still closed');
  assert.equal((await call('s1', '/api/student/join', 'POST', { code: a.classCode, name: 'Алия', teamId: 1, pin: a.teams[0].pin })).data.captain, true);
  assert.equal((await call('s2', '/api/student/join', 'POST', { code: a.classCode, name: 'Бекзат', teamId: 1, pin: a.teams[0].pin })).data.captain, false);
  assert.equal((await call('s2', '/api/student/join', 'POST', { code: a.classCode, name: 'алия', teamId: 1, pin: a.teams[0].pin })).data.error, 'name_taken');
  let me = (await call('s1', '/api/student')).data;
  assert.equal(me.team.case.kk.stages.length, 3); assert.equal(me.teacher, 'Айгүл Серікова');
  assert.ok(!JSON.stringify(me).includes('Расчёт 1'), 'no jury keys for students');
  assert.equal((await call('s2', '/api/student/submit', 'POST', { answers: ['x'] })).data.error, 'captain_only');
  const png = 'data:image/png;base64,' + Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489', 'hex').toString('base64');
  assert.equal((await call('s1', '/api/student/submit', 'POST', { answers: ['Анализ', 'Расчёт 15000', 'Решение'], photo: png })).status, 200);
  assert.equal((await call('s1', '/api/student/submit', 'POST', { answers: ['again'] })).data.error, 'already_submitted');
  assert.equal((await call('s1', `/api/photo/${a.id}/1`)).status, 200);
  assert.equal((await call('s2', `/api/photo/${a.id}/1`)).status, 200);
  assert.equal((await call('t2', `/api/photo/${a.id}/1`)).status, 401, 'another teacher cannot see the photo');

  // grading
  assert.equal((await call('t2', '/api/teacher/grade', 'POST', { teamId: 1, rubric: { analysis: 10, calculation: 10, decision: 10, defense: 10 } })).status, 404, 'teacher 2 has no such submission');
  assert.equal((await call('t1', '/api/teacher/grade', 'POST', { teamId: 1, rubric: { analysis: 11, calculation: 10, decision: 10, defense: 10 } })).status, 400);
  assert.equal((await call('t1', '/api/teacher/grade', 'POST', { teamId: 1, rubric: { analysis: 9, calculation: 14, decision: 12, defense: 8 }, feedback: 'Жақсы' })).data.score, 43);
  me = (await call('s2', '/api/student')).data;
  assert.equal(me.team.submission.score, 43); assert.equal(me.leaderboard[0].score, 43);
  const csv = (await call('t1', '/api/teacher/csv')).data; assert.ok(csv.includes('Жақсы') && csv.includes('Алия'));

  // supervisor
  assert.equal((await call('t1', '/api/supervisor')).status, 401);
  assert.equal((await call('sup', '/api/supervisor/login', 'POST', { password: 'nope' })).status, 401);
  assert.equal((await call('sup', '/api/supervisor/login', 'POST', { password: SUP })).status, 200);
  let sup = (await call('sup', '/api/supervisor')).data;
  assert.equal(sup.teachers.length, 2);
  const s1 = sup.teachers.find(x => x.login === 'aigul');
  assert.equal(s1.lastAttempt.score, 20); assert.equal(s1.students, 2); assert.equal(s1.submitted, 1); assert.equal(s1.graded, 1); assert.equal(s1.avgTeamScore, 43); assert.equal(s1.phase, 'open');
  const det = (await call('sup', '/api/supervisor/teacher/' + a.id)).data;
  assert.equal(det.teams[0].submission.score, 43); assert.equal(det.teams[0].pin, undefined);
  assert.equal((await call('sup', `/api/photo/${a.id}/1`)).status, 200);
  assert.ok((await call('sup', '/api/supervisor/csv')).data.includes('Айгүл Серікова'));
  // jury answers visible to teachers only after import
  assert.equal((await call('t1', '/api/supervisor/answers', 'POST', { answerKeys: keys })).status, 401);
  assert.equal((await call('sup', '/api/supervisor/answers', 'POST', { answerKeys: { 1: {} } })).status, 400);
  assert.equal((await call('sup', '/api/supervisor/answers', 'POST', { answerKeys: keys })).status, 200);
  assert.equal((await call('t1', '/api/teacher')).data.answerKeys['3'].ru.length, 3);
  // create teacher, reset, block, delete
  assert.equal((await addTeacher(call, 'new', 'Жаңа мұғалім', 'jana', 'secret3')).status, 200);
  assert.equal((await call('sup', '/api/supervisor/create-teacher', 'POST', { name: 'Марат Ахметов', login: 'marat', password: 'start123' })).status, 200);
  assert.equal((await call('m', '/api/teacher/login', 'POST', { login: 'marat', password: 'start123' })).status, 200);
  assert.equal((await call('sup', '/api/supervisor/teacher', 'POST', { id: b.id, action: 'reset', password: 'fresh-pass' })).status, 200);
  assert.equal((await call('t2', '/api/teacher')).status, 401, 'old session ends after reset');
  assert.equal((await call('t2', '/api/teacher/login', 'POST', { login: 'ivan', password: 'fresh-pass' })).status, 200);
  assert.equal((await call('sup', '/api/supervisor/teacher', 'POST', { id: b.id, action: 'block' })).status, 200);
  assert.equal((await call('t2', '/api/teacher/login', 'POST', { login: 'ivan', password: 'fresh-pass' })).data.error, 'account_blocked');
  assert.equal((await call('sup', '/api/supervisor/teacher', 'POST', { id: b.id, action: 'delete' })).status, 400);
  assert.equal((await call('sup', '/api/supervisor/teacher', 'POST', { id: b.id, action: 'delete', confirm: 'DELETE' })).status, 200);
  sup = (await call('sup', '/api/supervisor')).data;
  assert.equal(sup.teachers.length, 3); assert.equal((await call('s1', '/api/class/' + b.classCode)).status, 404);

  // teacher password change and new lesson
  assert.equal((await call('t1', '/api/teacher/password', 'POST', { old: 'bad', next: 'newsecret' })).status, 401);
  assert.equal((await call('t1', '/api/teacher/password', 'POST', { old: 'secret1', next: 'newsecret' })).status, 200);
  assert.equal((await call('t1b', '/api/teacher')).status, 401, 'other device logged out after password change');
  assert.equal((await call('t1', '/api/teacher/close', 'POST', {})).status, 200);
  assert.equal((await call('t1', '/api/teacher/new-round', 'POST', { confirm: 'NEW ROUND' })).status, 200);
  a = (await call('t1', '/api/teacher')).data;
  assert.equal(a.round, 2); assert.equal(a.quiz, null); assert.equal(a.phase, 'setup'); assert.equal(a.history[0].teams[0].score, 43); assert.equal(a.attempts.length, 1);
  assert.equal((await call('s1', '/api/student')).status, 401, 'students of the previous lesson are signed out');
  assert.equal((await call('t1', `/api/photo/${a.id}/1`)).status, 404);
});

test('earlier single-cabinet data is kept and its useful parts are migrated', async t => {
  const legacy = { schema: 3, phase: 'closed', round: 4, teacherHash: '', officialAnswerKeys: keys, teacherAttempts: [{ id: 1, name: 'Старый тест', score: 15, total: 20, answers: [], finishedAt: '2026-11-19T10:00:00.000Z' }], teams: [{ id: 1, name: 'A', pin_hash: 'x', pin_cipher: 'y', members: [], tasks: [] }] };
  const { call } = await launch(t, { legacy });
  assert.equal((await call('sup', '/api/supervisor/login', 'POST', { password: SUP })).status, 200);
  const sup = (await call('sup', '/api/supervisor')).data;
  assert.equal(sup.answerKeyCount, 10); assert.equal(sup.hasLegacy, true); assert.equal(sup.legacyAttempts[0].name, 'Старый тест');
  const backup = await call('sup', '/api/supervisor/legacy-export');
  assert.equal(backup.status, 200); assert.equal(backup.data.round, 4); assert.equal(backup.data.teams[0].pin_hash, undefined);
});

test('teacher edits a team case; only the director edits the teacher test; director accounts with login and password', async t => {
  const { call } = await launch(t);
  assert.equal((await addTeacher(call, 't', 'Айгүл Серікова', 'aigul', 'secret1')).status, 200);
  let me = (await call('t', '/api/teacher')).data;
  const custom = { ru: { title: 'Мой кейс', stages: [1, 2, 3].map(i => ({ heading: 'Этап ' + i, body: 'Текст ' + i })) }, kk: { title: 'Менің кейсім', stages: [1, 2, 3].map(i => ({ heading: i + '-кезең', body: 'Мәтін ' + i })) } };
  assert.equal((await call('t', '/api/teacher/case', 'POST', { teamId: 2, content: { ru: custom.ru } })).data.error, 'case_incomplete');
  assert.equal((await call('t', '/api/teacher/case', 'POST', { teamId: 2, content: custom })).status, 200);
  me = (await call('t', '/api/teacher')).data;
  assert.equal(me.teams[1].case.kk.title, 'Менің кейсім'); assert.equal(me.teams[1].custom, true); assert.equal(me.teams[0].custom, false);
  // teacher cannot change the test
  assert.equal((await call('t', '/api/supervisor/questions', 'POST', { questions: [] })).status, 401);

  // owner signs in with login admin, creates a director
  assert.equal((await call('own', '/api/supervisor/login', 'POST', { login: 'admin', password: SUP })).status, 200);
  assert.equal((await call('own', '/api/supervisor/directors', 'POST', { action: 'create', name: 'Директор колледжа', login: 'director', password: 'short' })).data.error, 'password_too_short_8');
  assert.equal((await call('own', '/api/supervisor/directors', 'POST', { action: 'create', name: 'Директор колледжа', login: 'director', password: 'Direktor-2026' })).status, 200);
  assert.equal((await call('own', '/api/supervisor/directors', 'POST', { action: 'create', name: 'X', login: 'admin', password: 'Direktor-2026' })).status, 409);
  assert.equal((await call('dir', '/api/supervisor/login', 'POST', { login: 'director', password: 'wrong-pass' })).data.error, 'incorrect_login');
  assert.equal((await call('dir', '/api/supervisor/login', 'POST', { login: 'Director', password: 'Direktor-2026' })).status, 200);
  let dir = (await call('dir', '/api/supervisor')).data;
  assert.equal(dir.owner, false); assert.equal(dir.actor, 'Директор колледжа'); assert.equal(dir.directors, null); assert.equal(dir.teachers.length, 1); assert.equal(dir.questions.length, 20);
  assert.equal((await call('dir', '/api/supervisor/directors', 'POST', { action: 'create', name: 'Ещё один', login: 'other', password: 'Direktor-2026' })).status, 403);
  assert.equal((await call('own', '/api/supervisor')).data.directors[0].login, 'director');

  // director edits the test: 5 questions
  const qs = Array.from({ length: 5 }, (_, i) => ({ ru: 'Вопрос ' + i, kk: 'Сұрақ ' + i, options_ru: ['a', 'b', 'c'], options_kk: ['а', 'ә', 'б'], correct: i % 3 }));
  assert.equal((await call('dir', '/api/supervisor/questions', 'POST', { questions: qs.slice(0, 4) })).data.error, 'questions_count');
  assert.equal((await call('dir', '/api/supervisor/questions', 'POST', { questions: [{ ...qs[0], kk: '' }, ...qs.slice(1)] })).data.error, 'question_incomplete');
  assert.equal((await call('dir', '/api/supervisor/questions', 'POST', { questions: qs })).status, 200);
  me = (await call('t', '/api/teacher')).data;
  assert.equal(me.questions.length, 5); assert.equal(me.questions[0].correct, undefined);
  const r = await call('t', '/api/teacher/quiz', 'POST', { answers: qs.map(q => q.correct) });
  assert.equal(r.data.score, 5);
  me = (await call('t', '/api/teacher')).data;
  assert.equal(me.quiz.total, 5); assert.equal(me.quiz.level, 'high'); assert.equal(me.questions[2].ru, 'Вопрос 2');
  // restoring the original keeps the stored result
  assert.equal((await call('dir', '/api/supervisor/questions', 'POST', { reset: true })).status, 200);
  assert.equal((await call('dir', '/api/supervisor')).data.questions.length, 20);
  assert.equal((await call('t', '/api/teacher')).data.quiz.total, 5);

  // students see the edited case; once submitted, it can't be changed
  assert.equal((await call('t', '/api/teacher/open', 'POST', {})).status, 200);
  assert.equal((await call('s', '/api/student/join', 'POST', { code: me.classCode, name: 'Ерлан', teamId: 2, pin: me.teams[1].pin })).status, 200);
  const st = (await call('s', '/api/student')).data;
  assert.equal(st.team.case.ru.title, 'Мой кейс');
  assert.equal((await call('s', '/api/student/submit', 'POST', { answers: ['a', 'b', 'c'] })).status, 200);
  assert.equal((await call('t', '/api/teacher/case', 'POST', { teamId: 2, reset: true })).data.error, 'already_submitted');
  // director sees it; access revoked after delete / password reset
  assert.equal((await call('dir', '/api/supervisor/teacher/' + me.id)).data.teams[1].submission.answers[0], 'a');
  assert.equal((await call('own', '/api/supervisor/directors', 'POST', { action: 'reset', login: 'director', password: 'New-pass-2026' })).status, 200);
  assert.equal((await call('dir', '/api/supervisor')).status, 401);
  assert.equal((await call('dir', '/api/supervisor/login', 'POST', { login: 'director', password: 'New-pass-2026' })).status, 200);
  assert.equal((await call('own', '/api/supervisor/directors', 'POST', { action: 'delete', login: 'director' })).status, 200);
  assert.equal((await call('dir', '/api/supervisor')).status, 401);
  assert.equal((await call('x', '/director')).status, 200);
});

test('teachers enter with a personal QR link straight to the test; director can renew it', async t => {
  const { call, base } = await launch(t);
  await call('boss', '/api/supervisor/login', 'POST', { login: 'admin', password: SUP });
  const created = (await call('boss', '/api/supervisor/create-teacher', 'POST', { name: 'Гүлнар Ахметова', login: 'gulnar' })).data;
  assert.ok(created.linkToken, 'password is optional and a link is created');
  const link = (await call('boss', '/api/supervisor/teacher/' + created.id)).data.linkToken;
  assert.equal(link, created.linkToken);
  // following the link signs in and lands on the test
  let r = await fetch(base + '/t/' + link, { redirect: 'manual' });
  assert.equal(r.status, 302); assert.equal(r.headers.get('location'), '/?go=test');
  const cookie = r.headers.get('set-cookie').split(';')[0];
  const me = await (await fetch(base + '/api/teacher', { headers: { cookie } })).json();
  assert.equal(me.name, 'Гүлнар Ахметова'); assert.equal(me.linkToken, undefined, 'teacher view does not expose the token');
  await fetch(base + '/api/teacher/quiz', { method: 'POST', headers: { cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ answers: correct }) });
  r = await fetch(base + '/t/' + link, { redirect: 'manual' }); assert.equal(r.headers.get('location'), '/?go=home');
  // QR image for the link, bad links
  const qr = await call('boss', '/api/qr?t=' + link); assert.equal(qr.status, 200);
  assert.equal((await fetch(base + '/t/nope', { redirect: 'manual' })).headers.get('location'), '/?link=bad');
  // renew: old link stops working
  assert.equal((await call('boss', '/api/supervisor/teacher', 'POST', { id: created.id, action: 'newlink' })).status, 200);
  const fresh = (await call('boss', '/api/supervisor/teacher/' + created.id)).data.linkToken;
  assert.notEqual(fresh, link);
  assert.equal((await fetch(base + '/t/' + link, { redirect: 'manual' })).headers.get('location'), '/?link=bad');
  assert.equal((await fetch(base + '/t/' + fresh, { redirect: 'manual' })).status, 302);
  // blocked teacher cannot use the link; all links for printing
  await call('boss', '/api/supervisor/create-teacher', 'POST', { name: 'Ерлан Сапаров', login: 'erlan', password: 'secret12' });
  const links = (await call('boss', '/api/supervisor/links')).data.teachers;
  assert.equal(links.length, 2); assert.ok(links.every(x => x.linkToken));
  assert.equal((await call('x', '/api/supervisor/links')).status, 401);
  await call('boss', '/api/supervisor/teacher', 'POST', { id: created.id, action: 'block' });
  assert.equal((await fetch(base + '/t/' + fresh, { redirect: 'manual' })).headers.get('location'), '/?link=blocked');
  // deleting the teacher removes the link
  await call('boss', '/api/supervisor/teacher', 'POST', { id: created.id, action: 'delete', confirm: 'DELETE' });
  assert.equal((await fetch(base + '/t/' + fresh, { redirect: 'manual' })).headers.get('location'), '/?link=bad');
});
