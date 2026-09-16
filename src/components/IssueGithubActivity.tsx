import { useQuery } from '@tanstack/react-query'
import { getIssueGithubLinks } from '../api/integrations'
import { PullRequestStatusBadge } from './Badge'

export function IssueGithubActivity({ issueId }: { issueId: number }) {
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
      <div className="mb-2 text-xs text-fg-muted">Linked GitHub activity</div>
      <ul className="flex flex-col gap-1.5">
        {links.pull_requests.map((pr) => (
          <li
            key={`pr-${pr.id}`}
            className="flex items-center gap-2 rounded border border-border bg-bg-elevated px-3 py-2 text-sm"
          >
            <PullRequestStatusBadge state={pr.state} merged={pr.merged} />
            <a href={pr.url} target="_blank" rel="noreferrer" className="truncate text-fg hover:text-accent">
              #{pr.number} {pr.title}
            </a>
          </li>
        ))}
        {links.commits.map((commit) => (
          <li
            key={`commit-${commit.id}`}
            className="flex items-center gap-2 rounded border border-border bg-bg-elevated px-3 py-2 text-sm"
          >
            <a
              href={commit.url}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs text-code hover:underline"
            >
              {commit.sha.slice(0, 7)}
            </a>
            <span className="truncate text-fg">{commit.message.split('\n')[0]}</span>
            <span className="ml-auto shrink-0 text-xs text-fg-muted">
              {commit.author_username || commit.author_name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
