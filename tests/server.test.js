'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), net = require('node:net');
const { spawn } = require('node:child_process');
const QUESTIONS = require('../teacher-test.json');
const SUP = 'admin-test-password';
const NAMES = ['Агенты роста', 'Қаржы қырандары', 'Cash Flow (денежный поток)', 'Тапқыр', 'TABYSVIBE', 'Индекс удачи', 'Золотой капитал'];
const keys = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [String(i + 1), { ru: ['Анализ ' + (i + 1), 'Расчёт ' + (i + 1), 'Вывод ' + (i + 1)], kk: ['Талдау ' + (i + 1), 'Есептеу ' + (i + 1), 'Қорытынды ' + (i + 1)] }]));
const correct = QUESTIONS.map(q => q.correct);
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function launch(t, { legacy, v5 } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'relay-v6-'));
  if (legacy) fs.writeFileSync(path.join(dir, 'relay-data.json'), JSON.stringify(legacy));
  if (v5) fs.writeFileSync(path.join(dir, 'relay-v5.json'), JSON.stringify(v5));
  const port = await new Promise((ok, no) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)); }); s.on('error', no); });
  const base = `http://127.0.0.1:${port}`;
  const proc = spawn(process.execPath, ['server.js'], { cwd: path.resolve(__dirname, '..'), env: { ...process.env, PORT: String(port), DATA_DIR: dir, DATABASE_URL: process.env.TEST_DATABASE_URL || '', NODE_ENV: '', TEACHER_PASSWORD: SUP, SESSION_SECRET: 'test-session-secret-value-at-least-32-chars' } });
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

test('pages and background image are served', async t => {
  const { call } = await launch(t);
  for (const p of ['/', '/jury', '/director']) assert.equal((await call('x', p)).status, 200);
  const img = await call('x', '/images/campus.webp'); assert.equal(img.status, 200); assert.equal(img.type, 'image/webp');
  assert.equal((await call('x', '/server.js')).status, 404);
  const s = (await call('x', '/api/session')).data;
  assert.equal(s.role, null); assert.deepEqual(s.teams.map(x => x.name), NAMES); assert.ok(s.teams.every(x => !x.done));
});

test('a teacher picks the team without any login, takes the test once and sees the result', async t => {
  const { call } = await launch(t);
  assert.equal((await call('t4', '/api/team')).status, 401);
  assert.equal((await call('t4', '/api/team/enter', 'POST', { slot: 8 })).data.error, 'team_required');
  assert.equal((await call('t4', '/api/team/enter', 'POST', { slot: 4 })).data.done, false);
  let me = (await call('t4', '/api/team')).data;
  assert.equal(me.name, 'Тапқыр'); assert.equal(me.quiz, null); assert.equal(me.questions.length, 20);
  assert.ok(me.questions.every(q => q.correct === undefined), 'answers hidden before finishing');
  assert.equal((await call('t4', '/api/team/quiz', 'POST', { answers: Array(19).fill(0) })).data.error, 'answer_all');
  const r = await call('t4', '/api/team/quiz', 'POST', { answers: correct });
  assert.equal(r.data.score, 20);
  assert.equal((await call('t4', '/api/team/quiz', 'POST', { answers: correct })).data.error, 'quiz_already_done');
  me = (await call('t4', '/api/team')).data;
  assert.equal(me.quiz.score, 20); assert.equal(me.quiz.level, 'high'); assert.equal(me.questions[0].correct, QUESTIONS[0].correct);
  // another device picking the same team sees the finished result, cannot retake
  assert.equal((await call('other', '/api/team/enter', 'POST', { slot: 4 })).data.done, true);
  assert.equal((await call('other', '/api/team/quiz', 'POST', { answers: correct })).data.error, 'quiz_already_done');
  const s = (await call('x', '/api/session')).data;
  assert.equal(s.teams[3].done, true); assert.equal(s.teams[0].done, false);
  // no jury data for teachers
  assert.equal((await call('t4', '/api/jury')).status, 401);
});

