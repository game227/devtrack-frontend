import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { I18nContext } from './context'
import type { I18nValue } from './context'
import { formatDate, formatDateTime, formatTime, readStoredLang, storeLang, translate } from './core'
import type { Lang, TranslateParams } from './core'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    storeLang(next)
    setLangState(next)
  }, [])

  const t = useCallback((key: string, params?: TranslateParams) => translate(lang, key, params), [lang])

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t,
      formatDateTime: (iso: string) => formatDateTime(lang, iso),
      formatDate: (iso: string) => formatDate(lang, iso),
      formatTime: (iso: string) => formatTime(lang, iso),
    }),
    [lang, setLang, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
