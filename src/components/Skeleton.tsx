export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-bg-elevated ${className}`} />
}

// A stack of row-shaped placeholders — what list pages show while their data loads, so the
// layout doesn't jump when the real rows arrive.
export function SkeletonList({ count = 3, className = 'h-14' }: { count?: number; className?: string }) {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={className} />
      ))}
    </div>
  )
}

// Title bar + list, for pages that load as a whole.
export function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-busy="true">
      <Skeleton className="mb-5 h-7 w-48" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    </div>
  )
}
