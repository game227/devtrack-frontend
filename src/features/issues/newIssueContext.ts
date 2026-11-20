import { createContext, useContext } from 'react'
import type { IssueStatus } from '../../types/issue'

// Opens the "New issue" dialog from anywhere inside the app layout (top bar, the C shortcut, the
// command palette, empty states, `?new=1` links, a board column's "+"). The project, and the station
// the issue starts at, are preselected when given.
export const NewIssueContext = createContext<(projectId?: number | null, status?: IssueStatus) => void>(() => {})

export function useNewIssue() {
  return useContext(NewIssueContext)
}
