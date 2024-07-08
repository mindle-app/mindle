import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { z } from 'zod'
const env = z
  .object({
    DRIZZLE_DATABASE_URL: z.string(),
  })
  .parse(process.env)

const client = createClient({
  url: env.DRIZZLE_DATABASE_URL,
})

export const db = drizzle(client)
