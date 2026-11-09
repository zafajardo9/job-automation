import { z } from 'zod'

export const themes = { system: 'Follow device', light: 'Light', dark: 'Dark' } as const
export const colors = { indigo: 'Indigo', teal: 'Teal', plum: 'Plum' } as const
export const textSizes = { standard: 'Standard', large: 'Large', 'extra-large': 'Extra large' } as const

export const appearanceInput = z.object({
  theme: z.enum(Object.keys(themes) as (keyof typeof themes)[]),
  accent: z.enum(Object.keys(colors) as (keyof typeof colors)[]),
  textSize: z.enum(Object.keys(textSizes) as (keyof typeof textSizes)[]),
})

export type Appearance = z.infer<typeof appearanceInput>

export const defaultAppearance: Appearance = {
  theme: 'system',
  accent: 'indigo',
  textSize: 'standard',
}
