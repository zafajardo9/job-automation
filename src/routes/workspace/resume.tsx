import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { actionError, Field, Notice, PageTitle } from '~/components/workspace-fields'
import { AtsFeedback, ReviewDisclosure } from '~/features/resume/feedback'
import { deleteResume, getResume, runResumeReview } from '~/features/resume/resume-functions'

export const Route = createFileRoute('/workspace/resume')({
  loader: () => getResume(),
  component: ResumePage,
})

function ResumePage() {
  const { resume, reviewEnabled } = Route.useLoaderData()
  const router = useRouter()
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function act(label: string, action: () => Promise<void>, success: string) {
    setBusy(label)
    setError('')
    setNotice('')
    try {
      await action()
      await router.invalidate()
      setNotice(success)
    } catch (error) {
      setError(actionError(error, 'Could not complete this action. Try again.'))
    } finally {
      setBusy('')
    }
  }

  function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const file = new FormData(form).get('resume')
    if (!(file instanceof File) || !file.size || file.size > 5 * 1024 * 1024) {
      setError('Choose a PDF or DOCX up to 5 MB.')
      setNotice('')
      return
    }

    void act('upload', async () => {
      const response = await fetch('/api/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream', 'X-Resume-Filename': encodeURIComponent(file.name) },
        body: file,
      })
      if (!response.ok) {
        const result = await response.json().catch(() => null)
        throw new Error(result?.error ?? 'Could not upload the resume. Try again.')
      }
      form.reset()
    }, 'Resume uploaded.')
  }

  return (
    <>
      <PageTitle title="Resume">Upload your resume once and use it to review readiness and compare your experience with saved jobs.</PageTitle>
      <Card className="max-w-3xl gap-4 p-5 sm:p-6">
        <h2 className="text-subhead">{resume ? 'Active resume' : 'Upload your resume'}</h2>
        {resume && <p className="break-all font-medium">{resume.filename}</p>}
        <p className="text-small text-muted-foreground">
          Choose a text-based PDF or DOCX up to 5 MB. JobFinder keeps the extracted text and reviews.
          {resume && ' Replacing or deleting the active resume clears its reviews.'}
        </p>
        <form onSubmit={upload} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <Field label={resume ? 'Replacement file' : 'Resume file'} name="resume" type="file" accept=".pdf,.docx" required disabled={Boolean(busy)} />
          </div>
          <Button type="submit" disabled={Boolean(busy)}>{busy === 'upload' ? 'Uploading...' : resume ? 'Replace resume' : 'Upload resume'}</Button>
        </form>
        {resume && (
          <Button type="button" variant="outline" className="self-start" disabled={Boolean(busy)} onClick={() => {
            if (window.confirm('Delete the active resume and its reviews?')) {
              void act('delete', () => deleteResume({ data: resume.id }), 'Resume and reviews deleted.')
            }
          }}>{busy === 'delete' ? 'Deleting...' : 'Delete resume'}</Button>
        )}
        {error && <Notice error>{error}</Notice>}
        {notice && <Notice>{notice}</Notice>}
      </Card>
      <Card className="max-w-3xl gap-4 p-5 sm:p-6">
        <h2 className="text-subhead">General resume review</h2>
        <ReviewDisclosure />
        {!reviewEnabled && <Notice>Gemini reviews are currently unavailable.</Notice>}
        <Button type="button" className="self-start" disabled={Boolean(busy) || !resume || !reviewEnabled}
          onClick={() => resume && void act('review', () => runResumeReview({ data: resume.id }), 'Resume review updated.')}>
          {busy === 'review' ? 'Reviewing...' : 'Run resume review'}
        </Button>
        {resume?.review && <AtsFeedback review={resume.review} />}
      </Card>
    </>
  )
}
