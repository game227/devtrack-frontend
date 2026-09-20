import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell, primaryButtonClass } from '../components/AuthShell'
import { FormField, formInputClass } from '../components/FormField'
import { useAuth } from '../features/auth/authContext'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'
import { useI18n } from '../i18n'

export function LoginPage() {
  const { t, lang } = useI18n()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrors({})
    setIsSubmitting(true)
    try {
      await login({ username, password })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setErrors(extractFieldErrors(error, lang))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell title={t('auth.signInTitle')}>
      <form onSubmit={handleSubmit}>
        {errors.non_field_errors && (
          <p role="alert" className="mb-4 text-sm text-danger">
            {errors.non_field_errors.join(' ')}
          </p>
        )}

        <div className="mb-3">
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

        <div className="mb-4 text-right text-xs">
          <Link to="/forgot-password" className="text-accent hover:underline">
            {t('auth.forgotPassword')}
          </Link>
        </div>

        <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
          {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
        </button>

        <p className="mt-4 text-center text-sm text-fg-muted">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-accent hover:underline">
            {t('auth.register')}
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
