import { useQuery } from '@tanstack/react-query'
import { githubUrl } from '../lib/safeUrl'
import { getIssueGithubLinks } from '../api/integrations'
import { useTimeAgo } from '../hooks/useTimeAgo'
import { useT } from '../i18n'
import { Icon } from './Icon'
import { PullRequestStatusBadge } from './Badge'

export function IssueGithubActivity({ issueId }: { issueId: number }) {
  const t = useT()
  const timeAgo = useTimeAgo()
  const linksQuery = useQuery({
    queryKey: ['issue-github-links', issueId],
    queryFn: () => getIssueGithubLinks(issueId),
    enabled: Number.isFinite(issueId),
  })

  const links = linksQuery.data
  if (!links || (links.commits.length === 0 && links.pull_requests.length === 0)) {
    return null
  }

  return (
    <div>
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold tracking-[-0.01em] text-fg">
        <Icon name="github" size={18} />
        {t('github.linkedActivity')}
      </h2>
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-edge bg-surface shadow-panel">
        {links.pull_requests.map((pr) => (
          <li
            key={`pr-${pr.id}`}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm"
          >
            <PullRequestStatusBadge state={pr.state} merged={pr.merged} />
            <a href={githubUrl(pr.url)} target="_blank" rel="noreferrer" className="truncate font-semibold text-fg hover:text-accent hover:underline">
              #{pr.number} {pr.title}
            </a>
            {pr.draft && !pr.merged && <span className="shrink-0 text-xs text-fg-muted">{t('github.draftPr')}</span>}
            <span className="ml-auto flex shrink-0 items-center gap-2 text-xs text-fg-muted">
              {pr.head_ref && <span className="hidden font-mono sm:inline">{`${pr.head_ref} → ${pr.base_ref}`}</span>}
              <span>{timeAgo(pr.merged_at ?? pr.opened_at ?? pr.created_at)}</span>
            </span>
          </li>
        ))}
        {links.commits.map((commit) => (
          <li
            key={`commit-${commit.id}`}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm"
          >
            <a
              href={githubUrl(commit.url)}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs text-accent hover:underline"
            >
              {commit.sha.slice(0, 7)}
            </a>
            <span className="truncate text-fg">{commit.message.split('\n')[0]}</span>
            <span className="ml-auto flex shrink-0 items-center gap-2 text-xs text-fg-muted">
              {commit.branch && <span className="hidden font-mono sm:inline">{commit.branch}</span>}
              <span>{commit.author_username || commit.author_name}</span>
              <span>{timeAgo(commit.committed_at ?? commit.created_at)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
