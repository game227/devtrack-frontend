import { useI18n } from '../i18n'
import { relativeParts } from '../lib/relativeTime'

// "5 min ago" / "3 h ago" / "2 d ago" in the active language; a plain date once it is over a month old.
export function useTimeAgo(): (iso: string | null | undefined) => string {
  const { t, formatDate } = useI18n()
  return (iso) => {
    if (!iso) return ''
    const parts = relativeParts(iso)
    if (parts === null) return formatDate(iso)
    switch (parts.unit) {
      case 'now':
        return t('time.justNow')
      case 'minutes':
        return t('time.minutesAgo', { count: parts.count })
      case 'hours':
        return t('time.hoursAgo', { count: parts.count })
      case 'days':
        return t('time.daysAgo', { count: parts.count })
    }
  }
}
