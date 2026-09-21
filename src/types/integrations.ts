import type { UserBrief } from './auth'

export interface GitHubConnectionStatus {
  connected: boolean
  github_username?: string
  connected_at?: string
}

export interface GitHubRepo {
  id: number
  full_name: string
  private: boolean
  html_url: string
  // Admin rights are needed to install a webhook; importing and syncing only need read access.
  admin: boolean
}

interface GitHubRepoLinkedInfo {
  id: number
  project: number
  github_repo_id: number
  full_name: string
  // False when GitHub cannot reach this server (e.g. localhost): the repo is linked, but only a manual sync updates it.
  webhook_installed: boolean
  connected_by: UserBrief
  created_at: string
}

export interface WebhookWarning {
  code: 'not_public_url' | 'github_rejected'
  detail: string
}

export interface GitHubImportResult {
  project: { id: number; name: string }
  issues_imported: number
  link: { webhook_installed: boolean; webhook_warning: WebhookWarning | null }
}

export interface GitHubSyncResult {
  pull_requests: number
  commits: number
}

export type GitHubRepoLink = { linked: false } | ({ linked: true } & GitHubRepoLinkedInfo)

export type PullRequestState = 'open' | 'closed'

export interface GitHubPullRequest {
  id: number
  number: number
  title: string
  state: PullRequestState
  merged: boolean
  author_username: string
  url: string
  head_ref: string
  base_ref: string
  created_at: string
  updated_at: string
}

export interface GitHubCommit {
  id: number
  sha: string
  message: string
  author_username: string
  author_name: string
  url: string
  created_at: string
}

export interface IssueGitHubLinks {
  commits: GitHubCommit[]
  pull_requests: GitHubPullRequest[]
}
