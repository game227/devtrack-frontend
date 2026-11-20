import { useState } from 'react'
import { useT } from '../i18n'
import { formInputClass } from './FormField'
import { Markdown } from './Markdown'

// A Markdown text area with a preview: "Write" shows the text, "Preview" shows how it will look.
export function MarkdownField({
  label,
  value,
  onChange,
  rows = 6,
  autoFocus = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
  autoFocus?: boolean
}) {
  const t = useT()
  const [preview, setPreview] = useState(false)
  const tab = (active: boolean) =>
    `flex h-7 items-center rounded-lg px-3 text-xs font-medium transition-colors ${active ? 'bg-brand-soft text-fg shadow-panel' : 'text-fg-muted hover:text-fg'}`
  return (
    <div>
      <div role="group" aria-label={label} className="mb-2 inline-flex gap-0.5 rounded-xl bg-fg/[0.07] p-1">
        <button type="button" aria-pressed={!preview} onClick={() => setPreview(false)} className={tab(!preview)}>
          {t('markdown.write')}
        </button>
        <button type="button" aria-pressed={preview} onClick={() => setPreview(true)} className={tab(preview)}>
          {t('markdown.preview')}
        </button>
      </div>
      {preview ? (
        <div className="min-h-32 rounded-md border border-border bg-surface/60 px-3 py-2.5 text-[15px] leading-relaxed">
          {value.trim() ? <Markdown>{value}</Markdown> : <p className="text-fg-muted">{t('markdown.empty')}</p>}
        </div>
      ) : (
        <textarea
          aria-label={label}
          className={`${formInputClass} mt-0! text-[15px] leading-relaxed`}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
        />
      )}
      <p className="mt-1.5 text-xs text-fg-muted">{t('markdown.hint')}</p>
    </div>
  )
}
