import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { confirmPasswordReset } from '../api/auth'
import { AuthShell, primaryButtonClass } from '../components/AuthShell'
import { FormField, formInputClass } from '../components/FormField'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'
import { useI18n } from '../i18n'

export function ResetPasswordPage() {
  const { t, lang } = useI18n()
  const { uid = '', token = '' } = useParams<{ uid: string; token: string }>()
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDone, setIsDone] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrors({})

    if (password !== passwordConfirm) {
      setErrors({ new_password_confirm: [t('error.passwordMismatch')] })
      return
    }

    setIsSubmitting(true)
    try {
      await confirmPasswordReset({
        uid,
        token,
        new_password: password,
        new_password_confirm: passwordConfirm,
      })
      setIsDone(true)
    } catch (error) {
      const fieldErrors = extractFieldErrors(error, lang)
      // The uid/token pair is not a form field; surface its errors at form level.
      const linkErrors = [...(fieldErrors.uid ?? []), ...(fieldErrors.token ?? [])]
      setErrors({
        ...fieldErrors,
        non_field_errors: [...(fieldErrors.non_field_errors ?? []), ...linkErrors],
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell title={t('auth.resetTitle')}>
      {isDone ? (
        <div>
          <p role="status" className="mb-4 text-sm text-success">
            {t('auth.resetDone')}
          </p>
          <Link to="/login" className="text-sm text-accent hover:underline">
            {t('auth.goToSignIn')}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {errors.non_field_errors && errors.non_field_errors.length > 0 && (
            <p role="alert" className="mb-4 text-sm text-danger">
              {errors.non_field_errors.join(' ')}
            </p>
          )}

          <div className="mb-3">
            <FormField label={t('auth.newPassword')} errors={errors.new_password}>
              <input
                type="password"
                className={formInputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </FormField>
          </div>

          <div className="mb-4">
            <FormField label={t('auth.confirmNewPassword')} errors={errors.new_password_confirm}>
              <input
                type="password"
                className={formInputClass}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </FormField>
          </div>

          <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
            {isSubmitting ? t('auth.resetting') : t('auth.resetPassword')}
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
