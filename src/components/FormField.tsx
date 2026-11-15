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
      <label className="block font-semibold text-fg">
        {label}
        {control}
      </label>
      {/* Outside the <label>, so the error does not become part of the field's accessible name; a
          role="alert" so it is announced the moment a failed submit renders it. */}
      {hasErrors && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-semibold text-danger">
          {errors!.join(' ')}
        </p>
      )}
    </div>
  )
}

// The label above is semibold; the control resets to regular weight. border-strong is the 3:1 control
// boundary (WCAG 1.4.11); focus adds the brand outline from styles/index.css.
export const formInputClass =
  'mt-1.5 block w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm font-normal text-fg placeholder:text-subtle transition-colors duration-150 hover:border-fg-muted focus:border-brand disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger'
