// Class recipes for the design system in styles/index.css. Pages compose these instead of inventing
// their own button and panel classes, so the whole app changes together.

type Tone = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const BUTTON_BASE =
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50'

const BUTTON_SIZE: Record<Size, string> = {
  sm: 'h-8 px-2.5 text-[13px]',
  md: 'h-9 px-3.5 text-sm',
  lg: 'h-11 px-5 text-[15px]',
}

const BUTTON_TONE: Record<Tone, string> = {
  primary: 'bg-brand text-on-brand hover:bg-brand-strong',
  secondary: 'border border-border-strong bg-surface text-fg hover:bg-well',
  ghost: 'text-fg-muted hover:bg-well hover:text-fg',
  danger: 'border border-border-strong bg-surface text-danger hover:border-danger hover:bg-danger/10',
}

export function button(tone: Tone = 'secondary', size: Size = 'md'): string {
  return `${BUTTON_BASE} ${BUTTON_SIZE[size]} ${BUTTON_TONE[tone]}`
}

// A square icon-only button (its accessible name comes from aria-label).
export function iconButton(size: 'sm' | 'md' = 'md'): string {
  return `inline-flex shrink-0 items-center justify-center rounded-md text-fg-muted transition-colors duration-150 hover:bg-well hover:text-fg ${
    size === 'sm' ? 'h-8 w-8' : 'h-9 w-9'
  }`
}

// A white panel with a hairline: lists, forms and side panels sit in these.
export const panel = 'rounded-xl border border-border bg-surface'

// A form that opens in place (new project, new cycle, ...).
export const formPanel = 'mb-8 max-w-xl rounded-xl border border-border bg-surface p-5'

// A list of rows separated by hairlines.
export const listPanel = 'divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface'

// A row inside a panel list: rows are separated by hairlines (the list sets `divide-y divide-border`).
export const rowLink = 'flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-well'

// Section headings inside a page (the page itself has the one <h1>).
export const sectionTitle = 'text-base font-bold text-fg'

// The page heading row: title on the left, actions on the right, wrapping on small screens.
export const pageHeader = 'mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-3'
export const pageTitle = 'text-2xl font-extrabold tracking-[-0.015em] text-fg'
export const pageLead = 'mt-1 max-w-2xl text-sm text-fg-muted'

// Small rounded label: counts, types, roles.
export const chip =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-surface px-2 py-0.5 text-xs font-semibold text-fg-muted'

// Inline text link.
export const textLink = 'font-semibold text-accent underline-offset-2 hover:underline'

// Keyboard key.
export const kbd = 'rounded border border-border-strong bg-surface px-1.5 py-px font-mono text-[11px] text-fg-muted'

// Notices above a form or page.
export const notice = {
  error: 'rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger',
  success: 'rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-success',
  info: 'rounded-lg border border-border bg-well px-3 py-2 text-sm text-fg-muted',
}
