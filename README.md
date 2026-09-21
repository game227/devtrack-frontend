# DevTrack Frontend

React + Vite + TypeScript single-page app for DevTrack, in **Uzbek (default) and English**, plus the public
landing page. It talks to [devtrack-backend](https://github.com/game227/devtrack-backend) over REST
(`/api/v1/`) and shares no code with it.

Stack: React 19, React Router 7, TanStack Query 5, Tailwind CSS 4 (design tokens in
`src/styles/index.css`), Radix UI, Axios, Vitest + Testing Library.

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

`.github/workflows/ci.yml` runs lint, tests and the production build on every push and pull request.
