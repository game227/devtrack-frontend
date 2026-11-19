import { useId } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, NavLink } from 'react-router-dom'
import { listProjects } from '../api/projects'
import { useWorkspace } from '../features/workspace/workspaceContext'
import { useI18n } from '../i18n'
import type { Project } from '../types/project'
import { Icon } from './Icon'
import type { IconName } from './Icon'
import { Popover } from './Popover'
import { Logo, LogoMark } from './Track'
import { kbd } from './ui'

const MAIN_NAV: Array<{ to: string; labelKey: string; icon: IconName }> = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: 'dashboard' },
  { to: '/projects', labelKey: 'nav.projects', icon: 'projects' },
  { to: '/issues', labelKey: 'nav.issues', icon: 'issues' },
  { to: '/teams', labelKey: 'nav.teams', icon: 'teams' },
  { to: '/members', labelKey: 'nav.members', icon: 'members' },
]

function sideLink(collapsed: boolean) {
  return ({ isActive }: { isActive: boolean }) =>
    `flex h-9 items-center gap-2.5 rounded-lg text-sm font-medium transition-[background-color,color,box-shadow] duration-150 ${
      collapsed ? 'justify-center' : 'px-2.5'
    } ${isActive ? 'bg-brand-soft text-fg shadow-panel' : 'text-fg-muted hover:bg-surface/60 hover:text-fg'}`
}

function ProjectTile({ project }: { project: Project }) {
  return (
    <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-[11px] font-semibold text-fg">
      {project.icon || project.name.slice(0, 1).toUpperCase()}
    </span>
  )
}

// The workspace you are in, and a way to switch. A bar variant sits in the top bar on tablets; the
// sidebar variant fills the sidebar's width (or is just the initial when the sidebar is narrow).
export function WorkspaceSwitcher({ variant = 'bar', collapsed = false }: { variant?: 'bar' | 'sidebar'; collapsed?: boolean }) {
  const { t } = useI18n()
  const { currentWorkspace, workspaces, selectWorkspace } = useWorkspace()
  if (!currentWorkspace) return null
  const initial = (
    <span aria-hidden="true" className="btn-ink flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold">
      {currentWorkspace.name.slice(0, 1).toUpperCase()}
    </span>
  )
  const sidebar = variant === 'sidebar'
  if (workspaces.length < 2) {
    if (!sidebar) return <span className="max-w-44 truncate text-sm font-semibold text-fg-muted">{currentWorkspace.name}</span>
    return (
      <div title={collapsed ? currentWorkspace.name : undefined} className={`flex h-10 items-center gap-2.5 ${collapsed ? 'justify-center' : 'px-1.5'}`}>
        {initial}
        <span className={collapsed ? 'sr-only' : 'truncate text-sm font-semibold text-fg'}>{currentWorkspace.name}</span>
      </div>
    )
  }
  return (
    <Popover
      label={t('shell.workspaceMenu', { name: currentWorkspace.name })}
      align="left"
      panelClassName="w-64 p-1.5"
      triggerClassName={
        sidebar
          ? `flex h-10 w-full items-center gap-2.5 rounded-lg text-left transition-colors duration-150 hover:bg-surface/60 ${collapsed ? 'justify-center' : 'px-1.5'}`
          : 'flex h-9 max-w-52 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-fg-muted transition-colors duration-150 hover:bg-brand-soft/60 hover:text-fg'
      }
      trigger={
        sidebar ? (
          <>
            {initial}
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">{currentWorkspace.name}</span>
                <Icon name="chevronDown" size={14} className="text-fg-muted" />
              </>
            )}
          </>
        ) : (
          <>
            <span className="truncate">{currentWorkspace.name}</span>
            <Icon name="chevronDown" size={14} />
          </>
        )
      }
    >
      <>
        <p className="px-2.5 pb-1 pt-1.5 text-xs font-semibold text-fg-muted">{t('shell.workspaces')}</p>
        <ul>
          {workspaces.map((workspace) => {
            const current = workspace.id === currentWorkspace.id
            return (
              <li key={workspace.id}>
                <button
                  type="button"
                  data-closes
                  aria-current={current ? 'true' : undefined}
                  onClick={() => selectWorkspace(workspace.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-fg hover:bg-brand-soft/60"
                >
                  <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
                  {current && <Icon name="check" className="text-brand" />}
                </button>
              </li>
            )
          })}
        </ul>
        <div className="mt-1 border-t border-border pt-1">
          <Link to="/members" className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-fg-muted hover:bg-brand-soft/60 hover:text-fg">
            <Icon name="teams" />
            {t('shell.manageMembers')}
          </Link>
        </div>
      </>
    </Popover>
  )
}

