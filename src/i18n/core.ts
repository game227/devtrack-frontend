export type Lang = 'uz' | 'en' | 'ru'

export const LANGS: Lang[] = ['uz', 'ru', 'en']
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
  ru: collect(import.meta.glob('./locales/ru/*.ts', { eager: true, import: 'default' })),
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
    if (stored === 'uz' || stored === 'en' || stored === 'ru') return stored
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

const INTL_LOCALES: Record<Lang, string> = { uz: 'uz-UZ', en: 'en-US', ru: 'ru-RU' }

// Browsers ship poor Uzbek date data (Chromium prints "2026 M09 21"), so Uzbek dates are built here.
const UZ_MONTHS = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
]

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function uzDate(date: Date): string {
  return `${date.getDate()} ${UZ_MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

function uzTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatDateTime(lang: Lang, iso: string): string {
  const date = new Date(iso)
  if (lang === 'uz') return `${uzDate(date)}, ${uzTime(date)}`
  return date.toLocaleString(INTL_LOCALES[lang], { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatTime(lang: Lang, iso: string): string {
  const date = new Date(iso)
  if (lang === 'uz') return uzTime(date)
  return date.toLocaleTimeString(INTL_LOCALES[lang], { timeStyle: 'short' })
}

// Date-only strings ("2026-09-18") are calendar dates, not instants: parsing them as UTC
// midnight would show the previous day west of UTC, so build them in local time instead.
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

const UZ_MONTHS_SHORT = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek']

// For chips and narrow columns: "16 noy" / "Nov 16" this year, with the year added otherwise.
export function formatShortDate(lang: Lang, iso: string, now: Date = new Date()): string {
  const dateOnly = DATE_ONLY.exec(iso)
  const date = dateOnly ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])) : new Date(iso)
  const sameYear = date.getFullYear() === now.getFullYear()
  if (lang === 'uz') return `${date.getDate()} ${UZ_MONTHS_SHORT[date.getMonth()]}${sameYear ? '' : ` ${date.getFullYear()}`}`
  return date.toLocaleDateString(INTL_LOCALES[lang], sameYear ? { month: 'short', day: 'numeric' } : { dateStyle: 'medium' })
}

const UZ_WEEKDAYS = ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba']

// A day as people say it: "chorshanba, 18-noyabr" / "Wednesday, November 18" / "среда, 18 ноября".
export function formatLongDay(lang: Lang, date: Date): string {
  if (lang === 'uz') return `${UZ_WEEKDAYS[date.getDay()]}, ${date.getDate()}-${UZ_MONTHS[date.getMonth()]}`
  return date.toLocaleDateString(INTL_LOCALES[lang], { weekday: 'long', day: 'numeric', month: 'long' })
}

export function formatDate(lang: Lang, iso: string): string {
  const dateOnly = DATE_ONLY.exec(iso)
  const date = dateOnly ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])) : new Date(iso)
  if (lang === 'uz') return uzDate(date)
  return date.toLocaleDateString(INTL_LOCALES[lang], { dateStyle: 'medium' })
}
