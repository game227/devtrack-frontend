import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { ProjectHealthCard } from './ProjectHealthCard'
import type { ProjectHealth } from '../types/health'

const getProjectHealth = vi.fn()
vi.mock('../api/health', () => ({ getProjectHealth: (...args: unknown[]) => getProjectHealth(...args) }))

function health(overrides: Partial<ProjectHealth> = {}): ProjectHealth {
  return {
    score: 72,
    status: 'needs_attention',
    formula_version: 2,
    confidence: 'normal',
    factors: { task_progress: 40, deadline: null, bug_rate: 90, development_activity: 100, flow: 55 },
    breakdown: [
      { key: 'task_progress', score: 40, weight: 31, points: 12.4, detail: { mode: 'dates', done: 2, total: 10, expected_percent: 50 } },
      { key: 'deadline', score: null, weight: 0, points: 0, detail: { dated: 0, overdue: 0 } },
      { key: 'bug_rate', score: 90, weight: 25, points: 22.5, detail: { open_bugs: 1, urgent: 0 } },
      { key: 'development_activity', score: 100, weight: 25, points: 25, detail: { days_since: 1, source: 'github', applies: true } },
      { key: 'flow', score: 55, weight: 19, points: 10.5, detail: { stale: 1, in_flight: 3 } },
    ],
    capped_by: [],
    risks: [],
    risk_details: [],
    ...overrides,
  }
}

function renderCard() {
  return renderWithProviders(<ProjectHealthCard projectId={4} />, { lang: 'en' })
}

describe('ProjectHealthCard', () => {
  beforeEach(() => getProjectHealth.mockReset())

  it('shows the score and every factor, with the share of the score each carries', async () => {
    getProjectHealth.mockResolvedValue(health())
    renderCard()
    expect(await screen.findByText('72')).toBeInTheDocument()
    for (const label of ['Progress vs plan', 'Deadlines', 'Bug pressure', 'Development activity', 'Work flow']) {
      // Each label is on its factor row and again inside the (collapsed) breakdown.
      expect(screen.getAllByText(label).length).toBeGreaterThanOrEqual(1)
    }
    expect(screen.getByText('· 31%')).toBeInTheDocument()
  })

  it('says why a factor is not applicable instead of showing a fake number', async () => {
    getProjectHealth.mockResolvedValue(health())
    renderCard()
    // Shown on the factor's row and again in the (collapsed) breakdown.
    expect((await screen.findAllByText('No issues have a due date.')).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1)
  })

  it('colours a bar by its score, matching the status thresholds', async () => {
    getProjectHealth.mockResolvedValue(health())
    const { container } = renderCard()
    await screen.findByText('72')
    const bars = [...container.querySelectorAll<HTMLElement>('[style*="width"]')]
    const byWidth = Object.fromEntries(bars.map((bar) => [bar.style.width, bar.className]))
    expect(byWidth['100%']).toContain('bg-success')
    expect(byWidth['55%']).toContain('bg-warning')
    expect(byWidth['40%']).toContain('bg-danger')
  })

  it('warns when few issues make the score a rough guide', async () => {
    getProjectHealth.mockResolvedValue(health({ confidence: 'low' }))
    renderCard()
    expect(await screen.findByText(/treat this score as a rough guide/)).toBeInTheDocument()
  })

  it('explains a cap on the score', async () => {
    getProjectHealth.mockResolvedValue(health({ score: 79, capped_by: ['critical_bug'] }))
    renderCard()
    const note = await screen.findByRole('note')
    expect(note).toHaveTextContent('Held back:')
    expect(note).toHaveTextContent('urgent bug has been open for more than a week')
  })

  it('lists localized risks, including the new kinds', async () => {
    getProjectHealth.mockResolvedValue(
      health({
        risk_details: [
          { code: 'stale_pull_requests', count: 2, days: 7 },
          { code: 'no_recent_activity', count: 16, days: 16 },
        ],
      }),
    )
    renderCard()
    expect(await screen.findByText('2 pull request(s) have been open for more than 7 days.')).toBeInTheDocument()
    expect(screen.getByText('No activity for 16 days.')).toBeInTheDocument()
  })

  it('opens a breakdown with the numbers behind each factor', async () => {
    getProjectHealth.mockResolvedValue(health())
    renderCard()
    await userEvent.click(await screen.findByText('How is this calculated?'))
    const list = screen.getByText(/2 of 10 issues done · 50% of the schedule has passed/).closest('ul') as HTMLElement
    expect(within(list).getByText('12.4 pts')).toBeInTheDocument()
    expect(within(list).getByText('Last activity 1 day(s) ago (GitHub)')).toBeInTheDocument()
    expect(within(list).getByText('1 of 3 items in flight have stalled')).toBeInTheDocument()
  })

  it('still renders against an older backend that has no breakdown or new factors', async () => {
    getProjectHealth.mockResolvedValue({
      score: 88,
      status: 'healthy',
      factors: { task_progress: 80, development_activity: 90, deadline: 100, bug_rate: 95 },
      risks: ['1 issue(s) are past their due date.'],
    })
    renderCard()
    expect(await screen.findByText('88')).toBeInTheDocument()
    expect(screen.getByText('1 issue(s) are past their due date.')).toBeInTheDocument()
    expect(screen.queryByText('How is this calculated?')).not.toBeInTheDocument()
  })
})
