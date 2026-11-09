import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '~/db/client'
import { users } from '~/db/schema'
import { requireUser } from '~/features/auth/session.server'
import { publicLink } from '~/features/roles/job-input'
import { geminiKeyStatus } from '~/features/settings/gemini-key.server'
import { generateReview } from '~/lib/gemini.server'
import { WorkspaceError } from '~/lib/workspace-error.server'
import { experienceInput } from './experience'
import { hasProfileContent, profileReviewSchema } from './profile-review'

const optionalLink = z.union([publicLink, z.literal('')])
const profileInput = z.object({
  name: z.string().trim().min(1).max(120),
  headline: z.string().trim().max(160),
  location: z.string().trim().max(160),
  targetRole: z.string().trim().max(160),
  summary: z.string().trim().max(1000),
  experience: z.array(experienceInput).max(30),
  linkedinUrl: optionalLink,
  githubUrl: optionalLink,
  portfolioLinks: z.array(z.object({
    label: z.string().trim().min(1).max(80),
    url: publicLink,
  })).max(10),
})

export type ProfileInput = z.infer<typeof profileInput>

async function readProfile(userId: string): Promise<ProfileInput> {
  const [profile] = await getDb().select({
    name: users.name,
    headline: users.headline,
    location: users.location,
    targetRole: users.targetRole,
    summary: users.summary,
    experience: users.experience,
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
    targetRole: profile.targetRole ?? '',
    summary: profile.summary ?? '',
    linkedinUrl: profile.linkedinUrl ?? '',
    githubUrl: profile.githubUrl ?? '',
  }
}

export const getProfile = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = await requireUser()
  const [profile, { personal, shared }] = await Promise.all([readProfile(userId), geminiKeyStatus(userId)])
  return { profile, reviewEnabled: personal || shared }
})

export const saveProfile = createServerFn({ method: 'POST' }).validator(profileInput).handler(async ({ data }) => {
  const userId = await requireUser()
  await getDb().update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, userId))
  return data
})

export const runProfileReview = createServerFn({ method: 'POST' }).handler(async () => {
  const userId = await requireUser()
  const profile = await readProfile(userId)
  if (!hasProfileContent(profile)) {
    throw new WorkspaceError('Save a headline, summary, or experience entry before checking your profile.')
  }

  const { headline, targetRole, summary, experience, linkedinUrl, githubUrl, portfolioLinks } = profile
  return generateReview(userId, profileReviewSchema, [
    'Review the quality of a job seeker’s professional profile for a recruiter skimming it.',
    'Assess clarity, relevance to the stated target role, completeness, and evidence of accomplishments.',
    'If no target role is provided, assess the profile generally and suggest clarifying the target.',
    'Identify specific strengths that the profile supports and order suggested improvements by impact.',
    'When helpful, give concrete example wording grounded in the profile. Ask for missing details instead of inventing them.',
    'Link indicators only show whether links were added. Do not infer that you visited or evaluated any external content.',
  ].join(' '), {
    headline, targetRole, summary, experience,
    links: { linkedIn: Boolean(linkedinUrl), github: Boolean(githubUrl), portfolioCount: portfolioLinks.length },
  })
})
