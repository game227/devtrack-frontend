// No animation for people who prefer reduced motion, nor in tests (which assert final values).
export function motionOff(): boolean {
  if (import.meta.env.MODE === 'test' || typeof requestAnimationFrame !== 'function') return true
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
