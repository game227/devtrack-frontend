import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProject } from '../api/projects'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'
import { useI18n } from '../i18n'
import type { Priority, Project, ProjectStatus } from '../types/project'
import { FormField, formInputClass } from './FormField'
import { button, notice, panel } from './ui'
import { Spinner } from './Spinner'

const PROJECT_STATUSES: ProjectStatus[] = ['planned', 'active', 'paused', 'completed', 'archived']
const PRIORITIES: Priority[] = ['none', 'low', 'medium', 'high', 'urgent']

// One line under the status select: what the status means and what it changes.
export function StatusHint({ status }: { status: ProjectStatus }) {
  const { t } = useI18n()
  return <p className="mt-1.5 text-xs text-fg-muted">{t(`projectStatus.hint.${status}`)}</p>
}

// Name, description, status and priority of a project, for its owner and workspace admins.
export function ProjectEditForm({ project, onDone }: { project: Project; onDone: () => void }) {
  const { t, lang } = useI18n()
  const queryClient = useQueryClient()
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description)
  const [status, setStatus] = useState<ProjectStatus>(project.status)
  const [priority, setPriority] = useState<Priority>(project.priority)
  const [errors, setErrors] = useState<FieldErrors>({})

  const save = useMutation({
    mutationFn: () => updateProject(project.id, { name: name.trim(), description, status, priority }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['project', project.id], updated)
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      void queryClient.invalidateQueries({ queryKey: ['project-health', project.id] })
      onDone()
    },
    onError: (error) => setErrors(extractFieldErrors(error, lang)),
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setErrors({ name: [t('error.blank')] })
      return
    }
    save.mutate()
  }

  return (
    <form onSubmit={submit} aria-label={t('project.editTitle')} className={`${panel} mb-6 p-5`}>
      {errors.non_field_errors && <p role="alert" className={`mb-4 ${notice.error}`}>{errors.non_field_errors.join(' ')}</p>}
      <div className="grid gap-4">
        <FormField label={t('common.name')} errors={errors.name}>
          <input className={formInputClass} value={name} maxLength={150} onChange={(e) => setName(e.target.value)} autoFocus />
        </FormField>
        <FormField label={t('common.description')} errors={errors.description}>
          <textarea className={formInputClass} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('project.descriptionPlaceholder')} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FormField label={t('common.status')} errors={errors.status}>
              <select className={formInputClass} value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
                {PROJECT_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {t(`projectStatus.${value}`)}
                  </option>
                ))}
              </select>
            </FormField>
            <StatusHint status={status} />
          </div>
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
      </div>
      <div className="mt-5 flex gap-2">
        <button aria-busy={save.isPending} type="submit" disabled={save.isPending} className={button('primary')}>
          {save.isPending && <Spinner />}
{t('common.save')}
        </button>
        <button type="button" onClick={onDone} className={button('ghost')}>
          {t('common.cancel')}
        </button>
      </div>
    </form>
  )
}
