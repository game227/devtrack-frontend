import { isAxiosError } from 'axios'

export type FieldErrors = Record<string, string[]>

// DRF validation errors are field-keyed arrays, e.g. {"username": ["..."]}.
// simplejwt's login/refresh errors instead use a top-level {"detail": "..."}
// string — normalized into non_field_errors so callers only check one place
// for form-level (as opposed to per-field) messages.
export function extractFieldErrors(error: unknown): FieldErrors {
  if (isAxiosError(error) && error.response?.data && typeof error.response.data === 'object') {
    const data = error.response.data as Record<string, unknown>
    const result: FieldErrors = {}
    for (const [key, value] of Object.entries(data)) {
      const normalizedKey = key === 'detail' ? 'non_field_errors' : key
      const messages = Array.isArray(value) ? value.map(String) : [String(value)]
      result[normalizedKey] = [...(result[normalizedKey] ?? []), ...messages]
    }
    if (Object.keys(result).length > 0) {
      return result
    }
  }
  return { non_field_errors: ['Something went wrong. Please try again.'] }
}
