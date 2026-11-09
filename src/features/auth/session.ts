import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders, setResponseHeader } from '@tanstack/react-start/server'
import { authConfigured, sessionUser } from './auth.server'

export const getViewer = createServerFn({ method: 'GET' }).handler(async () => {
  setResponseHeader('Cache-Control', 'private, no-store')
  const user = await sessionUser(getRequestHeaders())
  return { configured: authConfigured, user: user ? { name: user.name } : null }
})
