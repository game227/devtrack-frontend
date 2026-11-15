import { createContext, useContext } from 'react'

// Opens the "New issue" dialog from anywhere inside the app layout (top bar, the C shortcut, the
// command palette, empty states, `?new=1` links). The project is preselected when one is given.
export const NewIssueContext = createContext<(projectId?: number | null) => void>(() => {})

export function useNewIssue() {
  return useContext(NewIssueContext)
}
