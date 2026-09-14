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
}

interface GitHubRepoLinkedInfo {
  id: number
  project: number
  github_repo_id: number
  full_name: string
  connected_by: UserBrief
  created_at: string
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
