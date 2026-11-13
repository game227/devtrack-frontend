import { cloneElement, isValidElement, useId } from 'react'
import type { ReactElement, ReactNode } from 'react'

interface FormFieldProps {
  label: string
  errors?: string[]
  children: ReactNode
}

export function FormField({ label, errors, children }: FormFieldProps) {
  const errorId = useId()
  const hasErrors = Boolean(errors && errors.length > 0)

  // Tie the control to its error message so assistive technology reads it with the field and knows the
  // value is invalid. (Only when the child is a single element, which is how every form here uses it.)
  const control =
    hasErrors && isValidElement(children)
      ? cloneElement(children as ReactElement<Record<string, unknown>>, {
          'aria-invalid': true,
          'aria-describedby': errorId,
        })
      : children

  return (
    <div className="text-sm">
      <label className="block">
        {label}
        {control}
      </label>
      {/* Outside the <label>, so the error does not become part of the field's accessible name; a
          role="alert" so it is announced the moment a failed submit renders it. */}
      {hasErrors && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-danger">
          {errors!.join(' ')}
        </p>
      )}
    </div>
  )
}

export const formInputClass =
  'mt-1 w-full rounded-md border border-border-strong bg-bg px-3 py-1.5 text-sm text-fg outline-none focus:border-fg'
