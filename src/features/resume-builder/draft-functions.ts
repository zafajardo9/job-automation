import { createServerFn } from '@tanstack/react-start'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '~/db/client'
import { resumeDrafts } from '~/db/schema'
import { requireUser } from '~/features/auth/session.server'
import { WorkspaceError } from '~/lib/workspace-error.server'
import { blankDraft, draftSchema } from './draft'

export const loadResumeDraft = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = await requireUser()
  const [saved] = await getDb().select({ draft: resumeDrafts.draft, revision: resumeDrafts.revision })
    .from(resumeDrafts).where(eq(resumeDrafts.userId, userId))
  return saved ? { ...saved, draft: draftSchema.parse(saved.draft) } : { draft: blankDraft, revision: 0 }
})

export const saveResumeDraft = createServerFn({ method: 'POST' })
  .validator(z.object({ draft: draftSchema, revision: z.number().int().nonnegative() }))
  .handler(async ({ data }) => {
    const userId = await requireUser()
    const db = getDb()
    const [saved] = data.revision === 0
      ? await db.insert(resumeDrafts).values({ userId, draft: data.draft })
        .onConflictDoNothing({ target: resumeDrafts.userId }).returning({ revision: resumeDrafts.revision })
      : await db.update(resumeDrafts).set({ draft: data.draft, revision: sql`${resumeDrafts.revision} + 1` })
        .where(and(eq(resumeDrafts.userId, userId), eq(resumeDrafts.revision, data.revision)))
        .returning({ revision: resumeDrafts.revision })
    if (!saved) throw new WorkspaceError('This draft was saved in another tab. Reload to open the latest version.')
    return saved
  })
