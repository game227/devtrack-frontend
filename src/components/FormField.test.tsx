import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FormField, formInputClass } from './FormField'

describe('FormField', () => {
  it('labels the control without involving the error text', () => {
    render(
      <FormField label="Username" errors={['This field is required.']}>
        <input className={formInputClass} />
      </FormField>,
    )
    // The error is not part of the field's accessible name...
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Username' })).toBeInTheDocument()
  })

  it('announces an error, flags the control invalid and ties the two together', () => {
    render(
      <FormField label="Username" errors={['Too short.', 'Already taken.']}>
        <input className={formInputClass} />
      </FormField>,
    )
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Too short. Already taken.')
    const input = screen.getByRole('textbox', { name: 'Username' })
    expect(input).toBeInvalid()
    expect(input).toHaveAccessibleDescription('Too short. Already taken.')
    expect(input.getAttribute('aria-describedby')).toBe(alert.id)
  })

  it('stays quiet when there is nothing wrong', () => {
    render(
      <FormField label="Username">
        <input className={formInputClass} />
      </FormField>,
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    const input = screen.getByRole('textbox', { name: 'Username' })
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).not.toHaveAttribute('aria-describedby')
  })

  it('gives form controls an outline strong enough to find (3:1), not the decorative card border', () => {
    expect(formInputClass).toContain('border-border-strong')
    expect(formInputClass).not.toMatch(/border-border(?!-strong)/)
  })
})
