import '@tanstack/react-start/server-only'
import { load } from 'cheerio'
import { z } from 'zod'
import { env } from '~/lib/env'
import { maxDescriptionLength, normalizeJobUrl, publicLink, type JobDraft, type SearchResult } from './job-input'
import { fetchPublicHtml } from './public-html.server'
import { WorkspaceError } from '~/lib/workspace-error.server'

const braveResponse = z.object({
  web: z.object({
    results: z.array(z.object({
      title: z.string(),
      url: z.string(),
      description: z.string().optional(),
    })),
  }).optional(),
})

export async function searchPostings(keyword: string, location: string, remote: boolean) {
  if (!env.BRAVE_SEARCH_API_KEY) throw new WorkspaceError('Live search is unavailable. You can still import a job URL or add a job manually.')
  const endpoint = new URL('https://api.search.brave.com/res/v1/web/search')
  endpoint.search = new URLSearchParams({
    q: [keyword, location, remote ? 'remote' : '', 'job opening apply'].filter(Boolean).join(' '),
    count: '15',
    safesearch: 'strict',
    text_decorations: 'false',
  }).toString()

  try {
    const response = await fetch(endpoint, {
      headers: { 'X-Subscription-Token': env.BRAVE_SEARCH_API_KEY, Accept: 'application/json' },
      signal: AbortSignal.timeout(8_000),
    })
    if (!response.ok) throw new Error('Search request failed.')
    const { web } = braveResponse.parse(await response.json())
    const results = new Map<string, SearchResult>()
    for (const item of web?.results ?? []) {
      const link = publicLink.safeParse(item.url)
      if (!link.success) continue
      const key = normalizeJobUrl(link.data)
      if (!results.has(key)) {
        results.set(key, {
          url: link.data,
          title: htmlToText(item.title).slice(0, 240),
          snippet: htmlToText(item.description ?? '').slice(0, 600),
        })
      }
    }
    return [...results.values()]
  } catch {
    throw new WorkspaceError('Live search could not finish. Try again or add a job manually.')
  }
}

const postingSchema = z.object({
  '@type': z.union([z.string(), z.array(z.string())]),
  title: z.string().optional(),
  description: z.string(),
  hiringOrganization: z.object({ name: z.string().optional() }).nullish(),
  jobLocationType: z.string().optional(),
  jobLocation: z.unknown(),
  validThrough: z.string().optional(),
})

const addressSchema = z.object({
  address: z.object({
    addressLocality: z.string().optional(),
    addressRegion: z.string().optional(),
    addressCountry: z.string().optional(),
  }),
})

function findPosting(value: unknown): z.infer<typeof postingSchema> | undefined {
  if (Array.isArray(value)) {
    const postings = value.map(findPosting).filter((posting) => posting !== undefined)
    return postings.length === 1 ? postings[0] : undefined
  }
  if (!value || typeof value !== 'object') return undefined
  const posting = postingSchema.safeParse(value)
  if (posting.success && [posting.data['@type']].flat().some((type) => /(^|[/#])JobPosting$/.test(type))) {
    return posting.data
  }
  if ('@graph' in value && Array.isArray(value['@graph'])) {
    return findPosting(value['@graph'])
  }
}

function readableText(value: string) {
  return value.replace(/[^\S\n]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

function htmlToText(value: string) {
  const $ = load(value, {}, false)
  $('script, style, template, noscript, [hidden], [aria-hidden="true"]').remove()
  $('br').replaceWith('\n')
  $('p, li, h1, h2, h3, h4, div, section').append('\n')
  return readableText($.root().text())
}

export function extractPosting(html: string, url: string): JobDraft | null {
  const $ = load(html)
  const candidates = $('script[type="application/ld+json"]').toArray().flatMap((script) => {
    try {
      const posting = findPosting(JSON.parse($(script).text()))
      return posting ? [posting] : []
    } catch {
      return []
    }
  })
  if (candidates.length > 1) return null
  const posting = candidates[0]
  if (posting) {
    if (posting.validThrough && Date.parse(posting.validThrough) < Date.now()) return null
    const address = addressSchema.safeParse([posting.jobLocation].flat()[0])
    const location = posting.jobLocationType === 'TELECOMMUTE' ? 'Remote'
      : address.success ? Object.values(address.data.address).filter(Boolean).join(', ') : ''
    const description = htmlToText(posting.description).slice(0, maxDescriptionLength)
    if (description.length >= 80) {
      return {
        title: (posting.title ?? $('h1').first().text()).trim().slice(0, 200),
        company: (posting.hiringOrganization?.name ?? '').trim().slice(0, 200),
        location: location.slice(0, 200),
        url,
        description,
      }
    }
  }

  $('nav, header, footer, aside, form').remove()
  const title = $('h1').first().text().trim() || $('title').text().trim()
  const content = $('[itemprop="description"], .job-description, .job__description, #job-description').first().html()
    ?? $('main').first().html() ?? $('article').first().html() ?? $('body').html() ?? ''
  const description = htmlToText(content)
  if (description.length < 180
    || !/\b(responsibilities|qualifications|requirements|job description|about the role)\b/i.test(description)
    || /\b(this (job|position) (is|has) (no longer|closed|expired)|verify you are human|access denied)\b/i.test(description)) return null

  return {
    title: title.slice(0, 200),
    company: ($('meta[property="og:site_name"]').attr('content') ?? '').trim().slice(0, 200),
    location: '',
    url,
    description: description.slice(0, maxDescriptionLength),
  }
}

export async function importPosting(value: string): Promise<{ draft: JobDraft | null }> {
  try {
    const { html, url } = await fetchPublicHtml(value)
    return { draft: extractPosting(html, url) }
  } catch (error) {
    if (error instanceof WorkspaceError) throw error
    return { draft: null }
  }
}
