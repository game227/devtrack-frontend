import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { IssueChecklist } from './IssueChecklist'

const listChecklist = vi.fn()
const addChecklistItem = vi.fn()
const updateChecklistItem = vi.fn()
const deleteChecklistItem = vi.fn()
vi.mock('../api/issueParts', () => ({
  listChecklist: (...a: unknown[]) => listChecklist(...a),
  addChecklistItem: (...a: unknown[]) => addChecklistItem(...a),
  updateChecklistItem: (...a: unknown[]) => updateChecklistItem(...a),
  deleteChecklistItem: (...a: unknown[]) => deleteChecklistItem(...a),
}))

let items = [
  { id: 1, text: 'Write tests', done: true, position: 1, created_at: '' },
  { id: 2, text: 'Ship', done: false, position: 2, created_at: '' },
]

beforeEach(() => {
  items = [
    { id: 1, text: 'Write tests', done: true, position: 1, created_at: '' },
    { id: 2, text: 'Ship', done: false, position: 2, created_at: '' },
  ]
  listChecklist.mockReset().mockImplementation(() => Promise.resolve(items))
  addChecklistItem.mockReset().mockResolvedValue({ id: 3, text: 'Review', done: false, position: 3, created_at: '' })
  updateChecklistItem.mockReset().mockImplementation((id: number, patch: { done: boolean }) => {
    items = items.map((item) => (item.id === id ? { ...item, ...patch } : item))
    return Promise.resolve({})
  })
  deleteChecklistItem.mockReset().mockResolvedValue(undefined)
})

describe('IssueChecklist', () => {
  it('shows progress and lets the people working on the issue change it', async () => {
    renderWithProviders(<IssueChecklist issueId={5} canChange />, { lang: 'en' })
    expect(await screen.findByText('1 of 2 done')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Checklist' })).toHaveAttribute('aria-valuenow', '50')

    await userEvent.click(screen.getByRole('checkbox', { name: 'Ship' }))
    expect(updateChecklistItem).toHaveBeenCalledWith(2, { done: true })
    expect(screen.getByRole('checkbox', { name: 'Ship' })).toBeChecked()

    await userEvent.type(screen.getByRole('textbox', { name: 'Add step' }), 'Review{Enter}')
    expect(addChecklistItem).toHaveBeenCalledWith(5, 'Review')
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Add step' })).toHaveValue(''))

    await userEvent.click(screen.getByRole('button', { name: 'Remove step: Write tests' }))
    expect(deleteChecklistItem).toHaveBeenCalledWith(1)
  })

  it('is read-only for everyone else, and hidden when empty', async () => {
    const { unmount } = renderWithProviders(<IssueChecklist issueId={5} canChange={false} />, { lang: 'en' })
    expect(await screen.findByRole('checkbox', { name: 'Ship' })).toBeDisabled()
    expect(screen.queryByRole('textbox', { name: 'Add step' })).not.toBeInTheDocument()
    unmount()

    listChecklist.mockResolvedValue([])
    renderWithProviders(<IssueChecklist issueId={6} canChange={false} />, { lang: 'en' })
    await waitFor(() => expect(listChecklist).toHaveBeenCalledWith(6))
    expect(screen.queryByRole('heading', { name: 'Checklist' })).not.toBeInTheDocument()
  })
})
