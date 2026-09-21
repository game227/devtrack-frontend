import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { RedirectIfAuthenticated } from '../features/auth/RedirectIfAuthenticated'
import { RequireAuth } from '../features/auth/RequireAuth'
import { LandingPage } from '../pages/LandingPage'

// Every page except the landing page is code-split, so first load only ships what it needs.
const LoginPage = lazy(() => import('../pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('../pages/RegisterPage').then((m) => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('../pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })))
const DashboardPage = lazy(() => import('../pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const ProjectsPage = lazy(() => import('../pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })))
const ProjectDetailPage = lazy(() => import('../pages/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage })))
const ProjectBoardPage = lazy(() => import('../pages/ProjectBoardPage').then((m) => ({ default: m.ProjectBoardPage })))
const ProjectIssuesPage = lazy(() => import('../pages/ProjectIssuesPage').then((m) => ({ default: m.ProjectIssuesPage })))
const ProjectCyclesPage = lazy(() => import('../pages/ProjectCyclesPage').then((m) => ({ default: m.ProjectCyclesPage })))
const ProjectMilestonesPage = lazy(() => import('../pages/ProjectMilestonesPage').then((m) => ({ default: m.ProjectMilestonesPage })))
const ProjectNotesPage = lazy(() => import('../pages/ProjectNotesPage').then((m) => ({ default: m.ProjectNotesPage })))
const ProjectAnalyticsPage = lazy(() => import('../pages/ProjectAnalyticsPage').then((m) => ({ default: m.ProjectAnalyticsPage })))
const ProjectTimelinePage = lazy(() => import('../pages/ProjectTimelinePage').then((m) => ({ default: m.ProjectTimelinePage })))
const IssuesPage = lazy(() => import('../pages/IssuesPage').then((m) => ({ default: m.IssuesPage })))
const IssueDetailPage = lazy(() => import('../pages/IssueDetailPage').then((m) => ({ default: m.IssueDetailPage })))
const TeamsPage = lazy(() => import('../pages/TeamsPage').then((m) => ({ default: m.TeamsPage })))
const ProfilePage = lazy(() => import('../pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const SettingsPage = lazy(() => import('../pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

export function AppRoutes() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-fg-muted">…</p>}>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route element={<RedirectIfAuthenticated />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/projects/:id/board" element={<ProjectBoardPage />} />
            <Route path="/projects/:id/issues" element={<ProjectIssuesPage />} />
            <Route path="/projects/:id/cycles" element={<ProjectCyclesPage />} />
            <Route path="/projects/:id/milestones" element={<ProjectMilestonesPage />} />
            <Route path="/projects/:id/notes" element={<ProjectNotesPage />} />
            <Route path="/projects/:id/timeline" element={<ProjectTimelinePage />} />
            <Route path="/projects/:id/analytics" element={<ProjectAnalyticsPage />} />
            <Route path="/issues" element={<IssuesPage />} />
            <Route path="/issues/:id" element={<IssueDetailPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
