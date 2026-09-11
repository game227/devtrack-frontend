import type { Activity } from './activity'
import type { ProjectStatus } from './project'

export interface UpcomingDeadline {
  id: number
  title: string
  project: { id: number; name: string }
  due_date: string
  is_overdue: boolean
}

export interface ProjectProgress {
  id: number
  name: string
  status: ProjectStatus
  progress_percent: number
}

export interface DashboardData {
  workspace: { id: number; name: string }
  projects: {
    total: number
    active: number
    planned: number
    paused: number
    completed: number
    archived: number
  }
  issues: {
    total: number
    open: number
    done: number
  }
  upcoming_deadlines: UpcomingDeadline[]
  project_progress: ProjectProgress[]
  recent_activity: Activity[]
}
