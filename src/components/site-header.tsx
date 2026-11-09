import { Link } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '~/components/ui/sheet'
import { Button } from '~/components/ui/button'
import { authClient } from '~/features/auth/auth-client'
import { appName } from '~/lib/app'
import { navigation } from '~/lib/navigation'
import { ThemeToggle } from './theme-toggle'

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState(false)

  async function signOut() {
    setSigningOut(true)
    setError(false)
    try {
      const result = await authClient.signOut()
      if (result.error) throw new Error()
      window.location.replace('/')
    } catch {
      setError(true)
      setSigningOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="page-container flex h-14 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 rounded-md">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary font-display text-sm font-bold text-primary-foreground">J</span>
          <span className="font-display text-[15px] font-semibold">{appName}</span>
        </Link>
        {signedIn && (
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {navigation.map(({ to, label, exact }) => (
              <Link key={to} to={to} activeOptions={{ exact }}
                className="rounded-md px-3 py-2 text-small font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                activeProps={{ className: 'bg-accent text-foreground' }}
              >{label}</Link>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-2">
          {!signedIn && <ThemeToggle />}
          {signedIn ? (
            <>
              <Button variant="ghost" size="sm" disabled={signingOut} onClick={signOut}>Log out</Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="Open menu"><Menu /></Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader><SheetTitle>Workspace</SheetTitle></SheetHeader>
                  <nav aria-label="Mobile" className="flex flex-col px-4">
                    {navigation.map(({ to, label, exact }) => (
                      <SheetClose asChild key={to}>
                        <Link to={to} activeOptions={{ exact }} className="border-b py-3 text-small">
                          {label}
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/login">Log in</Link></Button>
              <Button asChild size="sm"><Link to="/signup">Sign up</Link></Button>
            </>
          )}
        </div>
      </div>
      {error && <p role="alert" className="page-container pb-2 text-small text-destructive">Could not log out. Try again.</p>}
    </header>
  )
}
