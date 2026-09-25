import { useSyncExternalStore } from 'react'
import { getPreference, setPreference, subscribePreference } from '../lib/theme'

export function useTheme() {
  const preference = useSyncExternalStore(subscribePreference, getPreference, getPreference)
  return { preference, setPreference }
}
