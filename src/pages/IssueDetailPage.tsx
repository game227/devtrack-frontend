import { useContext, useEffect, useState } from 'react'
import { PageSkeleton } from '../components/Skeleton'
import type { FormEvent, ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getIssue, updateIssue } from '../api/issues'
import { listAttachments, listChecklist, listRelations } from '../api/issueParts'
import { Icon } from '../components/Icon'
import { SavedNote } from '../components/SavedNote'
import { createIssueComment, listIssueComments } from '../api/comments'
import { listLabels } from '../api/labels'
import { getProject, listProjectMembers } from '../api/projects'
import { listCycles } from '../api/cycles'
import { listMilestones } from '../api/milestones'
import { useFollowWorkspace } from '../features/workspace/useFollowWorkspace'
import { Avatar } from '../components/Avatar'
import { CommentThread } from '../components/CommentThread'
import { formInputClass } from '../components/FormField'
import { IssueAttachments } from '../components/IssueAttachments'
import { IssueChecklist } from '../components/IssueChecklist'
import { IssueGithubActivity } from '../components/IssueGithubActivity'
import { IssueRelations } from '../components/IssueRelations'
import { IssueViewers } from '../components/IssueViewers'
import { IssueHistory } from '../components/IssueHistory'
import { IssueTime } from '../components/IssueTime'
import { setPageShortcuts } from '../features/shortcuts/shortcuts'
import { ShareIssueButtons } from '../components/ShareIssue'
import { Markdown } from '../components/Markdown'
import { MarkdownField } from '../components/MarkdownField'
import { StatusStepper } from '../components/Track'
import { button, iconButton, notice, pageTitle } from '../components/ui'
import { Dialog } from '../components/Dialog'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useAuth } from '../features/auth/authContext'
import { WorkspaceContext } from '../features/workspace/workspaceContext'
import { issueEditRights } from '../features/issues/permissions'
import { githubUrl } from '../lib/safeUrl'
import { useI18n } from '../i18n'
import type { IssueStatus } from '../types/issue'
import type { Priority } from '../types/project'

const PRIORITIES: Priority[] = ['none', 'low', 'medium', 'high', 'urgent']
// The usual planning-poker scale.
const ESTIMATES = [1, 2, 3, 5, 8, 13, 21]

function Property({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold text-fg-muted">{label}</div>
      {children}
      {hint && <p className="mt-1 text-xs text-fg-muted">{hint}</p>}
    </div>
  )
}

const ISSUE_PARTS = ['checklist', 'relations', 'attachments'] as const
type IssuePart = (typeof ISSUE_PARTS)[number]

