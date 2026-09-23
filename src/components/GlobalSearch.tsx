import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { search } from '../api/search'
import { useWorkspace } from '../features/workspace/workspaceContext'
import { useT } from '../i18n'
import { Icon } from './Icon'

export function GlobalSearch() {
  const t = useT()
  const { currentWorkspace } = useWorkspace()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const workspaceId = currentWorkspace?.id
  const searchQuery = useQuery({
    queryKey: ['search', workspaceId, debouncedQuery],
    queryFn: () => search(workspaceId!, debouncedQuery),
    enabled: workspaceId !== undefined && debouncedQuery.length >= 2,
  })

  function go(path: string) {
    navigate(path)
    setIsOpen(false)
    setQuery('')
  }

  const results = searchQuery.data
  const hasResults =
    !!results &&
    (results.projects.length > 0 ||
      results.issues.length > 0 ||
      results.cycles.length > 0 ||
      results.labels.length > 0 ||
      results.users.length > 0)

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <Icon name="search" className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-muted" />
      <input
        type="search"
        aria-label={t('search.aria')}
        placeholder={t('search.placeholder')}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        className="w-full rounded-md border border-border bg-bg py-1.5 pl-8 pr-3 text-sm text-fg outline-none placeholder:text-fg-muted focus:border-fg"
      />
      {isOpen && debouncedQuery.length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-96 origin-top animate-scale-in overflow-y-auto rounded-md border border-border bg-bg-elevated">
          {searchQuery.isLoading && <p className="px-3 py-2 text-sm text-fg-muted">{t('search.searching')}</p>}
          {searchQuery.isSuccess && !hasResults && (
            <p className="px-3 py-2 text-sm text-fg-muted">{t('search.noResults', { query: debouncedQuery })}</p>
          )}
          {results && results.projects.length > 0 && (
            <div className="border-b border-border py-1">
              <div className="px-3 py-1 text-xs font-semibold uppercase text-fg-muted">{t('search.projects')}</div>
              {results.projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => go(`/projects/${project.id}`)}
                  className="block w-full truncate px-3 py-1.5 text-left text-sm text-fg transition-colors duration-150 hover:bg-bg"
                >
                  {project.name}
                </button>
              ))}
            </div>
          )}
          {results && results.issues.length > 0 && (
            <div className="border-b border-border py-1">
              <div className="px-3 py-1 text-xs font-semibold uppercase text-fg-muted">{t('search.issues')}</div>
              {results.issues.map((issue) => (
                <button
                  key={issue.id}
                  type="button"
                  onClick={() => go(`/issues/${issue.id}`)}
                  className="block w-full truncate px-3 py-1.5 text-left text-sm text-fg transition-colors duration-150 hover:bg-bg"
                >
                  {issue.title}
                </button>
              ))}
            </div>
          )}
          {results && results.cycles.length > 0 && (
            <div className="border-b border-border py-1">
              <div className="px-3 py-1 text-xs font-semibold uppercase text-fg-muted">{t('search.cycles')}</div>
              {results.cycles.map((cycle) => (
                <button
                  key={cycle.id}
                  type="button"
                  onClick={() => go(`/projects/${cycle.project}/cycles`)}
                  className="block w-full truncate px-3 py-1.5 text-left text-sm text-fg transition-colors duration-150 hover:bg-bg"
                >
                  {cycle.name}
                </button>
              ))}
            </div>
          )}
          {results && results.labels.length > 0 && (
            <div className="border-b border-border py-1">
              <div className="px-3 py-1 text-xs font-semibold uppercase text-fg-muted">{t('search.labels')}</div>
              <div className="flex flex-wrap gap-1 px-3 py-1.5">
                {results.labels.map((label) => (
                  <span
                    key={label.id}
                    className="rounded-md px-2 py-0.5 text-xs"
                    style={{ backgroundColor: `${label.color}33`, color: label.color }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {results && results.users.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 text-xs font-semibold uppercase text-fg-muted">{t('search.people')}</div>
              {results.users.map((user) => (
                <div key={user.id} className="px-3 py-1.5 text-sm text-fg">
                  {user.username}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
