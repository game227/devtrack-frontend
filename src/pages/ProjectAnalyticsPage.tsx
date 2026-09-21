import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listCycles } from '../api/cycles'
import { listIssues } from '../api/issues'
import { BarList } from '../components/BarList'
import { ProgressBar } from '../components/ProgressBar'
import { ProjectHealthCard } from '../components/ProjectHealthCard'
import { StatCard } from '../components/StatCard'
import { STATUS_COLOR } from '../lib/statusColors'
import { useT } from '../i18n'
import { ISSUE_STATUSES } from '../types/issue'
import type { Issue, IssueType } from '../types/issue'
import type { Priority } from '../types/project'

const PRIORITIES: Priority[] = ['urgent', 'high', 'medium', 'low', 'none']
const TYPES: IssueType[] = ['task', 'bug', 'feature', 'improvement', 'chore']

function localToday(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded border border-border bg-bg-elevated p-4">
      <h2 className="mb-3 text-sm font-semibold text-fg">{title}</h2>
      {children}
    </section>
  )
}

export function ProjectAnalyticsPage() {
  const t = useT()
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)

  const issuesQuery = useQuery({
    queryKey: ['issues', projectId, 'analytics'],
    queryFn: () => listIssues({ project: projectId }),
    enabled: Number.isFinite(projectId),
  })
  const cyclesQuery = useQuery({
    queryKey: ['cycles', projectId],
    queryFn: () => listCycles(projectId),
    enabled: Number.isFinite(projectId),
  })

  if (issuesQuery.isLoading) {
    return <p className="text-sm text-fg-muted">{t('analytics.loading')}</p>
  }
  if (issuesQuery.isError || !issuesQuery.data) {
    return <p className="text-sm text-danger">{t('analytics.loadFailed')}</p>
  }

  const issues: Issue[] = issuesQuery.data
  const open = issues.filter((issue) => issue.status !== 'done')
  const today = localToday()
  const overdue = open.filter((issue) => issue.due_date !== null && issue.due_date < today).length
  const completion = issues.length > 0 ? Math.round(((issues.length - open.length) / issues.length) * 100) : 0

  const workload = new Map<string, number>()
  for (const issue of open) {
    const owner = issue.assignee?.username ?? t('common.unassigned')
    workload.set(owner, (workload.get(owner) ?? 0) + 1)
  }
  const workloadRows = [...workload.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([owner, value]) => ({ key: owner, label: owner, value }))

  const cycles = [...(cyclesQuery.data ?? [])].sort((a, b) => a.start_date.localeCompare(b.start_date))

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-fg">{t('analytics.title')}</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t('analytics.totalIssues')} value={issues.length} />
        <StatCard label={t('analytics.completed')} value={`${completion}%`} />
        <StatCard label={t('analytics.open')} value={open.length} />
        <StatCard label={t('analytics.overdue')} value={overdue} />
      </div>

      <ProjectHealthCard projectId={projectId} />

      {issues.length === 0 ? (
        <p className="text-sm text-fg-muted">{t('analytics.noIssues')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title={t('analytics.byStatus')}>
            <BarList
              total={issues.length}
              rows={ISSUE_STATUSES.map((status) => ({
                key: status,
                label: t(`status.${status}`),
                value: issues.filter((issue) => issue.status === status).length,
                color: STATUS_COLOR[status],
              }))}
            />
          </Panel>
          <Panel title={t('analytics.byPriority')}>
            <BarList
              total={open.length}
              rows={PRIORITIES.map((priority) => ({
                key: priority,
                label: t(`priority.${priority}`),
                value: open.filter((issue) => issue.priority === priority).length,
              }))}
            />
          </Panel>
          <Panel title={t('analytics.byType')}>
            <BarList
              total={issues.length}
              rows={TYPES.map((type) => ({
                key: type,
                label: t(`issueType.${type}`),
                value: issues.filter((issue) => issue.type === type).length,
              }))}
            />
          </Panel>
          <Panel title={t('analytics.workload')}>
            {workloadRows.length > 0 ? (
              <BarList rows={workloadRows} total={open.length} />
            ) : (
              <p className="text-sm text-fg-muted">{t('common.noData')}</p>
            )}
          </Panel>
        </div>
      )}

      <Panel title={t('analytics.velocity')}>
        {cycles.length === 0 ? (
          <p className="text-sm text-fg-muted">{t('analytics.noCycles')}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {cycles.map((cycle) => (
              <li key={cycle.id}>
                <div className="mb-1 flex items-center justify-between text-xs text-fg-muted">
                  <span className="text-fg">{cycle.name}</span>
                  <span className="font-mono tabular-nums">
                    {cycle.completed_count}/{cycle.issue_count} · {Math.round(cycle.completion_percent)}%
                  </span>
                </div>
                <ProgressBar percent={cycle.completion_percent} label={cycle.name} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
