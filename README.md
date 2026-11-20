# Экономикалық эстафета / Экономическая эстафета — v5

A bilingual (Kazakh / Russian) web app for a college economics competition.

## Who does what

| Role | How they sign in | What they can do |
|---|---|---|
| **Teacher** | Scans their **personal QR** (or opens their personal link `/t/…`) and lands straight on the test; can also sign in with login and password. Accounts are created only by the director (no self-registration) | Takes the 20-question test, gets a personal 6-digit **class code** + QR, picks how many teams (2–20; cases repeat after 10), opens the cases for their students, grades on the 50-point rubric, exports CSV, starts a new lesson |
| **Supervisor** (руководитель / басшы) | "Вход руководителя" link in the footer, password = `TEACHER_PASSWORD` from Render | Sees every teacher: test score and level, class status, students, submissions, grades and answers; resets passwords, blocks/deletes accounts, creates teacher accounts, imports jury model answers, exports a CSV report |
| **Student** | Enters the teacher's class code (or scans the QR), picks a team, types the team PIN | Sees only their team's case (3 stages, KK/RU). The first student in a team is the captain and sends one shared answer (text for each stage + optional photo) |

The teacher's cases only open after that teacher has finished the test for the current lesson.

- A teacher can **edit the case** of any of their teams (title + 3 stages, KK and RU) until that team submits, and restore the original. Jury model answers are not shown for edited cases.
- Only the **director** can change the teacher test (Director → Teacher test): 5–40 questions, 2–5 options each, both languages. Results already taken keep the questions they were taken with.
- **Director page:** `/director`. The main administrator signs in there with login `admin` and the `TEACHER_PASSWORD`; under **Director access** they create logins and passwords for the director or other inspectors. Those accounts see all teachers, students and grades and can edit the test, but cannot manage other director accounts.

## Content (unchanged)

- `teacher-test.json` — the 20 bilingual five-choice questions and answer key (answers are sent to a teacher only after they finish).
- `official-team-assignments.json` — the 10 bilingual team cases, instructions and the 50-point rubric (analysis 10, calculation 15, decision 15, oral defense with A3 poster 10). **No model answers.**
- Jury model answers stay out of GitHub. The supervisor imports the private `teacher-only-answers-economic-relay.json` once (Settings → Jury answers); teachers then see them while grading.

## Files

| File | Purpose |
|---|---|
| `server.js` | Node 22 HTTP API: accounts, sessions, classes, grading, supervisor, storage |
| `index.html`, `styles.css`, `app.js` | Responsive bilingual UI with the animated campus background (`images/campus.webp`) |
| `MUGALIMGE_NUSKAULYK.md` | Kazakh instructions for teachers and the supervisor |
| `tests/` | `npm test` |

## Storage

With `DATABASE_URL` set, data lives in PostgreSQL table `relay_kv` (one row per teacher, class code, login and photo). The table from v4 (`economic_relay_state`) is **not modified**: on first start v5 copies the jury answers, the supervisor's changed password and earlier open-test results from it, and the supervisor can download the whole old record (Settings → Data of the previous version). Without `DATABASE_URL` a local `data/relay-v5.json` file is used (development only).

## Deployment to Render

Render deploys `main` automatically. Environment: `TEACHER_PASSWORD` (supervisor password), `SESSION_SECRET` (keep the existing value), `DATABASE_URL`, `NODE_ENV=production`. Optional: `PUBLIC_URL` for QR links, `SUPERVISOR_PASSWORD` to use a different supervisor password than `TEACHER_PASSWORD`.

## Local development

```sh
npm install
TEACHER_PASSWORD=dev-pass node server.js   # http://localhost:3000
npm test
```
