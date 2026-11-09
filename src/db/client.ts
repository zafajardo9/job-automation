import '@tanstack/react-start/server-only'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { env } from '~/lib/env'
import * as schema from './schema'

function connect(connectionString: string) {
  const pool = new Pool({ connectionString, max: env.DATABASE_POOL_MAX })
  pool.on('error', () => console.error('An idle database connection failed.'))
  return drizzle({ client: pool, schema, logger: env.DATABASE_LOGGING })
}

let db: ReturnType<typeof connect> | undefined

export function getDb() {
  if (!env.DATABASE_URL) throw new Error('Set DATABASE_URL to connect JobFinder to PostgreSQL.')
  return db ??= connect(env.DATABASE_URL)
}
