import { apiClient } from './client'
import type { PaginatedResponse } from '../types/api'
import type { CreateTeamPayload, Team, TeamMember, UpdateTeamPayload } from '../types/team'

export async function listTeams(workspaceId: number): Promise<Team[]> {
  const { data } = await apiClient.get<PaginatedResponse<Team>>('/teams/', {
    params: { workspace: workspaceId },
  })
  return data.results
}

export async function createTeam(payload: CreateTeamPayload): Promise<Team> {
  const { data } = await apiClient.post<Team>('/teams/', payload)
  return data
}

export async function updateTeam(id: number, payload: UpdateTeamPayload): Promise<Team> {
  const { data } = await apiClient.patch<Team>(`/teams/${id}/`, payload)
  return data
}

export async function deleteTeam(id: number): Promise<void> {
  await apiClient.delete(`/teams/${id}/`)
}

export async function listTeamMembers(teamId: number): Promise<TeamMember[]> {
  const { data } = await apiClient.get<PaginatedResponse<TeamMember>>(`/teams/${teamId}/members/`)
  return data.results
}

export async function addTeamMember(teamId: number, username: string): Promise<TeamMember> {
  const { data } = await apiClient.post<TeamMember>(`/teams/${teamId}/members/`, { username })
  return data
}

export async function removeTeamMember(teamId: number, userId: number): Promise<void> {
  await apiClient.delete(`/teams/${teamId}/members/${userId}/`)
}
