import { act, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { IssueViewers } from './IssueViewers'

const sendPresence = vi.fn()
vi.mock('../api/changes', () => ({ sendPresence: (...a: unknown[]) => sendPresence(...a) }))

afterEach(() => vi.useRealTimers())

describe('IssueViewers', () => {
  it('beats while open and names the others viewing', async () => {
    vi.useFakeTimers()
    sendPresence.mockReset().mockResolvedValueOnce([]).mockResolvedValue([{ id: 2, username: 'aziza', avatar: null }])
    const { unmount } = renderWithProviders(<IssueViewers issueId={5} />, { lang: 'en' })
    await act(async () => {})
    expect(sendPresence).toHaveBeenCalledWith(5)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    await act(async () => vi.advanceTimersByTime(20_000))
    expect(screen.getByRole('status')).toHaveTextContent('aziza also viewing')
    unmount()
    await act(async () => vi.advanceTimersByTime(60_000))
    expect(sendPresence).toHaveBeenCalledTimes(2)
  })
})
