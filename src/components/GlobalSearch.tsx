import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { search } from '../api/search'
import { useWorkspace } from '../features/workspace/WorkspaceContext'

export function GlobalSearch() {
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
    <div ref={containerRef} className="relative w-64">
      <input
        type="search"
        placeholder="Search..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        className="w-full rounded border border-border bg-bg-elevated px-3 py-1.5 text-sm text-fg outline-none placeholder:text-fg-muted"
      />
      {isOpen && debouncedQuery.length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-96 overflow-y-auto rounded border border-border bg-bg-elevated shadow-lg">
          {searchQuery.isLoading && <p className="px-3 py-2 text-sm text-fg-muted">Searching…</p>}
          {searchQuery.isSuccess && !hasResults && (
            <p className="px-3 py-2 text-sm text-fg-muted">No results for "{debouncedQuery}".</p>
          )}
          {results && results.projects.length > 0 && (
            <div className="border-b border-border py-1">
              <div className="px-3 py-1 text-xs font-semibold uppercase text-fg-muted">Projects</div>
              {results.projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => go(`/projects/${project.id}`)}
                  className="block w-full truncate px-3 py-1.5 text-left text-sm text-fg hover:bg-bg"
                >
                  {project.name}
                </button>
              ))}
            </div>
          )}
          {results && results.issues.length > 0 && (
            <div className="border-b border-border py-1">
              <div className="px-3 py-1 text-xs font-semibold uppercase text-fg-muted">Issues</div>
              {results.issues.map((issue) => (
                <button
                  key={issue.id}
                  type="button"
                  onClick={() => go(`/issues/${issue.id}`)}
                  className="block w-full truncate px-3 py-1.5 text-left text-sm text-fg hover:bg-bg"
                >
                  {issue.title}
                </button>
              ))}
            </div>
          )}
          {results && results.cycles.length > 0 && (
            <div className="border-b border-border py-1">
              <div className="px-3 py-1 text-xs font-semibold uppercase text-fg-muted">Cycles</div>
              {results.cycles.map((cycle) => (
                <button
                  key={cycle.id}
                  type="button"
                  onClick={() => go(`/projects/${cycle.project}/cycles`)}
                  className="block w-full truncate px-3 py-1.5 text-left text-sm text-fg hover:bg-bg"
                >
                  {cycle.name}
                </button>
              ))}
            </div>
          )}
          {results && results.labels.length > 0 && (
            <div className="border-b border-border py-1">
              <div className="px-3 py-1 text-xs font-semibold uppercase text-fg-muted">Labels</div>
              <div className="flex flex-wrap gap-1 px-3 py-1.5">
                {results.labels.map((label) => (
                  <span
                    key={label.id}
                    className="rounded px-2 py-0.5 text-xs"
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
              <div className="px-3 py-1 text-xs font-semibold uppercase text-fg-muted">People</div>
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
