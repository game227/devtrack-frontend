export interface UserBrief {
  id: number
  username: string
  avatar: string | null
}

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  avatar: string | null
  bio: string
  title: string
  date_joined: string
}

export interface AuthTokens {
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
}

export interface LoginPayload {
  username: string
  password: string
}

export interface UpdateMePayload {
  first_name?: string
  last_name?: string
  bio?: string
  title?: string
  avatar?: File
}

export interface ChangePasswordPayload {
  old_password: string
  new_password: string
  new_password_confirm: string
}

export interface RequestPasswordResetPayload {
  email: string
}

export interface ConfirmPasswordResetPayload {
  uid: string
  token: string
  new_password: string
  new_password_confirm: string
}
