# DevTrack Frontend

React + Vite + TypeScript single-page app for DevTrack, in **Uzbek (default), Russian and English**, plus the public
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
- `npm test` fails if a language is missing a key, or if a literal `'area.key'` used in the
  source does not exist, so a forgotten translation cannot ship.
- Server error messages (DRF has no Uzbek catalog) are mapped to keys in `src/i18n/apiErrors.ts`;
  unknown messages are shown as sent. Uzbek dates are formatted by hand because browsers ship poor
  Uzbek date data.
- PWA: `public/manifest.webmanifest`, icons and `public/sw.js` make the app installable. The service worker
  (production builds only) caches only `/assets/*` and the shell for offline navigation; API calls are
  never cached. It also shows Web Push notifications; Settings has the switch when the API has VAPID keys.
- Issue tools: share links (`/share/:token`, a public read-only page) and printing, templates in the
  new-issue dialog, bulk changes on issue lists (tick rows, then one change; the server skips what you
  may not change), WIP limits per board column, issue history and time logging on the issue page,
  recurring issues on the project overview, and the phone bottom navigation.
- Issue-page keys (registered through `setPageShortcuts`, tried after the global ones): S status,
  A assignee, P priority, E edit description, M comment, T log time.
- `VITE_DEMO_ENABLED=true` (with `DEMO_ENABLED` on the API) adds "Try the demo" to the landing page and a
  banner inside the app for demo accounts.
- The language is stored in `localStorage` (`devtrack_lang`); the default is Uzbek. A test checks that
  every English key exists in Uzbek and Russian with the same `{placeholders}`. Russian dates use the
  browser's `ru-RU` data. The landing page has screenshots in all three languages.

## Design system

Monochrome glass. A soft grey canvas ruled with a faint grid, frosted panels with a light edge, ink-black
primary actions, and one warm accent (orange) for "live" and "you are here". The work itself rides the
line of five stations (backlog, to do, in progress, review, done): the logo, the station line across the
board, the status stepper on an issue, the small track in every issue row, the home page's count per
station and the project timeline all draw it. Station colours are the only other colours, and always sit
next to a label or a position on the line.

- **Tokens** live in `src/styles/index.css` (light by default, `data-theme="dark"` redefines them):
  `bg` (canvas) and `grid`, `surface`/`well`/`edge` (panels), `brand` (ink), `orange`, the `st-*`
  stations, text-safe state colours. Use the tokens, never raw palette classes.
- **Utilities** in the same file: `.glass` (frosted, blurred: top bar, menus, dialogs, toasts), `.btn-ink`
  (the primary button's gradient), `.corners` and `.crosshair` (viewfinder marks around illustrations
  only), `.on-ink` (bright station colours inside dark objects).
- **Recipes** in `src/components/ui.ts` (`button()`, `panel`, `listPanel`, `badge`, `pageHeader`, …) and
  the line pieces in `src/components/Track.tsx`. Compose these instead of writing new button or panel
  classes.
- **Type**: Geist for everything (headings medium weight with tight tracking), Geist Mono only for
  code-like text (issue keys, commit SHAs, branches, shortcuts). Both are self-hosted through
  `@fontsource-variable`, so the CSP allows no third-party font host.
- **Layout**: a floating glass top bar (workspace, sections as pills, search, New issue, live dot,
  notifications, account menu) and, inside a project, its sections as a segmented control. Lists are
  rows separated by hairlines. Radii follow hierarchy (controls 10px, cards 12px, panels 18px, chips
  round); shadows are hairline, deeper only under things that float.
- **One dialog creates issues** (`features/issues/NewIssueDialog.tsx`), opened through
  `useNewIssue()` from the top bar, the C shortcut, the palette, a board column's "+" and `?new=1`.
- **Motion answers actions** (a card landing, the stepper's train, a burst on Done, toasts) plus one
  orchestrated moment on the landing page; all of it stops under `prefers-reduced-motion`.

The Django admin wears the same tokens (`devtrack-backend/apps/adminui`).

Contrast is part of the system (WCAG 2.1 AA, checked with axe-core in both themes and at phone width):
text tokens meet 4.5:1 on `bg`, `surface` and `well`; `border-strong` and the station colours meet
3:1 (WCAG 1.4.11), so form controls use `border-border-strong` (`formInputClass` already does).

### Layout and patterns

- **App shell**: from `lg` a floating sidebar (`components/AppSidebar.tsx`) holds the workspace switcher,
  the main sections, starred projects (`PUT /projects/<id>/favorite/`, the star next to a project's name)
  and settings; it narrows to icons (remembered in `devtrack_sidebar`). The top bar shows where you are
  (`components/Breadcrumbs.tsx`). Below `lg` a drawer has the same sections; phones also get the bottom bar.
- **Station glyphs** (`StationGlyph` in `components/Track.tsx`): each station also has a shape (dashed
  ring, ring, half, three-quarters, full with a tick), so status never depends on colour alone.
- **Home**: getting-started steps for a new workspace (ticked from real data, hideable), "My day" (overdue,
  today and the coming week of my issues), the station line, compact recent activity.
- **Board**: compact or comfortable cards, columns that fold to a strip, a row per assignee, and a dashed
  "lands here" placeholder while dragging; preferences per project in `devtrack_board:<id>`.
- **Issue page**: empty parts (steps, links, files) wait in one "Add" row; properties are sticky on
  desktops and open as a bottom sheet on phones; "Saved" confirms each change; titles glide from a card
  or row into the heading (view transitions, off with reduced motion).
- **Phones**: swipe a list row left to send the issue to its next station (with undo); small buttons grow
  to 40-44px on coarse pointers.
- **Charts**: the burndown has a crosshair readout (pointer, or arrow keys when focused), project rows a
  weekly "finished" column chart, health a ring meter. Dark theme: three depth levels, soft white text.
- **Landing**: an interactive practice board (`components/landing/TryBoard.tsx`): drag or press cards,
  or write a commit like `fixes #2`.

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
public/screens/ # product screenshots (uz/en/ru) used by the landing page
```

## Landing page and screenshots

`/` is the landing page (`src/pages/LandingPage.tsx`): the hero is an ink device
(`components/landing/HeroDevice.tsx`) whose screen is a tiny live board, framed by viewfinder corners;
then real screenshots from `public/screens/<lang>/` (`board`, `issue`, `analytics`, `timeline`, `dashboard`).
To regenerate them without touching your own data, seed a scratch database (`createdb
devtrack_screens`, then `DATABASE_URL=…/devtrack_screens python manage.py migrate && python manage.py
seed_demo`), run that backend, sign in as `jane.dev`/`demo1234` in the demo workspace, capture each page
at 1440×900 in the light theme, save them as WebP (`Image.open(png).save(webp, 'WEBP', quality=82, method=6)`
with Pillow; about a third of the PNG size), and drop the database afterwards.

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
