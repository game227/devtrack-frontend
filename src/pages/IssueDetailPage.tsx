import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getIssue, updateIssue } from '../api/issues'
import { createIssueComment, listIssueComments } from '../api/comments'
import { listLabels } from '../api/labels'
import { getProject, listProjectMembers } from '../api/projects'
import { IssueStatusBadge, PriorityBadge } from '../components/Badge'
import { CommentThread } from '../components/CommentThread'
import { formInputClass } from '../components/FormField'
import { ISSUE_STATUSES } from '../types/issue'
import type { IssueStatus } from '../types/issue'
import type { Priority } from '../types/project'

const PRIORITIES: Priority[] = ['none', 'low', 'medium', 'high', 'urgent']

export function IssueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const issueId = Number(id)
  const queryClient = useQueryClient()
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [description, setDescription] = useState('')

  const issueQuery = useQuery({
    queryKey: ['issue', issueId],
    queryFn: () => getIssue(issueId),
    enabled: Number.isFinite(issueId),
  })

  const projectId = issueQuery.data?.project

  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId!),
    enabled: projectId !== undefined,
  })

  const membersQuery = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => listProjectMembers(projectId!),
    enabled: projectId !== undefined,
  })

  const labelsQuery = useQuery({
    queryKey: ['labels', 'project', projectId],
    queryFn: () => listLabels({ workspace: projectQuery.data!.workspace, project: projectId }),
    enabled: projectId !== undefined && projectQuery.data !== undefined,
  })

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateIssue>[1]) => updateIssue(issueId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['issue', issueId], updated)
    },
  })

  function handleSaveDescription(event: FormEvent) {
    event.preventDefault()
    updateMutation.mutate({ description })
    setIsEditingDescription(false)
  }

  function toggleLabel(labelId: number) {
    if (!issueQuery.data) return
    const current = issueQuery.data.labels.map((l) => l.id)
    const next = current.includes(labelId)
      ? current.filter((l) => l !== labelId)
      : [...current, labelId]
    updateMutation.mutate({ label_ids: next })
  }

  if (issueQuery.isLoading) {
    return <p className="text-sm text-fg-muted">Loading issue…</p>
  }
  if (issueQuery.isError || !issueQuery.data) {
    return <p className="text-sm text-red-400">Couldn't load this issue.</p>
  }

  const issue = issueQuery.data
  const activeLabelIds = new Set(issue.labels.map((l) => l.id))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to={`/projects/${issue.project}/issues`} className="text-xs text-accent hover:underline">
          ← Back to issues
        </Link>
        <div className="mt-2 mb-2 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-fg">{issue.title}</h1>
          <span className="text-xs uppercase text-fg-muted">{issue.type}</span>
        </div>

        {isEditingDescription ? (
          <form onSubmit={handleSaveDescription} className="flex flex-col gap-2">
            <textarea
              className={formInputClass}
              rows={4}
              defaultValue={issue.description}
              onChange={(e) => setDescription(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded bg-accent px-3 py-1 text-sm font-medium text-white"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingDescription(false)}
                className="rounded border border-border px-3 py-1 text-sm text-fg"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p
            onClick={() => {
              setDescription(issue.description)
              setIsEditingDescription(true)
            }}
            className="cursor-text whitespace-pre-wrap text-sm text-fg-muted hover:text-fg"
          >
            {issue.description || 'Click to add a description…'}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <div className="mb-1 text-xs text-fg-muted">Status</div>
          <select
            className={formInputClass}
            value={issue.status}
            onChange={(e) => updateMutation.mutate({ status: e.target.value as IssueStatus })}
          >
            {ISSUE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="mb-1 text-xs text-fg-muted">Priority</div>
          <select
            className={formInputClass}
            value={issue.priority}
            onChange={(e) => updateMutation.mutate({ priority: e.target.value as Priority })}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="mb-1 text-xs text-fg-muted">Assignee</div>
          <select
            className={formInputClass}
            value={issue.assignee?.id ?? ''}
            onChange={(e) =>
              updateMutation.mutate({
                assignee_id: e.target.value ? Number(e.target.value) : null,
              })
            }
          >
            <option value="">Unassigned</option>
            {membersQuery.data?.map((member) => (
              <option key={member.user.id} value={member.user.id}>
                {member.user.username}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="mb-1 text-xs text-fg-muted">Due date</div>
          <input
            type="date"
            className={formInputClass}
            value={issue.due_date ?? ''}
            onChange={(e) => updateMutation.mutate({ due_date: e.target.value || null })}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <IssueStatusBadge status={issue.status} />
        <PriorityBadge priority={issue.priority} />
      </div>

      <div>
        <div className="mb-2 text-xs text-fg-muted">Labels</div>
        <div className="flex flex-wrap gap-1.5">
          {labelsQuery.data?.map((label) => (
            <button
              key={label.id}
              type="button"
              onClick={() => toggleLabel(label.id)}
              className="rounded px-2 py-0.5 text-xs font-medium capitalize"
              style={{
                backgroundColor: activeLabelIds.has(label.id) ? `${label.color}33` : 'transparent',
                color: activeLabelIds.has(label.id) ? label.color : 'var(--color-fg-muted)',
                border: `1px solid ${activeLabelIds.has(label.id) ? label.color : 'var(--color-border)'}`,
              }}
            >
              {label.name}
            </button>
          ))}
          {labelsQuery.data?.length === 0 && (
            <span className="text-xs text-fg-muted">No labels in this workspace yet.</span>
          )}
        </div>
      </div>

      <CommentThread
        queryKey={['issue-comments', issueId]}
        listComments={() => listIssueComments(issueId)}
        createComment={(body) => createIssueComment(issueId, body)}
      />
    </div>
  )
}
