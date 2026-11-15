import { apiClient } from './client'
import { getAllPages } from './pagination'
import type { Invitation } from '../types/invitation'
import type { Workspace, WorkspaceMember, WorkspaceRole } from '../types/workspace'

export async function listWorkspaces(): Promise<Workspace[]> {
  return getAllPages<Workspace>('/workspaces/')
}

export async function listWorkspaceMembers(workspaceId: number): Promise<WorkspaceMember[]> {
  return getAllPages<WorkspaceMember>(`/workspaces/${workspaceId}/members/`)
}

// Adding someone sends an invitation; they join once they accept it.
export async function inviteMember(workspaceId: number, username: string, role: Exclude<WorkspaceRole, 'owner'>): Promise<Invitation> {
  const { data } = await apiClient.post<Invitation>(`/workspaces/${workspaceId}/members/`, { username, role })
  return data
}

export async function listWorkspaceInvitations(workspaceId: number): Promise<Invitation[]> {
  return getAllPages<Invitation>(`/workspaces/${workspaceId}/invitations/`)
}

export async function withdrawInvitation(workspaceId: number, invitationId: number): Promise<void> {
  await apiClient.delete(`/workspaces/${workspaceId}/invitations/${invitationId}/`)
}

export async function changeMemberRole(workspaceId: number, userId: number, role: Exclude<WorkspaceRole, 'owner'>): Promise<WorkspaceMember> {
  const { data } = await apiClient.patch<WorkspaceMember>(`/workspaces/${workspaceId}/members/${userId}/`, { role })
  return data
}

export async function removeMember(workspaceId: number, userId: number): Promise<void> {
  await apiClient.delete(`/workspaces/${workspaceId}/members/${userId}/`)
}

export async function leaveWorkspace(workspaceId: number): Promise<void> {
  await apiClient.post(`/workspaces/${workspaceId}/leave/`)
}

export async function transferOwnership(workspaceId: number, userId: number): Promise<WorkspaceMember> {
  const { data } = await apiClient.post<WorkspaceMember>(`/workspaces/${workspaceId}/transfer-ownership/`, { user_id: userId })
  return data
}
