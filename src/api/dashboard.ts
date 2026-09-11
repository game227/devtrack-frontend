import { apiClient } from './client'
import type { DashboardData } from '../types/dashboard'

export async function getDashboard(workspaceId: number): Promise<DashboardData> {
  const { data } = await apiClient.get<DashboardData>('/dashboard/', {
    params: { workspace: workspaceId },
  })
  return data
}
