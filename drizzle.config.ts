import 'dotenv/config'
import { type Config } from 'drizzle-kit'
import { z } from 'zod'

const env = z
  .object({
    DRIZZLE_DATABASE_URL: z.string(),
  })
  .parse(process.env)

export default {
  dialect: 'sqlite',
  schema: './drizzle/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: env.DRIZZLE_DATABASE_URL,
  },
} satisfies Config
