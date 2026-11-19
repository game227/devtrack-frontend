import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

// The project's section tabs. On narrow screens they scroll sideways: the edge fades to show there is
// more, and the current tab is scrolled into view so it is never hidden off to the side.
export function ProjectTabs({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()
  useEffect(() => {
    const strip = ref.current
    const active = strip?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!strip || !active || strip.scrollWidth <= strip.clientWidth) return
    strip.scrollTo({ left: active.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2, behavior: 'auto' })
  }, [pathname])
  return (
    <div
      ref={ref}
      className="glass scroll-quiet flex max-w-full gap-0.5 overflow-x-auto rounded-xl p-1 max-lg:pr-8 max-lg:[mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)] lg:ml-auto"
    >
      {children}
    </div>
  )
}
