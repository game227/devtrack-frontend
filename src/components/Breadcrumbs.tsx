import { useQuery } from '@tanstack/react-query'
import { Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getIssue } from '../api/issues'
import { getProject } from '../api/projects'
import { useWorkspace } from '../features/workspace/workspaceContext'
import { useT } from '../i18n'

const SECTIONS: Record<string, string> = {
  dashboard: 'nav.dashboard',
  projects: 'nav.projects',
  issues: 'nav.issues',
  teams: 'nav.teams',
  members: 'nav.members',
  settings: 'nav.settings',
  profile: 'nav.profile',
}

const PROJECT_TABS: Record<string, string> = {
  board: 'nav.board',
  issues: 'nav.issues',
  cycles: 'nav.cycles',
  milestones: 'nav.milestones',
  notes: 'nav.notes',
  timeline: 'nav.timeline',
  analytics: 'nav.analytics',
}

interface Crumb {
  label: string
  to?: string
}

function toNumber(value: string | undefined): number {
  return value && /^\d+$/.test(value) ? Number(value) : NaN
}

// Where you are, read from the address: "Nova Labs / Projects / Payments API / Board". Every step but the
// last is a link back up. Issue pages name their project, so you can always get back to it.
export function Breadcrumbs({ className = '' }: { className?: string }) {
  const t = useT()
  const { pathname } = useLocation()
  const { currentWorkspace } = useWorkspace()
  const [section, id, tab] = pathname.split('/').filter(Boolean)

  const issueId = section === 'issues' ? toNumber(id) : NaN
  const issueQuery = useQuery({ queryKey: ['issue', issueId], queryFn: () => getIssue(issueId), enabled: Number.isFinite(issueId) })
  const projectId = section === 'projects' ? toNumber(id) : (issueQuery.data?.project ?? NaN)
  const projectQuery = useQuery({ queryKey: ['project', projectId], queryFn: () => getProject(projectId), enabled: Number.isFinite(projectId) })

  const crumbs: Crumb[] = []
  if (currentWorkspace) crumbs.push({ label: currentWorkspace.name, to: '/dashboard' })
  if (section === 'projects' || (section === 'issues' && Number.isFinite(issueId))) {
    if (section === 'projects') crumbs.push({ label: t('nav.projects'), to: '/projects' })
    if (Number.isFinite(projectId)) crumbs.push({ label: projectQuery.data?.name ?? '…', to: `/projects/${projectId}` })
    if (section === 'projects' && tab && PROJECT_TABS[tab]) crumbs.push({ label: t(PROJECT_TABS[tab]) })
    if (Number.isFinite(issueId)) crumbs.push({ label: issueQuery.data ? `#${issueQuery.data.number}` : '…' })
  } else if (section && SECTIONS[section]) {
    crumbs.push({ label: t(SECTIONS[section]) })
  }
  if (crumbs.length === 0) return null

  return (
    <nav aria-label={t('nav.breadcrumb')} className={className}>
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1
          return (
            <Fragment key={`${index}-${crumb.label}`}>
              {index > 0 && (
                <li aria-hidden="true" className="select-none text-subtle">
                  /
                </li>
              )}
              <li className="min-w-0">
                {last || !crumb.to ? (
                  <span aria-current={last ? 'page' : undefined} className={`block max-w-[18rem] truncate ${last ? 'font-semibold text-fg' : 'text-fg-muted'}`}>
                    {crumb.label}
                  </span>
                ) : (
                  <Link to={crumb.to} className="block max-w-[14rem] truncate rounded text-fg-muted transition-colors duration-150 hover:text-fg">
                    {crumb.label}
                  </Link>
                )}
              </li>
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
