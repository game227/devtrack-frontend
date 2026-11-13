import { screen, waitFor } from '@testing-library/react'
import { AxiosError } from 'axios'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { SettingsPage } from './SettingsPage'

const getGithubConnectionStatus = vi.fn()
const getGithubAuthorizeUrl = vi.fn()
const completeGithubConnection = vi.fn()
vi.mock('../api/integrations', () => ({
  getGithubConnectionStatus: () => getGithubConnectionStatus(),
  getGithubAuthorizeUrl: (nonce: string) => getGithubAuthorizeUrl(nonce),
  completeGithubConnection: (pending: string, nonce: string) => completeGithubConnection(pending, nonce),
  disconnectGithub: vi.fn(),
}))
vi.mock('../api/telegram', () => ({
  getTelegramConnectionStatus: () => Promise.resolve({ connected: false }),
  getTelegramDeepLink: vi.fn(),
  disconnectTelegram: vi.fn(),
}))

function renderSettings(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>,
    { route, lang: 'en' },
  )
}

describe('SettingsPage — connecting GitHub', () => {
  beforeEach(() => {
    sessionStorage.clear()
    getGithubConnectionStatus.mockReset().mockResolvedValue({ connected: false })
    getGithubAuthorizeUrl.mockReset()
    completeGithubConnection.mockReset()
  })

  it('finishes a returning authorization with the nonce this browser kept, once', async () => {
    sessionStorage.setItem('devtrack_github_nonce', 'kept-nonce')
    completeGithubConnection.mockResolvedValue({ connected: true, github_username: 'alice-gh' })
    renderSettings('/settings?github_pending=1234')
    expect(await screen.findByText('GitHub account connected.')).toBeInTheDocument()
    expect(completeGithubConnection).toHaveBeenCalledTimes(1)
    expect(completeGithubConnection).toHaveBeenCalledWith('1234', 'kept-nonce')
    expect(sessionStorage.getItem('devtrack_github_nonce')).toBeNull() // single use
  })

  it("explains a refused claim (another browser's or an expired authorization)", async () => {
    completeGithubConnection.mockRejectedValue(
      Object.assign(new AxiosError('bad', 'ERR_BAD_REQUEST'), { response: { status: 400, data: { detail: 'invalid_or_expired' } } }),
    )
    renderSettings('/settings?github_pending=1234')
    expect(await screen.findByRole('alert')).toHaveTextContent('started in another browser')
  })

  it('never echoes arbitrary text from the address bar', async () => {
    renderSettings('/settings?github_error=Your+account+is+suspended.+Call+555-0100')
    const alert = await screen.findByRole('alert')
    expect(alert).not.toHaveTextContent('555')
    expect(alert).toHaveTextContent('GitHub did not complete the authorization')
  })

  it('starts by keeping a fresh random nonce for this browser and sending it along', async () => {
    getGithubAuthorizeUrl.mockReturnValue(new Promise(() => {})) // stay on the page
    renderSettings('/settings')
    ;(await screen.findByRole('button', { name: /Connect GitHub/i })).click()
    await waitFor(() => expect(getGithubAuthorizeUrl).toHaveBeenCalled())
    const sent = getGithubAuthorizeUrl.mock.calls[0][0] as string
    expect(sent).toMatch(/^[0-9a-f]{48}$/)
    expect(sessionStorage.getItem('devtrack_github_nonce')).toBe(sent)
  })
})
