# «Экономикалық альянс: педагог және студенттер» облыстық чемпионаты
# Областной чемпионат «Экономический альянс: педагог и студенты» — v6

A bilingual (Kazakh / Russian) site for the regional economics championship.

## How it works

| Who | How they enter | What they do |
|---|---|---|
| **Teacher** | Opens the site and taps **their team** (no registration, no password) | Takes the 20-question test once. Afterwards the page shows the score and **«Доступ к практическому кейсу открыт» / «Практикалық кейске қолжетімділік ашық»**. The case itself is handed out on paper. |
| **Jury** | `/jury` page (the old `/director` link still works), login + password | **Observes only**: every team's status (not started / taking the test / finished), score, level and answers, ranking by test score, Excel report download. Nothing can be changed from a jury login. |
| **Main administrator** | `/jury` with login `admin` and the Render `TEACHER_PASSWORD` | What the jury sees, plus: reset one team's test, new round, round history, and jury logins (tab «Доступ жюри»). |

Teams: Агенты роста, Қаржы қырандары, Cash Flow (денежный поток), Тапқыр, TABYSVIBE, Индекс удачи, Золотой капитал.

Pages update live (Server-Sent Events): the jury sees a test finish the moment it happens. The questions are the original 20 from `teacher-test.json`.

## Files

| File | Purpose |
|---|---|
| `server.js` | Node 22 HTTP API and storage |
| `excel.js` | Styled Excel report for the jury (`/api/jury/xlsx`): championship title in KK and RU, ranking with medals, per-question answers sheet |
| `index.html`, `styles.css`, `app.js` | Responsive bilingual UI with the animated campus background (`images/campus.webp`) |
| `teacher-test.json` | The 20 bilingual test questions and answer key |
| `official-team-assignments.json` | Case texts (reference only; cases are handed out on paper) |
| `tests/` | `npm test` |

## Storage

PostgreSQL table `relay_kv` when `DATABASE_URL` is set (one row per team and one config row), otherwise `data/relay-v5.json`. Data from earlier versions is not deleted: the v4 table `economic_relay_state` stays untouched (downloadable from Settings), and v5 rows (teacher accounts) simply stay unused.

## Render

Render deploys `main` automatically. Environment: `TEACHER_PASSWORD` (admin password), `SESSION_SECRET` (keep the existing value), `DATABASE_URL`, `NODE_ENV=production`.

## Local development

```sh
npm install
TEACHER_PASSWORD=dev-pass node server.js   # http://localhost:3000, jury: /jury
npm test
```
