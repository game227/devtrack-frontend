import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
vi.mock('./client', () => ({ apiClient: { get: (...args: unknown[]) => get(...args) } }))

import { getAllPages } from './pagination'

function page<T>(results: T[], next: string | null) {
  return { data: { count: 0, next, previous: null, results } }
}

describe('getAllPages', () => {
  beforeEach(() => get.mockReset())

  it('collects every page, incrementing the page param and keeping filters', async () => {
    get
      .mockResolvedValueOnce(page([1, 2], 'http://api/issues/?page=2'))
      .mockResolvedValueOnce(page([3, 4], 'http://api/issues/?page=3'))
      .mockResolvedValueOnce(page([5], null))

    const result = await getAllPages<number>('/issues/', { project: 7 })

    expect(result).toEqual([1, 2, 3, 4, 5])
    expect(get).toHaveBeenCalledTimes(3)
    expect(get).toHaveBeenNthCalledWith(1, '/issues/', { params: { project: 7, page: 1 } })
    expect(get).toHaveBeenNthCalledWith(3, '/issues/', { params: { project: 7, page: 3 } })
  })

  it('stops after a single page when there is no next link', async () => {
    get.mockResolvedValueOnce(page(['a'], null))
    expect(await getAllPages<string>('/teams/')).toEqual(['a'])
    expect(get).toHaveBeenCalledTimes(1)
  })

  it('gives up after the safety limit instead of looping forever', async () => {
    get.mockResolvedValue(page([1], 'http://api/x/?page=n'))
    const result = await getAllPages<number>('/x/')
    expect(result).toHaveLength(40)
    expect(get).toHaveBeenCalledTimes(40)
  })
})
