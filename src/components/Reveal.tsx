import type { CSSProperties, ElementType, ReactNode } from 'react'
import { useReveal } from '../hooks/useReveal'

type Variant = 'up' | 'left' | 'right' | 'scale'

// Content that eases in the first time it scrolls into view: up for text, from the side for pictures,
// a slight scale for frames. With "reduce motion" it is simply there (see .reveal in index.css).
export function Reveal({
  children,
  as: Tag = 'div',
  variant = 'up',
  delay = 0,
  className = '',
  id,
}: {
  children: ReactNode
  as?: ElementType
  variant?: Variant
  delay?: number
  className?: string
  id?: string
}) {
  const [ref, visible] = useReveal<HTMLElement>()
  return (
    <Tag
      ref={ref}
      id={id}
      data-reveal={visible ? 'shown' : 'hidden'}
      data-variant={variant}
      className={`reveal ${className}`}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  )
}
