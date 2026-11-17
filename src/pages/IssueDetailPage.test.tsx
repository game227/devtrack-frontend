import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeAuth, renderWithProviders } from '../test/utils'
import { IssueDetailPage } from './IssueDetailPage'
import type { Issue } from '../types/issue'
import type { User } from '../types/auth'

const getIssue = vi.fn()
const updateIssue = vi.fn()
vi.mock('../api/issues', () => ({
  getIssue: (...args: unknown[]) => getIssue(...args),
  updateIssue: (...args: unknown[]) => updateIssue(...args),
}))
vi.mock('../api/comments', () => ({
  listIssueComments: vi.fn().mockResolvedValue([]),
  createIssueComment: vi.fn(),
}))
vi.mock('../api/labels', () => ({
  listLabels: vi.fn().mockResolvedValue([]),
}))
vi.mock('../api/projects', () => ({
  getProject: vi.fn().mockResolvedValue({ id: 7, workspace: 3 }),
  listProjectMembers: vi.fn().mockResolvedValue([]),
}))
vi.mock('../api/integrations', () => ({
  getIssueGithubLinks: vi.fn().mockResolvedValue({ commits: [], pull_requests: [] }),
}))

function issue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: 42,
    project: 7,
    number: 12,
    title: 'Sample issue',
    description: 'Some details',
    type: 'task',
    status: 'todo',
    priority: 'medium',
    assignee: null,
    reporter: { id: 1, username: 'jane.dev', avatar: null },
    labels: [],
    cycle: null,
    milestone: null,
    due_date: null,
    github_number: null,
    github_url: '',
    estimate: null,
    checklist: null,
    completed_at: null,
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
    ...overrides,
  }
}

function currentUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    username: 'jane.dev',
    email: 'jane@example.com',
    email_verified: true,
    totp_enabled: false,
    first_name: '',
    last_name: '',
    avatar: null,
    bio: '',
    title: '',
    date_joined: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function renderIssue(user: User | null) {
  return renderWithProviders(
    <Routes>
      <Route path="/issues/:id" element={<IssueDetailPage />} />
    </Routes>,
    { route: '/issues/42', lang: 'en', auth: makeAuth({ user }) },
  )
}

describe('IssueDetailPage — who can edit', () => {
  beforeEach(() => {
    getIssue.mockReset()
    updateIssue.mockReset()
  })

  it("lets the issue's creator edit its properties and description", async () => {
    getIssue.mockResolvedValue(issue())
    renderIssue(currentUser({ id: 1 }))

    expect(await screen.findByLabelText('Status')).toBeEnabled()
    expect(screen.getByLabelText('Priority')).toBeEnabled()
    expect(screen.getByLabelText('Assignee')).toBeEnabled()
    expect(screen.getByLabelText('Due date')).toBeEnabled()
    expect(screen.getByText('Some details')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit description' })).toBeInTheDocument()
    expect(screen.queryByText('Only the person who created this issue, or the person it is assigned to, can change it.')).not.toBeInTheDocument()
    // The number shown is the issue's number within its project, not the global id in the URL.
    expect(screen.getByText('#12')).toBeInTheDocument()
    expect(screen.queryByText('#42')).not.toBeInTheDocument()
  })

  it('lets the assignee update status and priority but nothing else', async () => {
    getIssue.mockResolvedValue(
      issue({
        reporter: { id: 1, username: 'jane.dev', avatar: null },
        assignee: { id: 2, username: 'alex.k', avatar: null },
      }),
    )
    renderIssue(currentUser({ id: 2, username: 'alex.k' }))

    expect(await screen.findByLabelText('Status')).toBeEnabled()
    expect(screen.getByLabelText('Priority')).toBeEnabled()
    expect(screen.getByLabelText('Assignee')).toBeDisabled()
    expect(screen.getByLabelText('Due date')).toBeDisabled()
    expect(screen.getByText(/It is assigned to you: you can update its status and priority/)).toBeInTheDocument()
    // The description stays the creator's.
    expect(screen.queryByRole('button', { name: 'Edit description' })).not.toBeInTheDocument()
  })

  it('shows the properties as read-only for anyone other than the creator', async () => {
    getIssue.mockResolvedValue(issue())
    renderIssue(currentUser({ id: 99 }))

    expect(await screen.findByLabelText('Status')).toBeDisabled()
    expect(screen.getByLabelText('Priority')).toBeDisabled()
    expect(screen.getByLabelText('Assignee')).toBeDisabled()
    expect(screen.getByLabelText('Due date')).toBeDisabled()
    expect(screen.getAllByText('Only the person who created this issue, or the person it is assigned to, can change it.').length).toBeGreaterThan(0)
    // The description is shown, with no way to edit it.
    expect(screen.getByText('Some details')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit description' })).not.toBeInTheDocument()
  })

  it('offers a neutral empty-description message instead of "click to add" for read-only viewers', async () => {
    getIssue.mockResolvedValue(issue({ description: '' }))
    renderIssue(currentUser({ id: 99 }))

    expect(await screen.findByText('No description.')).toBeInTheDocument()
    expect(screen.queryByText('Click to add a description…')).not.toBeInTheDocument()
  })

  it('is read-only when no user is signed in', async () => {
    getIssue.mockResolvedValue(issue())
    renderIssue(null)

    expect(await screen.findByLabelText('Status')).toBeDisabled()
  })

  it('renders the description as Markdown and edits it with a preview', async () => {
    getIssue.mockResolvedValue(issue({ description: '**Steps**\n\n1. Open the page' }))
    renderIssue(currentUser({ id: 1 }))

    expect((await screen.findByText('Steps')).tagName).toBe('STRONG')
    await userEvent.click(screen.getByRole('button', { name: 'Edit description' }))
    const box = screen.getByRole('textbox', { name: 'Description' })
    expect(box).toHaveValue('**Steps**\n\n1. Open the page')
    await userEvent.click(screen.getByRole('button', { name: 'Preview' }))
    expect(screen.getAllByText('Open the page').length).toBeGreaterThan(0)
  })
})
