import { TrackProgress } from './Track'

// Kept for its call sites; the progress line itself is drawn by TrackProgress.
export function ProgressBar({ percent, label }: { percent: number; label: string }) {
  return <TrackProgress percent={percent} label={label} />
}
