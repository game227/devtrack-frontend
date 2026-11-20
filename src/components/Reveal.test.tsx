import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Reveal } from './Reveal'

afterEach(() => vi.unstubAllGlobals())

describe('Reveal', () => {
  it('shows content at once where IntersectionObserver is missing', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    render(<Reveal>hello</Reveal>)
    expect(screen.getByText('hello')).toHaveAttribute('data-reveal', 'shown')
  })

  it('stays hidden until it scrolls into view, then stays shown', () => {
    let callback: IntersectionObserverCallback = () => {}
    const disconnect = vi.fn()
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: IntersectionObserverCallback) {
          callback = cb
        }
        observe() {}
        disconnect = disconnect
      },
    )
    render(
      <Reveal variant="left" delay={120}>
        picture
      </Reveal>,
    )
    const element = screen.getByText('picture')
    expect(element).toHaveAttribute('data-reveal', 'hidden')
    expect(element).toHaveAttribute('data-variant', 'left')
    expect(element.style.getPropertyValue('--reveal-delay')).toBe('120ms')
    act(() => callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver))
    expect(element).toHaveAttribute('data-reveal', 'shown')
    expect(disconnect).toHaveBeenCalled()
  })
})
