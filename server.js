'use strict';
// Economic Relay v6 — teachers pick their team (no accounts), take the test and see
// "access to the practical case is open"; the jury watches every team and grades it.
// Node 22+. Storage: PostgreSQL (DATABASE_URL) or a local JSON file for development.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { URL } = require('node:url');

const PORT = Number(process.env.PORT || 3000);
const PROD = process.env.NODE_ENV === 'production';
const SECRET = process.env.SESSION_SECRET || 'development-only-change-this-secret-before-deployment';
// TEACHER_PASSWORD (kept for Render compatibility) is the main administrator's password (login "admin").
const ADMIN_PASSWORD = process.env.SUPERVISOR_PASSWORD || process.env.TEACHER_PASSWORD || '';
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
if (PROD && (SECRET.length < 24 || !ADMIN_PASSWORD)) {
  console.error('Set SESSION_SECRET (24+ characters) and TEACHER_PASSWORD in Render Environment.');
  process.exit(1);
}

const QUESTIONS = require('./teacher-test.json');
const OFFICIAL = require('./official-team-assignments.json');
const RUBRIC = { analysis: 10, calculation: 15, decision: 15, defense: 10 };
const TEAM_NAMES = ['Агенты роста', 'Қаржы қырандары', 'Cash Flow (денежный поток)', 'Тапқыр', 'TABYSVIBE', 'Индекс удачи', 'Золотой капитал'];

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
const level = (score, total = 20) => { const r = score / total; return r >= 0.9 ? 'high' : r >= 0.7 ? 'good' : r >= 0.5 ? 'basic' : 'repeat'; };
// The jury may replace the teacher test; otherwise the original 20 questions are used.
const testOf = cfg => (Array.isArray(cfg?.questions) && cfg.questions.length ? cfg.questions : QUESTIONS);
const teamNames = cfg => (Array.isArray(cfg?.teamNames) && cfg.teamNames.length ? cfg.teamNames : TEAM_NAMES);
function validateQuestions(list) {
  if (!Array.isArray(list) || list.length < 5 || list.length > 40) err('questions_count');
  return list.map((q, i) => {
    const ru = clean(q?.ru, 500), kk = clean(q?.kk, 500), r = q?.options_ru, k = q?.options_kk, correct = Number(q?.correct);
    if (!ru || !kk || !Array.isArray(r) || !Array.isArray(k) || r.length < 2 || r.length > 5 || k.length !== r.length) err('question_incomplete');
    const options_ru = r.map(x => clean(x, 300)), options_kk = k.map(x => clean(x, 300));
    if ([...options_ru, ...options_kk].some(x => !x) || !Number.isInteger(correct) || correct < 0 || correct >= r.length) err('question_incomplete');
    return { id: i + 1, ru, kk, options_ru, options_kk, correct };
  });
}
function validLogin(v) { const s = clean(v, 60).toLowerCase(); if (!/^[a-z0-9._@-]{3,40}$/.test(s)) err('login_format'); return s; }
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
  // Runs fn atomically. t.get locks the row; writes are applied on commit.
  async tx(fn) {
    const changed = new Set();
    if (pool) {
      const c = await pool.connect();
      try {
        await c.query('BEGIN');
        const t = {
          async get(k) { const r = await c.query('SELECT v FROM relay_kv WHERE k=$1 FOR UPDATE', [k]); return r.rows[0]?.v ?? null; },
          async set(k, v) { changed.add(k); await c.query('INSERT INTO relay_kv(k,v) VALUES($1,$2) ON CONFLICT(k) DO UPDATE SET v=EXCLUDED.v, updated_at=now()', [k, JSON.stringify(v)]); },
        };
        const out = await fn(t);
        await c.query('COMMIT');
        announce(changed);
        return out;
      } catch (e) { await c.query('ROLLBACK').catch(() => {}); throw e; }
      finally { c.release(); }
    }
    const run = lock.then(async () => {
      const draft = new Map(local);
      const t = {
        async get(k) { return draft.has(k) ? structuredClone(draft.get(k)) : null; },
        async set(k, v) { changed.add(k); draft.set(k, structuredClone(v)); },
      };
      const out = await fn(t);
      local = draft; writeLocal();
      announce(changed);
      return out;
    });
    lock = run.catch(() => {});
    return run;
  },
};

