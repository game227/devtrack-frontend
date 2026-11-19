import { useEffect, useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { useT } from '../i18n'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// A modal dialog: keeps Tab inside, closes on Escape or a click on the scrim, and gives focus back to
// whatever had it when it opened.
export function Dialog({
  title,
  onClose,
  children,
  width = 'max-w-lg',
  placement = 'center',
}: {
  title: string
  onClose: () => void
  children: ReactNode
  width?: string
  // 'sheet' rises from the bottom edge (phones), in thumb reach.
  placement?: 'center' | 'sheet'
}) {
  const t = useT()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    return () => previous?.focus?.()
  }, [])

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab' || !panelRef.current) return
    const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center ${
        placement === 'sheet' ? 'items-end px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-[12vh]' : 'items-start overflow-y-auto px-4 py-[10vh]'
      }`}
    >
      <button type="button" aria-label={t('common.close')} tabIndex={-1} onClick={onClose} className="fixed inset-0 bg-scrim" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={onKeyDown}
        className={`relative w-full ${width} glass-menu shadow-float ${
          placement === 'sheet' ? 'scroll-quiet max-h-full animate-sheet-up overflow-y-auto rounded-2xl' : 'animate-scale-in rounded-xl'
        }`}
      >
        {children}
      </div>
    </div>
  )
}
