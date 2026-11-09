import { createFileRoute, Link, useBlocker } from '@tanstack/react-router'
import { ArrowLeft, Maximize, Printer, X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { useState, type FormEvent } from 'react'
import { Button } from '~/components/ui/button'
import { actionError, inputClass, Notice, PageTitle } from '~/components/workspace-fields'
import { resumeFonts, resumeFontSizes, resumeTypographySchema, type ResumeDraft } from '~/features/resume-builder/draft'
import { loadResumeDraft, saveResumeDraft } from '~/features/resume-builder/draft-functions'
import { ResumeEditor } from '~/features/resume-builder/resume-editor'
import { hasResumeContent, ResumePreview } from '~/features/resume-builder/resume-preview'
import '~/features/resume-builder/resume-builder.css'

export const Route = createFileRoute('/workspace/resume_/builder')({
  loader: () => loadResumeDraft(),
  component: ResumeBuilder,
})

function ResumeBuilder() {
  const initial = Route.useLoaderData()
  const [draft, setDraft] = useState(initial.draft)
  const [savedDraft, setSavedDraft] = useState(initial.draft)
  const [revision, setRevision] = useState(initial.revision)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const dirty = JSON.stringify(draft) !== JSON.stringify(savedDraft)

  useBlocker({
    shouldBlockFn: ({ current, next }) => current.pathname !== next.pathname && dirty && !window.confirm('Leave the resume builder with unsaved changes?'),
    enableBeforeUnload: dirty,
  })

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving || !dirty) return
    setSaving(true)
    setError('')
    try {
      const saved = await saveResumeDraft({ data: { draft, revision } })
      setRevision(saved.revision)
      setSavedDraft(draft)
    } catch (error) {
      setError(actionError(error, 'Could not save the draft. Your edits are still here.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="resume-builder flex flex-col gap-6">
      <Link to="/workspace/resume" className="inline-flex items-center gap-2 self-start text-small text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to Resume
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle title="Resume builder">Write your resume and see changes as you type.</PageTitle>
        <Button type="button" variant="outline" disabled={!hasResumeContent(draft)} onClick={() => window.print()}>
          <Printer aria-hidden="true" /> Print / Save as PDF
        </Button>
      </div>
      <div className="resume-builder-panes grid items-start gap-5 lg:grid-cols-2 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <form className="resume-builder-form flex min-w-0 flex-col gap-4" onSubmit={save} noValidate>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
            <Button type="submit" disabled={!dirty || saving}>{saving ? 'Saving…' : 'Save draft'}</Button>
            <p role="status" className="text-small text-muted-foreground">
              {dirty ? 'Unsaved changes' : revision ? 'Draft saved' : 'New private draft'}
            </p>
            <a href="#resume-preview" className="resume-builder-jump ml-auto text-small font-medium text-primary underline">Jump to preview</a>
          </div>
          {error && <Notice error>{error}</Notice>}
          <div className="resume-editor-scroll">
            <fieldset disabled={saving} className="min-w-0">
              <ResumeEditor draft={draft} onChange={setDraft} />
            </fieldset>
          </div>
        </form>
        <aside id="resume-preview" aria-labelledby="resume-preview-title" tabIndex={-1}
          className="resume-preview flex min-w-0 scroll-mt-20 flex-col rounded-xl border bg-muted/50 p-3 sm:p-4">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 id="resume-preview-title" className="text-small font-semibold">Live preview</h2>
            <FullscreenPreview draft={draft} />
          </div>
          <fieldset disabled={saving} className="mb-3 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2">
            <legend className="sr-only">Resume typography</legend>
            <div className="min-w-0">
              <label htmlFor="resume-font" className="mb-1 block text-caption font-medium">Font</label>
              <select id="resume-font" className={inputClass} value={draft.typography.font} onChange={(event) => {
                const typography = resumeTypographySchema.parse({ ...draft.typography, font: event.target.value })
                setDraft((current) => ({ ...current, typography }))
              }}>
                {Object.entries(resumeFonts).map(([font, { label }]) => <option key={font} value={font}>{label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="resume-font-size" className="mb-1 block text-caption font-medium">Size</label>
              <select id="resume-font-size" className={inputClass} value={draft.typography.size} onChange={(event) => {
                const typography = resumeTypographySchema.parse({ ...draft.typography, size: event.target.value })
                setDraft((current) => ({ ...current, typography }))
              }}>
                {resumeFontSizes.map((size) => <option key={size} value={size}>{size} pt</option>)}
              </select>
            </div>
          </fieldset>
          <div className="resume-preview-scroll">
            <ResumePreview draft={draft} />
          </div>
        </aside>
      </div>
    </div>
  )
}

function FullscreenPreview({ draft }: { draft: ResumeDraft }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button type="button" variant="outline" size="sm"><Maximize aria-hidden="true" /> Fullscreen</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="resume-fullscreen fixed inset-0 z-50 bg-background" />
        <Dialog.Content className="resume-fullscreen fixed inset-0 z-50 flex h-dvh flex-col bg-muted"
          aria-describedby={undefined}>
          <div className="flex shrink-0 items-center justify-between gap-3 border-b bg-background px-4 py-3 sm:px-6">
            <Dialog.Title className="text-body font-semibold">Resume preview</Dialog.Title>
            <Dialog.Close asChild>
              <Button type="button" variant="outline" size="sm"><X aria-hidden="true" /> Close</Button>
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-6">
            <div className="mx-auto max-w-[210mm]"><ResumePreview draft={draft} /></div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
