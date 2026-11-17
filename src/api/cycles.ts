import { apiClient } from './client'
import { getAllPages } from './pagination'
import type { CreateCyclePayload, Cycle } from '../types/cycle'

export async function listCycles(projectId: number): Promise<Cycle[]> {
  return getAllPages<Cycle>('/cycles/', { project: projectId })
}

export async function createCycle(payload: CreateCyclePayload): Promise<Cycle> {
  const { data } = await apiClient.post<Cycle>('/cycles/', payload)
  return data
}

export async function deleteCycle(id: number): Promise<void> {
  await apiClient.delete(`/cycles/${id}/`)
}

export interface Burndown {
  unit: 'points' | 'issues'
  total: number
  days: Array<{ date: string; remaining: number | null; ideal: number }>
}

export async function getBurndown(cycleId: number): Promise<Burndown> {
  const { data } = await apiClient.get<Burndown>(`/cycles/${cycleId}/burndown/`)
  return data
}
