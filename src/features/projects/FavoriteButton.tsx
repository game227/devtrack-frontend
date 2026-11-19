import { useMutation, useQueryClient } from '@tanstack/react-query'
import { setProjectFavorite } from '../../api/projects'
import { Icon } from '../../components/Icon'
import { useT } from '../../i18n'
import type { Project } from '../../types/project'
import { useToast } from '../toast/toastContext'

// The star next to a project's name: a starred project is listed in the sidebar. The change shows at
// once (in the project and in every cached project list) and is undone if the server refuses it.
export function FavoriteButton({ project, className = '' }: { project: Project; className?: string }) {
  const t = useT()
  const toast = useToast()
  const queryClient = useQueryClient()
  const favorite = Boolean(project.is_favorite)

  const apply = (value: boolean) => {
    queryClient.setQueryData<Project>(['project', project.id], (old) => (old ? { ...old, is_favorite: value } : old))
    queryClient.setQueriesData<Project[]>({ queryKey: ['projects'] }, (old) =>
      Array.isArray(old) ? old.map((row) => (row.id === project.id ? { ...row, is_favorite: value } : row)) : old,
    )
  }

  const mutation = useMutation({
    mutationFn: (value: boolean) => setProjectFavorite(project.id, value),
    onMutate: (value) => apply(value),
    onError: (_error, value) => {
      apply(!value)
      toast({ text: t('project.favoriteFailed'), tone: 'error' })
    },
  })

  return (
    <button
      type="button"
      aria-pressed={favorite}
      aria-label={t('project.favorite')}
      title={favorite ? t('project.unfavoriteHint') : t('project.favoriteHint')}
      onClick={() => mutation.mutate(!favorite)}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-[color,background-color,transform] duration-150 hover:bg-surface/80 active:scale-90 ${
        favorite ? 'text-orange' : 'text-subtle hover:text-fg'
      } ${className}`}
    >
      <Icon name="star" size={17} fill={favorite ? 'currentColor' : 'none'} className={favorite ? 'animate-pop' : undefined} />
    </button>
  )
}
