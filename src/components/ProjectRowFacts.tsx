import { useI18n } from '../i18n'
import { computeSchedule } from '../lib/schedule'
import type { Project } from '../types/project'

// The middle of a project row: how far the work is, and where it stands against its target date.
export function ProjectRowFacts({ project }: { project: Project }) {
  const { t } = useI18n()
  const total = project.issue_count ?? 0
  const done = project.done_count ?? 0
  const percent = total ? Math.round((done / total) * 100) : 0
  const closed = project.status === 'completed' || project.status === 'archived'
  const schedule = computeSchedule(project.start_date, project.target_date, closed)
  let when: { text: string; tone: string } | null = null
  if (project.target_date && !closed) {
    if (schedule.state === 'overdue') when = { text: t('projects.row.late', { days: schedule.days }), tone: 'text-danger' }
    else if (schedule.state === 'dueToday') when = { text: t('schedule.dueToday'), tone: 'text-warning' }
    else if (schedule.state === 'upcoming') when = { text: t('schedule.upcoming', { days: schedule.days }), tone: 'text-fg-muted' }
    else when = { text: t('projects.row.left', { days: schedule.days }), tone: 'text-fg-muted' }
  }
  return (
    <span className="hidden w-56 shrink-0 flex-col gap-1.5 md:flex">
      <span className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-fg-muted">{total ? t('projects.row.open', { count: total - done }) : t('projects.row.noIssues')}</span>
        {total > 0 && <span className="font-semibold text-fg tabular">{percent}%</span>}
      </span>
      <span className="h-[3px] w-full overflow-hidden rounded-full bg-border" aria-hidden="true">
        <span className="block h-full rounded-full bg-fg" style={{ width: `${percent}%` }} />
      </span>
      {when && <span className={`text-xs ${when.tone}`}>{when.text}</span>}
    </span>
  )
}
