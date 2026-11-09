import { Link } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Field, Notice } from '~/components/workspace-fields'
import { authClient } from './auth-client'

export function AuthForm({ signup, configured }: { signup: boolean; configured: boolean }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const title = signup ? 'Create an account' : 'Log in'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email')).trim()
    const password = String(form.get('password'))
    setBusy(true)
    setError('')
    try {
      const result = signup
        ? await authClient.signUp.email({ name: String(form.get('name')).trim(), email, password })
        : await authClient.signIn.email({ email, password })
      if (result.error) {
        setError(result.error.message ?? 'Could not complete the request.')
        return
      }
      window.location.replace('/workspace')
    } catch {
      setError('Authentication is temporarily unavailable. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-container flex justify-center py-14">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <h1 className="text-heading">{title}</h1>
        {!configured && <Notice error>Set up the database and Better Auth to use this workspace.</Notice>}
        <form onSubmit={submit} className="space-y-4">
          {signup && <Field label="Name" name="name" autoComplete="name" maxLength={120} required />}
          <Field label="Email" name="email" type="email" autoComplete="email" maxLength={320} required />
          <Field label="Password" name="password" type="password" autoComplete={signup ? 'new-password' : 'current-password'}
            minLength={signup ? 8 : undefined} maxLength={128} required />
          {signup && <p className="text-small text-muted-foreground">Use at least 8 characters.</p>}
          {error && <Notice error>{error}</Notice>}
          <Button type="submit" disabled={busy || !configured}>{busy ? 'Working...' : title}</Button>
        </form>
        <p className="text-small text-muted-foreground">
          {signup ? 'Already have an account? ' : 'New to JobFinder? '}
          <Link to={signup ? '/login' : '/signup'} className="font-medium text-primary underline">{signup ? 'Log in' : 'Sign up'}</Link>
        </p>
      </Card>
    </div>
  )
}
