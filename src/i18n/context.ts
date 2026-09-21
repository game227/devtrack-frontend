import { createContext } from 'react'
import type { Lang, TranslateParams } from './core'

export interface I18nValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string, params?: TranslateParams) => string
  formatDateTime: (iso: string) => string
  formatDate: (iso: string) => string
  formatTime: (iso: string) => string
}

export const I18nContext = createContext<I18nValue | null>(null)
