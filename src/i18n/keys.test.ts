import { describe, expect, it } from 'vitest'
import { dictionaries } from './core'

// Static guard: every literal 'namespace.key' string in the source must exist in the dictionaries,
// so a typo or a forgotten translation fails the test suite instead of showing a raw key in the UI.
const sources = import.meta.glob<string>(
  ['/src/**/*.{ts,tsx}', '!/src/**/*.test.{ts,tsx}', '!/src/i18n/locales/**', '!/src/test/**'],
  { query: '?raw', import: 'default', eager: true },
)

const namespaces = new Set(Object.keys(dictionaries.en).map((key) => key.split('.')[0]))
const KEY_LITERAL = /['"]([a-z][A-Za-z]*\.[A-Za-z_][\w.]*)['"]/g

describe('translation keys used in source', () => {
  it('all exist in every language', () => {
    const unknown: string[] = []
    for (const [file, code] of Object.entries(sources)) {
      for (const match of code.matchAll(KEY_LITERAL)) {
        const key = match[1]
        if (!namespaces.has(key.split('.')[0])) continue
        if (!(key in dictionaries.en) || !(key in dictionaries.uz)) unknown.push(`${file}: ${key}`)
      }
    }
    expect(unknown).toEqual([])
  })
})
