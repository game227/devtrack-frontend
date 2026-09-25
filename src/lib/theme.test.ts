import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_PREFERENCE,
  THEME_STORAGE_KEY,
  applyTheme,
  getPreference,
  initTheme,
  readPreference,
  resolveTheme,
  setPreference,
  subscribePreference,
  WAVE_DURATION_MS,
  waveClipPath,
  waveKeyframes,
} from './theme'

function mockSystem(prefersDark: boolean) {
  const listeners: Array<() => void> = []
  const state = { dark: prefersDark }
  vi.stubGlobal('matchMedia', () => ({
    get matches() {
      return state.dark
    },
    addEventListener: (_type: string, listener: () => void) => listeners.push(listener),
    removeEventListener: () => {},
  }))
  return {
    flip(dark: boolean) {
      state.dark = dark
      listeners.forEach((listener) => listener())
    },
  }
}

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
    document.head.innerHTML = '<meta name="theme-color" content="#000000" />'
  })
  afterEach(() => vi.unstubAllGlobals())

  it('is dark unless the user chose otherwise', () => {
    expect(DEFAULT_PREFERENCE).toBe('dark')
    expect(readPreference()).toBe('dark')
  })

  it('reads a saved choice and ignores garbage', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    expect(readPreference()).toBe('light')
    localStorage.setItem(THEME_STORAGE_KEY, 'purple')
    expect(readPreference()).toBe('dark')
  })

  it('resolves "system" from the operating system and passes explicit choices through', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('applies a theme to <html> and to the browser chrome colour', () => {
    applyTheme('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute('content', '#ffffff')
    applyTheme('dark')
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute('content', '#000000')
  })

  it('saves a new choice, applies it and tells subscribers', () => {
    mockSystem(true)
    const listener = vi.fn()
    const unsubscribe = subscribePreference(listener)
    setPreference('light')
    expect(getPreference()).toBe('light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(listener).toHaveBeenCalledOnce()
    unsubscribe()
    setPreference('dark')
    expect(listener).toHaveBeenCalledOnce()
  })

  it('still applies the choice when storage is unavailable', () => {
    mockSystem(true)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => setPreference('light')).not.toThrow()
    expect(document.documentElement.dataset.theme).toBe('light')
    vi.restoreAllMocks()
  })

  it('follows the operating system while the choice is "system", and only then', () => {
    const system = mockSystem(false)
    localStorage.setItem(THEME_STORAGE_KEY, 'system')
    initTheme()
    expect(document.documentElement.dataset.theme).toBe('light')
    system.flip(true)
    expect(document.documentElement.dataset.theme).toBe('dark')

    setPreference('light')
    system.flip(true)
    expect(document.documentElement.dataset.theme).toBe('light') // an explicit choice wins over the OS
  })
})

describe('theme switch animation', () => {
  const points = (path: string) =>
    [...path.matchAll(/([\d.]+)% ([\d.]+)%/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]) }))

  afterEach(() => {
    vi.unstubAllGlobals()
    delete (document as unknown as { startViewTransition?: unknown }).startViewTransition
  })

  it('starts fully clipped, ends fully open, and the front only moves down', () => {
    const start = points(waveClipPath(0))
    const end = points(waveClipPath(1))
    expect(Math.max(...start.map((p) => p.y))).toBeLessThanOrEqual(0.01)
    expect(Math.min(...end.slice(2).map((p) => p.y))).toBeGreaterThanOrEqual(100) // the two top corners stay at 0
    const fronts = [0, 0.25, 0.5, 0.75, 1].map((p) => {
      const ys = points(waveClipPath(p)).slice(2).map((pt) => pt.y)
      return ys.reduce((a, b) => a + b, 0) / ys.length
    })
    expect(fronts).toEqual([...fronts].sort((a, b) => a - b))
  })

  it('has a rippling (not flat) front in the middle of the sweep', () => {
    const ys = points(waveClipPath(0.5)).slice(2).map((p) => p.y)
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(5)
  })

  it('is a valid polygon spanning the full width', () => {
    const path = waveClipPath(0.4)
    expect(path.startsWith('polygon(0% 0%, 100% 0%')).toBe(true)
    const xs = points(path).map((p) => p.x)
    expect(Math.min(...xs)).toBe(0)
    expect(Math.max(...xs)).toBe(100)
  })

  it('produces a smooth run of keyframes from closed to open', () => {
    const frames = waveKeyframes()
    expect(frames.length).toBeGreaterThan(30)
    expect(frames[0].clipPath).toBe(waveClipPath(0))
    expect(frames[frames.length - 1].clipPath).toBe(waveClipPath(1))
  })

  function stubViewTransitions(reducedMotion = false) {
    const animate = vi.fn()
    document.documentElement.animate = animate as unknown as typeof document.documentElement.animate
    const startViewTransition = vi.fn((update: () => void) => {
      update()
      return { ready: Promise.resolve() }
    })
    ;(document as unknown as { startViewTransition: unknown }).startViewTransition = startViewTransition
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: reducedMotion && query.includes('reduce'),
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    return { animate, startViewTransition }
  }

  it('flows the new theme in as a view transition when the look really changes', async () => {
    const { animate, startViewTransition } = stubViewTransitions()
    setPreference('dark')
    await Promise.resolve()
    await Promise.resolve()
    startViewTransition.mockClear()
    animate.mockClear()
    setPreference('light')
    expect(startViewTransition).toHaveBeenCalledOnce()
    expect(document.documentElement.dataset.theme).toBe('light')
    await Promise.resolve()
    await Promise.resolve()
    expect(animate).toHaveBeenCalledOnce()
    const [keyframes, options] = animate.mock.calls[0]
    expect(keyframes.length).toBeGreaterThan(30)
    expect(options).toMatchObject({ pseudoElement: '::view-transition-new(root)', duration: WAVE_DURATION_MS })
  })

  it('does not animate when nothing visibly changes', () => {
    const { startViewTransition } = stubViewTransitions()
    setPreference('dark')
    startViewTransition.mockClear()
    setPreference('dark')
    expect(startViewTransition).not.toHaveBeenCalled()
  })

  it('switches instantly for people who prefer reduced motion', () => {
    const { startViewTransition } = stubViewTransitions(true)
    setPreference('dark')
    setPreference('light')
    expect(startViewTransition).not.toHaveBeenCalled()
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('falls back to an instant switch where View Transitions do not exist', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }))
    setPreference('dark')
    setPreference('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
