'use strict';
// Economic Relay v6: teachers pick their team and take the test; the jury watches the results.
const S = {
  brandSmall: ['ЭКОНОМИЧЕСКИЙ', 'ЭКОНОМИКАЛЫҚ'], brandBig: ['АЛЬЯНС', 'АЛЬЯНС'],
  footer: ['✦ «Экономикалық альянс: педагог және студенттер» · «Экономический альянс: педагог и студенты»', '✦ «Экономикалық альянс: педагог және студенттер» · «Экономический альянс: педагог и студенты»'],
  juryLink: ['Вход для жюри', 'Қазылар алқасына кіру'], logout: ['Выйти', 'Шығу'],
  heroKicker: ['🏆 ОБЛЫСТЫҚ ЧЕМПИОНАТ · ОБЛАСТНОЙ ЧЕМПИОНАТ', '🏆 ОБЛЫСТЫҚ ЧЕМПИОНАТ · ОБЛАСТНОЙ ЧЕМПИОНАТ'],
  champKk: ['«Экономикалық альянс: педагог және студенттер» облыстық чемпионаты', '«Экономикалық альянс: педагог және студенттер» облыстық чемпионаты'], champRu: ['Областной чемпионат «Экономический альянс: педагог и студенты»', 'Областной чемпионат «Экономический альянс: педагог и студенты»'],
  heroText: ['Преподаватель выбирает свою команду и проходит тест. После теста открывается доступ к практическому кейсу.', 'Мұғалім өз командасын таңдап, тест тапсырады. Тесттен кейін практикалық кейске қолжетімділік ашылады.'],
  pickTitle: ['Выберите свою команду', 'Командаңызды таңдаңыз'], pickText: ['Нажмите на свою команду — тест начнётся сразу. Регистрация и пароль не нужны.', 'Өз командаңызды басыңыз — тест бірден басталады. Тіркелу мен құпиясөз қажет емес.'],
  done: ['тест пройден', 'тест тапсырылды'], start: ['начать', 'бастау'], enterConfirm: ['Вы преподаватель команды «{name}»? Тест начнётся сразу.', '«{name}» командасының мұғалімісіз бе? Тест бірден басталады.'],
  team: ['Команда', 'Команда'], close: ['Закрыть', 'Жабу'], back: ['Назад', 'Артқа'], next: ['Далее', 'Келесі'], save: ['Сохранить', 'Сақтау'], saved: ['Сохранено ✓', 'Сақталды ✓'],
  // test
  testTitle: ['Тест для преподавателей колледжа по основам экономики и финансовой грамотности', 'Колледж оқытушыларына арналған экономика негіздері және қаржылық сауаттылық бойынша тест'],
  testDesc: ['Выберите один правильный ответ. 1 балл за верный ответ.', 'Бір дұрыс жауапты таңдаңыз. Әр дұрыс жауап — 1 балл.'],
  question: ['Вопрос', 'Сұрақ'], finishTest: ['Завершить тест', 'Тестті аяқтау'], chooseAnswer: ['Выберите ответ.', 'Жауапты таңдаңыз.'], answerAll: ['Ответьте на все вопросы.', 'Барлық сұраққа жауап беріңіз.'],
  sec1: ['Основы экономики', 'Экономика негіздері'], sec2: ['Финансовая грамотность', 'Қаржылық сауаттылық'], sec3: ['Практика и рынок', 'Тәжірибе және нарық'],
  access: ['Доступ к практическому кейсу открыт', 'Практикалық кейске қолжетімділік ашық'], accessSub: ['Тест завершён. Можно приступать к практическому кейсу.', 'Тест аяқталды. Практикалық кейске кірісуге болады.'],
  testResult: ['Результат теста', 'Тест нәтижесі'], level: ['Уровень', 'Деңгей'], lv_high: ['Высокий уровень', 'Жоғары деңгей'], lv_good: ['Хороший уровень', 'Жақсы деңгей'], lv_basic: ['Базовый уровень', 'Базалық деңгей'], lv_repeat: ['Требуется повторение материала', 'Материалды қайталау қажет'],
  answers: ['Ответы на тест', 'Тест жауаптары'], correctAnswer: ['Правильный ответ', 'Дұрыс жауап'], yourChoice: ['Ваш ответ', 'Сіздің жауабыңыз'],
  // jury
  juryLogin: ['Вход для жюри', 'Қазылар алқасына кіру'], juryLoginText: ['Жюри наблюдает за результатами теста всех команд.', 'Қазылар алқасы барлық команданың тест нәтижесін бақылайды.'],
  login: ['Логин', 'Логин'], password: ['Пароль', 'Құпиясөз'], signIn: ['Войти', 'Кіру'], toHome: ['На главную', 'Басты бетке'],
  juryTitle: ['Кабинет жюри', 'Қазылар алқасының кабинеті'], jurySub: ['Результаты теста каждой команды — обновляются сами.', 'Әр команданың тест нәтижесі — өзі жаңарады.'], tProgress: ['проходят сейчас', 'қазір тапсыруда'], startedAt: ['начали', 'бастады'], finishedAt: ['завершили', 'аяқтады'], signedInAs: ['Вы вошли как', 'Сіз кірдіңіз:'], ownerName: ['главный администратор', 'бас әкімші'],
  tabTeams: ['Команды', 'Командалар'], tabTest: ['Тест', 'Тест'], tabSettings: ['Настройки', 'Баптаулар'], tabAccess: ['Доступ жюри', 'Қазылар қолжетімділігі'],
  tTeams: ['команд', 'команда'], tDone: ['прошли тест', 'тест тапсырды'], tAvg: ['средний балл теста', 'тесттің орташа балы'],  round: ['Тур', 'Тур'],
  notStarted: ['ещё не начали', 'әлі бастамады'], inProgress: ['проходят тест…', 'тест тапсыруда…'],
  ranking: ['Рейтинг по тесту', 'Тест бойынша рейтинг'], rankingEmpty: ['Рейтинг появится, когда команды пройдут тест.', 'Командалар тест тапсырғанда рейтинг шығады.'],
  resetTest: ['Сбросить тест', 'Тестті қайтадан'], resetTestConfirm: ['Сбросить тест этой команды? Его можно будет пройти заново.', 'Осы команданың тестін қайтару керек пе? Оны қайта тапсыруға болады.'],
  newRound: ['Новый тур', 'Жаңа тур'], newRoundText: ['Результаты текущего тура сохранятся в истории, тесты всех команд очистятся.', 'Ағымдағы тур нәтижелері тарихқа сақталады, барлық команданың тесті тазартылады.'], newRoundConfirm: ['Начать новый тур? Тесты всех команд будут очищены.', 'Жаңа тур бастау керек пе? Барлық команданың тесті тазартылады.'],
  history: ['История туров', 'Турлар тарихы'], historyEmpty: ['Завершённых туров пока нет.', 'Аяқталған тур әзірге жоқ.'], downloadCsv: ['Скачать Excel', 'Excel жүктеу'], export: ['Экспорт результатов', 'Нәтижелерді жүктеу'],
  legacyTitle: ['Данные прошлой версии сайта', 'Сайттың алдыңғы нұсқасының деректері'], legacyDownload: ['Скачать резервную копию', 'Резервтік көшірмені жүктеу'],
  accessTitle: ['Логины для жюри', 'Қазыларға арналған логиндер'], accessHelp: ['Создайте логин и пароль для каждого члена жюри — они только наблюдают. Вход на странице:', 'Әр қазыға логин мен құпиясөз жасаңыз — олар тек бақылайды. Кіру беті:'], fullName: ['ФИО', 'Аты-жөні'],
  loginHint: ['латиница, цифры, . _ - @ (3–40 символов)', 'латын әріптері, сандар, . _ - @ (3–40 таңба)'], passHint8: ['не короче 8 символов', 'кемі 8 таңба'], createJury: ['Создать доступ', 'Қолжетімділік жасау'], noJuries: ['Пока нет ни одного логина.', 'Әзірге логин жоқ.'],
  resetPassword: ['Сбросить пароль', 'Құпиясөзді қалпына келтіру'], juryReset: ['Новый пароль (не короче 8 символов):', 'Жаңа құпиясөз (кемі 8 таңба):'], juryDelete: ['Удалить этот доступ?', 'Бұл қолжетімділікті өшіру керек пе?'], remove: ['Удалить', 'Өшіру'], lastLogin: ['Последний вход', 'Соңғы кіру'], copyLink: ['Скопировать ссылку', 'Сілтемені көшіру'],
  // errors
  errDefault: ['Не удалось выполнить действие.', 'Әрекет орындалмады.'], err_network: ['Нет связи с сервером.', 'Сервермен байланыс жоқ.'],
  err_incorrect_login: ['Неверный логин или пароль.', 'Логин немесе құпиясөз қате.'], err_not_authorized: ['Войдите в систему.', 'Жүйеге кіріңіз.'], err_session_expired: ['Сессия завершена. Выберите команду снова.', 'Сессия аяқталды. Команданы қайта таңдаңыз.'],
  err_quiz_already_done: ['Тест этой команды уже пройден.', 'Бұл команданың тесті тапсырылған.'], err_answer_all: ['Ответьте на все вопросы.', 'Барлық сұраққа жауап беріңіз.'],
  err_try_later: ['Слишком много попыток. Подождите несколько минут.', 'Әрекет тым көп. Бірнеше минут күтіңіз.'], err_owner_only: ['Только главный администратор.', 'Тек бас әкімші.'], err_password_too_short_8: ['Пароль — минимум 8 символов.', 'Құпиясөз кемі 8 таңба.'],
  err_login_taken: ['Такой логин уже занят.', 'Бұл логин бос емес.'], err_login_format: ['Логин: латиница, цифры, . _ - @ (3–40 символов).', 'Логин: латын әріптері, сандар, . _ - @ (3–40 таңба).'], err_name_required: ['Введите ФИО полностью.', 'Аты-жөніңізді толық енгізіңіз.'],
};
let lang = 'ru';
try { if (localStorage.getItem('economic-relay.lang') === 'kk') lang = 'kk'; } catch {}
const L = k => (S[k] ? S[k][lang === 'kk' ? 1 : 0] : k);
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LETTERS = ['А', 'Б', 'В', 'Г', 'Д'];
const fmtDate = v => v ? new Date(v).toLocaleString(lang === 'kk' ? 'kk-KZ' : 'ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
const onJuryPage = () => location.pathname === '/jury' || location.pathname === '/director';

let session = null, data = null, tab = 'teams', lastView = '', quiz = { index: 0, answers: {} }, quizKey = '';

function toast(msg) { const el = $('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 3800); }
function errText(code) { return S['err_' + code] ? L('err_' + code) : L('errDefault'); }
async function api(url, method = 'GET', body) {
  let res;
  try { res = await fetch('/api' + url, { method, credentials: 'same-origin', headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }); }
  catch { throw Error('network'); }
  let out; try { out = await res.json(); } catch { throw Error('network'); }
  if (!res.ok) throw Error(out.error || 'network');
  return out;
}
async function act(url, body, okMsg = L('saved')) {
  try { const r = await api(url, 'POST', body); await load(); if (okMsg) toast(okMsg); return r; }
  catch (e) { toast(errText(e.message)); if (e.message === 'session_expired' || e.message === 'not_authorized') await load(); return null; }
}
function setLang(code) { lang = code; try { localStorage.setItem('economic-relay.lang', code); } catch {} render(true); }

async function load(quiet) {
  try {
    const before = quiet ? JSON.stringify([session, data]) : '';
    const ses = await api('/session');
    let d = null;
    if (ses.role === 'jury') d = await api('/jury');
    else if (ses.role === 'team') d = await api('/team');
    session = ses; data = d;
    if (ses.role === 'team' && !d.quiz) { const k = d.slot + ':' + d.round; if (quizKey !== k) { quizKey = k; restoreQuiz(); } }
    if (quiet && before === JSON.stringify([session, data])) return;
    render();
  } catch (e) {
    if (quiet) return;
    $('app').innerHTML = `<div class="card reveal"><p class="note bad">${esc(errText(e.message))}</p><button class="btn" onclick="load()">↻</button></div>`;
  }
}

// ---------- shell ----------
function header() {
  document.documentElement.lang = lang;
  $('brandSmall').textContent = L('brandSmall'); $('brandBig').textContent = L('brandBig');
  $('footerText').textContent = L('footer'); $('supervisorLink').textContent = L('juryLink');
  $('supervisorLink').classList.toggle('hidden', !!session?.role || onJuryPage());
  $('langRu').classList.toggle('active', lang === 'ru'); $('langKk').classList.toggle('active', lang === 'kk');
  $('signout').textContent = '↪ ' + L('logout'); $('signout').classList.toggle('hidden', !session?.role);
  document.body.dataset.role = session?.role || 'guest';
}
function render(force) {
  header();
  if (!session) return;
  const view = (session.role || (onJuryPage() ? 'jurylogin' : 'landing')) + ':' + tab;
  const html = session.role === 'jury' ? juryUI() : session.role === 'team' ? teamUI() : onJuryPage() ? juryLoginUI() : landingUI();
  const app = $('app'), opened = {}, same = view === lastView;
  app.querySelectorAll('details[data-k]').forEach(el => opened[el.dataset.k] = el.open);
  // Keep what the person is typing when the screen refreshes with new data.
  const typed = {}, ae = document.activeElement, focusId = app.contains(ae) ? ae.id : '';
  const sel = focusId && typeof ae.selectionStart === 'number' ? [ae.selectionStart, ae.selectionEnd] : null;
  if (same) app.querySelectorAll('input[id], textarea[id], select[id]').forEach(el => {
    if (el.type === 'file' || el.type === 'radio' || el.type === 'checkbox') return;
    if (el.value !== el.defaultValue) typed[el.id] = el.value;
  });
  app.innerHTML = html;
  if (same) {
    app.querySelectorAll('details[data-k]').forEach(el => { if (el.dataset.k in opened) el.open = opened[el.dataset.k]; });
    for (const [id, v] of Object.entries(typed)) { const el = document.getElementById(id); if (el) el.value = v; }
    const f = focusId && document.getElementById(focusId);
    if (f) { f.focus({ preventScroll: true }); if (sel) try { f.setSelectionRange(sel[0], sel[1]); } catch {} }
  }
  if (!same || force) { app.classList.remove('animate'); void app.offsetWidth; app.classList.add('animate'); }
  lastView = view;
}
// College and team leader, shown under the team name.
const teamMeta = t => (t.college || t.leader) ? `<span class="team-meta">${t.college ? `<span>🏫 ${esc(t.college)}</span>` : ''}${t.leader ? `<span>👩‍🏫 ${esc(t.leader)}</span>` : ''}</span>` : '';
const card = (title, body, cls = '') => `<section class="card reveal ${cls}">${title ? `<h2>${title}</h2>` : ''}${body}</section>`;
const field = (label, id, attrs = '', hint = '') => `<label class="field"><span>${label}</span><input class="input" id="${id}" ${attrs}>${hint ? `<small>${hint}</small>` : ''}</label>`;
const pill = (text, cls = '') => `<span class="pill ${cls}">${text}</span>`;

// ---------- landing: teacher picks the team ----------
function landingUI() {
  return `<section class="hero reveal">
    <span class="kicker">${L('heroKicker')}</span>
    ${lang === 'kk'
      ? `<h1 class="champ"><span class="champ-pre">«Экономикалық альянс:</span> <span class="champ-main">педагог және студенттер»</span> <span class="champ-post">облыстық чемпионаты</span></h1><p class="champ-alt">Областной чемпионат «Экономический альянс: педагог и студенты»</p>`
      : `<h1 class="champ"><span class="champ-post">Областной чемпионат</span> <span class="champ-pre">«Экономический альянс:</span> <span class="champ-main">педагог и студенты»</span></h1><p class="champ-alt">«Экономикалық альянс: педагог және студенттер» облыстық чемпионаты</p>`}
    <p>${L('heroText')}</p>
  </section>
  <section class="card reveal pick-card"><h2>👩‍🏫 ${L('pickTitle')}</h2><p class="muted">${L('pickText')}</p>
    <div class="team-choose">${session.teams.map((t, i) => `<button type="button" class="${t.done ? 'is-done' : ''}" style="--d:${i * 60}ms" onclick="enterTeam(${t.slot})"><span class="team-no">${t.slot}</span><span class="grow">${esc(t.name)}${teamMeta(t)}<small>${t.done ? '✓ ' + L('done') : L('start') + ' →'}</small></span></button>`).join('')}</div>
  </section>`;
}
async function enterTeam(slot) {
  const t = session.teams.find(x => x.slot === slot);
  if (!t.done && !confirm(L('enterConfirm').replace('{name}', t.name) + (t.leader ? '\n👩‍🏫 ' + t.leader : '') + (t.college ? '\n🏫 ' + t.college : ''))) return;
  try { await api('/team/enter', 'POST', { slot }); await load(); window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { toast(errText(e.message)); }
}

// ---------- teacher: test, then "access open" ----------
function teamUI() {
  const d = data, qs = d.questions;
  const head = `<div class="page-head reveal"><div><span class="muted small block">👩‍🏫 ${L('team')}</span><h1>🏳️ ${esc(d.name)}</h1>${teamMeta(d)}</div></div>`;
  if (d.quiz) {
    return head + `<section class="card access-card reveal"><div class="access-icon">🔓</div><h2>${L('access')}</h2><p>${L('accessSub')}</p></section>
    ${card('', `<div class="result-head"><div><h2>🎉 ${L('testResult')}</h2><p class="muted">${fmtDate(d.quiz.finishedAt)}</p></div><div class="score-ring" style="--p:${d.quiz.score / d.quiz.total * 100}"><b>${d.quiz.score}</b><small>/${d.quiz.total}</small></div></div>
      <p class="note good"><b>${L('level')}:</b> ${L('lv_' + d.quiz.level)}</p>
      <details class="rules" data-k="answers"><summary>📋 ${L('answers')}</summary>${qs.map((q, i) => { const mine = d.quiz.answers[i], ok = mine === q.correct; return `<details class="qa ${ok ? 'ok' : 'no'}"><summary>${ok ? '✅' : '❌'} ${i + 1}. ${esc(q[lang])}</summary><p><b>${L('correctAnswer')}:</b> ${LETTERS[q.correct]}) ${esc(q['options_' + lang][q.correct])}</p>${ok ? '' : `<p class="muted">${L('yourChoice')}: ${LETTERS[mine]}) ${esc(q['options_' + lang][mine])}</p>`}</details>`; }).join('')}</details>`)}`;
  }
  const i = quiz.index, q = qs[i], n = qs.length, answered = Object.keys(quiz.answers).length;
  return head + `<section class="card quiz reveal"><div class="quiz-top"><span class="pill">${L('question')} ${i + 1}/${n}</span><span class="muted small">${answered}/${n} ✓</span></div>
    <h2 class="quiz-title">🧠 ${L('testTitle')}</h2><p class="muted small">${L('testDesc')}</p>
    <div class="bar"><span style="width:${(i + 1) / n * 100}%"></span></div>
    ${n === 20 ? `<span class="section-tag">${L(i < 7 ? 'sec1' : i < 14 ? 'sec2' : 'sec3')}</span>` : ''}
    <h3 class="q-text">${i + 1}. ${esc(q[lang])}</h3>
    <div class="options">${q['options_' + lang].map((o, k) => `<label class="option ${quiz.answers[i] === k ? 'picked' : ''}" style="--d:${k * 60}ms"><input type="radio" name="qopt" ${quiz.answers[i] === k ? 'checked' : ''} onchange="pick(${k})"><span class="letter">${LETTERS[k]}</span><span>${esc(o)}</span></label>`).join('')}</div>
    <div class="quiz-nav"><button class="btn ghost" ${i === 0 ? 'disabled' : ''} onclick="qMove(-1)">← ${L('back')}</button><button class="btn primary" onclick="qMove(1)">${i === n - 1 ? L('finishTest') + ' ✓' : L('next') + ' →'}</button></div>
    <div class="dots">${qs.map((_, k) => `<button type="button" class="${k === i ? 'cur' : ''} ${Number.isInteger(quiz.answers[k]) ? 'ans' : ''}" onclick="qJump(${k})" aria-label="${k + 1}"></button>`).join('')}</div></section>`;
}
const quizStoreKey = () => 'economic-relay.quiz.' + data.slot + '.' + data.round;
function saveQuiz() { try { localStorage.setItem(quizStoreKey(), JSON.stringify(quiz)); } catch {} }
function restoreQuiz() { try { const s = JSON.parse(localStorage.getItem(quizStoreKey()) || 'null'); quiz = s && typeof s.answers === 'object' ? s : { index: 0, answers: {} }; } catch { quiz = { index: 0, answers: {} }; } }
function pick(k) { quiz.answers[quiz.index] = k; saveQuiz(); document.querySelectorAll('.option').forEach((el, j) => el.classList.toggle('picked', j === k)); document.querySelectorAll('.dots button')[quiz.index]?.classList.add('ans'); }
function qJump(k) { quiz.index = k; saveQuiz(); render(); }
function qMove(delta) {
  const n = data.questions.length;
  if (delta > 0 && !Number.isInteger(quiz.answers[quiz.index])) { toast(L('chooseAnswer')); return; }
  if (delta > 0 && quiz.index === n - 1) return finishQuiz();
  quiz.index = Math.max(0, Math.min(n - 1, quiz.index + delta)); saveQuiz(); render();
}
async function finishQuiz() {
  const n = data.questions.length, answers = Array.from({ length: n }, (_, i) => quiz.answers[i]);
  const miss = answers.findIndex(x => !Number.isInteger(x));
  if (miss >= 0) { quiz.index = miss; render(); toast(L('answerAll')); return; }
  if (!confirm(L('finishTest') + '?')) return;
  const key = quizStoreKey();
  const r = await act('/team/quiz', { answers }, null);
  if (r) { try { localStorage.removeItem(key); } catch {} confetti(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
}

// ---------- jury ----------
function juryLoginUI() {
  return `<section class="card narrow center-block reveal"><div class="dialog-icon gold">⚖️</div><h2>${L('juryLogin')}</h2><p class="muted">${L('juryLoginText')}</p>
  <form onsubmit="juryAuth(event)">${field(L('login'), 'sLogin', 'required maxlength="40" autocomplete="username" autocapitalize="none" spellcheck="false"')}${field(L('password'), 'sPass', 'type="password" required autocomplete="current-password"')}<button class="btn primary full" type="submit">${L('signIn')} →</button></form>
  <a class="link-btn center" href="/">← ${L('toHome')}</a></section>`;
}
async function juryAuth(e) {
  e.preventDefault();
  try { await api('/jury/login', 'POST', { login: $('sLogin').value.trim(), password: $('sPass').value }); tab = 'teams'; await load(); }
  catch (ex) { toast(errText(ex.message)); }
}
function go(next) { tab = next; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function juryUI() {
  const tabs = [['teams', '🏳️', L('tabTeams')], ...(data.owner ? [['settings', '⚙', L('tabSettings')], ['access', '🔑', L('tabAccess')]] : [])];
  if (!tabs.some(t => t[0] === tab)) tab = 'teams';
  return `<div class="page-head reveal"><div><span class="muted small block">⚖️ ${L('signedInAs')} ${esc(data.owner ? L('ownerName') : data.actor)}</span><h1>${L('juryTitle')}</h1><p class="muted">${L('jurySub')} · ${L('round')} ${data.round}</p></div></div>
  ${tabs.length > 1 ? `<nav class="tabs reveal">${tabs.map(([id, ic, label]) => `<button type="button" class="${tab === id ? 'on' : ''}" onclick="go('${id}')"><span>${ic}</span>${label}</button>`).join('')}</nav>` : ''}
  ${tab === 'settings' ? settingsUI() : tab === 'access' ? accessUI() : juryTeamsUI()}`;
}
function rankingCard(list) {
  const rows = list.map((t, i) => `<div class="rank-row ${t.test && i < 3 ? 'top' + (i + 1) : ''}"><span class="rank-pos">${t.test ? (['🥇', '🥈', '🥉'][i] || i + 1) : '·'}</span><span class="rank-name">${esc(t.name)}${teamMeta(t)}<small>${t.test ? L('lv_' + t.test.level) + ' · ' + fmtDate(t.test.finishedAt) : L('notStarted')}</small></span><b>${t.test ? t.test.score : '—'}<small>/${t.test ? t.test.total : 20}</small></b></div>`).join('');
  return card('🏆 ' + L('ranking'), (list.some(t => t.test) ? '' : `<p class="muted">${L('rankingEmpty')}</p>`) + rows, 'ranking');
}
function juryTeamsUI() {
  const d = data, done = d.teams.filter(t => t.quiz), progress = d.teams.filter(t => t.entered && !t.quiz);
  const avg = done.length ? Math.round(done.reduce((a, t) => a + t.quiz.score / t.quiz.total * 100, 0) / done.length) + '%' : '—';
  return `<div class="tiles reveal"><div class="tile"><b>${d.teams.length}</b><span>${L('tTeams')}</span></div><div class="tile"><b>${done.length}</b><span>${L('tDone')}</span></div><div class="tile"><b>${avg}</b><span>${L('tAvg')}</span></div><div class="tile"><b>${progress.length}</b><span>${L('tProgress')}</span></div></div>
  <div class="split wide">
    <div>${d.teams.map(teamCard).join('')}</div>
    <div>${rankingCard(d.ranking)}${card('', `<a class="btn ghost small" href="/api/jury/xlsx" download>📊 ${L('downloadCsv')}</a>`)}</div>
  </div>`;
}
function teamCard(t) {
  const q = t.quiz;
  const status = q ? pill(`🧠 ${q.score}/${q.total}`, q.score / q.total >= 0.7 ? 'green' : 'amber') : t.entered ? pill('⏳ ' + L('inProgress'), 'amber') : pill(L('notStarted'), 'gray');
  return `<details class="card review reveal" data-k="t${t.slot}"><summary><span class="team-no">${t.slot}</span><span class="grow">${esc(t.name)}${teamMeta(t)}<small>${q ? L('lv_' + q.level) + ' · ' + L('finishedAt') + ' ' + fmtDate(q.finishedAt) : t.entered ? L('startedAt') + ' ' + fmtDate(t.enteredAt) : ''}</small></span>${status}</summary>
    ${q ? (q.questions || []).map((x, i) => { const ok = q.answers[i] === x.correct; return `<p class="small">${ok ? '✅' : '❌'} ${i + 1}. ${esc(x[lang])}${ok ? '' : ` — <span class="muted">${LETTERS[q.answers[i]]} → ${LETTERS[x.correct]}</span>`}</p>`; }).join('') : `<p class="muted">${t.entered ? L('inProgress') : L('notStarted')}</p>`}
    ${q && data.owner ? `<div class="btn-row"><button class="btn soft-red small" onclick="resetTest(${t.slot})">↺ ${L('resetTest')}</button></div>` : ''}
  </details>`;
}
async function resetTest(slot) { if (!confirm(L('resetTestConfirm'))) return; await act('/jury/team', { slot, action: 'reset-test' }); }

function settingsUI() {
  const d = data;
  return `<div class="split">
    ${card('↻ ' + L('newRound'), `<p class="muted">${L('newRoundText')}</p><button class="btn soft-red" onclick="newRound()">${L('newRound')}</button>`)}
    ${card('📊 ' + L('export'), `<a class="btn ghost" href="/api/jury/xlsx" download>📊 ${L('downloadCsv')}</a>${d.hasLegacy ? `<h3 class="mt">${L('legacyTitle')}</h3><a class="btn ghost small" href="/api/jury/legacy-export" download>↓ ${L('legacyDownload')}</a>` : ''}`)}
    ${card('🗂 ' + L('history'), d.history.length ? d.history.map(h => `<details class="qa"><summary>${L('round')} ${h.round} · ${fmtDate(h.finishedAt)}</summary>${h.teams.map(t => `<p>${esc(t.name)}${t.college ? ` <span class="muted small">(${esc(t.college)})</span>` : ''}: 🧠 <b>${t.test ? t.test.score + '/' + t.test.total : '—'}</b></p>`).join('')}</details>`).join('') : `<p class="muted">${L('historyEmpty')}</p>`)}
  </div>`;
}
async function newRound() { if (!confirm(L('newRoundConfirm'))) return; await act('/jury/new-round', { confirm: 'NEW ROUND' }); }
function accessUI() {
  const list = data.juries || [], link = location.origin + '/jury';
  return `<div class="split">
    ${card('🔑 ' + L('accessTitle'), `<p class="muted">${L('accessHelp')}</p><div class="linkbox">${esc(link)}</div><button class="btn ghost small" onclick="copyText('${esc(link)}')">⧉ ${L('copyLink')}</button>
      <form class="mt" onsubmit="createJury(event)">${field(L('fullName'), 'dName', 'required minlength="3" maxlength="120"')}${field(L('login'), 'dLogin', 'required minlength="3" maxlength="40" autocapitalize="none" spellcheck="false"', L('loginHint'))}${field(L('password'), 'dPass', 'type="password" required minlength="8" autocomplete="new-password"', L('passHint8'))}<button class="btn primary" type="submit">${L('createJury')}</button></form>`)}
    ${card('👥 ' + L('tabAccess'), list.length ? `<ul class="attempts">${list.map(d => `<li><b>${esc(d.name)}</b> <span class="muted">${esc(d.login)}</span><small>${L('lastLogin')}: ${fmtDate(d.lastLoginAt)}</small><span class="row-actions"><button class="link-btn" onclick="juryAct('reset','${esc(d.login)}')">🔑 ${L('resetPassword')}</button><button class="link-btn red" onclick="juryAct('delete','${esc(d.login)}')">${L('remove')}</button></span></li>`).join('')}</ul>` : `<p class="muted">${L('noJuries')}</p>`)}
  </div>`;
}
async function createJury(e) { e.preventDefault(); const r = await act('/jury/accounts', { action: 'create', name: $('dName').value.trim(), login: $('dLogin').value.trim(), password: $('dPass').value }); if (r) e.target.reset(); }
async function juryAct(action, login) {
  const body = { action, login };
  if (action === 'reset') { const p = prompt(L('juryReset')); if (!p) return; body.password = p; }
  else if (!confirm(L('juryDelete'))) return;
  await act('/jury/accounts', body);
}
function copyText(t) { (navigator.clipboard?.writeText(t) || Promise.reject()).then(() => toast(L('saved'))).catch(() => prompt('URL', t)); }

// ---------- effects ----------
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = document.createElement('div'); box.className = 'confetti';
  const colors = ['#7c6cf5', '#35c3b0', '#ffc857', '#ff7aa2', '#4f8df7'];
  for (let i = 0; i < 70; i++) { const s = document.createElement('i'); s.style.cssText = `left:${Math.random() * 100}%;background:${colors[i % colors.length]};animation-delay:${Math.random() * 0.4}s;animation-duration:${1.6 + Math.random() * 1.4}s;transform:rotate(${Math.random() * 360}deg)`; box.appendChild(s); }
  document.body.appendChild(box); setTimeout(() => box.remove(), 3600);
}

// ---------- wiring ----------
$('langRu').addEventListener('click', () => setLang('ru'));
$('langKk').addEventListener('click', () => setLang('kk'));
$('supervisorLink').addEventListener('click', () => { location.href = '/jury'; });
$('brandLink').addEventListener('click', e => { e.preventDefault(); if (session?.role === 'jury') go('teams'); else if (onJuryPage() && !session?.role) location.href = '/'; else window.scrollTo({ top: 0, behavior: 'smooth' }); });
$('signout').addEventListener('click', async () => { try { await api('/logout', 'POST', {}); } catch {} tab = 'teams'; if (onJuryPage()) { location.href = '/'; return; } await load(); });

// ---------- live updates ----------
let live = false, lastRefresh = 0, refreshTimer = null;
function canRefresh() {
  if (!session) return false;
  if (session.role === 'team' && data && !data.quiz) return false;
  return true;
}
function relevant(ev) {
  if (session?.role === 'team') return ev.team === data?.slot || !!ev.config;
  return true;
}
function refreshSoon() { clearTimeout(refreshTimer); refreshTimer = setTimeout(() => { if (canRefresh()) { lastRefresh = Date.now(); load(true); } }, 350); }
if (window.EventSource) {
  const es = new EventSource('/api/events');
  es.onopen = () => { live = true; };
  es.onerror = () => { live = false; };
  es.onmessage = e => { let ev; try { ev = JSON.parse(e.data); } catch { return; } if (relevant(ev)) refreshSoon(); };
}
setInterval(() => {
  if (document.hidden || !canRefresh()) return;
  if (Date.now() - lastRefresh < (live ? 30000 : 5000)) return;
  lastRefresh = Date.now(); load(true);
}, 2500);
document.addEventListener('visibilitychange', () => { if (!document.hidden && canRefresh()) refreshSoon(); });
load();
