import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getIssue, updateIssue } from '../api/issues'
import { createIssueComment, listIssueComments } from '../api/comments'
import { listLabels } from '../api/labels'
import { getProject, listProjectMembers } from '../api/projects'
import { Avatar } from '../components/Avatar'
import { IssueStatusBadge, PriorityBadge } from '../components/Badge'
import { CommentThread } from '../components/CommentThread'
import { formInputClass } from '../components/FormField'
import { IssueGithubActivity } from '../components/IssueGithubActivity'
import { useI18n } from '../i18n'
import { ISSUE_STATUSES } from '../types/issue'
import type { IssueStatus } from '../types/issue'
import type { Priority } from '../types/project'

const PRIORITIES: Priority[] = ['none', 'low', 'medium', 'high', 'urgent']

function Property({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs text-fg-muted">{label}</div>
      {children}
    </div>
  )
}

export function IssueDetailPage() {
  const { t, formatDateTime } = useI18n()
  const { id } = useParams<{ id: string }>()
  const issueId = Number(id)
  const queryClient = useQueryClient()
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [description, setDescription] = useState('')

  const issueQuery = useQuery({
    queryKey: ['issue', issueId],
    queryFn: () => getIssue(issueId),
    enabled: Number.isFinite(issueId),
  })

  const projectId = issueQuery.data?.project

  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId!),
    enabled: projectId !== undefined,
  })

  const membersQuery = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => listProjectMembers(projectId!),
    enabled: projectId !== undefined,
  })

  const labelsQuery = useQuery({
    queryKey: ['labels', 'project', projectId],
    queryFn: () => listLabels({ workspace: projectQuery.data!.workspace, project: projectId }),
    enabled: projectId !== undefined && projectQuery.data !== undefined,
  })

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateIssue>[1]) => updateIssue(issueId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['issue', issueId], updated)
      void queryClient.invalidateQueries({ queryKey: ['issues'] })
    },
  })

  function handleSaveDescription(event: FormEvent) {
    event.preventDefault()
    updateMutation.mutate({ description })
    setIsEditingDescription(false)
  }

  function toggleLabel(labelId: number) {
    if (!issueQuery.data) return
    const current = issueQuery.data.labels.map((l) => l.id)
    const next = current.includes(labelId) ? current.filter((l) => l !== labelId) : [...current, labelId]
    updateMutation.mutate({ label_ids: next })
  }

  if (issueQuery.isLoading) {
    return <p className="text-sm text-fg-muted">{t('issue.loading')}</p>
  }
  if (issueQuery.isError || !issueQuery.data) {
    return <p className="text-sm text-danger">{t('issue.loadFailed')}</p>
  }

  const issue = issueQuery.data
  const activeLabelIds = new Set(issue.labels.map((l) => l.id))

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="flex min-w-0 flex-col gap-6">
        <div>
          <Link to={`/projects/${issue.project}/issues`} className="text-xs text-accent hover:underline">
            {t('issue.backToIssues')}
          </Link>
          <div className="mb-2 mt-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-code">#{issue.id}</span>
            <h1 className="text-xl font-semibold text-fg">{issue.title}</h1>
            {issue.github_url && (
              <a
                href={issue.github_url}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs text-accent hover:underline"
              >
                {t('issue.githubNumber', { number: issue.github_number ?? '' })}
              </a>
            )}
            <span className="text-xs uppercase text-fg-muted">{t(`issueType.${issue.type}`)}</span>
          </div>
          <div className="mb-4 flex items-center gap-2">
            <IssueStatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
          </div>

          {isEditingDescription ? (
            <form onSubmit={handleSaveDescription} className="flex flex-col gap-2">
              <textarea
                aria-label={t('common.description')}
                className={formInputClass}
                rows={4}
                defaultValue={issue.description}
                onChange={(e) => setDescription(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-md border border-border px-3 py-1 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg"
                >
                  {t('common.save')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingDescription(false)}
                  className="rounded-md border border-border px-3 py-1 text-sm text-fg"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          ) : (
            <p
              onClick={() => {
                setDescription(issue.description)
                setIsEditingDescription(true)
              }}
              className="cursor-text whitespace-pre-wrap text-sm text-fg-muted transition-colors duration-150 hover:text-fg"
            >
              {issue.description || t('issue.addDescription')}
            </p>
          )}
        </div>

        <IssueGithubActivity issueId={issueId} />

        <CommentThread
          queryKey={['issue-comments', issueId]}
          listComments={() => listIssueComments(issueId)}
          createComment={(body) => createIssueComment(issueId, body)}
        />
      </div>

      <aside className="h-fit rounded border border-border bg-bg-elevated p-4">
        <h2 className="mb-4 text-sm font-semibold text-fg">{t('issue.properties')}</h2>
        {updateMutation.isError && (
          <p role="alert" className="mb-3 text-xs text-danger">
            {t('issue.updateFailed')}
          </p>
        )}
        <div className="flex flex-col gap-4">
          <Property label={t('common.status')}>
            <select
              className={`${formInputClass} mt-0!`}
              value={issue.status}
              onChange={(e) => updateMutation.mutate({ status: e.target.value as IssueStatus })}
            >
              {ISSUE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`status.${s}`)}
                </option>
              ))}
            </select>
          </Property>
          <Property label={t('common.priority')}>
            <select
              className={`${formInputClass} mt-0!`}
              value={issue.priority}
              onChange={(e) => updateMutation.mutate({ priority: e.target.value as Priority })}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {t(`priority.${p}`)}
                </option>
              ))}
            </select>
          </Property>
          <Property label={t('common.assignee')}>
            <select
              className={`${formInputClass} mt-0!`}
              value={issue.assignee?.id ?? ''}
              onChange={(e) =>
                updateMutation.mutate({ assignee_id: e.target.value ? Number(e.target.value) : null })
              }
            >
              <option value="">{t('common.unassigned')}</option>
              {membersQuery.data?.map((member) => (
                <option key={member.user.id} value={member.user.id}>
                  {member.user.username}
                  {member.specialty ? ` · ${t(`specialty.${member.specialty}`)}` : ''}
                </option>
              ))}
            </select>
          </Property>
          <Property label={t('common.dueDate')}>
            <input
              type="date"
              className={`${formInputClass} mt-0!`}
              value={issue.due_date ?? ''}
              onChange={(e) => updateMutation.mutate({ due_date: e.target.value || null })}
            />
          </Property>
          <Property label={t('common.labels')}>
            <div className="flex flex-wrap gap-1.5">
              {labelsQuery.data?.map((label) => {
                const active = activeLabelIds.has(label.id)
                return (
                  <button
                    key={label.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleLabel(label.id)}
                    className="rounded px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: active ? `${label.color}33` : 'transparent',
                      color: active ? label.color : 'var(--color-fg-muted)',
                      border: `1px solid ${active ? label.color : 'var(--color-border)'}`,
                    }}
                  >
                    {label.name}
                  </button>
                )
              })}
              {labelsQuery.data?.length === 0 && <span className="text-xs text-fg-muted">{t('issue.noLabels')}</span>}
            </div>
          </Property>

          <div className="border-t border-border pt-4">
            <Property label={t('common.reporter')}>
              <span className="flex items-center gap-2 text-sm text-fg">
                <Avatar name={issue.reporter.username} src={issue.reporter.avatar} size={20} />
                {issue.reporter.username}
              </span>
            </Property>
          </div>
          <div className="grid grid-cols-1 gap-2 text-xs text-fg-muted">
            <div>
              {t('common.created')}: {formatDateTime(issue.created_at)}
            </div>
            <div>
              {t('common.updated')}: {formatDateTime(issue.updated_at)}
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
