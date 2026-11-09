import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { actionError, Field, Notice, PageTitle } from '~/components/workspace-fields'
import { getProfile, saveProfile } from '~/features/profile/profile-functions'

export const Route = createFileRoute('/workspace/profile')({
  loader: () => getProfile(),
  component: ProfilePage,
})

function ProfilePage() {
  const initial = Route.useLoaderData()
  const router = useRouter()
  const [profile, setProfile] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function edit(field: 'name' | 'headline' | 'location' | 'linkedinUrl' | 'githubUrl', value: string) {
    setProfile((current) => ({ ...current, [field]: value }))
    setSaved(false)
  }

  function setLinks(links: typeof profile.portfolioLinks) {
    setProfile((current) => ({ ...current, portfolioLinks: links }))
    setSaved(false)
  }

  function editLink(index: number, field: 'label' | 'url', value: string) {
    setLinks(profile.portfolioLinks.map((link, i) => i === index ? { ...link, [field]: value } : link))
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setSaved(false)
    setError('')
    try {
      await saveProfile({ data: profile })
      setSaved(true)
      await router.invalidate()
    } catch (error) {
      setError(actionError(error, 'Check your details and make sure each link starts with http:// or https://.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageTitle title="Profile">Keep your professional details and links in one place, visible only to you.</PageTitle>
      <Card className="max-w-3xl p-5 sm:p-6">
        <form onSubmit={save}>
          <fieldset disabled={busy} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" autoComplete="name" value={profile.name} onChange={(e) => edit('name', e.target.value)} maxLength={120} required />
              <Field label="Professional headline" value={profile.headline} onChange={(e) => edit('headline', e.target.value)} maxLength={160} />
              <Field label="Location" value={profile.location} onChange={(e) => edit('location', e.target.value)} maxLength={160} />
              <Field label="LinkedIn URL" type="url" value={profile.linkedinUrl} onChange={(e) => edit('linkedinUrl', e.target.value)} maxLength={2048} />
              <Field label="GitHub URL" type="url" value={profile.githubUrl} onChange={(e) => edit('githubUrl', e.target.value)} maxLength={2048} />
            </div>
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
