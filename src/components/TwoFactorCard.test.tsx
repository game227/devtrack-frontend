import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { TwoFactorCard } from './TwoFactorCard'

const setupTwoFactor = vi.fn()
const enableTwoFactor = vi.fn()
const disableTwoFactor = vi.fn()
vi.mock('../api/auth', () => ({
  setupTwoFactor: (...a: unknown[]) => setupTwoFactor(...a),
  enableTwoFactor: (...a: unknown[]) => enableTwoFactor(...a),
  disableTwoFactor: (...a: unknown[]) => disableTwoFactor(...a),
}))

describe('TwoFactorCard', () => {
  const onChanged = vi.fn().mockResolvedValue(undefined)
  beforeEach(() => {
    setupTwoFactor.mockReset()
    enableTwoFactor.mockReset()
    disableTwoFactor.mockReset()
    onChanged.mockClear()
  })

  it('walks through password, key and code, then shows the recovery codes once', async () => {
    setupTwoFactor.mockResolvedValue({ secret: 'ABCDEFGHIJKLMNOP', otpauth_uri: 'otpauth://totp/DevTrack:jane?secret=ABCDEFGHIJKLMNOP' })
    enableTwoFactor.mockResolvedValue(['aaa111-bbb222', 'ccc333-ddd444'])
    const user = userEvent.setup()
    renderWithProviders(<TwoFactorCard enabled={false} onChanged={onChanged} />, { lang: 'en' })

    await user.click(screen.getByRole('button', { name: 'Turn on' }))
    await user.type(screen.getByLabelText('Current password'), 'pw')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByLabelText('Setup key')).toHaveTextContent('ABCD EFGH IJKL MNOP')
    expect(setupTwoFactor).toHaveBeenCalledWith('pw')

    await user.type(screen.getByLabelText('Authentication code'), '123456')
    await user.click(screen.getByRole('button', { name: 'Confirm and turn on' }))
    const codes = await screen.findByRole('list', { name: 'Recovery codes' })
    expect(codes).toHaveTextContent('aaa111-bbb222')
    expect(onChanged).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'I have saved them' }))
    expect(screen.queryByText('aaa111-bbb222')).not.toBeInTheDocument()
  })

  it('needs the password and a code to turn it off, and shows a wrong code', async () => {
    disableTwoFactor.mockRejectedValueOnce(
      Object.assign(new (await import('axios')).AxiosError('bad', 'ERR_BAD_REQUEST'), {
        response: { status: 400, data: { code: ['That code is not valid.'] } },
      }),
    ).mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    renderWithProviders(<TwoFactorCard enabled onChanged={onChanged} />, { lang: 'en' })

    await user.click(screen.getByRole('button', { name: 'Turn off' }))
    await user.type(screen.getByLabelText('Current password'), 'pw')
    await user.type(screen.getByLabelText('Authentication code'), '000000')
    await user.click(screen.getByRole('button', { name: 'Turn off' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('That code is not valid.')

    await user.clear(screen.getByLabelText('Authentication code'))
    await user.type(screen.getByLabelText('Authentication code'), '123456')
    await user.click(screen.getByRole('button', { name: 'Turn off' }))
    await waitFor(() => expect(disableTwoFactor).toHaveBeenLastCalledWith('pw', '123456'))
    expect(onChanged).toHaveBeenCalled()
  })
})
