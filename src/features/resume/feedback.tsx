import { Link } from '@tanstack/react-router'
import type { AtsReview, FitReview } from './review'

export function ReviewDisclosure() {
  return <p className="text-small text-muted-foreground">
    Running a review sends your resume text and, for a fit review, the job description to Google Gemini.
    Scores are estimates based on the supplied text.
  </p>
}

function ReviewScore({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <strong className="font-display text-3xl tabular-nums">{score}<span className="text-base text-muted-foreground"> / 100</span></strong>
      <h3 className="font-medium">{label}</h3>
    </div>
  )
}

function FeedbackList({ label, items }: { label: string; items: string[] }) {
  return (
    <section>
      <h4 className="font-semibold">{label}</h4>
      {items.length ? <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
        {items.map((item, index) => <li key={index}>{item}</li>)}
      </ul> : <p className="text-muted-foreground">None identified.</p>}
    </section>
  )
}

export function AtsFeedback({ review }: { review: AtsReview }) {
  return (
    <div className="space-y-4 border-t pt-5 text-small">
      <ReviewScore label="ATS-readiness estimate" score={review.score} />
      <dl className="space-y-2">
        <div><dt className="font-semibold">Section structure</dt><dd className="text-muted-foreground">{review.structure}</dd></div>
        <div><dt className="font-semibold">Clarity</dt><dd className="text-muted-foreground">{review.clarity}</dd></div>
        <div><dt className="font-semibold">Evidence of impact</dt><dd className="text-muted-foreground">{review.impact}</dd></div>
      </dl>
      <FeedbackList label="Suggested edits" items={review.edits} />
    </div>
  )
}

export function FitFeedback({ review }: { review: FitReview }) {
  return (
    <div className="space-y-4 border-t pt-5 text-small">
      <ReviewScore label="Job fit estimate" score={review.score} />
      <section>
        <h4 className="font-semibold">Matched requirements</h4>
        {review.matches.length ? (
          <ul className="mt-2 space-y-2">
            {review.matches.map(({ requirement, evidence }, index) => (
              <li key={index} className="border-l-2 pl-3 text-muted-foreground">
                <p><strong className="text-foreground">Posting</strong> “{requirement}”</p>
                <p><strong className="text-foreground">Resume</strong> “{evidence}”</p>
              </li>
            ))}
          </ul>
        ) : <p className="text-muted-foreground">No matches identified.</p>}
      </section>
      <FeedbackList label="Gaps to check" items={review.gaps} />
      <FeedbackList label="Suggested edits in priority order" items={review.edits} />
    </div>
  )
}

export function ResumeRequired() {
  return <p className="text-small text-muted-foreground"><Link to="/workspace/resume" className="text-primary underline">Upload a resume</Link> to review your fit.</p>
}
