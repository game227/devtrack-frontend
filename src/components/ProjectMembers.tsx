import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addProjectMember,
  listProjectMembers,
  removeProjectMember,
  updateProjectMemberSpecialty,
} from '../api/projects'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'
import { useI18n } from '../i18n'
import { SPECIALTIES } from '../types/project'
import type { ProjectSpecialty } from '../types/project'
import { Avatar } from './Avatar'
import { ConfirmButton } from './ConfirmButton'
import { FormField, formInputClass } from './FormField'
import { button } from './ui'

const compactSelect =
  'rounded-md border border-border-strong bg-surface px-2 py-1 text-xs text-fg transition-colors duration-150 hover:border-fg-muted'

export function ProjectMembers({ projectId }: { projectId: number }) {
  const { t, lang } = useI18n()
  const queryClient = useQueryClient()
  const [username, setUsername] = useState('')
  const [specialty, setSpecialty] = useState<ProjectSpecialty | ''>('')
  const [errors, setErrors] = useState<FieldErrors>({})

  const membersQuery = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => listProjectMembers(projectId),
    enabled: Number.isFinite(projectId),
  })
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['project-members', projectId] })

  const addMutation = useMutation({
    mutationFn: () => addProjectMember(projectId, { username: username.trim(), role: 'member', specialty }),
    onSuccess: () => {
      refresh()
      setUsername('')
      setSpecialty('')
      setErrors({})
    },
    onError: (error) => setErrors(extractFieldErrors(error, lang)),
  })

  const removeMutation = useMutation({
    mutationFn: (userId: number) => removeProjectMember(projectId, userId),
    onSuccess: refresh,
  })

  const specialtyMutation = useMutation({
    mutationFn: ({ userId, value }: { userId: number; value: ProjectSpecialty | '' }) =>
      updateProjectMemberSpecialty(projectId, userId, value),
    onSuccess: refresh,
    onError: (error) => setErrors(extractFieldErrors(error, lang)),
  })

  function handleAdd(event: FormEvent) {
    event.preventDefault()
    addMutation.mutate()
  }

  const specialtyOptions = (
    <>
      <option value="">{t('specialty.none')}</option>
      {SPECIALTIES.map((value) => (
        <option key={value} value={value}>
          {t(`specialty.${value}`)}
        </option>
      ))}
    </>
  )

  return (
    <section aria-labelledby="project-members" className="@container">
      <h2 id="project-members" className="mb-3 text-base font-semibold tracking-[-0.01em] text-fg">
        {t('common.members')}
      </h2>
      {membersQuery.isLoading && <p className="text-sm text-fg-muted">{t('project.membersLoading')}</p>}
      <ul className="mb-4 divide-y divide-border overflow-hidden rounded-xl border border-edge bg-surface shadow-panel">
        {membersQuery.data?.map((member) => (
          <li key={member.id} className="flex flex-col gap-2 px-4 py-2.5 text-sm @md:flex-row @md:items-center @md:justify-between @md:gap-3">
            <span className="flex min-w-0 items-center gap-2.5 text-fg">
              <Avatar name={member.user.username} src={member.user.avatar} size={26} />
              <span className="min-w-0">
                <span className="block truncate font-semibold">{member.user.username}</span>
                {member.role && <span className="block text-xs text-fg-muted">{t(`role.${member.role}`)}</span>}
              </span>
            </span>
            <span className="flex flex-wrap items-center gap-3 @md:shrink-0">
              <select
                aria-label={`${t('specialty.label')}: ${member.user.username}`}
                className={compactSelect}
                value={member.specialty}
                onChange={(e) =>
                  specialtyMutation.mutate({ userId: member.user.id, value: e.target.value as ProjectSpecialty | '' })
                }
              >
                {specialtyOptions}
              </select>
              <ConfirmButton
                onConfirm={() => removeMutation.mutate(member.user.id)}
                className="rounded-md px-2 py-1 text-xs font-semibold text-fg-muted transition-colors duration-150 hover:bg-danger/10 hover:text-danger"
              >
                {t('common.remove')}
              </ConfirmButton>
            </span>
          </li>
        ))}
      </ul>

      {errors.non_field_errors && (
        <p role="alert" className="mb-2 text-sm font-semibold text-danger">
          {errors.non_field_errors.join(' ')}
        </p>
      )}
      <h3 className="mb-1 text-sm font-bold text-fg">{t('projectMembers.addTitle')}</h3>
      <p className="mb-3 text-xs text-fg-muted">{t('projectMembers.addHint')}</p>
      <form onSubmit={handleAdd} className="grid grid-cols-2 items-end gap-3 @xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]">
        <div className="col-span-2 @xl:col-span-1">
          <FormField label={t('common.username')} errors={errors.username}>
            <input className={formInputClass} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" required />
          </FormField>
        </div>
        <div className="col-span-2 @xl:col-span-1">
          <FormField label={t('specialty.label')} errors={errors.specialty}>
            <select
              className={formInputClass}
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value as ProjectSpecialty | '')}
            >
              {specialtyOptions}
            </select>
          </FormField>
        </div>
        <button
          type="submit"
          disabled={addMutation.isPending || !username.trim()}
          className={`col-span-2 @xl:col-span-1 ${button('primary')}`}
        >
          {t('common.add')}
        </button>
      </form>
    </section>
  )
}
