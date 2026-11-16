import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Markdown } from './Markdown'

describe('Markdown', () => {
  it('renders the usual formatting', () => {
    const { container } = render(<Markdown>{'**bold** and `code`\n\n- one\n- two\n\n```ts\nconst a = 1\n```'}</Markdown>)
    expect(screen.getByText('bold').tagName).toBe('STRONG')
    expect(screen.getByText('code').tagName).toBe('CODE')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(container.querySelector('pre code')).toHaveTextContent('const a = 1')
  })

  it('opens web links safely and neutralises script links', () => {
    render(<Markdown>{'[site](https://devtrack.uz) and [bad](javascript:alert(1))'}</Markdown>)
    const site = screen.getByRole('link', { name: 'site' })
    expect(site).toHaveAttribute('target', '_blank')
    expect(site).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByText('bad').closest('a')?.getAttribute('href') ?? '').not.toMatch(/javascript/i)
  })

  it('never renders raw HTML', () => {
    const { container } = render(<Markdown>{'<img src=x onerror=alert(1)> <script>alert(1)</script> text'}</Markdown>)
    expect(container.querySelector('img, script')).toBeNull()
  })

  it('keeps headings below the page headings', () => {
    render(<Markdown>{'# Title'}</Markdown>)
    expect(screen.getByRole('heading', { name: 'Title' }).tagName).toBe('H3')
  })

  it('shows task lists as read-only checkboxes', () => {
    render(<Markdown>{'- [x] done\n- [ ] todo'}</Markdown>)
    const boxes = screen.getAllByRole('checkbox')
    expect(boxes[0]).toBeChecked()
    expect(boxes[1]).toBeDisabled()
  })
})
