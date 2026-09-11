import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { changePassword as changePasswordRequest, updateMe } from '../api/auth'
import { getUserAnalytics } from '../api/analytics'
import { FormField, formInputClass } from '../components/FormField'
import { StatCard } from '../components/StatCard'
import { DailyActivityChart } from '../components/DailyActivityChart'
import { useAuth } from '../features/auth/AuthContext'
import { useWorkspace } from '../features/workspace/WorkspaceContext'
import { extractFieldErrors, type FieldErrors } from '../features/auth/errors'
import type { User } from '../types/auth'

export function ProfilePage() {
  const { user, refreshUser } = useAuth()

  if (!user) {
    return null
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-semibold text-fg">Profile</h1>
      <ProfileForm user={user} onSaved={refreshUser} />
      <PasswordForm />
      <DeveloperAnalyticsCard userId={user.id} />
    </div>
  )
}

function DeveloperAnalyticsCard({ userId }: { userId: number }) {
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspace()
  const workspaceId = currentWorkspace?.id

  const analyticsQuery = useQuery({
    queryKey: ['user-analytics', userId, workspaceId],
    queryFn: () => getUserAnalytics(userId, workspaceId!),
    enabled: workspaceId !== undefined,
  })

  if (isWorkspaceLoading || analyticsQuery.isLoading) {
    return <p className="text-sm text-fg-muted">Loading activity…</p>
  }
  if (!currentWorkspace || analyticsQuery.isError || !analyticsQuery.data) {
    return null
  }

  const analytics = analyticsQuery.data

  return (
    <div className="rounded border border-border bg-bg-elevated p-5">
      <h2 className="mb-3 text-sm font-semibold text-fg">
        My activity <span className="text-fg-muted">· {currentWorkspace.name}</span>
      </h2>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Projects" value={analytics.projects_count} />
        <StatCard label="Tasks completed" value={analytics.tasks_completed} />
        <StatCard label="Issues resolved" value={analytics.issues_resolved} />
        <StatCard label="Open assigned" value={analytics.open_assigned} />
      </div>
      <div className="mb-1 text-xs text-fg-muted">Daily activity</div>
      <DailyActivityChart data={analytics.daily_activity} />
    </div>
  )
}

function ProfileForm({ user, onSaved }: { user: User; onSaved: () => Promise<void> }) {
  const [firstName, setFirstName] = useState(user.first_name)
  const [lastName, setLastName] = useState(user.last_name)
  const [bio, setBio] = useState(user.bio)
  const [title, setTitle] = useState(user.title)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setAvatarFile(file)
    if (file) {
      setAvatarPreview(URL.createObjectURL(file))
    }
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
      setErrors(extractFieldErrors(error))
      setStatus('idle')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded border border-border bg-bg-elevated p-5"
    >
      <div className="flex items-center gap-4">
        {avatarPreview ? (
          <img src={avatarPreview} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg text-xl text-fg-muted">
            {user.username.slice(0, 1).toUpperCase()}
          </div>
        )}
        <label className="cursor-pointer text-sm">
          <span className="block rounded border border-border px-3 py-1.5 text-fg-muted hover:bg-bg">
            Change avatar
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="First name" errors={errors.first_name}>
          <input
            className={formInputClass}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </FormField>
        <FormField label="Last name" errors={errors.last_name}>
          <input
            className={formInputClass}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </FormField>
      </div>

      <FormField label="Title" errors={errors.title}>
        <input
          className={formInputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Backend Developer"
        />
      </FormField>

      <FormField label="Bio" errors={errors.bio}>
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
          className="rounded bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving…' : 'Save changes'}
        </button>
        {status === 'saved' && <span className="text-sm text-fg-muted">Saved.</span>}
      </div>
    </form>
  )
}

function PasswordForm() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrors({})
    if (newPassword !== newPasswordConfirm) {
      setErrors({ new_password_confirm: ["Passwords don't match."] })
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
      setErrors(extractFieldErrors(error))
      setStatus('idle')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded border border-border bg-bg-elevated p-5"
    >
      <h2 className="text-sm font-semibold text-fg">Change password</h2>
      {errors.non_field_errors && (
        <p className="text-sm text-red-400">{errors.non_field_errors.join(' ')}</p>
      )}
      <FormField label="Current password" errors={errors.old_password}>
        <input
          type="password"
          className={formInputClass}
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          autoComplete="current-password"
        />
      </FormField>
      <FormField label="New password" errors={errors.new_password}>
        <input
          type="password"
          className={formInputClass}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
        />
      </FormField>
      <FormField label="Confirm new password" errors={errors.new_password_confirm}>
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
          className="rounded bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving…' : 'Update password'}
        </button>
        {status === 'saved' && <span className="text-sm text-fg-muted">Updated.</span>}
      </div>
    </form>
  )
}
