import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  changePassword as changePasswordRequest,
  deleteAccount,
  resendEmailVerification,
  updateMe,
} from '../api/auth'
import { getUserAnalytics } from '../api/analytics'
import { FormField, formInputClass } from '../components/FormField'
import { StatCard, StatRow } from '../components/StatCard'
import { DailyActivityChart } from '../components/DailyActivityChart'
import { useAuth } from '../features/auth/authContext'
import { useWorkspace } from '../features/workspace/workspaceContext'
import { TwoFactorCard } from '../components/TwoFactorCard'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'
import { useI18n } from '../i18n'
import type { User } from '../types/auth'
import { button, pageTitle } from '../components/ui'

export function ProfilePage() {
  const { t } = useI18n()
  const { user, refreshUser } = useAuth()

  if (!user) {
    return null
  }

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className={pageTitle}>{t('profile.title')}</h1>
      {!user.email_verified && <EmailVerificationBanner />}
      <ProfileForm user={user} onSaved={refreshUser} />
      <PasswordForm />
      <TwoFactorCard enabled={user.totp_enabled} onChanged={refreshUser} />
      <DeveloperAnalyticsCard userId={user.id} />
      <DeleteAccountForm />
    </div>
  )
}

function EmailVerificationBanner() {
  const { t, lang } = useI18n()
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')

  async function handleResend() {
    setStatus('sending')
    try {
      await resendEmailVerification(lang)
      setStatus('sent')
    } catch {
      setStatus('idle')
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 text-sm">
      <span className="text-fg-muted">{t('profile.emailUnverified')}</span>
      {status === 'sent' ? (
        <span role="status" className="text-fg-muted">{t('profile.verificationSent')}</span>
      ) : (
        <button
          type="button"
          onClick={handleResend}
          disabled={status === 'sending'}
          className={button('primary')}
        >
          {t('profile.resendVerification')}
        </button>
      )}
    </div>
  )
}

function DeleteAccountForm() {
  const { t, lang } = useI18n()
  const { logout } = useAuth()
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<'idle' | 'deleting'>('idle')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrors({})
    setStatus('deleting')
    try {
      await deleteAccount({ password })
      await logout()
    } catch (error) {
      setErrors(extractFieldErrors(error, lang))
      setStatus('idle')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-danger/40 bg-surface p-5"
    >
      <h2 className="text-base font-bold text-danger">{t('profile.deleteAccount')}</h2>
      <p className="text-sm text-fg-muted">{t('profile.deleteAccountHelp')}</p>
      {errors.non_field_errors && (
        <p role="alert" className="text-sm text-danger">{errors.non_field_errors.join(' ')}</p>
      )}
      <FormField label={t('profile.deleteAccountConfirm')} errors={errors.password}>
        <input
          type="password"
          className={formInputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </FormField>
      <button
        type="submit"
        disabled={status === 'deleting'}
        className={button('danger')}
      >
        {status === 'deleting' ? t('profile.deleting') : t('profile.deleteAccountButton')}
      </button>
    </form>
  )
}

function DeveloperAnalyticsCard({ userId }: { userId: number }) {
  const t = useI18n().t
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspace()
  const workspaceId = currentWorkspace?.id

  const analyticsQuery = useQuery({
    queryKey: ['user-analytics', userId, workspaceId],
    queryFn: () => getUserAnalytics(userId, workspaceId!),
    enabled: workspaceId !== undefined,
  })

  if (isWorkspaceLoading || analyticsQuery.isLoading) {
    return <p className="text-sm text-fg-muted">{t('profile.loadingActivity')}</p>
  }
  if (!currentWorkspace || analyticsQuery.isError || !analyticsQuery.data) {
    return null
  }

  const analytics = analyticsQuery.data

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-4 flex flex-wrap items-center gap-2 text-base font-bold text-fg">
        {t('profile.myActivity')}
        <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold text-fg-muted">{currentWorkspace.name}</span>
      </h2>
      <StatRow className="mb-5">
        <StatCard label={t('profile.projects')} value={analytics.projects_count} />
        <StatCard label={t('profile.tasksCompleted')} value={analytics.tasks_completed} />
        <StatCard label={t('profile.issuesResolved')} value={analytics.issues_resolved} />
        <StatCard label={t('profile.openAssigned')} value={analytics.open_assigned} />
      </StatRow>
      <h3 className="mb-2 text-sm font-bold text-fg">{t('profile.dailyActivity')}</h3>
      <DailyActivityChart data={analytics.daily_activity} />
    </div>
  )
}

const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const AVATAR_MAX_BYTES = 2 * 1024 * 1024

function ProfileForm({ user, onSaved }: { user: User; onSaved: () => Promise<void> }) {
  const { t, lang } = useI18n()
  const [firstName, setFirstName] = useState(user.first_name)
  const [lastName, setLastName] = useState(user.last_name)
  const [bio, setBio] = useState(user.bio)
  const [title, setTitle] = useState(user.title)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  // The preview always shows exactly what Save would upload (or the saved avatar when nothing will be).
  function showPreview(next: string | null) {
    setAvatarPreview((previous) => {
      if (previous?.startsWith('blob:')) URL.revokeObjectURL(previous)
      return next
    })
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    if (!file) {
      // The picker was cancelled: nothing new will be uploaded.
      setAvatarFile(null)
      showPreview(user.avatar)
      return
    }
    // The same limits the server enforces (JPEG/PNG/WebP, at most 2 MB), checked up front so the user is
    // told immediately instead of after an upload. A rejected file also drops any earlier pick.
    const problem = !AVATAR_TYPES.includes(file.type)
      ? t('profile.avatarType')
      : file.size > AVATAR_MAX_BYTES
        ? t('profile.avatarTooLarge')
        : null
    if (problem) {
      event.target.value = ''
      setAvatarFile(null)
      showPreview(user.avatar)
      setErrors((previous) => ({ ...previous, avatar: [problem] }))
      return
    }
    setErrors((previous) => Object.fromEntries(Object.entries(previous).filter(([field]) => field !== 'avatar')))
    showPreview(URL.createObjectURL(file))
    setAvatarFile(file)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrors({})
    setStatus('saving')
    try {
      await updateMe({
        first_name: firstName,
        last_name: lastName,
        bio,
        title,
        ...(avatarFile ? { avatar: avatarFile } : {}),
      })
      await onSaved()
      setStatus('saved')
    } catch (error) {
      setErrors(extractFieldErrors(error, lang))
      setStatus('idle')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-border bg-surface p-5"
    >
      <div className="flex items-center gap-4">
        {avatarPreview ? (
          <img src={avatarPreview} alt="" className="h-16 w-16 rounded-full object-cover ring-1 ring-border" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-well text-xl font-bold text-fg-muted">
            {user.username.slice(0, 1).toUpperCase()}
          </div>
        )}
        <label className="cursor-pointer rounded-md text-sm focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand">
          <span className="block rounded-md border border-border-strong bg-surface px-3 py-1.5 font-semibold text-fg transition-colors duration-150 hover:bg-well">
            {t('profile.changeAvatar')}
          </span>
          <input type="file" accept={AVATAR_TYPES.join(',')} className="sr-only" onChange={handleAvatarChange} />
        </label>
      </div>
      {errors.avatar && (
        <p role="alert" className="text-sm text-danger">
          {errors.avatar.join(' ')}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('profile.firstName')} errors={errors.first_name}>
          <input
            className={formInputClass}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </FormField>
        <FormField label={t('profile.lastName')} errors={errors.last_name}>
          <input
            className={formInputClass}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </FormField>
      </div>

      <FormField label={t('profile.jobTitle')} errors={errors.title}>
        <input
          className={formInputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('profile.jobTitlePlaceholder')}
        />
      </FormField>

      <FormField label={t('profile.bio')} errors={errors.bio}>
        <textarea
          className={formInputClass}
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </FormField>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === 'saving'}
          className={button('primary')}
        >
          {status === 'saving' ? t('common.saving') : t('profile.saveChanges')}
        </button>
        {status === 'saved' && <span role="status" className="text-sm text-fg-muted">{t('common.saved')}</span>}
      </div>
    </form>
  )
}

function PasswordForm() {
  const { t, lang } = useI18n()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrors({})
    if (newPassword !== newPasswordConfirm) {
      setErrors({ new_password_confirm: [t('error.passwordMismatch')] })
      return
    }
    setStatus('saving')
    try {
      await changePasswordRequest({
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      })
      setOldPassword('')
      setNewPassword('')
      setNewPasswordConfirm('')
      setStatus('saved')
    } catch (error) {
      setErrors(extractFieldErrors(error, lang))
      setStatus('idle')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-border bg-surface p-5"
    >
      <h2 className="text-base font-bold text-fg">{t('profile.changePassword')}</h2>
      {errors.non_field_errors && (
        <p role="alert" className="text-sm text-danger">{errors.non_field_errors.join(' ')}</p>
      )}
      <FormField label={t('profile.currentPassword')} errors={errors.old_password}>
        <input
          type="password"
          className={formInputClass}
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          autoComplete="current-password"
        />
      </FormField>
      <FormField label={t('profile.newPassword')} errors={errors.new_password}>
        <input
          type="password"
          className={formInputClass}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
        />
      </FormField>
      <FormField label={t('profile.confirmNewPassword')} errors={errors.new_password_confirm}>
        <input
          type="password"
          className={formInputClass}
          value={newPasswordConfirm}
          onChange={(e) => setNewPasswordConfirm(e.target.value)}
          autoComplete="new-password"
        />
      </FormField>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === 'saving'}
          className={button('primary')}
        >
          {status === 'saving' ? t('common.saving') : t('profile.updatePassword')}
        </button>
        {status === 'saved' && <span role="status" className="text-sm text-fg-muted">{t('profile.passwordUpdated')}</span>}
      </div>
    </form>
  )
}
