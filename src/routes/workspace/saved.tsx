import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { actionError, inputClass, Notice, PageTitle } from '~/components/workspace-fields'
import { FitFeedback, ResumeRequired, ReviewDisclosure } from '~/features/resume/feedback'
import { runJobReview } from '~/features/resume/resume-functions'
import { listSavedJobs, updateJobStatus } from '~/features/roles/job-functions'
import { publicLink } from '~/features/roles/job-input'
import { jobStatuses, type JobStatus } from '~/lib/job-status'

export const Route = createFileRoute('/workspace/saved')({
  loader: () => listSavedJobs(),
  component: SavedJobs,
})

type SavedData = Awaited<ReturnType<typeof listSavedJobs>>

function SavedJobs() {
  const { rows, resumeId, reviewEnabled } = Route.useLoaderData()
  return (
    <>
      <PageTitle title="Saved Jobs">Keep track of openings and compare each posting with your active resume.</PageTitle>
      {!rows.length && <Card className="items-start gap-3 p-6">
        <p className="text-small text-muted-foreground">Your shortlist is empty.</p>
        <Button asChild><Link to="/workspace">Find a job</Link></Button>
      </Card>}
      {rows.map((job) => <SavedJob key={job.id} job={job} resumeId={resumeId} reviewEnabled={reviewEnabled} />)}
    </>
  )
}

function SavedJob({ job, resumeId, reviewEnabled }: Pick<SavedData, 'resumeId' | 'reviewEnabled'> & { job: SavedData['rows'][number] }) {
  const router = useRouter()
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const source = publicLink.safeParse(job.url)

  async function act(label: string, action: () => Promise<void>) {
    setBusy(label)
    setError('')
    try {
      await action()
      await router.invalidate()
    } catch (error) {
      setError(actionError(error, 'Could not update this job. Try again.'))
    } finally {
      setBusy('')
    }
  }

  return (
    <Card id={job.id} className="scroll-mt-20 gap-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-subhead">{job.title}</h2>
          <p className="mt-1 text-small text-muted-foreground">{[job.company, job.location].filter(Boolean).join(' · ')}</p>
          {source.success && <a href={source.data} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-small text-primary hover:underline">
            Original posting <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>}
        </div>
        <div className="flex flex-col gap-1.5 text-small font-medium">
          <label htmlFor={`status-${job.id}`}>Application status</label>
          <select id={`status-${job.id}`} className={inputClass} value={job.status} disabled={Boolean(busy)}
            onChange={(event) => {
              const status = event.target.value as JobStatus
              void act('status', () => updateJobStatus({ data: { jobId: job.id, status } }))
            }}>
            {jobStatuses.map((status) => <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>)}
          </select>
        </div>
      </div>
      {job.description ? (
        <details className="rounded-md border p-3 text-small">
          <summary className="cursor-pointer font-medium">Job description</summary>
          <p className="mt-3 whitespace-pre-wrap break-words text-muted-foreground">{job.description}</p>
        </details>
      ) : <p className="text-small text-muted-foreground">This saved job has no description.</p>}
      <ReviewDisclosure />
      {!reviewEnabled && <p className="text-small text-muted-foreground">Gemini reviews are currently unavailable.</p>}
      {!resumeId && <ResumeRequired />}
      <Button type="button" variant="outline" className="self-start"
        disabled={Boolean(busy) || !resumeId || !job.description || !reviewEnabled}
        onClick={() => resumeId && void act('review', () => runJobReview({ data: { jobId: job.id, resumeId } }))}>
        {busy === 'review' ? 'Reviewing...' : 'Review job fit'}
      </Button>
      {error && <Notice error>{error}</Notice>}
      {job.review && <FitFeedback review={job.review} />}
    </Card>
  )
}
