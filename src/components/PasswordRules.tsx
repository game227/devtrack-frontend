import { useT } from '../i18n'
import { Icon } from './Icon'

// What the server will accept, checked while typing (length and "not only digits"); the rest — not a
// common password, not like your name or email — is said up front instead of after a failed submit.
export function PasswordRules({ value }: { value: string }) {
  const t = useT()
  const rules = [
    { key: 'password.rule.length', ok: value.length >= 8 },
    { key: 'password.rule.digits', ok: value.length > 0 && !/^\d+$/.test(value) },
  ]
  return (
    <div className="mt-1.5 text-xs text-fg-muted">
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {rules.map((rule) => (
          <li key={rule.key} className={`flex items-center gap-1 ${rule.ok ? 'text-success' : ''}`}>
            <Icon name={rule.ok ? 'check' : 'close'} className="h-3 w-3" />
            {t(rule.key)}
          </li>
        ))}
      </ul>
      <p className="mt-1">{t('password.rule.other')}</p>
    </div>
  )
}
