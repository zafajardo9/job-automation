import { type ReactNode } from 'react'
import { cn } from '~/lib/utils'

export function Kbd({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <kbd
      className={cn(
        'rounded-sm border border-border bg-secondary px-2 py-0.5 font-mono text-caption text-muted-foreground',
        className,
      )}
    >
      {children}
    </kbd>
  )
}
