import type { Lang } from '../i18n/core'
export interface UserBrief {
  id: number
  username: string
  avatar: string | null
}

export interface User {
  id: number
  username: string
  email: string
  email_verified: boolean
  // Two-factor authentication (an authenticator app code at sign-in) is on.
  totp_enabled: boolean
  first_name: string
  last_name: string
  avatar: string | null
  bio: string
  title: string
  // The Monday summary email for workspaces this user owns or administers.
  weekly_digest?: boolean
  date_joined: string
}

interface AuthTokens {
  access: string
  refresh: string
}

export interface AuthResponse extends AuthTokens {
  user: User
}

export interface RegisterPayload {
  username: string
  email: string
  password: string
  password_confirm: string
  first_name?: string
  last_name?: string
  lang?: Lang
}

export interface LoginPayload {
  username: string
  password: string
  // The authenticator (or recovery) code, for accounts with two-factor authentication on.
  otp?: string
}

export interface UpdateMePayload {
  first_name?: string
  last_name?: string
  bio?: string
  title?: string
  avatar?: File
  weekly_digest?: boolean
}

export interface ChangePasswordPayload {
  old_password: string
  new_password: string
  new_password_confirm: string
}

export interface RequestPasswordResetPayload {
  email: string
  // Language of the message that carries the reset link.
  lang?: Lang
}

export interface ConfirmPasswordResetPayload {
  uid: string
  token: string
  new_password: string
  new_password_confirm: string
}

export interface ConfirmEmailVerificationPayload {
  uid: string
  token: string
}

export interface DeleteAccountPayload {
  password: string
}