export function IssueDetailPage() {
  const { t, formatDateTime, formatShortDate } = useI18n()
  const { user } = useAuth()
  // Read without useWorkspace(): the page also renders where no workspace provider exists (tests, deep links).
  const currentWorkspace = useContext(WorkspaceContext)?.currentWorkspace ?? null
  const { id } = useParams<{ id: string }>()
  const issueId = Number(id)
  const queryClient = useQueryClient()
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [activityTab, setActivityTab] = useState<'comments' | 'history'>('comments')
  // Empty parts (steps, linked issues, files) wait in one "Add" row instead of each taking a block
  // of the page; choosing one opens it, ready to type into.
  const [opened, setOpened] = useState<ReadonlySet<IssuePart>>(() => new Set())
  const checklistQuery = useQuery({ queryKey: ['issue-checklist', issueId], queryFn: () => listChecklist(issueId) })
  const relationsQuery = useQuery({ queryKey: ['issue-relations', issueId], queryFn: () => listRelations(issueId) })
  const attachmentsQuery = useQuery({ queryKey: ['issue-attachments', issueId], queryFn: () => listAttachments(issueId) })
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

  // Workspace-wide labels plus this project's own: the API's ?project= filter returns only the latter.
  const labelsQuery = useQuery({
    queryKey: ['labels', projectQuery.data?.workspace],
    queryFn: () => listLabels({ workspace: projectQuery.data!.workspace }),
    enabled: projectQuery.data !== undefined,
    select: (labels) => labels.filter((label) => label.project === null || label.project === projectId),
  })

  const cyclesQuery = useQuery({
    queryKey: ['cycles', projectId],
    queryFn: () => listCycles(projectId!),
    enabled: projectId !== undefined,
  })

  const milestonesQuery = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => listMilestones(projectId!),
    enabled: projectId !== undefined,
  })

  useFollowWorkspace(projectQuery.data?.workspace)

  const [saves, setSaves] = useState(0)
  const wide = useMediaQuery('(min-width: 1024px)', true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateIssue>[1]) => updateIssue(issueId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['issue', issueId], updated)
      void queryClient.invalidateQueries({ queryKey: ['issues'] })
      setSaves((count) => count + 1)
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

  // Issue-page keys (see ShortcutsHelp): S status, A assignee, P priority, E edit description,
  // M write a comment, T log time. They only focus or open things; nothing changes without a choice.
  const loadedIssue = issueQuery.data
  useEffect(() => {
    if (!loadedIssue) return undefined
    const focus = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector)
      if (!element || (element as HTMLButtonElement).disabled) return false
      element.focus()
      element.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return true
    }
    setPageShortcuts((key) => {
      switch (key) {
        case 's':
          return focus('#issue-status button[aria-pressed="true"]') || focus('#issue-status button')
        case 'a':
          return focus('#issue-assignee')
        case 'p':
          return focus('#issue-priority')
        case 'm':
          return focus('#issue-comment')
        case 't': {
          const button = document.getElementById('issue-log-time')
          if (!button) return false
          button.click()
          return true
        }
        case 'e':
          if (issueEditRights(loadedIssue, user?.id) !== 'full') return false
          setDescription(loadedIssue.description)
          setIsEditingDescription(true)
          return true
        default:
          return false
      }
    })
    return () => setPageShortcuts(null)
  }, [loadedIssue, user?.id])

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
  // A part shows when it has something in it or was just asked for; otherwise, if this person may add
  // to it, it waits in the "Add" row (files can be added by anyone who can see the issue).
  const counts: Record<IssuePart, number | undefined> = {
    checklist: checklistQuery.data?.length,
    relations: relationsQuery.data?.length,
    attachments: attachmentsQuery.data?.length,
  }
  const shown = Object.fromEntries(
    ISSUE_PARTS.map((part) => [part, (counts[part] ?? 0) > 0 || opened.has(part)]),
  ) as Record<IssuePart, boolean>
  const addable = ISSUE_PARTS.filter(
    (part) => counts[part] === 0 && !opened.has(part) && (part === 'attachments' || canUpdateProgress),
  )

  // The properties panel's content: beside the page on wide screens, in a bottom sheet on phones.
  const propertiesBody = (
    <>
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
                id="issue-priority"
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
                id="issue-assignee"
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
            <Property label={t('issue.estimate')}>
              <select
                aria-label={t('issue.estimate')}
                className={`${formInputClass} mt-0!`}
                value={issue.estimate ?? ''}
                disabled={!canEdit}
                onChange={(e) => updateMutation.mutate({ estimate: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">{t('issue.notEstimated')}</option>
                {[...new Set([...ESTIMATES, ...(issue.estimate ? [issue.estimate] : [])])]
                  .sort((a, b) => a - b)
                  .map((points) => (
                    <option key={points} value={points}>
                      {t('issue.points', { count: points })}
                    </option>
                  ))}
              </select>
            </Property>
            <Property label={t('issue.cycle')} hint={cyclesQuery.data?.length === 0 ? t('issue.noCycles') : undefined}>
              <select
                aria-label={t('issue.cycle')}
                className={`${formInputClass} mt-0!`}
                value={issue.cycle ?? ''}
                disabled={!canEdit || !cyclesQuery.data?.length}
                onChange={(e) => updateMutation.mutate({ cycle: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">{t('issue.noCycle')}</option>
                {cyclesQuery.data?.map((cycle) => (
                  <option key={cycle.id} value={cycle.id}>
                    {cycle.name} · {formatShortDate(cycle.start_date)}–{formatShortDate(cycle.end_date)}
                    {cycle.is_active ? ` (${t('cycles.active')})` : ''}
                  </option>
                ))}
              </select>
            </Property>
            <Property label={t('issue.milestone')} hint={milestonesQuery.data?.length === 0 ? t('issue.noMilestones') : undefined}>
              <select
                aria-label={t('issue.milestone')}
                className={`${formInputClass} mt-0!`}
                value={issue.milestone ?? ''}
                disabled={!canEdit || !milestonesQuery.data?.length}
                onChange={(e) => updateMutation.mutate({ milestone: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">{t('issue.noMilestone')}</option>
                {milestonesQuery.data?.map((milestone) => (
                  <option key={milestone.id} value={milestone.id}>
                    {milestone.name} · {formatShortDate(milestone.target_date)}
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
            <Property label={t('time.title')}>
              <IssueTime issueId={issue.id} userId={user?.id} />
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
    </>
  )

  return (
    <div>
      <Link to={`/projects/${issue.project}/issues`} className="text-sm font-semibold text-accent hover:underline lg:hidden">
        {t('issue.backToIssues')}
      </Link>
      <header className="mb-8 mt-3 lg:mt-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
          <span className="font-mono">#{issue.number}</span>
          <span>{t(`issueType.${issue.type}`)}</span>
          {githubUrl(issue.github_url) && (
            <a href={githubUrl(issue.github_url)} target="_blank" rel="noreferrer" className="font-mono text-accent hover:underline">
              {t('issue.githubNumber', { number: issue.github_number ?? '' })}
            </a>
          )}
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          {/* Opened from a board card or a list row, the title glides here from where it was (view transition). */}
          <h1 className={`mt-1.5 max-w-4xl ${pageTitle}`} style={{ viewTransitionName: 'issue-title' }}>
            {issue.title}
          </h1>
          <ShareIssueButtons
            issueId={issue.id}
            canShare={canUpdateProgress || currentWorkspace?.my_role === 'owner' || currentWorkspace?.my_role === 'admin'}
          />
        </div>
        <div className="mt-3">
          <IssueViewers issueId={issue.id} />
        </div>
      </header>

      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-8">
          <div id="issue-status" className="rounded-xl border border-edge bg-surface shadow-panel px-3 pb-3 pt-4">
            <StatusStepper
              status={issue.status}
              disabled={!canUpdateProgress}
              onChange={(status: IssueStatus) => updateMutation.mutate({ status })}
            />
          </div>

          <section aria-labelledby="issue-description">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 id="issue-description" className="text-base font-semibold tracking-[-0.01em] text-fg">
                {t('common.description')}
              </h2>
              {canEdit && !isEditingDescription && issue.description && (
                <button
                  type="button"
                  onClick={() => {
                    setDescription(issue.description)
                    setIsEditingDescription(true)
                  }}
                  className={button('ghost', 'sm')}
                >
                  {t('issue.editDescription')}
                </button>
              )}
            </div>
            {isEditingDescription && canEdit ? (
              <form onSubmit={handleSaveDescription} className="flex max-w-3xl flex-col gap-3">
                <MarkdownField label={t('common.description')} value={description} onChange={setDescription} autoFocus />
                <div className="flex gap-2">
                  <button type="submit" className={button('primary')}>
                    {t('common.save')}
                  </button>
                  <button type="button" onClick={() => setIsEditingDescription(false)} className={button('secondary')}>
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            ) : issue.description ? (
              <Markdown className="max-w-3xl text-[15px] leading-relaxed text-fg">{issue.description}</Markdown>
            ) : canEdit ? (
              <button
                type="button"
                onClick={() => {
                  setDescription('')
                  setIsEditingDescription(true)
                }}
                className="-mx-2 rounded-lg px-2 py-1 text-left text-[15px] text-fg-muted transition-colors duration-150 hover:bg-brand-soft/60 hover:text-fg"
              >
                {t('issue.addDescription')}
              </button>
            ) : (
              <p className="text-[15px] text-fg-muted">{t('issue.noDescription')}</p>
            )}
          </section>

          {shown.checklist && <IssueChecklist issueId={issueId} canChange={canUpdateProgress} autoFocus={opened.has('checklist')} />}

          {shown.relations && currentWorkspace && (
            <IssueRelations issueId={issueId} workspaceId={currentWorkspace.id} canChange={canUpdateProgress} startAdding={opened.has('relations')} />
          )}

          {shown.attachments && (
            <IssueAttachments
              issueId={issueId}
              autoFocus={opened.has('attachments')}
              canDelete={(attachment) =>
                attachment.uploaded_by?.id === user?.id ||
                issue.reporter.id === user?.id ||
                currentWorkspace?.my_role === 'owner' ||
                currentWorkspace?.my_role === 'admin'
              }
            />
          )}

          {addable.length > 0 && (
            <div role="group" aria-labelledby="issue-add-more" className="flex flex-wrap items-center gap-2">
              <span id="issue-add-more" className="mr-1 text-sm font-medium text-fg-muted">
                {t('issue.addMore')}
              </span>
              {addable.map((part) => (
                <button
                  key={part}
                  type="button"
                  onClick={() => setOpened((current) => new Set(current).add(part))}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-dashed border-border-strong bg-surface/40 px-3 text-[13px] font-medium text-fg-muted transition-colors duration-150 hover:border-fg/40 hover:bg-surface hover:text-fg"
                >
                  <Icon name="plus" size={14} />
                  {t(`issue.add.${part}`)}
                </button>
              ))}
            </div>
          )}

          <IssueGithubActivity issueId={issueId} />

          <section>
            <div role="tablist" aria-label={t('history.title')} className="mb-4 inline-flex gap-0.5 rounded-xl bg-fg/[0.07] p-1">
              {(['comments', 'history'] as const).map((tab) => (
                <button
                  key={tab}
                  id={`issue-tab-${tab}`}
                  type="button"
                  role="tab"
                  aria-selected={activityTab === tab}
                  aria-controls={`issue-panel-${tab}`}
                  onClick={() => setActivityTab(tab)}
                  className={`flex h-8 items-center rounded-lg px-3.5 text-sm font-semibold transition-colors ${
                    activityTab === tab ? 'bg-brand-soft text-fg shadow-panel' : 'text-fg-muted hover:text-fg'
                  }`}
                >
                  {t(`issueTabs.${tab}`)}
                </button>
              ))}
            </div>
            <div id="issue-panel-comments" role="tabpanel" aria-labelledby="issue-tab-comments" hidden={activityTab !== 'comments'}>
              <CommentThread
                queryKey={['issue-comments', issueId]}
                listComments={() => listIssueComments(issueId)}
                createComment={(body) => createIssueComment(issueId, body)}
                labelledBy="issue-tab-comments"
                inputId="issue-comment"
              />
            </div>
            {activityTab === 'history' && (
              <div id="issue-panel-history" role="tabpanel" aria-labelledby="issue-tab-history">
                <IssueHistory issueId={issueId} />
              </div>
            )}
          </section>
        </div>

        {wide ? (
          <aside aria-label={t('issue.properties')} className="scroll-quiet h-fit rounded-xl border border-edge bg-surface p-5 shadow-panel lg:sticky lg:top-24 lg:max-h-[calc(100vh-7.5rem)] lg:overflow-y-auto">
            <div className="mb-1 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold tracking-[-0.01em] text-fg">{t('issue.properties')}</h2>
              <SavedNote signal={saves} />
            </div>
            {propertiesBody}
          </aside>
        ) : (
          <>
            {/* Phones and tablets: the properties open as a sheet from the bottom, from a button kept in reach. */}
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => setSheetOpen(true)}
              className="glass-menu fixed bottom-[5.5rem] right-3 z-30 flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-fg shadow-float md:bottom-6 print:hidden"
            >
              <Icon name="settings" size={16} />
              {t('issue.properties')}
            </button>
            {sheetOpen && (
              <Dialog title={t('issue.properties')} onClose={() => setSheetOpen(false)} placement="sheet">
                <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-surface/95 px-5 py-3">
                  <h2 className="text-base font-semibold tracking-[-0.01em] text-fg">{t('issue.properties')}</h2>
                  <div className="flex items-center gap-1">
                    <SavedNote signal={saves} />
                    <button type="button" autoFocus onClick={() => setSheetOpen(false)} aria-label={t('common.close')} className={iconButton()}>
                      <Icon name="close" size={18} />
                    </button>
                  </div>
                </div>
                <div className="px-5 pb-6 pt-1">{propertiesBody}</div>
              </Dialog>
            )}
          </>
        )}
      </div>
    </div>
  )
}
