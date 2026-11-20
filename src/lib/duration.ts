type T = (key: string, params?: Record<string, string | number>) => string

// "1 h 30 min", "2 h", "45 min".
export function formatMinutes(t: T, minutes: number) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours && rest) return t('time.hm', { h: hours, m: rest })
  if (hours) return t('time.h', { h: hours })
  return t('time.m', { m: rest })
}
