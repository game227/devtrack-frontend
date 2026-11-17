import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useI18n } from '../i18n'
import { currentSubscription, getPushStatus, pushSupported, subscribePush, unsubscribePush } from '../lib/push'
import { button, panel, sectionTitle } from './ui'

// Settings: notifications on this device even when DevTrack is closed (Web Push).
export function PushCard() {
  const { t, lang } = useI18n()
  const status = useQuery({ queryKey: ['push-status'], queryFn: getPushStatus })
  const [on, setOn] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void currentSubscription().then((subscription) => {
      if (!cancelled) setOn(subscription !== null)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!status.data?.enabled) return null

  async function toggle() {
    setBusy(true)
    setMessage(null)
    try {
      if (on) {
        await unsubscribePush()
        setOn(false)
      } else if ((await subscribePush(status.data!.public_key, lang)) === 'granted') {
        setOn(true)
      } else {
        setMessage(t('push.denied'))
      }
    } catch {
      setMessage(t('push.failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-labelledby="push-title" className={`${panel} p-5`}>
      <h2 id="push-title" className={sectionTitle}>
        {t('push.title')}
      </h2>
      <p className="mt-1 text-sm text-fg-muted">{pushSupported() ? t(on ? 'push.on' : 'push.off') : t('push.unsupported')}</p>
      {pushSupported() && on !== null && (
        <button type="button" onClick={() => void toggle()} disabled={busy} aria-pressed={on} className={`mt-4 ${button(on ? 'secondary' : 'primary')}`}>
          {t(on ? 'push.disable' : 'push.enable')}
        </button>
      )}
      {message && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {message}
        </p>
      )}
    </section>
  )
}
