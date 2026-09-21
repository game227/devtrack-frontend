import { apiClient } from './client'
import { getAllPages } from './pagination'
import type {
  AddProjectMemberPayload,
  CreateProjectPayload,
  Project,
  ProjectMember,
  ProjectSpecialty,
  UpdateProjectPayload,
} from '../types/project'

export interface ProjectFilters {
  status?: string
  priority?: string
}

export async function listProjects(
  workspaceId: number,
  filters: ProjectFilters = {},
): Promise<Project[]> {
  return getAllPages<Project>('/projects/', { workspace: workspaceId, ...filters })
}

export async function createProject(payload: CreateProjectPayload): Promise<Project> {
  const { data } = await apiClient.post<Project>('/projects/', payload)
  return data
}

export async function getProject(id: number): Promise<Project> {
  const { data } = await apiClient.get<Project>(`/projects/${id}/`)
  return data
}

export async function updateProject(id: number, payload: UpdateProjectPayload): Promise<Project> {
  const { data } = await apiClient.patch<Project>(`/projects/${id}/`, payload)
  return data
}

export async function deleteProject(id: number): Promise<void> {
  await apiClient.delete(`/projects/${id}/`)
}

export async function listProjectMembers(projectId: number): Promise<ProjectMember[]> {
  return getAllPages<ProjectMember>(`/projects/${projectId}/members/`)
}

export async function addProjectMember(
  projectId: number,
  payload: AddProjectMemberPayload,
): Promise<ProjectMember> {
  const { data } = await apiClient.post<ProjectMember>(`/projects/${projectId}/members/`, payload)
  return data
}

export async function removeProjectMember(projectId: number, userId: number): Promise<void> {
  await apiClient.delete(`/projects/${projectId}/members/${userId}/`)
}

export async function updateProjectMemberSpecialty(
  projectId: number,
  userId: number,
  specialty: ProjectSpecialty | '',
): Promise<ProjectMember> {
  const { data } = await apiClient.patch<ProjectMember>(`/projects/${projectId}/members/${userId}/`, { specialty })
  return data
}
