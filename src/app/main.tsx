import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../features/auth/AuthContext'
import { WorkspaceProvider } from '../features/workspace/WorkspaceContext'
import { I18nProvider } from '../i18n'
import { App } from './App'
import { ToastProvider } from '../features/toast/ToastViewport'
import { initTheme } from '../lib/theme'
import { initSentry } from '../lib/sentry'
import { registerServiceWorker } from '../lib/push'
// Self-hosted (no third-party font requests): Geist for everything, Geist Mono for code-like text
// (issue keys, commit SHAs, branches, shortcuts).
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../styles/index.css'

initSentry()
initTheme()
registerServiceWorker()

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <WorkspaceProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </WorkspaceProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </I18nProvider>
  </StrictMode>,
)
