# Interview OS

A local-first interview preparation dashboard built for a **Senior / Lead Frontend Engineer** targeting **₹50 LPA+** roles. It brings a 22-week preparation roadmap, daily study schedule, technical skill tracker, job pipeline, interview feedback loop, mock scores, tasks, goals, company research and notes into one focused workspace.

All records live in your browser's `localStorage` by default. JSON/CSV exports let you back up or move your data. An optional end-to-end encrypted sync to a **secret GitHub Gist** keeps laptop and phone in step without running your own backend.

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
- **Settings** — profile/targets, light/dark/system themes, optional encrypted GitHub Gist sync, JSON backup and validated import (merge or replace), CSV exports, restore roadmap/timetable, full reset and storage diagnostics.
- **Polished UX** — responsive layout, mobile drawer navigation, accessible dialogs, keyboard focus management, toasts, confirmation dialogs, empty states, loading skeletons, 404 page and error boundary.

## Tech stack

| Area | Choice |
| --- | --- |
| UI | React 19, TypeScript, Tailwind CSS, Lucide React |
| Build | Vite 7 |
| Routing | React Router 7 (`HashRouter`) |
| State | Zustand with `persist` middleware |
| Persistence | Browser `localStorage` with schema versioning and safe wrappers; optional encrypted GitHub Gist mirror |
| Encryption | Web Crypto API: AES-GCM-256 + PBKDF2-SHA-256 |
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
- Sync config key: `interview-prep-os-sync` | Sync token: `interview-prep-os-sync-token`
- Schema version: `2`
- Storage is wrapped defensively. Corrupt, unavailable or full storage produces a non-blocking notice instead of breaking the app.
- Older or partial saved data is migrated between schema versions and fills newly introduced fields with defaults.
- Data created by a newer schema is rejected with a clear message rather than silently overwritten.
- **Encrypted sync**: content is encrypted client-side with AES-GCM-256 and PBKDF2-SHA-256 (600,000 iterations). The GitHub token and passphrase are never included in exports. The Gist is secret (unlisted, not private) — GitHub still sees metadata and revision history. There is **no passphrase recovery**; keep your passphrase safe.

### JSON backup

**Settings → Data & backup → Export JSON backup** downloads a complete snapshot:

```json
{
  "app": "interview-prep-os",
  "version": 2,
  "exportedAt": "2026-11-02T00:00:00.000Z",
  "data": { "...": "all application data" }
}
```

Import validates the file with Zod and shows record counts before applying it:

- **Merge** — newest edit wins per record (by `updatedAt`), tombstones and reset markers are respected, and imported records with new IDs are added. Settings use their own timestamps.
- **Replace** — the backup becomes the source of truth for all data and settings (a full reset is propagated to connected devices on the next sync).

CSV exports are available for applications, interviews and the roadmap.

Clearing browser storage, using a private window, or switching browsers/devices will remove access to local data. Keep a JSON backup. Sync settings, tokens and passphrases are never included in JSON backups.

## Optional encrypted cross-device sync

Sync is **off by default**. When enabled, the browser encrypts your workspace and stores one file named `interview-os.enc.json` in a secret GitHub Gist. `localStorage` remains the primary copy, so the app works offline and every feature keeps working with sync disabled.

### What is stored where

| Item | Location | Notes |
| --- | --- | --- |
| App data | Browser `localStorage` (`interview-prep-os-data`) | Primary source of truth |
| Encrypted snapshot | Secret GitHub Gist | Revisions overwrite the same file |
| GitHub token | Browser `localStorage` (`interview-prep-os-sync-token`) | Stored separately, excluded from exports |
| Derived AES key | IndexedDB | Non-extractable; remembered per device |
| Passphrase | Never stored | Required again only after locking/disconnecting |

### Create a token

Use a dedicated token with the smallest useful scope:

1. Open GitHub **Settings → Developer settings → Personal access tokens → Fine-grained tokens**.
2. Generate a token for your account.
3. Under **Account permissions → Gists**, choose **Read and write**.
4. Copy the token into the app's setup dialog.

A classic token with only the `gist` scope also works. Do not use a token with repository access.

### Set up the first device

1. Go to **Settings → Cross-device sync → Set up encrypted sync**.
2. Paste the token and choose a passphrase (at least 12 characters).
3. Save the passphrase in a password manager. It is never uploaded and cannot be recovered.
4. The current workspace is uploaded as the first encrypted snapshot.

### Connect another device

1. On the second device, open **Settings → Cross-device sync → Join an existing Gist**.
2. Paste the Gist URL (or ID), the same passphrase and the token.
3. Choose **Use the cloud workspace** on a new browser/phone, or **Merge with local data** to combine records newest-wins.
4. The device-local theme is preserved; it is not overwritten by sync.

### How merging works

- Every record has `updatedAt`; nested roadmap tasks, tech topics and goal milestones have their own timestamps.
- Normal deletion writes a tombstone so a deleted record is not resurrected by another device.
- Full reset or replace-import writes a `resetAt` marker that discards older records from the cloud copy.
- Conflicts resolve newest-wins per record. There is no blocking conflict dialog.
- Auto-sync runs 4 seconds after an edit, on launch, focus, reconnect and every 5 minutes. Manual **Sync now** is always available.
- The topbar chip and Settings card show the current status. Auth, missing Gist, newer schema, decryption and rate-limit errors are surfaced explicitly.

### Security limits

- A **secret Gist is unlisted, not private**. Anyone with its URL can see the encrypted file.
- GitHub sees the Gist, its metadata, timestamps and revision history. It does **not** receive the passphrase or plaintext.
- Content is authenticated encrypted (AES-GCM) with a random salt and IV. The outer metadata is included in the authenticated data.
- Old cloud revisions remain on GitHub until the Gist is deleted. Changing the passphrase re-encrypts only the current revision; old revisions remain decryptable with the old passphrase.
- The token is stored in plaintext in `localStorage`. Use a dedicated, minimal-scope token and revoke it on shared/lost devices.
- There is no passphrase recovery. If you forget it, disconnect and delete the cloud copy, then create a new sync.
- This is not a substitute for password-manager-protected backups. Keep periodic JSON exports.

### Disconnect and delete

- **Disconnect** stops syncing on that device and removes its token, key and sync config. The Gist and local data are unchanged.
- **Delete cloud copy** deletes the Gist and its revision history from GitHub. Local data is unchanged.
- **Reset all data** does not delete the Gist; it resets local data and propagates the reset on the next sync.

## Project structure

```text
.
├── .github/workflows/deploy.yml   # GitHub Pages deployment
├── public/favicon.svg
├── src
│   ├── app
│   │   ├── ErrorBoundary.tsx
│   │   ├── providers/             # theme, storage notices, sync lifecycle
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
│   │   ├── sync/                  # crypto, Gist client, merge, engine, key store
│   │   ├── csv.ts
│   │   ├── dates.ts
│   │   └── utils.ts
│   ├── stores/                    # app + sync stores, transient UI store
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
