interface AvatarProps {
  name: string
  src?: string | null
  size?: number
}

export function Avatar({ name, src, size = 24 }: AvatarProps) {
  const dimension = { width: size, height: size }
  if (src) {
    return <img src={src} alt="" className="shrink-0 rounded-full border border-border object-cover" style={dimension} />
  }
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full border border-border text-[10px] font-medium uppercase text-fg-muted"
      style={dimension}
    >
      {name.trim().slice(0, 2)}
    </span>
  )
}
