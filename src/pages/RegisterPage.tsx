import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FormField, formInputClass } from '../components/FormField'
import { useAuth } from '../features/auth/AuthContext'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'

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
      setErrors({ password_confirm: ["Passwords don't match."] })
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
      setErrors(extractFieldErrors(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg text-fg">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded border border-border bg-bg-elevated p-6"
      >
        <h1 className="mb-6 text-lg font-semibold">Create your DevTrack account</h1>

        {errors.non_field_errors && (
          <p className="mb-4 text-sm text-red-400">{errors.non_field_errors.join(' ')}</p>
        )}

        <div className="mb-3">
          <FormField label="Username" errors={errors.username}>
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
          <FormField label="Email" errors={errors.email}>
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
          <FormField label="First name" errors={errors.first_name}>
            <input
              className={formInputClass}
              value={form.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              autoComplete="given-name"
            />
          </FormField>
          <FormField label="Last name" errors={errors.last_name}>
            <input
              className={formInputClass}
              value={form.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              autoComplete="family-name"
            />
          </FormField>
        </div>

        <div className="mb-3">
          <FormField label="Password" errors={errors.password}>
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
          <FormField label="Confirm password" errors={errors.password_confirm}>
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>

        <p className="mt-4 text-center text-sm text-fg-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}
