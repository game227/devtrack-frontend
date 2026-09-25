import type { ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { ProductTour } from '../components/landing/ProductTour'
import type { IconName } from '../components/Icon'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { Reveal } from '../components/Reveal'
import { ThemeSwitcher } from '../components/ThemeSwitcher'
import { useAuth } from '../features/auth/authContext'
import { useI18n } from '../i18n'

const ghostCta =
  'inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-medium text-fg transition-all duration-150 hover:border-fg active:scale-[0.98]'
// Grid stagger step, shared by every card grid on the page (features, how-it-works, tech notes)
// so the reveal rhythm feels the same everywhere rather than each section inventing its own.
const STAGGER_MS = 80

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
    <figure className="overflow-hidden rounded-2xl border border-border bg-bg-elevated transition-all duration-300 hover:-translate-y-1 hover:border-fg/40">
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
      <header className="sticky top-0 z-20 animate-fade-in border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <a href="#top" className="text-base font-semibold tracking-tight">
            DevTrack
          </a>
          <nav className="hidden items-center gap-6 text-sm text-fg-muted md:flex">
            <a href="#tour" className="transition-colors duration-150 hover:text-fg">
              {t('landing.nav.tour')}
            </a>
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
            <ThemeSwitcher className="hidden sm:inline-flex" />
            <LanguageSwitcher />
            <Link to="/login" className="hidden text-fg-muted transition-colors duration-150 hover:text-fg sm:inline">
              {t('landing.signIn')}
            </Link>
            <Link
              to="/register"
              className="rounded-md border border-border px-3 py-1.5 font-medium text-fg transition-all duration-150 hover:border-fg active:scale-[0.98]"
            >
              {t('landing.getStarted')}
            </Link>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="mx-auto max-w-6xl px-4 pb-8 pt-16 text-center sm:px-6 sm:pt-24">
          <p
            className="mb-4 animate-fade-up font-mono text-xs uppercase tracking-widest text-code"
            style={{ animationDelay: '40ms' }}
          >
            {t('landing.eyebrow')}
          </p>
          <h1
            className="mx-auto max-w-3xl animate-fade-up font-display text-4xl font-normal tracking-tight sm:text-6xl md:text-7xl"
            style={{ animationDelay: '120ms' }}
          >
            {t('landing.heroTitle')}
          </h1>
          <p
            className="mx-auto mt-5 max-w-2xl animate-fade-up text-base text-fg-muted sm:text-lg"
            style={{ animationDelay: '220ms' }}
          >
            {t('landing.heroText')}
          </p>
          <div
            className="mt-8 flex animate-fade-up flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: '300ms' }}
          >
            <Link to="/register" className={`${ghostCta} group`}>
              {t('landing.ctaPrimary')}
              <Icon name="arrowRight" className="transition-transform duration-150 group-hover:translate-x-1" />
            </Link>
            <Link to="/login" className={ghostCta}>
              {t('landing.ctaSecondary')}
            </Link>
          </div>
          <ul
            className="mt-8 flex animate-fade-up flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-fg-muted"
            style={{ animationDelay: '380ms' }}
          >
            {['i18n', 'github', 'health', 'telegram'].map((fact) => (
              <li key={fact} className="flex items-center gap-1.5">
                <Icon name="check" size={14} className="text-success" />
                {t(`landing.fact.${fact}`)}
              </li>
            ))}
          </ul>
        </section>

        <div
          className="mx-auto max-w-6xl animate-fade-up px-4 pb-8 sm:px-6"
          style={{ animationDelay: '460ms' }}
        >
          <Screenshot name="dashboard" alt={t('landing.heroTitle')} priority />
        </div>

        <Section id="tour">
          <Reveal>
            <SectionHeading title={t('landing.tourTitle')} text={t('landing.tourText')} />
          </Reveal>
          <Reveal delay={STAGGER_MS}>
            <ProductTour />
          </Reveal>
        </Section>

        <Section id="features">
          <Reveal>
            <SectionHeading title={t('landing.featuresTitle')} text={t('landing.featuresText')} />
          </Reveal>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <Reveal key={feature.key} delay={index * STAGGER_MS}>
                <div className="group rounded-2xl border border-border bg-bg-elevated p-5 transition-all duration-300 hover:-translate-y-1 hover:border-fg/40">
                  <div
                    className="mb-3 inline-flex rounded-md p-2 text-white transition-transform duration-300 group-hover:scale-110"
                    style={{ background: 'linear-gradient(135deg, var(--color-code), var(--color-merged))' }}
                  >
                    <Icon name={feature.icon} size={18} />
                  </div>
                  <h3 className="text-sm font-semibold">{t(`landing.f.${feature.key}.title`)}</h3>
                  <p className="mt-2 text-sm text-fg-muted">{t(`landing.f.${feature.key}.text`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>

        {SHOWCASES.map((showcase, index) => (
          <Section key={showcase.key} id={showcase.id}>
            <div className={`grid items-center gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] ${index % 2 ? 'lg:[direction:rtl]' : ''}`}>
              <Reveal className="lg:[direction:ltr]">
                <h2 className="font-headline text-2xl font-semibold tracking-[-0.02em]">{t(`landing.show.${showcase.key}.title`)}</h2>
                <p className="mt-3 text-fg-muted">{t(`landing.show.${showcase.key}.text`)}</p>
              </Reveal>
              <Reveal delay={STAGGER_MS} className="lg:[direction:ltr]">
                <Screenshot name={showcase.image} alt={t(`landing.show.${showcase.key}.title`)} />
              </Reveal>
            </div>
          </Section>
        ))}

        <Section id="how">
          <Reveal>
            <SectionHeading title={t('landing.howTitle')} />
          </Reveal>
          <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((step, index) => (
              <li key={step}>
                <Reveal delay={index * STAGGER_MS} className="h-full rounded-2xl border border-border bg-bg-elevated p-5 transition-all duration-300 hover:-translate-y-1 hover:border-fg/40">
                  <span className="font-mono text-sm text-code">0{step}</span>
                  <h3 className="mt-2 text-sm font-semibold">{t(`landing.how.${step}.title`)}</h3>
                  <p className="mt-2 text-sm text-fg-muted">{t(`landing.how.${step}.text`)}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </Section>

        <Section>
          <Reveal>
            <SectionHeading title={t('landing.techTitle')} />
          </Reveal>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {(['security', 'stack', 'tests'] as const).map((item, index) => (
              <Reveal key={item} delay={index * STAGGER_MS} className="flex gap-3 rounded-2xl border border-border p-5 text-sm text-fg-muted">
                <Icon name={item === 'security' ? 'shield' : item === 'stack' ? 'branch' : 'check'} size={18} className="mt-0.5 shrink-0 text-fg" />
                <p>{t(`landing.tech.${item}`)}</p>
              </Reveal>
            ))}
          </div>
        </Section>

        <Section>
          <Reveal className="rounded-2xl border border-border bg-bg-elevated px-6 py-14 text-center">
            <h2 className="font-headline text-2xl font-semibold tracking-[-0.02em] sm:text-3xl sm:tracking-[-0.03em]">{t('landing.finalTitle')}</h2>
            <p className="mt-3 text-fg-muted">{t('landing.finalText')}</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link to="/register" className={`${ghostCta} group`}>
                {t('landing.ctaPrimary')}
                <Icon name="arrowRight" className="transition-transform duration-150 group-hover:translate-x-1" />
              </Link>
              <Link to="/login" className={ghostCta}>
                {t('landing.signIn')}
              </Link>
            </div>
          </Reveal>
        </Section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-fg-muted sm:px-6">
          <span>{t('landing.footer', { year: new Date().getFullYear() })}</span>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
        </div>
      </footer>
    </div>
  )
}
