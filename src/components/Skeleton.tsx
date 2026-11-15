export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-well ${className}`} />
}

// A stack of row-shaped placeholders — what list pages show while their data loads, so the
// layout doesn't jump when the real rows arrive.
export function SkeletonList({ count = 3, className = 'h-12' }: { count?: number; className?: string }) {
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
      <Skeleton className="mb-2 h-8 w-56" />
      <Skeleton className="mb-6 h-4 w-80 max-w-full" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    </div>
  )
}
