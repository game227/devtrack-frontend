import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  errors?: string[]
  children: ReactNode
}

export function FormField({ label, errors, children }: FormFieldProps) {
  return (
    <label className="block text-sm">
      {label}
      {children}
      {errors && errors.length > 0 && (
        <p className="mt-1 text-xs text-red-400">{errors.join(' ')}</p>
      )}
    </label>
  )
}

export const formInputClass =
  'mt-1 w-full rounded border border-border bg-bg px-3 py-1.5 text-sm text-fg outline-none focus:border-accent'
