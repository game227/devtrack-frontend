import { AppErrorBoundary } from '../components/AppErrorBoundary'
import { AppRoutes } from './router'

export function App() {
  return (
    <AppErrorBoundary>
      <AppRoutes />
    </AppErrorBoundary>
  )
}
