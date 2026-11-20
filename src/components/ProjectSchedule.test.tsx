import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import type { Project } from '../types/project'
import { ProjectSchedule } from './ProjectSchedule'

const updateProject = vi.fn()
vi.mock('../api/projects', () => ({ updateProject: (...a: unknown[]) => updateProject(...a) }))

const base = { id: 3, name: 'P', status: 'active', start_date: null, target_date: null } as unknown as Project

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, now: new Date(2026, 10, 17, 12) })
  updateProject.mockReset().mockImplementation((_id, dates) => Promise.resolve({ ...base, ...dates }))
})
afterEach(() => vi.useRealTimers())

describe('ProjectSchedule', () => {
  it('explains empty dates and lets a manager set them, with presets and a check', async () => {
    renderWithProviders(<ProjectSchedule project={base} canManage />, { lang: 'en' })
    expect(screen.getByText('No dates yet')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Set the dates' }))
    expect(screen.getByLabelText('Start date')).toHaveValue('2026-11-17')
    await userEvent.click(screen.getByRole('button', { name: '1 month' }))
    expect(screen.getByLabelText('Target date')).toHaveValue('2026-12-16')

    await userEvent.clear(screen.getByLabelText('Target date'))
    await userEvent.type(screen.getByLabelText('Target date'), '2026-11-01')
    expect(screen.getByRole('alert')).toHaveTextContent('The target date cannot be before the start date.')
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: '2 weeks' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(updateProject).toHaveBeenCalledWith(3, { start_date: '2026-11-17', target_date: '2026-11-30' })
  })

  it('tells others who sets the dates', () => {
    renderWithProviders(<ProjectSchedule project={base} canManage={false} />, { lang: 'en' })
    expect(screen.getByText("The project's owner or a workspace admin sets the dates.")).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Set the dates' })).not.toBeInTheDocument()
  })

  it('says where the project stands', () => {
    const { unmount } = renderWithProviders(
      <ProjectSchedule project={{ ...base, start_date: '2026-11-01', target_date: '2026-11-30' }} canManage={false} />,
      { lang: 'uz' },
    )
    expect(screen.getByText('30 kundan 17-kun · 13 kun qoldi')).toBeInTheDocument()
    unmount()
    renderWithProviders(<ProjectSchedule project={{ ...base, start_date: '2026-10-01', target_date: '2026-11-10' }} canManage={false} />, { lang: 'en' })
    expect(screen.getByText('7 days past the target date')).toBeInTheDocument()
  })
})
