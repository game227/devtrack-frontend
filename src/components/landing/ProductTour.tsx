import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { ComponentType, CSSProperties, KeyboardEvent } from 'react'
import { useI18n } from '../../i18n'
import { AssignScene, BoardScene, CreateScene, GithubScene, KeysScene } from './TourScenes'

// How long each step plays before the tour moves on by itself. Must cover the longest scene
// script (the drag-and-drop one runs ~6.4s).
export const STEP_MS = 6800

const STEPS: { key: string; Scene: ComponentType }[] = [
  { key: 'create', Scene: CreateScene },
  { key: 'board', Scene: BoardScene },
  { key: 'assign', Scene: AssignScene },
  { key: 'github', Scene: GithubScene },
  { key: 'keys', Scene: KeysScene },
]

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

function subscribeReducedMotion(onChange: () => void) {
  if (typeof window.matchMedia !== 'function') return () => {}
  const query = window.matchMedia(REDUCED_MOTION)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  )
}

// An auto-playing, clickable walkthrough: the list on the left names the five things you do in
// DevTrack, and the stage on the right performs the active one as a short animated mock-up.
// It advances on its own only while it is on screen, not hovered/focused and motion is allowed;
// picking a step yourself restarts that step's clock. With reduced motion the scenes jump to
// their final frame and nothing auto-advances.
export function ProductTour() {
  const { t } = useI18n()
  const [active, setActive] = useState(0)
  const [inView, setInView] = useState(false)
  const [engaged, setEngaged] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const playing = inView && !engaged && !reducedMotion

  useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!playing) return
    const timer = setTimeout(() => setActive((current) => (current + 1) % STEPS.length), STEP_MS)
    return () => clearTimeout(timer)
  }, [playing, active])

  function handleKeyDown(event: KeyboardEvent) {
    const forward = event.key === 'ArrowDown' || event.key === 'ArrowRight'
    const backward = event.key === 'ArrowUp' || event.key === 'ArrowLeft'
    if (!forward && !backward) return
    event.preventDefault()
    const next = (active + (forward ? 1 : STEPS.length - 1)) % STEPS.length
    setActive(next)
    document.getElementById(`tour-tab-${next}`)?.focus()
  }

  const { Scene } = STEPS[active]

  return (
    <div
      ref={rootRef}
      className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
      onMouseEnter={() => setEngaged(true)}
      onMouseLeave={() => setEngaged(false)}
      onFocus={() => setEngaged(true)}
      onBlur={() => setEngaged(false)}
    >
      <div role="tablist" aria-orientation="vertical" aria-label={t('landing.tourTitle')} onKeyDown={handleKeyDown} className="flex flex-col gap-2">
        {STEPS.map((step, index) => {
          const isActive = index === active
          return (
            <button
              key={step.key}
              id={`tour-tab-${index}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="tour-panel"
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActive(index)}
              className={`relative overflow-hidden rounded-2xl border p-4 text-left transition-colors duration-150 ${
                isActive ? 'border-border bg-bg-elevated' : 'border-transparent hover:border-border'
              }`}
            >
              <div className="flex items-baseline gap-3">
                <span className={`font-mono text-xs ${isActive ? 'text-code' : 'text-fg-muted'}`}>0{index + 1}</span>
                <span className={`text-sm font-semibold ${isActive ? 'text-fg' : 'text-fg-muted'}`}>
                  {t(`landing.tour.${step.key}.title`)}
                </span>
              </div>
              {isActive && (
                <p className="mt-2 animate-fade-in pl-7 text-sm text-fg-muted">{t(`landing.tour.${step.key}.text`)}</p>
              )}
              {isActive && playing && (
                <span
                  key={active}
                  aria-hidden="true"
                  className="tour-progress absolute bottom-0 left-0 h-px bg-fg"
                  style={{ '--step-ms': `${STEP_MS}ms` } as CSSProperties}
                />
              )}
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id="tour-panel"
        aria-labelledby={`tour-tab-${active}`}
        className="overflow-hidden rounded-2xl border border-border bg-bg-elevated"
      >
        <div className="flex gap-1.5 border-b border-border px-3 py-2.5" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-border" />
          <span className="h-2 w-2 rounded-full bg-border" />
          <span className="h-2 w-2 rounded-full bg-border" />
        </div>
        {/* The scene is a decorative mock-up: the step's title and text already say what it shows. */}
        <div className="relative h-[24rem] sm:h-[26rem]" aria-hidden="true">
          <Scene key={active} />
        </div>
      </div>
    </div>
  )
}
