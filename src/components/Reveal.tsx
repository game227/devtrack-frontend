import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  /** Stagger delay in ms — pass `index * 80` for a grid/list. */
  delay?: number
  className?: string
}

// Fades an element up into view the first time it scrolls into the viewport (marketing pages
// only — the app shell already gets a page-level fade on route change, see Layout.tsx). Plays
// once: the observer disconnects after the first intersection, so scrolling back up and down
// doesn't replay it. `prefers-reduced-motion` is handled globally in index.css (durations
// collapse to ~0), so no extra check is needed here. Always renders a plain `div` — wrap the
// element you need semantically (e.g. put this inside an `<li>`) rather than around it.
export function Reveal({ children, delay = 0, className = '' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  // No IntersectionObserver (old browser, or a test environment) — start visible rather than
  // hidden-forever; the effect below then has nothing to do in that environment.
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
