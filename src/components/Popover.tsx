import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'

// A disclosure: a button that shows a floating panel (the user menu, the workspace switcher). It closes
// on Escape (handing focus back to the button), on a click outside, and when one of its links or
// buttons is used. Not an ARIA menu: the panel holds ordinary links and buttons, reached with Tab.
export function Popover({
  label,
  trigger,
  triggerClassName,
  align = 'right',
  panelClassName = 'w-72',
  children,
}: {
  label: string
  trigger: ReactNode
  triggerClassName: string
  align?: 'left' | 'right'
  panelClassName?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  const close = useCallback((returnFocus = false) => {
    setOpen(false)
    if (returnFocus) buttonRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return undefined
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        close(true)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, close])

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open && (
        <div
          id={panelId}
          className={`absolute top-full z-40 mt-2 max-w-[calc(100vw-2rem)] origin-top animate-scale-in rounded-xl border border-border bg-surface shadow-float ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${panelClassName}`}
          onClick={(event) => {
            // Following a link or pressing a button inside is the end of the job.
            const target = event.target as HTMLElement
            if (target.closest('a') || target.closest('button[data-closes]')) setOpen(false)
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}
