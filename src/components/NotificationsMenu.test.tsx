import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { NotificationsMenu } from './NotificationsMenu'

vi.mock('../api/notifications', () => ({
  listNotifications: () =>
    Promise.resolve([
      {
        id: 1,
        verb: 'commented',
        target_type: 'comment',
        target_id: 55,
        target_display: 'On it',
        actor: 'alex',
        issue: { id: 9, number: 12, title: 'Fix login' },
        is_read: false,
        created_at: '2026-11-17T10:00:00Z',
      },
    ]),
  markNotificationRead: vi.fn().mockResolvedValue(undefined),
  markAllNotificationsRead: vi.fn().mockResolvedValue(undefined),
}))

describe('NotificationsMenu', () => {
  it('says who commented on which issue, quotes the comment, and opens the issue', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/" element={<NotificationsMenu />} />
        <Route path="/issues/:id" element={<p>issue page</p>} />
      </Routes>,
      { lang: 'en' },
    )
    await userEvent.click(await screen.findByRole('button', { name: 'Notifications, 1' }))
    const item = screen.getByRole('button', { name: /alex commented on #12 Fix login/ })
    expect(item).toHaveTextContent('“On it”')
    await userEvent.click(item)
    expect(await screen.findByText('issue page')).toBeInTheDocument()
  })
})
