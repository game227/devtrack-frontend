import { useEffect, useState } from 'react'

// Has the page been scrolled past `offset` pixels? For headers that settle into a firmer look.
export function useScrolled(offset = 8) {
  const [scrolled, setScrolled] = useState(() => typeof window !== 'undefined' && window.scrollY > offset)
  useEffect(() => {
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setScrolled(window.scrollY > offset))
    }
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update)
    }
  }, [offset])
  return scrolled
}
