import { describe, expect, it } from 'vitest'
import { localizeApiMessage } from './apiErrors'

describe('localizeApiMessage', () => {
  it.each([
    ['This field is required.', "Bu maydon to'ldirilishi shart."],
    ['This field may not be blank.', "Bu maydon bo'sh bo'lmasligi kerak."],
    ['A user with that username already exists.', 'Bu foydalanuvchi nomi band.'],
    ['No active account found with the given credentials', "Foydalanuvchi nomi yoki parol noto'g'ri."],
    ['Passwords do not match.', 'Parollar mos kelmadi.'],
    ['Invalid or expired token.', 'Tiklash havolasi yaroqsiz yoki muddati tugagan.'],
    ['User is already a member of this team.', "Foydalanuvchi allaqachon bu jamoaning a'zosi."],
    ['The workspace owner cannot be removed.', "Ish maydoni egasini olib tashlab bo'lmaydi."],
    ['Only a workspace admin/owner can do that.', 'Buni faqat ish maydoni admini yoki egasi bajara oladi.'],
    ["Only the comment's author or a workspace admin/owner can do that.", 'Buni faqat muallif yoki ish maydoni admini/egasi bajara oladi.'],
    ['Request was throttled. Expected available in 30 seconds.', "Juda ko'p so'rov yuborildi. Biroz kutib, qayta urinib ko'ring."],
  ])('translates %j into Uzbek', (message, expected) => {
    expect(localizeApiMessage('uz', message)).toBe(expected)
  })

  it('fills in numbers from the server message', () => {
    expect(localizeApiMessage('uz', 'This password is too short. It must contain at least 8 characters.')).toBe(
      "Parol juda qisqa. Kamida 8 ta belgi bo'lishi kerak.",
    )
    expect(localizeApiMessage('uz', 'Ensure this field has no more than 150 characters.')).toBe(
      'Bu maydon 150 ta belgidan oshmasligi kerak.',
    )
  })

  it('keeps the English wording when English is selected', () => {
    expect(localizeApiMessage('en', 'This field is required.')).toBe('This field is required.')
  })

  it('leaves unknown messages untouched', () => {
    expect(localizeApiMessage('uz', 'Something totally custom')).toBe('Something totally custom')
  })
})
