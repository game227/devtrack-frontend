import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Markdown for descriptions, comments and notes (GitHub flavour: tables, task lists, strikethrough).
// Raw HTML is never rendered and links keep only safe protocols (react-markdown's defaults), so a
// comment cannot inject markup or a javascript: link. Headings step down two levels, because the page
// already has its own <h1> and <h2>s.
const components: Components = {
  h1: ({ children }) => <h3 className="mb-2 mt-4 text-lg font-semibold tracking-[-0.01em] first:mt-0">{children}</h3>,
  h2: ({ children }) => <h4 className="mb-2 mt-4 text-base font-semibold first:mt-0">{children}</h4>,
  h3: ({ children }) => <h5 className="mb-1.5 mt-3 text-[15px] font-semibold first:mt-0">{children}</h5>,
  h4: ({ children }) => <h6 className="mb-1.5 mt-3 text-sm font-semibold first:mt-0">{children}</h6>,
  h5: ({ children }) => <h6 className="mb-1.5 mt-3 text-sm font-semibold first:mt-0">{children}</h6>,
  h6: ({ children }) => <h6 className="mb-1.5 mt-3 text-sm font-semibold first:mt-0">{children}</h6>,
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
  a: ({ href, children }) => {
    const external = typeof href === 'string' && /^https?:/i.test(href)
    return (
      <a
        href={href}
        className="font-medium text-accent underline decoration-accent/40 underline-offset-[3px] hover:decoration-accent"
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
      </a>
    )
  },
  ul: ({ children, className }) => (
    <ul className={`my-2 space-y-1 pl-5 ${className?.includes('contains-task-list') ? 'list-none pl-1' : 'list-disc'}`}>{children}</ul>
  ),
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  input: ({ checked }) => <input type="checkbox" checked={checked} disabled className="mr-2 h-3.5 w-3.5 translate-y-[2px] accent-[var(--color-fg)]" />,
  blockquote: ({ children }) => <blockquote className="my-2 border-l-2 border-fg/25 pl-3 text-fg-muted">{children}</blockquote>,
  code: ({ className, children }) => {
    const block = typeof className === 'string' && className.startsWith('language-')
    return block ? (
      <code className={`${className} font-mono text-[13px]`}>{children}</code>
    ) : (
      <code className="rounded-md bg-well px-1.5 py-0.5 font-mono text-[13px]">{children}</code>
    )
  },
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-lg border border-border bg-well p-3 font-mono text-[13px] leading-relaxed">{children}</pre>
  ),
  hr: () => <hr className="my-4 border-border" />,
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border-b border-border px-2 py-1.5 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-b border-border px-2 py-1.5">{children}</td>,
  img: ({ alt }) => <span className="text-fg-muted">[{alt || 'image'}]</span>,
}

export function Markdown({ children, className = '' }: { children: string; className?: string }) {
  return (
    <div className={`min-w-0 break-words ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components} skipHtml>
        {children}
      </ReactMarkdown>
    </div>
  )
}
