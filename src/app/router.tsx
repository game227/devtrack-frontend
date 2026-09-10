import { Route, Routes } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { LandingPage } from '../pages/LandingPage'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'
import { DashboardPage } from '../pages/DashboardPage'
import { ProjectsPage } from '../pages/ProjectsPage'
import { ProjectDetailPage } from '../pages/ProjectDetailPage'
import { ProjectBoardPage } from '../pages/ProjectBoardPage'
import { ProjectIssuesPage } from '../pages/ProjectIssuesPage'
import { ProjectCyclesPage } from '../pages/ProjectCyclesPage'
import { ProjectAnalyticsPage } from '../pages/ProjectAnalyticsPage'
import { IssuesPage } from '../pages/IssuesPage'
import { IssueDetailPage } from '../pages/IssueDetailPage'
import { TeamsPage } from '../pages/TeamsPage'
import { ProfilePage } from '../pages/ProfilePage'
import { SettingsPage } from '../pages/SettingsPage'
import { NotFoundPage } from '../pages/NotFoundPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<Layout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/projects/:id/board" element={<ProjectBoardPage />} />
        <Route path="/projects/:id/issues" element={<ProjectIssuesPage />} />
        <Route path="/projects/:id/cycles" element={<ProjectCyclesPage />} />
        <Route path="/projects/:id/analytics" element={<ProjectAnalyticsPage />} />
        <Route path="/issues" element={<IssuesPage />} />
        <Route path="/issues/:id" element={<IssueDetailPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
