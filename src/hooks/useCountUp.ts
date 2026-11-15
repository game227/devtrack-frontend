import { useEffect, useRef, useState } from 'react'
import { motionOff } from '../lib/motion'

// A number that counts from where it was to its new value (from 0 the first time). Without motion it is
// simply the value.
export function useCountUp(target: number, duration = 700): number {
  const [value, setValue] = useState(0)
  const from = useRef(0)

  useEffect(() => {
    if (motionOff()) return undefined
    const start = performance.now()
    const begin = from.current
    let frame = 0
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setValue(Math.round(begin + (target - begin) * (1 - Math.pow(1 - t, 3))))
      if (t < 1) frame = requestAnimationFrame(step)
      else from.current = target
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return motionOff() ? target : value
}

// False on the first paint, true right after: lets a bar start empty and transition to its value.
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    if (motionOff()) return undefined
    const frame = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])
  return mounted || motionOff()
}
