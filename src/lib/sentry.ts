import * as Sentry from '@sentry/react'

// Links that carry a secret in their path or query: a password-reset or email-verification token, or
// the GitHub OAuth hand-over. Error reports must never contain them.
const SECRET_PATHS: Array<[RegExp, string]> = [
  [/\/reset-password\/[^/?#]+\/[^/?#]+/g, '/reset-password/:uid/:token'],
  [/\/verify-email\/[^/?#]+\/[^/?#]+/g, '/verify-email/:uid/:token'],
]
const SECRET_PARAMS = ['code', 'state', 'token', 'github_pending', 'ticket']

export function scrubUrl(url: string): string {
  let result = url
  for (const [pattern, replacement] of SECRET_PATHS) result = result.replace(pattern, replacement)
  return result.replace(new RegExp(`([?&](?:${SECRET_PARAMS.join('|')})=)[^&#]*`, 'g'), '$1[redacted]')
}

// No-op until VITE_SENTRY_DSN is set at build time; set it and error tracking turns on with no further
// code changes. Nothing personal is sent, and URLs are scrubbed of tokens first.
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'production',
    tracesSampleRate: 0.1,
    beforeSend(event) {
      if (event.request?.url) event.request.url = scrubUrl(event.request.url)
      if (event.request?.headers) delete event.request.headers.Authorization
      return event
    },
    beforeBreadcrumb(breadcrumb) {
      const data = breadcrumb.data as Record<string, unknown> | undefined
      for (const key of ['url', 'from', 'to']) {
        if (data && typeof data[key] === 'string') data[key] = scrubUrl(data[key] as string)
      }
      return breadcrumb
    },
  })
}

export function reportError(error: unknown) {
  if (import.meta.env.VITE_SENTRY_DSN) Sentry.captureException(error)
}