test('jury only observes: sees every team and the test results; admin can reset a test and start a new round', async t => {
  const { call } = await launch(t);
  await call('t1', '/api/team/enter', 'POST', { slot: 1 });
  await call('t1', '/api/team/quiz', 'POST', { answers: Array(20).fill(0) });
  await call('t3', '/api/team/enter', 'POST', { slot: 3 });
  await call('t3', '/api/team/quiz', 'POST', { answers: correct });
  await call('t2', '/api/team/enter', 'POST', { slot: 2 });
  assert.equal((await call('j', '/api/jury/login', 'POST', { login: 'admin', password: 'wrong' })).status, 401);
  assert.equal((await call('own', '/api/jury/login', 'POST', { login: 'admin', password: SUP })).status, 200);
  assert.equal((await call('own', '/api/jury/accounts', 'POST', { action: 'create', name: 'Жюри Бір', login: 'jury1', password: 'Jury-pass-2026' })).status, 200);
  assert.equal((await call('j', '/api/jury/login', 'POST', { login: 'jury1', password: 'Jury-pass-2026' })).status, 200);
  assert.equal((await call('j', '/api/session')).data.role, 'jury');
  const jury = (await call('j', '/api/jury')).data;
  assert.equal(jury.teams.length, 7); assert.equal(jury.owner, false);
  assert.equal(jury.teams[2].quiz.score, 20); assert.equal(jury.teams[1].entered, true); assert.equal(jury.teams[1].quiz, null); assert.equal(jury.teams[3].entered, false);
  assert.equal(jury.teams[0].grade, undefined, 'no grading any more');
  assert.equal(jury.ranking[0].name, 'Cash Flow (денежный поток)', 'ranking by test score');
  assert.equal(jury.ranking[0].test.score, 20);
  // nothing to change for the jury: no grading, no test editing, no reset
  assert.equal((await call('j', '/api/jury/grade', 'POST', { slot: 1, rubric: { analysis: 1, calculation: 1, decision: 1, defense: 1 } })).status, 404);
  assert.equal((await call('j', '/api/jury/questions', 'POST', { reset: true })).status, 404);
  assert.equal((await call('j', '/api/jury/team', 'POST', { slot: 1, action: 'reset-test' })).data.error, 'owner_only');
  assert.equal((await call('j', '/api/jury/new-round', 'POST', { confirm: 'NEW ROUND' })).data.error, 'owner_only');
  const csv = (await call('j', '/api/jury/csv')).data; assert.ok(csv.includes('Cash Flow') && csv.includes('Агенты роста'));
  // admin: reset one team's test; its device session ends, the test can be taken again
  assert.equal((await call('own', '/api/jury/team', 'POST', { slot: 1, action: 'reset-test' })).status, 200);
  assert.equal((await call('t1', '/api/team')).status, 401);
  await call('t1', '/api/team/enter', 'POST', { slot: 1 });
  assert.equal((await call('t1', '/api/team/quiz', 'POST', { answers: correct })).data.score, 20);
  // admin: new round archives and clears everything
  assert.equal((await call('own', '/api/jury/new-round', 'POST', {})).status, 400);
  assert.equal((await call('own', '/api/jury/new-round', 'POST', { confirm: 'NEW ROUND' })).data.round, 2);
  const after = (await call('j', '/api/jury')).data;
  assert.equal(after.round, 2); assert.ok(after.teams.every(x => !x.quiz));
  assert.equal(after.history[0].teams[2].test.score, 20);
  assert.equal((await call('t1', '/api/team')).status, 401, 'teachers choose again in a new round');
});

test('admin manages jury logins; a removed login stops working', async t => {
  const { call } = await launch(t);
  await call('own', '/api/jury/login', 'POST', { login: 'admin', password: SUP });
  assert.equal((await call('own', '/api/jury/accounts', 'POST', { action: 'create', name: 'Жюри Бір', login: 'jury1', password: 'short' })).data.error, 'password_too_short_8');
  assert.equal((await call('own', '/api/jury/accounts', 'POST', { action: 'create', name: 'Жюри Бір', login: 'jury1', password: 'Jury-pass-2026' })).status, 200);
  assert.equal((await call('j1', '/api/jury/login', 'POST', { login: 'jury1', password: 'nope-nope' })).status, 401);
  assert.equal((await call('j1', '/api/jury/login', 'POST', { login: 'JURY1', password: 'Jury-pass-2026' })).status, 200);
  const j = (await call('j1', '/api/jury')).data; assert.equal(j.owner, false); assert.equal(j.actor, 'Жюри Бір'); assert.equal(j.juries, null);
  assert.equal((await call('j1', '/api/jury/accounts', 'POST', { action: 'create', name: 'X Y Z', login: 'other', password: 'Jury-pass-2026' })).status, 403);
  assert.equal((await call('own', '/api/jury')).data.juries[0].login, 'jury1');
  assert.equal((await call('own', '/api/jury/accounts', 'POST', { action: 'delete', login: 'jury1' })).status, 200);
  assert.equal((await call('j1', '/api/jury')).status, 401);
});

