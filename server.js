'use strict';
// Economic Relay v5 — personal teacher accounts, a supervisor who oversees them,
// and the bilingual (RU/KK) team cases for students. Node 22+.
// Storage: PostgreSQL (DATABASE_URL) or a local JSON file for development.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { URL } = require('node:url');

const PORT = Number(process.env.PORT || 3000);
const PROD = process.env.NODE_ENV === 'production';
const SECRET = process.env.SESSION_SECRET || 'development-only-change-this-secret-before-deployment';
// TEACHER_PASSWORD (kept for Render compatibility) is the supervisor's password.
const SUPERVISOR_PASSWORD = process.env.SUPERVISOR_PASSWORD || process.env.TEACHER_PASSWORD || '';
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
if (PROD && (SECRET.length < 24 || !SUPERVISOR_PASSWORD)) {
  console.error('Set SESSION_SECRET (24+ characters) and TEACHER_PASSWORD in Render Environment.');
  process.exit(1);
}

const QUESTIONS = require('./teacher-test.json');
const OFFICIAL = require('./official-team-assignments.json');
const CASES = new Map(OFFICIAL.teams.map(t => [t.id, t]));
const RUBRIC = { analysis: 10, calculation: 15, decision: 15, defense: 10 };
const MAX_SCORE = 50;

// ---------- helpers ----------
function err(code, status = 400) { const e = new Error(code); e.status = status; throw e; }
const clean = (v, max = 6000) => String(v ?? '').trim().slice(0, max);
const now = () => new Date().toISOString();
function hash(text) { const salt = crypto.randomBytes(16).toString('hex'); return salt + ':' + crypto.scryptSync(String(text), salt, 32).toString('hex'); }
function verify(text, encoded) {
  try { const [salt, ok] = String(encoded).split(':'); const a = crypto.scryptSync(String(text), salt, 32), b = Buffer.from(ok, 'hex'); return a.length === b.length && crypto.timingSafeEqual(a, b); }
  catch { return false; }
}
function safeSame(a, b) { const x = crypto.createHash('sha256').update(String(a)).digest(), y = crypto.createHash('sha256').update(String(b)).digest(); return crypto.timingSafeEqual(x, y); }
const AES_KEY = crypto.createHash('sha256').update(SECRET).digest();
function encrypt(text) { const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', AES_KEY, iv); const body = Buffer.concat([c.update(String(text), 'utf8'), c.final()]); return [iv, c.getAuthTag(), body].map(x => x.toString('base64url')).join('.'); }
function decrypt(s) { try { const [a, b, c] = s.split('.'); const d = crypto.createDecipheriv('aes-256-gcm', AES_KEY, Buffer.from(a, 'base64url')); d.setAuthTag(Buffer.from(b, 'base64url')); return Buffer.concat([d.update(Buffer.from(c, 'base64url')), d.final()]).toString('utf8'); } catch { return ''; } }
const newPin = () => String(crypto.randomInt(1000, 10000));
const level = score => score >= 18 ? 'high' : score >= 14 ? 'good' : score >= 10 ? 'basic' : 'repeat';

// ---------- key/value store: PostgreSQL or local JSON ----------
let pool = null, local = null, localFile = '', lock = Promise.resolve();
function writeLocal() { const tmp = localFile + '.new'; fs.writeFileSync(tmp, JSON.stringify(Object.fromEntries(local))); fs.renameSync(tmp, localFile); }
const store = {
  async get(k) {
    if (pool) { const r = await pool.query('SELECT v FROM relay_kv WHERE k=$1', [k]); return r.rows[0]?.v ?? null; }
    return local.has(k) ? structuredClone(local.get(k)) : null;
  },
  async list(prefix) {
    if (pool) { const r = await pool.query("SELECT v FROM relay_kv WHERE k LIKE $1 ESCAPE '\\' ORDER BY k", [prefix.replace(/[\\%_]/g, '\\$&') + '%']); return r.rows.map(x => x.v); }
    return [...local.entries()].filter(([k]) => k.startsWith(prefix)).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => structuredClone(v));
  },
  // Runs fn atomically. t.get locks the row; t.set / t.del / t.insert are applied on commit.
  async tx(fn) {
    if (pool) {
      const c = await pool.connect();
      try {
        await c.query('BEGIN');
        const t = {
          async get(k) { const r = await c.query('SELECT v FROM relay_kv WHERE k=$1 FOR UPDATE', [k]); return r.rows[0]?.v ?? null; },
          async set(k, v) { await c.query('INSERT INTO relay_kv(k,v) VALUES($1,$2) ON CONFLICT(k) DO UPDATE SET v=EXCLUDED.v, updated_at=now()', [k, JSON.stringify(v)]); },
          async insert(k, v) { const r = await c.query('INSERT INTO relay_kv(k,v) VALUES($1,$2) ON CONFLICT(k) DO NOTHING', [k, JSON.stringify(v)]); return r.rowCount === 1; },
          async del(k) { await c.query('DELETE FROM relay_kv WHERE k=$1', [k]); },
          async delPrefix(p) { await c.query("DELETE FROM relay_kv WHERE k LIKE $1 ESCAPE '\\'", [p.replace(/[\\%_]/g, '\\$&') + '%']); },
        };
        const out = await fn(t);
        await c.query('COMMIT');
        return out;
      } catch (e) { await c.query('ROLLBACK').catch(() => {}); throw e; }
      finally { c.release(); }
    }
    const run = lock.then(async () => {
      const draft = new Map(local);
      const t = {
        async get(k) { return draft.has(k) ? structuredClone(draft.get(k)) : null; },
        async set(k, v) { draft.set(k, structuredClone(v)); },
        async insert(k, v) { if (draft.has(k)) return false; draft.set(k, structuredClone(v)); return true; },
        async del(k) { draft.delete(k); },
        async delPrefix(p) { for (const k of [...draft.keys()]) if (k.startsWith(p)) draft.delete(k); },
      };
      const out = await fn(t);
      local = draft; writeLocal();
      return out;
    });
    lock = run.catch(() => {});
    return run;
  },
};

