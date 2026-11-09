import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

/**
 * Drizzle Kit configuration.
 *
 * The fallback URL only exists so that schema-only commands
 * (`db:generate`, `db:check`) work without a `.env` file.
 * `db:migrate`, `db:push` and `db:studio` need a real DATABASE_URL.
 */
const url =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/jobfinder'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url },
  verbose: true,
  strict: true,
})
