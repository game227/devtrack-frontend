// Global keyboard shortcuts. Kept free of React so the key handling is easy to reason about and test.

export interface ShortcutActions {
  openPalette: () => void
  toggleHelp: () => void
  newIssue: () => void
  go: (target: 'dashboard' | 'projects' | 'issues' | 'teams' | 'board') => void
}

// After pressing G, the next key within this window completes a "go to" shortcut.
export const SEQUENCE_TIMEOUT_MS = 1200

const GO_TARGETS: Record<string, Parameters<ShortcutActions['go']>[0]> = {
  d: 'dashboard',
  p: 'projects',
  i: 'issues',
  t: 'teams',
  b: 'board',
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

export interface ShortcutState {
  // Time (ms) when G was pressed, or null when no "go to" sequence is pending.
  pendingGoAt: number | null
}

// Returns true when the event was a shortcut (so the caller can preventDefault).
export function handleShortcut(
  event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey' | 'target'>,
  state: ShortcutState,
  actions: ShortcutActions,
  now: number = Date.now(),
): boolean {
  // Ctrl/Cmd+K works everywhere, even while typing in a field.
  if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
    state.pendingGoAt = null
    actions.openPalette()
    return true
  }

  if (event.ctrlKey || event.metaKey || event.altKey || isTypingTarget(event.target)) return false

  const key = event.key.toLowerCase()

  if (state.pendingGoAt !== null) {
    const fresh = now - state.pendingGoAt <= SEQUENCE_TIMEOUT_MS
    state.pendingGoAt = null
    const target = GO_TARGETS[key]
    if (fresh && target) {
      actions.go(target)
      return true
    }
  }

  if (event.key === '?') {
    actions.toggleHelp()
    return true
  }
  if (key === 'g' && !event.shiftKey) {
    state.pendingGoAt = now
    return true
  }
  if (key === 'c' && !event.shiftKey) {
    actions.newIssue()
    return true
  }
  return false
}
