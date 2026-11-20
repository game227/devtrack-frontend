import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAllPages = vi.fn()
const get = vi.fn()
vi.mock('./pagination', () => ({ getAllPages: (...a: unknown[]) => getAllPages(...a) }))
vi.mock('./client', () => ({ apiClient: { get: (...a: unknown[]) => get(...a) } }))

const { exportIssues, loadBoard } = await import('./issues')

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

describe('exportIssues', () => {
  it('downloads the CSV under the name the server gave it', async () => {
    const blob = new Blob(['x'], { type: 'text/csv' })
    get.mockReset().mockResolvedValue({ data: blob, headers: { 'content-disposition': 'attachment; filename="site-issues-2026-11-16.csv"' } })
    const createObjectURL = vi.fn(() => 'blob:fake')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }))
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    const file = await exportIssues({ project: 7 }, { status: 'todo' }, 'uz')

    expect(get).toHaveBeenCalledWith('/issues/export/', { params: { project: 7, status: 'todo', lang: 'uz' }, responseType: 'blob' })
    expect(file).toBe('site-issues-2026-11-16.csv')
    expect(createObjectURL).toHaveBeenCalledWith(blob)
    expect(click).toHaveBeenCalledTimes(1)
    expect(document.querySelector('a[download]')).toBeNull()
    click.mockRestore()
    vi.unstubAllGlobals()
  })
})
