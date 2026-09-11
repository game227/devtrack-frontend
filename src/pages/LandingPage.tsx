import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'

const FEATURES = [
  {
    title: 'Project Health',
    body: 'A rule-based health score for every project — task progress, deadlines, bug rate, and activity, at a glance.',
  },
  {
    title: 'GitHub-aware',
    body: 'Issues, branches, commits, and pull requests tell one connected story instead of living in separate tabs.',
  },
  {
    title: 'Built for small teams',
    body: 'Jira-grade issue tracking with Linear-grade speed — workspaces, cycles, and kanban without the ceremony.',
  },
]

export function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth()

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-sm font-semibold tracking-tight">DevTrack</span>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/login" className="text-fg-muted hover:text-fg">
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-accent px-3 py-1.5 font-medium text-white hover:opacity-90"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-16 sm:pt-24">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Manage the work. Understand the development.
          </h1>
          <p className="mt-4 text-base text-fg-muted sm:text-lg">
            DevTrack combines Jira-strength issue tracking with Linear-speed workflows, plus
            development-intelligence — project health, activity timelines, and developer
            analytics — that plain project management tools don't have.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/register"
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              Create a free workspace
            </Link>
            <Link
              to="/login"
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-fg hover:border-accent"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-lg border border-border bg-bg-elevated p-5">
              <h2 className="text-sm font-semibold text-fg">{feature.title}</h2>
              <p className="mt-2 text-sm text-fg-muted">{feature.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
