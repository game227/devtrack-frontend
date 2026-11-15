// Colour theme: light (the default), dark, or follow the operating system.
// The choice is remembered per browser; the theme itself is just a data-theme attribute on <html>
// that flips the colour tokens in styles/index.css. index.html applies it before first paint —
// keep the storage key and default there in step with this file.

export type ThemePreference = 'system' | 'light' | 'dark'
type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'devtrack_theme'
export const DEFAULT_PREFERENCE: ThemePreference = 'light'
export const THEME_PREFERENCES: ThemePreference[] = ['light', 'dark', 'system']

const DARK_QUERY = '(prefers-color-scheme: dark)'
// Browser chrome colour: the page background of each theme (styles/index.css --color-bg).
const THEME_COLOR: Record<ResolvedTheme, string> = { dark: '#0d1317', light: '#ffffff' }

function isPreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (isPreference(stored)) return stored
  } catch {
    // localStorage unavailable (private mode, etc.) — fall through to the default.
  }
  return DEFAULT_PREFERENCE
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches
}

export function resolveTheme(preference: ThemePreference, prefersDark: boolean = systemPrefersDark()): ResolvedTheme {
  if (preference === 'system') return prefersDark ? 'dark' : 'light'
  return preference
}

export function applyTheme(theme: ResolvedTheme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
}

// --- the switch animation ------------------------------------------------------------------------
//
// The new theme slides in from the left behind a straight edge, like a train passing the platform. It
// is a View Transition — the browser holds a picture of the old page and of the new one, and we animate
// a clip-path on the new one — so nothing in the app re-renders differently. Browsers without View
// Transitions (and people who prefer reduced motion) simply get the instant switch.

export const SWEEP_DURATION_MS = 520

// The visible (new-theme) region at `progress` 0..1: everything left of the edge.
export function sweepClipPath(progress: number): string {
  const hidden = Math.min(100, Math.max(0, (1 - progress) * 100))
  return `inset(0 ${hidden.toFixed(2)}% 0 0)`
}

export function sweepKeyframes(): { clipPath: string }[] {
  return [{ clipPath: sweepClipPath(0) }, { clipPath: sweepClipPath(1) }]
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { ready: Promise<void> }
}

function applyThemeAnimated(theme: ResolvedTheme) {
  const doc = document as ViewTransitionDocument
  if (typeof doc.startViewTransition !== 'function' || prefersReducedMotion()) {
    applyTheme(theme)
    return
  }
  const transition = doc.startViewTransition(() => applyTheme(theme))
  transition.ready
    .then(() => {
      document.documentElement.animate(sweepKeyframes(), {
        duration: SWEEP_DURATION_MS,
        easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
        pseudoElement: '::view-transition-new(root)',
      })
    })
    .catch(() => {
      // The transition was skipped (e.g. the tab was hidden): the theme is already applied.
    })
}

// --- a tiny store so every switcher on screen stays in step -------------------------------------

let preference: ThemePreference = DEFAULT_PREFERENCE
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function getPreference(): ThemePreference {
  return preference
}

export function subscribePreference(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setPreference(next: ThemePreference) {
  const before = resolveTheme(preference)
  preference = next
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next)
  } catch {
    // Not persisted, but the choice still applies for this visit.
  }
  const after = resolveTheme(next)
  // Only a real change of look gets the sweep (choosing "system" while it already
  // matches, or re-clicking the current theme, is silent).
  if (before === after) applyTheme(after)
  else applyThemeAnimated(after)
  emit()
}

// Call once at start-up: read the saved choice, apply it, and follow the OS while the choice is "system".
export function initTheme() {
  preference = readPreference()
  applyTheme(resolveTheme(preference))
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    window.matchMedia(DARK_QUERY).addEventListener('change', () => {
      if (preference === 'system') applyTheme(resolveTheme('system'))
    })
  }
}
