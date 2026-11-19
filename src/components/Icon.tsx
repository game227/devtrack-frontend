import type { SVGProps } from 'react'

// Minimal stroke icon set (24x24 grid, currentColor) — no icon dependency needed.
const PATHS = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  projects: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  issues: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </>
  ),
  board: (
    <>
      <rect x="3" y="4" width="5" height="16" rx="1.5" />
      <rect x="9.5" y="4" width="5" height="10" rx="1.5" />
      <rect x="16" y="4" width="5" height="13" rx="1.5" />
    </>
  ),
  cycles: (
    <>
      <path d="M20 12a8 8 0 1 1-2.3-5.7" />
      <path d="M20 4v4h-4" />
    </>
  ),
  milestones: (
    <>
      <path d="M5 21V4" />
      <path d="M5 4h11l-2 4 2 4H5" />
    </>
  ),
  notes: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </>
  ),
  timeline: (
    <>
      <rect x="3" y="4" width="10" height="4" rx="1.5" />
      <rect x="8" y="10" width="13" height="4" rx="1.5" />
      <rect x="5" y="16" width="9" height="4" rx="1.5" />
    </>
  ),
  analytics: <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />,
  teams: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <circle cx="17.5" cy="9" r="2.5" />
      <path d="M17 14.5a5 5 0 0 1 4.5 5" />
    </>
  ),
  overview: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="8" cy="17" r="2" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16v-5a6 6 0 1 1 12 0v5l1.5 2h-15z" />
      <path d="M10 21h4" />
    </>
  ),
  logout: (
    <>
      <path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
      <path d="m16 8 4 4-4 4M20 12H9" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  download: (
    <>
      <path d="M12 4v11" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 20h14" />
    </>
  ),
  bookmark: <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z" />,
  filter: <path d="M4 5h16l-6 7.5V19l-4-2v-4.5z" />,
  arrowRight: <path d="M5 12h14m-5-5 5 5-5 5" />,
  github: (
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  ),
  send: <path d="M21 3 10 14M21 3l-7 18-4-7-7-4z" />,
  shield: <path d="M12 3 4 6v6c0 4.5 3.3 8.3 8 9 4.7-.7 8-4.5 8-9V6z" />,
  branch: (
    <>
      <circle cx="6" cy="5" r="2" />
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="9" r="2" />
      <path d="M6 7v10M18 11a6 6 0 0 1-6 6H8" />
    </>
  ),
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  collapse: <path d="M4 12h6m0 0-3-3m3 3-3 3m13-3h-6m0 0 3-3m-3 3 3 3" />,
  star: <path d="m12 3.6 2.55 5.17 5.7.83-4.12 4.02.97 5.68L12 16.62 6.9 19.3l.97-5.68L3.75 9.6l5.7-.83z" />,
  sidebar: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M9.5 4v16" />
    </>
  ),
  members: (
    <>
      <circle cx="9.5" cy="8" r="3.5" />
      <path d="M3.5 19.5a6 6 0 0 1 12 0M18.5 8v6m-3-3h6" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  phone: <path d="M6.6 3.5h2.6l1.4 4-2 1.3a12.6 12.6 0 0 0 6.6 6.6l1.3-2 4 1.4v2.6a2 2 0 0 1-2.2 2A17.2 17.2 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z" />,
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
    </>
  ),
  keyboard: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M7.5 14h9" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </>
  ),
} as const

export type IconName = keyof typeof PATHS

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
}

export function Icon({ name, size = 16, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  )
}
