import { useEffect, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteAttachment, fetchAttachment, listAttachments, saveBlob, uploadAttachment } from '../api/issueParts'
import { describeError } from '../features/auth/errors'
import { useI18n } from '../i18n'
import type { IssueAttachment } from '../types/issue'
import { Icon } from './Icon'
import { button } from './ui'

const ACCEPT = '.png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.md,.csv,.log,.json'
const MAX_BYTES = 10 * 1024 * 1024

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// A small preview of an image attachment, loaded through the API (attachments have no public URL).
function Thumbnail({ attachment }: { attachment: IssueAttachment }) {
  // The object URL lives exactly as long as this query: gcTime 0 drops it on unmount, and the effect
  // releases the memory then.
  const query = useQuery({
    queryKey: ['attachment-thumb', attachment.id],
    queryFn: async () => URL.createObjectURL(await fetchAttachment(attachment.id)),
    staleTime: Infinity,
    gcTime: 0,
  })
  const url = query.data
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url)
  }, [url])
  return url ? (
    <img src={url} alt="" className="h-10 w-10 shrink-0 rounded-lg border border-border object-cover" />
  ) : (
    <span className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-fg/[0.06]" />
  )
}

export function IssueAttachments({
  issueId,
  canDelete,
}: {
  issueId: number
  canDelete: (attachment: IssueAttachment) => boolean
}) {
  const { t, lang, formatDateTime } = useI18n()
  const queryClient = useQueryClient()
  const key = ['issue-attachments', issueId]
  const query = useQuery({ queryKey: key, queryFn: () => listAttachments(issueId) })
  const attachments = query.data ?? []
  const input = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const upload = useMutation({
    mutationFn: (file: File) => uploadAttachment(issueId, file, setProgress),
    onMutate: () => {
      setError(null)
      setProgress(0)
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: key }),
    onError: (e) => setError(describeError(e, lang)),
    onSettled: () => setProgress(null),
  })
  const remove = useMutation({
    mutationFn: (attachment: IssueAttachment) => deleteAttachment(attachment.id),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: key }),
  })
  const download = useMutation({
    mutationFn: async (attachment: IssueAttachment) => saveBlob(await fetchAttachment(attachment.id), attachment.name),
    onError: (e) => setError(describeError(e, lang)),
  })

  function send(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    if (file.size > MAX_BYTES) {
      setError(t('attachments.tooBig'))
      return
    }
    upload.mutate(file)
  }

  function onDrop(event: DragEvent) {
    event.preventDefault()
    setDragging(false)
    send(event.dataTransfer.files)
  }

  if (!query.isSuccess) return null

  return (
    <section aria-labelledby="issue-attachments">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="issue-attachments" className="text-base font-bold text-fg">
          {t('attachments.title')}
          {attachments.length > 0 && <span className="ml-2 font-mono text-xs font-normal text-fg-muted">{attachments.length}</span>}
        </h2>
      </div>

      {attachments.length > 0 && (
        <ul className="mb-2 divide-y divide-border overflow-hidden rounded-xl border border-edge bg-surface shadow-panel">
          {attachments.map((attachment) => (
            <li key={attachment.id} className="flex items-center gap-3 px-4 py-2.5">
              {attachment.is_image ? (
                <Thumbnail attachment={attachment} />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-well font-mono text-[10px] uppercase text-fg-muted">
                  {attachment.name.split('.').pop()?.slice(0, 4)}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-fg">{attachment.name}</span>{' '}
                <span className="block truncate text-xs text-fg-muted">
                  {formatSize(attachment.size)} · {attachment.uploaded_by?.username ?? t('attachments.someone')} · {formatDateTime(attachment.created_at)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => download.mutate(attachment)}
                aria-label={t('attachments.download', { name: attachment.name })}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-fg-muted hover:bg-fg/[0.07] hover:text-fg"
              >
                <Icon name="download" className="h-4 w-4" />
              </button>
              {canDelete(attachment) && (
                <button
                  type="button"
                  onClick={() => remove.mutate(attachment)}
                  aria-label={t('attachments.remove', { name: attachment.name })}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-fg-muted hover:bg-danger/10 hover:text-danger"
                >
                  <Icon name="close" className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex flex-wrap items-center gap-3 rounded-xl border border-dashed px-4 py-3 text-sm transition-colors ${
          dragging ? 'border-fg bg-fg/[0.05]' : 'border-border-strong'
        }`}
      >
        <input ref={input} type="file" accept={ACCEPT} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => {
          send(e.target.files)
          e.target.value = ''
        }} />
        <button type="button" onClick={() => input.current?.click()} disabled={upload.isPending} className={button('secondary', 'sm')}>
          <Icon name="plus" className="h-3.5 w-3.5" />
          {t('attachments.add')}
        </button>
        <span className="text-fg-muted">{progress !== null ? t('attachments.uploading', { percent: Math.round(progress * 100) }) : t('attachments.hint')}</span>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </section>
  )
}
