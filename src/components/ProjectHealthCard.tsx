import { useQuery } from '@tanstack/react-query'
import { getProjectHealth } from '../api/health'
import { HealthStatusBadge } from './Badge'
import type { ProjectHealthFactors } from '../types/health'

const FACTOR_LABELS: Record<keyof ProjectHealthFactors, string> = {
  task_progress: 'Task progress',
  development_activity: 'Development activity',
  deadline: 'Deadline',
  bug_rate: 'Bug rate',
}

export function ProjectHealthCard({ projectId }: { projectId: number }) {
  const healthQuery = useQuery({
    queryKey: ['project-health', projectId],
    queryFn: () => getProjectHealth(projectId),
    enabled: Number.isFinite(projectId),
  })

  if (healthQuery.isLoading) {
    return <p className="text-sm text-fg-muted">Loading health…</p>
  }
  if (healthQuery.isError || !healthQuery.data) {
    return null
  }

  const health = healthQuery.data

  return (
    <div className="rounded border border-border bg-bg-elevated p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-fg">Project health</h2>
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-fg">{health.score}</span>
          <HealthStatusBadge status={health.status} />
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-2">
        {(Object.keys(FACTOR_LABELS) as (keyof ProjectHealthFactors)[]).map((key) => (
          <div key={key}>
            <div className="mb-1 flex items-center justify-between text-xs text-fg-muted">
              <span>{FACTOR_LABELS[key]}</span>
              <span>{health.factors[key]}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-accent" style={{ width: `${health.factors[key]}%` }} />
            </div>
          </div>
        ))}
      </div>

      {health.risks.length > 0 && (
        <div>
          <div className="mb-1 text-xs font-semibold uppercase text-fg-muted">Risks</div>
          <ul className="flex flex-col gap-1">
            {health.risks.map((risk, index) => (
              <li key={index} className="text-sm text-amber-300">
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
