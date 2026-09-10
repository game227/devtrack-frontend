# DevTrack Frontend

React + Vite + TypeScript frontend for DevTrack. Talks to the [devtrack-backend](../devtrack-backend) REST API at `/api/v1/` — no direct database access, no shared code between the two repos.

Stack: React 19, React Router 7, TanStack Query 5, Tailwind CSS 4, Radix UI primitives, Axios.

## Setup

```bash
nvm use          # or: nvm install --lts && nvm use --lts
npm install
cp .env.example .env   # adjust VITE_API_BASE_URL if the backend runs elsewhere
npm run dev
```

## Structure

```
src/
  app/          # entry point, root component, route table
  pages/        # one component per route (see router.tsx)
  features/     # feature-scoped components/hooks/api (populated from Phase 3 on)
  components/   # shared UI primitives and layout
  api/          # axios instance + typed API calls
  hooks/        # shared React Query hooks
  types/        # types mirroring backend serializers
  styles/       # Tailwind entry + theme tokens
```

Status: Phase 1–2 scaffold only — routing and layout shell are wired up, but there is no auth, no API integration, and no real feature UI yet. That starts in Phase 3.
