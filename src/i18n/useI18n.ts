import { useContext } from 'react'
import { I18nContext } from './context'
import type { I18nValue } from './context'

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return ctx
}

export function useT(): I18nValue['t'] {
  return useI18n().t
}
