import '@tanstack/react-start/server-only'
import { z } from 'zod'
import { appName } from './app'

const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional())

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_NAME: z.string().default(appName),
  APP_URL: z.url({ protocol: /^https?$/ }).default('http://localhost:3000'),
  DATABASE_URL: optional(z.url()),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
  DATABASE_LOGGING: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  BETTER_AUTH_SECRET: optional(z.string().min(1)),
  BETTER_AUTH_URL: optional(z.url({ protocol: /^https?$/ })),
  BRAVE_SEARCH_API_KEY: optional(z.string().min(1)),
  GEMINI_API_KEY: optional(z.string().min(1)),
  GEMINI_MODEL: z.preprocess(
    (value) => value === '' ? undefined : value,
    z.string().regex(/^gemini-[a-z0-9.-]+$/).default('gemini-3.5-flash'),
  ),
})

function formatIssues(
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>,
) {
  const lines = issues.map((issue) => {
    const name = issue.path.map(String).join('.') || '(root)'
    return `  - ${name}: ${issue.message}`
  })

  return [
    'Invalid environment variables:',
    ...lines,
    'Compare your .env with .env.example, then restart the dev server.',
  ].join('\n')
}

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  throw new Error(formatIssues(parsed.error.issues))
}

export const env = parsed.data
