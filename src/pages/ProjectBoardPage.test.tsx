import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeAuth, renderWithProviders } from '../test/utils'
import { NewIssueContext } from '../features/issues/newIssueContext'
import { ProjectBoardPage } from './ProjectBoardPage'
import type { Issue } from '../types/issue'
import type { User } from '../types/auth'

const listIssues = vi.fn()
const updateIssue = vi.fn()
vi.mock('../api/issues', () => ({
  listIssues: (...args: unknown[]) => listIssues(...args),
  updateIssue: (...args: unknown[]) => updateIssue(...args),
  // The board's loader, fed from the same fixture: everything open, finished ones newest first.
  loadBoard: async () => {
    const issues: Issue[] = await listIssues()
    return { issues, doneTotal: issues.filter((issue) => issue.status === 'done').length }
  },
}))

function issue(overrides: Partial<Issue>): Issue {
  return {
    id: 1,
    project: 7,
    number: 101,
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

const openNewIssue = vi.fn()

function renderBoard(lang: 'uz' | 'en' = 'uz', user: User | null = null) {
  return renderWithProviders(
    <NewIssueContext.Provider value={openNewIssue}>
      <Routes>
        <Route path="/projects/:id/board" element={<ProjectBoardPage />} />
      </Routes>
    </NewIssueContext.Provider>,
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
      issue({ id: 11, number: 5, title: 'In the backlog', status: 'backlog' }),
      issue({ id: 12, number: 6, title: 'Being reviewed', status: 'in_review', assignee: null }),
    ])
    renderBoard()

    expect(await screen.findByText('In the backlog')).toBeInTheDocument()
    for (const title of ['Zaxira', 'Qilinadigan', 'Jarayonda', "Ko'rib chiqilmoqda", 'Bajarildi']) {
      // Titles also appear as options of each card's touch-friendly status select.
      expect(screen.getAllByText(title).length).toBeGreaterThan(0)
    }
    // The card shows the issue's number within its project, not the global id used in URLs.
    expect(screen.getByText('#5')).toBeInTheDocument()
    expect(screen.queryByText('#11')).not.toBeInTheDocument()
    expect(screen.getByText('Tayinlanmagan')).toBeInTheDocument()
  })

  it('renders English column titles when English is selected', async () => {
    listIssues.mockResolvedValue([issue({ id: 1, status: 'done' })])
    renderBoard('en')
    await screen.findByText('#101')
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

  it('disables drag and offers no status picker for issues someone else created', async () => {
    listIssues.mockResolvedValue([issue({ id: 22, title: 'Not mine', reporter: { id: 1, username: 'jane.dev', avatar: null } })])
    renderBoard('en', currentUser({ id: 99 }))

    const card = (await screen.findByText('Not mine')).closest('[draggable]')
    expect(card).toHaveAttribute('draggable', 'false')
    expect(card).toHaveAttribute(
      'title',
      'Only the person who created this issue, or the person it is assigned to, can move it.',
    )
    // Nothing to offer on a card you cannot move: no (greyed-out) picker is rendered at all.
    expect(screen.queryByRole('combobox', { name: 'Move to' })).not.toBeInTheDocument()
  })

  it('lets the assignee move a card someone else created (they report progress)', async () => {
    listIssues.mockResolvedValue([
      issue({
        id: 24,
        title: 'Assigned to me',
        reporter: { id: 1, username: 'jane.dev', avatar: null },
        assignee: { id: 2, username: 'alex.k', avatar: null },
      }),
    ])
    renderBoard('en', currentUser({ id: 2, username: 'alex.k' }))

    const card = (await screen.findByText('Assigned to me')).closest('[draggable]')
    expect(card).toHaveAttribute('draggable', 'true')
    expect(screen.getByRole('combobox', { name: 'Move to' })).toBeEnabled()
  })

  it('keeps the status picker in the page for keyboard users on every screen size', async () => {
    listIssues.mockResolvedValue([issue({ id: 25, title: 'Keyboard' })])
    renderBoard('en', currentUser({ id: 1 }))
    const picker = await screen.findByRole('combobox', { name: 'Move to' })
    expect(picker).not.toHaveClass('md:hidden') // it used to disappear from tablets and desktops
    picker.focus()
    expect(picker).toHaveFocus()
  })

  it('collapses a long Done column to the latest cards and lets the user expand it', async () => {
    const user = userEvent.setup()
    const finished = Array.from({ length: 13 }, (_, index) =>
      issue({
        id: 200 + index,
        number: 300 + index,
        title: `Finished ${index}`,
        status: 'done',
        updated_at: `2026-09-${String(10 + index).padStart(2, '0')}T10:00:00Z`,
      }),
    )
    listIssues.mockResolvedValue(finished)
    renderBoard('en', currentUser({ id: 1 }))

    expect(await screen.findByText('Finished 12')).toBeInTheDocument() // the most recently updated is kept
    expect(screen.queryByText('Finished 0')).not.toBeInTheDocument() // the oldest are folded away
    expect(screen.getAllByText(/^Finished \d+$/)).toHaveLength(10)

    await user.click(screen.getByRole('button', { name: 'Show all (13)' }))
    expect(screen.getAllByText(/^Finished \d+$/)).toHaveLength(13)
    expect(screen.getByText('Finished 0')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show fewer' }))
    expect(screen.getAllByText(/^Finished \d+$/)).toHaveLength(10)
  })

  it('does not collapse a short Done column', async () => {
    listIssues.mockResolvedValue([issue({ id: 1, title: 'Only one', status: 'done' })])
    renderBoard('en', currentUser())
    await screen.findByText('Only one')
    expect(screen.queryByRole('button', { name: /Show all/ })).not.toBeInTheDocument()
    expect(within(document.body).getAllByText('Only one')).toHaveLength(1)
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
    // The page header and the empty state both open the new-issue dialog for this project.
    const buttons = screen.getAllByRole('button', { name: 'New issue' })
    expect(buttons).toHaveLength(2)
    await userEvent.click(buttons[1])
    expect(openNewIssue).toHaveBeenCalledWith(7)
  })

  it('flags an overdue card', async () => {
    listIssues.mockResolvedValue([issue({ id: 31, title: 'Late one', due_date: '2020-01-01' })])
    renderBoard('en', currentUser())

    expect(await screen.findByText(/^Overdue/)).toBeInTheDocument()
  })

  it('filters cards by title or #number and clears the filter', async () => {
    listIssues.mockResolvedValue([
      issue({ id: 41, number: 3, title: 'Rate limit charges' }),
      issue({ id: 42, number: 4, title: 'Write docs', status: 'in_progress' }),
    ])
    renderBoard('en', currentUser())
    const search = await screen.findByPlaceholderText('Find a card by title or #number')
    await userEvent.type(search, 'docs')
    expect(screen.queryByText('Rate limit charges')).not.toBeInTheDocument()
    expect(screen.getByText('Write docs')).toBeInTheDocument()
    await userEvent.clear(search)
    await userEvent.type(search, '#3')
    expect(screen.getByText('Rate limit charges')).toBeInTheDocument()
    expect(screen.queryByText('Write docs')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Clear filters/ }))
    expect(screen.getByText('Write docs')).toBeInTheDocument()
  })

  it("adds an issue straight into a column's station", async () => {
    listIssues.mockResolvedValue([issue({ id: 43, title: 'Something' })])
    renderBoard('en', currentUser())
    await userEvent.click(await screen.findByRole('button', { name: 'Add an issue to In progress' }))
    expect(openNewIssue).toHaveBeenCalledWith(7, 'in_progress')
  })
})
