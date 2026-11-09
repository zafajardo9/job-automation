import { Link } from '@tanstack/react-router'
import { LoaderCircle, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { actionError, Notice } from '~/components/workspace-fields'
import { runProfileReview } from './profile-functions'
import type { ProfileReview } from './profile-review'

export function ProfileChecker({ enabled, hasContent, hasEdits }: {
  enabled: boolean
  hasContent: boolean
  hasEdits: boolean
}) {
  const [review, setReview] = useState<ProfileReview | null>(null)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  async function check() {
    setChecking(true)
    setError('')
    try {
      setReview(await runProfileReview())
    } catch (error) {
      setError(actionError(error, 'Could not check your profile. Try again.'))
    } finally {
      setChecking(false)
    }
  }

  return (
    <Card className="max-w-3xl gap-4 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-subhead">AI profile checker</h2>
          <p className="mt-1 text-small text-muted-foreground">See what stands out to a recruiter and what to improve for your target role.</p>
        </div>
      </div>
      <p className="text-small text-muted-foreground">
        Checking sends your saved headline, target role, summary, experience, and link counts or presence to Google Gemini.
      </p>
      {!enabled && <Notice>
        <Link to="/workspace/settings" className="font-medium text-primary underline">Set up Gemini</Link> to check your profile.
      </Notice>}
      {enabled && (hasEdits || !hasContent) && <Notice>
        {hasEdits ? 'Save your profile changes before checking.' : 'Add and save a headline, summary, or experience entry to get feedback.'}
      </Notice>}
      <Button type="button" className="self-start" disabled={!enabled || !hasContent || hasEdits || checking} onClick={check}>
        {checking && <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
        {checking ? 'Checking profile...' : review ? 'Check again' : 'Check my profile'}
      </Button>
      {checking && <p role="status" className="sr-only">Checking your saved profile.</p>}
      {error && <Notice error>{error}</Notice>}
      {review && (
        <div aria-live="polite" className="space-y-4 border-t pt-4 text-small">
          <section>
            <h3 className="font-semibold">Overall assessment</h3>
            <p className="mt-1 text-muted-foreground">{review.assessment}</p>
          </section>
          {review.strengths.length > 0 && (
            <section>
              <h3 className="font-semibold">What’s working</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                {review.strengths.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </section>
          )}
          <section>
            <h3 className="font-semibold">What to improve first</h3>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-muted-foreground">
              {review.improvements.map((item, index) => <li key={index}>{item}</li>)}
            </ol>
          </section>
        </div>
      )}
    </Card>
  )
}
