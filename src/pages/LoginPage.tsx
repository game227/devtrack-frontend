import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell, primaryButtonClass } from '../components/AuthShell'
import { FormField, formInputClass } from '../components/FormField'
import { useAuth } from '../features/auth/authContext'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'
import { useI18n } from '../i18n'
import { Spinner } from '../components/Spinner'

export function LoginPage() {
  const { t, lang } = useI18n()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  // Shown once the server says this account needs an authenticator code.
  const [needsCode, setNeedsCode] = useState(false)
  const [otp, setOtp] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrors({})
    setIsSubmitting(true)
    try {
      await login(needsCode ? { username, password, otp } : { username, password })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      const fieldErrors = extractFieldErrors(error, lang)
      if (fieldErrors.otp) {
        // First time: just ask for the code; after that, say it was wrong.
        if (needsCode) setErrors(fieldErrors)
        setNeedsCode(true)
      } else {
        setErrors(fieldErrors)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell title={t('auth.signInTitle')}>
      <form onSubmit={handleSubmit}>
        {errors.non_field_errors && (
          <p role="alert" className="mb-5 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {errors.non_field_errors.join(' ')}
          </p>
        )}

        <div className="mb-4">
          <FormField label={t('auth.username')} errors={errors.username}>
            <input
              className={formInputClass}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </FormField>
        </div>

        <div className="mb-2">
          <FormField label={t('auth.password')} errors={errors.password}>
            <input
              type="password"
              className={formInputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </FormField>
        </div>

        {needsCode && (
          <div className="mb-4">
            <FormField label={t('auth.otp')} errors={errors.otp}>
              <input
                className={formInputClass}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                autoComplete="one-time-code"
                inputMode="text"
                autoFocus
                required
              />
            </FormField>
            <p className="mt-1 text-xs text-fg-muted">{t('auth.otpHint')}</p>
          </div>
        )}

        <div className="mb-5 text-right text-sm">
          <Link to="/forgot-password" className="font-semibold text-accent hover:underline">
            {t('auth.forgotPassword')}
          </Link>
        </div>

        <button aria-busy={isSubmitting} type="submit" disabled={isSubmitting} className={primaryButtonClass}>
          {isSubmitting && <Spinner />}
{t('auth.signIn')}
        </button>

        <p className="mt-6 text-center text-sm text-fg-muted">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-semibold text-accent hover:underline">
            {t('auth.register')}
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
