import type { ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import type { IconName } from '../components/Icon'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { useAuth } from '../features/auth/authContext'
import { useI18n } from '../i18n'

const ghostCta =
  'inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg'

const FEATURES: { key: string; icon: IconName }[] = [
  { key: 'board', icon: 'board' },
  { key: 'health', icon: 'heart' },
  { key: 'github', icon: 'github' },
  { key: 'timeline', icon: 'timeline' },
  { key: 'analytics', icon: 'analytics' },
  { key: 'teams', icon: 'teams' },
]

const SHOWCASES: { key: string; image: string; id?: string }[] = [
  { key: 'board', image: 'board' },
  { key: 'github', image: 'issue', id: 'github' },
  { key: 'health', image: 'analytics' },
  { key: 'timeline', image: 'timeline' },
]

// A "window" frame around a real product screenshot; hides itself if the image is missing.
function Screenshot({ name, alt, priority = false }: { name: string; alt: string; priority?: boolean }) {
  const { lang } = useI18n()
  return (
    <figure className="overflow-hidden rounded-2xl border border-border bg-bg-elevated">
      <div className="flex gap-1.5 border-b border-border px-3 py-2.5" aria-hidden="true">
        <span className="h-2 w-2 rounded-full bg-border" />
        <span className="h-2 w-2 rounded-full bg-border" />
        <span className="h-2 w-2 rounded-full bg-border" />
      </div>
      <img
        src={`/screens/${lang}/${name}.png`}
        alt={alt}
        width={1440}
        height={900}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className="block h-auto w-full"
        onError={(event) => {
          event.currentTarget.style.display = 'none'
        }}
      />
    </figure>
  )
}

function SectionHeading({ title, text }: { title: string; text?: string }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <h2 className="font-headline text-2xl font-semibold tracking-[-0.02em] sm:text-3xl sm:tracking-[-0.03em]">{title}</h2>
      {text && <p className="mt-3 text-fg-muted">{text}</p>}
    </div>
  )
}

function Section({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <section id={id} className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20">
      {children}
    </section>
  )
}

export function LandingPage() {
  const { t } = useI18n()
  const { isAuthenticated, isLoading } = useAuth()

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <a href="#top" className="text-base font-semibold tracking-tight">
            DevTrack
          </a>
          <nav className="hidden items-center gap-6 text-sm text-fg-muted md:flex">
            <a href="#features" className="transition-colors duration-150 hover:text-fg">
              {t('landing.nav.features')}
            </a>
            <a href="#github" className="transition-colors duration-150 hover:text-fg">
              {t('landing.nav.github')}
            </a>
            <a href="#how" className="transition-colors duration-150 hover:text-fg">
              {t('landing.nav.how')}
            </a>
          </nav>
          <div className="flex items-center gap-2 text-sm sm:gap-3">
            <LanguageSwitcher />
            <Link to="/login" className="hidden text-fg-muted transition-colors duration-150 hover:text-fg sm:inline">
              {t('landing.signIn')}
            </Link>
            <Link to="/register" className="rounded-md border border-border px-3 py-1.5 font-medium text-fg transition-colors duration-150 hover:border-fg">
              {t('landing.getStarted')}
            </Link>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="mx-auto max-w-6xl px-4 pb-8 pt-16 text-center sm:px-6 sm:pt-24">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-code">{t('landing.eyebrow')}</p>
          <h1 className="mx-auto max-w-3xl font-display text-4xl font-normal tracking-tight sm:text-6xl md:text-7xl">{t('landing.heroTitle')}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-fg-muted sm:text-lg">{t('landing.heroText')}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/register" className={ghostCta}>
              {t('landing.ctaPrimary')}
              <Icon name="arrowRight" />
            </Link>
            <Link to="/login" className={ghostCta}>
              {t('landing.ctaSecondary')}
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-fg-muted">
            {['i18n', 'github', 'health', 'telegram'].map((fact) => (
              <li key={fact} className="flex items-center gap-1.5">
                <Icon name="check" size={14} className="text-success" />
                {t(`landing.fact.${fact}`)}
              </li>
            ))}
          </ul>
        </section>

        <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
          <Screenshot name="dashboard" alt={t('landing.heroTitle')} priority />
        </div>

        <Section id="features">
          <SectionHeading title={t('landing.featuresTitle')} text={t('landing.featuresText')} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.key} className="rounded-2xl border border-border bg-bg-elevated p-5">
                <div
                  className="mb-3 inline-flex rounded-md p-2 text-fg"
                  style={{ background: 'linear-gradient(135deg, var(--color-code), var(--color-merged))' }}
                >
                  <Icon name={feature.icon} size={18} />
                </div>
                <h3 className="text-sm font-semibold">{t(`landing.f.${feature.key}.title`)}</h3>
                <p className="mt-2 text-sm text-fg-muted">{t(`landing.f.${feature.key}.text`)}</p>
              </div>
            ))}
          </div>
        </Section>

        {SHOWCASES.map((showcase, index) => (
          <Section key={showcase.key} id={showcase.id}>
            <div className={`grid items-center gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] ${index % 2 ? 'lg:[direction:rtl]' : ''}`}>
              <div className="lg:[direction:ltr]">
                <h2 className="font-headline text-2xl font-semibold tracking-[-0.02em]">{t(`landing.show.${showcase.key}.title`)}</h2>
                <p className="mt-3 text-fg-muted">{t(`landing.show.${showcase.key}.text`)}</p>
              </div>
              <div className="lg:[direction:ltr]">
                <Screenshot name={showcase.image} alt={t(`landing.show.${showcase.key}.title`)} />
              </div>
            </div>
          </Section>
        ))}

        <Section id="how">
          <SectionHeading title={t('landing.howTitle')} />
          <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((step) => (
              <li key={step} className="rounded-2xl border border-border bg-bg-elevated p-5">
                <span className="font-mono text-sm text-code">0{step}</span>
                <h3 className="mt-2 text-sm font-semibold">{t(`landing.how.${step}.title`)}</h3>
                <p className="mt-2 text-sm text-fg-muted">{t(`landing.how.${step}.text`)}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section>
          <SectionHeading title={t('landing.techTitle')} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {(['security', 'stack', 'tests'] as const).map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-border p-5 text-sm text-fg-muted">
                <Icon name={item === 'security' ? 'shield' : item === 'stack' ? 'branch' : 'check'} size={18} className="mt-0.5 shrink-0 text-fg" />
                <p>{t(`landing.tech.${item}`)}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section>
          <div className="rounded-2xl border border-border bg-bg-elevated px-6 py-14 text-center">
            <h2 className="font-headline text-2xl font-semibold tracking-[-0.02em] sm:text-3xl sm:tracking-[-0.03em]">{t('landing.finalTitle')}</h2>
            <p className="mt-3 text-fg-muted">{t('landing.finalText')}</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link to="/register" className={ghostCta}>
                {t('landing.ctaPrimary')}
                <Icon name="arrowRight" />
              </Link>
              <Link to="/login" className={ghostCta}>
                {t('landing.signIn')}
              </Link>
            </div>
          </div>
        </Section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-fg-muted sm:px-6">
          <span>{t('landing.footer', { year: new Date().getFullYear() })}</span>
          <LanguageSwitcher />
        </div>
      </footer>
    </div>
  )
}
