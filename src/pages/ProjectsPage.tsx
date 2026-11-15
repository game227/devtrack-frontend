import { useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createProject, listProjects } from '../api/projects'
import { useWorkspace } from '../features/workspace/workspaceContext'
import { StatusBadge, PriorityBadge } from '../components/Badge'
import { FormField, formInputClass } from '../components/FormField'
import { ImportFromGithub } from '../components/ImportFromGithub'
import { Icon } from '../components/Icon'
import { PageSkeleton, SkeletonList } from '../components/Skeleton'
import { button, formPanel, listPanel, notice, pageHeader, pageLead, pageTitle } from '../components/ui'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'
import { useI18n } from '../i18n'
import type { ProjectStatus, Priority } from '../types/project'

export function ProjectsPage() {
  const { t, lang } = useI18n()
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspace()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [isFormOpen, setIsFormOpen] = useState(() => searchParams.get('new') === '1')
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('planned')
  const [priority, setPriority] = useState<Priority>('none')
  const [errors, setErrors] = useState<FieldErrors>({})

  const workspaceId = currentWorkspace?.id

  const projectsQuery = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => listProjects(workspaceId!),
    enabled: workspaceId !== undefined,
  })

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] })
      setIsFormOpen(false)
      setName('')
      setDescription('')
      setStatus('planned')
      setPriority('none')
      setErrors({})
    },
    onError: (error) => setErrors(extractFieldErrors(error, lang)),
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!workspaceId) return
    createMutation.mutate({ workspace: workspaceId, name, description, status, priority })
  }

  if (isWorkspaceLoading) {
    return <PageSkeleton rows={4} />
  }

  if (!currentWorkspace) {
    return <p className="text-sm text-fg-muted">{t('common.noWorkspace')}</p>
  }

  return (
    <div>
      <div className={pageHeader}>
        <div>
          <h1 className={pageTitle}>{t('projects.title')}</h1>
          {projectsQuery.data && projectsQuery.data.length > 0 && (
            <p className={pageLead}>
              {currentWorkspace.name}, {t('projects.count', { count: projectsQuery.data.length })}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setIsImportOpen((open) => !open)} aria-expanded={isImportOpen} className={button('secondary')}>
            <Icon name="github" />
            {t('github.import.button')}
          </button>
          <button type="button" onClick={() => setIsFormOpen((open) => !open)} className={button(isFormOpen ? 'secondary' : 'primary')}>
            {!isFormOpen && <Icon name="plus" />}
            {isFormOpen ? t('common.cancel') : t('projects.new')}
          </button>
        </div>
      </div>

      {isImportOpen && <ImportFromGithub workspaceId={currentWorkspace.id} />}

      {isFormOpen && (
        <form onSubmit={handleSubmit} className={formPanel}>
          <h2 className="mb-4 text-base font-bold text-fg">{t('projects.new')}</h2>
          {errors.non_field_errors && (
            <p role="alert" className={`mb-4 ${notice.error}`}>
              {errors.non_field_errors.join(' ')}
            </p>
          )}
          <div className="mb-4">
            <FormField label={t('common.name')} errors={errors.name}>
              <input
                className={formInputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </FormField>
          </div>
          <div className="mb-4">
            <FormField label={t('common.description')} errors={errors.description}>
              <textarea
                className={formInputClass}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </FormField>
          </div>
          <div className="mb-5 grid grid-cols-2 gap-3">
            <FormField label={t('common.status')} errors={errors.status}>
              <select
                className={formInputClass}
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              >
                {(['planned', 'active', 'paused', 'completed', 'archived'] as ProjectStatus[]).map(
                  (value) => (
                    <option key={value} value={value}>
                      {t(`projectStatus.${value}`)}
                    </option>
                  ),
                )}
              </select>
            </FormField>
            <FormField label={t('common.priority')} errors={errors.priority}>
              <select
                className={formInputClass}
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                {(['none', 'low', 'medium', 'high', 'urgent'] as Priority[]).map((value) => (
                  <option key={value} value={value}>
                    {t(`priority.${value}`)}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <button type="submit" disabled={createMutation.isPending} className={button('primary')}>
            {createMutation.isPending ? t('common.creating') : t('projects.create')}
          </button>
        </form>
      )}

      {projectsQuery.isLoading && <SkeletonList count={4} />}
      {projectsQuery.isError && (
        <p className="text-sm text-danger">{t('projects.loadFailed')}</p>
      )}
      {projectsQuery.data && projectsQuery.data.length === 0 && !isFormOpen && (
        <EmptyState
          icon="projects"
          title={t('empty.projects.title')}
          description={t('empty.projects.desc')}
          action={{ label: t('empty.projects.action'), onClick: () => setIsFormOpen(true) }}
        />
      )}

      {projectsQuery.data && projectsQuery.data.length > 0 && (
        <ul className={listPanel}>
          {projectsQuery.data.map((project) => (
            <li key={project.id}>
              <Link to={`/projects/${project.id}`} className="flex items-center gap-4 px-4 py-3.5 transition-colors duration-150 hover:bg-brand-soft/60">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-sm font-semibold text-brand-strong"
                >
                  {project.icon || project.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-bold text-fg">{project.name}</span>
                  {project.description && <span className="block truncate text-sm text-fg-muted">{project.description}</span>}
                </span>
                <span className="hidden shrink-0 items-center gap-3 sm:flex">
                  <PriorityBadge priority={project.priority} />
                  <StatusBadge status={project.status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
