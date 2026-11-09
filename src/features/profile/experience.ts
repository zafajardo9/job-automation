import { z } from 'zod'

export const experienceInput = z.object({
  area: z.string().trim().min(1).max(120),
  years: z.number().int().min(0).max(80),
  months: z.number().int().min(0).max(11),
  details: z.string().trim().max(500),
}).refine(({ years, months }) => years > 0 || months > 0, {
  message: 'Enter a duration of at least one month.',
})

export type Experience = z.infer<typeof experienceInput>
