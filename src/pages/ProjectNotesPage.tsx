import { useState } from 'react'
import { SkeletonList } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createProjectNote, deleteNote, listProjectNotes, updateNote } from '../api/notes'
import { FormField, formInputClass } from '../components/FormField'
import { ConfirmButton } from '../components/ConfirmButton'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'
import { useI18n } from '../i18n'
import type { Note } from '../types/note'
import { button } from '../components/ui'

function NoteCard({ note, projectId }: { note: Note; projectId: number }) {
  const { t, lang, formatDateTime } = useI18n()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(note.body)
  const [errors, setErrors] = useState<FieldErrors>({})

  const updateMutation = useMutation({
    mutationFn: () => updateNote(note.id, { title, body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notes', projectId] })
      setIsEditing(false)
      setErrors({})
    },
    onError: (error) => setErrors(extractFieldErrors(error, lang)),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteNote(note.id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['notes', projectId] }),
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    updateMutation.mutate()
  }

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="px-5 py-5">
        {errors.non_field_errors && (
          <p role="alert" className="mb-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{errors.non_field_errors.join(' ')}</p>
        )}
        <div className="mb-4">
          <FormField label={t('common.title')} errors={errors.title}>
            <input className={formInputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
          </FormField>
        </div>
        <div className="mb-4">
          <FormField label={t('notes.body')} errors={errors.body}>
            <textarea className={formInputClass} value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
          </FormField>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className={button('primary')}
          >
            {updateMutation.isPending ? t('common.saving') : t('common.save')}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className={button('secondary')}
          >
            {t('common.cancel')}
          </button>
        </div>
      </form>
    )
  }

  return (
    <article className="px-5 py-5">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold text-fg">{note.title}</h2>
          <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-fg-muted">
            <span className="font-semibold">{note.author.username}</span>
            <span>{formatDateTime(note.updated_at)}</span>
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-md px-2 py-1 text-xs font-semibold text-fg-muted transition-colors duration-150 hover:bg-brand-soft/60 hover:text-fg"
          >
            {t('common.edit')}
          </button>
          <ConfirmButton
            onConfirm={() => deleteMutation.mutate()}
            className="rounded-md px-2 py-1 text-xs font-semibold text-fg-muted transition-colors duration-150 hover:bg-danger/10 hover:text-danger"
          >
            {t('common.delete')}
          </ConfirmButton>
        </div>
      </div>
      <p className="max-w-3xl whitespace-pre-wrap text-[15px] leading-relaxed text-fg">{note.body}</p>
    </article>
  )
}

export function ProjectNotesPage() {
  const { t } = useI18n()
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const { lang } = useI18n()
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})

  const notesQuery = useQuery({
    queryKey: ['notes', projectId],
    queryFn: () => listProjectNotes(projectId),
    enabled: Number.isFinite(projectId),
  })

  const createMutation = useMutation({
    mutationFn: (payload: { title: string; body: string }) => createProjectNote(projectId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notes', projectId] })
      setIsFormOpen(false)
      setTitle('')
      setBody('')
      setErrors({})
    },
    onError: (error) => setErrors(extractFieldErrors(error, lang)),
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    createMutation.mutate({ title, body })
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <h1 className="text-2xl font-semibold tracking-[-0.015em] text-fg">{t('notes.title')}</h1>
        <button
          type="button"
          onClick={() => setIsFormOpen((open) => !open)}
          className={button(isFormOpen ? 'secondary' : 'primary')}
        >
          {isFormOpen ? t('common.cancel') : t('notes.new')}
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mb-8 max-w-xl rounded-xl border border-edge bg-surface shadow-panel p-5">
          {errors.non_field_errors && (
            <p role="alert" className="mb-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{errors.non_field_errors.join(' ')}</p>
          )}
          <div className="mb-4">
            <FormField label={t('common.title')} errors={errors.title}>
              <input className={formInputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
            </FormField>
          </div>
          <div className="mb-4">
            <FormField label={t('notes.body')} errors={errors.body}>
              <textarea className={formInputClass} value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
            </FormField>
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className={button('primary')}
          >
            {createMutation.isPending ? t('common.creating') : t('notes.create')}
          </button>
        </form>
      )}

      {notesQuery.isLoading && <SkeletonList count={3} className="h-24" />}
      {notesQuery.isError && (
        <p className="text-sm text-danger">{t('notes.loadFailed')}</p>
      )}
      {notesQuery.data?.length === 0 && !isFormOpen && (
        <EmptyState
          icon="notes"
          title={t('empty.notes.title')}
          description={t('empty.notes.desc')}
          action={{ label: t('empty.notes.action'), onClick: () => setIsFormOpen(true) }}
        />
      )}

      <div className="divide-y divide-border overflow-hidden rounded-xl border border-edge bg-surface shadow-panel empty:hidden">
        {notesQuery.data?.map((note) => (
          <NoteCard key={note.id} note={note} projectId={projectId} />
        ))}
      </div>
    </div>
  )
}
