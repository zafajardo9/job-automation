import { z } from 'zod'

const feedback = z.string().trim().min(1).max(600)

export const profileReviewSchema = z.object({
  assessment: feedback,
  strengths: z.array(feedback).max(4),
  improvements: z.array(feedback).min(1).max(5),
})

export type ProfileReview = z.infer<typeof profileReviewSchema>

export function hasProfileContent(profile: { headline: string; summary: string; experience: unknown[] }) {
  return Boolean(profile.headline.trim() || profile.summary.trim() || profile.experience.length)
}
