import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { useWorkspace } from '../features/workspace/WorkspaceContext'
import { GlobalSearch } from './GlobalSearch'
import { NotificationsMenu } from './NotificationsMenu'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/projects', label: 'Projects' },
  { to: '/issues', label: 'Issues' },
  { to: null, label: 'Cycles' },
  { to: '/teams', label: 'Teams' },
  { to: null, label: 'Analytics' },
]

export function Layout() {
  const { user, logout } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen bg-bg text-fg">
      <aside className="w-56 shrink-0 border-r border-border p-4">
        <div className="mb-6">
          <div className="text-lg font-semibold">DevTrack</div>
          {currentWorkspace && (
            <div className="truncate text-xs text-fg-muted">{currentWorkspace.name}</div>
          )}
        </div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) =>
            item.to ? (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `rounded px-3 py-2 text-sm transition-colors duration-150 ${
                    isActive ? 'bg-bg-elevated text-fg' : 'text-fg-muted hover:bg-bg-elevated'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ) : (
              <span key={item.label} className="cursor-default rounded px-3 py-2 text-sm text-fg-muted/50">
                {item.label}
              </span>
            ),
          )}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-3">
          <GlobalSearch />
          <div className="flex items-center gap-4 text-sm text-fg-muted">
            <NotificationsMenu />
            <NavLink to="/settings" className="transition-colors duration-150 hover:text-fg">
              Settings
            </NavLink>
            <NavLink to="/profile" className="transition-colors duration-150 hover:text-fg">
              {user?.username ?? 'Profile'}
            </NavLink>
            <button type="button" onClick={() => void logout()} className="transition-colors duration-150 hover:text-fg">
              Log out
            </button>
          </div>
        </header>
        <main className="flex-1 p-6">
          <div key={pathname} className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