function defaultConfig() { return { schema: 5, regCode: '', answerKeys: {}, supervisorHash: '', supEpoch: 1, nextTeacherId: 1, legacyAttempts: [], createdAt: now() }; }

// Earlier versions kept everything in one row. Leave it untouched and copy over what still applies.
function migrateLegacy(cfg, old) {
  if (!old || typeof old !== 'object') return cfg;
  if (old.officialAnswerKeys && !Object.keys(cfg.answerKeys).length) cfg.answerKeys = old.officialAnswerKeys;
  if (old.teacherHash && !cfg.supervisorHash) cfg.supervisorHash = old.teacherHash;
  if (Array.isArray(old.teacherAttempts)) cfg.legacyAttempts = old.teacherAttempts.map(a => ({ name: a.name, score: a.score, total: a.total, finishedAt: a.finishedAt }));
  cfg.hasLegacy = true;
  return cfg;
}

async function initStore() {
  if (process.env.DATABASE_URL) {
    const { Pool } = require('pg');
    pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 12000 });
    await pool.query('CREATE TABLE IF NOT EXISTS relay_kv (k TEXT PRIMARY KEY, v JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())');
    if (!(await store.get('config'))) {
      let old = null;
      const exists = (await pool.query("SELECT to_regclass('public.economic_relay_state') AS t")).rows[0].t;
      if (exists) old = (await pool.query('SELECT payload FROM economic_relay_state WHERE id=1')).rows[0]?.payload || null;
      await store.tx(async t => { if (!(await t.get('config'))) await t.set('config', migrateLegacy(defaultConfig(), old)); });
      console.log(old ? 'Created v5 storage; earlier lesson data kept untouched in economic_relay_state.' : 'Created v5 storage.');
    }
    console.log('Persistent PostgreSQL storage connected.');
  } else {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    localFile = path.join(DATA_DIR, 'relay-v5.json');
    local = new Map(fs.existsSync(localFile) ? Object.entries(JSON.parse(fs.readFileSync(localFile, 'utf8'))) : []);
    if (!local.has('config')) {
      const oldFile = path.join(DATA_DIR, 'relay-data.json');
      const old = fs.existsSync(oldFile) ? JSON.parse(fs.readFileSync(oldFile, 'utf8')) : null;
      local.set('config', migrateLegacy(defaultConfig(), old));
      writeLocal();
    }
    console.warn('Local JSON storage active. Add DATABASE_URL for real classes (Render Free restarts delete local data).');
  }
}
async function legacyPayload() {
  if (pool) {
    const exists = (await pool.query("SELECT to_regclass('public.economic_relay_state') AS t")).rows[0].t;
    return exists ? (await pool.query('SELECT payload FROM economic_relay_state WHERE id=1')).rows[0]?.payload || null : null;
  }
  const f = path.join(DATA_DIR, 'relay-data.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
}

// ---------- sessions ----------
const COOKIE = 'economic_relay_session';
function sign(payload) { const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 1000 * 60 * 60 * 24 * 14 })).toString('base64url'); return body + '.' + crypto.createHmac('sha256', SECRET).update(body).digest('base64url'); }
function readToken(req) {
  try {
    const v = String(req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(COOKIE + '='));
    if (!v) return null;
    const [body, mac] = v.slice(COOKIE.length + 1).split('.');
    const want = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
    const a = Buffer.from(mac || ''), b = Buffer.from(want);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const obj = JSON.parse(Buffer.from(body, 'base64url').toString());
    return obj.exp > Date.now() ? obj : null;
  } catch { return null; }
}
function setAuth(res, payload) { res.setHeader('Set-Cookie', `${COOKIE}=${sign(payload)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 14}${PROD ? '; Secure' : ''}`); }
function clearAuth(res) { res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${PROD ? '; Secure' : ''}`); }

function teacherOk(tok, t) { return !!t && !t.blocked && tok?.role === 'teacher' && tok.id === t.id && tok.epoch === t.epoch; }
function supervisorOk(tok, cfg) { return tok?.role === 'supervisor' && tok.epoch === cfg.supEpoch; }
async function needTeacher(req) {
  const tok = readToken(req); if (tok?.role !== 'teacher') err('not_authorized', 401);
  const t = await store.get('teacher:' + tok.id); if (!teacherOk(tok, t)) err('session_expired', 401);
  return t;
}
async function needSupervisor(req) {
  const tok = readToken(req), cfg = await store.get('config');
  if (!supervisorOk(tok, cfg)) err('not_authorized', 401);
  return cfg;
}
function studentOf(tok, t) {
  if (tok?.role !== 'student' || !t || t.blocked || tok.tid !== t.id || tok.round !== t.round) return null;
  const team = t.teams.find(x => x.id === tok.teamId);
  const m = team?.members.find(x => x.id === tok.memberId);
  return m ? { team, m } : null;
}

// ---------- domain ----------
function makeTeams(count, old = []) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1, officialId: i + 1,
    name: old[i]?.name || `Команда ${i + 1}`,
    pin: old[i]?.pin || encrypt(newPin()),
    members: [], submission: null,
  }));
}
async function uniqueClassCode(t) {
  for (let i = 0; i < 40; i++) { const code = String(crypto.randomInt(100000, 1000000)); if (await t.insert('class:' + code, { code })) return code; }
  err('server_busy', 503);
}
function caseContent(id) { const c = CASES.get(id); return c ? { ru: c.ru, kk: c.kk } : null; }
function teamScore(team) { return Number.isInteger(team.submission?.score) ? team.submission.score : null; }
function leaderboard(t) {
  return t.teams.map(x => ({ id: x.id, name: x.name, members: x.members.length, submitted: !!x.submission, score: teamScore(x) }))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || a.id - b.id);
}
function quizPublic() { return QUESTIONS.map(q => ({ id: q.id, ru: q.ru, kk: q.kk, options_ru: q.options_ru, options_kk: q.options_kk })); }
function teacherView(t, cfg, { forSupervisor = false } = {}) {
  return {
    id: t.id, name: t.name, login: t.login, createdAt: t.createdAt, lastLoginAt: t.lastLoginAt, blocked: !!t.blocked,
    classCode: t.classCode, round: t.round, phase: t.phase,
    quiz: t.quiz, attempts: t.attempts || [],
    questions: t.quiz ? QUESTIONS : quizPublic(),
    teams: t.teams.map(x => ({
      id: x.id, name: x.name, officialId: x.officialId, pin: forSupervisor ? undefined : decrypt(x.pin),
      members: x.members, case: caseContent(x.officialId),
      submission: x.submission ? { ...x.submission } : null,
    })),
    leaderboard: leaderboard(t), history: t.history || [],
    answerKeys: cfg.answerKeys || {},
    ...(forSupervisor ? {} : { instructions: OFFICIAL.instructions }),
  };
}
function teacherSummary(t) {
  const sub = t.teams.filter(x => x.submission).length, graded = t.teams.filter(x => Number.isInteger(x.submission?.score)).length;
  const scores = t.teams.map(teamScore).filter(Number.isInteger);
  const last = (t.attempts || [])[0];
  return {
    id: t.id, name: t.name, login: t.login, blocked: !!t.blocked, createdAt: t.createdAt, lastLoginAt: t.lastLoginAt,
    phase: t.phase, round: t.round, classCode: t.classCode, teams: t.teams.length,
    students: t.teams.reduce((n, x) => n + x.members.length, 0), submitted: sub, graded,
    avgTeamScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : null,
    quizScore: t.quiz?.score ?? null, lastAttempt: last || null, attempts: (t.attempts || []).length,
    lessons: (t.history || []).length,
  };
}
function checkPhoto(data) {
  if (!data) return null;
  if (typeof data !== 'string' || data.length > 3900000) err('image_too_large', 413);
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(data); if (!m) err('invalid_image');
  const bytes = Buffer.from(m[2], 'base64'); if (bytes.length > 2700000 || bytes.length < 12) err('image_too_large', 413);
  const type = m[1], hex = bytes.subarray(0, 12).toString('hex');
  if (!(type === 'image/png' && hex.startsWith('89504e470d0a1a0a') || type === 'image/jpeg' && hex.startsWith('ffd8') || type === 'image/webp' && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP')) err('invalid_image');
  return { type, data: bytes.toString('base64') };
}
function sanitizedAnswerKeys(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) err('invalid_answer_key');
  const out = {};
  for (let i = 1; i <= 10; i++) {
    const item = value[i]; if (!item || typeof item !== 'object') err('invalid_answer_key');
    out[i] = {};
    for (const l of ['ru', 'kk']) {
      if (!Array.isArray(item[l]) || item[l].length !== 3) err('invalid_answer_key');
      out[i][l] = item[l].map(v => { const s = clean(v, 3500); if (!s) err('invalid_answer_key'); return s; });
    }
  }
  return out;
}
function validLogin(v) { const s = clean(v, 60).toLowerCase(); if (!/^[a-z0-9._@-]{3,40}$/.test(s)) err('login_format'); return s; }
function csvCell(v) { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replaceAll('"', '""') + '"'; }
function csv(res, name, rows) { const body = '﻿' + rows.map(r => r.map(csvCell).join(',')).join('\r\n'); res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${name}"`, 'Cache-Control': 'no-store' }); res.end(body); }

