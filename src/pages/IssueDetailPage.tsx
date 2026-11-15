import { useState } from 'react'
import { PageSkeleton } from '../components/Skeleton'
import type { FormEvent, ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getIssue, updateIssue } from '../api/issues'
import { createIssueComment, listIssueComments } from '../api/comments'
import { listLabels } from '../api/labels'
import { getProject, listProjectMembers } from '../api/projects'
import { Avatar } from '../components/Avatar'
import { CommentThread } from '../components/CommentThread'
import { formInputClass } from '../components/FormField'
import { IssueGithubActivity } from '../components/IssueGithubActivity'
import { StatusStepper } from '../components/Track'
import { button, notice } from '../components/ui'
import { useAuth } from '../features/auth/authContext'
import { issueEditRights } from '../features/issues/permissions'
import { githubUrl } from '../lib/safeUrl'
import { useI18n } from '../i18n'
import type { IssueStatus } from '../types/issue'
import type { Priority } from '../types/project'

const PRIORITIES: Priority[] = ['none', 'low', 'medium', 'high', 'urgent']

function Property({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold text-fg-muted">{label}</div>
      {children}
    </div>
  )
}

export function IssueDetailPage() {
  const { t, formatDateTime } = useI18n()
  const { user } = useAuth()
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
    return <PageSkeleton rows={3} />
  }
  if (issueQuery.isError || !issueQuery.data) {
    return <p className="text-sm text-danger">{t('issue.loadFailed')}</p>
  }

  const issue = issueQuery.data
  const activeLabelIds = new Set(issue.labels.map((l) => l.id))
  // Backend rule (CanEditIssue): the creator may change anything, the assignee only status and
  // priority, nobody else anything. The panel mirrors it instead of letting an edit bounce off a 403.
  const rights = issueEditRights(issue, user?.id)
  const canEdit = rights === 'full'
  const canUpdateProgress = rights !== 'none'

  return (
    <div>
      <Link to={`/projects/${issue.project}/issues`} className="text-sm font-semibold text-accent hover:underline">
        {t('issue.backToIssues')}
      </Link>
      <header className="mb-8 mt-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
          <span className="font-mono">#{issue.number}</span>
          <span>{t(`issueType.${issue.type}`)}</span>
          {githubUrl(issue.github_url) && (
            <a href={githubUrl(issue.github_url)} target="_blank" rel="noreferrer" className="font-mono text-accent hover:underline">
              {t('issue.githubNumber', { number: issue.github_number ?? '' })}
            </a>
          )}
        </div>
        <h1 className="mt-1.5 max-w-4xl text-[28px] font-extrabold leading-tight tracking-[-0.02em] text-fg">{issue.title}</h1>
      </header>

      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-8">
          <div className="rounded-xl border border-border bg-surface px-3 pb-3 pt-4">
            <StatusStepper
              status={issue.status}
              disabled={!canUpdateProgress}
              onChange={(status: IssueStatus) => updateMutation.mutate({ status })}
            />
          </div>

          <section aria-labelledby="issue-description">
            <h2 id="issue-description" className="mb-2 text-base font-bold text-fg">
              {t('common.description')}
            </h2>
            {isEditingDescription && canEdit ? (
              <form onSubmit={handleSaveDescription} className="flex flex-col gap-3">
                <textarea
                  aria-label={t('common.description')}
                  className={`${formInputClass} mt-0! text-[15px] leading-relaxed`}
                  rows={6}
                  defaultValue={issue.description}
                  onChange={(e) => setDescription(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button type="submit" className={button('primary')}>
                    {t('common.save')}
                  </button>
                  <button type="button" onClick={() => setIsEditingDescription(false)} className={button('secondary')}>
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            ) : (
              <p
                onClick={
                  canEdit
                    ? () => {
                        setDescription(issue.description)
                        setIsEditingDescription(true)
                      }
                    : undefined
                }
                title={canEdit ? undefined : t('issue.notYours')}
                className={`max-w-3xl whitespace-pre-wrap rounded-lg text-[15px] leading-relaxed ${issue.description ? 'text-fg' : 'text-fg-muted'} ${
                  canEdit ? '-mx-2 cursor-text px-2 py-1 transition-colors duration-150 hover:bg-well' : ''
                }`}
              >
                {issue.description || t(canEdit ? 'issue.addDescription' : 'issue.noDescription')}
              </p>
            )}
          </section>

          <IssueGithubActivity issueId={issueId} />

          <CommentThread
            queryKey={['issue-comments', issueId]}
            listComments={() => listIssueComments(issueId)}
            createComment={(body) => createIssueComment(issueId, body)}
          />
        </div>

        <aside aria-label={t('issue.properties')} className="h-fit rounded-xl border border-border bg-surface p-5 lg:sticky lg:top-20">
          <h2 className="mb-1 text-base font-bold text-fg">{t('issue.properties')}</h2>
          {rights === 'progress' && <p className="mb-4 text-sm text-fg-muted">{t('issue.progressOnly')}</p>}
          {rights === 'none' && <p className="mb-4 text-sm text-fg-muted">{t('issue.notYours')}</p>}
          {updateMutation.isError && (
            <p role="alert" className={`mb-4 ${notice.error}`}>
              {t('issue.updateFailed')}
            </p>
          )}
          <div className="mt-4 flex flex-col gap-4">
            <Property label={t('common.priority')}>
              <select
                aria-label={t('common.priority')}
                className={`${formInputClass} mt-0!`}
                value={issue.priority}
                disabled={!canUpdateProgress}
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
                aria-label={t('common.assignee')}
                className={`${formInputClass} mt-0!`}
                value={issue.assignee?.id ?? ''}
                disabled={!canEdit}
                onChange={(e) => updateMutation.mutate({ assignee_id: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">{t('common.unassigned')}</option>
                {membersQuery.data?.map((member) => (
                  <option key={member.user.id} value={member.user.id}>
                    {member.specialty ? `${member.user.username} (${t(`specialty.${member.specialty}`)})` : member.user.username}
                  </option>
                ))}
              </select>
            </Property>
            <Property label={t('common.dueDate')}>
              <input
                type="date"
                aria-label={t('common.dueDate')}
                className={`${formInputClass} mt-0!`}
                value={issue.due_date ?? ''}
                disabled={!canEdit}
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
                      disabled={!canEdit}
                      aria-pressed={active}
                      onClick={() => toggleLabel(label.id)}
                      className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${
                        active ? 'border-border-strong bg-well text-fg' : 'border-border bg-surface text-fg-muted hover:text-fg'
                      }`}
                    >
                      <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: label.color, opacity: active ? 1 : 0.5 }} />
                      {label.name}
                    </button>
                  )
                })}
                {labelsQuery.data?.length === 0 && <span className="text-sm text-fg-muted">{t('issue.noLabels')}</span>}
              </div>
            </Property>

            <div className="border-t border-border pt-4">
              <Property label={t('common.reporter')}>
                <span className="flex items-center gap-2 text-sm font-semibold text-fg">
                  <Avatar name={issue.reporter.username} src={issue.reporter.avatar} size={22} />
                  {issue.reporter.username}
                </span>
              </Property>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              <dt className="text-fg-muted">{t('common.created')}</dt>
              <dd className="text-fg">{formatDateTime(issue.created_at)}</dd>
              <dt className="text-fg-muted">{t('common.updated')}</dt>
              <dd className="text-fg">{formatDateTime(issue.updated_at)}</dd>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  )
}
