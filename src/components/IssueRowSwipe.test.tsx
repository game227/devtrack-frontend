import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { makeAuth, renderWithProviders } from '../test/utils'
import { IssueList, IssueRow } from './IssueRow'
import type { Issue } from '../types/issue'
import type { User } from '../types/auth'

const updateIssue = vi.fn()
vi.mock('../api/issues', () => ({ updateIssue: (...args: unknown[]) => updateIssue(...args) }))

const issue = {
  id: 9, project: 7, number: 4, title: 'Swipe me', description: '', type: 'task', status: 'todo', priority: 'medium',
  assignee: null, reporter: { id: 1, username: 'jane', avatar: null }, labels: [], cycle: null, milestone: null,
  due_date: null, github_number: null, github_url: '', estimate: null, checklist: null, completed_at: null,
  created_at: '2026-11-01T10:00:00Z', updated_at: '2026-11-01T10:00:00Z',
} as Issue

function swipe(element: HTMLElement, distance: number) {
  fireEvent.pointerDown(element, { pointerType: 'touch', clientX: 300, clientY: 20 })
  for (let x = 300; x >= 300 - distance; x -= 20) fireEvent.pointerMove(element, { pointerType: 'touch', clientX: x, clientY: 22 })
  fireEvent.pointerUp(element, { pointerType: 'touch', clientX: 300 - distance, clientY: 22 })
  fireEvent.click(element)
}

describe('IssueRow swipe', () => {
  it('sends the issue to its next station on a long swipe left, without opening it', async () => {
    updateIssue.mockResolvedValue({ ...issue, status: 'in_progress' })
    renderWithProviders(
      <IssueList>
        <IssueRow issue={issue} />
      </IssueList>,
      { lang: 'en', route: '/issues', auth: makeAuth({ user: { id: 1, username: 'jane' } as User }) },
    )
    const row = screen.getByRole('link', { name: /Swipe me/ })
    swipe(row, 100)
    await waitFor(() => expect(updateIssue).toHaveBeenCalledWith(9, { status: 'in_progress' }))
  })

  it('does nothing on a short swipe, or for someone who may not change the issue', () => {
    updateIssue.mockReset()
    const { unmount } = renderWithProviders(
      <IssueList>
        <IssueRow issue={issue} />
      </IssueList>,
      { lang: 'en', auth: makeAuth({ user: { id: 1, username: 'jane' } as User }) },
    )
    swipe(screen.getByRole('link', { name: /Swipe me/ }), 40)
    unmount()
    renderWithProviders(
      <IssueList>
        <IssueRow issue={issue} />
      </IssueList>,
      { lang: 'en', auth: makeAuth({ user: { id: 5, username: 'other' } as User }) },
    )
    swipe(screen.getByRole('link', { name: /Swipe me/ }), 120)
    expect(updateIssue).not.toHaveBeenCalled()
  })
})
