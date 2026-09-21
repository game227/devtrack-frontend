import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useT } from '../i18n'

interface ConfirmButtonProps {
  onConfirm: () => void
  children: ReactNode
  className?: string
  disabled?: boolean
}

// Two-step destructive action: the first click arms it ("Are you sure?"), a second
// click within three seconds confirms. No native dialog, so it also works in tests and kiosks.
export function ConfirmButton({ onConfirm, children, className = '', disabled }: ConfirmButtonProps) {
  const t = useT()
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return
    const timer = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(timer)
  }, [armed])

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (armed) {
          setArmed(false)
          onConfirm()
        } else {
          setArmed(true)
        }
      }}
      className={`${className} ${armed ? 'text-danger' : ''}`}
    >
      {armed ? t('confirm.ask') : children}
    </button>
  )
}
