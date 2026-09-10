import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import * as authApi from '../../api/auth'
import { refreshAccessToken } from '../../api/client'
import {
  getStoredRefreshToken,
  registerAuthExpiredHandler,
  setAccessToken,
  setStoredRefreshToken,
} from './tokenStore'
import type { LoginPayload, RegisterPayload, User } from '../../types/auth'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const handleAuthExpired = () => setUser(null)
    registerAuthExpiredHandler(handleAuthExpired)
    return () => registerAuthExpiredHandler(null)
  }, [])

  // Restore the session on load from the persisted refresh token, if any.
  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      const token = await refreshAccessToken()
      if (!token) {
        if (!cancelled) setIsLoading(false)
        return
      }
      try {
        const me = await authApi.getMe()
        if (!cancelled) setUser(me)
      } catch {
        setAccessToken(null)
        setStoredRefreshToken(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void restoreSession()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authApi.login(payload)
    setAccessToken(response.access)
    setStoredRefreshToken(response.refresh)
    setUser(response.user)
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await authApi.register(payload)
    setAccessToken(response.access)
    setStoredRefreshToken(response.refresh)
    setUser(response.user)
  }, [])

  const logout = useCallback(async () => {
    const refresh = getStoredRefreshToken()
    try {
      if (refresh) {
        await authApi.logout(refresh)
      }
    } catch {
      // best-effort server-side revoke — clear local state regardless
    } finally {
      setAccessToken(null)
      setStoredRefreshToken(null)
      setUser(null)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    const me = await authApi.getMe()
    setUser(me)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
