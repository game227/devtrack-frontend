import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addRelation, deleteRelation, listRelations } from '../api/issueParts'
import { search } from '../api/search'
import { describeError } from '../features/auth/errors'
import { useI18n } from '../i18n'
import type { IssueRelation, RelationKind } from '../types/issue'
import { formInputClass } from './FormField'
import { Icon } from './Icon'
import { StationDot } from './Track'
import { button } from './ui'

const KINDS: RelationKind[] = ['blocks', 'duplicates', 'relates']

// How a link reads from this issue: "blocks" from its source is "blocked by" at its target.
function phrase(relation: IssueRelation) {
  if (relation.kind === 'relates') return 'relations.relates'
  return relation.direction === 'out' ? `relations.${relation.kind}` : `relations.${relation.kind}.in`
}

export function IssueRelations({ issueId, workspaceId, canChange }: { issueId: number; workspaceId: number; canChange: boolean }) {
  const { t, lang } = useI18n()
  const queryClient = useQueryClient()
  const key = ['issue-relations', issueId]
  const query = useQuery({ queryKey: key, queryFn: () => listRelations(issueId) })
  const relations = query.data ?? []

  const [adding, setAdding] = useState(false)
  const [kind, setKind] = useState<RelationKind>('relates')
  const [term, setTerm] = useState('')
  const [debounced, setDebounced] = useState('')
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term.trim()), 250)
    return () => clearTimeout(timer)
  }, [term])

  const results = useQuery({
    queryKey: ['relation-search', workspaceId, debounced],
    queryFn: () => search(workspaceId, debounced),
    enabled: adding && debounced.length >= 2,
  })
  const linked = new Set(relations.map((r) => r.other.id))
  const candidates = (results.data?.issues ?? []).filter((found) => found.id !== issueId && !linked.has(found.id)).slice(0, 6)

  const add = useMutation({
    mutationFn: (targetId: number) => addRelation(issueId, kind, targetId),
    onSuccess: () => {
      setTerm('')
      setAdding(false)
      setError(null)
      void queryClient.invalidateQueries({ queryKey: key })
    },
    onError: (e) => setError(describeError(e, lang)),
  })
  const remove = useMutation({
    mutationFn: (relation: IssueRelation) => deleteRelation(relation.id),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: key }),
  })

  if (!query.isSuccess || (relations.length === 0 && !canChange)) return null

  return (
    <section aria-labelledby="issue-relations">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="issue-relations" className="text-base font-bold text-fg">
          {t('relations.title')}
        </h2>
        {canChange && !adding && (
          <button type="button" onClick={() => setAdding(true)} className={button('ghost', 'sm')}>
            <Icon name="plus" className="h-3.5 w-3.5" />
            {t('relations.add')}
          </button>
        )}
      </div>

      {relations.length > 0 && (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-edge bg-surface shadow-panel">
          {relations.map((relation) => (
            <li key={relation.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <span className="w-28 shrink-0 font-mono text-[11px] uppercase tracking-[0.12em] text-fg-muted">{t(phrase(relation))}</span>
              <StationDot status={relation.other.status} />
              <Link to={`/issues/${relation.other.id}`} className="flex min-w-0 flex-1 items-baseline gap-2 hover:underline">
                <span className="shrink-0 font-mono text-xs text-fg-muted">#{relation.other.number}</span>{' '}
                <span className={`truncate ${relation.other.status === 'done' ? 'text-fg-muted line-through decoration-fg/30' : 'text-fg'}`}>
                  {relation.other.title}
                </span>
              </Link>
              {canChange && (
                <button
                  type="button"
                  onClick={() => remove.mutate(relation)}
                  aria-label={t('relations.remove', { number: relation.other.number })}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-fg-muted hover:bg-fg/[0.07] hover:text-fg"
                >
                  <Icon name="close" className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {relations.length === 0 && !adding && <p className="text-sm text-fg-muted">{t('relations.empty')}</p>}

      {adding && (
        <div className="mt-2 rounded-xl border border-edge bg-surface p-3 shadow-panel">
          <div className="flex flex-wrap gap-2">
            <select aria-label={t('relations.kind')} className={`${formInputClass} mt-0! w-auto!`} value={kind} onChange={(e) => setKind(e.target.value as RelationKind)}>
              {KINDS.map((value) => (
                <option key={value} value={value}>
                  {t(value === 'relates' ? 'relations.relates' : `relations.${value}`)}
                </option>
              ))}
            </select>
            <input
              aria-label={t('relations.find')}
              placeholder={t('relations.find')}
              className={`${formInputClass} mt-0! min-w-48 flex-1`}
              value={term}
              autoFocus
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setAdding(false)
              }}
            />
            <button type="button" onClick={() => setAdding(false)} className={button('ghost')}>
              {t('common.cancel')}
            </button>
          </div>
          {debounced.length >= 2 && results.isSuccess && (
            <ul aria-label={t('relations.results')} className="mt-2 max-h-64 overflow-y-auto">
              {candidates.map((found) => (
                <li key={found.id}>
                  <button
                    type="button"
                    onClick={() => add.mutate(found.id)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-brand-soft/70"
                  >
                    <StationDot status={found.status} />
                    <span className="font-mono text-xs text-fg-muted">#{found.number}</span>{' '}
                    <span className="truncate">{found.title}</span>
                  </button>
                </li>
              ))}
              {candidates.length === 0 && <li className="px-2.5 py-2 text-sm text-fg-muted">{t('relations.noResults')}</li>}
            </ul>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </section>
  )
}
