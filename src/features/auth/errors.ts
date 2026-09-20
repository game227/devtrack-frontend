import { isAxiosError } from 'axios'
import { localizeApiMessage } from '../../i18n/apiErrors'
import { readStoredLang, translate } from '../../i18n/core'
import type { Lang } from '../../i18n/core'

export type FieldErrors = Record<string, string[]>

// DRF validation errors are field-keyed arrays, e.g. {"username": ["..."]}.
// simplejwt's login/refresh errors instead use a top-level {"detail": "..."}
// string — normalized into non_field_errors so callers only check one place
// for form-level (as opposed to per-field) messages. Known server messages are
// translated into the active UI language.
export function extractFieldErrors(error: unknown, lang: Lang = readStoredLang()): FieldErrors {
  if (isAxiosError(error) && error.response?.data && typeof error.response.data === 'object') {
    const data = error.response.data as Record<string, unknown>
    const result: FieldErrors = {}
    for (const [key, value] of Object.entries(data)) {
      const normalizedKey = key === 'detail' ? 'non_field_errors' : key
      const messages = (Array.isArray(value) ? value : [value]).map((message) =>
        localizeApiMessage(lang, String(message)),
      )
      result[normalizedKey] = [...(result[normalizedKey] ?? []), ...messages]
    }
    if (Object.keys(result).length > 0) {
      return result
    }
  }
  if (isAxiosError(error) && !error.response) {
    return { non_field_errors: [translate(lang, 'error.network')] }
  }
  return { non_field_errors: [translate(lang, 'common.errorGeneric')] }
}

// One human-readable string for places that show a single error line rather than a form.
export function describeError(error: unknown, lang: Lang = readStoredLang()): string {
  return Object.values(extractFieldErrors(error, lang)).flat().join(' ')
}
