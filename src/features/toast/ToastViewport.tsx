import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { useT } from '../../i18n'
import { ToastContext } from './toastContext'
import type { Toast } from './toastContext'

const LIFETIME_MS = 5000
const MAX = 3

const DOT: Record<NonNullable<Toast['tone']>, string> = {
  success: 'bg-st-done',
  info: 'bg-brand',
  error: 'bg-danger',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const t = useT()
  const [toasts, setToasts] = useState<Array<Toast & { id: number }>>([])
  const nextId = useRef(1)
  const timers = useRef(new Map<number, number>())

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((toast) => toast.id !== id))
    window.clearTimeout(timers.current.get(id))
    timers.current.delete(id)
  }, [])

  const show = useCallback(
    (toast: Toast) => {
      const id = nextId.current++
      setToasts((list) => [...list, { ...toast, id }].slice(-MAX))
      timers.current.set(id, window.setTimeout(() => dismiss(id), LIFETIME_MS))
    },
    [dismiss],
  )

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((timer) => window.clearTimeout(timer))
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      {/* Polite: announced after whatever the screen reader is saying, never interrupting it. */}
      <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex animate-toast-in items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-fg shadow-float"
          >
            <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[toast.tone ?? 'success']}`} />
            <span className="min-w-0 flex-1">{toast.text}</span>
            {toast.action?.to && (
              <Link to={toast.action.to} onClick={() => dismiss(toast.id)} className="shrink-0 font-bold text-accent hover:underline">
                {toast.action.label}
              </Link>
            )}
            {toast.action?.onClick && !toast.action.to && (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick?.()
                  dismiss(toast.id)
                }}
                className="shrink-0 font-bold text-accent hover:underline"
              >
                {toast.action.label}
              </button>
            )}
            <button
              type="button"
              aria-label={t('common.close')}
              onClick={() => dismiss(toast.id)}
              className="-mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-fg-muted hover:bg-well hover:text-fg"
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
