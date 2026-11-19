import { useEffect, useRef, useState } from 'react'

// True once the element has come into view (and stays true). Without IntersectionObserver (old
// browsers, tests) everything counts as visible at once, so nothing can stay hidden.
export function useReveal<T extends Element>(margin = '0px 0px -12% 0px') {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    const element = ref.current
    if (!element || visible) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: margin, threshold: 0.08 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [margin, visible])
  return [ref, visible] as const
}
