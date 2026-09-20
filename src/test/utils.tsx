import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContext } from '../features/auth/authContext'
import type { AuthContextValue } from '../features/auth/authContext'
import { I18nProvider } from '../i18n'
import { STORAGE_KEY } from '../i18n/core'
import type { Lang } from '../i18n'

interface Options {
  route?: string
  lang?: Lang
  auth?: Partial<AuthContextValue>
}

export function makeAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: async () => {},
    register: async () => {},
    logout: async () => {},
    refreshUser: async () => {},
    ...overrides,
  }
}

export function renderWithProviders(ui: ReactElement, { route = '/', lang = 'uz', auth }: Options = {}) {
  localStorage.setItem(STORAGE_KEY, lang)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={makeAuth(auth)}>
          <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    </I18nProvider>,
  )
}
