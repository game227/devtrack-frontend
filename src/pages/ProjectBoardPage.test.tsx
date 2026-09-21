import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { ProjectBoardPage } from './ProjectBoardPage'
import type { Issue } from '../types/issue'

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
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
    ...overrides,
  }
}

function renderBoard(lang: 'uz' | 'en' = 'uz') {
  return renderWithProviders(
    <Routes>
      <Route path="/projects/:id/board" element={<ProjectBoardPage />} />
    </Routes>,
    { route: '/projects/7/board', lang },
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
})
