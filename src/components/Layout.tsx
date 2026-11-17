import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getProject } from '../api/projects'
import { useAuth } from '../features/auth/authContext'
import { NewIssueDialog } from '../features/issues/NewIssueDialog'
import { NewIssueContext } from '../features/issues/newIssueContext'
import { useLiveUpdates } from '../features/live/useLiveUpdates'
import { useWorkspace } from '../features/workspace/workspaceContext'
import { buildCommands } from '../features/shortcuts/commands'
import { handleShortcut } from '../features/shortcuts/shortcuts'
import type { ShortcutState } from '../features/shortcuts/shortcuts'
import { LANGS, useI18n } from '../i18n'
import type { Issue, IssueStatus } from '../types/issue'
import { useToast } from '../features/toast/toastContext'
import { Avatar } from './Avatar'
import { StatusBadge } from './Badge'
import { CommandPalette } from './CommandPalette'
import { Icon } from './Icon'
import { LanguageSwitcher } from './LanguageSwitcher'
import { NotificationsMenu } from './NotificationsMenu'
import { Popover } from './Popover'
import { ShortcutsHelp } from './ShortcutsHelp'
import { ThemeSwitcher } from './ThemeSwitcher'
import { Logo } from './Track'
import { button, iconButton, kbd } from './ui'

const MAIN_NAV: Array<{ to: string; labelKey: string }> = [
  { to: '/dashboard', labelKey: 'nav.dashboard' },
  { to: '/projects', labelKey: 'nav.projects' },
  { to: '/issues', labelKey: 'nav.issues' },
  { to: '/teams', labelKey: 'nav.teams' },
  { to: '/members', labelKey: 'nav.members' },
]

const PROJECT_NAV: Array<{ path: string; labelKey: string; end?: boolean }> = [
  { path: '', labelKey: 'nav.overview', end: true },
  { path: '/board', labelKey: 'nav.board' },
  { path: '/issues', labelKey: 'nav.issues' },
  { path: '/cycles', labelKey: 'nav.cycles' },
  { path: '/milestones', labelKey: 'nav.milestones' },
  { path: '/notes', labelKey: 'nav.notes' },
  { path: '/timeline', labelKey: 'nav.timeline' },
  { path: '/analytics', labelKey: 'nav.analytics' },
]

// The current section is marked by a stretch of the line under it (the same brand rail as the logo).
// The current section is a light pill lifted off the glass bar.
function topLinkClass({ isActive }: { isActive: boolean }) {
  return `flex h-9 items-center rounded-lg px-3 text-sm font-medium transition-[background-color,color,box-shadow] duration-150 ${
    isActive ? 'bg-brand-soft text-fg shadow-panel' : 'text-fg-muted hover:bg-surface/60 hover:text-fg'
  }`
}

function tabLinkClass({ isActive }: { isActive: boolean }) {
  return `flex h-8 shrink-0 items-center rounded-lg px-3 text-[13px] font-medium transition-[background-color,color,box-shadow] duration-150 ${
    isActive ? 'bg-brand-soft text-fg shadow-panel' : 'text-fg-muted hover:text-fg'
  }`
}

