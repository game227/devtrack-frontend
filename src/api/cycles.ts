import { apiClient } from './client'
import type { PaginatedResponse } from '../types/api'
import type { CreateCyclePayload, Cycle, UpdateCyclePayload } from '../types/cycle'

export async function listCycles(projectId: number): Promise<Cycle[]> {
  const { data } = await apiClient.get<PaginatedResponse<Cycle>>('/cycles/', {
    params: { project: projectId },
  })
  return data.results
}

export async function createCycle(payload: CreateCyclePayload): Promise<Cycle> {
  const { data } = await apiClient.post<Cycle>('/cycles/', payload)
  return data
}

export async function updateCycle(id: number, payload: UpdateCyclePayload): Promise<Cycle> {
  const { data } = await apiClient.patch<Cycle>(`/cycles/${id}/`, payload)
  return data
}

export async function deleteCycle(id: number): Promise<void> {
  await apiClient.delete(`/cycles/${id}/`)
}
