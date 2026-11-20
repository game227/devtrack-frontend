import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { PushCard } from './PushCard'

const push = vi.hoisted(() => ({
  getPushStatus: vi.fn(),
  currentSubscription: vi.fn(),
  subscribePush: vi.fn(),
  unsubscribePush: vi.fn(),
  pushSupported: vi.fn(() => true),
}))
vi.mock('../lib/push', () => push)

beforeEach(() => {
  push.getPushStatus.mockReset().mockResolvedValue({ enabled: true, public_key: 'KEY', subscriptions: 0 })
  push.currentSubscription.mockReset().mockResolvedValue(null)
  push.subscribePush.mockReset().mockResolvedValue('granted')
  push.unsubscribePush.mockReset().mockResolvedValue(undefined)
  push.pushSupported.mockReturnValue(true)
})

describe('PushCard', () => {
  it('turns push on with the server key and the UI language, and off again', async () => {
    renderWithProviders(<PushCard />, { lang: 'ru' })
    await userEvent.click(await screen.findByRole('button', { name: 'Включить' }))
    expect(push.subscribePush).toHaveBeenCalledWith('KEY', 'ru')
    await userEvent.click(await screen.findByRole('button', { name: 'Выключить' }))
    expect(push.unsubscribePush).toHaveBeenCalled()
  })

  it('explains a blocked permission', async () => {
    push.subscribePush.mockResolvedValue('denied')
    renderWithProviders(<PushCard />, { lang: 'en' })
    await userEvent.click(await screen.findByRole('button', { name: 'Turn on' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Notifications are blocked for this site.')
  })

  it('stays hidden while the server has push off', async () => {
    push.getPushStatus.mockResolvedValue({ enabled: false, public_key: '', subscriptions: 0 })
    renderWithProviders(<PushCard />, { lang: 'en' })
    await waitFor(() => expect(push.getPushStatus).toHaveBeenCalled())
    expect(screen.queryByText('Notifications on this device')).not.toBeInTheDocument()
  })
})
