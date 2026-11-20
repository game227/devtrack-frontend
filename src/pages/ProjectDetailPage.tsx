import { useContext, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PageSkeleton } from '../components/Skeleton'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getProject, updateProject } from '../api/projects'
import { listTeams } from '../api/teams'
import { createProjectComment, listProjectComments } from '../api/comments'
import { StatusBadge, PriorityBadge } from '../components/Badge'
import { CommentThread } from '../components/CommentThread'
import { ProjectGithubLink } from '../components/ProjectGithubLink'
import { ProjectHealthCard } from '../components/ProjectHealthCard'
import { ProjectMembers } from '../components/ProjectMembers'
import { formInputClass } from '../components/FormField'
import { ProjectEditForm } from '../components/ProjectEditForm'
import { ProjectSchedule } from '../components/ProjectSchedule'
import { RecurringIssues } from '../components/RecurringIssues'
import { button, pageLead, pageTitle } from '../components/ui'
import { useAuth } from '../features/auth/authContext'
import { canManageProject } from '../features/projects/permissions'
import { WorkspaceContext } from '../features/workspace/workspaceContext'
import { githubUrl } from '../lib/safeUrl'
import { useI18n } from '../i18n'

export function ProjectDetailPage() {
  const { t } = useI18n()
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const currentWorkspace = useContext(WorkspaceContext)?.currentWorkspace ?? null
  const [editing, setEditing] = useState(false)

  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId),
    enabled: Number.isFinite(projectId),
  })

  const teamsQuery = useQuery({
    queryKey: ['teams', projectQuery.data?.workspace],
    queryFn: () => listTeams(projectQuery.data!.workspace),
    enabled: projectQuery.data?.workspace !== undefined,
  })

  const updateTeamMutation = useMutation({
    mutationFn: (teamId: number | null) => updateProject(projectId, { team: teamId }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['project', projectId] }),
  })

  if (projectQuery.isLoading) {
    return <PageSkeleton rows={3} />
  }
  if (projectQuery.isError || !projectQuery.data) {
    return <p className="text-sm text-danger">{t('project.loadFailed')}</p>
  }

  const project = projectQuery.data
  const canManage = canManageProject(project, user?.id, currentWorkspace)

  const repository = githubUrl(project.repository_url ?? '')
  const fact = 'min-w-0 bg-surface px-4 py-3'

  return (
    <div>
      <header className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className={pageTitle}>{project.name}</h1>
              <StatusBadge status={project.status} />
              <PriorityBadge priority={project.priority} />
            </div>
            {project.description ? (
              <p className={`${pageLead} text-[15px]`}>{project.description}</p>
            ) : (
              canManage && !editing && <p className={`${pageLead} italic`}>{t('project.noDescription')}</p>
            )}
          </div>
          {canManage && !editing && (
            <button type="button" onClick={() => setEditing(true)} className={button('secondary', 'sm')}>
              {t('project.edit')}
            </button>
          )}
        </div>
        {!canManage && <p className="mt-2 text-xs text-fg-muted">{t('project.readOnly', { owner: project.owner.username })}</p>}
        <dl className="mt-5 grid gap-px overflow-hidden rounded-xl border border-border bg-border text-sm sm:grid-cols-3">
          <div className={fact}>
            <dt className="text-xs font-semibold text-fg-muted">{t('common.owner')}</dt>
            <dd className="mt-0.5 truncate font-semibold text-fg">{project.owner.username}</dd>
          </div>
          <div className={fact}>
            <dt className="text-xs font-semibold text-fg-muted">{t('common.repository')}</dt>
            <dd className="mt-0.5 truncate font-semibold">
              {repository ? (
                <a href={repository} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                  {repository.replace('https://github.com/', '')}
                </a>
              ) : (
                <a href="#project-github" className="font-medium text-fg-muted underline decoration-fg/30 underline-offset-[3px] hover:text-fg">
                  {t('project.repoNotLinked')}
                </a>
              )}
            </dd>
          </div>
          <div className={fact}>
            <dt className="text-xs font-semibold text-fg-muted">{t('common.team')}</dt>
            <dd className="mt-0.5">
              <select
                aria-label={t('common.team')}
                className={`${formInputClass} mt-0.5! h-8! py-0! text-sm font-semibold`}
                value={project.team ?? ''}
                onChange={(e) => updateTeamMutation.mutate(e.target.value ? Number(e.target.value) : null)}
                disabled={!canManage || updateTeamMutation.isPending}
                title={canManage ? undefined : t('project.onlyManagers')}
              >
                <option value="">{t('common.noTeam')}</option>
                {teamsQuery.data?.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </dd>
          </div>
        </dl>
      </header>

      {editing && <ProjectEditForm project={project} onDone={() => setEditing(false)} />}

      <div className="mb-8">
        <ProjectSchedule project={project} canManage={canManage} />
      </div>

      <div className="grid gap-x-10 gap-y-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-8">
          <ProjectHealthCard projectId={projectId} />
          <CommentThread
            queryKey={['project-comments', projectId]}
            listComments={() => listProjectComments(projectId)}
            createComment={(body) => createProjectComment(projectId, body)}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-8">
          <ProjectMembers projectId={projectId} />
          <RecurringIssues projectId={projectId} canManage={canManage} />
          <ProjectGithubLink projectId={projectId} />
        </div>
      </div>
    </div>
  )
}
