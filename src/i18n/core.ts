export type Lang = 'uz' | 'en'

export const LANGS: Lang[] = ['uz', 'en']
export const DEFAULT_LANG: Lang = 'uz'
export const STORAGE_KEY = 'devtrack_lang'

type Dict = Record<string, string>

function collect(modules: Record<string, unknown>): Dict {
  const merged: Dict = {}
  for (const mod of Object.values(modules)) {
    Object.assign(merged, mod as Dict)
  }
  return merged
}

// Every file under locales/<lang>/ default-exports a flat { 'namespace.key': 'text' }
// record; they are merged here automatically, so adding a namespace never means
// touching a shared file.
export const dictionaries: Record<Lang, Dict> = {
  en: collect(import.meta.glob('./locales/en/*.ts', { eager: true, import: 'default' })),
  uz: collect(import.meta.glob('./locales/uz/*.ts', { eager: true, import: 'default' })),
}

export type TranslateParams = Record<string, string | number>

export function translate(lang: Lang, key: string, params?: TranslateParams): string {
  const template = dictionaries[lang][key] ?? dictionaries.en[key] ?? key
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_match, name: string) => String(params[name] ?? `{${name}}`))
}

export function readStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'uz' || stored === 'en') return stored
  } catch {
    // localStorage unavailable (private mode, etc.) — fall through to the default.
  }
  return DEFAULT_LANG
}

export function storeLang(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // Not persisted, still applies for this page load.
  }
}

const INTL_LOCALES: Record<Lang, string> = { uz: 'uz-UZ', en: 'en-US' }

export function formatDateTime(lang: Lang, iso: string): string {
  return new Date(iso).toLocaleString(INTL_LOCALES[lang], { dateStyle: 'medium', timeStyle: 'short' })
}

// Date-only strings ("2026-09-18") are calendar dates, not instants: parsing them as UTC
// midnight would show the previous day west of UTC, so build them in local time instead.
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

export function formatDate(lang: Lang, iso: string): string {
  const dateOnly = DATE_ONLY.exec(iso)
  const date = dateOnly ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])) : new Date(iso)
  return date.toLocaleDateString(INTL_LOCALES[lang], { dateStyle: 'medium' })
}
