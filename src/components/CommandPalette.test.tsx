import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { CommandPalette } from './CommandPalette'
import type { Command } from '../features/shortcuts/commands'

const search = vi.fn()
vi.mock('../api/search', () => ({ search: (...args: unknown[]) => search(...args) }))

function setup() {
  const runBoard = vi.fn()
  const runIssues = vi.fn()
  const onClose = vi.fn()
  const navigate = vi.fn()
  const commands: Command[] = [
    { id: 'board', group: 'navigate', label: 'Go to Board', shortcut: 'G B', run: runBoard },
    { id: 'issues', group: 'navigate', label: 'Go to Issues', run: runIssues },
    { id: 'new-issue', group: 'create', label: 'New issue', shortcut: 'C', run: vi.fn() },
  ]
  renderWithProviders(
    <CommandPalette commands={commands} workspaceId={3} navigate={navigate} onClose={onClose} />,
    { lang: 'en' },
  )
  return { runBoard, runIssues, onClose, navigate }
}

describe('CommandPalette', () => {
  beforeEach(() => search.mockReset())

  it('lists commands grouped, with their shortcut hints', () => {
    setup()
    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Go to Board/ })).toHaveTextContent('G B')
    expect(screen.getByText('Go to')).toBeInTheDocument()
    expect(screen.getByText('Create')).toBeInTheDocument()
  })

  it('filters as you type and runs the highlighted command on Enter, closing first', async () => {
    const { runBoard, onClose } = setup()
    await userEvent.type(screen.getByRole('combobox'), 'board')
    expect(screen.queryByRole('option', { name: /New issue/ })).not.toBeInTheDocument()
    await userEvent.keyboard('{Enter}')
    expect(onClose).toHaveBeenCalledOnce()
    expect(runBoard).toHaveBeenCalledOnce()
  })

  it('moves the selection with the arrow keys, wrapping around', async () => {
    const { runIssues } = setup()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('option', { name: /Go to Issues/ })).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{ArrowUp}{ArrowUp}')
    expect(screen.getByRole('option', { name: /New issue/ })).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}')
    expect(runIssues).toHaveBeenCalledOnce()
  })

  it('closes on Escape', async () => {
    const { onClose } = setup()
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('says so when nothing matches', async () => {
    setup()
    await userEvent.type(screen.getByRole('combobox'), 'zzzzzz')
    expect(screen.getByText('Nothing matches "zzzzzz".')).toBeInTheDocument()
  })

  it('shows workspace search results ahead of commands and opens the chosen issue', async () => {
    search.mockResolvedValue({
      projects: [{ id: 1, name: 'Payments API', status: 'active' }],
      issues: [{ id: 12, title: 'Return structured error codes', type: 'task', status: 'done' }],
      users: [],
      labels: [],
      cycles: [],
    })
    const { navigate, onClose } = setup()
    await userEvent.type(screen.getByRole('combobox'), 'pay')
    const issue = await screen.findByRole('option', { name: /Return structured error codes/ })
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveTextContent('Payments API')
    await userEvent.click(issue)
    expect(onClose).toHaveBeenCalled()
    expect(navigate).toHaveBeenCalledWith('/issues/12')
  })
})
