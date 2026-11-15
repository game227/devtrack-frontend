import type { ReactNode } from 'react'
import { CountUp } from './CountUp'
interface StatCardProps {
  label: string
  value: number | string
  // Colours the number (only while it is non-zero) when the figure signals a problem.
  tone?: 'danger' | 'warning'
}

const TONE_CLASS = { danger: 'text-danger', warning: 'text-warning' } as const

// A figure with its label underneath. Used in a row of figures separated by hairlines (StatRow), not
// as a grid of separate cards.
export function StatCard({ label, value, tone }: StatCardProps) {
  const toneClass = tone && Number(value) > 0 ? TONE_CLASS[tone] : 'text-fg'
  return (
    <div className="min-w-0 bg-surface px-4 py-3">
      <div className={`text-2xl font-extrabold tabular ${toneClass}`}>{typeof value === 'number' ? <CountUp value={value} /> : value}</div>
      <div className="mt-0.5 text-xs text-fg-muted">{label}</div>
    </div>
  )
}

// Hairlines between the figures come from the 1px gap showing the border colour behind them.
export function StatRow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:auto-cols-fr sm:grid-flow-col sm:grid-cols-none ${className}`}
    >
      {children}
    </div>
  )
}
