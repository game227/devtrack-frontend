import type { Lang } from '../i18n/core'
import { setAccessToken, setStoredRefreshToken } from '../features/auth/tokenStore'
import { apiClient } from './client'
import type {
  AuthResponse,
  ChangePasswordPayload,
  ConfirmEmailVerificationPayload,
  ConfirmPasswordResetPayload,
  DeleteAccountPayload,
  LoginPayload,
  RegisterPayload,
  RequestPasswordResetPayload,
  UpdateMePayload,
  User,
} from '../types/auth'

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register/', payload)
  return data
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login/', payload)
  return data
}

export async function logout(refresh: string): Promise<void> {
  await apiClient.post('/auth/logout/', { refresh })
}

export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<User>('/auth/me/')
  return data
}

export async function updateMe(payload: UpdateMePayload): Promise<User> {
  if (payload.avatar) {
    const formData = new FormData()
    if (payload.first_name !== undefined) formData.append('first_name', payload.first_name)
    if (payload.last_name !== undefined) formData.append('last_name', payload.last_name)
    if (payload.bio !== undefined) formData.append('bio', payload.bio)
    if (payload.title !== undefined) formData.append('title', payload.title)
    formData.append('avatar', payload.avatar)
    const { data } = await apiClient.patch<User>('/auth/me/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  }
  const { data } = await apiClient.patch<User>('/auth/me/', payload)
  return data
}

// Changing the password ends every other session on the server (a stolen refresh token must not outlive
// the old password); this one carries on with the fresh pair the server returns, so it is stored here —
// otherwise the user would be signed out the next time the short-lived access token expires.
export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<{ detail: string }> {
  const { data } = await apiClient.post<{ detail: string; access: string; refresh: string }>(
    '/auth/password/change/',
    payload,
  )
  // An older backend answers with only `detail`: keep the current session rather than storing nothing.
  if (data.access && data.refresh) {
    setAccessToken(data.access)
    setStoredRefreshToken(data.refresh)
  }
  return { detail: data.detail }
}

export async function requestPasswordReset(
  payload: RequestPasswordResetPayload,
): Promise<{ detail: string }> {
  const { data } = await apiClient.post<{ detail: string }>('/auth/password/reset/', payload)
  return data
}

export async function confirmPasswordReset(
  payload: ConfirmPasswordResetPayload,
): Promise<{ detail: string }> {
  const { data } = await apiClient.post<{ detail: string }>(
    '/auth/password/reset/confirm/',
    payload,
  )
  return data
}

export async function confirmEmailVerification(
  payload: ConfirmEmailVerificationPayload,
): Promise<{ detail: string }> {
  const { data } = await apiClient.post<{ detail: string }>('/auth/email/verify/confirm/', payload)
  return data
}

export async function resendEmailVerification(lang?: Lang): Promise<{ detail: string }> {
  const { data } = await apiClient.post<{ detail: string }>('/auth/email/verify/resend/', { lang })
  return data
}

export async function deleteAccount(payload: DeleteAccountPayload): Promise<void> {
  await apiClient.post('/auth/me/delete/', payload)
}

// Two-factor authentication. Setup returns a secret for the authenticator app that only takes effect
// once enable() has confirmed a code from it.
export async function setupTwoFactor(password: string): Promise<{ secret: string; otpauth_uri: string }> {
  const { data } = await apiClient.post<{ secret: string; otpauth_uri: string }>('/auth/2fa/setup/', { password })
  return data
}

// Turning it on ends every other session; this one continues on the fresh pair returned with the
// one-time recovery codes.
export async function enableTwoFactor(code: string): Promise<string[]> {
  const { data } = await apiClient.post<{ recovery_codes: string[]; access: string; refresh: string }>(
    '/auth/2fa/enable/',
    { code },
  )
  if (data.access && data.refresh) {
    setAccessToken(data.access)
    setStoredRefreshToken(data.refresh)
  }
  return data.recovery_codes
}

export async function disableTwoFactor(password: string, code: string): Promise<void> {
  await apiClient.post('/auth/2fa/disable/', { password, code })
}
