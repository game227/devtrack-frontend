import { useState } from 'react'
import type { FormEvent } from 'react'
import { disableTwoFactor, enableTwoFactor, setupTwoFactor } from '../api/auth'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'
import { useI18n } from '../i18n'
import { FormField, formInputClass } from './FormField'

const buttonClass =
  'rounded-md border border-border px-3 py-2 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg disabled:opacity-50'

type Step = 'idle' | 'password' | 'scan' | 'codes' | 'disable'

export function TwoFactorCard({ enabled, onChanged }: { enabled: boolean; onChanged: () => Promise<void> }) {
  const { t, lang } = useI18n()
  const [step, setStep] = useState<Step>('idle')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [secret, setSecret] = useState<{ secret: string; otpauth_uri: string } | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [errors, setErrors] = useState<FieldErrors>({})
  const [busy, setBusy] = useState(false)

  function reset(next: Step = 'idle') {
    setStep(next)
    setPassword('')
    setCode('')
    setErrors({})
  }

  async function run(action: () => Promise<void>) {
    setErrors({})
    setBusy(true)
    try {
      await action()
    } catch (error) {
      setErrors(extractFieldErrors(error, lang))
    } finally {
      setBusy(false)
    }
  }

  const startSetup = (event: FormEvent) => {
    event.preventDefault()
    void run(async () => {
      setSecret(await setupTwoFactor(password))
      reset('scan')
    })
  }
  const confirm = (event: FormEvent) => {
    event.preventDefault()
    void run(async () => {
      setRecoveryCodes(await enableTwoFactor(code))
      reset('codes')
      await onChanged()
    })
  }
  const turnOff = (event: FormEvent) => {
    event.preventDefault()
    void run(async () => {
      await disableTwoFactor(password, code)
      reset()
      await onChanged()
    })
  }

  const general = errors.detail ?? errors.non_field_errors

  return (
    <section aria-labelledby="two-factor-title" className="space-y-3 rounded-2xl border border-border bg-bg-elevated p-5">
      <h2 id="two-factor-title" className="text-sm font-semibold text-fg">
        {t('twoFactor.title')}
      </h2>
      <p className="text-sm text-fg-muted">{t(enabled ? 'twoFactor.on' : 'twoFactor.off')}</p>
      {general && (
        <p role="alert" className="text-sm text-danger">
          {general.join(' ')}
        </p>
      )}

      {step === 'idle' && !enabled && (
        <button type="button" className={buttonClass} onClick={() => reset('password')}>
          {t('twoFactor.enable')}
        </button>
      )}
      {step === 'idle' && enabled && (
        <button type="button" className={buttonClass} onClick={() => reset('disable')}>
          {t('twoFactor.disable')}
        </button>
      )}

      {step === 'password' && (
        <form onSubmit={startSetup} className="space-y-3">
          <FormField label={t('profile.currentPassword')} errors={errors.password}>
            <input type="password" className={formInputClass} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </FormField>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className={buttonClass}>{t('twoFactor.continue')}</button>
            <button type="button" className={buttonClass} onClick={() => reset()}>{t('common.cancel')}</button>
          </div>
        </form>
      )}

      {step === 'scan' && secret && (
        <form onSubmit={confirm} className="space-y-3">
          <p className="text-sm text-fg-muted">{t('twoFactor.scanHint')}</p>
          <p className="break-all rounded-md border border-border-strong px-3 py-2 font-mono text-sm text-fg" aria-label={t('twoFactor.secretLabel')}>
            {secret.secret.match(/.{1,4}/g)?.join(' ')}
          </p>
          <a href={secret.otpauth_uri} className="text-sm text-accent hover:underline">
            {t('twoFactor.openInApp')}
          </a>
          <FormField label={t('auth.otp')} errors={errors.code}>
            <input className={formInputClass} value={code} onChange={(e) => setCode(e.target.value)} autoComplete="one-time-code" inputMode="numeric" required />
          </FormField>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className={buttonClass}>{t('twoFactor.confirm')}</button>
            <button type="button" className={buttonClass} onClick={() => reset()}>{t('common.cancel')}</button>
          </div>
        </form>
      )}

      {step === 'codes' && (
        <div className="space-y-3">
          <p role="status" className="text-sm text-fg">{t('twoFactor.codesHint')}</p>
          <ul aria-label={t('twoFactor.codesLabel')} className="grid grid-cols-2 gap-1 font-mono text-sm text-fg">
            {recoveryCodes.map((recovery) => (
              <li key={recovery}>{recovery}</li>
            ))}
          </ul>
          <button type="button" className={buttonClass} onClick={() => { setRecoveryCodes([]); reset() }}>
            {t('twoFactor.savedThem')}
          </button>
        </div>
      )}

      {step === 'disable' && (
        <form onSubmit={turnOff} className="space-y-3">
          <FormField label={t('profile.currentPassword')} errors={errors.password}>
            <input type="password" className={formInputClass} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </FormField>
          <FormField label={t('auth.otp')} errors={errors.code}>
            <input className={formInputClass} value={code} onChange={(e) => setCode(e.target.value)} autoComplete="one-time-code" required />
          </FormField>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className={buttonClass}>{t('twoFactor.disable')}</button>
            <button type="button" className={buttonClass} onClick={() => reset()}>{t('common.cancel')}</button>
          </div>
        </form>
      )}
    </section>
  )
}
