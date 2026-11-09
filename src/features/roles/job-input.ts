import { z } from 'zod'

export const maxDescriptionLength = 20_000

export const publicLink = z.string().trim().max(2_048).refine((value) => {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
  } catch {
    return false
  }
}, 'Enter an HTTP or HTTPS URL.')

export const jobDraft = z.object({
  title: z.string().trim().min(1).max(200),
  company: z.string().trim().min(1).max(200),
  location: z.string().trim().max(200),
  url: z.union([publicLink, z.literal('')]),
  description: z.string().trim().min(1).max(maxDescriptionLength),
})

export const jobSearch = z.object({
  keyword: z.string().trim().min(1).max(120),
  location: z.string().trim().max(120),
  remote: z.boolean(),
})

export type JobDraft = z.infer<typeof jobDraft>
export type SearchResult = { title: string; snippet: string; url: string }

export function normalizeJobUrl(value: string) {
  const url = new URL(value)
  url.hash = ''
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_.*|fbclid|gclid|msclkid)$/i.test(key)) url.searchParams.delete(key)
  }
  url.searchParams.sort()
  url.pathname = url.pathname.replace(/\/+$/, '') || '/'
  return url.toString()
}
