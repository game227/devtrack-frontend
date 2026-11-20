import { useI18n } from '../i18n'
import { computeSchedule } from '../lib/schedule'

// One short line about time for a cycle or a milestone: "Day 11 of 14 · 3 days left", "Starts in 4 days",
// "Ended 2 days ago". Finished work (everything done) is said plainly instead of counting.
export function PlanTiming({ start, end, done, total }: { start: string | null; end: string; done: number; total: number }) {
  const { t } = useI18n()
  const schedule = computeSchedule(start, end, false)
  const complete = total > 0 && done === total
  let text: string
  let tone = 'text-fg-muted'
  if (complete) {
    text = t('plan.complete')
  } else {
    switch (schedule.state) {
      case 'running':
        text = start ? t('plan.running', { day: schedule.dayNumber, total: schedule.totalDays, left: schedule.days }) : t('plan.left', { days: schedule.days })
        break
      case 'targetOnly':
        text = t('plan.left', { days: schedule.days })
        break
      case 'dueToday':
        text = t('plan.dueToday')
        tone = 'text-warning'
        break
      case 'upcoming':
        text = t('plan.upcoming', { days: schedule.days })
        break
      case 'overdue':
        // With no issues nothing is late; only the date has passed.
        text = total === 0 ? t('plan.passed', { days: schedule.days }) : t('plan.overdue', { days: schedule.days, left: total - done })
        tone = total === 0 ? 'text-fg-muted' : 'text-danger'
        break
      default:
        return null
    }
  }
  return <p className={`text-xs font-medium ${tone}`}>{text}</p>
}

// The count of finished issues, or what to do when there are none yet.
export function PlanCount({ done, total }: { done: number; total: number }) {
  const { t } = useI18n()
  if (total === 0) return <span className="text-sm text-fg-muted">{t('plan.noIssues')}</span>
  return <span className="text-sm font-semibold text-fg-muted tabular">{t('planning.doneCount', { done, total })}</span>
}
