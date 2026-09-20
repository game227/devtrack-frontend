import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../api/auth'
import { AuthShell, primaryButtonClass } from '../components/AuthShell'
import { FormField, formInputClass } from '../components/FormField'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'
import { useI18n } from '../i18n'

export function ForgotPasswordPage() {
  const { t, lang } = useI18n()
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrors({})
    setIsSubmitting(true)
    try {
      await requestPasswordReset({ email })
      setIsSent(true)
    } catch (error) {
      setErrors(extractFieldErrors(error, lang))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell title={t('auth.forgotTitle')}>
      {isSent ? (
        <div>
          <p role="status" className="mb-4 text-sm text-success">
            {t('auth.linkSent')}
          </p>
          <Link to="/login" className="text-sm text-accent hover:underline">
            {t('auth.backToSignIn')}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <p className="mb-4 text-sm text-fg-muted">{t('auth.forgotHelp')}</p>

          {errors.non_field_errors && (
            <p role="alert" className="mb-4 text-sm text-danger">
              {errors.non_field_errors.join(' ')}
            </p>
          )}

          <div className="mb-4">
            <FormField label={t('auth.email')} errors={errors.email}>
              <input
                type="email"
                className={formInputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </FormField>
          </div>

          <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
            {isSubmitting ? t('auth.sending') : t('auth.sendLink')}
          </button>

          <p className="mt-4 text-center text-sm">
            <Link to="/login" className="text-accent hover:underline">
              {t('auth.backToSignIn')}
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  )
}
