import { useEffect, type ReactNode } from 'react'
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { ReactGrab } from '~/components/react-grab'
import { SiteFooter } from '~/components/site-footer'
import { SiteHeader } from '~/components/site-header'
import { getViewer } from '~/features/auth/session'
import type { Appearance } from '~/features/settings/appearance'
import { appDescription, appName } from '~/lib/app'
import { syncTheme, themeInitScript } from '~/lib/theme'
import appCss from '~/styles/app.css?url'

export const Route = createRootRoute({
  beforeLoad: async () => ({ viewer: await getViewer() }),
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: appName },
      { name: 'description', content: appDescription },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'preconnect', href: 'https://api.fontshare.com' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400..700&family=JetBrains+Mono:wght@400;500&display=swap',
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
})

function RootComponent() {
  const { viewer } = Route.useRouteContext()
  return (
    <RootDocument appearance={viewer.user?.appearance}>
      <div className="flex min-h-svh flex-col">
        <SiteHeader signedIn={Boolean(viewer.user)} />
        <main className="flex-1">
          <Outlet />
        </main>
        <SiteFooter />
        <ReactGrab />
      </div>
    </RootDocument>
  )
}

function RootDocument({ children, appearance }: Readonly<{ children: ReactNode; appearance?: Appearance }>) {
  const theme = appearance?.theme
  useEffect(() => {
    if (theme) return syncTheme(theme)
  }, [theme])

  return (
    <html lang="en" data-theme={theme} data-accent={appearance?.accent}
      data-text-size={appearance?.textSize} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function NotFound() {
  return (
    <section className="page-container flex flex-col items-start gap-4 py-24">
      <p className="text-overline font-medium text-neutral uppercase">
        Error 404
      </p>
      <h1 className="text-headline">This page moved on</h1>
      <p className="max-w-[46ch] text-body text-muted-foreground">
        The role or page you were looking for is no longer here. Head back to
        the feed and pick up where you left off.
      </p>
      <a href="/" className="mt-2 text-small font-medium text-primary">
        Back to {appName}
      </a>
    </section>
  )
}
