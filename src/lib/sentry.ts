import * as Sentry from '@sentry/react'

// No-op until VITE_SENTRY_DSN is set at build time (no Sentry account exists
// yet) — set it later and error tracking turns on with no further code
// changes.
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
  })
}
