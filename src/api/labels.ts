import { apiClient } from './client'
import type { PaginatedResponse } from '../types/api'
import type { CreateLabelPayload, Label } from '../types/label'

export interface LabelFilters {
  workspace?: number
  project?: number
}

export async function listLabels(filters: LabelFilters): Promise<Label[]> {
  const { data } = await apiClient.get<PaginatedResponse<Label>>('/labels/', { params: filters })
  return data.results
}

export async function createLabel(payload: CreateLabelPayload): Promise<Label> {
  const { data } = await apiClient.post<Label>('/labels/', payload)
  return data
}

export async function updateLabel(id: number, payload: Partial<CreateLabelPayload>): Promise<Label> {
  const { data } = await apiClient.patch<Label>(`/labels/${id}/`, payload)
  return data
}

export async function deleteLabel(id: number): Promise<void> {
  await apiClient.delete(`/labels/${id}/`)
}
