import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getProject } from '../api/projects'
import { useAuth } from '../features/auth/authContext'
import { useWorkspace } from '../features/workspace/workspaceContext'
import { buildCommands, newIssuePath } from '../features/shortcuts/commands'
import { handleShortcut } from '../features/shortcuts/shortcuts'
import type { ShortcutState } from '../features/shortcuts/shortcuts'
import { useI18n } from '../i18n'
import { Avatar } from './Avatar'
import { CommandPalette } from './CommandPalette'
import { GlobalSearch } from './GlobalSearch'
import { Icon } from './Icon'
import type { IconName } from './Icon'
import { LanguageSwitcher } from './LanguageSwitcher'
import { NotificationsMenu } from './NotificationsMenu'
import { ThemeSwitcher } from './ThemeSwitcher'
import { ShortcutsHelp } from './ShortcutsHelp'

interface NavItem {
  to: string
  labelKey: string
  icon: IconName
  end?: boolean
}

const MAIN_NAV: NavItem[] = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: 'dashboard' },
  { to: '/projects', labelKey: 'nav.projects', icon: 'projects' },
  { to: '/issues', labelKey: 'nav.issues', icon: 'issues' },
  { to: '/teams', labelKey: 'nav.teams', icon: 'teams' },
]

const PROJECT_NAV: Array<{ path: string; labelKey: string; icon: IconName; end?: boolean }> = [
  { path: '', labelKey: 'nav.overview', icon: 'overview', end: true },
  { path: '/board', labelKey: 'nav.board', icon: 'board' },
  { path: '/issues', labelKey: 'nav.issues', icon: 'issues' },
  { path: '/cycles', labelKey: 'nav.cycles', icon: 'cycles' },
  { path: '/milestones', labelKey: 'nav.milestones', icon: 'milestones' },
  { path: '/notes', labelKey: 'nav.notes', icon: 'notes' },
  { path: '/timeline', labelKey: 'nav.timeline', icon: 'timeline' },
  { path: '/analytics', labelKey: 'nav.analytics', icon: 'analytics' },
]

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors duration-150 ${
    isActive ? 'border border-border bg-bg text-fg' : 'border border-transparent text-fg-muted hover:text-fg'
  }`
}

function SectionLabel({ children }: { children: string }) {
  return <div className="mb-1 mt-5 truncate px-3 text-[11px] font-medium uppercase tracking-wide text-fg-muted first:mt-0">{children}</div>
}

export function Layout() {
  const { t, lang, setLang } = useI18n()
  const { user, logout } = useAuth()
  const { currentWorkspace, workspaces, selectWorkspace } = useWorkspace()
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  const projectMatch = useMatch({ path: '/projects/:id', end: false })
  const projectId = projectMatch ? Number(projectMatch.params.id) : NaN
  const inProject = Number.isFinite(projectId)
  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId),
    enabled: inProject,
  })

  const username = user?.username ?? ''
  const currentProjectId = inProject ? projectId : null

  const commands = useMemo(
    () =>
      buildCommands({
        t,
        navigate,
        projectId: currentProjectId,
        toggleLanguage: () => setLang(lang === 'uz' ? 'en' : 'uz'),
        logout: () => void logout(),
        showShortcuts: () => setHelpOpen(true),
      }),
    [t, navigate, currentProjectId, lang, setLang, logout],
  )

  // Global shortcuts read the latest route/project through a ref so the listener is bound only once.
  const shortcutContext = useRef({ currentProjectId, navigate })
  useEffect(() => {
    shortcutContext.current = { currentProjectId, navigate }
  }, [currentProjectId, navigate])
  const shortcutState = useRef<ShortcutState>({ pendingGoAt: null })
  // Ctrl/Cmd+K toggles the palette; the header button (only reachable while it is closed) opens it.
  const openPalette = useCallback(() => {
    setHelpOpen(false)
    setPaletteOpen((open) => !open)
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const { currentProjectId: pid, navigate: navigateTo } = shortcutContext.current
      // Navigating from a shortcut also dismisses the shortcuts list if it is showing.
      const go = (to: string) => {
        setHelpOpen(false)
        navigateTo(to)
      }
      const handled = handleShortcut(event, shortcutState.current, {
        openPalette,
        toggleHelp: () => setHelpOpen((open) => !open),
        newIssue: () => go(newIssuePath(pid)),
        go: (target) => {
          if (target === 'board') go(pid === null ? '/projects' : `/projects/${pid}/board`)
          else go(`/${target}`)
        },
      })
      if (handled) event.preventDefault()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [openPalette])

  return (
    <div className="flex min-h-screen bg-bg text-fg">
      {menuOpen && (
        <button
          type="button"
          aria-label={t('nav.closeMenu')}
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-20 bg-black/70 md:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-60 shrink-0 flex-col border-r border-border bg-bg p-4 transition-transform duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-5">
          <NavLink to="/dashboard" className="text-lg font-semibold tracking-tight" onClick={() => setMenuOpen(false)}>
            DevTrack
          </NavLink>
          {workspaces.length > 1 ? (
            <select
              aria-label={t('nav.switchWorkspace')}
              value={currentWorkspace?.id ?? ''}
              onChange={(event) => selectWorkspace(Number(event.target.value))}
              className="mt-1 w-full rounded-md border border-border bg-bg px-2 py-1 text-xs text-fg-muted outline-none focus:border-fg"
            >
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          ) : (
            currentWorkspace && <div className="truncate text-xs text-fg-muted">{currentWorkspace.name}</div>
          )}
        </div>

        <nav
          aria-label={t('nav.mainNavigation')}
          className="flex-1 overflow-y-auto"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('a')) setMenuOpen(false)
          }}
        >
          <SectionLabel>{t('nav.sectionWorkspace')}</SectionLabel>
          <div className="flex flex-col gap-0.5">
            {MAIN_NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                <Icon name={item.icon} />
                {t(item.labelKey)}
              </NavLink>
            ))}
          </div>

          {inProject && (
            <>
              <SectionLabel>{projectQuery.data?.name ?? t('nav.sectionProject')}</SectionLabel>
              <div className="flex flex-col gap-0.5">
                {PROJECT_NAV.map((item) => (
                  <NavLink key={item.path} to={`/projects/${projectId}${item.path}`} end={item.end} className={navLinkClass}>
                    <Icon name={item.icon} />
                    {t(item.labelKey)}
                  </NavLink>
                ))}
              </div>
            </>
          )}
        </nav>

        <div className="mt-4 flex flex-col gap-0.5 border-t border-border pt-3">
          <NavLink to="/settings" className={navLinkClass} onClick={() => setMenuOpen(false)}>
            <Icon name="settings" />
            {t('nav.settings')}
          </NavLink>
          <NavLink to="/profile" className={navLinkClass} onClick={() => setMenuOpen(false)}>
            <Avatar name={username} src={user?.avatar} size={20} />
            <span className="truncate">{username || t('nav.profile')}</span>
          </NavLink>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex items-center gap-2.5 rounded-md border border-transparent px-3 py-2 text-left text-sm text-fg-muted transition-colors duration-150 hover:text-fg"
          >
            <Icon name="logout" />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3 md:px-6">
          <button
            type="button"
            aria-label={t('nav.openMenu')}
            onClick={() => setMenuOpen(true)}
            className="rounded-md border border-border p-1.5 text-fg-muted transition-colors duration-150 hover:text-fg md:hidden"
          >
            <Icon name="menu" size={18} />
          </button>
          <GlobalSearch />
          <button
            type="button"
            onClick={openPalette}
            aria-label={t('cmdk.openHint')}
            className="hidden items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-fg-muted transition-colors duration-150 hover:text-fg md:flex"
          >
            <kbd className="font-mono">Ctrl</kbd>
            <kbd className="font-mono">K</kbd>
          </button>
          <div className="ml-auto flex items-center gap-3 text-sm text-fg-muted">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <NotificationsMenu />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          {/* Keyed by search too, so "?new=1" links remount the page and open its create form. */}
          <div key={pathname + search} className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
      {paletteOpen && (
        <CommandPalette
          commands={commands}
          workspaceId={currentWorkspace?.id}
          navigate={navigate}
          onClose={() => setPaletteOpen(false)}
        />
      )}
      {helpOpen && <ShortcutsHelp onClose={() => setHelpOpen(false)} />}
    </div>
  )
}
