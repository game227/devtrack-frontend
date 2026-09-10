import axios, { isAxiosError } from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import {
  getAccessToken,
  getStoredRefreshToken,
  notifyAuthExpired,
  setAccessToken,
  setStoredRefreshToken,
} from '../features/auth/tokenStore'

interface RetryableConfig extends InternalAxiosRequestConfig {
  __isRetry?: boolean
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

// Separate instance for the refresh call itself so it never goes through
// apiClient's own 401 interceptor below — that would recurse.
const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

const NO_REFRESH_PATHS = ['/auth/login/', '/auth/register/', '/auth/token/refresh/']

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<string | null> | null = null

async function performRefresh(): Promise<string | null> {
  const refresh = getStoredRefreshToken()
  if (!refresh) return null
  try {
    const { data } = await refreshClient.post<{ access: string; refresh: string }>(
      '/auth/token/refresh/',
      { refresh },
    )
    setAccessToken(data.access)
    setStoredRefreshToken(data.refresh)
    return data.access
  } catch {
    setAccessToken(null)
    setStoredRefreshToken(null)
    notifyAuthExpired()
    return null
  }
}

// Dedupes concurrent callers behind one in-flight request — important because
// the backend rotates the refresh token, so two parallel refreshes would race
// and one would fail against an already-spent token.
export function refreshAccessToken(): Promise<string | null> {
  refreshPromise ??= performRefresh().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!isAxiosError(error) || error.response?.status !== 401 || !error.config) {
      throw error
    }
    const config = error.config as RetryableConfig
    const url = config.url ?? ''
    if (config.__isRetry || NO_REFRESH_PATHS.some((path) => url.includes(path))) {
      throw error
    }

    const newAccessToken = await refreshAccessToken()
    if (!newAccessToken) {
      throw error
    }

    config.__isRetry = true
    config.headers.Authorization = `Bearer ${newAccessToken}`
    return apiClient(config)
  },
)
