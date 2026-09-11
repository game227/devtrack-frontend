import { apiClient } from './client'
import type { DeveloperAnalytics } from '../types/analytics'

export async function getUserAnalytics(userId: number, workspaceId: number): Promise<DeveloperAnalytics> {
  const { data } = await apiClient.get<DeveloperAnalytics>(`/users/${userId}/analytics/`, {
    params: { workspace: workspaceId },
  })
  return data
}
