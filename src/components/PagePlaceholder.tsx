interface PagePlaceholderProps {
  title: string
}

export function PagePlaceholder({ title }: PagePlaceholderProps) {
  return (
    <div>
      <h1 className="text-xl font-semibold text-fg">{title}</h1>
    </div>
  )
}
