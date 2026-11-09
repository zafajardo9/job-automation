import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { actionError, Field, inputClass, Notice, PageTitle } from '~/components/workspace-fields'
import { appearanceInput, colors, textSizes, themes, type Appearance } from '~/features/settings/appearance'
import { getGeminiSettings, removeGeminiKey, saveAppearance, saveGeminiKey } from '~/features/settings/settings-functions'

export const Route = createFileRoute('/workspace/settings')({
  loader: () => getGeminiSettings(),
  component: SettingsPage,
})

function SettingsPage() {
  const appearance = Route.useRouteContext().viewer.user!.appearance
  return (
    <>
      <PageTitle title="Settings">Make JobFinder easier to read and connect your own Gemini API key.</PageTitle>
      <Card className="max-w-3xl gap-4 p-5 sm:p-6">
        <h2 className="text-subhead">Appearance</h2>
        <AppearanceForm appearance={appearance} />
      </Card>
      <GeminiSettings />
    </>
  )
}

function AppearanceForm({ appearance }: { appearance: Appearance }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    setBusy(true)
    setError('')
    setSaved(false)
    try {
      await saveAppearance({ data: appearanceInput.parse(values) })
      await router.invalidate()
      setSaved(true)
    } catch (error) {
      setError(actionError(error, 'Could not save appearance. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  const fields = [
    { name: 'theme', label: 'Theme', options: themes },
    { name: 'accent', label: 'Accent color', options: colors },
    { name: 'textSize', label: 'Text size', options: textSizes },
  ] as const

  return (
    <form onSubmit={submit} onChange={() => setSaved(false)}>
      <fieldset disabled={busy} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {fields.map(({ name, label, options }) => (
            <div key={name} className="space-y-1.5">
              <label htmlFor={name} className="text-small font-medium">{label}</label>
              <select id={name} name={name} defaultValue={appearance[name]} className={inputClass}>
                {Object.entries(options).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
              </select>
            </div>
          ))}
        </div>
        {error && <Notice error>{error}</Notice>}
        {saved && <Notice>Appearance saved.</Notice>}
        <Button type="submit">{busy ? 'Saving...' : 'Save appearance'}</Button>
      </fieldset>
    </form>
  )
}

function GeminiSettings() {
  const { personal, shared } = Route.useLoaderData()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function update(action: () => Promise<void>, message: string) {
    setBusy(true)
    setNotice('')
    setError('')
    try {
      await action()
      await router.invalidate()
      setNotice(message)
    } catch (error) {
      setError(actionError(error, 'Could not update the Gemini API key. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const key = String(new FormData(form).get('key') ?? '').trim()
    if (!/^[A-Za-z0-9_-]{16,256}$/.test(key)) {
      setNotice('')
      setError('Enter a valid Gemini API key.')
      return
    }
    void update(async () => {
      await saveGeminiKey({ data: key })
      form.reset()
    }, 'Gemini API key saved.')
  }

  return (
    <Card className="max-w-3xl gap-4 p-5 sm:p-6">
      <h2 className="text-subhead">Gemini AI</h2>
      <Notice>{personal ? 'Your personal key is configured.' : shared ? 'Reviews use the workspace Gemini key.' : 'Add a key to enable AI reviews.'}</Notice>
      <p className="text-small text-muted-foreground">
        Your key is encrypted and used for reviews you run. Use a billing-enabled Gemini API project when reviewing resume text.
        {personal && shared && ' Removing your personal key switches reviews back to the workspace key.'}
      </p>
      <form method="post" onSubmit={submit}>
        <fieldset disabled={busy} className="space-y-4">
          <Field label={personal ? 'Replacement Gemini API key' : 'Gemini API key'} name="key" type="password"
            autoComplete="off" spellCheck={false} maxLength={256} required />
          <div className="flex flex-wrap gap-2">
            <Button type="submit">{personal ? 'Replace API key' : 'Save API key'}</Button>
            {personal && <Button type="button" variant="outline"
              onClick={() => void update(() => removeGeminiKey(), 'Personal API key removed.')}>Remove API key</Button>}
          </div>
        </fieldset>
      </form>
      {error && <Notice error>{error}</Notice>}
      {notice && <Notice>{notice}</Notice>}
    </Card>
  )
}
