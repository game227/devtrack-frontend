import { screen, within } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { ProjectAnalyticsPage } from './ProjectAnalyticsPage'
import type { Issue } from '../types/issue'

const listIssues = vi.fn()
const listCycles = vi.fn()
vi.mock('../api/issues', () => ({ listIssues: (...a: unknown[]) => listIssues(...a) }))
vi.mock('../api/cycles', () => ({ listCycles: (...a: unknown[]) => listCycles(...a) }))
vi.mock('../api/health', () => ({ getProjectHealth: () => Promise.reject(new Error('no health in this test')) }))

function issue(id: number, overrides: Partial<Issue>): Issue {
  return {
    id,
    project: 3,
    title: `Issue ${id}`,
    description: '',
    type: 'task',
    status: 'todo',
    priority: 'medium',
    assignee: { id: 1, username: 'alex.k', avatar: null },
    reporter: { id: 1, username: 'alex.k', avatar: null },
    labels: [],
    cycle: null,
    milestone: null,
    due_date: null,
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
    ...overrides,
  }
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/projects/:id/analytics" element={<ProjectAnalyticsPage />} />
    </Routes>,
    { route: '/projects/3/analytics', lang: 'en' },
  )
}

describe('ProjectAnalyticsPage', () => {
  beforeEach(() => {
    listIssues.mockReset()
    listCycles.mockReset()
    listCycles.mockResolvedValue([])
  })

  it('computes headline numbers from the project issues', async () => {
    listIssues.mockResolvedValue([
      issue(1, { status: 'done' }),
      issue(2, { status: 'in_progress', type: 'bug', priority: 'urgent' }),
      issue(3, { status: 'todo', due_date: '2020-01-01' }), // overdue
      issue(4, { status: 'done', assignee: null }),
    ])
    renderPage()

    const total = (await screen.findByText('Total issues')).parentElement as HTMLElement
    expect(within(total).getByText('4')).toBeInTheDocument()
    expect(within((screen.getByText('Completed').parentElement as HTMLElement)).getByText('50%')).toBeInTheDocument()
    expect(within((screen.getByText('Open').parentElement as HTMLElement)).getByText('2')).toBeInTheDocument()
    expect(within((screen.getByText('Overdue').parentElement as HTMLElement)).getByText('1')).toBeInTheDocument()
    expect(screen.getByText('Issues by status')).toBeInTheDocument()
    expect(screen.getByText('No cycles yet.')).toBeInTheDocument()
  })

  it('explains an empty project instead of drawing empty charts', async () => {
    listIssues.mockResolvedValue([])
    renderPage()
    expect(await screen.findByText(/No issues yet/)).toBeInTheDocument()
    expect(screen.queryByText('Issues by status')).not.toBeInTheDocument()
  })
})
