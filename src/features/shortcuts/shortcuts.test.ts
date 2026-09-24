import { describe, expect, it, vi } from 'vitest'
import { buildCommands, filterCommands, newIssuePath } from './commands'
import { handleShortcut, SEQUENCE_TIMEOUT_MS } from './shortcuts'
import type { ShortcutState } from './shortcuts'

function setup() {
  const actions = { openPalette: vi.fn(), toggleHelp: vi.fn(), newIssue: vi.fn(), go: vi.fn() }
  const state: ShortcutState = { pendingGoAt: null }
  const press = (key: string, extra: Partial<KeyboardEvent> = {}, now = 0) =>
    handleShortcut(
      { key, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, target: document.body, ...extra },
      state,
      actions,
      now,
    )
  return { actions, state, press }
}

describe('handleShortcut', () => {
  it('opens the palette with Ctrl+K or Cmd+K, even from a text field', () => {
    const { actions, press } = setup()
    const input = document.createElement('input')
    expect(press('k', { ctrlKey: true, target: input })).toBe(true)
    expect(press('K', { metaKey: true })).toBe(true)
    expect(actions.openPalette).toHaveBeenCalledTimes(2)
  })

  it('creates an issue on C', () => {
    const { actions, press } = setup()
    expect(press('c')).toBe(true)
    expect(actions.newIssue).toHaveBeenCalledOnce()
  })

  it('ignores plain keys while typing in a field', () => {
    const { actions, press } = setup()
    const textarea = document.createElement('textarea')
    expect(press('c', { target: textarea })).toBe(false)
    expect(press('?', { target: textarea })).toBe(false)
    expect(actions.newIssue).not.toHaveBeenCalled()
    expect(actions.toggleHelp).not.toHaveBeenCalled()
  })

  it('completes "G then a letter" navigation within the timeout', () => {
    const { actions, press } = setup()
    press('g', {}, 1000)
    press('b', {}, 1500)
    expect(actions.go).toHaveBeenCalledWith('board')
  })

  it('drops a pending G once the timeout has passed', () => {
    const { actions, press } = setup()
    press('g', {}, 1000)
    press('d', {}, 1000 + SEQUENCE_TIMEOUT_MS + 1)
    expect(actions.go).not.toHaveBeenCalled()
  })

  it('does not leak the second key of an unfinished sequence into other shortcuts', () => {
    const { actions, press } = setup()
    press('g', {}, 0)
    press('x', {}, 10)
    press('d', {}, 20)
    expect(actions.go).not.toHaveBeenCalled()
  })

  it('shows help on ?', () => {
    const { actions, press } = setup()
    expect(press('?', { shiftKey: true })).toBe(true)
    expect(actions.toggleHelp).toHaveBeenCalledOnce()
  })
})

describe('commands', () => {
  const ctx = (projectId: number | null) => ({
    t: (key: string) => key,
    navigate: vi.fn(),
    projectId,
    toggleLanguage: vi.fn(),
    logout: vi.fn(),
    showShortcuts: vi.fn(),
  })

  it('only offers project pages while a project is open', () => {
    expect(buildCommands(ctx(null)).some((c) => c.id === 'p-board')).toBe(false)
    expect(buildCommands(ctx(7)).some((c) => c.id === 'p-board')).toBe(true)
  })

  it('routes "new issue" to the current project, or to the projects list', () => {
    expect(newIssuePath(7)).toBe('/projects/7/issues?new=1')
    expect(newIssuePath(null)).toBe('/projects')
  })

  it('runs navigation through the supplied navigate function', () => {
    const c = ctx(7)
    buildCommands(c).find((cmd) => cmd.id === 'p-cycles')!.run()
    expect(c.navigate).toHaveBeenCalledWith('/projects/7/cycles')
  })

  it('filters by every typed word, ignoring case', () => {
    const commands = buildCommands({ ...ctx(7), t: (key: string) => key.replace('cmdk.', '') })
    expect(filterCommands(commands, 'GOBOARD').map((c) => c.id)).toEqual(['p-board'])
    expect(filterCommands(commands, '').length).toBe(commands.length)
    expect(filterCommands(commands, 'zzzz')).toEqual([])
  })
})
