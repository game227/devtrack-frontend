import { screen, waitFor } from '@testing-library/react'
import { useEffect, useState } from 'react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { WorkspaceContext } from '../features/workspace/workspaceContext'
import { makeAuth, renderWithProviders } from '../test/utils'
import { Layout } from './Layout'
import type { Workspace } from '../types/workspace'

vi.mock('../api/projects', () => ({ getProject: vi.fn().mockResolvedValue({ id: 7, name: 'Payments API' }) }))
vi.mock('../api/search', () => ({ search: vi.fn() }))
vi.mock('../api/notifications', () => ({
  listNotifications: vi.fn().mockResolvedValue([]),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
}))

const workspace = { id: 3, name: 'Nova Labs' } as Workspace

function Where() {
  const { pathname, search } = useLocation()
  return <div data-testid="where">{pathname + search}</div>
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

  it('opens the new-issue form of the current project with C', async () => {
    renderLayout('/projects/7/board')
    await userEvent.keyboard('c')
    expect(screen.getByTestId('where')).toHaveTextContent('/projects/7/issues?new=1')
  })

  it('sends C to the projects list when no project is open', async () => {
    renderLayout('/dashboard')
    await userEvent.keyboard('c')
    expect(screen.getByTestId('where')).toHaveTextContent('/projects')
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
    await userEvent.type(screen.getByRole('searchbox'), 'c')
    expect(screen.getByTestId('where')).toHaveTextContent('/dashboard')
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

  it('names its landmarks so they can be told apart', () => {
    renderLayout('/dashboard')
    expect(screen.getByRole('complementary', { name: 'Sidebar' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
  })

  it('gives the command palette button an accessible name that contains its visible shortcut', () => {
    renderLayout('/dashboard')
    const button = screen.getByRole('button', { name: /Command palette/ })
    expect(button).toHaveAccessibleName('Command palette, Ctrl K')
    expect(button).toHaveTextContent('Ctrl K')
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
