# Экономикалық эстафета / Экономическая эстафета — v6

A bilingual (Kazakh / Russian) site for a college economics competition.

## How it works

| Who | How they enter | What they do |
|---|---|---|
| **Teacher** | Opens the site and taps **their team** (no registration, no password) | Takes the 20-question test once. Afterwards the page shows the score and **«Доступ к практическому кейсу открыт» / «Практикалық кейске қолжетімділік ашық»**. The case itself is handed out on paper. |
| **Jury** | `/jury` page (the old `/director` link still works), login + password | Sees every team: whether the test is started/finished, score, level and answers. Grades each team on the 50-point rubric (stage 1 — 10, stage 2 — 15, stage 3 — 15, oral defense with A3 poster — 10) with a comment. Ranking, CSV export, reset a team's test, new round, edit the test questions, import private jury model answers. |
| **Main administrator** | `/jury` with login `admin` and the Render `TEACHER_PASSWORD` | Everything the jury does, plus creating/removing jury logins (tab «Доступ жюри»). |

Teams: Агенты роста, Қаржы қырандары, Cash Flow (денежный поток), Тапқыр, TABYSVIBE, Индекс удачи, Золотой капитал.

Pages update live (Server-Sent Events): the jury sees a test finish the moment it happens.

## Files

| File | Purpose |
|---|---|
| `server.js` | Node 22 HTTP API and storage |
| `index.html`, `styles.css`, `app.js` | Responsive bilingual UI with the animated campus background (`images/campus.webp`) |
| `teacher-test.json` | The original 20 bilingual questions (the jury can replace them in the UI) |
| `official-team-assignments.json` | Case texts and rubric (kept for reference; cases are given on paper) |
| `tests/` | `npm test` |

## Storage

PostgreSQL table `relay_kv` when `DATABASE_URL` is set (one row per team and one config row), otherwise `data/relay-v5.json`. Data from earlier versions is not deleted: the v4 table `economic_relay_state` stays untouched (downloadable from Settings), and v5 rows (teacher accounts) simply stay unused. Jury model answers stay out of GitHub — import the private JSON in Settings.

## Render

Render deploys `main` automatically. Environment: `TEACHER_PASSWORD` (admin password), `SESSION_SECRET` (keep the existing value), `DATABASE_URL`, `NODE_ENV=production`.

## Local development

```sh
npm install
TEACHER_PASSWORD=dev-pass node server.js   # http://localhost:3000, jury: /jury
npm test
```
