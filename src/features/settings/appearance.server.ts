import '@tanstack/react-start/server-only'
import { eq } from 'drizzle-orm'
import { getDb } from '~/db/client'
import { userSettings } from '~/db/schema'
import { appearanceInput, defaultAppearance, type Appearance } from './appearance'

export async function getAppearance(userId: string): Promise<Appearance> {
  const [row] = await getDb().select({
    theme: userSettings.theme,
    accent: userSettings.accent,
    textSize: userSettings.textSize,
  }).from(userSettings).where(eq(userSettings.userId, userId))

  const parsed = appearanceInput.safeParse(row)
  return parsed.success ? parsed.data : defaultAppearance
}
