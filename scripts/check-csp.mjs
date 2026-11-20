// Verifies the production Content-Security-Policy still matches the built page.
//
// The pre-paint theme script in index.html is inline, so the policy allows it by *hash* rather than with
// 'unsafe-inline' (which would let any injected inline script run too). A hash only matches the exact
// bytes of the script, so editing it without updating the policy would silently break the theme; this
// check turns that into a CI failure instead.
//
//   npm run build && node scripts/check-csp.mjs ../backend/render.yaml
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const renderYaml = process.argv[2]
if (!renderYaml) {
  console.error('usage: node scripts/check-csp.mjs <path to render.yaml>')
  process.exit(2)
}

const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8')
const policy = readFileSync(renderYaml, 'utf8')

// Every inline <script> (one without a src attribute) must be allowed by its hash.
const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1])
const hashes = inline.map((body) => `'sha256-${createHash('sha256').update(body).digest('base64')}'`)

// Look at the policy itself, not at comments that mention the directive: it starts at `default-src`.
const policyText = policy.slice(Math.max(policy.indexOf('default-src'), 0))
// `script-src` itself (not script-src-elem/-attr), with or without a trailing ';'.
const scriptSrc = /(?:^|[;\s])script-src\s([^;]*)/.exec(policyText)?.[1] ?? ''
const problems = []
if (!scriptSrc) problems.push('no script-src directive found in the policy')
if (scriptSrc.includes("'unsafe-inline'")) problems.push("script-src still allows 'unsafe-inline'")
for (const hash of hashes) {
  if (!scriptSrc.includes(hash)) problems.push(`script-src does not allow the inline script ${hash}`)
}

if (problems.length > 0) {
  console.error('CSP check failed:\n - ' + problems.join('\n - '))
  console.error('\nHashes of the inline scripts in dist/index.html:\n  ' + hashes.join('\n  '))
  process.exit(1)
}
console.log(`CSP ok: ${hashes.length} inline script(s) allowed by hash, no 'unsafe-inline' in script-src.`)
