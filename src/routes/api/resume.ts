import { createFileRoute } from '@tanstack/react-router'
import { sessionUser } from '~/features/auth/auth.server'
import { extractResume, readResumeBody } from '~/features/resume/parse.server'
import { replaceResume } from '~/features/resume/resume-storage.server'
import { env } from '~/lib/env'

const headers = { 'Cache-Control': 'private, no-store' }

async function upload({ request }: { request: Request }) {
  if (request.headers.get('origin') !== new URL(env.BETTER_AUTH_URL ?? env.APP_URL).origin) {
    return Response.json({ error: 'Open JobFinder at its configured address and try again.' }, { status: 403, headers })
  }
  const user = await sessionUser(request.headers)
  if (!user) return Response.json({ error: 'Sign in to upload a resume.' }, { status: 401, headers })

  let filename = ''
  try {
    filename = decodeURIComponent(request.headers.get('x-resume-filename') ?? '').split(/[\\/]/).pop() ?? ''
  } catch {
    return Response.json({ error: 'The resume filename is invalid.' }, { status: 400, headers })
  }
  if (!filename || filename.length > 255 || /[\u0000-\u001f\u007f]/.test(filename)) {
    return Response.json({ error: 'Choose a resume with a shorter, valid filename.' }, { status: 400, headers })
  }

  let bytes: Buffer
  try {
    bytes = await readResumeBody(request)
  } catch {
    return Response.json({ error: 'Upload a PDF or DOCX up to 5 MB.' }, { status: 413, headers })
  }

  let content: string
  try {
    content = await extractResume(bytes, filename)
  } catch {
    return Response.json({
      error: 'Could not read this resume. Try a shorter DOCX or a PDF with selectable text and no password.',
    }, { status: 422, headers })
  }

  await replaceResume(user.id, filename, content)
  return Response.json({ ok: true }, { headers })
}

export const Route = createFileRoute('/api/resume')({
  server: { handlers: { POST: upload } },
})