test('earlier data: the old record is kept and can be downloaded', async t => {
  const legacy = { schema: 3, round: 4, teacherHash: '', officialAnswerKeys: keys, teacherAttempts: [{ name: 'Старый тест', score: 15, total: 20, finishedAt: '2026-11-19T10:00:00.000Z' }], teams: [{ id: 1, name: 'A', pin_hash: 'x', pin_cipher: 'y' }] };
  const { call } = await launch(t, { legacy });
  await call('j', '/api/jury/login', 'POST', { login: 'admin', password: SUP });
  const j = (await call('j', '/api/jury')).data;
  assert.equal(j.hasLegacy, true);
  const backup = await call('j', '/api/jury/legacy-export'); assert.equal(backup.status, 200); assert.equal(backup.data.round, 4); assert.equal(backup.data.teams[0].pin_hash, undefined);
});

test('a v5 database (teacher accounts, director login) upgrades without losing the director login', async t => {
  const c = require('node:crypto'), salt = c.randomBytes(16).toString('hex'), passHash = salt + ':' + c.scryptSync('Director-2026', salt, 32).toString('hex');
  const v5 = { config: { schema: 5, answerKeys: {}, supEpoch: 1, legacyAttempts: [], directors: { director: { login: 'director', name: 'Директор', passHash, epoch: 1, createdAt: '2026-11-19T14:00:00Z' } } }, 'teacher:1': { id: 1, name: 'Old', teams: [] } };
  const { call } = await launch(t, { v5 });
  assert.equal((await call('d', '/api/jury/login', 'POST', { login: 'director', password: 'Director-2026' })).status, 200);
  const j = (await call('d', '/api/jury')).data; assert.equal(j.round, 1); assert.equal(j.teams.length, 7);
});

test('open pages get a live event right after a change', async t => {
  const { call, base } = await launch(t);
  const ctrl = new AbortController(); t.after(() => ctrl.abort());
  const res = await fetch(base + '/api/events', { signal: ctrl.signal });
  assert.equal(res.headers.get('content-type'), 'text/event-stream; charset=utf-8');
  const reader = res.body.getReader(), dec = new TextDecoder(); let text = '';
  const waitFor = async needle => { const end = Date.now() + 3000; while (!text.includes(needle)) { if (Date.now() > end) throw new Error('no event: ' + text); const { value } = await reader.read(); text += dec.decode(value); } };
  await call('t', '/api/team/enter', 'POST', { slot: 6 });
  await waitFor('"team":6');
  await call('t', '/api/team/quiz', 'POST', { answers: correct });
  await call('j', '/api/jury/login', 'POST', { login: 'admin', password: SUP });
  await call('j', '/api/jury/new-round', 'POST', { confirm: 'NEW ROUND' });
  await waitFor('"config":true');
});

test('Excel report: championship title, ranking and answers sheets', async t => {
  const ExcelJS = require('exceljs');
  const { call, base } = await launch(t);
  await call('t3', '/api/team/enter', 'POST', { slot: 3 });
  await call('t3', '/api/team/quiz', 'POST', { answers: correct });
  await call('t1', '/api/team/enter', 'POST', { slot: 1 });
  await call('t1', '/api/team/quiz', 'POST', { answers: Array(20).fill(0) });
  assert.equal((await call('x', '/api/jury/xlsx')).status, 401);
  // download with the jury cookie (binary, so fetch directly)
  const login = await fetch(base + '/api/jury/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login: 'admin', password: SUP }) });
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const file = await fetch(base + '/api/jury/xlsx', { headers: { cookie } });
  assert.equal(file.status, 200);
  assert.match(file.headers.get('content-type'), /spreadsheetml/);
  const wb = new ExcelJS.Workbook(); await wb.xlsx.load(Buffer.from(await file.arrayBuffer()));
  const ws = wb.worksheets[0];
  assert.match(ws.getCell('A1').value, /Экономикалық альянс: педагог және студенттер/);
  assert.match(ws.getCell('A2').value, /Областной чемпионат «Экономический альянс: педагог и студенты»/);
  assert.equal(ws.getCell('B6').value, 'Cash Flow (денежный поток)'); assert.equal(ws.getCell('C6').value, 20);
  assert.equal(ws.getCell('B7').value, 'Агенты роста');
  assert.equal(wb.worksheets[1].getCell('C8').value, '✓', 'answers sheet: team 3, question 1');
});
