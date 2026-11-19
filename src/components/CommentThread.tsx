import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useI18n } from '../i18n'
import type { Comment } from '../types/comment'
import { Avatar } from './Avatar'
import { Markdown } from './Markdown'
import { formInputClass } from './FormField'
import { button } from './ui'

interface CommentThreadProps {
  queryKey: unknown[]
  listComments: () => Promise<Comment[]>
  createComment: (body: string) => Promise<Comment>
  // Inside tabs the tab is the heading: the thread then hides its own and is labelled by the tab.
  labelledBy?: string
  // An id for the comment box, so a keyboard shortcut can focus it.
  inputId?: string
}

export function CommentThread({ queryKey, listComments, createComment, labelledBy, inputId }: CommentThreadProps) {
  const { t, formatDateTime } = useI18n()
  const queryClient = useQueryClient()
  const headingId = useId()
  const [body, setBody] = useState('')

  const commentsQuery = useQuery({ queryKey, queryFn: listComments })

  const createMutation = useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey })
      setBody('')
    },
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!body.trim()) return
    createMutation.mutate(body)
  }

  return (
    <section aria-labelledby={labelledBy ?? headingId}>
      {!labelledBy && (
        <h2 id={headingId} className="mb-3 text-base font-semibold tracking-[-0.01em] text-fg">
          {t('comments.title')}
          {commentsQuery.data && commentsQuery.data.length > 0 && (
            <span className="ml-2 font-semibold text-fg-muted tabular">{commentsQuery.data.length}</span>
          )}
        </h2>
      )}

      {commentsQuery.isLoading && <p className="text-sm text-fg-muted">{t('comments.loading')}</p>}

      <ul className="mb-4 flex flex-col gap-5">
        {commentsQuery.data?.map((comment) => (
          <li key={comment.id} className="flex gap-3 text-sm">
            <Avatar name={comment.author.username} src={comment.author.avatar} size={30} />
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-baseline gap-x-2">
                <span className="font-bold text-fg">{comment.author.username}</span>
                <span className="text-xs text-fg-muted">{formatDateTime(comment.created_at)}</span>
              </div>
              <Markdown className="text-[15px] leading-relaxed text-fg">{comment.body}</Markdown>
            </div>
          </li>
        ))}
        {commentsQuery.data?.length === 0 && <li className="text-sm text-fg-muted">{t('comments.empty')}</li>}
      </ul>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <textarea
          id={inputId}
          aria-label={t('comments.placeholder')}
          className={`${formInputClass} mt-0! flex-1`}
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('comments.placeholder')}
        />
        <button type="submit" disabled={createMutation.isPending || !body.trim()} className={`self-end sm:self-start ${button('primary')}`}>
          {t('comments.post')}
        </button>
      </form>
      <p className="mt-1.5 text-xs text-fg-muted">{t('markdown.hint')}</p>
    </section>
  )
}
