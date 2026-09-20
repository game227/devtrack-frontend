import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell, primaryButtonClass } from '../components/AuthShell'
import { FormField, formInputClass } from '../components/FormField'
import { useAuth } from '../features/auth/authContext'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'
import { useI18n } from '../i18n'

interface FormState {
  username: string
  email: string
  password: string
  passwordConfirm: string
  firstName: string
  lastName: string
}

const initialState: FormState = {
  username: '',
  email: '',
  password: '',
  passwordConfirm: '',
  firstName: '',
  lastName: '',
}

export function RegisterPage() {
  const { t, lang } = useI18n()
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(initialState)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrors({})

    if (form.password !== form.passwordConfirm) {
      setErrors({ password_confirm: [t('error.passwordMismatch')] })
      return
    }

    setIsSubmitting(true)
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        password_confirm: form.passwordConfirm,
        first_name: form.firstName || undefined,
        last_name: form.lastName || undefined,
      })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setErrors(extractFieldErrors(error, lang))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell title={t('auth.registerTitle')}>
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
              value={form.username}
              onChange={(e) => updateField('username', e.target.value)}
              autoComplete="username"
              required
            />
          </FormField>
        </div>

        <div className="mb-3">
          <FormField label={t('auth.email')} errors={errors.email}>
            <input
              type="email"
              className={formInputClass}
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              autoComplete="email"
              required
            />
          </FormField>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2">
          <FormField label={t('auth.firstName')} errors={errors.first_name}>
            <input
              className={formInputClass}
              value={form.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              autoComplete="given-name"
            />
          </FormField>
          <FormField label={t('auth.lastName')} errors={errors.last_name}>
            <input
              className={formInputClass}
              value={form.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              autoComplete="family-name"
            />
          </FormField>
        </div>

        <div className="mb-3">
          <FormField label={t('auth.password')} errors={errors.password}>
            <input
              type="password"
              className={formInputClass}
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              autoComplete="new-password"
              required
            />
          </FormField>
        </div>

        <div className="mb-4">
          <FormField label={t('auth.confirmPassword')} errors={errors.password_confirm}>
            <input
              type="password"
              className={formInputClass}
              value={form.passwordConfirm}
              onChange={(e) => updateField('passwordConfirm', e.target.value)}
              autoComplete="new-password"
              required
            />
          </FormField>
        </div>

        <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
          {isSubmitting ? t('auth.creatingAccount') : t('auth.createAccount')}
        </button>

        <p className="mt-4 text-center text-sm text-fg-muted">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="text-accent hover:underline">
            {t('auth.signIn')}
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
