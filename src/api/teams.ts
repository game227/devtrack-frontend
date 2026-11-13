import { apiClient } from './client'
import { getAllPages } from './pagination'
import type { CreateTeamPayload, Team, TeamMember } from '../types/team'

export async function listTeams(workspaceId: number): Promise<Team[]> {
  return getAllPages<Team>('/teams/', { workspace: workspaceId })
}

export async function createTeam(payload: CreateTeamPayload): Promise<Team> {
  const { data } = await apiClient.post<Team>('/teams/', payload)
  return data
}

export async function listTeamMembers(teamId: number): Promise<TeamMember[]> {
  return getAllPages<TeamMember>(`/teams/${teamId}/members/`)
}

export async function addTeamMember(teamId: number, username: string): Promise<TeamMember> {
  const { data } = await apiClient.post<TeamMember>(`/teams/${teamId}/members/`, { username })
  return data
}

export async function removeTeamMember(teamId: number, userId: number): Promise<void> {
  await apiClient.delete(`/teams/${teamId}/members/${userId}/`)
}
