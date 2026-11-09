import { appName } from '~/lib/app'


export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="page-container flex flex-col gap-8 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-[34ch]">
          <a href="/" className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-sm bg-primary font-display text-caption font-bold text-primary-foreground">
              J
            </span>
            <span className="font-display text-sm font-semibold tracking-tight">
              {appName}
            </span>
          </a>
          <p className="mt-3 text-small text-muted-foreground">
            A calmer way to find, save, and track the roles worth your time.
          </p>
        </div>

        <p className="flex items-center gap-2 text-small text-muted-foreground">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
          Genesis design system
        </p>
      </div>

      <div className="page-container">
        <p className="border-t border-border py-6 text-caption text-neutral">
          © 2026 {appName}. Built with TanStack Start, Drizzle ORM, and
          shadcn/ui.
        </p>
      </div>
    </footer>
  )
}
