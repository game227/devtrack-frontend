import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { I18nProvider } from '../i18n'
import { HealthStatusBadge, IssueStatusBadge, PriorityBadge, PullRequestStatusBadge, StatusBadge } from './Badge'
import { STORAGE_KEY } from '../i18n/core'

function renderInLang(lang: 'uz' | 'en', ui: React.ReactElement) {
  localStorage.setItem(STORAGE_KEY, lang)
  return render(<I18nProvider>{ui}</I18nProvider>)
}

describe('Badge labels', () => {
  it('renders Uzbek labels by default', () => {
    render(
      <I18nProvider>
        <IssueStatusBadge status="in_progress" />
        <PriorityBadge priority="urgent" />
        <StatusBadge status="active" />
        <HealthStatusBadge status="at_risk" />
        <PullRequestStatusBadge state="closed" merged />
      </I18nProvider>,
    )
    expect(screen.getByText('Jarayonda')).toBeInTheDocument()
    expect(screen.getByText('Shoshilinch')).toBeInTheDocument()
    expect(screen.getByText('Faol')).toBeInTheDocument()
    expect(screen.getByText('Xavf ostida')).toBeInTheDocument()
    expect(screen.getByText('Birlashtirilgan')).toBeInTheDocument()
  })

  it('renders English labels when English is selected', () => {
    renderInLang(
      'en',
      <>
        <IssueStatusBadge status="in_review" />
        <HealthStatusBadge status="needs_attention" />
      </>,
    )
    expect(screen.getByText('In review')).toBeInTheDocument()
    expect(screen.getByText('Needs attention')).toBeInTheDocument()
  })

  it('shows a merged pull request as merged even if GitHub reports it closed', () => {
    renderInLang('en', <PullRequestStatusBadge state="closed" merged />)
    expect(screen.getByText('Merged')).toBeInTheDocument()
    expect(screen.queryByText('Closed')).not.toBeInTheDocument()
  })
})
