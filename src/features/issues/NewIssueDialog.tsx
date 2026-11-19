import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createIssue } from '../../api/issues'
import { listProjectMembers, listProjects } from '../../api/projects'
import { Dialog } from '../../components/Dialog'
import { FormField, formInputClass } from '../../components/FormField'
import { Icon } from '../../components/Icon'
import { button, iconButton, notice } from '../../components/ui'
import { extractFieldErrors, type FieldErrors } from '../auth/errors'
import { useWorkspace } from '../workspace/workspaceContext'
import { useI18n } from '../../i18n'
import { ISSUE_STATUSES } from '../../types/issue'
import type { Issue, IssueStatus, IssueType } from '../../types/issue'
import type { Priority, ProjectStatus } from '../../types/project'
import { Spinner } from '../../components/Spinner'
import { StationGlyph } from '../../components/Track'

const TYPES: IssueType[] = ['task', 'bug', 'feature', 'improvement', 'chore']
const PRIORITIES: Priority[] = ['none', 'low', 'medium', 'high', 'urgent']
const STATUS_ORDER: ProjectStatus[] = ['active', 'planned', 'paused', 'completed']

// The one place issues are created. Opened through NewIssueContext; the layout decides what happens
// after (stay on the project's page, or open the new issue).
const TEMPLATES = ['bug', 'feature', 'task'] as const
type Template = (typeof TEMPLATES)[number]
const TEMPLATE_TYPE: Record<Template, IssueType> = { bug: 'bug', feature: 'feature', task: 'task' }

export function NewIssueDialog({
  initialProjectId,
  initialStatus = 'backlog',
  onClose,
  onCreated,
}: {
  initialProjectId: number | null
  initialStatus?: IssueStatus
  onClose: () => void
  onCreated: (issue: Issue) => void
}) {
  const { t, lang } = useI18n()
  const { currentWorkspace } = useWorkspace()
  const workspaceId = currentWorkspace?.id
  const [chosenProject, setChosenProject] = useState<number | null>(initialProjectId)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<IssueType>('task')
  const [priority, setPriority] = useState<Priority>('none')
  const [status, setStatus] = useState<IssueStatus>(initialStatus)
  const [assignee, setAssignee] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [template, setTemplate] = useState<Template | null>(null)

  // A template sets the type and lays out the description; it never overwrites text someone typed.
  function applyTemplate(next: Template) {
    const untouched = !description.trim() || TEMPLATES.some((key) => description === t(`template.${key}.body`))
    setType(TEMPLATE_TYPE[next])
    if (untouched) setDescription(t(`template.${next}.body`))
    setTemplate(next)
  }

  const projectsQuery = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => listProjects(workspaceId!),
    enabled: workspaceId !== undefined,
  })
  // Archived projects take no new work; active ones come first, so the default is where work is happening.
  const projects = (projectsQuery.data ?? [])
    .filter((project) => project.status !== 'archived')
    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || a.name.localeCompare(b.name))
  const projectId = chosenProject ?? projects[0]?.id ?? null

  // Who can take the issue: the people on the chosen project.
  const membersQuery = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => listProjectMembers(projectId!),
    enabled: projectId !== null,
  })

  const createMutation = useMutation({
    mutationFn: createIssue,
    onSuccess: (issue) => onCreated(issue),
    onError: (error) => setErrors(extractFieldErrors(error, lang)),
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    if (projectId === null) return
    createMutation.mutate({
      project: projectId,
      title: title.trim(),
      description: description.trim(),
      type,
      priority,
      status,
      assignee_id: assignee ? Number(assignee) : null,
      due_date: dueDate || null,
    })
  }

  const noProjects = projectsQuery.isSuccess && projects.length === 0

  return (
    <Dialog title={t('newIssue.title')} onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h2 className="text-base font-semibold tracking-[-0.01em] text-fg">{t('newIssue.title')}</h2>
        <button type="button" onClick={onClose} aria-label={t('common.close')} className={iconButton('sm')}>
          <Icon name="close" />
        </button>
      </div>
      {noProjects ? (
        <div className="px-5 py-6">
          <p className="text-sm text-fg-muted">{t('newIssue.noProjects')}</p>
          <Link to="/projects?new=1" onClick={onClose} className={`mt-4 ${button('primary')}`}>
            <Icon name="plus" />
            {t('newIssue.createProject')}
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4 px-5 py-5">
          {(errors.non_field_errors || errors.project || errors.detail) && (
            <p role="alert" className={notice.error}>
              {[...(errors.non_field_errors ?? []), ...(errors.project ?? []), ...(errors.detail ?? [])].join(' ')}
            </p>
          )}
          <FormField label={t('newIssue.project')}>
            <select
              className={formInputClass}
              value={projectId ?? ''}
              onChange={(e) => {
                setAssignee('')
                setChosenProject(Number(e.target.value))
              }}
              disabled={!projectsQuery.isSuccess}
              required
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </FormField>
          <div role="group" aria-label={t('template.label')} className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-medium text-fg-muted">{t('template.label')}</span>
            {TEMPLATES.map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={template === key}
                onClick={() => applyTemplate(key)}
                className={`h-7 rounded-full border px-3 text-xs font-semibold ${template === key ? 'border-fg bg-fg text-bg' : 'border-border text-fg-muted hover:text-fg'}`}
              >
                {t(`template.${key}.name`)}
              </button>
            ))}
          </div>
          <FormField label={t('common.title')} errors={errors.title}>
            <input className={formInputClass} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus required maxLength={255} />
          </FormField>
          <FormField label={t('common.description')} errors={errors.description}>
            <textarea
              className={`${formInputClass} min-h-24`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('newIssue.descriptionHint')}
              rows={3}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('common.type')} errors={errors.type}>
              <select className={formInputClass} value={type} onChange={(e) => setType(e.target.value as IssueType)}>
                {TYPES.map((value) => (
                  <option key={value} value={value}>
                    {t(`issueType.${value}`)}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label={t('common.priority')} errors={errors.priority}>
              <select className={formInputClass} value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                {PRIORITIES.map((value) => (
                  <option key={value} value={value}>
                    {t(`priority.${value}`)}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('common.assignee')} errors={errors.assignee_id}>
              <select className={formInputClass} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                <option value="">{t('common.unassigned')}</option>
                {membersQuery.data?.map((member) => (
                  <option key={member.user.id} value={member.user.id}>
                    {member.user.username}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label={`${t('common.dueDate')} (${t('common.optional')})`} errors={errors.due_date}>
              <input type="date" className={formInputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </FormField>
          </div>
          {/* Where the issue starts on the line. */}
          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold text-fg">{t('common.status')}</legend>
            <div className="flex flex-wrap gap-1.5">
              {ISSUE_STATUSES.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={status === value}
                  onClick={() => setStatus(value)}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors duration-150 ${
                    status === value ? 'border-brand bg-brand-soft text-fg' : 'border-border bg-surface text-fg-muted hover:text-fg'
                  }`}
                >
                  <StationGlyph status={value} size={11} />
                  {t(`status.${value}`)}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="mt-1 flex justify-end gap-2">
            <button type="button" onClick={onClose} className={button('secondary')}>
              {t('common.cancel')}
            </button>
            <button aria-busy={createMutation.isPending} type="submit" disabled={createMutation.isPending || projectId === null || !title.trim()} className={button('primary')}>
              {createMutation.isPending && <Spinner />}
{t('issues.create')}
            </button>
          </div>
        </form>
      )}
    </Dialog>
  )
}
