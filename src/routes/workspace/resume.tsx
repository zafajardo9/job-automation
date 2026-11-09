import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { FileText, LoaderCircle, UploadCloud, X } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { actionError, Notice, PageTitle } from '~/components/workspace-fields'
import { AtsFeedback, ReviewDisclosure } from '~/features/resume/feedback'
import { maxResumeBytes } from '~/features/resume/file-limits'
import { deleteResume, getResume, runResumeReview } from '~/features/resume/resume-functions'
import { cn } from '~/lib/utils'

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
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const browseButton = useRef<HTMLButtonElement>(null)

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

  function selectFiles(files: FileList) {
    if (busy || files.length === 0) return
    const selected = files[0]
    setNotice('')
    if (files.length !== 1 || !selected || !/\.(pdf|docx)$/i.test(selected.name)
      || !selected.size || selected.size > maxResumeBytes) {
      setFile(null)
      setError('Choose one non-empty PDF or DOCX up to 5 MB.')
    } else {
      setError('')
      setFile(selected)
    }
  }

  function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file || busy) return

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
      setFile(null)
    }, 'Resume uploaded.')
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageTitle title="Resume">Build a new resume or upload one to review its readiness and compare it with saved jobs.</PageTitle>
        <Button asChild><Link to="/workspace/resume/builder">Build a resume</Link></Button>
      </div>
      <Card className="max-w-3xl gap-4 p-5 sm:p-6">
        <h2 className="text-subhead">{resume ? 'Active resume' : 'Upload your resume'}</h2>
        {resume && (
          <div className="flex min-w-0 items-center gap-3 rounded-lg border bg-background p-3">
            <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0">
              <p className="break-all text-small font-medium">{resume.filename}</p>
              <p className="text-caption text-muted-foreground">Current file</p>
            </div>
          </div>
        )}
        <p className="text-small text-muted-foreground">
          JobFinder keeps the extracted text and reviews.
          {resume && ' Replacing or deleting the active resume clears its reviews.'}
        </p>
        <form onSubmit={upload} className="space-y-3">
          <input ref={fileInput} type="file" accept=".pdf,.docx" hidden disabled={Boolean(busy)}
            onChange={(event) => {
              const input = event.currentTarget
              if (input.files) selectFiles(input.files)
              input.value = ''
            }} />
          <button ref={browseButton} type="button" aria-disabled={Boolean(busy)}
            onClick={() => { if (!busy) fileInput.current?.click() }}
            onDragOver={(event) => {
              if (!event.dataTransfer.types.includes('Files')) return
              event.preventDefault()
              event.dataTransfer.dropEffect = busy ? 'none' : 'copy'
              setIsDragging(!busy)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault()
              setIsDragging(false)
              selectFiles(event.dataTransfer.files)
            }}
            className={cn(
              'group flex w-full flex-col items-center gap-3 rounded-xl border border-dashed px-4 py-7 text-center transition-colors sm:py-9',
              'focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/25',
              isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/40 bg-muted/40',
              busy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-primary hover:bg-primary/5',
            )}>
            <span className="pointer-events-none grid size-11 place-items-center rounded-xl border bg-card text-muted-foreground group-hover:text-primary">
              <UploadCloud className="size-5" aria-hidden="true" />
            </span>
            <span className="pointer-events-none">
              <span className="block text-body font-semibold">
                {isDragging ? 'Drop your resume here' : file ? 'Choose a different file' : resume ? 'Choose a replacement file' : 'Drag and drop your resume'}
              </span>
              <span className="mt-1 block text-small text-muted-foreground">
                {file || resume ? 'Drop a file or ' : 'or '}
                <span className="font-semibold text-primary underline underline-offset-4">browse files</span>
              </span>
              <span className="mt-2 block text-caption text-muted-foreground">Text-based PDF or DOCX · Up to 5 MB</span>
            </span>
          </button>
          {file && (
            <div className="flex min-w-0 items-center gap-3 rounded-lg border bg-background p-3">
              <FileText className="size-5 shrink-0 text-primary" aria-hidden="true" />
              <div className="min-w-0 flex-1" role="status">
                <p className="truncate text-small font-medium" title={file.name}>{file.name}</p>
                <p className="text-caption text-muted-foreground">
                  {file.size < 1024 * 1024 ? `${Math.max(1, Math.round(file.size / 1024))} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
                  {busy === 'upload' ? ' · Uploading' : ' · Ready to upload'}
                </p>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove selected file" disabled={Boolean(busy)}
                onClick={() => {
                  setFile(null)
                  setError('')
                  browseButton.current?.focus()
                }}><X /></Button>
            </div>
          )}
          <div className="flex justify-end">
            <Button type="submit" className="w-full sm:w-auto" disabled={!file || Boolean(busy)}>
              {busy === 'upload' && <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
              {busy === 'upload' ? 'Uploading...' : resume ? 'Replace resume' : 'Upload resume'}
            </Button>
          </div>
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
