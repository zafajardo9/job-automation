import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '~/db/client'
import { users } from '~/db/schema'
import { requireUser } from '~/features/auth/session.server'
import { publicLink } from '~/features/roles/job-input'
import { WorkspaceError } from '~/lib/workspace-error.server'

const optionalLink = z.union([publicLink, z.literal('')])
const profileInput = z.object({
  name: z.string().trim().min(1).max(120),
  headline: z.string().trim().max(160),
  location: z.string().trim().max(160),
  linkedinUrl: optionalLink,
  githubUrl: optionalLink,
  portfolioLinks: z.array(z.object({
    label: z.string().trim().min(1).max(80),
    url: publicLink,
  })).max(10),
})

export type ProfileInput = z.infer<typeof profileInput>

export const getProfile = createServerFn({ method: 'GET' }).handler(async (): Promise<ProfileInput> => {
  const userId = await requireUser()
  const [profile] = await getDb().select({
    name: users.name,
    headline: users.headline,
    location: users.location,
    linkedinUrl: users.linkedinUrl,
    githubUrl: users.githubUrl,
    portfolioLinks: users.portfolioLinks,
  }).from(users).where(eq(users.id, userId))
  if (!profile) throw new WorkspaceError('Profile not found.')
  return {
    ...profile,
    name: profile.name ?? '',
    headline: profile.headline ?? '',
    location: profile.location ?? '',
    linkedinUrl: profile.linkedinUrl ?? '',
    githubUrl: profile.githubUrl ?? '',
  }
})

export const saveProfile = createServerFn({ method: 'POST' }).validator(profileInput).handler(async ({ data }) => {
  const userId = await requireUser()
  await getDb().update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, userId))
})
