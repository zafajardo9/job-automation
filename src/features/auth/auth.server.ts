import '@tanstack/react-start/server-only'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { getDb } from '~/db/client'
import { accounts, sessions, users, verifications } from '~/db/schema'
import { env } from '~/lib/env'

export const authConfigured = Boolean(env.DATABASE_URL && env.BETTER_AUTH_SECRET)

function configure(secret: string) {
  return betterAuth({
    appName: env.APP_NAME,
    baseURL: env.BETTER_AUTH_URL ?? env.APP_URL,
    secret,
    database: drizzleAdapter(getDb(), {
      provider: 'pg',
      schema: { user: users, session: sessions, account: accounts, verification: verifications },
      transaction: true,
    }),
    emailAndPassword: { enabled: true, minPasswordLength: 8 },
    advanced: { database: { generateId: 'uuid' } },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const name = user.name.trim()
            if (!name || name.length > 120 || user.email.length > 320) return false
            return { data: { ...user, name } }
          },
        },
      },
    },
  })
}

let auth: ReturnType<typeof configure> | undefined

export function getAuth() {
  if (!authConfigured || !env.BETTER_AUTH_SECRET) throw new Error('JobFinder authentication is not configured.')
  return auth ??= configure(env.BETTER_AUTH_SECRET)
}

export async function sessionUser(headers: Headers) {
  if (!authConfigured) return null
  return (await getAuth().api.getSession({ headers }))?.user ?? null
}
