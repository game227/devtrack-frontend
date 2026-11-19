// A small ring that spins next to a button's label while its action runs. The label itself stays, so
// the button keeps its width and its name; the button also gets aria-busy.
export function Spinner({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`inline-block animate-spin h-3.5 w-3.5 shrink-0 rounded-full border-2 border-current border-r-transparent ${className}`} />
}
