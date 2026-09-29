import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { confirmEmailVerification } from '../api/auth'
import { AuthShell } from '../components/AuthShell'
import { useI18n } from '../i18n'

type Status = 'verifying' | 'done' | 'error'

export function VerifyEmailPage() {
  const { t } = useI18n()
  const { uid = '', token = '' } = useParams<{ uid: string; token: string }>()
  const [status, setStatus] = useState<Status>('verifying')
  const attempted = useRef(false)

  useEffect(() => {
    if (attempted.current) return
    attempted.current = true
    confirmEmailVerification({ uid, token })
      .then(() => setStatus('done'))
      .catch(() => setStatus('error'))
  }, [uid, token])

  return (
    <AuthShell title={t('auth.verifyEmailTitle')}>
      {status === 'verifying' && <p className="text-sm text-fg-muted">{t('auth.verifyingEmail')}</p>}
      {status === 'done' && (
        <p role="status" className="text-sm text-success">
          {t('auth.verifyEmailSuccess')}
        </p>
      )}
      {status === 'error' && (
        <p role="alert" className="text-sm text-danger">
          {t('auth.verifyEmailError')}
        </p>
      )}
      <Link to="/dashboard" className="mt-4 inline-block text-sm text-accent hover:underline">
        {t('auth.goToDashboard')}
      </Link>
    </AuthShell>
  )
}
