/**
 * The job status vocabulary, shared by the Drizzle enum and the UI.
 *
 * It lives here rather than in `src/db/schema.ts` so client components can use
 * the type without pulling `drizzle-orm/pg-core` into the browser bundle.
 */
export const jobStatuses = [
  'saved',
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'archived',
] as const

export type JobStatus = (typeof jobStatuses)[number]
