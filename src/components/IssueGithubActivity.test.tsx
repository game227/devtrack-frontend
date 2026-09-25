import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { IssueGithubActivity } from './IssueGithubActivity'

const getIssueGithubLinks = vi.fn()
vi.mock('../api/integrations', () => ({ getIssueGithubLinks: (...args: unknown[]) => getIssueGithubLinks(...args) }))

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString()

describe('IssueGithubActivity', () => {
  it('shows each pull request and commit with its branch and how long ago it happened on GitHub', async () => {
    getIssueGithubLinks.mockResolvedValue({
      pull_requests: [
        {
          id: 1, number: 12, title: 'Limit charges', state: 'open', merged: false, draft: true, author_username: 'dev',
          url: 'https://x/pull/12', head_ref: 'feat', base_ref: 'main', opened_at: hoursAgo(5),
          created_at: hoursAgo(1), updated_at: hoursAgo(1),
        },
      ],
      commits: [
        {
          id: 2, sha: 'abcdef1234567', message: 'Work on #5\n\nmore', author_username: 'dev', author_name: 'Dev',
          url: 'https://x/c', branch: 'feat', committed_at: hoursAgo(3), created_at: hoursAgo(1),
        },
      ],
    })
    renderWithProviders(<IssueGithubActivity issueId={5} />, { lang: 'en' })

    expect(await screen.findByText('#12 Limit charges')).toBeInTheDocument()
    expect(screen.getByText('draft')).toBeInTheDocument()
    expect(screen.getByText('feat → main')).toBeInTheDocument()
    // GitHub's own time wins over the time DevTrack stored the row.
    expect(screen.getByText('5 h ago')).toBeInTheDocument()
    expect(screen.getByText('3 h ago')).toBeInTheDocument()
    expect(screen.getByText('abcdef1')).toBeInTheDocument()
  })

  it('falls back to the stored time for rows saved before GitHub times were tracked', async () => {
    getIssueGithubLinks.mockResolvedValue({
      pull_requests: [],
      commits: [{ id: 3, sha: 'a'.repeat(40), message: 'Old', author_username: '', author_name: 'Dev', url: 'https://x', created_at: hoursAgo(2) }],
    })
    renderWithProviders(<IssueGithubActivity issueId={5} />, { lang: 'en' })
    expect(await screen.findByText('2 h ago')).toBeInTheDocument()
  })
})
