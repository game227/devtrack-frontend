import { apiClient } from './client'
import type { PaginatedResponse } from '../types/api'

// The backend paginates every list endpoint (PAGE_SIZE=25). Reading only `results`
// would silently drop everything past the first page, so lists that feed boards,
// tables and analytics are collected page by page. `page` is incremented rather than
// following the absolute `next` URL so it keeps working behind an HTTPS proxy.
const MAX_PAGES = 40

export async function getAllPages<T>(url: string, params: Record<string, unknown> = {}): Promise<T[]> {
  const results: T[] = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data } = await apiClient.get<PaginatedResponse<T>>(url, { params: { ...params, page } })
    results.push(...data.results)
    if (!data.next) break
  }
  return results
}
