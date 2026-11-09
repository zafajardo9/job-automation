import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, FileText, Link2, Search } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'

export const Route = createFileRoute('/')({
  component: Home,
  head: () => ({ meta: [{ title: 'JobFinder | Find work that fits' }] }),
})

const features = [
  { title: 'Find and save jobs', detail: 'Search for openings, bring in descriptions, and track where you applied.', icon: Search },
  { title: 'Review your resume', detail: 'Get an ATS-readiness estimate and practical edits for the roles you want.', icon: FileText },
  { title: 'Keep your links handy', detail: 'Store your LinkedIn, GitHub, and portfolio links in your private profile.', icon: Link2 },
]

function Home() {
  const { viewer } = Route.useRouteContext()
  return (
    <>
      <section className="page-container py-16 sm:py-24">
        <p className="text-overline font-medium uppercase tracking-wide text-muted-foreground">Your private job search workspace</p>
        <h1 className="mt-4 max-w-[16ch] text-display">Find work that fits the way you think.</h1>
        <p className="mt-5 max-w-[53ch] text-body text-muted-foreground sm:text-subhead">
          Find real openings, keep a shortlist, and see how your resume fits before you apply.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link to={viewer.user ? '/workspace' : '/signup'}>
            {viewer.user ? 'Open workspace' : 'Create an account'} <ArrowRight />
          </Link>
        </Button>
      </section>
      <section className="border-t bg-card/40" aria-label="Features">
        <div className="page-container grid gap-5 py-12 md:grid-cols-3">
          {features.map(({ title, detail, icon: Icon }) => (
            <Card key={title} className="gap-3 p-6">
              <Icon className="size-5 text-primary" aria-hidden="true" />
              <h2 className="font-display text-lg font-semibold">{title}</h2>
              <p className="text-small text-muted-foreground">{detail}</p>
            </Card>
          ))}
        </div>
      </section>
    </>
  )
}
