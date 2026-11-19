import { screen, within, waitFor } from '@testing-library/react'
import { useEffect, useState } from 'react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { WorkspaceContext } from '../features/workspace/workspaceContext'
import { makeAuth, renderWithProviders } from '../test/utils'
import { Layout } from './Layout'
import type { Workspace } from '../types/workspace'

vi.mock('../api/projects', () => ({
  getProject: vi.fn().mockResolvedValue({ id: 7, name: 'Payments API', status: 'active', icon: '' }),
  listProjects: vi.fn().mockResolvedValue([
    { id: 7, name: 'Payments API', status: 'active' },
    { id: 8, name: 'Docs Portal', status: 'planned' },
    { id: 9, name: 'Old Site', status: 'archived' },
  ]),
}))
const createIssue = vi.fn()
vi.mock('../api/issues', () => ({ createIssue: (...args: unknown[]) => createIssue(...args) }))
vi.mock('../api/search', () => ({ search: vi.fn() }))
vi.mock('../api/changes', () => ({ LIVE_STREAM: false, getChanges: vi.fn().mockResolvedValue({ cursor: 'c', changed: [] }) }))
vi.mock('../api/notifications', () => ({
  listNotifications: vi.fn().mockResolvedValue([]),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
}))

const workspace = { id: 3, name: 'Nova Labs' } as Workspace

function Where() {
  const { pathname, search } = useLocation()
  return (
    <>
      <div data-testid="where">{pathname + search}</div>
      <input aria-label="Some field" />
    </>
  )
}

function renderLayout(route: string) {
  return renderWithProviders(
    <WorkspaceContext.Provider
      value={{ currentWorkspace: workspace, workspaces: [workspace], isLoading: false, selectWorkspace: () => {} }}
    >
      <Routes>
        <Route element={<Layout />}>
          <Route path="*" element={<Where />} />
        </Route>
      </Routes>
    </WorkspaceContext.Provider>,
    { route, lang: 'en', auth: makeAuth({ isAuthenticated: true }) },
  )
}

