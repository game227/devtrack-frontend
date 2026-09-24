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
import { useI18n } from '../i18n'

export function ProjectDetailPage() {
  const { t, formatDate } = useI18n()
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const queryClient = useQueryClient()

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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-fg">{project.name}</h1>
          <PriorityBadge priority={project.priority} />
          <StatusBadge status={project.status} />
        </div>
        {project.description && <p className="text-sm text-fg-muted">{project.description}</p>}
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-fg-muted">{t('common.owner')}</dt>
            <dd className="text-fg">{project.owner.username}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">{t('common.startDate')}</dt>
            <dd className="text-fg">{project.start_date ? formatDate(project.start_date) : '—'}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">{t('common.targetDate')}</dt>
            <dd className="text-fg">{project.target_date ? formatDate(project.target_date) : '—'}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">{t('common.repository')}</dt>
            <dd className="text-fg">{project.repository_url ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">{t('common.team')}</dt>
            <dd className="text-fg">
              <select
                aria-label={t('common.team')}
                className="rounded-md border border-border bg-bg px-2 py-1 text-sm text-fg outline-none focus:border-fg"
                value={project.team ?? ''}
                onChange={(e) =>
                  updateTeamMutation.mutate(e.target.value ? Number(e.target.value) : null)
                }
                disabled={updateTeamMutation.isPending}
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
      </div>

      <ProjectHealthCard projectId={projectId} />

      <ProjectMembers projectId={projectId} />

      <ProjectGithubLink projectId={projectId} />

      <CommentThread
        queryKey={['project-comments', projectId]}
        listComments={() => listProjectComments(projectId)}
        createComment={(body) => createProjectComment(projectId, body)}
      />
    </div>
  )
}
