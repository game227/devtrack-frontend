import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './authContext'

export function RedirectIfAuthenticated() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
