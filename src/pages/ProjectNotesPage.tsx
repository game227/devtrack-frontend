import { useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createProjectNote, deleteNote, listProjectNotes, updateNote } from '../api/notes'
import { FormField, formInputClass } from '../components/FormField'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'
import type { Note } from '../types/note'

function NoteCard({ note, projectId }: { note: Note; projectId: number }) {
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
    onError: (error) => setErrors(extractFieldErrors(error)),
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
          <p className="mb-3 text-sm text-red-400">{errors.non_field_errors.join(' ')}</p>
        )}
        <div className="mb-3">
          <FormField label="Title" errors={errors.title}>
            <input className={formInputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
          </FormField>
        </div>
        <div className="mb-3">
          <FormField label="Body" errors={errors.body}>
            <textarea className={formInputClass} value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
          </FormField>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="rounded border border-border px-3 py-1.5 text-sm text-fg hover:border-accent"
          >
            Cancel
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
            {note.author.username} · {new Date(note.updated_at).toLocaleString()}
          </span>
          <button type="button" onClick={() => setIsEditing(true)} className="hover:text-fg">
            Edit
          </button>
          <button type="button" onClick={() => deleteMutation.mutate()} className="hover:text-red-400">
            Delete
          </button>
        </div>
      </div>
      <p className="whitespace-pre-wrap text-sm text-fg">{note.body}</p>
    </div>
  )
}

export function ProjectNotesPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
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
    onError: (error) => setErrors(extractFieldErrors(error)),
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    createMutation.mutate({ title, body })
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-fg">Notes</h1>
        <button
          type="button"
          onClick={() => setIsFormOpen((open) => !open)}
          className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white"
        >
          {isFormOpen ? 'Cancel' : 'New note'}
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mb-6 max-w-lg rounded border border-border bg-bg-elevated p-4">
          {errors.non_field_errors && (
            <p className="mb-3 text-sm text-red-400">{errors.non_field_errors.join(' ')}</p>
          )}
          <div className="mb-3">
            <FormField label="Title" errors={errors.title}>
              <input className={formInputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
            </FormField>
          </div>
          <div className="mb-3">
            <FormField label="Body" errors={errors.body}>
              <textarea className={formInputClass} value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
            </FormField>
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating…' : 'Create note'}
          </button>
        </form>
      )}

      {notesQuery.isLoading && <p className="text-sm text-fg-muted">Loading notes…</p>}
      {notesQuery.isError && (
        <p className="text-sm text-red-400">Couldn't load notes. Is the backend running?</p>
      )}
      {notesQuery.data?.length === 0 && <p className="text-sm text-fg-muted">No notes yet.</p>}

      <div className="flex flex-col gap-3">
        {notesQuery.data?.map((note) => (
          <NoteCard key={note.id} note={note} projectId={projectId} />
        ))}
      </div>
    </div>
  )
}
