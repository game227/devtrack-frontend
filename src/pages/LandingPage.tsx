import type { CSSProperties } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { ContactCircles, ContactList } from '../components/ContactLinks'
import { Icon } from '../components/Icon'
import type { IconName } from '../components/Icon'
import { HeroDevice } from '../components/landing/HeroDevice'
import { Logo, LogoMark } from '../components/Track'
import { badge, button } from '../components/ui'
import { useAuth } from '../features/auth/authContext'
import { useTheme } from '../hooks/useTheme'
import { LANGS, useI18n } from '../i18n'
import type { Lang } from '../i18n'
import { resolveTheme } from '../lib/theme'
import { DEMO_ENABLED } from '../api/demo'
import { DemoButton } from '../components/DemoButton'
import { Reveal } from '../components/Reveal'
import { TryBoard } from '../components/landing/TryBoard'
import { useScrolled } from '../hooks/useScrolled'

// A real product screenshot (regenerated with the design; see README), in a frosted frame.
function Screenshot({ name, alt }: { name: string; alt: string }) {
  const { lang } = useI18n()
  return (
    <figure className="relative">
      <span aria-hidden="true" className="corners pointer-events-none absolute -inset-3 [--corner-size:20px]" />
      <img
        src={`/screens/${screenLang(lang)}/${name}.webp`}
        alt={alt}
        width={1440}
        height={900}
        loading="lazy"
        decoding="async"
        className="block h-auto w-full rounded-xl border border-edge bg-surface shadow-panel"
        onError={(event) => {
          event.currentTarget.style.display = 'none'
        }}
      />
    </figure>
  )
}

