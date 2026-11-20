import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getSharedIssue } from '../api/issueTools'
import { PriorityBadge } from '../components/Badge'
import { Markdown } from '../components/Markdown'
import { PageSkeleton } from '../components/Skeleton'
import { Logo, StatusTrack } from '../components/Track'
import { useI18n } from '../i18n'
import { pageTitle } from '../components/ui'

// What someone outside the workspace sees through a share link: the issue, read-only, nothing private.
export function SharedIssuePage() {
  const { token = '' } = useParams<{ token: string }>()
  const { t, formatDate, formatDateTime } = useI18n()
  const query = useQuery({ queryKey: ['shared-issue', token], queryFn: () => getSharedIssue(token), retry: false })

  return (
    <div className="min-h-screen px-4 py-8 text-fg">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between print:hidden">
          <Logo />
          <span className="text-xs text-fg-muted">{t('share.readOnly')}</span>
        </header>
        {query.isLoading && <PageSkeleton rows={4} />}
        {query.isError && (
          <div className="rounded-xl border border-edge bg-surface p-8 text-center shadow-panel">
            <h1 className="text-xl font-semibold">{t('share.goneTitle')}</h1>
            <p className="mt-2 text-sm text-fg-muted">{t('share.goneText')}</p>
          </div>
        )}
        {query.data && (
          <article className="rounded-2xl border border-edge bg-surface p-6 shadow-panel sm:p-8">
            <p className="text-sm text-fg-muted">
              {query.data.project} · <span className="font-mono">#{query.data.number}</span> · {t(`issueType.${query.data.type}`)}
            </p>
            <h1 className={`mt-2 ${pageTitle}`}>{query.data.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <StatusTrack status={query.data.status} />
              <span className="font-medium">{t(`status.${query.data.status}`)}</span>
              <PriorityBadge priority={query.data.priority} />
              {query.data.assignee && <span className="text-fg-muted">{t('share.assignee', { name: query.data.assignee })}</span>}
              {query.data.due_date && <span className="text-fg-muted">{t('share.due', { date: formatDate(query.data.due_date) })}</span>}
            </div>
            {query.data.description && <Markdown className="mt-6 text-[15px] leading-relaxed">{query.data.description}</Markdown>}
            {query.data.checklist.length > 0 && (
              <section className="mt-6">
                <h2 className="text-sm font-semibold">
                  {t('checklist.title')} · {t('checklist.progress', { done: query.data.checklist.filter((i) => i.done).length, total: query.data.checklist.length })}
                </h2>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {query.data.checklist.map((item, index) => (
                    <li key={index} className={item.done ? 'text-fg-muted line-through' : ''}>
                      {item.done ? '☑' : '☐'} {item.text}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <p className="mt-8 border-t border-border pt-4 text-xs text-fg-muted">
              {t('share.updated', { date: formatDateTime(query.data.updated_at) })} · {t('share.until', { date: formatDateTime(query.data.expires_at) })}
            </p>
          </article>
        )}
      </div>
    </div>
  )
}
