import { screen } from '@testing-library/react'
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
