import { createContext, useContext } from 'react'

export interface Toast {
  text: string
  tone?: 'success' | 'info' | 'error'
  // An optional follow-up, e.g. "Open" the issue that was just created.
  action?: { label: string; to?: string; onClick?: () => void }
}

// Short confirmations of what just happened ("Issue #12 created"), shown bottom right for a few seconds.
export const ToastContext = createContext<(toast: Toast) => void>(() => {})

export function useToast() {
  return useContext(ToastContext)
}
