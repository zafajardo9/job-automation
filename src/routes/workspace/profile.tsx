import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { actionError, Field, inputClass, Notice, PageTitle } from '~/components/workspace-fields'
import type { Experience } from '~/features/profile/experience'
import { ProfileChecker } from '~/features/profile/profile-checker'
import { getProfile, saveProfile } from '~/features/profile/profile-functions'
import { hasProfileContent } from '~/features/profile/profile-review'

export const Route = createFileRoute('/workspace/profile')({
  loader: () => getProfile(),
  component: ProfilePage,
})

function ProfilePage() {
  const { profile: initial, reviewEnabled } = Route.useLoaderData()
  const router = useRouter()
  const [profile, setProfile] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasEdits, setHasEdits] = useState(false)
  const [error, setError] = useState('')

  function edit(field: 'name' | 'headline' | 'location' | 'linkedinUrl' | 'githubUrl' | 'targetRole' | 'summary', value: string) {
    setProfile((current) => ({ ...current, [field]: value }))
    setSaved(false)
    setHasEdits(true)
  }

  function setLinks(links: typeof profile.portfolioLinks) {
    setProfile((current) => ({ ...current, portfolioLinks: links }))
    setSaved(false)
    setHasEdits(true)
  }

  function editLink(index: number, field: 'label' | 'url', value: string) {
    setLinks(profile.portfolioLinks.map((link, i) => i === index ? { ...link, [field]: value } : link))
  }

  function setExperience(experience: Experience[]) {
    setProfile((current) => ({ ...current, experience }))
    setSaved(false)
    setHasEdits(true)
  }

  function editExperience(index: number, changes: Partial<Experience>) {
    setExperience(profile.experience.map((entry, i) => i === index ? { ...entry, ...changes } : entry))
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (profile.experience.some(({ years, months }) => years === 0 && months === 0)) {
      setError('Enter at least one month for each experience entry.')
      return
    }
    setBusy(true)
    setSaved(false)
    setError('')
    try {
      setProfile(await saveProfile({ data: profile }))
      await router.invalidate()
      setHasEdits(false)
      setSaved(true)
    } catch (error) {
      setError(actionError(error, 'Check your details and make sure each link starts with http:// or https://.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageTitle title="Profile">Keep your professional details, experience, and links in one place, visible only to you.</PageTitle>
      <ProfileChecker key={JSON.stringify(initial)} enabled={reviewEnabled} hasContent={hasProfileContent(initial)}
        hasEdits={hasEdits || busy} />
      <Card className="max-w-3xl p-5 sm:p-6">
        <form onSubmit={save}>
          <fieldset disabled={busy} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" autoComplete="name" value={profile.name} onChange={(e) => edit('name', e.target.value)} maxLength={120} required />
              <Field label="Professional headline" value={profile.headline} onChange={(e) => edit('headline', e.target.value)} maxLength={160} />
              <Field label="Location" value={profile.location} onChange={(e) => edit('location', e.target.value)} maxLength={160} />
              <Field label="Target role" value={profile.targetRole} onChange={(e) => edit('targetRole', e.target.value)} maxLength={160} />
              <Field label="LinkedIn URL" type="url" value={profile.linkedinUrl} onChange={(e) => edit('linkedinUrl', e.target.value)} maxLength={2048} />
              <Field label="GitHub URL" type="url" value={profile.githubUrl} onChange={(e) => edit('githubUrl', e.target.value)} maxLength={2048} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="profile-summary" className="text-small font-medium">Professional summary</label>
              <textarea id="profile-summary" className={inputClass} rows={3} maxLength={1000}
                value={profile.summary} onChange={(e) => edit('summary', e.target.value)} />
            </div>
            <section className="space-y-4 border-t pt-4">
              <h2 className="text-subhead">Experience</h2>
              <p className="text-small text-muted-foreground">
                Add areas you have worked in, such as project management, and how long you have worked in each.
              </p>
              {profile.experience.map((entry, index) => (
                <fieldset key={index} className="space-y-3 rounded-md border p-4">
                  <legend className="px-1 text-small font-medium">Experience {index + 1}</legend>
                  <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
                    <Field label="Area of experience" value={entry.area} maxLength={120} required
                      placeholder="Project management" onChange={(e) => editExperience(index, { area: e.target.value })} />
                    <Field label="Years" type="number" min={0} max={80} step={1} value={entry.years}
                      onChange={(e) => editExperience(index, { years: Number(e.target.value) })} />
                    <Field label="Months" type="number" min={0} max={11} step={1} value={entry.months}
                      onChange={(e) => editExperience(index, { months: Number(e.target.value) })} />
                  </div>
                  <Field label="Details (optional)" value={entry.details} maxLength={500}
                    onChange={(e) => editExperience(index, { details: e.target.value })} />
                  <Button type="button" variant="ghost" size="sm"
                    onClick={() => setExperience(profile.experience.filter((_, i) => i !== index))}>Remove experience</Button>
                </fieldset>
              ))}
              <Button type="button" variant="outline" size="sm" disabled={profile.experience.length >= 30}
                onClick={() => setExperience([...profile.experience, { area: '', years: 0, months: 0, details: '' }])}>Add experience</Button>
            </section>
            <section className="space-y-3 border-t pt-4">
              <h2 className="text-subhead">Portfolio links</h2>
              {profile.portfolioLinks.map((link, index) => (
                <div key={index} className="grid items-end gap-3 sm:grid-cols-[1fr_2fr_auto]">
                  <Field label={`Label ${index + 1}`} value={link.label} onChange={(e) => editLink(index, 'label', e.target.value)} maxLength={80} required />
                  <Field label={`URL ${index + 1}`} type="url" value={link.url} onChange={(e) => editLink(index, 'url', e.target.value)} maxLength={2048} required />
                  <Button type="button" variant="ghost" onClick={() => setLinks(profile.portfolioLinks.filter((_, i) => i !== index))}>Remove</Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" disabled={profile.portfolioLinks.length >= 10}
                onClick={() => setLinks([...profile.portfolioLinks, { label: '', url: '' }])}>Add a link</Button>
            </section>
            {error && <Notice error>{error}</Notice>}
            {saved && <Notice>Profile saved.</Notice>}
            <Button type="submit">{busy ? 'Saving...' : 'Save profile'}</Button>
          </fieldset>
        </form>
      </Card>
    </>
  )
}