// ---------- live updates (Server-Sent Events) ----------
const listeners = new Set();
function announce(keys) {
  if (!listeners.size || !keys.size) return;
  for (const k of keys) {
    const ev = k.startsWith('team:') ? { team: Number(k.slice(5)) } : k === 'config' ? { config: true } : null;
    if (!ev) continue;
    const line = `data: ${JSON.stringify(ev)}\n\n`;
    for (const res of listeners) res.write(line);
  }
}
setInterval(() => { for (const res of listeners) res.write(': ping\n\n'); }, 25000).unref();

// ---------- data ----------
function defaultConfig() { return { schema: 6, round: 1, answerKeys: {}, supervisorHash: '', supEpoch: 1, legacyAttempts: [], history: [], createdAt: now() }; }
const blankTeam = slot => ({ slot, epoch: 1, quiz: null, grade: null, enteredAt: null });
// Earlier versions kept everything in one row. Leave it untouched and copy over what still applies.
function migrateLegacy(cfg, old) {
  if (!old || typeof old !== 'object') return cfg;
  if (old.officialAnswerKeys && !Object.keys(cfg.answerKeys || {}).length) cfg.answerKeys = old.officialAnswerKeys;
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
    console.warn('Local JSON storage active. Add DATABASE_URL for real use (Render Free restarts delete local data).');
  }
  // v6: a global round counter (earlier configs had none).
  await store.tx(async t => { const c = await t.get('config'); if (!Number.isInteger(c.round)) { c.round = 1; c.history = c.history || []; c.schema = 6; await t.set('config', c); } });
}
async function legacyPayload() {
  if (pool) {
    const exists = (await pool.query("SELECT to_regclass('public.economic_relay_state') AS t")).rows[0].t;
    return exists ? (await pool.query('SELECT payload FROM economic_relay_state WHERE id=1')).rows[0]?.payload || null : null;
  }
  const f = path.join(DATA_DIR, 'relay-data.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
}
async function allTeams(cfg) {
  const docs = new Map((await store.list('team:')).map(d => [d.slot, d]));
  return teamNames(cfg).map((name, i) => ({ ...(docs.get(i + 1) || blankTeam(i + 1)), name }));
}
const quizSummary = q => (q ? { score: q.score, total: q.total, level: q.level, finishedAt: q.finishedAt } : null);
function ranking(teams) {
  return teams.map(t => ({ slot: t.slot, name: t.name, test: quizSummary(t.quiz), score: Number.isInteger(t.grade?.score) ? t.grade.score : null }))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || (b.test?.score ?? -1) - (a.test?.score ?? -1) || a.slot - b.slot);
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
// Jury: the main administrator (login "admin" + TEACHER_PASSWORD) or a jury account the administrator created.
function juryOk(tok, cfg) {
  if (tok?.role !== 'supervisor') return false;
  if (tok.kind === 'director') { const d = cfg.directors?.[tok.login]; return !!d && tok.epoch === d.epoch; }
  return tok.epoch === cfg.supEpoch;
}
async function needJury(req) {
  const tok = readToken(req), cfg = await store.get('config');
  if (!juryOk(tok, cfg)) err('not_authorized', 401);
  return { cfg, owner: tok.kind !== 'director', actor: tok.kind === 'director' ? cfg.directors[tok.login].name : 'admin' };
}
async function teamOf(req, cfg) {
  const tok = readToken(req);
  if (tok?.role !== 'team' || tok.round !== cfg.round) return null;
  const names = teamNames(cfg); if (!(tok.slot >= 1 && tok.slot <= names.length)) return null;
  const doc = (await store.get('team:' + tok.slot)) || blankTeam(tok.slot);
  return doc.epoch === tok.epoch ? { ...doc, name: names[tok.slot - 1] } : null;
}

// ---------- http ----------
function send(res, status, data, headers = {}) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers }); res.end(JSON.stringify(data)); }
async function readBody(req, max = 300000) {
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
function csvCell(v) { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replaceAll('"', '""') + '"'; }
function csv(res, name, rows) { const body = '﻿' + rows.map(r => r.map(csvCell).join(',')).join('\r\n'); res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${name}"`, 'Cache-Control': 'no-store' }); res.end(body); }
const PAGE = ['index.html', 'text/html; charset=utf-8'];
const STATIC = {
  '/': PAGE, '/index.html': PAGE, '/jury': PAGE, '/director': PAGE,
  '/styles.css': ['styles.css', 'text/css; charset=utf-8'], '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/images/campus.webp': ['images/campus.webp', 'image/webp'],
};

async function handle(req, res) {
  const url = new URL(req.url || '/', 'http://localhost'), p = url.pathname, method = req.method;
  if (method === 'GET' && STATIC[p]) {
    const [file, type] = STATIC[p];
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': type.startsWith('image') ? 'public,max-age=86400' : 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    return res.end(fs.readFileSync(path.join(__dirname, file)));
  }
  if (method === 'GET' && p === '/api/events') {
    if (listeners.size >= 2000) err('server_busy', 503);
    res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write('retry: 3000\n\n');
    listeners.add(res); req.on('close', () => listeners.delete(res));
    return;
  }
  if (method === 'GET' && p === '/health') return send(res, 200, { ok: true, storage: pool ? 'postgres' : 'local', version: 6 });
  if (method === 'POST' && p === '/api/logout') { clearAuth(res); return send(res, 200, { ok: true }); }

  // ----- public: who am I, and which teams have finished the test -----
  if (method === 'GET' && p === '/api/session') {
    const cfg = await store.get('config'), tok = readToken(req);
    const teams = (await allTeams(cfg)).map(t => ({ slot: t.slot, name: t.name, done: !!t.quiz }));
    if (juryOk(tok, cfg)) return send(res, 200, { role: 'jury', teams });
    const me = await teamOf(req, cfg);
    return send(res, 200, { role: me ? 'team' : null, slot: me?.slot ?? null, teams });
  }

  // ----- teacher: pick the team, take the test -----
  if (method === 'POST' && p === '/api/team/enter') {
    limit(req, 'team-enter', 120);
    const b = await readBody(req, 2000), slot = Number(b.slot), cfg = await store.get('config');
    if (!Number.isInteger(slot) || slot < 1 || slot > teamNames(cfg).length) err('team_required');
    const doc = await store.tx(async t => {
      const d = (await t.get('team:' + slot)) || blankTeam(slot);
      if (!d.enteredAt) { d.enteredAt = now(); await t.set('team:' + slot, d); }
      return d;
    });
    setAuth(res, { role: 'team', slot, epoch: doc.epoch, round: cfg.round });
    return send(res, 200, { ok: true, done: !!doc.quiz });
  }
  if (method === 'GET' && p === '/api/team') {
    const cfg = await store.get('config'), me = await teamOf(req, cfg);
    if (!me) err('session_expired', 401);
    const qs = me.quiz ? (me.quiz.questions || QUESTIONS) : testOf(cfg).map(q => ({ id: q.id, ru: q.ru, kk: q.kk, options_ru: q.options_ru, options_kk: q.options_kk }));
    return send(res, 200, { slot: me.slot, name: me.name, round: cfg.round, quiz: me.quiz ? { ...me.quiz, questions: undefined } : null, questions: qs });
  }
  if (method === 'POST' && p === '/api/team/quiz') {
    const b = await readBody(req, 20000), tok = readToken(req);
    return send(res, 200, await store.tx(async t => {
      const cfg = await t.get('config');
      if (tok?.role !== 'team' || tok.round !== cfg.round) err('session_expired', 401);
      const d = (await t.get('team:' + tok.slot)) || blankTeam(tok.slot);
      if (d.epoch !== tok.epoch) err('session_expired', 401);
      if (d.quiz) err('quiz_already_done', 409);
      const qs = testOf(cfg), total = qs.length;
      if (!Array.isArray(b.answers) || b.answers.length !== total || b.answers.some((a, i) => !Number.isInteger(a) || a < 0 || a >= qs[i].options_ru.length)) err('answer_all');
      const score = b.answers.filter((a, i) => a === qs[i].correct).length;
      d.quiz = { answers: b.answers, score, total, level: level(score, total), finishedAt: now(), questions: qs };
      await t.set('team:' + d.slot, d);
      return { ok: true, score, total };
    }));
  }

  // ----- jury -----
  if (method === 'POST' && (p === '/api/jury/login' || p === '/api/supervisor/login')) {
    limit(req, 'jury-login', 15);
    const b = await readBody(req, 5000), pass = clean(b.password, 300), login = clean(b.login, 60).toLowerCase(), cfg = await store.get('config');
    if (login && login !== 'admin') {
      const d = cfg.directors?.[login];
      if (!d || !pass || !verify(pass, d.passHash)) err('incorrect_login', 401);
      await store.tx(async t => { const c = await t.get('config'); if (c.directors?.[login]) { c.directors[login].lastLoginAt = now(); await t.set('config', c); } });
      setAuth(res, { role: 'supervisor', kind: 'director', login, epoch: d.epoch });
      return send(res, 200, { ok: true });
    }
    const ok = pass && ((ADMIN_PASSWORD && safeSame(pass, ADMIN_PASSWORD)) || (cfg.supervisorHash && verify(pass, cfg.supervisorHash)));
    if (!ok) err('incorrect_login', 401);
    setAuth(res, { role: 'supervisor', kind: 'owner', epoch: cfg.supEpoch });
    return send(res, 200, { ok: true });
  }
  if (p.startsWith('/api/jury')) {
    const { cfg, owner, actor } = await needJury(req);
    if (method === 'GET' && p === '/api/jury') {
      const teams = await allTeams(cfg);
      return send(res, 200, {
        owner, actor, round: cfg.round,
        teams: teams.map(t => ({ slot: t.slot, name: t.name, entered: !!t.enteredAt, quiz: t.quiz ? { ...t.quiz } : null, grade: t.grade, key: cfg.answerKeys?.[t.slot] || null })),
        ranking: ranking(teams), history: cfg.history || [],
        questions: testOf(cfg), customTest: Array.isArray(cfg.questions) && cfg.questions.length > 0,
        instructions: OFFICIAL.instructions, answerKeyCount: Object.keys(cfg.answerKeys || {}).length,
        juries: owner ? Object.values(cfg.directors || {}).map(d => ({ login: d.login, name: d.name, createdAt: d.createdAt, lastLoginAt: d.lastLoginAt || null })) : null,
        legacyAttempts: cfg.legacyAttempts || [], hasLegacy: !!cfg.hasLegacy, storage: pool ? 'postgres' : 'local',
      });
    }
    if (method === 'POST' && p === '/api/jury/grade') {
      const b = await readBody(req, 20000), slot = Number(b.slot);
      if (!(slot >= 1 && slot <= teamNames(cfg).length)) err('team_required');
      const r = b.rubric; if (!r || typeof r !== 'object') err('rubric_required');
      const vals = {};
      for (const [k, max] of Object.entries(RUBRIC)) { const v = Number(r[k]); if (r[k] === '' || r[k] == null || !Number.isInteger(v) || v < 0 || v > max) err('rubric_range'); vals[k] = v; }
      return send(res, 200, await store.tx(async t => {
        const d = (await t.get('team:' + slot)) || blankTeam(slot);
        d.grade = { rubric: vals, score: Object.values(vals).reduce((a, v) => a + v, 0), feedback: clean(b.feedback, 1500), gradedAt: now(), by: actor };
        await t.set('team:' + slot, d);
        return { ok: true, score: d.grade.score };
      }));
    }
    if (method === 'POST' && p === '/api/jury/team') {
      const b = await readBody(req, 2000), slot = Number(b.slot);
      if (!(slot >= 1 && slot <= teamNames(cfg).length)) err('team_required');
      return send(res, 200, await store.tx(async t => {
        const d = (await t.get('team:' + slot)) || blankTeam(slot);
        if (b.action === 'reset-test') { d.quiz = null; d.enteredAt = null; d.epoch++; }
        else if (b.action === 'reset-grade') d.grade = null;
        else err('invalid_action');
        await t.set('team:' + slot, d);
        return { ok: true };
      }));
    }
    if (method === 'POST' && p === '/api/jury/new-round') {
      const b = await readBody(req, 2000); if (b.confirm !== 'NEW ROUND') err('confirm_required');
      const teams = await allTeams(cfg);
      return send(res, 200, await store.tx(async t => {
        const c = await t.get('config');
        c.history = [{ round: c.round, finishedAt: now(), teams: teams.map(x => ({ slot: x.slot, name: x.name, test: quizSummary(x.quiz), grade: x.grade })) }, ...(c.history || [])].slice(0, 30);
        c.round++;
        for (const x of teams) await t.set('team:' + x.slot, { ...blankTeam(x.slot), epoch: (x.epoch || 1) + 1 });
        await t.set('config', c);
        return { ok: true, round: c.round };
      }));
    }
    if (method === 'POST' && p === '/api/jury/questions') {
      const b = await readBody(req, 300000), qs = b.reset ? null : validateQuestions(b.questions);
      return send(res, 200, await store.tx(async t => { const c = await t.get('config'); if (qs) c.questions = qs; else delete c.questions; c.questionsUpdatedAt = now(); await t.set('config', c); return { ok: true }; }));
    }
    if (method === 'POST' && p === '/api/jury/answers') {
      const b = await readBody(req, 250000), keys = sanitizedAnswerKeys(b.answerKeys);
      return send(res, 200, await store.tx(async t => { const c = await t.get('config'); c.answerKeys = keys; await t.set('config', c); return { ok: true, count: 10 }; }));
    }
    if (method === 'POST' && p === '/api/jury/accounts') {
      if (!owner) err('owner_only', 403);
      const b = await readBody(req, 5000), login = validLogin(b.login);
      if (login === 'admin') err('login_taken', 409);
      return send(res, 200, await store.tx(async t => {
        const c = await t.get('config'); c.directors = c.directors || {};
        const d = c.directors[login];
        if (b.action === 'create') {
          const name = clean(b.name, 120), pass = clean(b.password, 200);
          if (name.length < 3) err('name_required'); if (pass.length < 8) err('password_too_short_8');
          if (d) err('login_taken', 409);
          c.directors[login] = { login, name, passHash: hash(pass), epoch: 1, createdAt: now() };
        } else if (b.action === 'reset') {
          const pass = clean(b.password, 200); if (!d) err('not_found', 404); if (pass.length < 8) err('password_too_short_8');
          d.passHash = hash(pass); d.epoch++;
        } else if (b.action === 'delete') { if (!d) err('not_found', 404); delete c.directors[login]; }
        else err('invalid_action');
        await t.set('config', c);
        return { ok: true };
      }));
    }
    if (method === 'GET' && p === '/api/jury/csv') {
      const teams = await allTeams(cfg), rank = ranking(teams);
      return csv(res, `jury-round-${cfg.round}.csv`, [
        ['Место', 'Команда', 'Тест (балл)', 'Тест (из)', 'Уровень', 'Тест завершён', 'Этап 1 (10)', 'Этап 2 (15)', 'Этап 3 (15)', 'Защита (10)', 'Итого (50)', 'Комментарий', 'Оценил'],
        ...rank.map((r, i) => { const x = teams.find(y => y.slot === r.slot); return [r.score != null ? i + 1 : '', x.name, x.quiz?.score ?? '', x.quiz?.total ?? '', x.quiz?.level ?? '', x.quiz?.finishedAt ?? '', x.grade?.rubric?.analysis ?? '', x.grade?.rubric?.calculation ?? '', x.grade?.rubric?.decision ?? '', x.grade?.rubric?.defense ?? '', x.grade?.score ?? '', x.grade?.feedback ?? '', x.grade?.by ?? '']; }),
      ]);
    }
    if (method === 'GET' && p === '/api/jury/legacy-export') {
      const old = await legacyPayload(); if (!old) err('not_found', 404);
      const body = JSON.stringify({ ...old, teacherHash: undefined, teams: (old.teams || []).map(t => ({ ...t, pin_hash: undefined, pin_cipher: undefined })) }, null, 2);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': 'attachment; filename="economic-relay-v4-backup.json"', 'Cache-Control': 'no-store' });
      return res.end(body);
    }
    return err('not_found', 404);
  }
  return err('not_found', 404);
}

function start() {
  const server = http.createServer(async (req, res) => {
    try { await handle(req, res); }
    catch (e) { const status = e.status || 500; if (status === 500) console.error('Server error:', e); if (!res.headersSent) send(res, status, { error: status === 500 ? 'server_error' : e.message }); else res.end(); }
  });
  server.listen(PORT, '0.0.0.0', () => console.log(`Economic Relay v6 ready on http://localhost:${PORT}`));
}
initStore().then(start).catch(e => { console.error('Database initialization failed:', e); process.exit(1); });
