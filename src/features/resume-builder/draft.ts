import { z } from 'zod'

export const limits = {
  shortText: 160,
  contact: 320,
  url: 2_048,
  description: 1_500,
  bullet: 500,
  links: 10,
  sections: 12,
  entries: 15,
  bullets: 15,
} as const

const shortText = z.string().max(limits.shortText)
const id = z.uuid()

const entrySchema = z.object({
  id,
  title: shortText,
  organization: shortText,
  dates: shortText,
  description: z.string().max(limits.description),
  bullets: z.array(z.object({ id, text: z.string().max(limits.bullet) })).max(limits.bullets),
})

const sectionSchema = z.object({
  id,
  title: shortText,
  entries: z.array(entrySchema).max(limits.entries),
})

export const resumeFonts = {
  times: { label: 'Times New Roman · Serif', family: '"Times New Roman", Times, serif' },
  arial: { label: 'Arial · Sans-serif', family: 'Arial, Helvetica, sans-serif' },
  georgia: { label: 'Georgia · Serif', family: 'Georgia, serif' },
}

export const resumeFontSizes = ['10', '11', '12', '13', '14'] as const

export const resumeTypographySchema = z.object({
  font: z.enum(Object.keys(resumeFonts) as (keyof typeof resumeFonts)[]),
  size: z.enum(resumeFontSizes),
})

const defaultTypography = { font: 'times', size: '11' } as const

export const draftSchema = z.object({
  name: shortText,
  headline: shortText,
  email: z.string().max(limits.contact),
  phone: shortText,
  location: shortText,
  links: z.array(z.object({ id, label: shortText, url: z.string().max(limits.url) })).max(limits.links),
  sections: z.array(sectionSchema).max(limits.sections),
  typography: resumeTypographySchema.default(defaultTypography),
})

export type ResumeDraft = z.infer<typeof draftSchema>
export type DraftSection = z.infer<typeof sectionSchema>
export type DraftEntry = z.infer<typeof entrySchema>

export const blankDraft: ResumeDraft = {
  name: '', headline: '', email: '', phone: '', location: '', links: [], sections: [],
  typography: defaultTypography,
}
