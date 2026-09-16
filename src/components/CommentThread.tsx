import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Comment } from '../types/comment'
import { formInputClass } from './FormField'

interface CommentThreadProps {
  queryKey: unknown[]
  listComments: () => Promise<Comment[]>
  createComment: (body: string) => Promise<Comment>
}

export function CommentThread({ queryKey, listComments, createComment }: CommentThreadProps) {
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
      <h2 className="mb-2 text-sm font-semibold text-fg">Comments</h2>

      {commentsQuery.isLoading && <p className="text-sm text-fg-muted">Loading comments…</p>}

      <ul className="mb-3 flex flex-col gap-2">
        {commentsQuery.data?.map((comment) => (
          <li key={comment.id} className="rounded border border-border bg-bg-elevated p-3 text-sm">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-medium text-fg">{comment.author.username}</span>
              <span className="text-xs text-fg-muted">
                {new Date(comment.created_at).toLocaleString()}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-fg">{comment.body}</p>
          </li>
        ))}
        {commentsQuery.data?.length === 0 && (
          <li className="text-sm text-fg-muted">No comments yet.</li>
        )}
      </ul>

      <form onSubmit={handleSubmit} className="flex items-start gap-2">
        <textarea
          className={`${formInputClass} flex-1`}
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment…"
        />
        <button
          type="submit"
          disabled={createMutation.isPending || !body.trim()}
          className="rounded border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          Post
        </button>
      </form>
    </div>
  )
}