function WorkspaceSwitcher() {
  const { t } = useI18n()
  const { currentWorkspace, workspaces, selectWorkspace } = useWorkspace()
  if (!currentWorkspace) return null
  if (workspaces.length < 2) {
    return <span className="max-w-44 truncate text-sm font-semibold text-fg-muted">{currentWorkspace.name}</span>
  }
  return (
    <Popover
      label={t('shell.workspaceMenu', { name: currentWorkspace.name })}
      align="left"
      panelClassName="w-64 p-1.5"
      triggerClassName="flex h-9 max-w-52 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-fg-muted transition-colors duration-150 hover:bg-brand-soft/60 hover:text-fg"
      trigger={
        <>
          <span className="truncate">{currentWorkspace.name}</span>
          <Icon name="chevronDown" size={14} />
        </>
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

function UserMenu({ onShortcuts }: { onShortcuts: () => void }) {
  const { t } = useI18n()
  const { user, logout } = useAuth()
  const username = user?.username ?? ''
  const item = 'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-fg hover:bg-brand-soft/60'
  return (
    <Popover
      label={t('shell.account', { name: username })}
      panelClassName="w-72 p-1.5"
      triggerClassName="flex h-9 items-center gap-1 rounded-full pl-0.5 pr-1.5 text-fg-muted transition-colors duration-150 hover:bg-brand-soft/60 hover:text-fg"
      trigger={
        <>
          <Avatar name={username} src={user?.avatar} size={30} />
          <Icon name="chevronDown" size={14} />
        </>
      }
    >
      <>
          <div className="flex items-center gap-3 px-2.5 py-2.5">
            <Avatar name={username} src={user?.avatar} size={36} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-fg">{username}</p>
              {user?.email && <p className="truncate text-xs text-fg-muted">{user.email}</p>}
            </div>
          </div>
          <div className="border-t border-border py-1">
            <Link to="/profile" className={item}>
              <Icon name="profile" className="text-fg-muted" />
              {t('nav.profile')}
            </Link>
            <Link to="/settings" className={item}>
              <Icon name="settings" className="text-fg-muted" />
              {t('nav.settings')}
            </Link>
            <button type="button" data-closes onClick={onShortcuts} className={item}>
              <Icon name="keyboard" className="text-fg-muted" />
              <span className="flex-1">{t('cmdk.showShortcuts')}</span>
              <kbd className={kbd}>?</kbd>
            </button>
          </div>
          <div className="flex flex-col gap-2 border-t border-border px-2.5 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-fg-muted">{t('theme.label')}</span>
              <ThemeSwitcher />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-fg-muted">{t('lang.switch')}</span>
              <LanguageSwitcher />
            </div>
          </div>
          <div className="border-t border-border pt-1">
            <button type="button" data-closes onClick={() => void logout()} className={item}>
              <Icon name="logout" className="text-fg-muted" />
              {t('nav.logout')}
            </button>
          </div>
      </>
    </Popover>
  )
}

export function Layout() {
  const { t, lang, setLang } = useI18n()
  const { logout } = useAuth()
  const { currentWorkspace, workspaces, selectWorkspace } = useWorkspace()
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  // undefined: closed; null: open with no project chosen yet; a number: open for that project.
  const [newIssueFor, setNewIssueFor] = useState<number | null | undefined>(undefined)
  const [newIssueStatus, setNewIssueStatus] = useState<IssueStatus | undefined>(undefined)
  const toast = useToast()
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const projectMatch = useMatch({ path: '/projects/:id', end: false })
  const projectId = projectMatch ? Number(projectMatch.params.id) : NaN
  const inProject = Number.isFinite(projectId)
  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId),
    enabled: inProject,
  })

  const currentProjectId = inProject ? projectId : null

  const openNewIssue = useCallback((project?: number | null, status?: IssueStatus) => {
    setPaletteOpen(false)
    setHelpOpen(false)
    setNewIssueStatus(status)
    setNewIssueFor(project ?? null)
  }, [])

  function issueCreated(issue: Issue) {
    setNewIssueFor(undefined)
    void queryClient.invalidateQueries({ queryKey: ['issues'] })
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    // On that project's own pages the new issue appears where you are (with a link to it); anywhere
    // else, open it.
    if (pathname.startsWith(`/projects/${issue.project}`)) {
      toast({ text: t('newIssue.created', { number: issue.number }), action: { label: t('shell.open'), to: `/issues/${issue.id}` } })
    } else {
      navigate(`/issues/${issue.id}`)
    }
  }

  const commands = useMemo(
    () =>
      buildCommands({
        t,
        navigate,
        projectId: currentProjectId,
        toggleLanguage: () => setLang(LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length]),
        logout: () => void logout(),
        showShortcuts: () => setHelpOpen(true),
        newIssue: () => openNewIssue(currentProjectId),
      }),
    [t, navigate, currentProjectId, lang, setLang, logout, openNewIssue],
  )

  // Global shortcuts read the latest route/project through a ref so the listener is bound only once.
  const shortcutContext = useRef({ currentProjectId, navigate, openNewIssue })
  useEffect(() => {
    shortcutContext.current = { currentProjectId, navigate, openNewIssue }
  }, [currentProjectId, navigate, openNewIssue])
  const shortcutState = useRef<ShortcutState>({ pendingGoAt: null })
  // Ctrl/Cmd+K toggles the palette; the search button (only reachable while it is closed) opens it.
  const openPalette = useCallback(() => {
    setHelpOpen(false)
    setPaletteOpen((open) => !open)
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const { currentProjectId: pid, navigate: navigateTo, openNewIssue: newIssue } = shortcutContext.current
      // Navigating from a shortcut also dismisses the shortcuts list if it is showing.
      const go = (to: string) => {
        setHelpOpen(false)
        navigateTo(to)
      }
      const handled = handleShortcut(event, shortcutState.current, {
        openPalette,
        toggleHelp: () => setHelpOpen((open) => !open),
        newIssue: () => newIssue(pid),
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

  useLiveUpdates(currentWorkspace?.id)

  // The mobile menu: Escape closes it and focus goes back to the button that opened it.
  useEffect(() => {
    if (!menuOpen) return undefined
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  // Every page is called "DevTrack" otherwise, so tabs, history and screen readers cannot tell them apart
  // (WCAG 2.4.2). The page's own <h1> names it; it is read from the DOM because most headings appear only
  // after the page's data has loaded. A polite live region says it after each navigation within the app,
  // never for the page the user landed on (even when that page's heading only appears later).
  const [announcement, setAnnouncement] = useState('')
  const lastPath = useRef<string | null>(null)
  useEffect(() => {
    const main = document.getElementById('main-content')
    if (!main) return undefined
    const isNavigation = lastPath.current !== null && lastPath.current !== pathname
    lastPath.current = pathname
    let announced = ''
    let pending: number | null = null
    const syncTitle = () => {
      pending = null
      const heading = main.querySelector('h1')?.textContent?.trim()
      const title = heading ? `${heading} · DevTrack` : 'DevTrack'
      if (document.title !== title) document.title = title
      if (isNavigation && heading && heading !== announced) {
        announced = heading
        // Two pages can share a heading ("Board"): toggle an invisible character so the live region's
        // text still changes and is read out again.
        setAnnouncement((previous) => (previous === heading ? `${heading}​` : heading))
      }
    }
    syncTitle()
    // Bursts of DOM changes (a list re-rendering, a refetch) are folded into one check.
    const observer = new MutationObserver(() => {
      pending ??= window.setTimeout(syncTitle, 50)
    })
    observer.observe(main, { childList: true, subtree: true, characterData: true })
    return () => {
      observer.disconnect()
      if (pending !== null) window.clearTimeout(pending)
      // Pages outside this layout (sign-in, landing, legal) must not keep the last page's title.
      document.title = 'DevTrack'
    }
  }, [pathname])

  const project = projectQuery.data

  return (
    <NewIssueContext.Provider value={openNewIssue}>
      <div className="min-h-screen bg-bg text-fg">
        <div role="status" aria-live="polite" className="sr-only">
          {announcement}
        </div>
        {/* First stop for keyboard users: jump past the navigation to the page itself (WCAG 2.4.1). */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-brand focus:px-3 focus:py-2 focus:text-sm focus:font-bold focus:text-on-brand"
        >
          {t('nav.skipToContent')}
        </a>

        {/* A floating glass bar: it keeps a margin from the edges and blurs what scrolls beneath it. */}
        <header className="sticky top-0 z-30 px-2 pt-2 sm:px-3 sm:pt-3 lg:px-6">
          <div className="glass mx-auto flex h-14 max-w-[1600px] items-center gap-1 rounded-2xl px-2 sm:gap-2 lg:px-3">
            <button
              ref={menuButtonRef}
              type="button"
              aria-label={t('nav.openMenu')}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
              className={`${iconButton()} lg:hidden`}
            >
              <Icon name="menu" size={18} />
            </button>
            <NavLink to="/dashboard" className="mr-1 flex h-9 items-center rounded-md px-1">
              <Logo />
            </NavLink>
            <div className="hidden md:block">
              <WorkspaceSwitcher />
            </div>
            <nav aria-label={t('nav.mainNavigation')} className="ml-2 hidden items-center gap-0.5 lg:flex">
              {MAIN_NAV.map((item) => (
                <NavLink key={item.to} to={item.to} className={topLinkClass}>
                  {t(item.labelKey)}
                </NavLink>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={openPalette}
                // The visible text is "Search" and the shortcut, so the accessible name contains both (WCAG 2.5.3).
                aria-label={t('shell.searchHint')}
                aria-keyshortcuts="Control+K"
                className="flex h-10 items-center gap-2 rounded-xl border border-fg/15 bg-surface/50 px-3 text-sm text-fg-muted transition-colors duration-150 hover:bg-surface/90 hover:text-fg max-md:w-10 max-md:justify-center max-md:border-transparent max-md:bg-transparent max-md:px-0 md:w-56"
              >
                <Icon name="search" />
                <span className="hidden flex-1 text-left md:inline">{t('shell.search')}</span>
                <kbd className={`${kbd} hidden md:inline`}>Ctrl K</kbd>
              </button>
              <button type="button" onClick={() => openNewIssue(currentProjectId)} className={button('primary', 'sm')}>
                <Icon name="plus" />
                <span className="max-sm:sr-only">{t('issues.new')}</span>
              </button>
              {/* What is on screen keeps itself current (useLiveUpdates); this says so. */}
              <span title={t('shell.live')} className="relative hidden h-9 w-5 items-center justify-center sm:flex">
                <span className="sr-only">{t('shell.live')}</span>
                <span aria-hidden="true" className="live-ring absolute h-2 w-2 rounded-full bg-orange" />
                <span aria-hidden="true" className="relative h-2 w-2 rounded-full bg-orange" />
              </span>
              <NotificationsMenu />
              <UserMenu onShortcuts={() => setHelpOpen(true)} />
            </div>
          </div>
        </header>

        {menuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button type="button" aria-label={t('nav.closeMenu')} tabIndex={-1} onClick={() => setMenuOpen(false)} className="absolute inset-0 bg-scrim" />
            <div className="glass absolute inset-y-2 left-2 flex w-72 max-w-[85vw] animate-slide-in-left flex-col rounded-2xl shadow-float">
              <div className="flex h-14 items-center justify-between border-b border-border px-3">
                <Logo />
                <button type="button" autoFocus aria-label={t('nav.closeMenu')} onClick={() => setMenuOpen(false)} className={iconButton()}>
                  <Icon name="close" size={18} />
                </button>
              </div>
              {workspaces.length > 1 && currentWorkspace && (
                <label className="block border-b border-border px-4 py-3 text-xs font-semibold text-fg-muted">
                  {t('nav.switchWorkspace')}
                  <select
                    value={currentWorkspace.id}
                    onChange={(event) => selectWorkspace(Number(event.target.value))}
                    className="mt-1.5 block w-full rounded-md border border-border-strong bg-surface px-2.5 py-2 text-sm font-normal text-fg"
                  >
                    {workspaces.map((workspace) => (
                      <option key={workspace.id} value={workspace.id}>
                        {workspace.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <nav
                aria-label={t('nav.mainNavigation')}
                className="flex flex-col gap-0.5 p-2"
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest('a')) setMenuOpen(false)
                }}
              >
                {MAIN_NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium ${
                        isActive ? 'bg-brand-soft text-fg shadow-panel' : 'text-fg-muted hover:bg-surface/60 hover:text-fg'
                      }`
                    }
                  >
                    {t(item.labelKey)}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        )}

        {inProject && (
          // The project's name and its sections form one navigation landmark (nothing outside landmarks).
          <nav aria-label={t('shell.projectSections')}>
            <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-4 gap-y-3 px-4 pt-6 lg:px-7">
              <div className="flex min-w-0 items-center gap-3">
                <Link to={`/projects/${projectId}`} className="flex min-w-0 items-center gap-2.5 rounded-lg">
                  <span
                    aria-hidden="true"
                    className="btn-ink flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold"
                  >
                    {project?.icon || project?.name.slice(0, 1).toUpperCase() || ''}
                  </span>
                  <span className="truncate text-[15px] font-semibold text-fg">{project?.name ?? t('nav.sectionProject')}</span>
                </Link>
                {project && <StatusBadge status={project.status} />}
              </div>
              <div className="glass scroll-quiet flex max-w-full gap-0.5 overflow-x-auto rounded-xl p-1 lg:ml-auto">
                {PROJECT_NAV.map((item) => (
                  <NavLink key={item.path} to={`/projects/${projectId}${item.path}`} end={item.end} className={tabLinkClass}>
                    {t(item.labelKey)}
                  </NavLink>
                ))}
              </div>
            </div>
          </nav>
        )}

        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1600px] px-4 py-7 outline-none lg:px-7 lg:py-9">
          {/* Keyed by search too, so "?new=1" links remount the page and open its create form. */}
          <div key={pathname + search} className="animate-fade-in">
            <Outlet />
          </div>
        </main>

        {paletteOpen && (
          <CommandPalette commands={commands} workspaceId={currentWorkspace?.id} navigate={navigate} onClose={() => setPaletteOpen(false)} />
        )}
        {helpOpen && <ShortcutsHelp onClose={() => setHelpOpen(false)} />}
        {newIssueFor !== undefined && (
          <NewIssueDialog
            initialProjectId={newIssueFor}
            initialStatus={newIssueStatus}
            onClose={() => setNewIssueFor(undefined)}
            onCreated={issueCreated}
          />
        )}
      </div>
    </NewIssueContext.Provider>
  )
}
