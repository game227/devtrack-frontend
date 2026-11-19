// Class recipes for the design system in styles/index.css. Pages compose these instead of inventing
// their own button and panel classes, so the whole app changes together.

type Tone = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const BUTTON_BASE =
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-[background-color,border-color,box-shadow,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50'

// On touch screens (coarse pointers) the small sizes grow to a comfortable 40-44px target.
const BUTTON_SIZE: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] pointer-coarse:h-10',
  md: 'h-10 px-4 text-sm pointer-coarse:h-11',
  lg: 'h-12 px-6 text-[15px]',
}

// Primary is ink (.btn-ink in styles/index.css); secondary is an outline on the canvas.
const BUTTON_TONE: Record<Tone, string> = {
  primary: 'btn-ink',
  secondary: 'border border-fg/25 bg-surface/40 text-fg hover:border-fg/40 hover:bg-surface/80',
  ghost: 'text-fg-muted hover:bg-surface/70 hover:text-fg',
  danger: 'border border-danger/40 bg-surface/40 text-danger hover:border-danger hover:bg-danger/10',
}

export function button(tone: Tone = 'secondary', size: Size = 'md'): string {
  return `${BUTTON_BASE} ${BUTTON_SIZE[size]} ${BUTTON_TONE[tone]}`
}

// A square icon-only button (its accessible name comes from aria-label).
export function iconButton(size: 'sm' | 'md' = 'md'): string {
  return `inline-flex shrink-0 items-center justify-center rounded-full text-fg-muted transition-colors duration-150 hover:bg-surface/80 hover:text-fg ${
    size === 'sm' ? 'h-8 w-8 pointer-coarse:h-10 pointer-coarse:w-10' : 'h-10 w-10 pointer-coarse:h-11 pointer-coarse:w-11'
  }`
}

// A frosted panel with a light edge: lists, forms and side panels sit in these.
export const panel = 'rounded-xl border border-edge bg-surface shadow-panel'

// A form that opens in place (new project, new cycle, ...).
export const formPanel = 'mb-8 max-w-xl rounded-xl border border-edge bg-surface p-5 shadow-panel'

// A list of rows separated by hairlines.
export const listPanel = 'divide-y divide-border overflow-hidden rounded-xl border border-edge bg-surface shadow-panel'

// A row inside a panel list: rows are separated by hairlines (the list sets `divide-y divide-border`).
export const rowLink = 'flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-brand-soft/60'

// Section headings inside a page (the page itself has the one <h1>).
export const sectionTitle = 'text-base font-semibold tracking-[-0.01em] text-fg'

// The page heading row: title on the left, actions on the right, wrapping on small screens.
export const pageHeader = 'mb-7 flex flex-wrap items-end justify-between gap-x-4 gap-y-3'
export const pageTitle = 'text-[30px] font-medium leading-tight tracking-[-0.035em] text-fg'
export const pageLead = 'mt-1.5 max-w-2xl text-sm text-fg-muted'

// Small rounded label: counts, types, roles.
export const chip =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-surface/70 px-2.5 py-0.5 text-xs font-medium text-fg-muted'

// The landing page's pill badge: a dot and a short uppercase line.
export const badge =
  'inline-flex items-center gap-2 rounded-full border border-fg/15 bg-surface/40 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-fg'

// Inline text link: underlined, so it never depends on colour alone.
export const textLink = 'font-medium text-accent underline decoration-accent/40 underline-offset-[3px] hover:decoration-accent'

// Keyboard key.
export const kbd = 'rounded-md border border-border bg-surface/70 px-1.5 py-px font-mono text-[11px] text-fg-muted'

// Notices above a form or page.
export const notice = {
  error: 'rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger',
  success: 'rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success',
  info: 'rounded-lg border border-border bg-surface/70 px-3 py-2 text-sm text-fg-muted',
}
