import { apiClient } from './client'
import { getAllPages } from './pagination'
import type { CreateCyclePayload, Cycle, UpdateCyclePayload } from '../types/cycle'

export async function listCycles(projectId: number): Promise<Cycle[]> {
  return getAllPages<Cycle>('/cycles/', { project: projectId })
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
