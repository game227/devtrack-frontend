import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { search } from '../api/search'
import { filterCommands } from '../features/shortcuts/commands'
import type { Command } from '../features/shortcuts/commands'
import { useT } from '../i18n'
import { Icon } from './Icon'

interface CommandPaletteProps {
  commands: Command[]
  workspaceId: number | undefined
  navigate: (to: string) => void
  onClose: () => void
}

interface Item {
  key: string
  group: string
  label: string
  hint?: string
  run: () => void
}

const GROUP_ORDER = ['results', 'navigate', 'create', 'other'] as const

// Rendered only while open, so its query/selection state starts fresh every time.
export function CommandPalette({ commands, workspaceId, navigate, onClose }: CommandPaletteProps) {
  const t = useT()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    // Hand focus back to whatever had it (the page, a button) when the palette closes.
    const previous = document.activeElement as HTMLElement | null
    return () => previous?.focus?.()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 200)
    return () => clearTimeout(timer)
  }, [query])

  const searchQuery = useQuery({
    queryKey: ['search', workspaceId, debouncedQuery],
    queryFn: () => search(workspaceId!, debouncedQuery),
    enabled: workspaceId !== undefined && debouncedQuery.length >= 2,
  })

  const items: Item[] = []
  if (debouncedQuery.length >= 2 && searchQuery.data) {
    for (const project of searchQuery.data.projects.slice(0, 4)) {
      items.push({
        key: `project-${project.id}`,
        group: 'results',
        label: project.name,
        hint: t('cmdk.project'),
        run: () => navigate(`/projects/${project.id}`),
      })
    }
    for (const issue of searchQuery.data.issues.slice(0, 6)) {
      items.push({
        key: `issue-${issue.id}`,
        group: 'results',
        label: `#${issue.id} ${issue.title}`,
        hint: t(`status.${issue.status}`),
        run: () => navigate(`/issues/${issue.id}`),
      })
    }
  }
  for (const command of filterCommands(commands, query)) {
    items.push({ key: command.id, group: command.group, label: command.label, hint: command.shortcut, run: command.run })
  }
  items.sort((a, b) => GROUP_ORDER.indexOf(a.group as (typeof GROUP_ORDER)[number]) - GROUP_ORDER.indexOf(b.group as (typeof GROUP_ORDER)[number]))

  const active = Math.min(activeIndex, Math.max(items.length - 1, 0))

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest' })
  }, [active, items.length])

  function choose(item: Item | undefined) {
    if (!item) return
    onClose()
    item.run()
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex(items.length === 0 ? 0 : (active + 1) % items.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex(items.length === 0 ? 0 : (active - 1 + items.length) % items.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      choose(items[active])
    } else if (event.key === 'Tab') {
      // Keep focus on the input — the list is driven by the arrow keys.
      event.preventDefault()
    }
  }

  let lastGroup = ''
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
      <button type="button" aria-label={t('cmdk.close')} tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/70" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('cmdk.title')}
        onKeyDown={handleKeyDown}
        className="relative w-full max-w-lg animate-scale-in overflow-hidden rounded-2xl border border-border bg-bg-elevated"
      >
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Icon name="search" className="text-fg-muted" />
          <input
            autoFocus
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-list"
            aria-activedescendant={items[active] ? `cmd-${items[active].key}` : undefined}
            aria-label={t('cmdk.title')}
            placeholder={t('cmdk.placeholder')}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(0)
            }}
            className="w-full bg-transparent py-3 text-sm text-fg outline-none placeholder:text-fg-muted"
          />
          <kbd className="rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] text-fg-muted">Esc</kbd>
        </div>
        <ul id="command-palette-list" role="listbox" ref={listRef} className="max-h-80 overflow-y-auto py-1">
          {items.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-fg-muted">{t('cmdk.noResults', { query })}</li>
          )}
          {items.map((item, index) => {
            const heading = item.group !== lastGroup ? t(`cmdk.group.${item.group}`) : null
            lastGroup = item.group
            return (
              <li key={item.key} role="presentation">
                {heading && (
                  <div className="px-4 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-fg-muted">{heading}</div>
                )}
                <div
                  id={`cmd-${item.key}`}
                  role="option"
                  aria-selected={index === active}
                  onMouseMove={() => setActiveIndex(index)}
                  onClick={() => choose(item)}
                  className={`mx-1 flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm ${
                    index === active ? 'bg-bg text-fg' : 'text-fg-muted'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  {item.hint && <span className="shrink-0 font-mono text-xs text-fg-muted">{item.hint}</span>}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