// ---------- http ----------
function send(res, status, data, headers = {}) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers }); res.end(JSON.stringify(data)); }
async function readBody(req, max = 4500000) {
  let size = 0; const chunks = [];
  for await (const c of req) { size += c.length; if (size > max) err('request_too_large', 413); chunks.push(c); }
  let b; try { b = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { err('invalid_json'); }
  if (!b || typeof b !== 'object' || Array.isArray(b)) err('invalid_json');
  return b;
}
const rate = new Map();
function limit(req, key, max) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '?').split(',')[0].trim();
  const k = ip + ':' + key, t = Date.now(), recent = (rate.get(k) || []).filter(x => x > t - 600000);
  if (recent.length >= max) err('try_later', 429);
  recent.push(t); rate.set(k, recent);
  if (rate.size > 5000) for (const [id, v] of rate) if (v.every(x => x < t - 600000)) rate.delete(id);
}
const STATIC = {
  '/': ['index.html', 'text/html; charset=utf-8'], '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8'], '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/images/campus.webp': ['images/campus.webp', 'image/webp'],
};
function originOf(req) { return clean(process.env.PUBLIC_URL || `${PROD ? 'https' : (req.headers['x-forwarded-proto'] || 'http')}://${req.headers.host || 'localhost:' + PORT}`, 500).replace(/\/$/, ''); }

