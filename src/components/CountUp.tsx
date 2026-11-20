import { useCountUp } from '../hooks/useCountUp'

export function CountUp({ value, className }: { value: number; className?: string }) {
  return <span className={className}>{useCountUp(value)}</span>
}
