import { createFileRoute } from '@tanstack/react-router'
import { authConfigured, getAuth } from '~/features/auth/auth.server'

async function handleAuth({ request }: { request: Request }) {
  if (!authConfigured) return new Response('Authentication is not configured.', { status: 503 })
  const response = await getAuth().handler(request)
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', 'private, no-store')
  return new Response(response.body, { status: response.status, headers })
}

export const Route = createFileRoute('/api/auth/$')({
  server: { handlers: { GET: handleAuth, POST: handleAuth } },
})
