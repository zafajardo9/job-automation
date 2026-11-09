import '@tanstack/react-start/server-only'
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '~/db/client'
import { userSettings } from '~/db/schema'
import { env } from '~/lib/env'
import { WorkspaceError } from '~/lib/workspace-error.server'

function encryptionKey() {
  const secret = env.SETTINGS_ENCRYPTION_SECRET ?? env.BETTER_AUTH_SECRET
  if (!secret) throw new Error('Settings encryption is unavailable.')
  return Buffer.from(hkdfSync('sha256', secret, 'jobfinder', 'gemini-key:v1', 32))
}

export function encryptGeminiKey(userId: string, key: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  cipher.setAAD(Buffer.from(userId))
  const ciphertext = Buffer.concat([cipher.update(key, 'utf8'), cipher.final()])
  return 'v1.' + Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64url')
}

function decryptGeminiKey(userId: string, value: string) {
  try {
    if (!value.startsWith('v1.')) throw new Error()
    const bytes = Buffer.from(value.slice(3), 'base64url')
    const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), bytes.subarray(0, 12))
    decipher.setAAD(Buffer.from(userId))
    decipher.setAuthTag(bytes.subarray(12, 28))
    return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString('utf8')
  } catch {
    throw new WorkspaceError('Your Gemini key could not be read. Replace it in Settings.')
  }
}

export async function geminiKeyStatus(userId: string) {
  const [row] = await getDb().select({
    personal: sql<boolean>`${userSettings.encryptedGeminiKey} is not null`,
  }).from(userSettings).where(eq(userSettings.userId, userId))

  return {
    personal: row?.personal ?? false,
    shared: Boolean(env.GEMINI_API_KEY),
  }
}

export async function resolveGeminiKey(userId: string) {
  const [row] = await getDb().select({ key: userSettings.encryptedGeminiKey })
    .from(userSettings).where(eq(userSettings.userId, userId))
  if (row?.key) return decryptGeminiKey(userId, row.key)
  if (env.GEMINI_API_KEY) return env.GEMINI_API_KEY
  throw new WorkspaceError('Add a Gemini API key in Settings to run a review.')
}
