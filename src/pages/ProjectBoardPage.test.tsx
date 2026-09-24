import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeAuth, renderWithProviders } from '../test/utils'
import { ProjectBoardPage } from './ProjectBoardPage'
import type { Issue } from '../types/issue'
import type { User } from '../types/auth'

const listIssues = vi.fn()
const updateIssue = vi.fn()
vi.mock('../api/issues', () => ({
  listIssues: (...args: unknown[]) => listIssues(...args),
  updateIssue: (...args: unknown[]) => updateIssue(...args),
}))

function issue(overrides: Partial<Issue>): Issue {
  return {
    id: 1,
    project: 7,
    title: 'Sample',
    description: '',
    type: 'task',
    status: 'todo',
    priority: 'medium',
    assignee: { id: 2, username: 'alex.k', avatar: null },
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

function currentUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    username: 'jane.dev',
    email: 'jane@example.com',
    first_name: '',
    last_name: '',
    avatar: null,
    bio: '',
    title: '',
    date_joined: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function renderBoard(lang: 'uz' | 'en' = 'uz', user: User | null = null) {
  return renderWithProviders(
    <Routes>
      <Route path="/projects/:id/board" element={<ProjectBoardPage />} />
    </Routes>,
    { route: '/projects/7/board', lang, auth: makeAuth({ user }) },
  )
}

describe('ProjectBoardPage', () => {
  beforeEach(() => {
    listIssues.mockReset()
    updateIssue.mockReset()
  })

  it('shows all five columns, including the backlog, with Uzbek titles', async () => {
    listIssues.mockResolvedValue([
      issue({ id: 11, title: 'In the backlog', status: 'backlog' }),
      issue({ id: 12, title: 'Being reviewed', status: 'in_review', assignee: null }),
    ])
    renderBoard()

    expect(await screen.findByText('In the backlog')).toBeInTheDocument()
    for (const title of ['Zaxira', 'Qilinadigan', 'Jarayonda', "Ko'rib chiqilmoqda", 'Bajarildi']) {
      // Titles also appear as options of each card's touch-friendly status select.
      expect(screen.getAllByText(title).length).toBeGreaterThan(0)
    }
    expect(screen.getByText('#11')).toBeInTheDocument()
    expect(screen.getByText('Tayinlanmagan')).toBeInTheDocument()
  })

  it('renders English column titles when English is selected', async () => {
    listIssues.mockResolvedValue([issue({ id: 1, status: 'done' })])
    renderBoard('en')
    await screen.findByText('#1')
    expect(screen.getAllByText('Backlog').length).toBeGreaterThan(0)
    expect(screen.getAllByText('In progress').length).toBeGreaterThan(0)
  })

  it("lets the issue's creator drag their own card and use the status picker", async () => {
    listIssues.mockResolvedValue([issue({ id: 21, title: 'Mine', reporter: { id: 1, username: 'jane.dev', avatar: null } })])
    renderBoard('en', currentUser({ id: 1 }))

    const card = (await screen.findByText('Mine')).closest('[draggable]')
    expect(card).toHaveAttribute('draggable', 'true')
    expect(screen.getByRole('combobox', { name: 'Move to' })).toBeEnabled()
  })

  it('disables drag and the status picker for issues someone else created', async () => {
    listIssues.mockResolvedValue([issue({ id: 22, title: 'Not mine', reporter: { id: 1, username: 'jane.dev', avatar: null } })])
    renderBoard('en', currentUser({ id: 99 }))

    const card = (await screen.findByText('Not mine')).closest('[draggable]')
    expect(card).toHaveAttribute('draggable', 'false')
    expect(card).toHaveAttribute('title', 'Only the person who created this issue can edit it.')
    expect(screen.getByRole('combobox', { name: 'Move to' })).toBeDisabled()
  })

  it('disables drag when signed out (no user to compare against the reporter)', async () => {
    listIssues.mockResolvedValue([issue({ id: 23, title: 'Anonymous view' })])
    renderBoard('en', null)

    const card = (await screen.findByText('Anonymous view')).closest('[draggable]')
    expect(card).toHaveAttribute('draggable', 'false')
  })

  it('shows an empty state with a create action when the project has no issues', async () => {
    listIssues.mockResolvedValue([])
    renderBoard('en', currentUser())

    expect(await screen.findByText('The board is empty')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'New issue' })).toHaveAttribute('href', '/projects/7/issues?new=1')
  })

  it('flags an overdue card', async () => {
    listIssues.mockResolvedValue([issue({ id: 31, title: 'Late one', due_date: '2020-01-01' })])
    renderBoard('en', currentUser())

    expect(await screen.findByText(/^Overdue/)).toBeInTheDocument()
  })
})