// The main sections and the starred projects: the sidebar on desktops, the menu drawer on smaller screens.
export function SidebarSections({ collapsed = false }: { collapsed?: boolean }) {
  const { t } = useI18n()
  const headingId = useId()
  const { currentWorkspace } = useWorkspace()
  const workspaceId = currentWorkspace?.id
  const projectsQuery = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => listProjects(workspaceId as number),
    enabled: workspaceId !== undefined,
  })
  const favorites = (projectsQuery.data ?? [])
    .filter((project) => project.is_favorite)
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <>
      <nav aria-label={t('nav.mainNavigation')} className="flex flex-col gap-0.5">
        {MAIN_NAV.map((item) => (
          <NavLink key={item.to} to={item.to} title={collapsed ? t(item.labelKey) : undefined} className={sideLink(collapsed)}>
            <Icon name={item.icon} size={17} className="shrink-0" />
            <span className={collapsed ? 'sr-only' : 'truncate'}>{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>
      <section aria-labelledby={collapsed ? undefined : headingId} aria-label={collapsed ? t('nav.favorites') : undefined} className="mt-6">
        {collapsed ? (
          <span aria-hidden="true" className="mx-auto mb-2 block h-px w-6 bg-border" />
        ) : (
          <h2 id={headingId} className="mb-1.5 flex items-center gap-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-subtle">
            <Icon name="star" size={12} />
            {t('nav.favorites')}
          </h2>
        )}
        {favorites.length > 0 ? (
          <ul className="flex flex-col gap-0.5">
            {favorites.map((project) => (
              <li key={project.id}>
                <NavLink to={`/projects/${project.id}`} title={collapsed ? project.name : undefined} className={sideLink(collapsed)}>
                  <ProjectTile project={project} />
                  <span className={collapsed ? 'sr-only' : 'truncate'}>{project.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        ) : (
          !collapsed && <p className="px-2.5 text-xs leading-relaxed text-fg-muted">{t('nav.favoritesEmpty')}</p>
        )}
      </section>
    </>
  )
}

// Desktops: the app's navigation down the left side, as a floating glass panel. It can be narrowed to
// icons (remembered on this device), and gives the page the room back.
export function AppSidebar({ collapsed, onToggle, onShortcuts }: { collapsed: boolean; onToggle: () => void; onShortcuts: () => void }) {
  const { t } = useI18n()
  return (
    <aside
      id="app-sidebar"
      aria-label={t('nav.sidebar')}
      className={`glass fixed inset-y-3 left-3 z-30 hidden flex-col rounded-2xl transition-[width] duration-200 lg:flex print:hidden ${collapsed ? 'w-[4.25rem]' : 'w-60'}`}
    >
      <div className={`flex h-14 shrink-0 items-center ${collapsed ? 'justify-center' : 'px-3.5'}`}>
        <NavLink to="/dashboard" aria-label={collapsed ? 'DevTrack' : undefined} className="group/logo flex h-9 items-center rounded-md px-1">
          {collapsed ? <LogoMark size={26} /> : <Logo />}
        </NavLink>
      </div>
      <div className="px-2">
        <WorkspaceSwitcher variant="sidebar" collapsed={collapsed} />
      </div>
      <div className="scroll-quiet mt-3 min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        <SidebarSections collapsed={collapsed} />
      </div>
      <div className="flex shrink-0 flex-col gap-0.5 border-t border-border p-2">
        <NavLink to="/settings" title={collapsed ? t('nav.settings') : undefined} className={sideLink(collapsed)}>
          <Icon name="settings" size={17} className="shrink-0" />
          <span className={collapsed ? 'sr-only' : 'truncate'}>{t('nav.settings')}</span>
        </NavLink>
        <button type="button" onClick={onShortcuts} title={collapsed ? t('cmdk.showShortcuts') : undefined} className={sideLink(collapsed)({ isActive: false })}>
          <Icon name="keyboard" size={17} className="shrink-0" />
          <span className={collapsed ? 'sr-only' : 'min-w-0 flex-1 truncate text-left'}>{t('cmdk.showShortcuts')}</span>
          {!collapsed && <kbd className={kbd}>?</kbd>}
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-controls="app-sidebar"
          title={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
          className={sideLink(collapsed)({ isActive: false })}
        >
          <Icon name="sidebar" size={17} className="shrink-0" />
          <span className={collapsed ? 'sr-only' : 'truncate'}>{collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}</span>
        </button>
      </div>
    </aside>
  )
}