// Round outlined buttons: the language and the theme, at hand on the landing page.
function CircleControls() {
  const { lang, setLang, t } = useI18n()
  const { preference, setPreference } = useTheme()
  const dark = resolveTheme(preference) === 'dark'
  const circle =
    'flex h-11 w-11 items-center justify-center rounded-full border border-fg/20 bg-surface/30 text-[13px] font-semibold text-fg transition-colors duration-150 hover:bg-surface/80 aria-pressed:bg-fg aria-pressed:text-bg'
  return (
    <div className="flex items-center gap-2">
      <div role="group" aria-label={t('lang.switch')} className="flex gap-2">
        {LANGS.map((code) => (
          <button key={code} type="button" lang={code} aria-pressed={lang === code} onClick={() => setLang(code)} className={circle}>
            <span className="sr-only">{t(`lang.${code}`)}</span>
            <span aria-hidden="true">{code.toUpperCase()}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-label={t(dark ? 'theme.light' : 'theme.dark')}
        onClick={() => setPreference(dark ? 'light' : 'dark')}
        className={circle}
      >
        <Icon name={dark ? 'sun' : 'moon'} size={17} />
      </button>
    </div>
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

// One letter each, so the overlapping circles stay legible.
const TEAM = ['D', 'S', 'J', 'M']

// Product screenshots exist in every interface language (uz, en, ru).
function screenLang(lang: Lang) {
  return lang
}

export function LandingPage() {
  const { t, lang } = useI18n()
  const { isAuthenticated, isLoading } = useAuth()
  const scrolled = useScrolled(12)
  const heroWords = t('landing.hero.l1').split(' ')
  const heroLast = heroWords.pop() ?? ''
  const heroLead = heroWords.join(' ')

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const navLink = 'rounded-lg px-3 py-1.5 text-sm text-fg-muted transition-colors duration-150 hover:bg-surface/60 hover:text-fg'

  return (
    <div className="min-h-screen text-fg">
      <div aria-hidden="true" className="scroll-progress" />
      {/* A floating glass pill, centred over the page; it firms up once the page scrolls under it. */}
      <header className="sticky top-0 z-30 px-3 pt-3 sm:pt-5">
        <div
          className={`glass mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 rounded-2xl pl-4 pr-1.5 transition-[box-shadow,background-color] duration-300 ${
            scrolled ? 'shadow-float [background-color:color-mix(in_srgb,var(--color-surface)_86%,transparent)]' : ''
          }`}
        >
          <a href="#top" className="flex h-9 items-center rounded-lg">
            <Logo />
          </a>
          <nav aria-label={t('nav.mainNavigation')} className="hidden items-center gap-0.5 md:flex">
            <a href="#board" className={navLink}>
              {t('landing.nav.board')}
            </a>
            <a href="#github" className={navLink}>
              {t('landing.nav.github')}
            </a>
            <a href="#start" className={navLink}>
              {t('landing.nav.start')}
            </a>
            <a href="#contact" className={navLink}>
              {t('contact.title')}
            </a>
          </nav>
          <div className="flex items-center gap-1">
            <Link to="/login" className={button('ghost', 'sm')}>
              {t('landing.signIn')}
            </Link>
            <Link to="/register" className={`${button('primary', 'md')} rounded-xl`}>
              {/* Phones get the short label so "Sign in" fits next to it. */}
              <span className="sm:hidden">{t('landing.getStartedShort')}</span>
              <span className="max-sm:hidden">{t('landing.getStarted')}</span>
              <Icon name="arrowRight" />
            </Link>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="mx-auto grid max-w-6xl items-center gap-x-10 gap-y-12 px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:pb-24 lg:pt-20">
          <div>
            <p className="flex items-center gap-2 text-[13px] text-fg">
              <Icon name="github" size={15} />
              <Icon name="send" size={15} />
              <span className="font-medium">{t('landing.worksWith')}</span>
            </p>
            <p className={`mt-4 ${badge}`}>
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-orange" />
              {t('landing.badge')}
            </p>
            <h1
              className={`mt-6 font-medium leading-[1.02] tracking-[-0.05em] ${
                lang === 'ru' ? 'text-[clamp(2.3rem,5.2vw,4rem)]' : 'text-[clamp(2.6rem,6vw,4.6rem)]'
              }`}
            >
              <span className="block">
                {heroLead}
                {heroLead && ' '}
                {/* The mark stays on the line of the last word instead of wrapping onto a line of its own. */}
                <span className="whitespace-nowrap">
                  {heroLast}{' '}
                  <span aria-hidden="true" className="ml-1 inline-flex translate-y-[-0.08em] align-middle text-fg">
                    <LogoMark size={56} />
                  </span>
                </span>
              </span>
              {/* Spaces between the lines, so the heading reads as a sentence to assistive technology. */}{' '}
              <span className="block">{t('landing.hero.l2')}</span>{' '}
              <span className="block text-fg/45">{t('landing.hero.l3')}</span>
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-fg-muted">{t('landing.heroText')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className={`${button('primary', 'lg')} rounded-xl`}>
                {t('landing.ctaPrimary')}
                <Icon name="arrowRight" />
              </Link>
              <a href="#board" className={`${button('secondary', 'lg')} rounded-xl`}>
                {t('landing.ctaSecondary')}
              </a>
              {DEMO_ENABLED && <DemoButton />}
            </div>
            <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-fg/15 bg-surface/40 py-1.5 pl-1.5 pr-5">
              <span className="flex -space-x-2">
                {TEAM.map((name) => (
                  <span key={name} className="rounded-full ring-2 ring-bg">
                    <Avatar name={name} size={30} />
                  </span>
                ))}
              </span>
              <span className="text-[13px] font-medium leading-tight text-fg">{t('landing.teams')}</span>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
              <a href="#board" className="group flex items-center gap-3 rounded-xl">
                <span className="block overflow-hidden rounded-xl border border-edge shadow-panel">
                  <img
                    src={`/screens/${screenLang(lang)}/board.webp`}
                    alt=""
                    width={128}
                    height={72}
                    className="h-[72px] w-32 object-cover object-left-top transition-transform duration-300 group-hover:scale-105"
                  />
                </span>
                <span className="text-sm font-medium text-fg">
                  {t('landing.seeBoard')}
                  <Icon name="arrowRight" className="ml-1 inline transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              </a>
              <div className="flex items-center gap-3">
                <span className="text-sm text-fg-muted">{t('landing.askUs')}</span>
                <ContactCircles />
              </div>
            </div>
          </div>
          <div className="parallax-up">
            <HeroDevice />
          </div>
        </section>

        {FEATURES.map((feature, index) => (
          <section key={feature.key} id={feature.id} className="scroll-mt-24">
            {/* The picture side always gets the wider column, whichever side it is on. */}
            <div
              className={`mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:gap-16 lg:py-20 ${
                index % 2 ? 'lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:[&>:first-child]:order-2' : 'lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]'
              }`}
            >
              <Reveal>
                <p className={badge}>
                  <span aria-hidden="true" className="h-2 w-2 rounded-full bg-fg" />
                  {t(`landing.${feature.key}.kicker`)}
                </p>
                <h2 className="mt-5 text-[clamp(1.9rem,3.4vw,2.7rem)] font-medium leading-[1.08] tracking-[-0.04em]">{t(`landing.${feature.key}.title`)}</h2>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-fg-muted">{t(`landing.${feature.key}.text`)}</p>
              </Reveal>
              <Reveal variant={index % 2 ? 'left' : 'right'} delay={120}>
                <Screenshot name={feature.shot} alt={t(`landing.shot.${feature.shot}`)} />
              </Reveal>
            </div>
          </section>
        ))}

        <section id="try" aria-labelledby="try-title" className="scroll-mt-24 px-4 py-14 sm:px-6 lg:py-20">
          <div className="mx-auto max-w-6xl">
            <Reveal className="max-w-2xl">
              <p className={badge}>
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-orange" />
                {t('landing.try.kicker')}
              </p>
              <h2 id="try-title" className="mt-5 text-[clamp(1.9rem,3.4vw,2.7rem)] font-medium leading-[1.08] tracking-[-0.04em]">
                {t('landing.try.title')}
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-fg-muted">{t('landing.try.lead')}</p>
            </Reveal>
            <Reveal variant="scale" delay={120} className="mt-8">
              <TryBoard />
            </Reveal>
          </div>
        </section>

        <section id="start" className="scroll-mt-24 px-4 py-14 sm:px-6 lg:py-20">
          <Reveal variant="scale" className="glass mx-auto max-w-6xl rounded-[28px] px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
            <h2 className="max-w-xl text-[clamp(1.9rem,3.4vw,2.7rem)] font-medium leading-[1.08] tracking-[-0.04em]">{t('landing.stepsTitle')}</h2>
            {/* The three steps really are a sequence, so they sit on a line of their own. */}
            <ol className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              <span aria-hidden="true" className="draw-line absolute bottom-3 left-[13px] top-3 w-px bg-fg/25 md:bottom-auto md:left-3 md:right-[calc(33.333%-2.1rem)] md:top-[13px] md:h-px md:w-auto" />
              {[1, 2, 3].map((step) => (
                <li key={step} className="reveal-item relative pl-12 md:pl-0 md:pt-12" style={{ '--i': step } as CSSProperties}>
                  <span aria-hidden="true" className="btn-ink absolute left-0 top-0 flex h-[27px] w-[27px] items-center justify-center rounded-full text-xs font-semibold">
                    {step}
                  </span>
                  <h3 className="text-lg font-medium tracking-[-0.02em]">{t(`landing.step.${step}.title`)}</h3>
                  <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-fg-muted">{t(`landing.step.${step}.text`)}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </section>

        <section aria-labelledby="trust-title" className="px-4 py-14 sm:px-6 lg:py-20">
          <Reveal className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            <div>
              <p className={badge}>
                <Icon name="shield" size={13} />
                {t('landing.trust.kicker')}
              </p>
              <h2 id="trust-title" className="mt-5 text-[clamp(1.9rem,3.4vw,2.7rem)] font-medium leading-[1.08] tracking-[-0.04em]">
                {t('landing.trustTitle')}
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-fg-muted">{t('landing.trust.lead')}</p>
            </div>
            <ul className="divide-y divide-border rounded-2xl border border-edge bg-surface/70 px-5 shadow-panel">
              {TRUST.map((item, index) => (
                <li key={item.key} className="reveal-item flex items-start gap-3 py-4 text-[15px]" style={{ '--i': index } as CSSProperties}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-fg/15 bg-surface/50">
                    <Icon name={item.icon} size={15} />
                  </span>
                  <span className="pt-1">{t(`landing.trust.${item.key}`)}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        <section id="contact" aria-labelledby="contact-title" className="scroll-mt-24 px-4 py-14 sm:px-6 lg:py-20">
          <Reveal className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            <div>
              <p className={badge}>
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-orange" />
                {t('contact.title')}
              </p>
              <h2 id="contact-title" className="mt-5 text-[clamp(1.9rem,3.4vw,2.7rem)] font-medium leading-[1.08] tracking-[-0.04em]">
                {t('landing.contactTitle')}
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-fg-muted">{t('contact.lead')}</p>
            </div>
            <ContactList />
          </Reveal>
        </section>

        <section className="px-4 pb-20 pt-6 sm:px-6">
          {/* The closing call to action is the device's colour: ink, with light text. */}
          <Reveal
            variant="scale"
            className="relative mx-auto max-w-6xl overflow-hidden rounded-[28px] bg-[linear-gradient(155deg,#2c2c2a_0%,#101010_45%,#050505_100%)] px-6 py-14 text-white shadow-[0_40px_80px_-40px_rgb(0_0_0/0.7)] sm:px-12 lg:py-20"
          >
            <span aria-hidden="true" className="corners pointer-events-none absolute inset-5 [--corner-color:rgb(255_255_255/0.5)]" />
            <div className="relative flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-[clamp(2rem,4.4vw,3.4rem)] font-medium leading-[1.04] tracking-[-0.045em]">{t('landing.finalTitle')}</h2>
                <p className="mt-3 text-lg text-white/65">{t('landing.finalText')}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-[linear-gradient(180deg,#ffffff,#dcdcda)] px-6 text-[15px] font-medium text-[#111] shadow-[inset_0_1px_0_rgb(255_255_255/0.8)] transition-transform duration-150 active:translate-y-px"
                >
                  {t('landing.ctaPrimary')}
                  <Icon name="arrowRight" />
                </Link>
                <Link to="/login" className="inline-flex h-12 items-center rounded-xl border border-white/25 px-6 text-[15px] font-medium text-white transition-colors duration-150 hover:bg-white/10">
                  {t('landing.signIn')}
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="px-4 pb-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-sm text-fg-muted">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span>{t('landing.footer', { year: new Date().getFullYear() })}</span>
            <Link to="/privacy" className="hover:text-fg hover:underline">
              {t('legal.footerPrivacy')}
            </Link>
            <Link to="/terms" className="hover:text-fg hover:underline">
              {t('legal.footerTerms')}
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-2 text-xs">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-orange" />
              {t('landing.madeIn')}
            </span>
            <CircleControls />
          </div>
        </div>
      </footer>
    </div>
  )
}
