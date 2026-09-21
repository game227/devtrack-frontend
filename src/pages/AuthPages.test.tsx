import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError } from 'axios'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { ForgotPasswordPage } from './ForgotPasswordPage'
import { LoginPage } from './LoginPage'
import { ResetPasswordPage } from './ResetPasswordPage'

const requestPasswordReset = vi.fn()
const confirmPasswordReset = vi.fn()
vi.mock('../api/auth', () => ({
  requestPasswordReset: (...args: unknown[]) => requestPasswordReset(...args),
  confirmPasswordReset: (...args: unknown[]) => confirmPasswordReset(...args),
}))

function badRequest(data: unknown) {
  return new AxiosError('bad', 'ERR_BAD_REQUEST', undefined, undefined, {
    status: 400,
    data,
    statusText: '',
    headers: {},
    config: { headers: {} } as never,
  })
}

beforeEach(() => {
  requestPasswordReset.mockReset()
  confirmPasswordReset.mockReset()
})

describe('LoginPage', () => {
  it('is in Uzbek by default and links to password recovery', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByRole('heading', { name: "DevTrack'ga kirish" })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Parolni unutdingizmi?' })).toHaveAttribute('href', '/forgot-password')
  })

  it('shows a translated server error when the credentials are wrong', async () => {
    const login = vi.fn().mockRejectedValue(badRequest({ detail: 'No active account found with the given credentials' }))
    renderWithProviders(<LoginPage />, { auth: { login } })
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Foydalanuvchi nomi'), 'jane')
    await user.type(screen.getByLabelText('Parol'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Kirish' }))

    expect(await screen.findByRole('alert')).toHaveTextContent("Foydalanuvchi nomi yoki parol noto'g'ri.")
    expect(login).toHaveBeenCalledWith({ username: 'jane', password: 'wrong' })
  })

  it('renders in English when English is selected', () => {
    renderWithProviders(<LoginPage />, { lang: 'en' })
    expect(screen.getByRole('heading', { name: 'Sign in to DevTrack' })).toBeInTheDocument()
  })
})

describe('ForgotPasswordPage', () => {
  it('requests a reset and then shows the confirmation', async () => {
    requestPasswordReset.mockResolvedValue({ detail: 'ok' })
    renderWithProviders(<ForgotPasswordPage />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Email'), 'jane@example.com')
    await user.click(screen.getByRole('button', { name: 'Havolani yuborish' }))

    expect(await screen.findByRole('status')).toHaveTextContent('tiklash havolasi yuborildi')
    expect(requestPasswordReset).toHaveBeenCalledWith({ email: 'jane@example.com', lang: 'uz' })
  })
})

describe('ResetPasswordPage', () => {
  function renderReset() {
    return renderWithProviders(
      <Routes>
        <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />
      </Routes>,
      { route: '/reset-password/abc/tok-123' },
    )
  }

  it('rejects mismatching passwords without calling the API', async () => {
    renderReset()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Yangi parol'), 'Sup3r-secret')
    await user.type(screen.getByLabelText('Yangi parolni tasdiqlang'), 'Different-1')
    await user.click(screen.getByRole('button', { name: 'Parolni tiklash' }))

    expect(await screen.findByText('Parollar mos kelmadi.')).toBeInTheDocument()
    expect(confirmPasswordReset).not.toHaveBeenCalled()
  })

  it('sends uid and token from the link and confirms success', async () => {
    confirmPasswordReset.mockResolvedValue({ detail: 'done' })
    renderReset()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Yangi parol'), 'Sup3r-secret')
    await user.type(screen.getByLabelText('Yangi parolni tasdiqlang'), 'Sup3r-secret')
    await user.click(screen.getByRole('button', { name: 'Parolni tiklash' }))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Parolingiz tiklandi'))
    expect(confirmPasswordReset).toHaveBeenCalledWith({
      uid: 'abc',
      token: 'tok-123',
      new_password: 'Sup3r-secret',
      new_password_confirm: 'Sup3r-secret',
    })
  })

  it('shows an invalid-link error at form level', async () => {
    confirmPasswordReset.mockRejectedValue(badRequest({ token: 'Invalid or expired token.' }))
    renderReset()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Yangi parol'), 'Sup3r-secret')
    await user.type(screen.getByLabelText('Yangi parolni tasdiqlang'), 'Sup3r-secret')
    await user.click(screen.getByRole('button', { name: 'Parolni tiklash' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Tiklash havolasi yaroqsiz yoki muddati tugagan.')
  })
})
