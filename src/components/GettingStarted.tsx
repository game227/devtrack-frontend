import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listProjects } from '../api/projects'
import { listWorkspaceMembers } from '../api/workspaces'
import { useNewIssue } from '../features/issues/newIssueContext'
import { writeOnboardingHidden } from '../features/onboarding'
import { useT } from '../i18n'
import type { Workspace } from '../types/workspace'
import { Icon } from './Icon'
import { button, sectionTitle } from './ui'

type Step = 'project' | 'issue' | 'team' | 'github'

// The first stops on a new workspace's line: a project, an issue, the team, GitHub. Each is ticked off
// from what is really there (not from clicks), the next one is marked and has its button, and the whole
// thing goes away once everything is done or when it is hidden (the page decides whether to show it).
export function GettingStarted({
  workspace,
  projectsTotal,
  issuesTotal,
  onHide,
}: {
  workspace: Workspace
  projectsTotal: number
  issuesTotal: number
  onHide: () => void
}) {
  const t = useT()
  const openNewIssue = useNewIssue()
  const projectsQuery = useQuery({ queryKey: ['projects', workspace.id], queryFn: () => listProjects(workspace.id) })
  const withTeam = !workspace.is_personal
  const membersQuery = useQuery({
    queryKey: ['workspace-members', workspace.id],
    queryFn: () => listWorkspaceMembers(workspace.id),
    enabled: withTeam,
  })
  if (!projectsQuery.isSuccess || (withTeam && !membersQuery.isSuccess)) return null

  const projects = projectsQuery.data
  const done: Record<Step, boolean> = {
    project: projectsTotal > 0,
    issue: issuesTotal > 0,
    team: (membersQuery.data?.length ?? 0) > 1,
    github: projects.some((project) => Boolean(project.repository_url)),
  }
  const steps: Step[] = withTeam ? ['project', 'issue', 'team', 'github'] : ['project', 'issue', 'github']
  const finished = steps.filter((step) => done[step]).length
  if (finished === steps.length) return null
  const next = steps.find((step) => !done[step])
  const firstProject = projects[0]

  const action = (step: Step) => {
    const label = t(`onboarding.${step}.action`)
    const cls = `mt-3 ${button('primary', 'sm')}`
    if (step === 'project') return <Link to="/projects?new=1" className={cls}>{label}</Link>
    if (step === 'issue') return <button type="button" onClick={() => openNewIssue(firstProject?.id ?? null)} className={cls}>{label}</button>
    if (step === 'team') return <Link to="/members" className={cls}>{label}</Link>
    return <Link to={firstProject ? `/projects/${firstProject.id}#project-github` : '/projects'} className={cls}>{label}</Link>
  }

  function hide() {
    writeOnboardingHidden(workspace.id)
    onHide()
  }

  return (
    <section aria-labelledby="getting-started" className="mb-10 rounded-xl border border-edge bg-surface p-5 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="getting-started" className={sectionTitle}>
            {t('onboarding.title', { count: steps.length })}
          </h2>
          <p className="mt-1 text-sm text-fg-muted">{t('onboarding.progress', { done: finished, total: steps.length })}</p>
        </div>
        <button type="button" onClick={hide} className={button('ghost', 'sm')}>
          {t('onboarding.hide')}
        </button>
      </div>
      <ol className={`relative mt-6 grid gap-6 ${steps.length === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}>
        {/* The line the steps sit on (from sm up, where they stand side by side). */}
        <span aria-hidden="true" className="absolute left-3 right-3 top-[11px] hidden h-[3px] rounded-full bg-border sm:block" />
        {steps.map((step) => {
          const isDone = done[step]
          const isNext = step === next
          return (
            <li key={step} aria-current={isNext ? 'step' : undefined} className="relative flex flex-col items-start">
              <span aria-hidden="true" className="relative mb-3 flex h-6 w-6 items-center justify-center">
                {isDone ? (
                  <span className="btn-ink flex h-6 w-6 items-center justify-center rounded-full">
                    <Icon name="check" size={13} />
                  </span>
                ) : isNext ? (
                  <>
                    <span className="live-ring absolute h-6 w-6 rounded-full bg-orange/40" />
                    <span className="relative h-6 w-6 rounded-full border-[5px] border-orange bg-surface" />
                  </>
                ) : (
                  <span className="h-6 w-6 rounded-full border-2 border-dashed border-border-strong bg-surface" />
                )}
              </span>
              <h3 className={`text-sm font-semibold ${isDone ? 'text-fg-muted line-through decoration-fg/30' : 'text-fg'}`}>
                {t(`onboarding.${step}.title`)}
                {isDone && ' '}
                {isDone && <span className="sr-only">({t('onboarding.done')})</span>}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-fg-muted">{t(`onboarding.${step}.desc`)}</p>
              {isNext && action(step)}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