describe('Layout keyboard shortcuts', () => {
  it('opens and closes the command palette with Ctrl+K', async () => {
    renderLayout('/dashboard')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await userEvent.keyboard('{Control>}k{/Control}')
    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('navigates with G then a letter', async () => {
    renderLayout('/dashboard')
    await userEvent.keyboard('gp')
    expect(screen.getByTestId('where')).toHaveTextContent('/projects')
  })

  it('opens the new-issue dialog for the current project with C, without leaving the page', async () => {
    renderLayout('/projects/7/board')
    await userEvent.keyboard('c')
    const dialog = await screen.findByRole('dialog', { name: 'New issue' })
    expect(dialog).toBeInTheDocument()
    await waitFor(() => expect(screen.getByLabelText('Project')).toHaveValue('7'))
    expect(screen.getByTestId('where')).toHaveTextContent('/projects/7/board')
  })

  it('opens the new-issue dialog with C when no project is open too', async () => {
    renderLayout('/dashboard')
    await userEvent.keyboard('c')
    expect(await screen.findByRole('dialog', { name: 'New issue' })).toBeInTheDocument()
    expect(screen.getByTestId('where')).toHaveTextContent('/dashboard')
  })

  it('shows the shortcuts list on ? and runs a palette command through to navigation', async () => {
    renderLayout('/dashboard')
    await userEvent.keyboard('?')
    expect(screen.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')

    await userEvent.keyboard('{Control>}k{/Control}')
    await userEvent.type(screen.getByRole('combobox'), 'teams')
    await userEvent.keyboard('{Enter}')
    expect(screen.getByTestId('where')).toHaveTextContent('/teams')
  })

  it('does not treat typing in a field as a shortcut', async () => {
    renderLayout('/dashboard')
    await userEvent.type(screen.getByLabelText('Some field'), 'cgp')
    expect(screen.getByTestId('where')).toHaveTextContent('/dashboard')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})


describe('Layout accessibility', () => {
  it('starts with a skip link that moves focus to the page content', async () => {
    renderLayout('/dashboard')
    const skip = screen.getByRole('link', { name: 'Skip to content' })
    expect(skip).toHaveAttribute('href', '#main-content')
    expect(document.getElementById('main-content')).toBe(screen.getByRole('main'))
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1') // focusable by the fragment jump
    // It is the very first stop when tabbing into the page.
    await userEvent.tab()
    expect(skip).toHaveFocus()
  })

  it('names its landmarks so they can be told apart', async () => {
    renderLayout('/projects/7/board')
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Project sections' })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Board' })).toHaveAttribute('aria-current', 'page')
  })

  it('gives the search button an accessible name that contains its visible text and shortcut', async () => {
    renderLayout('/dashboard')
    const button = screen.getByRole('button', { name: 'Search, Ctrl K' })
    expect(button).toHaveTextContent('Search')
    expect(button).toHaveTextContent('Ctrl K')
    await userEvent.click(button)
    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument()
  })

  it('keeps profile, settings, theme, language and sign-out in the account menu', async () => {
    renderLayout('/dashboard')
    const trigger = screen.getByRole('button', { name: /^Account menu/ })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const panel = within(document.getElementById(trigger.getAttribute('aria-controls')!)!)
    expect(panel.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/profile')
    expect(panel.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings')
    expect(panel.getByRole('group', { name: 'Theme' })).toBeInTheDocument()
    expect(panel.getByRole('group', { name: 'Language' })).toBeInTheDocument()
    expect(panel.getByRole('button', { name: 'Log out' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('link', { name: 'Profile' })).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

})

describe('Layout sidebar and breadcrumbs', () => {
  it('lists the main sections and the starred projects in the sidebar', async () => {
    const { listProjects } = await import('../api/projects')
    vi.mocked(listProjects).mockResolvedValueOnce([
      { id: 7, name: 'Payments API', status: 'active', icon: '', is_favorite: true },
      { id: 8, name: 'Docs Portal', status: 'planned', icon: '', is_favorite: false },
    ] as never)
    renderLayout('/dashboard')
    const sidebar = within(screen.getByRole('complementary', { name: 'Sidebar' }))
    expect(sidebar.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects')
    const favorites = within(await sidebar.findByRole('region', { name: 'Favorites' }))
    expect(await favorites.findByRole('link', { name: 'Payments API' })).toHaveAttribute('href', '/projects/7')
    expect(favorites.queryByRole('link', { name: 'Docs Portal' })).not.toBeInTheDocument()
  })

  it('collapses the sidebar to icons and remembers it', async () => {
    renderLayout('/dashboard')
    const toggle = screen.getByRole('button', { name: 'Collapse sidebar' })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(toggle)
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute('aria-expanded', 'false')
    expect(localStorage.getItem('devtrack_sidebar')).toBe('collapsed')
    // Narrow, the links keep their names for screen readers.
    expect(within(screen.getByRole('complementary', { name: 'Sidebar' })).getByRole('link', { name: 'Issues' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }))
    expect(localStorage.getItem('devtrack_sidebar')).toBeNull()
  })

  it('says where you are: workspace, section, project and tab', async () => {
    renderLayout('/projects/7/board')
    const trail = within(screen.getByRole('navigation', { name: 'You are here' }))
    expect(trail.getByRole('link', { name: 'Nova Labs' })).toHaveAttribute('href', '/dashboard')
    expect(trail.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects')
    expect(await trail.findByRole('link', { name: 'Payments API' })).toHaveAttribute('href', '/projects/7')
    expect(trail.getByText('Board')).toHaveAttribute('aria-current', 'page')
  })
})

describe('Layout new issue', () => {
  it('creates an issue from the top bar and opens it when it belongs to another project', async () => {
    createIssue.mockResolvedValue({ id: 55, project: 8, number: 3 })
    renderLayout('/dashboard')
    await userEvent.click(within(screen.getByRole('banner')).getByRole('button', { name: 'New issue' }))
    const project = await screen.findByLabelText('Project')
    // Archived projects take no new work.
    await waitFor(() => expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(expect.arrayContaining(['Payments API', 'Docs Portal'])))
    expect(screen.queryByRole('option', { name: 'Old Site' })).not.toBeInTheDocument()
    await userEvent.selectOptions(project, '8')
    await userEvent.type(screen.getByLabelText('Title'), 'Write the API docs')
    await userEvent.click(screen.getByRole('button', { name: 'Create issue' }))
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/issues/55'))
    expect(createIssue.mock.calls[0][0]).toEqual(expect.objectContaining({ project: 8, title: 'Write the API docs' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it("stays on the project's page when the new issue belongs to it", async () => {
    createIssue.mockResolvedValue({ id: 56, project: 7, number: 4 })
    renderLayout('/projects/7/board')
    await userEvent.click(within(screen.getByRole('banner')).getByRole('button', { name: 'New issue' }))
    await waitFor(() => expect(screen.getByLabelText('Project')).toHaveValue('7'))
    await userEvent.type(screen.getByLabelText('Title'), 'Rate limit refunds')
    await userEvent.click(screen.getByRole('button', { name: 'Create issue' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByTestId('where')).toHaveTextContent('/projects/7/board')
  })
})

describe('Layout page titles', () => {
  function PageWithHeading({ heading }: { heading: string }) {
    return <h1>{heading}</h1>
  }

  function renderPages(route: string) {
    return renderWithProviders(
      <WorkspaceContext.Provider
        value={{ currentWorkspace: workspace, workspaces: [workspace], isLoading: false, selectWorkspace: () => {} }}
      >
        <Routes>
          <Route element={<Layout />}>
            <Route path="/projects" element={<PageWithHeading heading="Projects" />} />
            <Route path="/teams" element={<PageWithHeading heading="Teams" />} />
            <Route path="*" element={<Where />} />
          </Route>
        </Routes>
      </WorkspaceContext.Provider>,
      { route, lang: 'en', auth: makeAuth({ isAuthenticated: true }) },
    )
  }

  it("names each page after its heading instead of calling every page 'DevTrack'", async () => {
    renderPages('/projects')
    await waitFor(() => expect(document.title).toBe('Projects · DevTrack'))

    await userEvent.keyboard('gt') // go to Teams
    await waitFor(() => expect(document.title).toBe('Teams · DevTrack'))
  })

  it('announces the new page after a navigation, but stays quiet on the first load', async () => {
    renderPages('/projects')
    await waitFor(() => expect(document.title).toBe('Projects · DevTrack'))
    expect(screen.getByRole('status')).toHaveTextContent('')

    await userEvent.keyboard('gt')
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Teams'))
  })

  it('stays quiet for the landing page even when its heading only appears after loading', async () => {
    function SlowPage() {
      const [ready, setReady] = useState(false)
      useEffect(() => {
        const timer = setTimeout(() => setReady(true), 120)
        return () => clearTimeout(timer)
      }, [])
      return ready ? <h1>Loaded later</h1> : <p>Loading…</p>
    }
    renderWithProviders(
      <WorkspaceContext.Provider
        value={{ currentWorkspace: workspace, workspaces: [workspace], isLoading: false, selectWorkspace: () => {} }}
      >
        <Routes>
          <Route element={<Layout />}>
            <Route path="*" element={<SlowPage />} />
          </Route>
        </Routes>
      </WorkspaceContext.Provider>,
      { route: '/projects/9', lang: 'en', auth: makeAuth({ isAuthenticated: true }) },
    )
    await waitFor(() => expect(document.title).toBe('Loaded later · DevTrack'))
    expect(screen.getByRole('status')).toHaveTextContent('')
  })

  it('announces again when the next page has the same heading', async () => {
    renderWithProviders(
      <WorkspaceContext.Provider
        value={{ currentWorkspace: workspace, workspaces: [workspace], isLoading: false, selectWorkspace: () => {} }}
      >
        <Routes>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<PageWithHeading heading="Start" />} />
            <Route path="/projects" element={<PageWithHeading heading="Same" />} />
            <Route path="/teams" element={<PageWithHeading heading="Same" />} />
          </Route>
        </Routes>
      </WorkspaceContext.Provider>,
      { route: '/dashboard', lang: 'en', auth: makeAuth({ isAuthenticated: true }) },
    )
    const status = screen.getByRole('status')
    await userEvent.keyboard('gp')
    await waitFor(() => expect(status.textContent?.replace('\u200b', '')).toBe('Same'))
    const first = status.textContent
    await userEvent.keyboard('gt') // another page, same heading
    await waitFor(() => expect(status.textContent).not.toBe(first)) // the text changed, so it is read again
    expect(status.textContent?.replace('\u200b', '')).toBe('Same')
  })

  it('gives the title back when leaving the layout', async () => {
    const { unmount } = renderPages('/projects')
    await waitFor(() => expect(document.title).toBe('Projects · DevTrack'))
    unmount()
    expect(document.title).toBe('DevTrack')
  })

  it('falls back to the plain name on a page without a heading', async () => {
    renderLayout('/dashboard')
    await waitFor(() => expect(document.title).toBe('DevTrack'))
  })
})

describe('BottomNav on phones', () => {
  it('offers the main sections and a new-issue button', async () => {
    renderLayout('/dashboard')
    const nav = await screen.findByRole('navigation', { name: 'Main sections' })
    expect(within(nav).getByRole('link', { name: 'Issues' })).toHaveAttribute('href', '/issues')
    await userEvent.click(within(nav).getByRole('button', { name: 'New issue' }))
    expect(await screen.findByRole('dialog', { name: 'New issue' })).toBeInTheDocument()
  })
})
