import { apiClient } from './client'
import type { PaginatedResponse } from '../types/api'
import type { CreateWorkspacePayload, Workspace } from '../types/workspace'

export async function listWorkspaces(): Promise<Workspace[]> {
  const { data } = await apiClient.get<PaginatedResponse<Workspace>>('/workspaces/')
  return data.results
}

export async function createWorkspace(payload: CreateWorkspacePayload): Promise<Workspace> {
  const { data } = await apiClient.post<Workspace>('/workspaces/', payload)
  return data
}

export async function getWorkspace(id: number): Promise<Workspace> {
  const { data } = await apiClient.get<Workspace>(`/workspaces/${id}/`)
  return data
}
