export interface Command {
  id: string
  label: string
  group: 'navigate' | 'create' | 'other'
  // Shown on the right as a hint, e.g. "G D"; the actual binding lives in shortcuts.ts.
  shortcut?: string
  run: () => void
}

interface BuildContext {
  t: (key: string) => string
  navigate: (to: string) => void
  // The project whose pages are open right now, if any.
  projectId: number | null
  toggleLanguage: () => void
  logout: () => void
  showShortcuts: () => void
}

// Where the "new issue" action goes: straight to the create form of the current project, or to the
// projects list (where you pick one) when no project is open.
export function newIssuePath(projectId: number | null): string {
  return projectId === null ? '/projects' : `/projects/${projectId}/issues?new=1`
}

export function buildCommands({ t, navigate, projectId, toggleLanguage, logout, showShortcuts }: BuildContext): Command[] {
  const go = (to: string) => () => navigate(to)
  const commands: Command[] = [
    { id: 'go-dashboard', group: 'navigate', label: t('cmdk.goDashboard'), shortcut: 'G D', run: go('/dashboard') },
    { id: 'go-projects', group: 'navigate', label: t('cmdk.goProjects'), shortcut: 'G P', run: go('/projects') },
    { id: 'go-issues', group: 'navigate', label: t('cmdk.goIssues'), shortcut: 'G I', run: go('/issues') },
    { id: 'go-teams', group: 'navigate', label: t('cmdk.goTeams'), shortcut: 'G T', run: go('/teams') },
    { id: 'go-settings', group: 'navigate', label: t('cmdk.goSettings'), run: go('/settings') },
    { id: 'go-profile', group: 'navigate', label: t('cmdk.goProfile'), run: go('/profile') },
  ]

  if (projectId !== null) {
    const base = `/projects/${projectId}`
    commands.push(
      { id: 'p-board', group: 'navigate', label: t('cmdk.goBoard'), shortcut: 'G B', run: go(`${base}/board`) },
      { id: 'p-issues', group: 'navigate', label: t('cmdk.goProjectIssues'), run: go(`${base}/issues`) },
      { id: 'p-cycles', group: 'navigate', label: t('cmdk.goCycles'), run: go(`${base}/cycles`) },
      { id: 'p-milestones', group: 'navigate', label: t('cmdk.goMilestones'), run: go(`${base}/milestones`) },
      { id: 'p-notes', group: 'navigate', label: t('cmdk.goNotes'), run: go(`${base}/notes`) },
      { id: 'p-timeline', group: 'navigate', label: t('cmdk.goTimeline'), run: go(`${base}/timeline`) },
      { id: 'p-analytics', group: 'navigate', label: t('cmdk.goAnalytics'), run: go(`${base}/analytics`) },
    )
  }

  commands.push(
    { id: 'new-issue', group: 'create', label: t('cmdk.newIssue'), shortcut: 'C', run: go(newIssuePath(projectId)) },
    { id: 'new-project', group: 'create', label: t('cmdk.newProject'), run: go('/projects?new=1') },
    { id: 'shortcuts', group: 'other', label: t('cmdk.showShortcuts'), shortcut: '?', run: showShortcuts },
    { id: 'language', group: 'other', label: t('cmdk.toggleLanguage'), run: toggleLanguage },
    { id: 'logout', group: 'other', label: t('cmdk.logout'), run: logout },
  )
  return commands
}

// Case-insensitive match: every word the user typed must appear somewhere in the label.
export function filterCommands(commands: Command[], query: string): Command[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return commands
  return commands.filter((command) => {
    const label = command.label.toLowerCase()
    return words.every((word) => label.includes(word))
  })
}
