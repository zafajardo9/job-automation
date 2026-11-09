import { z } from 'zod'

const text = z.string().min(1).max(600)
const estimate = z.number().int().min(0).max(100)

export const atsReviewSchema = z.object({
  score: estimate,
  structure: text,
  clarity: text,
  impact: text,
  edits: z.array(text).max(6),
})

export const fitReviewSchema = z.object({
  score: estimate,
  matches: z.array(z.object({ requirement: text, evidence: text })).max(8),
  gaps: z.array(text).max(8),
  edits: z.array(text).max(6),
})

export type AtsReview = z.infer<typeof atsReviewSchema>
export type FitReview = z.infer<typeof fitReviewSchema>
