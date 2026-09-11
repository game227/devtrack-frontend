import type { UserBrief } from './auth'

export interface DailyActivity {
  date: string
  count: number
}

export interface DeveloperAnalytics {
  user: UserBrief
  workspace: { id: number; name: string }
  projects_count: number
  tasks_completed: number
  issues_resolved: number
  open_assigned: number
  daily_activity: DailyActivity[]
}
