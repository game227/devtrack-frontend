import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FILTER_KEYS } from '../../api/savedViews'
import type { FilterKey, ListFilters } from '../../api/savedViews'
import { ISSUE_PRIORITIES, ISSUE_STATUSES, ISSUE_TYPES } from '../../types/issue'

const ID = /^[1-9]\d{0,17}$/
const VALID: Record<FilterKey, (value: string) => boolean> = {
  status: (value) => (ISSUE_STATUSES as string[]).includes(value),
  type: (value) => (ISSUE_TYPES as string[]).includes(value),
  priority: (value) => (ISSUE_PRIORITIES as string[]).includes(value),
  assignee: (value) => value === 'me' || ID.test(value),
  label: (value) => ID.test(value),
}

// The issue list's filters live in the URL (?status=todo&assignee=me), so a filtered list survives a
// reload and can be shared as a link. Values the list would not understand are ignored.
export function useIssueFilters() {
  const [params, setParams] = useSearchParams()
  const query = params.toString()

  const filters = useMemo(() => {
    const current = new URLSearchParams(query)
    const result: ListFilters = {}
    for (const key of FILTER_KEYS) {
      const value = current.get(key)
      if (value && VALID[key](value)) result[key] = value
    }
    return result
  }, [query])

  const applyFilters = useCallback(
    (next: ListFilters) =>
      setParams(
        (previous) => {
          const result = new URLSearchParams(previous)
          for (const key of FILTER_KEYS) {
            const value = next[key]
            if (value) result.set(key, value)
            else result.delete(key)
          }
          return result
        },
        { replace: true },
      ),
    [setParams],
  )

  const setFilter = useCallback((key: FilterKey, value: string) => applyFilters({ ...filters, [key]: value || undefined }), [applyFilters, filters])

  return { filters, setFilter, applyFilters, isFiltered: Object.keys(filters).length > 0 }
}

export function sameFilters(a: ListFilters, b: ListFilters) {
  return FILTER_KEYS.every((key) => (a[key] ?? '') === (b[key] ?? ''))
}
