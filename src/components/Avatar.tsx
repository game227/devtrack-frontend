interface AvatarProps {
  name: string
  src?: string | null
  size?: number
}

// The same person always gets the same tint, so faces in a list are told apart before names are read.
function hue(name: string): number {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % 360
  return hash
}

export function Avatar({ name, src, size = 24 }: AvatarProps) {
  const dimension = { width: size, height: size }
  if (src) {
    return <img src={src} alt="" className="shrink-0 rounded-full object-cover ring-1 ring-border" style={dimension} />
  }
  const h = hue(name.trim().toLowerCase())
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold uppercase leading-none"
      style={{
        ...dimension,
        fontSize: Math.max(9, Math.round(size * 0.4)),
        backgroundColor: `light-dark(hsl(${h} 45% 88%), hsl(${h} 30% 24%))`,
        color: `light-dark(hsl(${h} 55% 24%), hsl(${h} 70% 86%))`,
      }}
    >
      {name.trim().slice(0, 2)}
    </span>
  )
}
