# DevTrack Frontend

React + Vite + TypeScript single-page app for DevTrack, in **Uzbek (default) and English**, plus the public
landing page. It talks to [devtrack-backend](https://github.com/game227/devtrack-backend) over REST
(`/api/v1/`) and shares no code with it.

Stack: React 19, React Router 7, TanStack Query 5, Tailwind CSS 4 (design tokens in
`src/styles/index.css`), Axios, Vitest + Testing Library.

## Setup

```bash
npm install
cp .env.example .env   # adjust VITE_API_BASE_URL if the backend runs elsewhere
npm run dev
```

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check and production build (`dist/`) |
| `npm run lint` | oxlint |
| `npm test` | Vitest (jsdom), including translation-key guard tests |

## Internationalization

- Dictionaries live in `src/i18n/locales/{en,uz}/<area>.ts` as flat `'area.key'` maps and are merged
  automatically — add a file, no registration needed.
- Use `const { t } = useI18n()` (or `useT()`); `t('key', { param })` interpolates `{param}`.
  Fallback order is selected language → English → the key itself.
- `npm test` fails if the two languages have different keys, or if a literal `'area.key'` used in the
  source does not exist, so a forgotten translation cannot ship.
- Server error messages (DRF has no Uzbek catalog) are mapped to keys in `src/i18n/apiErrors.ts`;
  unknown messages are shown as sent. Uzbek dates are formatted by hand because browsers ship poor
  Uzbek date data.
- The language is stored in `localStorage` (`devtrack_lang`); the default is Uzbek.

## Design system

"Black & Violet": black surfaces, `#292d30` borders, white text, muted `#a1a4a5`, links `#70b8ff`,
violet `#9281f7` only for code/ids, status colors (`success/warning/info/danger/merged`) only next to a
text label. Use the tokens (`text-danger`, `bg-fg`, …) — not raw Tailwind palette classes. No shadows.

Contrast is part of the system (WCAG 2.1 AA, checked with axe-core in both themes): every text token meets
4.5:1 on its background, and form controls use `border-border-strong` (3:1, WCAG 1.4.11) — `border-border`
is for cards and dividers only. `formInputClass` already does this.

## Accessibility conventions

- Wrap fields in `FormField`: the label names the control, and errors are announced (`role="alert"`) and
  tied to it (`aria-invalid`, `aria-describedby`).
- `Layout` provides a skip link, named landmarks, and the page title: it reads the page's `<h1>`, so every
  page needs exactly one and the tab/history entry says where you are.
- An icon button's accessible name must contain any text it shows (a count, a shortcut) — write it as
  `"Notifications, 3"`, not `"Notifications (3)"` (axe rejects the brackets).
- Interactive targets are at least 24×24 px. Anything draggable also has a keyboard/touch alternative
  (the board's per-card status picker).

## Live updates

`Layout` calls `useLiveUpdates(workspaceId)` (`src/features/live`). While the tab is visible it asks
`GET /changes/?workspace=&since=` every 10 s; the answer names the areas that changed (issues, projects,
members, notifications, invitations) and only the matching TanStack queries are refetched. A hidden tab
stops asking and catches up when it comes back. Failed checks are ignored; the next one retries.

## Members

`/members` (`WorkspaceMembersPage`) lists the workspace's people and pending invitations. What each role
may do is in `src/features/workspace/memberRules.ts`, mirroring the backend's
`apps/workspaces/membership.py`; the server enforces it either way.

## Structure

```
src/
  app/          # entry point, route table (pages are lazy-loaded)
  pages/        # one component per route
  components/   # shared UI: layout/sidebar, badges, icons, charts, forms
  features/     # auth, workspace and activity helpers
  i18n/         # engine, hooks, locales, API-error mapping
  api/          # axios client, pagination helper, typed API calls
  types/        # types mirroring backend serializers
  lib/          # small shared helpers
  test/         # Vitest setup and render helpers
public/screens/ # product screenshots (uz/en) used by the landing page
```

## Landing page and screenshots

`/` is the landing page (`src/pages/LandingPage.tsx`); it shows `public/screens/<lang>/*.png`. To
regenerate them, seed the backend with `python manage.py seed_demo`, sign in as `jane.dev`/`demo1234`
and capture the dashboard, board, issue, timeline, analytics, project and settings pages at 1440×900.

## CI

`.github/workflows/ci.yml` runs lint, tests and the production build on every push and pull request,
`npm audit` for production dependencies, and an end-to-end job against a real backend that:

- checks the production Content-Security-Policy (in the backend's `render.yaml`) still allows the built
  page's only inline script by its hash — `npm run build && npm run check:csp` locally, with the backend
  repository checked out next to this one;
- runs the Playwright specs in `e2e/` against the production build (`vite preview`): the golden path,
  and who may change an issue (creator, assignee, bystander, outsider). Locally: start the backend, then
  `npm run build && npm run preview -- --port 5173` and `npm run test:e2e` (`E2E_API_URL` points the
  specs' API setup at the backend, default `http://localhost:8000/api/v1`).
