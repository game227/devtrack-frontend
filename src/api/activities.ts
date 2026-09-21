import { apiClient } from './client'
import type { PaginatedResponse } from '../types/api'
import type { Activity } from '../types/activity'

export interface ActivityPage {
  results: Activity[]
  hasNext: boolean
}

// The timeline can be long, so it is loaded page by page ("Load more") instead of all at once.
export async function listProjectTimelinePage(projectId: number, page: number): Promise<ActivityPage> {
  const { data } = await apiClient.get<PaginatedResponse<Activity>>('/activities/', {
    params: { project: projectId, page },
  })
  return { results: data.results, hasNext: data.next !== null }
}
