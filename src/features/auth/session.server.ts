import '@tanstack/react-start/server-only'
import { getRequestHeaders, setResponseHeader } from '@tanstack/react-start/server'
import { sessionUser } from './auth.server'
import { WorkspaceError } from '~/lib/workspace-error.server'

export async function requireUser() {
  setResponseHeader('Cache-Control', 'private, no-store')
  const user = await sessionUser(getRequestHeaders())
  if (!user) throw new WorkspaceError('Sign in to continue.')
  return user.id
}
