import { apiClient } from './client'
import type { ProjectHealth } from '../types/health'

export async function getProjectHealth(projectId: number): Promise<ProjectHealth> {
  const { data } = await apiClient.get<ProjectHealth>(`/projects/${projectId}/health/`)
  return data
}
