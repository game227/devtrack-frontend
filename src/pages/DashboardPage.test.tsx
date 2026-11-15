import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WorkspaceContext } from '../features/workspace/workspaceContext'
import { makeAuth, renderWithProviders } from '../test/utils'
import { DashboardPage } from './DashboardPage'
import type { DashboardData } from '../types/dashboard'
import type { Issue } from '../types/issue'
import type { User } from '../types/auth'
import type { Workspace } from '../types/workspace'

const getDashboard = vi.fn()
const listIssues = vi.fn()
vi.mock('../api/dashboard', () => ({ getDashboard: (...args: unknown[]) => getDashboard(...args) }))
vi.mock('../api/invitations', () => ({ listMyInvitations: () => Promise.resolve([]), acceptInvitation: vi.fn(), declineInvitation: vi.fn() }))
vi.mock('../api/issues', () => ({ listIssues: (...args: unknown[]) => listIssues(...args) }))

const workspace = { id: 3, name: 'Nova Labs' } as Workspace

const user: User = {
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
}

function dashboard(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    workspace: { id: 3, name: 'Nova Labs' },
    projects: { total: 2, active: 1, planned: 1, paused: 0, completed: 0, archived: 0 },
    issues: { total: 5, open: 4, done: 1 },
    upcoming_deadlines: [],
    project_progress: [],
    recent_activity: [],
    ...overrides,
  }
}

function issue(id: number, overrides: Partial<Issue>): Issue {
  return {
    id,
    project: 1,
    number: id + 100,  // deliberately not equal to the id: the UI must show the number
    title: `Issue ${id}`,
    description: '',
    type: 'task',
    status: 'todo',
    priority: 'medium',
    assignee: { id: 1, username: 'jane.dev', avatar: null },
    reporter: { id: 1, username: 'jane.dev', avatar: null },
    labels: [],
    cycle: null,
    milestone: null,
    due_date: null,
    github_number: null,
    github_url: '',
    completed_at: null,
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
    ...overrides,
  }
}

function renderDashboard() {
  return renderWithProviders(
    <WorkspaceContext.Provider
      value={{ currentWorkspace: workspace, workspaces: [workspace], isLoading: false, selectWorkspace: () => {} }}
    >
      <DashboardPage />
    </WorkspaceContext.Provider>,
    { lang: 'en', auth: makeAuth({ user }) },
  )
}

// A date string N days from today, in the viewer's local calendar (what the app compares against).
function daysFromToday(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

describe('DashboardPage focus block', () => {
  beforeEach(() => {
    getDashboard.mockReset()
    listIssues.mockReset()
  })

  it('puts my open issues on the line, flags overdue and due-soon ones, and lists the most urgent first', async () => {
    getDashboard.mockResolvedValue(dashboard())
    listIssues.mockResolvedValue([
      issue(1, { title: 'Later work', due_date: daysFromToday(20) }),
      issue(2, { title: 'Late work', due_date: daysFromToday(-2), status: 'in_progress' }),
      issue(3, { title: 'Soon work', due_date: daysFromToday(1), status: 'in_review' }),
      issue(4, { title: 'Finished long ago', status: 'done', due_date: daysFromToday(-9), completed_at: '2026-01-01T10:00:00Z' }),
      issue(5, { title: 'Finished today', status: 'done', completed_at: new Date().toISOString() }),
    ])
    renderDashboard()

    expect(await screen.findByText(/jane\.dev\. Here is your part of the work\.|jane\.dev\? Here is your part of the work\./)).toBeInTheDocument()
    // One station per status, each with how many of my issues sit there; Done counts the last 7 days.
    expect(await screen.findByRole('button', { name: 'Todo, 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'In progress, 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'In review, 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Done in 7 days, 1' })).toBeInTheDocument()
    expect(screen.getByText('1 overdue')).toHaveClass('text-danger')
    expect(screen.getByText('1 due within 3 days')).toHaveClass('text-warning')

    const list = screen.getByRole('list', { name: 'Your issues' })
    const titles = within(list).getAllByRole('link').map((link) => link.textContent ?? '')
    const order = ['Late work', 'Soon work', 'Later work'].map((name) => titles.findIndex((t) => t.includes(name)))
    expect(order).toEqual([...order].sort((a, b) => a - b))
    expect(order.every((i) => i >= 0)).toBe(true)
    expect(within(list).queryByText(/Finished/)).not.toBeInTheDocument()
  })

  it('filters the list by a station, and back', async () => {
    getDashboard.mockResolvedValue(dashboard())
    listIssues.mockResolvedValue([
      issue(1, { title: 'Later work' }),
      issue(2, { title: 'Late work', status: 'in_progress' }),
      issue(5, { title: 'Finished today', status: 'done', completed_at: new Date().toISOString() }),
    ])
    renderDashboard()

    const progress = await screen.findByRole('button', { name: 'In progress, 1' })
    await userEvent.click(progress)
    expect(progress).toHaveAttribute('aria-pressed', 'true')
    let list = screen.getByRole('list', { name: 'Your issues' })
    expect(within(list).getByText('Late work')).toBeInTheDocument()
    expect(within(list).queryByText('Later work')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Done in 7 days, 1' }))
    list = screen.getByRole('list', { name: 'Your issues' })
    expect(within(list).getByText('Finished today')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Show all open' }))
    list = screen.getByRole('list', { name: 'Your issues' })
    expect(within(list).getByText('Later work')).toBeInTheDocument()
    expect(within(list).getByText('Late work')).toBeInTheDocument()
  })

  it('celebrates an empty queue and prompts a brand-new workspace to create a project', async () => {
    getDashboard.mockResolvedValue(dashboard({ projects: { total: 0, active: 0, planned: 0, paused: 0, completed: 0, archived: 0 } }))
    listIssues.mockResolvedValue([])
    renderDashboard()

    expect(await screen.findByText('You are all caught up')).toBeInTheDocument()
    expect(screen.getByText('Create your first project')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'New project' })).toHaveAttribute('href', '/projects?new=1')
  })
})
