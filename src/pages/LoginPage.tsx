import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FormField, formInputClass } from '../components/FormField'
import { useAuth } from '../features/auth/AuthContext'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'

export function LoginPage() {
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
        <h1 className="mb-6 text-lg font-semibold">Sign in to DevTrack</h1>

        {errors.non_field_errors && (
          <p className="mb-4 text-sm text-red-400">{errors.non_field_errors.join(' ')}</p>
        )}

        <div className="mb-3">
          <FormField label="Username" errors={errors.username}>
            <input
              className={formInputClass}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </FormField>
        </div>

        <div className="mb-4">
          <FormField label="Password" errors={errors.password}>
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded border border-border px-3 py-2 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="mt-4 text-center text-sm text-fg-muted">
          No account?{' '}
          <Link to="/register" className="text-accent hover:underline">
            Register
          </Link>
        </p>
      </form>
    </div>
  )
}
