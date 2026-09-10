let accessToken: string | null = null
let authExpiredHandler: (() => void) | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

// Lets the axios layer (which isn't a React component) tell AuthContext
// that a silent refresh failed, without a circular import between the two.
export function registerAuthExpiredHandler(handler: (() => void) | null): void {
  authExpiredHandler = handler
}

export function notifyAuthExpired(): void {
  authExpiredHandler?.()
}

const REFRESH_TOKEN_KEY = 'devtrack_refresh_token'

export function getStoredRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setStoredRefreshToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token)
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    }
  } catch {
    // localStorage unavailable (private mode, etc.) — session won't persist across reloads
  }
}
