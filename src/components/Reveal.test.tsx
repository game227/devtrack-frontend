import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { Reveal } from './Reveal'

describe('Reveal', () => {
  // jsdom has no IntersectionObserver, so this exercises the "unsupported environment" path —
  // it must fail open (show the content) rather than leave it permanently hidden.
  it('renders its children visibly when IntersectionObserver is unavailable', () => {
    renderWithProviders(
      <Reveal>
        <p>hero copy</p>
      </Reveal>,
    )
    expect(screen.getByText('hero copy')).toBeInTheDocument()
    expect(screen.getByText('hero copy').parentElement).toHaveClass('opacity-100')
  })

  it('applies the requested stagger delay', () => {
    renderWithProviders(
      <Reveal delay={240}>
        <span>staggered</span>
      </Reveal>,
    )
    expect(screen.getByText('staggered').parentElement).toHaveStyle({ transitionDelay: '240ms' })
  })
})
