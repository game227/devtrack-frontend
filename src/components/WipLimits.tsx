import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProject } from '../api/projects'
import { useI18n } from '../i18n'
import type { Project } from '../types/project'
import type { IssueStatus } from '../types/issue'
import { button, panel } from './ui'
import { StationGlyph } from './Track'

// Done has no limit: finished work does not pile up anyone's plate.
const WIP_COLUMNS: IssueStatus[] = ['backlog', 'todo', 'in_progress', 'in_review']

// Board settings for the project's managers: the most issues each column should hold at once.
export function WipLimitsPanel({ project, onClose }: { project: Project; onClose: () => void }) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [limits, setLimits] = useState<Record<string, string>>(() =>
    Object.fromEntries(WIP_COLUMNS.map((column) => [column, project.wip_limits?.[column] ? String(project.wip_limits[column]) : ''])),
  )
  const save = useMutation({
    mutationFn: () =>
      updateProject(project.id, {
        wip_limits: Object.fromEntries(
          WIP_COLUMNS.filter((column) => Number(limits[column]) > 0).map((column) => [column, Math.min(99, Math.round(Number(limits[column])))]),
        ),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['project', project.id], updated)
      onClose()
    },
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    save.mutate()
  }

  return (
    <form onSubmit={submit} aria-label={t('wip.title')} className={`${panel} mb-5 p-4`}>
      <h2 className="text-sm font-bold text-fg">{t('wip.title')}</h2>
      <p className="mt-1 max-w-2xl text-xs text-fg-muted">{t('wip.explain')}</p>
      <div className="mt-3 flex flex-wrap gap-3">
        {WIP_COLUMNS.map((column) => (
          <label key={column} className="flex items-center gap-2 text-sm">
            <StationGlyph status={column} size={12} />
            <span className="text-fg">{t(`status.${column}`)}</span>
            <input
              type="number"
              min={1}
              max={99}
              inputMode="numeric"
              placeholder="—"
              value={limits[column]}
              onChange={(e) => setLimits((current) => ({ ...current, [column]: e.target.value }))}
              className="h-8 w-16 rounded-lg border border-border bg-surface px-2 text-sm text-fg tabular"
            />
          </label>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={save.isPending} className={button('primary', 'sm')}>
          {t('common.save')}
        </button>
        <button type="button" onClick={onClose} className={button('ghost', 'sm')}>
          {t('common.cancel')}
        </button>
      </div>
    </form>
  )
}
