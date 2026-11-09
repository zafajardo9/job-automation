import '@tanstack/react-start/server-only'
import { eq } from 'drizzle-orm'
import { getDb } from '~/db/client'
import { resumes, users } from '~/db/schema'

export async function replaceResume(userId: string, filename: string, content: string) {
  await getDb().transaction(async (tx) => {
    await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for('update')
    await tx.delete(resumes).where(eq(resumes.userId, userId))
    await tx.insert(resumes).values({ userId, filename, content })
  })
}
