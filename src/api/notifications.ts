import { apiClient } from './client'
import type { PaginatedResponse } from '../types/api'
import type { AppNotification } from '../types/notification'

export async function listNotifications(): Promise<AppNotification[]> {
  const { data } = await apiClient.get<PaginatedResponse<AppNotification>>('/notifications/')
  return data.results
}

export async function markNotificationRead(id: number): Promise<AppNotification> {
  const { data } = await apiClient.patch<AppNotification>(`/notifications/${id}/read/`)
  return data
}

export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  const { data } = await apiClient.post<{ updated: number }>('/notifications/mark-all-read/')
  return data
}