async function handle(req, res) {
  const url = new URL(req.url || '/', 'http://localhost'), p = url.pathname, method = req.method;
  if (method === 'GET' && STATIC[p]) {
    const [file, type] = STATIC[p];
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': type.startsWith('image') ? 'public,max-age=86400' : 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    return res.end(fs.readFileSync(path.join(__dirname, file)));
  }
  if (method === 'GET' && p === '/health') return send(res, 200, { ok: true, storage: pool ? 'postgres' : 'local' });

  // ----- session / auth -----
  if (method === 'GET' && p === '/api/session') {
    const tok = readToken(req), cfg = await store.get('config');
    const base = { regCodeRequired: !!cfg.regCode };
    if (tok?.role === 'supervisor' && supervisorOk(tok, cfg)) return send(res, 200, { ...base, role: 'supervisor' });
    if (tok?.role === 'teacher') { const t = await store.get('teacher:' + tok.id); if (teacherOk(tok, t)) return send(res, 200, { ...base, role: 'teacher', name: t.name }); }
    if (tok?.role === 'student') { const t = await store.get('teacher:' + tok.tid); if (studentOf(tok, t)) return send(res, 200, { ...base, role: 'student' }); }
    return send(res, 200, { ...base, role: null });
  }
  if (method === 'POST' && p === '/api/logout') { clearAuth(res); return send(res, 200, { ok: true }); }
  if (method === 'POST' && p === '/api/supervisor/login') {
    limit(req, 'sup-login', 15);
    const b = await readBody(req, 5000), pass = clean(b.password, 300), cfg = await store.get('config');
    const ok = pass && ((SUPERVISOR_PASSWORD && safeSame(pass, SUPERVISOR_PASSWORD)) || (cfg.supervisorHash && verify(pass, cfg.supervisorHash)));
    if (!ok) err('incorrect_password', 401);
    setAuth(res, { role: 'supervisor', epoch: cfg.supEpoch });
    return send(res, 200, { ok: true });
  }
  if (method === 'POST' && p === '/api/teacher/register') {
    limit(req, 'register', 10);
    const b = await readBody(req, 5000), name = clean(b.name, 120), login = validLogin(b.login), pass = clean(b.password, 200);
    if (name.length < 3) err('name_required');
    if (pass.length < 6) err('password_too_short');
    const id = await store.tx(async t => {
      const cfg = await t.get('config');
      if (cfg.regCode && !safeSame(clean(b.regCode, 60), cfg.regCode)) err('invalid_reg_code', 401);
      const tid = cfg.nextTeacherId++;
      if (!(await t.insert('login:' + login, { id: tid }))) err('login_taken', 409);
      const classCode = await uniqueClassCode(t);
      await t.set('class:' + classCode, { code: classCode, id: tid });
      await t.set('teacher:' + tid, { id: tid, name, login, passHash: hash(pass), epoch: 1, createdAt: now(), lastLoginAt: now(), blocked: false, classCode, round: 1, phase: 'setup', quiz: null, attempts: [], teams: makeTeams(7), nextMemberId: 1, history: [] });
      await t.set('config', cfg);
      return tid;
    });
    setAuth(res, { role: 'teacher', id, epoch: 1 });
    return send(res, 200, { ok: true });
  }
  if (method === 'POST' && p === '/api/teacher/login') {
    limit(req, 'teacher-login', 20);
    const b = await readBody(req, 5000), login = clean(b.login, 60).toLowerCase(), pass = clean(b.password, 200);
    const ref = await store.get('login:' + login);
    const out = await store.tx(async t => {
      const doc = ref ? await t.get('teacher:' + ref.id) : null;
      if (!doc || !verify(pass, doc.passHash)) err('incorrect_login', 401);
      if (doc.blocked) err('account_blocked', 403);
      doc.lastLoginAt = now(); await t.set('teacher:' + doc.id, doc);
      return { id: doc.id, epoch: doc.epoch };
    });
    setAuth(res, { role: 'teacher', ...out });
    return send(res, 200, { ok: true });
  }

  // ----- teacher -----
  if (p.startsWith('/api/teacher/') || p === '/api/teacher') {
    const tok = readToken(req);
    const mutate = fn => store.tx(async t => {
      const cfg = await t.get('config'), doc = tok?.role === 'teacher' ? await t.get('teacher:' + tok.id) : null;
      if (!teacherOk(tok, doc)) err('not_authorized', 401);
      const out = await fn(doc, t, cfg);
      await t.set('teacher:' + doc.id, doc);
      return out;
    });
    if (method === 'GET' && p === '/api/teacher') { const t = await needTeacher(req), cfg = await store.get('config'); return send(res, 200, teacherView(t, cfg)); }
    if (method === 'POST' && p === '/api/teacher/quiz') {
      const b = await readBody(req, 10000);
      return send(res, 200, await mutate(async d => {
        if (d.quiz) err('quiz_already_done', 409);
        if (!Array.isArray(b.answers) || b.answers.length !== QUESTIONS.length || b.answers.some((a, i) => !Number.isInteger(a) || a < 0 || a >= QUESTIONS[i].options_ru.length)) err('answer_all');
        const score = b.answers.filter((a, i) => a === QUESTIONS[i].correct).length;
        d.quiz = { answers: b.answers, score, total: QUESTIONS.length, level: level(score), finishedAt: now() };
        d.attempts = [{ round: d.round, score, total: QUESTIONS.length, level: level(score), finishedAt: d.quiz.finishedAt }, ...(d.attempts || [])].slice(0, 100);
        return { ok: true, score };
      }));
    }
    if (method === 'POST' && p === '/api/teacher/teams') {
      const b = await readBody(req, 5000), count = Number(b.count);
      if (![7, 10].includes(count)) err('team_count');
      return send(res, 200, await mutate(async d => {
        if (d.phase !== 'setup') err('setup_only', 409);
        if (d.teams.some(x => x.members.length || x.submission)) err('existing_responses', 409);
        d.teams = makeTeams(count, d.teams);
        return { ok: true };
      }));
    }
    if (method === 'POST' && p === '/api/teacher/team') {
      const b = await readBody(req, 5000), id = Number(b.teamId);
      return send(res, 200, await mutate(async d => {
        const team = d.teams.find(x => x.id === id); if (!team) err('not_found', 404);
        if (b.name !== undefined) { const n = clean(b.name, 60); if (!n) err('team_fields'); if (d.teams.some(x => x !== team && x.name.toLowerCase() === n.toLowerCase())) err('team_duplicate'); team.name = n; }
        if (b.newPin) team.pin = encrypt(newPin());
        return { ok: true };
      }));
    }
    if (method === 'POST' && p === '/api/teacher/open') {
      return send(res, 200, await mutate(async d => { if (!d.quiz) err('quiz_first', 409); if (d.phase === 'open') err('invalid_phase', 409); d.phase = 'open'; d.openedAt = now(); return { ok: true }; }));
    }
    if (method === 'POST' && p === '/api/teacher/close') {
      return send(res, 200, await mutate(async d => { if (d.phase !== 'open') err('invalid_phase', 409); d.phase = 'closed'; return { ok: true }; }));
    }
    if (method === 'POST' && p === '/api/teacher/new-round') {
      const b = await readBody(req, 5000); if (b.confirm !== 'NEW ROUND') err('confirm_required');
      return send(res, 200, await mutate(async (d, t) => {
        d.history = [{ round: d.round, finishedAt: now(), quizScore: d.quiz?.score ?? null, teams: d.teams.map(x => ({ name: x.name, officialId: x.officialId, members: x.members.map(m => m.name), score: teamScore(x), rubric: x.submission?.rubric || null, feedback: x.submission?.feedback || '', answers: x.submission?.answers || null })) }, ...(d.history || [])].slice(0, 30);
        await t.delPrefix(`photo:${d.id}:`);
        d.round++; d.phase = 'setup'; d.quiz = null;
        for (const x of d.teams) { x.members = []; x.submission = null; }
        return { ok: true };
      }));
    }
    if (method === 'POST' && p === '/api/teacher/grade') {
      const b = await readBody(req, 20000), id = Number(b.teamId);
      return send(res, 200, await mutate(async d => {
        const team = d.teams.find(x => x.id === id); if (!team?.submission) err('no_submission', 404);
        const r = b.rubric; if (!r || typeof r !== 'object') err('rubric_required');
        const vals = {};
        for (const [k, max] of Object.entries(RUBRIC)) { const v = Number(r[k]); if (r[k] === '' || r[k] == null || !Number.isInteger(v) || v < 0 || v > max) err('rubric_range'); vals[k] = v; }
        Object.assign(team.submission, { rubric: vals, score: Object.values(vals).reduce((a, v) => a + v, 0), feedback: clean(b.feedback, 1500), gradedAt: now() });
        return { ok: true, score: team.submission.score };
      }));
    }
    if (method === 'POST' && p === '/api/teacher/member') {
      const b = await readBody(req, 5000), id = Number(b.teamId), mid = Number(b.memberId);
      return send(res, 200, await mutate(async d => {
        const team = d.teams.find(x => x.id === id), m = team?.members.find(x => x.id === mid); if (!m) err('member_not_found', 404);
        if (b.action === 'captain') team.members.forEach(x => x.isCaptain = x.id === mid);
        else if (b.action === 'remove') { team.members = team.members.filter(x => x.id !== mid); if (team.members.length && !team.members.some(x => x.isCaptain)) team.members[0].isCaptain = true; }
        else err('invalid_action');
        return { ok: true };
      }));
    }
    if (method === 'POST' && p === '/api/teacher/password') {
      const b = await readBody(req, 5000), old = clean(b.old, 200), next = clean(b.next, 200);
      if (next.length < 6) err('password_too_short');
      const out = await mutate(async d => { if (!verify(old, d.passHash)) err('incorrect_password', 401); d.passHash = hash(next); d.epoch++; return { id: d.id, epoch: d.epoch }; });
      setAuth(res, { role: 'teacher', ...out });
      return send(res, 200, { ok: true });
    }
    if (method === 'GET' && p === '/api/teacher/csv') {
      const d = await needTeacher(req);
      return csv(res, `class-${d.classCode}-round-${d.round}.csv`, [
        ['Команда', 'Кейс', 'Участники', 'Этап 1 (10)', 'Этап 2 (15)', 'Этап 3 (15)', 'Защита (10)', 'Итого (50)', 'Комментарий', 'Ответ: этап 1', 'Ответ: этап 2', 'Ответ: этап 3'],
        ...d.teams.map(x => [x.name, CASES.get(x.officialId)?.ru.title || '', x.members.map(m => m.name).join('; '), x.submission?.rubric?.analysis ?? '', x.submission?.rubric?.calculation ?? '', x.submission?.rubric?.decision ?? '', x.submission?.rubric?.defense ?? '', teamScore(x) ?? '', x.submission?.feedback || '', ...(x.submission?.answers || ['', '', ''])]),
      ]);
    }
    return err('not_found', 404);
  }

  // ----- supervisor -----
  if (p.startsWith('/api/supervisor')) {
    const cfg = await needSupervisor(req);
    if (method === 'GET' && p === '/api/supervisor') {
      const teachers = (await store.list('teacher:')).map(teacherSummary).sort((a, b) => a.name.localeCompare(b.name));
      return send(res, 200, { teachers, regCode: cfg.regCode, answerKeyCount: Object.keys(cfg.answerKeys || {}).length, legacyAttempts: cfg.legacyAttempts || [], hasLegacy: !!cfg.hasLegacy, storage: pool ? 'postgres' : 'local' });
    }
    const one = /^\/api\/supervisor\/teacher\/(\d+)$/.exec(p);
    if (method === 'GET' && one) { const t = await store.get('teacher:' + one[1]); if (!t) err('not_found', 404); return send(res, 200, teacherView(t, cfg, { forSupervisor: true })); }
    if (method === 'POST' && p === '/api/supervisor/teacher') {
      const b = await readBody(req, 5000), id = Number(b.id);
      return send(res, 200, await store.tx(async t => {
        const d = await t.get('teacher:' + id); if (!d) err('not_found', 404);
        if (b.action === 'reset') { const pass = clean(b.password, 200); if (pass.length < 6) err('password_too_short'); d.passHash = hash(pass); d.epoch++; d.blocked = false; }
        else if (b.action === 'block') { d.blocked = true; d.epoch++; }
        else if (b.action === 'unblock') d.blocked = false;
        else if (b.action === 'delete') {
          if (b.confirm !== 'DELETE') err('confirm_required');
          await t.del('teacher:' + id); await t.del('login:' + d.login); await t.del('class:' + d.classCode); await t.delPrefix(`photo:${id}:`);
          return { ok: true };
        } else err('invalid_action');
        await t.set('teacher:' + id, d);
        return { ok: true };
      }));
    }
    if (method === 'POST' && p === '/api/supervisor/create-teacher') {
      const b = await readBody(req, 5000), name = clean(b.name, 120), login = validLogin(b.login), pass = clean(b.password, 200);
      if (name.length < 3) err('name_required'); if (pass.length < 6) err('password_too_short');
      return send(res, 200, await store.tx(async t => {
        const c = await t.get('config'), tid = c.nextTeacherId++;
        if (!(await t.insert('login:' + login, { id: tid }))) err('login_taken', 409);
        const classCode = await uniqueClassCode(t);
        await t.set('class:' + classCode, { code: classCode, id: tid });
        await t.set('teacher:' + tid, { id: tid, name, login, passHash: hash(pass), epoch: 1, createdAt: now(), lastLoginAt: null, blocked: false, classCode, round: 1, phase: 'setup', quiz: null, attempts: [], teams: makeTeams(7), nextMemberId: 1, history: [] });
        await t.set('config', c);
        return { ok: true, id: tid };
      }));
    }
    if (method === 'POST' && p === '/api/supervisor/settings') {
      const b = await readBody(req, 5000), code = clean(b.regCode, 60);
      if (code && code.length < 4) err('code_too_short');
      return send(res, 200, await store.tx(async t => { const c = await t.get('config'); c.regCode = code; await t.set('config', c); return { ok: true }; }));
    }
    if (method === 'POST' && p === '/api/supervisor/answers') {
      const b = await readBody(req, 250000), keys = sanitizedAnswerKeys(b.answerKeys);
      return send(res, 200, await store.tx(async t => { const c = await t.get('config'); c.answerKeys = keys; await t.set('config', c); return { ok: true, count: 10 }; }));
    }
    if (method === 'GET' && p === '/api/supervisor/csv') {
      const list = (await store.list('teacher:')).map(teacherSummary);
      return csv(res, 'teachers.csv', [
        ['ФИО', 'Логин', 'Тест (из 20)', 'Уровень', 'Дата теста', 'Попыток', 'Статус', 'Код класса', 'Команд', 'Студентов', 'Сдано', 'Оценено', 'Средний балл команд (из 50)', 'Проведено занятий', 'Последний вход', 'Заблокирован'],
        ...list.map(x => [x.name, x.login, x.lastAttempt?.score ?? '', x.lastAttempt?.level ?? '', x.lastAttempt?.finishedAt ?? '', x.attempts, x.phase, x.classCode, x.teams, x.students, x.submitted, x.graded, x.avgTeamScore ?? '', x.lessons, x.lastLoginAt || '', x.blocked ? 'да' : '']),
      ]);
    }
    if (method === 'GET' && p === '/api/supervisor/legacy-export') {
      const old = await legacyPayload(); if (!old) err('not_found', 404);
      const body = JSON.stringify({ ...old, teacherHash: undefined, teams: (old.teams || []).map(t => ({ ...t, pin_hash: undefined, pin_cipher: undefined })) }, null, 2);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': 'attachment; filename="economic-relay-v4-backup.json"', 'Cache-Control': 'no-store' });
      return res.end(body);
    }
    return err('not_found', 404);
  }

  // ----- students -----
  const classInfo = /^\/api\/class\/(\d{6})$/.exec(p);
  if (method === 'GET' && classInfo) {
    limit(req, 'class-info', 300);
    const ref = await store.get('class:' + classInfo[1]), t = ref?.id ? await store.get('teacher:' + ref.id) : null;
    if (!t || t.blocked) err('class_not_found', 404);
    const visible = t.phase !== 'setup';
    return send(res, 200, { code: t.classCode, teacher: t.name, phase: t.phase, teams: visible ? t.teams.map(x => ({ id: x.id, name: x.name })) : [], leaderboard: visible ? leaderboard(t) : [] });
  }
  if (method === 'POST' && p === '/api/student/join') {
    limit(req, 'join', 200);
    const b = await readBody(req, 5000), code = clean(b.code, 6), name = clean(b.name, 90), teamId = Number(b.teamId), pin = clean(b.pin, 20);
    if (name.length < 2) err('name_required');
    const ref = /^\d{6}$/.test(code) ? await store.get('class:' + code) : null;
    if (!ref?.id) err('class_not_found', 404);
    const out = await store.tx(async t => {
      const d = await t.get('teacher:' + ref.id);
      if (!d || d.blocked) err('class_not_found', 404);
      if (d.phase !== 'open') err('not_open', 403);
      const team = d.teams.find(x => x.id === teamId);
      if (!team || !pin || decrypt(team.pin) !== pin) err('invalid_team_code', 401);
      if (team.members.some(m => m.name.toLocaleLowerCase() === name.toLocaleLowerCase())) err('name_taken', 409);
      const m = { id: d.nextMemberId++, name, isCaptain: team.members.length === 0, joinedAt: now() };
      team.members.push(m);
      await t.set('teacher:' + d.id, d);
      return { tid: d.id, round: d.round, teamId: team.id, memberId: m.id, captain: m.isCaptain };
    });
    setAuth(res, { role: 'student', tid: out.tid, round: out.round, teamId: out.teamId, memberId: out.memberId });
    return send(res, 200, { ok: true, captain: out.captain });
  }
  if (method === 'GET' && p === '/api/student') {
    const tok = readToken(req), t = tok?.role === 'student' ? await store.get('teacher:' + tok.tid) : null, me = studentOf(tok, t);
    if (!me) err('session_expired', 401);
    return send(res, 200, { phase: t.phase, teacher: t.name, classCode: t.classCode, tid: t.id, team: { id: me.team.id, name: me.team.name, officialId: me.team.officialId, case: caseContent(me.team.officialId), submission: me.team.submission, members: me.team.members }, me: me.m, instructions: OFFICIAL.instructions, leaderboard: leaderboard(t) });
  }
  if (method === 'POST' && p === '/api/student/submit') {
    const b = await readBody(req), tok = readToken(req);
    const answers = Array.isArray(b.answers) ? b.answers.slice(0, 3).map(x => clean(x, 5000)) : [];
    while (answers.length < 3) answers.push('');
    const photo = typeof b.photo === 'string' && b.photo ? checkPhoto(b.photo) : null;
    if (!answers.some(Boolean) && !photo) err('empty_answer');
    return send(res, 200, await store.tx(async t => {
      const d = tok?.role === 'student' ? await t.get('teacher:' + tok.tid) : null, me = studentOf(tok, d);
      if (!me) err('session_expired', 401);
      if (d.phase !== 'open') err('not_open', 403);
      if (!me.m.isCaptain) err('captain_only', 403);
      if (me.team.submission) err('already_submitted', 409);
      if (photo) await t.set(`photo:${d.id}:${d.round}:${me.team.id}`, photo);
      me.team.submission = { answers, hasPhoto: !!photo, submittedAt: now(), by: me.m.name, score: null, rubric: null, feedback: '' };
      await t.set('teacher:' + d.id, d);
      return { ok: true };
    }));
  }
  const pic = /^\/api\/photo\/(\d+)\/(\d+)$/.exec(p);
  if (method === 'GET' && pic) {
    const tid = Number(pic[1]), teamId = Number(pic[2]), tok = readToken(req), t = await store.get('teacher:' + tid);
    if (!t) err('image_not_found', 404);
    const cfg = await store.get('config');
    const allowed = teacherOk(tok, t) || supervisorOk(tok, cfg) || (studentOf(tok, t)?.team.id === teamId);
    if (!allowed) err('not_authorized', 401);
    const photo = await store.get(`photo:${tid}:${t.round}:${teamId}`); if (!photo) err('image_not_found', 404);
    const data = Buffer.from(photo.data, 'base64');
    res.writeHead(200, { 'Content-Type': photo.type, 'Content-Length': data.length, 'Content-Security-Policy': "default-src 'none'; sandbox", 'Cache-Control': 'private,no-store', 'X-Content-Type-Options': 'nosniff' });
    return res.end(data);
  }
  if (method === 'GET' && p === '/api/qr') {
    const code = /^\d{6}$/.test(url.searchParams.get('c') || '') ? url.searchParams.get('c') : '';
    const qr = require('qrcode');
    const png = await qr.toBuffer(originOf(req) + (code ? '/?c=' + code : ''), { type: 'png', width: 420, margin: 2, color: { dark: '#1f1b5cff', light: '#ffffffff' } });
    res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public,max-age=300' });
    return res.end(png);
  }
  return err('not_found', 404);
}

function start() {
  const server = http.createServer(async (req, res) => {
    try { await handle(req, res); }
    catch (e) { const status = e.status || 500; if (status === 500) console.error('Server error:', e); if (!res.headersSent) send(res, status, { error: status === 500 ? 'server_error' : e.message }); else res.end(); }
  });
  server.listen(PORT, '0.0.0.0', () => console.log(`Economic Relay v5 ready on http://localhost:${PORT}`));
}
initStore().then(start).catch(e => { console.error('Database initialization failed:', e); process.exit(1); });
