import { screen, within } from '@testing-library/react'
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
vi.mock('../api/issues', () => ({ listIssues: (...args: unknown[]) => listIssues(...args) }))

const workspace = { id: 3, name: 'Nova Labs' } as Workspace

const user: User = {
  id: 1,
  username: 'jane.dev',
  email: 'jane@example.com',
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

  it('counts my overdue, due-soon, in-progress and in-review issues and lists the most urgent first', async () => {
    getDashboard.mockResolvedValue(dashboard())
    listIssues.mockResolvedValue([
      issue(1, { title: 'Later work', due_date: daysFromToday(20) }),
      issue(2, { title: 'Late work', due_date: daysFromToday(-2), status: 'in_progress' }),
      issue(3, { title: 'Soon work', due_date: daysFromToday(1), status: 'in_review' }),
      issue(4, { title: 'Finished', status: 'done', due_date: daysFromToday(-9) }),
    ])
    renderDashboard()

    expect(await screen.findByText('Hi jane.dev — here is what needs you today.')).toBeInTheDocument()
    const tile = (label: string) => screen.getByText(label).parentElement as HTMLElement
    expect(within(tile('Your overdue issues')).getByText('1')).toHaveClass('text-danger')
    expect(within(tile('Due in the next 3 days')).getByText('1')).toHaveClass('text-warning')
    expect(within(tile('In progress')).getByText('1')).toBeInTheDocument()
    expect(within(tile('In review')).getByText('1')).toBeInTheDocument()

    const titles = screen.getAllByRole('link').map((link) => link.textContent ?? '')
    const order = ['Late work', 'Soon work', 'Later work'].map((name) => titles.findIndex((t) => t.includes(name)))
    expect(order).toEqual([...order].sort((a, b) => a - b))
    expect(order.every((i) => i >= 0)).toBe(true)
    expect(screen.queryByText('Finished')).not.toBeInTheDocument()
  })

  it('celebrates an empty queue and prompts a brand-new workspace to create a project', async () => {
    getDashboard.mockResolvedValue(dashboard({ projects: { total: 0, active: 0, planned: 0, paused: 0, completed: 0, archived: 0 } }))
    listIssues.mockResolvedValue([])
    renderDashboard()

    expect(await screen.findByText('You are all caught up')).toBeInTheDocument()
    expect(screen.getByText('Create your first project')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'New project' })).toHaveAttribute('href', '/projects')
  })
})
