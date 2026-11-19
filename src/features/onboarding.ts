// Whether the "getting started" steps were hidden in this browser, per workspace.
function key(workspaceId: number) {
  return `devtrack_onboarding_hidden:${workspaceId}`
}

export function readOnboardingHidden(workspaceId: number): boolean {
  try {
    return localStorage.getItem(key(workspaceId)) === '1'
  } catch {
    return false
  }
}

export function writeOnboardingHidden(workspaceId: number) {
  try {
    localStorage.setItem(key(workspaceId), '1')
  } catch {
    // Storage unavailable: hidden until the page is reloaded.
  }
}
