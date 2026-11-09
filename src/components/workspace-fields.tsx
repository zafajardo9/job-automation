import { useState, type ComponentProps, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

export const inputClass = 'w-full min-w-0 rounded-md border border-border bg-background px-3 py-2 text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function Field({ label, className, type = 'text', ...props }: ComponentProps<'input'> & { label: string }) {
  const [passwordVisible, setPasswordVisible] = useState(false)
  const isPassword = type === 'password'

  return (
    <label className="flex flex-col gap-1.5 text-small font-medium">
      {label}
      <div className="relative">
        <input
          {...props}
          type={isPassword && passwordVisible ? 'text' : type}
          className={cn(inputClass, isPassword && 'pr-11', className)}
        />
        {isPassword && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setPasswordVisible((visible) => !visible)}
            // Browsers move focus to a clicked button; keep the caret in the field.
            onMouseDown={(event) => event.preventDefault()}
            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
            title={passwordVisible ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-1 my-auto text-neutral hover:text-foreground"
          >
            {passwordVisible ? <EyeOff /> : <Eye />}
          </Button>
        )}
      </div>
    </label>
  )
}

export function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return (
    <p role={error ? 'alert' : 'status'}
      className={cn('rounded-md border px-3 py-2 text-small', error ? 'border-destructive/40 text-destructive' : 'text-muted-foreground')}>
      {children}
    </p>
  )
}

export function PageTitle({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h1 className="text-heading">{title}</h1>
      <p className="mt-2 max-w-[68ch] text-body text-muted-foreground">{children}</p>
    </div>
  )
}

export function actionError(error: unknown, fallback: string) {
  // Validation messages can contain serialized issue arrays. Keep the UI actionable.
  return error instanceof Error && error.message && !error.message.startsWith('[') && error.message.length < 200
    ? error.message
    : fallback
}
