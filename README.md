# Экономикалық эстафета / Экономическая эстафета — v4.0

A bilingual, mobile-friendly web app for a college economics competition. The **teacher** takes a 20-question five-choice quiz and opens student registration. Students join a team with a separate PIN and complete **one shared team submission**. The teacher has a hidden, password-protected dashboard, judging tools, rankings, QR, exports, and durable PostgreSQL storage (if `DATABASE_URL` is set).

## New in v4

- Imported all **10 different team cases** from the supplied Russian and Kazakh DOCX files; each case has the original **three stages** (analysis, calculation, decision), both languages, and a separate title.
- **7 or 10 teams:** in the teacher dashboard, under Tasks, select **7** or **10**, then click **Load ready assignments / Дайын тапсырмаларды жүктеу**. New clean installs preload the first 7 cases. Existing PostgreSQL data is **never overwritten on deploy**; loading is an explicit teacher action available only before starting the teacher's quiz.
- Students see only their team's case, with three separate written answer fields (or an optional photo upload). The document specifies **30–35 minutes** for written preparation and a **≤4-minute oral defense with an A3 poster**. The physical presentation must still take place in person.
- The teacher grades each original case on the source's **50-point rubric** (analysis 10, calculation 15, solution 15, oral defense/A3 poster 10). Scores and rankings use each assignment's proper maximum; ordinary extra tasks still use the prior **10-point** scale.
- For safety, **jury model answers are NOT in the public GitHub project or the ZIP**. A separate **`teacher-only-answers-economic-relay.json`** is provided to the project owner. In the teacher dashboard → Settings → **Import jury answers**, select that file once. The answers are saved to the server's existing protected database and visible only through authenticated teacher endpoints. Never upload the private file to GitHub.
- The teacher can still add up to **30 tasks per team**, and submitting one unlocks the next automatically. The original 20-question RU/KK teacher test, translations, team registration, persistent DB, export and privacy checks remain.

## Files

| File | Purpose |
|---|---|
| `server.js` | Node 22 HTTP API, sessions, teams, teacher questions, grading, privacy, PostgreSQL/local JSON |
| `teacher-test.json` | Existing 20 bilingual teacher test questions and answer key |
| `official-team-assignments.json` | **Public student** cases: the 10 bilingual prompts, instructions and the 50-point rubric; **no model answers** |
| `index.html`, `styles.css`, `app.js` | Bilingual responsive student and teacher UI |
| `MUGALIMGE_NUSKAULYK.md` | Full Kazakh teacher instructions (including deployment and importing private answer keys) |
| `tests/` | Smoke tests for both old and new functionality; run `npm test` |

## Deployment to Render

1. Extract this ZIP. Upload **the contents**, not the ZIP, to `https://github.com/gazizsetly-afk/economic-relay`, replacing files of the same names. Keep `official-team-assignments.json` and `teacher-test.json` at the repository root. **Do not upload** the separately supplied `teacher-only-answers-economic-relay.json`, a `.env` file, a PostgreSQL connection string, or any student responses.
2. In Render, use a **Node** Web Service, branch `main`, **Build:** `npm install`, **Start:** `npm start`. The supplied `.node-version` specifies `22.16.0`.
3. Environment secrets: `TEACHER_PASSWORD` (private, strong), `SESSION_SECRET` (random 32+ characters), `NODE_ENV=production`, `DATABASE_URL` (private Neon PostgreSQL connection URL). Do not change `SESSION_SECRET` on an existing working installation, because team PIN encryption depends on it.
4. Trigger **Manual Deploy → Deploy latest commit** if auto-deploy does not run. Look for `Persistent PostgreSQL storage connected` and `Live` in Render. Current service URL might be `https://economic-relay-1.onrender.com`, but use the URL shown on your own Render dashboard.
5. Take a backup from the teacher dashboard → Settings → JSON export. If a teacher quiz is already complete, finish/archive that round using **Settings → New round** before importing new cases; the import is deliberately blocked once a lesson has started.
6. Teacher → **Tasks** → import the 7 or 10 prepared student cases. Teacher → **Settings** → import the **separate private answer JSON** from their local computer once. Then take the 20-question teacher quiz and press **Open student assignments**.

PostgreSQL stores the one-row `economic_relay_state` record as JSONB. Render Free local storage is ephemeral; without `DATABASE_URL`, data can be lost on restarts. Take backups before deployment or new rounds. The import reuses existing team names and PINs in corresponding positions when possible, but it *replaces those teams' case lists* while in setup. Confirm this explicitly in the UI.

## Local development

```sh
npm install
# set TEACHER_PASSWORD and SESSION_SECRET in your environment, or copy .env.example to .env
node --env-file=.env server.js
# visit http://localhost:3000
npm test
```

Student photographs accept JPG/PNG/WebP up to **2.7 MB**. Each student's name belongs only to the selected team, and the **first registrant becomes captain**; only the captain may submit. The teacher can change captains. Team assignments are isolated on server routes. Model answer imports can only be performed by the authenticated teacher.
