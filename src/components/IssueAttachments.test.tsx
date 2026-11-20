import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError } from 'axios'
import type { AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { IssueAttachments } from './IssueAttachments'

const listAttachments = vi.fn()
const uploadAttachment = vi.fn()
const deleteAttachment = vi.fn()
const fetchAttachment = vi.fn()
const saveBlob = vi.fn()
vi.mock('../api/issueParts', () => ({
  listAttachments: (...a: unknown[]) => listAttachments(...a),
  uploadAttachment: (...a: unknown[]) => uploadAttachment(...a),
  deleteAttachment: (...a: unknown[]) => deleteAttachment(...a),
  fetchAttachment: (...a: unknown[]) => fetchAttachment(...a),
  saveBlob: (...a: unknown[]) => saveBlob(...a),
}))

const pdf = { id: 7, name: 'spec.pdf', content_type: 'application/pdf', size: 2048, is_image: false, uploaded_by: { id: 2, username: 'alex' }, created_at: '2026-11-17T10:00:00Z' }

beforeEach(() => {
  listAttachments.mockReset().mockResolvedValue([pdf])
  uploadAttachment.mockReset().mockResolvedValue({})
  deleteAttachment.mockReset().mockResolvedValue(undefined)
  fetchAttachment.mockReset().mockResolvedValue(new Blob(['x']))
  saveBlob.mockReset()
})

describe('IssueAttachments', () => {
  it('lists files, downloads them through the API and removes allowed ones', async () => {
    renderWithProviders(<IssueAttachments issueId={3} canDelete={() => true} />, { lang: 'en' })
    expect(await screen.findByText('spec.pdf')).toBeInTheDocument()
    expect(screen.getByText(/2 KB · alex/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Download spec.pdf' }))
    await waitFor(() => expect(saveBlob).toHaveBeenCalledWith(expect.any(Blob), 'spec.pdf'))
    expect(fetchAttachment).toHaveBeenCalledWith(7)
    await userEvent.click(screen.getByRole('button', { name: 'Remove spec.pdf' }))
    expect(deleteAttachment).toHaveBeenCalledWith(7)
  })

  it('hides removal from people who may not remove', async () => {
    renderWithProviders(<IssueAttachments issueId={3} canDelete={() => false} />, { lang: 'en' })
    await screen.findByText('spec.pdf')
    expect(screen.queryByRole('button', { name: 'Remove spec.pdf' })).not.toBeInTheDocument()
  })

  it('uploads a chosen file and explains a refusal', async () => {
    uploadAttachment.mockRejectedValue(
      new AxiosError('Bad', '400', undefined, undefined, {
        status: 400,
        data: { file: ['Only images (PNG, JPEG, GIF, WebP), PDF and plain text files can be attached.'] },
      } as AxiosResponse),
    )
    const { container } = renderWithProviders(<IssueAttachments issueId={3} canDelete={() => true} />, { lang: 'uz' })
    await screen.findByText('spec.pdf')
    const file = new File(['<html>'], 'page.png', { type: 'image/png' })
    await userEvent.upload(container.querySelector('input[type=file]') as HTMLInputElement, file)
    expect(uploadAttachment).toHaveBeenCalledWith(3, file, expect.any(Function))
    expect(await screen.findByRole('alert')).toHaveTextContent("Faqat rasm (PNG, JPEG, GIF, WebP), PDF va oddiy matn fayllarini biriktirish mumkin.")
  })

  it('refuses files over the limit before uploading', async () => {
    const { container } = renderWithProviders(<IssueAttachments issueId={3} canDelete={() => true} />, { lang: 'en' })
    await screen.findByText('spec.pdf')
    const big = new File(['x'], 'big.pdf')
    Object.defineProperty(big, 'size', { value: 11 * 1024 * 1024 })
    await userEvent.upload(container.querySelector('input[type=file]') as HTMLInputElement, big)
    expect(uploadAttachment).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Files can be at most 10 MB.')
  })
})
