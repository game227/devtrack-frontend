import { useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createProjectNote, deleteNote, listProjectNotes, updateNote } from '../api/notes'
import { FormField, formInputClass } from '../components/FormField'
import { ConfirmButton } from '../components/ConfirmButton'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'
import { useI18n } from '../i18n'
import type { Note } from '../types/note'

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
      <form onSubmit={handleSubmit} className="rounded border border-border bg-bg-elevated p-4">
        {errors.non_field_errors && (
          <p role="alert" className="mb-3 text-sm text-danger">{errors.non_field_errors.join(' ')}</p>
        )}
        <div className="mb-3">
          <FormField label={t('common.title')} errors={errors.title}>
            <input className={formInputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
          </FormField>
        </div>
        <div className="mb-3">
          <FormField label={t('notes.body')} errors={errors.body}>
            <textarea className={formInputClass} value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
          </FormField>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {updateMutation.isPending ? t('common.saving') : t('common.save')}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-fg transition-colors duration-150 hover:border-fg"
          >
            {t('common.cancel')}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="rounded border border-border bg-bg-elevated p-4">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium text-fg">{note.title}</span>
        <div className="flex items-center gap-3 text-xs text-fg-muted">
          <span>
            {note.author.username} · {formatDateTime(note.updated_at)}
          </span>
          <button type="button" onClick={() => setIsEditing(true)} className="transition-colors duration-150 hover:text-fg">
            {t('common.edit')}
          </button>
          <ConfirmButton
            onConfirm={() => deleteMutation.mutate()}
            className="transition-colors duration-150 hover:text-danger"
          >
            {t('common.delete')}
          </ConfirmButton>
        </div>
      </div>
      <p className="whitespace-pre-wrap text-sm text-fg">{note.body}</p>
    </div>
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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-fg">{t('notes.title')}</h1>
        <button
          type="button"
          onClick={() => setIsFormOpen((open) => !open)}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg active:scale-[0.98]"
        >
          {isFormOpen ? t('common.cancel') : t('notes.new')}
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mb-6 max-w-lg rounded border border-border bg-bg-elevated p-4">
          {errors.non_field_errors && (
            <p role="alert" className="mb-3 text-sm text-danger">{errors.non_field_errors.join(' ')}</p>
          )}
          <div className="mb-3">
            <FormField label={t('common.title')} errors={errors.title}>
              <input className={formInputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
            </FormField>
          </div>
          <div className="mb-3">
            <FormField label={t('notes.body')} errors={errors.body}>
              <textarea className={formInputClass} value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
            </FormField>
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {createMutation.isPending ? t('common.creating') : t('notes.create')}
          </button>
        </form>
      )}

      {notesQuery.isLoading && <p className="text-sm text-fg-muted">{t('notes.loading')}</p>}
      {notesQuery.isError && (
        <p className="text-sm text-danger">{t('notes.loadFailed')}</p>
      )}
      {notesQuery.data?.length === 0 && <p className="text-sm text-fg-muted">{t('notes.empty')}</p>}

      <div className="flex flex-col gap-3">
        {notesQuery.data?.map((note) => (
          <NoteCard key={note.id} note={note} projectId={projectId} />
        ))}
      </div>
    </div>
  )
}
