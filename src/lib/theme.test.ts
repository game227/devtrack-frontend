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
  SWEEP_DURATION_MS,
  sweepClipPath,
  sweepKeyframes,
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

  it('is light unless the user chose otherwise', () => {
    expect(DEFAULT_PREFERENCE).toBe('light')
    expect(readPreference()).toBe('light')
  })

  it('reads a saved choice and ignores garbage', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    expect(readPreference()).toBe('light')
    localStorage.setItem(THEME_STORAGE_KEY, 'purple')
    expect(readPreference()).toBe('light')
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
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute('content', '#cececc')
    applyTheme('dark')
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute('content', '#151515')
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
  afterEach(() => {
    vi.unstubAllGlobals()
    delete (document as unknown as { startViewTransition?: unknown }).startViewTransition
  })

  it('reveals the new theme from the left edge to the right one', () => {
    expect(sweepClipPath(0)).toBe('inset(0 100.00% 0 0)')
    expect(sweepClipPath(0.25)).toBe('inset(0 75.00% 0 0)')
    expect(sweepClipPath(1)).toBe('inset(0 0.00% 0 0)')
    expect(sweepClipPath(1.5)).toBe('inset(0 0.00% 0 0)') // clamped
    expect(sweepKeyframes()).toEqual([{ clipPath: sweepClipPath(0) }, { clipPath: sweepClipPath(1) }])
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

  it('sweeps the new theme in as a view transition when the look really changes', async () => {
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
    expect(keyframes).toEqual(sweepKeyframes())
    expect(options).toMatchObject({ pseudoElement: '::view-transition-new(root)', duration: SWEEP_DURATION_MS })
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
