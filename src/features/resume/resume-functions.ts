import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '~/db/client'
import { jobReviews, jobs, resumes, users } from '~/db/schema'
import { requireUser } from '~/features/auth/session.server'
import { geminiKeyStatus } from '~/features/settings/gemini-key.server'
import { reviewJobFit, reviewResume } from './gemini.server'
import { WorkspaceError } from '~/lib/workspace-error.server'

async function activeResume(userId: string) {
  const [resume] = await getDb().select().from(resumes).where(eq(resumes.userId, userId))
  if (!resume) throw new WorkspaceError('Upload a resume before running a review.')
  return resume
}

export const getResume = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = await requireUser()
  const [resume] = await getDb().select({
    id: resumes.id,
    filename: resumes.filename,
    createdAt: resumes.createdAt,
    review: resumes.review,
  }).from(resumes).where(eq(resumes.userId, userId))
  const { personal, shared } = await geminiKeyStatus(userId)
  return { resume: resume ?? null, reviewEnabled: personal || shared }
})

export const deleteResume = createServerFn({ method: 'POST' })
  .validator(z.uuid()).handler(async ({ data: resumeId }) => {
    const userId = await requireUser()
    await getDb().delete(resumes).where(and(eq(resumes.userId, userId), eq(resumes.id, resumeId)))
  })

export const runResumeReview = createServerFn({ method: 'POST' })
  .validator(z.uuid()).handler(async ({ data: resumeId }) => {
    const userId = await requireUser()
    const resume = await activeResume(userId)
    if (resume.id !== resumeId) throw new WorkspaceError('The resume changed. Reload before reviewing it.')
    const review = await reviewResume(userId, resume.content)
    const [updated] = await getDb().update(resumes).set({ review })
      .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)))
      .returning({ id: resumes.id })
    if (!updated) throw new WorkspaceError('The resume changed during the review. Run it again for the current resume.')
  })

export const runJobReview = createServerFn({ method: 'POST' })
  .validator(z.object({ jobId: z.uuid(), resumeId: z.uuid() })).handler(async ({ data }) => {
    const userId = await requireUser()
    const db = getDb()
    const [job] = await db.select({ description: jobs.description }).from(jobs)
      .where(and(eq(jobs.id, data.jobId), eq(jobs.userId, userId)))
    if (!job?.description) throw new WorkspaceError('Save a job description before running a fit review.')
    const resume = await activeResume(userId)
    if (resume.id !== data.resumeId) throw new WorkspaceError('The resume changed. Reload before reviewing it.')
    const review = await reviewJobFit(userId, resume.content, job.description)

    await db.transaction(async (tx) => {
      await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for('update')
      const [current] = await tx.select({ id: resumes.id }).from(resumes)
        .where(and(eq(resumes.id, resume.id), eq(resumes.userId, userId))).for('update')
      if (!current) throw new WorkspaceError('The resume changed during the review. Run it again for the current resume.')
      await tx.insert(jobReviews).values({ resumeId: resume.id, jobId: data.jobId, review })
        .onConflictDoUpdate({ target: [jobReviews.resumeId, jobReviews.jobId], set: { review } })
    })
  })
