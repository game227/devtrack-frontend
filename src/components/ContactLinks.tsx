import { useT } from '../i18n'
import { CONTACT } from '../lib/contact'
import { Icon } from './Icon'
import type { IconName } from './Icon'

const ITEMS: Array<{ key: 'email' | 'phone' | 'instagram'; icon: IconName; href: string; value: string; external?: boolean }> = [
  { key: 'email', icon: 'mail', href: `mailto:${CONTACT.email}`, value: CONTACT.email },
  { key: 'phone', icon: 'phone', href: CONTACT.phoneHref, value: CONTACT.phone },
  { key: 'instagram', icon: 'instagram', href: CONTACT.instagramHref, value: `@${CONTACT.instagram}`, external: true },
]

// Round icon buttons (the landing page's hero). Each is named for what it does and where it goes.
export function ContactCircles({ className = '' }: { className?: string }) {
  const t = useT()
  return (
    <ul aria-label={t('contact.title')} className={`flex items-center gap-2 ${className}`}>
      {ITEMS.map((item) => (
        <li key={item.key}>
          <a
            href={item.href}
            aria-label={t(`contact.action.${item.key}`, { value: item.value })}
            title={item.value}
            {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-fg/20 bg-surface/30 text-fg transition-colors duration-150 hover:bg-fg hover:text-bg"
          >
            <Icon name={item.icon} size={17} />
          </a>
        </li>
      ))}
    </ul>
  )
}

// Rows with a label and the address itself (legal pages, Settings, the landing page's contact section).
export function ContactList({ className = '' }: { className?: string }) {
  const t = useT()
  return (
    <ul className={`divide-y divide-border overflow-hidden rounded-xl border border-edge bg-surface shadow-panel ${className}`}>
      {ITEMS.map((item) => (
        <li key={item.key}>
          <a
            href={item.href}
            {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="group flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-brand-soft/60"
          >
            <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-fg/15 bg-surface/60 text-fg">
              <Icon name={item.icon} size={16} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-fg-muted">{t(`contact.${item.key}`)}</span>{' '}
              <span className="block truncate text-[15px] font-medium text-fg group-hover:underline">{item.value}</span>
            </span>
            {item.external && <Icon name="external" size={15} className="shrink-0 text-fg-muted" />}
          </a>
        </li>
      ))}
    </ul>
  )
}
