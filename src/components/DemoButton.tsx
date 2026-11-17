import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { isDemoUser } from '../api/demo'
import { useAuth } from '../features/auth/authContext'
import { useT } from '../i18n'
import { Icon } from './Icon'
import { button } from './ui'

// "Try the demo": a throwaway account with a sample workspace, no sign-up. Rendered only when the
// build enables the demo (VITE_DEMO_ENABLED) — the API refuses otherwise.
export function DemoButton({ className = '' }: { className?: string }) {
  const t = useT()
  const { startDemo } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function start() {
    setBusy(true)
    setError(null)
    try {
      await startDemo()
      navigate('/dashboard')
    } catch (e) {
      const status = isAxiosError(e) ? e.response?.status : undefined
      setError(t(status === 429 || status === 503 ? 'demo.busy' : 'demo.failed'))
      setBusy(false)
    }
  }

  return (
    <span className="inline-flex flex-col gap-1.5">
      <button type="button" onClick={() => void start()} disabled={busy} aria-busy={busy} className={`${button('ghost', 'lg')} rounded-xl ${className}`}>
        <Icon name="board" />
        {busy ? t('demo.starting') : t('demo.try')}
      </button>
      {error && (
        <span role="alert" className="text-sm text-danger">
          {error}
        </span>
      )}
    </span>
  )
}

// Shown inside the app while a demo account is signed in.
export function DemoBanner() {
  const t = useT()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  if (!isDemoUser(user?.username)) return null
  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-orange/40 bg-orange/10 px-4 py-2.5 text-sm">
      <span className="h-2 w-2 shrink-0 rounded-full bg-orange" aria-hidden="true" />
      <span className="min-w-0 flex-1 text-fg">{t('demo.banner')}</span>
      <button
        type="button"
        onClick={async () => {
          await logout()
          navigate('/register')
        }}
        className={button('primary', 'sm')}
      >
        {t('demo.signUp')}
      </button>
    </div>
  )
}
