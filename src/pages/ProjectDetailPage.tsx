import { useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addProjectMember,
  getProject,
  listProjectMembers,
  removeProjectMember,
  updateProject,
} from '../api/projects'
import { listTeams } from '../api/teams'
import { createProjectComment, listProjectComments } from '../api/comments'
import { StatusBadge, PriorityBadge } from '../components/Badge'
import { CommentThread } from '../components/CommentThread'
import { ProjectGithubLink } from '../components/ProjectGithubLink'
import { ProjectHealthCard } from '../components/ProjectHealthCard'
import { FormField, formInputClass } from '../components/FormField'
import { Avatar } from '../components/Avatar'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'
import { useI18n } from '../i18n'

export function ProjectDetailPage() {
  const { t, lang, formatDate } = useI18n()
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const queryClient = useQueryClient()
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('member')
  const [errors, setErrors] = useState<FieldErrors>({})

  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId),
    enabled: Number.isFinite(projectId),
  })

  const membersQuery = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => listProjectMembers(projectId),
    enabled: Number.isFinite(projectId),
  })

  const addMemberMutation = useMutation({
    mutationFn: () => addProjectMember(projectId, { username, role }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['project-members', projectId] })
      setUsername('')
      setErrors({})
    },
    onError: (error) => setErrors(extractFieldErrors(error, lang)),
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => removeProjectMember(projectId, userId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['project-members', projectId] }),
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

  function handleAddMember(event: FormEvent) {
    event.preventDefault()
    addMemberMutation.mutate()
  }

  if (projectQuery.isLoading) {
    return <p className="text-sm text-fg-muted">{t('project.loading')}</p>
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

      <div>
        <h2 className="mb-2 text-sm font-semibold text-fg">{t('common.members')}</h2>
        {membersQuery.isLoading && <p className="text-sm text-fg-muted">{t('project.membersLoading')}</p>}
        <ul className="mb-3 flex flex-col gap-1">
          {membersQuery.data?.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between rounded border border-border bg-bg-elevated px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2 text-fg">
                <Avatar name={member.user.username} src={member.user.avatar} size={20} />
                {member.user.username}{' '}
                <span className="text-fg-muted">· {t(`role.${member.role}`)}</span>
              </span>
              <button
                type="button"
                onClick={() => removeMemberMutation.mutate(member.user.id)}
                className="text-xs text-fg-muted transition-colors duration-150 hover:text-danger"
              >
                {t('common.remove')}
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={handleAddMember} className="flex max-w-md items-end gap-2">
          {errors.non_field_errors && (
            <p role="alert" className="text-sm text-danger">{errors.non_field_errors.join(' ')}</p>
          )}
          <FormField label={t('common.username')} errors={errors.username}>
            <input
              className={formInputClass}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </FormField>
          <FormField label={t('common.role')} errors={errors.role}>
            <select className={formInputClass} value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="member">{t('role.member')}</option>
              <option value="admin">{t('role.admin')}</option>
            </select>
          </FormField>
          <button
            type="submit"
            disabled={addMemberMutation.isPending}
            className="mb-0.5 rounded border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {t('common.add')}
          </button>
        </form>
      </div>

      <ProjectGithubLink projectId={projectId} />

      <CommentThread
        queryKey={['project-comments', projectId]}
        listComments={() => listProjectComments(projectId)}
        createComment={(body) => createProjectComment(projectId, body)}
      />
    </div>
  )
}
