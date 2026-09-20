import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { describeError, extractFieldErrors } from './errors'

function apiError(status: number, data: unknown) {
  return new AxiosError('failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    data,
    statusText: '',
    headers: {},
    config: { headers: {} } as never,
  })
}

describe('extractFieldErrors', () => {
  it('translates field errors and maps detail to non_field_errors', () => {
    const result = extractFieldErrors(
      apiError(400, { username: ['A user with that username already exists.'], detail: 'Not found.' }),
      'uz',
    )
    expect(result).toEqual({
      username: ['Bu foydalanuvchi nomi band.'],
      non_field_errors: ['Topilmadi.'],
    })
  })

  it('reports a network problem when there is no response', () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK')
    expect(extractFieldErrors(error, 'en').non_field_errors).toEqual([
      'Cannot reach the server. Check your connection and try again.',
    ])
  })

  it('falls back to a generic message for unknown errors', () => {
    expect(extractFieldErrors(new Error('boom'), 'uz').non_field_errors).toEqual([
      "Xatolik yuz berdi. Qayta urinib ko'ring.",
    ])
  })

  it('describeError joins every message into one line', () => {
    const message = describeError(apiError(400, { a: ['This field is required.'], b: ['Not found.'] }), 'en')
    expect(message).toBe('This field is required. Not found.')
  })
})
