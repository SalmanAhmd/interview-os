# Interview OS

A local-first interview preparation dashboard built for a **Senior / Lead Frontend Engineer** targeting **₹50 LPA+** roles. It brings a 22-week preparation roadmap, daily study schedule, technical skill tracker, job pipeline, interview feedback loop, mock scores, tasks, goals, company research and notes into one focused workspace.

There is **no backend, account, database or cloud sync**. Every record lives in your browser's `localStorage`, and JSON/CSV exports let you back up or move your data.

## Highlights

- **Dashboard** — readiness score, current week, days to target LWD, weekly study progress, application funnel, mock trend, skill confidence, upcoming interviews/tasks and recent activity.
- **22-week roadmap** — dated preparation plan from **2 Nov 2026 to 31 Mar 2027**, with weekly themes, technical focus, exercises, mock objectives, job-search actions, deliverables, notes, task checklists and progress.
- **Daily timetable** — recurring weekly study slots, per-date completion/skip tracking, daily notes and week navigation.
- **Technical preparation** — six skill categories with per-topic status, 1–5 confidence, revision dates, notes, interview questions and exercises.
- **Applications** — Kanban board and table views, search/filters, full application details, inline stage changes, stage history with notes, follow-up reminders, recruiter details, CSV export and deletion.
- **Interview log** — real interview records linked to applications, feedback fields, outcomes, next-round dates, filtering and CSV export.
- **Mock interviews** — typed mocks, scores, trends, strengths/weaknesses, feedback, action items and filters.
- **Tasks & goals** — daily task management plus long-term goals with milestones and automatic progress.
- **Company research** — target-company cards with priority, category, culture, interview process, tech stack and application status.
- **Notes** — markdown editor with preview, categories, tags, pinning and search.
- **Settings** — profile/targets, light/dark/system themes, JSON backup and validated import (merge or replace), CSV exports, restore roadmap/timetable, full reset and storage diagnostics.
- **Polished UX** — responsive layout, mobile drawer navigation, accessible dialogs, keyboard focus management, toasts, confirmation dialogs, empty states, loading skeletons, 404 page and error boundary.

## Tech stack

| Area | Choice |
| --- | --- |
| UI | React 19, TypeScript, Tailwind CSS, Lucide React |
| Build | Vite 7 |
| Routing | React Router 7 (`HashRouter`) |
| State | Zustand with `persist` middleware |
| Persistence | Browser `localStorage` with schema versioning and safe wrappers |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Dates | date-fns |

## Getting started

Requirements: **Node.js 20+** and npm.

```bash
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

### All scripts

```bash
npm install     # install dependencies
npm run dev     # start the development server
npm run build   # type-check and create a production build in dist/
npm run preview # serve the production build locally
npm run typecheck # run TypeScript only
```

## Using the app

1. Start on the **Dashboard** for a summary and the current week's focus.
2. Plan the week in **Roadmap**, then execute in **Daily Timetable**.
3. Track skills in **Technical Prep** and research targets in **Company Research**.
4. Record applications in **Applications**; open a card to move stages and keep history.
5. Log real interviews and mocks as they happen, then turn feedback into **Tasks**.
6. Export a JSON backup from **Settings** regularly.

The seeded roadmap, timetable, goals and technical topics are ready to use. Applications, interviews, mocks, companies and notes start empty so they reflect your real search.

## Data, backups and privacy

- Storage key: `interview-prep-os-data`
- Schema version: `1`
- Storage is wrapped defensively. Corrupt, unavailable or full storage produces a non-blocking notice instead of breaking the app.
- Older or partial saved data is passed through a migration step that fills newly introduced fields with defaults.
- Data created by a newer schema is rejected with a clear message rather than silently overwritten.

### JSON backup

**Settings → Data & backup → Export JSON backup** downloads a complete snapshot:

```json
{
  "app": "interview-prep-os",
  "version": 1,
  "exportedAt": "2026-11-02T00:00:00.000Z",
  "data": { "...": "all application data" }
}
```

Import validates the file with Zod and shows record counts before applying it:

- **Merge** — existing records win by ID; imported records with new IDs are added. Settings are unchanged.
- **Replace** — the backup becomes the source of truth for all data and settings.

CSV exports are available for applications, interviews and the roadmap.

Clearing browser storage, using a private window, or switching browsers/devices will remove access to local data. Keep a JSON backup.

## Project structure

```text
.
├── .github/workflows/deploy.yml   # GitHub Pages deployment
├── public/favicon.svg
├── src
│   ├── app
│   │   ├── ErrorBoundary.tsx
│   │   ├── providers/             # theme + storage notices
│   │   └── router.tsx             # HashRouter routes and lazy pages
│   ├── components
│   │   ├── charts/                # Recharts wrappers
│   │   ├── common/                # headers, stats, markdown, toasts
│   │   ├── layout/                # sidebar, topbar, mobile navigation
│   │   └── ui/                    # buttons, inputs, dialogs, tabs, etc.
│   ├── data/                      # seeded roadmap, timetable, goals, topics
│   ├── features/
│   │   ├── applications/
│   │   ├── companies/
│   │   ├── dashboard/
│   │   ├── interviews/
│   │   ├── mock-interviews/
│   │   ├── notes/
│   │   ├── roadmap/
│   │   ├── settings/
│   │   ├── tasks/
│   │   ├── technical/
│   │   └── timetable/
│   ├── hooks/useToast.ts
│   ├── lib
│   │   ├── analytics/             # dashboard and timetable metrics
│   │   ├── storage/               # safe storage, schemas, backup/import
│   │   ├── csv.ts
│   │   ├── dates.ts
│   │   └── utils.ts
│   ├── stores/                    # persisted app store + transient UI store
│   ├── types/index.ts
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Deployment to GitHub Pages

The app uses `HashRouter`, so all routes work on GitHub Pages without server-side rewrites. The workflow in `.github/workflows/deploy.yml` builds the app and publishes `dist/` using GitHub's Pages artifact flow.

1. Create a GitHub repository and push this project to `main`.

   ```bash
   git init
   git add .
   git commit -m "Initial Interview OS"
   git branch -M main
   git remote add origin https://github.com/<your-user>/<your-repo>.git
   git push -u origin main
   ```

2. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.

3. The workflow runs automatically on every push to `main` (or manually via **Actions → Deploy to GitHub Pages → Run workflow**).

4. Open `https://<your-user>.github.io/<your-repo>/`.

The workflow derives the Vite base path from the repository name:

- project site: `/<repo-name>/`
- user/organization site (`<user>.github.io`): `/`

For a custom domain served at the root, build with `BASE_PATH=/ npm run build`. In development the base path is always `/`.

## Notes for future development

- Add new persisted fields to `src/types/index.ts`, the Zod schemas in `src/lib/storage/schemas.ts`, the defaults in `src/data/initial-data.ts`, and bump `SCHEMA_VERSION` with a migration step when the stored shape changes.
- Keep all writes inside the Zustand store so schema handling and persistence stay in one place.
- New routes should be added to `src/app/router.tsx` and `src/components/layout/nav-items.ts`.
