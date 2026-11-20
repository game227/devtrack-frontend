// Links that point at GitHub come from GitHub's own data (webhooks, the API), but a link is only ever
// rendered if it really is an https URL on github.com: never javascript:, data: or another site.
const GITHUB_HOST = /^(?:[a-z0-9-]+\.)*github\.com$/i

export function githubUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && GITHUB_HOST.test(url.hostname) ? url.toString() : undefined
  } catch {
    return undefined
  }
}
