import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAllPages = vi.fn()
const get = vi.fn()
vi.mock('./pagination', () => ({ getAllPages: (...a: unknown[]) => getAllPages(...a) }))
vi.mock('./client', () => ({ apiClient: { get: (...a: unknown[]) => get(...a) } }))

const { loadBoard } = await import('./issues')

describe('loadBoard', () => {
  beforeEach(() => {
    getAllPages.mockReset()
    get.mockReset()
  })

  it('loads all open work but only the first page of finished work, newest first', async () => {
    getAllPages.mockResolvedValue([{ id: 1, status: 'todo' }])
    get.mockResolvedValue({ data: { count: 240, results: [{ id: 2, status: 'done' }] } })

    const board = await loadBoard(7, false)

    expect(getAllPages).toHaveBeenCalledWith('/issues/', { project: 7, exclude_status: 'done' })
    expect(get).toHaveBeenCalledWith('/issues/', {
      params: { project: 7, status: 'done', ordering: '-completed_at', page: 1 },
    })
    expect(board).toEqual({ issues: [{ id: 1, status: 'todo' }, { id: 2, status: 'done' }], doneTotal: 240 })
  })

  it('loads every finished issue when asked to show them all', async () => {
    getAllPages.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 3 }, { id: 4 }])
    const board = await loadBoard(7, true)
    expect(getAllPages).toHaveBeenLastCalledWith('/issues/', { project: 7, status: 'done', ordering: '-completed_at' })
    expect(get).not.toHaveBeenCalled()
    expect(board.doneTotal).toBe(2)
  })
})
