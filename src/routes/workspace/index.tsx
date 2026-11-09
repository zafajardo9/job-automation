import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowUpRight, Search } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { actionError, Field, inputClass, Notice, PageTitle } from '~/components/workspace-fields'
import { getSearchSettings, importJob, saveJob, searchJobs } from '~/features/roles/job-functions'
import { maxDescriptionLength, type JobDraft, type SearchResult } from '~/features/roles/job-input'

export const Route = createFileRoute('/workspace/')({
  loader: () => getSearchSettings(),
  component: FindJobs,
})

const emptyDraft: JobDraft = { title: '', company: '', location: '', url: '', description: '' }

function FindJobs() {
  const { searchEnabled } = Route.useLoaderData()
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [url, setUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importNotice, setImportNotice] = useState('')
  const [draft, setDraft] = useState(emptyDraft)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState<{ id: string; alreadySaved: boolean } | null>(null)
  const draftHeading = useRef<HTMLHeadingElement>(null)

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSearching(true)
    setSearchError('')
    try {
      setResults(await searchJobs({ data: {
        keyword: String(form.get('keyword')),
        location: String(form.get('location')),
        remote: form.has('remote'),
      } }))
    } catch (error) {
      setSearchError(actionError(error, 'Enter a role or keyword and try again.'))
    } finally {
      setSearching(false)
    }
  }

  function edit(field: keyof JobDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }))
    setSaved(null)
  }

  async function loadPosting(link: string) {
    setImporting(true)
    setUrl(link)
    setImportNotice('')
    setSaveError('')
    try {
      const { draft: imported } = await importJob({ data: link })
      if (imported) {
        setDraft(imported)
        setSaved(null)
        setImportNotice('Description imported. Check the details before saving.')
      } else {
        setDraft((current) => current.title || current.description || current.url ? current : { ...current, url: link })
        setImportNotice('Could not read this posting. Open the source, check the URL in the form, and paste the job description below.')
      }
      draftHeading.current?.focus()
    } catch (error) {
      setImportNotice(actionError(error, 'Enter a valid HTTP or HTTPS posting URL, or paste the description below.'))
    } finally {
      setImporting(false)
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setSaved(null)
    setSaveError('')
    try {
      setSaved(await saveJob({ data: draft }))
      setDraft(emptyDraft)
      setUrl('')
      setImportNotice('')
    } catch (error) {
      setSaveError(actionError(error, 'Check the title, company, source URL, and description, then try again.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageTitle title="Find Jobs">Search the web for openings, or bring a job you found elsewhere into your shortlist.</PageTitle>
      <Card className="gap-4 p-5 sm:p-6">
        <h2 className="text-subhead">Search openings</h2>
        {searchEnabled ? (
          <form onSubmit={search} className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_auto_auto]">
            <Field label="Role or keyword" name="keyword" placeholder="Frontend engineer" maxLength={120} required />
            <Field label="Location" name="location" placeholder="Manila" maxLength={120} />
            <label className="flex items-center gap-2 py-2 text-small"><input type="checkbox" name="remote" /> Remote</label>
            <Button type="submit" disabled={searching}><Search /> {searching ? 'Searching...' : 'Search'}</Button>
          </form>
        ) : <Notice>Live search is unavailable. You can still import a URL or add a job below.</Notice>}
        {searchError && <Notice error>{searchError}</Notice>}
      </Card>
      {results !== null && (
        <section aria-label="Search results" className="space-y-3">
          <p className="text-small text-muted-foreground">
            {results.length ? 'These results may include expired openings. Check the original posting before applying.' : 'No openings found. Try a broader keyword or location.'}
          </p>
          <ul className="grid gap-3 lg:grid-cols-2">
            {results.map(({ title, snippet, url: source }) => (
              <li key={source} className="flex flex-col items-start gap-3 rounded-xl border bg-card p-5">
                <a href={source} target="_blank" rel="noreferrer" className="inline-flex items-start gap-2 font-semibold hover:underline">
                  {title || 'Open posting'} <ArrowUpRight className="mt-1 size-4 shrink-0" aria-hidden="true" />
                </a>
                <p className="text-caption text-muted-foreground">{new URL(source).hostname}</p>
                {snippet && <p className="text-small text-muted-foreground">{snippet}</p>}
                <Button className="mt-auto" type="button" variant="outline" size="sm"
                  disabled={importing || saving} onClick={() => void loadPosting(source)}>Import description</Button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Card className="gap-4 p-5 sm:p-6">
        <h2 ref={draftHeading} tabIndex={-1} className="text-subhead">Add a job</h2>
        <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(event) => {
          event.preventDefault()
          void loadPosting(url)
        }}>
          <div className="flex-1"><Field label="Import from a posting URL" type="url" value={url} required
            maxLength={2048} onChange={(event) => setUrl(event.target.value)} /></div>
          <Button type="submit" variant="outline" disabled={importing || saving}>{importing ? 'Importing...' : 'Import'}</Button>
        </form>
        {importNotice && <Notice>{importNotice}</Notice>}
        <form onSubmit={save}>
          <fieldset disabled={importing || saving} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Job title" value={draft.title} onChange={(e) => edit('title', e.target.value)} maxLength={200} required />
              <Field label="Company" value={draft.company} onChange={(e) => edit('company', e.target.value)} maxLength={200} required />
              <Field label="Location" value={draft.location} onChange={(e) => edit('location', e.target.value)} maxLength={200} />
              <Field label="Source URL (optional)" value={draft.url} type="url" onChange={(e) => edit('url', e.target.value)} maxLength={2048} />
            </div>
            <div className="flex flex-col gap-1.5 text-small font-medium">
              <label htmlFor="job-description">Job description</label>
              <textarea id="job-description" className={inputClass} rows={7} required maxLength={maxDescriptionLength}
                placeholder="Paste the job description or edit the imported text"
                value={draft.description} onChange={(e) => edit('description', e.target.value)} />
            </div>
            <Button type="submit">{saving ? 'Saving...' : 'Save job'}</Button>
          </fieldset>
        </form>
        {saveError && <Notice error>{saveError}</Notice>}
        {saved && <Notice>
          {saved.alreadySaved ? 'This job is already on your shortlist. ' : 'Job saved. '}
          <Link to="/workspace/saved" hash={saved.id} className="font-medium text-primary underline">View saved job</Link>
        </Notice>}
      </Card>
    </>
  )
}
