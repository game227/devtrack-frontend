import { apiClient } from './client'
import type {
  GitHubConnectionStatus,
  GitHubRepo,
  GitHubRepoLink,
  IssueGitHubLinks,
} from '../types/integrations'

export async function getGithubAuthorizeUrl(): Promise<{ authorize_url: string }> {
  const { data } = await apiClient.get('/integrations/github/connect/')
  return data
}

export async function getGithubConnectionStatus(): Promise<GitHubConnectionStatus> {
  const { data } = await apiClient.get('/integrations/github/status/')
  return data
}

export async function disconnectGithub(): Promise<void> {
  await apiClient.delete('/integrations/github/disconnect/')
}

export async function listAvailableGithubRepos(): Promise<GitHubRepo[]> {
  const { data } = await apiClient.get<{ repos: GitHubRepo[] }>('/integrations/github/repos/')
  return data.repos
}

export async function getProjectGithubLink(projectId: number): Promise<GitHubRepoLink> {
  const { data } = await apiClient.get(`/integrations/projects/${projectId}/github-link/`)
  return data
}

export async function linkProjectGithubRepo(
  projectId: number,
  payload: { github_repo_id: number; full_name: string },
): Promise<GitHubRepoLink> {
  const { data } = await apiClient.post(`/integrations/projects/${projectId}/github-link/`, payload)
  return data
}

export async function unlinkProjectGithubRepo(projectId: number): Promise<void> {
  await apiClient.delete(`/integrations/projects/${projectId}/github-link/`)
}

export async function getIssueGithubLinks(issueId: number): Promise<IssueGitHubLinks> {
  const { data } = await apiClient.get(`/integrations/issues/${issueId}/github-links/`)
  return data
}
