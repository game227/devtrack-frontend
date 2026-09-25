// Colour theme: dark (the default, DevTrack's own look), light, or follow the operating system.
// The choice is remembered per browser; the theme itself is just a data-theme attribute on <html>
// that flips the colour tokens in styles/index.css. index.html applies it before first paint —
// keep the storage key and default there in step with this file.

export type ThemePreference = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'devtrack_theme'
export const DEFAULT_PREFERENCE: ThemePreference = 'dark'
export const THEME_PREFERENCES: ThemePreference[] = ['light', 'dark', 'system']

const DARK_QUERY = '(prefers-color-scheme: dark)'
const THEME_COLOR: Record<ResolvedTheme, string> = { dark: '#000000', light: '#ffffff' }

export function isPreference(value: unknown): value is ThemePreference {
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

export function systemPrefersDark(): boolean {
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
// The new theme flows down over the old one like water: a wavy front travels from the top edge of the
// viewport to the bottom, ripples drifting along it. It is a View Transition — the browser holds a
// picture of the old page and of the new one, and we animate a clip-path on the new one — so nothing in
// the app re-renders differently. Browsers without View Transitions (and people who prefer reduced
// motion) simply get the instant switch.

export const WAVE_DURATION_MS = 1300
const WAVE_FRAMES = 56
const WAVE_COLUMNS = 26 // points along the front
const WAVE_AMPLITUDE = 7 // how tall the ripples are, in % of the viewport height
const WAVE_RIPPLES = 1.6 // how many crests fit across the width

const clampPercent = (value: number) => Math.min(100 + WAVE_AMPLITUDE * 2, Math.max(0, value))

// The visible (new-theme) region at `progress` 0..1: everything above a rippling front. At 0 nothing is
// revealed, at 1 everything is; the ripples drift sideways as the front descends.
export function waveClipPath(progress: number): string {
  const front = -WAVE_AMPLITUDE + progress * (100 + 2 * WAVE_AMPLITUDE)
  const points = ['0% 0%', '100% 0%']
  for (let column = WAVE_COLUMNS; column >= 0; column--) {
    const x = (column / WAVE_COLUMNS) * 100
    const phase = (x / 100) * Math.PI * 2 * WAVE_RIPPLES + progress * Math.PI * 2 * 2.5
    const y = clampPercent(front + WAVE_AMPLITUDE * Math.sin(phase))
    points.push(`${x.toFixed(1)}% ${y.toFixed(2)}%`)
  }
  return `polygon(${points.join(', ')})`
}

// Ease in and out so the wave gathers, sweeps and settles rather than moving at a constant speed.
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

export function waveKeyframes(): { clipPath: string }[] {
  return Array.from({ length: WAVE_FRAMES + 1 }, (_, i) => ({ clipPath: waveClipPath(easeInOut(i / WAVE_FRAMES)) }))
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { ready: Promise<void> }
}

export function applyThemeAnimated(theme: ResolvedTheme) {
  const doc = document as ViewTransitionDocument
  if (typeof doc.startViewTransition !== 'function' || prefersReducedMotion()) {
    applyTheme(theme)
    return
  }
  const transition = doc.startViewTransition(() => applyTheme(theme))
  transition.ready
    .then(() => {
      document.documentElement.animate(waveKeyframes(), {
        duration: WAVE_DURATION_MS,
        easing: 'linear', // the easing is baked into the keyframes above
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
  // Only a real change of look gets the flowing animation (choosing "system" while it already
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
