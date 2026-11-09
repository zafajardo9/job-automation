import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '~/db/client'
import { userSettings } from '~/db/schema'
import { requireUser } from '~/features/auth/session.server'
import { appearanceInput } from './appearance'
import { encryptGeminiKey, geminiKeyStatus } from './gemini-key.server'

export const getGeminiSettings = createServerFn({ method: 'GET' }).handler(async () => {
  return geminiKeyStatus(await requireUser())
})

export const saveAppearance = createServerFn({ method: 'POST' })
  .validator(appearanceInput).handler(async ({ data }) => {
    const userId = await requireUser()
    await getDb().insert(userSettings).values({ userId, ...data })
      .onConflictDoUpdate({ target: userSettings.userId, set: data })
  })

export const saveGeminiKey = createServerFn({ method: 'POST' })
  .validator(z.string().trim().min(16).max(256).regex(/^[A-Za-z0-9_-]+$/))
  .handler(async ({ data }) => {
    const userId = await requireUser()
    const encryptedGeminiKey = encryptGeminiKey(userId, data)
    await getDb().insert(userSettings).values({ userId, encryptedGeminiKey })
      .onConflictDoUpdate({ target: userSettings.userId, set: { encryptedGeminiKey } })
  })

export const removeGeminiKey = createServerFn({ method: 'POST' }).handler(async () => {
  const userId = await requireUser()
  await getDb().update(userSettings).set({ encryptedGeminiKey: null })
    .where(eq(userSettings.userId, userId))
})
