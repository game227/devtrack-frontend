import { describe, expect, it } from 'vitest'
import { DEFAULT_LANG, LANGS, STORAGE_KEY, dictionaries, readStoredLang, storeLang, translate } from './core'

describe('translate', () => {
  it('returns the translation for the requested language', () => {
    expect(translate('en', 'common.save')).toBe('Save')
    expect(translate('uz', 'common.save')).toBe('Saqlash')
  })

  it('falls back to the key when nothing is defined', () => {
    expect(translate('uz', 'does.not.exist')).toBe('does.not.exist')
  })

  it('interpolates named params and keeps unknown placeholders visible', () => {
    // no shipped string needs params yet, so exercise the interpolation on a synthetic key
    dictionaries.en['test.greeting'] = 'Hello {name}, you have {count} items'
    try {
      expect(translate('en', 'test.greeting', { name: 'Jane', count: 3 })).toBe('Hello Jane, you have 3 items')
      expect(translate('en', 'test.greeting', { name: 'Jane' })).toBe('Hello Jane, you have {count} items')
    } finally {
      delete dictionaries.en['test.greeting']
    }
  })

  it('falls back from uz to en for keys missing in uz', () => {
    dictionaries.en['test.onlyEn'] = 'English only'
    try {
      expect(translate('uz', 'test.onlyEn')).toBe('English only')
    } finally {
      delete dictionaries.en['test.onlyEn']
    }
  })
})

describe('dictionaries', () => {
  it('ships every configured language', () => {
    for (const lang of LANGS) {
      expect(Object.keys(dictionaries[lang]).length).toBeGreaterThan(0)
    }
  })

  it('has identical key sets in every language', () => {
    const enKeys = Object.keys(dictionaries.en).sort()
    const uzKeys = Object.keys(dictionaries.uz).sort()
    const missingInUz = enKeys.filter((k) => !(k in dictionaries.uz))
    const missingInEn = uzKeys.filter((k) => !(k in dictionaries.en))
    expect({ missingInUz, missingInEn }).toEqual({ missingInUz: [], missingInEn: [] })
  })

  it('has no empty values', () => {
    for (const lang of LANGS) {
      const empty = Object.entries(dictionaries[lang])
        .filter(([, value]) => value.trim() === '')
        .map(([key]) => key)
      expect(empty).toEqual([])
    }
  })

  it('uses the same {placeholders} in every language', () => {
    const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
    const mismatched = Object.keys(dictionaries.en).filter(
      (key) => key in dictionaries.uz && placeholders(dictionaries.en[key]).join() !== placeholders(dictionaries.uz[key]).join(),
    )
    expect(mismatched).toEqual([])
  })
})

describe('language storage', () => {
  it('defaults to Uzbek when nothing is stored', () => {
    expect(DEFAULT_LANG).toBe('uz')
    expect(readStoredLang()).toBe('uz')
  })

  it('round-trips a stored language', () => {
    storeLang('en')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('en')
    expect(readStoredLang()).toBe('en')
  })

  it('ignores unsupported stored values', () => {
    localStorage.setItem(STORAGE_KEY, 'ru')
    expect(readStoredLang()).toBe('uz')
  })
})
