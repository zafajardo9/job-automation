import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '~/db/client'
import { jobReviews, jobs, resumes, users } from '~/db/schema'
import { requireUser } from '~/features/auth/session.server'
import { geminiKeyStatus } from '~/features/settings/gemini-key.server'
import { env } from '~/lib/env'
import { jobStatuses } from '~/lib/job-status'
import { jobDraft, jobSearch, normalizeJobUrl, publicLink } from './job-input'
import { importPosting, searchPostings } from './postings.server'
import { WorkspaceError } from '~/lib/workspace-error.server'

export const getSearchSettings = createServerFn({ method: 'GET' }).handler(async () => {
  await requireUser()
  return { searchEnabled: Boolean(env.BRAVE_SEARCH_API_KEY) }
})

export const searchJobs = createServerFn({ method: 'POST' }).validator(jobSearch).handler(async ({ data }) => {
  await requireUser()
  return searchPostings(data.keyword, data.location, data.remote)
})

export const importJob = createServerFn({ method: 'POST' }).validator(publicLink).handler(async ({ data }) => {
  await requireUser()
  return importPosting(data)
})

export const saveJob = createServerFn({ method: 'POST' }).validator(jobDraft).handler(async ({ data }) => {
  const userId = await requireUser()
  const normalizedUrl = data.url ? normalizeJobUrl(data.url) : null
  if (normalizedUrl && normalizedUrl.length > 2_400) throw new WorkspaceError('Choose a shorter job URL.')
  return getDb().transaction(async (tx) => {
    await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for('update')

    if (normalizedUrl) {
      const [existing] = await tx.select().from(jobs)
        .where(and(eq(jobs.userId, userId), eq(jobs.normalizedUrl, normalizedUrl)))
      if (existing) return { id: existing.id, alreadySaved: true }

      // Starter rows have no normalized key. Preserve their IDs and application state.
      const legacy = await tx.select().from(jobs).where(and(eq(jobs.userId, userId), isNull(jobs.normalizedUrl)))
      const match = legacy.find(({ url }) => {
        const parsed = publicLink.safeParse(url)
        return parsed.success && normalizeJobUrl(parsed.data) === normalizedUrl
      })
      if (match) {
        await tx.update(jobs).set({
          normalizedUrl,
          description: match.description ?? data.description,
          updatedAt: new Date(),
        }).where(and(eq(jobs.userId, userId), eq(jobs.id, match.id)))
        return { id: match.id, alreadySaved: true }
      }
    }

    const [created] = await tx.insert(jobs).values({
      ...data,
      userId,
      location: data.location || null,
      url: data.url || null,
      normalizedUrl,
    }).returning({ id: jobs.id })
    if (!created) throw new Error("The job could not be saved.")
    return { id: created.id, alreadySaved: false }
  })
})

export const listSavedJobs = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = await requireUser()
  const db = getDb()
  const rows = await db.select({
    id: jobs.id,
    title: jobs.title,
    company: jobs.company,
    location: jobs.location,
    url: jobs.url,
    description: jobs.description,
    status: jobs.status,
    review: jobReviews.review,
  }).from(jobs)
    .leftJoin(resumes, eq(resumes.userId, jobs.userId))
    .leftJoin(jobReviews, and(eq(jobReviews.jobId, jobs.id), eq(jobReviews.resumeId, resumes.id)))
    .where(eq(jobs.userId, userId))
    .orderBy(desc(jobs.createdAt))
  const [resume] = await db.select({ id: resumes.id }).from(resumes).where(eq(resumes.userId, userId))
  const { personal, shared } = await geminiKeyStatus(userId)
  return { rows, resumeId: resume?.id ?? null, reviewEnabled: personal || shared }
})

export const updateJobStatus = createServerFn({ method: 'POST' })
  .validator(z.object({ jobId: z.uuid(), status: z.enum(jobStatuses) }))
  .handler(async ({ data }) => {
    const userId = await requireUser()
    const [job] = await getDb().update(jobs)
      .set({ status: data.status, updatedAt: new Date() })
      .where(and(eq(jobs.userId, userId), eq(jobs.id, data.jobId)))
      .returning({ id: jobs.id })
    if (!job) throw new WorkspaceError('Saved job not found.')
  })
