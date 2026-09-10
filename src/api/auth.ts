import { apiClient } from './client'
import type {
  AuthResponse,
  ChangePasswordPayload,
  ConfirmPasswordResetPayload,
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

export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<{ detail: string }> {
  const { data } = await apiClient.post<{ detail: string }>('/auth/password/change/', payload)
  return data
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

export { refreshAccessToken as refreshToken } from './client'
