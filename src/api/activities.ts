import { apiClient } from './client'
import type { PaginatedResponse } from '../types/api'
import type { Activity } from '../types/activity'

export async function listProjectTimeline(projectId: number): Promise<Activity[]> {
  const { data } = await apiClient.get<PaginatedResponse<Activity>>('/activities/', {
    params: { project: projectId },
  })
  return data.results
}
