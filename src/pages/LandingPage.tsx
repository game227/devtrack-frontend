import { Link, Navigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import type { IconName } from '../components/Icon'
import { HeroLine } from '../components/landing/HeroLine'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { ThemeSwitcher } from '../components/ThemeSwitcher'
import { Logo } from '../components/Track'
import { button } from '../components/ui'
import { useAuth } from '../features/auth/authContext'
import { useI18n } from '../i18n'

// A real product screenshot (regenerated with the design; see README). Hides itself if it is missing.
function Screenshot({ name, alt, priority = false }: { name: string; alt: string; priority?: boolean }) {
  const { lang } = useI18n()
  return (
    <figure>
      <img
        src={`/screens/${lang}/${name}.png`}
        alt={alt}
        width={1440}
        height={900}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className="block h-auto w-full rounded-xl border border-border bg-well"
        onError={(event) => {
          event.currentTarget.style.display = 'none'
        }}
      />
    </figure>
  )
}

const FEATURES: Array<{ key: string; shot: string; id?: string }> = [
  { key: 'board', shot: 'board', id: 'board' },
  { key: 'github', shot: 'issue', id: 'github' },
  { key: 'health', shot: 'analytics' },
  { key: 'timeline', shot: 'timeline' },
  { key: 'local', shot: 'dashboard' },
]

const TRUST: Array<{ key: string; icon: IconName }> = [
  { key: '2fa', icon: 'shield' },
  { key: 'tokens', icon: 'github' },
  { key: 'sessions', icon: 'check' },
]

export function LandingPage() {
  const { t } = useI18n()
  const { isAuthenticated, isLoading } = useAuth()

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const navLink = 'font-semibold text-fg-muted transition-colors duration-150 hover:text-fg'

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <a href="#top" className="flex h-9 items-center rounded-md">
            <Logo />
          </a>
          <nav aria-label={t('nav.mainNavigation')} className="hidden items-center gap-7 text-sm md:flex">
            <a href="#board" className={navLink}>
              {t('landing.nav.board')}
            </a>
            <a href="#github" className={navLink}>
              {t('landing.nav.github')}
            </a>
            <a href="#start" className={navLink}>
              {t('landing.nav.start')}
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link to="/login" className={`${button('ghost', 'sm')} max-sm:hidden`}>
              {t('landing.signIn')}
            </Link>
            <Link to="/register" className={button('primary', 'sm')}>
              {t('landing.getStarted')}
            </Link>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:px-6 sm:pb-16 sm:pt-20">
          <h1 className="max-w-4xl text-[clamp(2.5rem,6.4vw,4.75rem)] font-extrabold leading-[1.02] tracking-[-0.035em]">
            {t('landing.heroTitle')}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-fg-muted">{t('landing.heroText')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className={button('primary', 'lg')}>
              {t('landing.ctaPrimary')}
            </Link>
            <Link to="/login" className={button('secondary', 'lg')}>
              {t('landing.ctaSecondary')}
            </Link>
          </div>
          <div className="mt-14 sm:mt-20">
            <HeroLine />
          </div>
        </section>

        {FEATURES.map((feature, index) => (
          <section key={feature.key} id={feature.id} className="scroll-mt-6 border-t border-border">
            <div
              className={`mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14 lg:py-24 ${
                index % 2 ? 'lg:[&>:first-child]:order-2' : ''
              }`}
            >
              <div>
                <h2 className="text-3xl font-extrabold leading-tight tracking-[-0.025em] sm:text-4xl">{t(`landing.${feature.key}.title`)}</h2>
                <p className="mt-4 max-w-md text-[17px] leading-relaxed text-fg-muted">{t(`landing.${feature.key}.text`)}</p>
              </div>
              <Screenshot name={feature.shot} alt={t(`landing.shot.${feature.shot}`)} />
            </div>
          </section>
        ))}

        <section id="start" className="scroll-mt-6 border-t border-border bg-well">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
            <h2 className="max-w-xl text-3xl font-extrabold leading-tight tracking-[-0.025em] sm:text-4xl">{t('landing.stepsTitle')}</h2>
            {/* The three steps really are a sequence, so they sit on a line of their own. */}
            <ol className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              <span aria-hidden="true" className="absolute bottom-3 left-[11px] top-3 w-[3px] rounded-full bg-brand md:bottom-auto md:left-3 md:right-[calc(33.333%-2.1rem)] md:top-[11px] md:h-[3px] md:w-auto" />
              {[1, 2, 3].map((step) => (
                <li key={step} className="relative pl-12 md:pl-0 md:pt-12">
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-0 flex h-[25px] w-[25px] items-center justify-center rounded-full bg-brand text-xs font-extrabold text-on-brand ring-4 ring-well"
                  >
                    {step}
                  </span>
                  <h3 className="text-lg font-bold">{t(`landing.step.${step}.title`)}</h3>
                  <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-fg-muted">{t(`landing.step.${step}.text`)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14 lg:py-20">
            <h2 className="text-2xl font-extrabold tracking-[-0.02em]">{t('landing.trustTitle')}</h2>
            <ul className="divide-y divide-border">
              {TRUST.map((item) => (
                <li key={item.key} className="flex items-start gap-3 py-3.5 text-[15px] first:pt-0 last:pb-0">
                  <Icon name={item.icon} size={18} className="mt-0.5 shrink-0 text-brand" />
                  {t(`landing.trust.${item.key}`)}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-end md:justify-between lg:py-24">
            <div>
              <h2 className="text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">{t('landing.finalTitle')}</h2>
              <p className="mt-3 text-lg text-fg-muted">{t('landing.finalText')}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/register" className={button('primary', 'lg')}>
                {t('landing.ctaPrimary')}
              </Link>
              <Link to="/login" className={button('secondary', 'lg')}>
                {t('landing.signIn')}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-fg-muted sm:px-6">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span>{t('landing.footer', { year: new Date().getFullYear() })}</span>
            <Link to="/privacy" className="hover:text-fg hover:underline">
              {t('legal.footerPrivacy')}
            </Link>
            <Link to="/terms" className="hover:text-fg hover:underline">
              {t('legal.footerTerms')}
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
        </div>
      </footer>
    </div>
  )
}
