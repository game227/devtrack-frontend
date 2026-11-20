import { apiClient } from './client'

// The filters a saved view (and the issue list's URL) can hold, as the API spells them.
export const FILTER_KEYS = ['status', 'type', 'priority', 'assignee', 'label'] as const
export type FilterKey = (typeof FILTER_KEYS)[number]
export type ListFilters = Partial<Record<FilterKey, string>>

// One workspace's issue list, or one project's.
export type ListScope = { project: number } | { workspace: number }

export interface SavedView {
  id: number
  name: string
  filters: ListFilters
  workspace: number
  project: number | null
  created_at: string
}

export async function listSavedViews(scope: ListScope): Promise<SavedView[]> {
  const { data } = await apiClient.get<SavedView[]>('/issues/views/', { params: scope })
  return data
}

export async function createSavedView(scope: ListScope, name: string, filters: ListFilters): Promise<SavedView> {
  const { data } = await apiClient.post<SavedView>('/issues/views/', { ...scope, name, filters })
  return data
}

export async function deleteSavedView(id: number): Promise<void> {
  await apiClient.delete(`/issues/views/${id}/`)
}
