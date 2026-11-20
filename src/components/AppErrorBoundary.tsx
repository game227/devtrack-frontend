import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { useT } from '../i18n'
import { reportError } from '../lib/sentry'
import { Logo } from './Track'
import { button, pageTitle } from './ui'

function Fallback({ onRetry }: { onRetry: () => void }) {
  const t = useT()
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-fg">
      <div role="alert" className="glass w-full max-w-md rounded-[24px] p-8">
        <Logo />
        <h1 className={`mt-6 ${pageTitle}`}>{t('crash.title')}</h1>
        <p className="mt-2 text-[15px] text-fg-muted">{t('crash.text')}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" onClick={() => window.location.reload()} className={`${button('primary')} rounded-xl`}>
            {t('crash.reload')}
          </button>
          <button type="button" onClick={onRetry} className={`${button('secondary')} rounded-xl`}>
            {t('crash.retry')}
          </button>
        </div>
      </div>
    </div>
  )
}

// A page that throws while rendering shows this instead of a blank screen, and the error is reported
// (to Sentry, once it is configured).
export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error)
    if (import.meta.env.DEV) console.error(error, info.componentStack)
  }

  render() {
    if (this.state.failed) return <Fallback onRetry={() => this.setState({ failed: false })} />
    return this.props.children
  }
}
