import { apiClient } from './client'
import type { TelegramConnectionStatus } from '../types/telegram'

export async function getTelegramDeepLink(): Promise<{ deep_link: string }> {
  const { data } = await apiClient.get('/telegram/connect/')
  return data
}

export async function getTelegramConnectionStatus(): Promise<TelegramConnectionStatus> {
  const { data } = await apiClient.get('/telegram/status/')
  return data
}

export async function disconnectTelegram(): Promise<void> {
  await apiClient.delete('/telegram/disconnect/')
}
