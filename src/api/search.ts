import { apiClient } from './client'
import type { SearchResults } from '../types/search'

export async function search(workspaceId: number, query: string): Promise<SearchResults> {
  const { data } = await apiClient.get<SearchResults>('/search/', {
    params: { workspace: workspaceId, q: query },
  })
  return data
}
