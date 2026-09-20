import { apiClient } from './client'
import { getAllPages } from './pagination'
import type { CreateMilestonePayload, Milestone, UpdateMilestonePayload } from '../types/milestone'

export async function listMilestones(projectId: number): Promise<Milestone[]> {
  return getAllPages<Milestone>('/milestones/', { project: projectId })
}

export async function createMilestone(payload: CreateMilestonePayload): Promise<Milestone> {
  const { data } = await apiClient.post<Milestone>('/milestones/', payload)
  return data
}

export async function updateMilestone(id: number, payload: UpdateMilestonePayload): Promise<Milestone> {
  const { data } = await apiClient.patch<Milestone>(`/milestones/${id}/`, payload)
  return data
}

export async function deleteMilestone(id: number): Promise<void> {
  await apiClient.delete(`/milestones/${id}/`)
}
