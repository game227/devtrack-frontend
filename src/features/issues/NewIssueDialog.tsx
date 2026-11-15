import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createIssue } from '../../api/issues'
import { listProjects } from '../../api/projects'
import { Dialog } from '../../components/Dialog'
import { FormField, formInputClass } from '../../components/FormField'
import { Icon } from '../../components/Icon'
import { button, iconButton, notice } from '../../components/ui'
import { extractFieldErrors, type FieldErrors } from '../auth/errors'
import { useWorkspace } from '../workspace/workspaceContext'
import { useI18n } from '../../i18n'
import type { Issue, IssueType } from '../../types/issue'
import type { Priority, ProjectStatus } from '../../types/project'

const TYPES: IssueType[] = ['task', 'bug', 'feature', 'improvement', 'chore']
const PRIORITIES: Priority[] = ['none', 'low', 'medium', 'high', 'urgent']
const STATUS_ORDER: ProjectStatus[] = ['active', 'planned', 'paused', 'completed']

// The one place issues are created. Opened through NewIssueContext; the layout decides what happens
// after (stay on the project's page, or open the new issue).
export function NewIssueDialog({
  initialProjectId,
  onClose,
  onCreated,
}: {
  initialProjectId: number | null
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
  const [errors, setErrors] = useState<FieldErrors>({})

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

  const createMutation = useMutation({
    mutationFn: createIssue,
    onSuccess: (issue) => onCreated(issue),
    onError: (error) => setErrors(extractFieldErrors(error, lang)),
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    if (projectId === null) return
    createMutation.mutate({ project: projectId, title: title.trim(), description: description.trim(), type, priority })
  }

  const noProjects = projectsQuery.isSuccess && projects.length === 0

  return (
    <Dialog title={t('newIssue.title')} onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h2 className="text-base font-bold text-fg">{t('newIssue.title')}</h2>
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
              onChange={(e) => setChosenProject(Number(e.target.value))}
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
          <div className="mt-1 flex justify-end gap-2">
            <button type="button" onClick={onClose} className={button('secondary')}>
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={createMutation.isPending || projectId === null || !title.trim()} className={button('primary')}>
              {createMutation.isPending ? t('common.creating') : t('issues.create')}
            </button>
          </div>
        </form>
      )}
    </Dialog>
  )
}
