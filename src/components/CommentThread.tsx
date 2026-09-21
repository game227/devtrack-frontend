import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useI18n } from '../i18n'
import type { Comment } from '../types/comment'
import { Avatar } from './Avatar'
import { formInputClass } from './FormField'

interface CommentThreadProps {
  queryKey: unknown[]
  listComments: () => Promise<Comment[]>
  createComment: (body: string) => Promise<Comment>
}

export function CommentThread({ queryKey, listComments, createComment }: CommentThreadProps) {
  const { t, formatDateTime } = useI18n()
  const queryClient = useQueryClient()
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
    <div>
      <h2 className="mb-2 text-sm font-semibold text-fg">{t('comments.title')}</h2>

      {commentsQuery.isLoading && <p className="text-sm text-fg-muted">{t('comments.loading')}</p>}

      <ul className="mb-3 flex flex-col gap-2">
        {commentsQuery.data?.map((comment) => (
          <li key={comment.id} className="rounded border border-border bg-bg-elevated p-3 text-sm">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-medium text-fg">
                <Avatar name={comment.author.username} src={comment.author.avatar} size={20} />
                {comment.author.username}
              </span>
              <span className="text-xs text-fg-muted">{formatDateTime(comment.created_at)}</span>
            </div>
            <p className="whitespace-pre-wrap text-fg">{comment.body}</p>
          </li>
        ))}
        {commentsQuery.data?.length === 0 && <li className="text-sm text-fg-muted">{t('comments.empty')}</li>}
      </ul>

      <form onSubmit={handleSubmit} className="flex items-start gap-2">
        <textarea
          aria-label={t('comments.placeholder')}
          className={`${formInputClass} flex-1`}
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('comments.placeholder')}
        />
        <button
          type="submit"
          disabled={createMutation.isPending || !body.trim()}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          {t('comments.post')}
        </button>
      </form>
    </div>
  )
}
