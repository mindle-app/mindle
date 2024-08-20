import { type User } from '@prisma/client'
import { z } from 'zod'
import {
  getNewsletterSubscriberStatus,
  type SendySubscriberStatus,
  SendySubscriberStatusSchema,
} from '#app/newsletter/newsletter.server.js'
import { cache, cachified } from './cache.server'
import { type Timings } from './timing.server'

export const getNewsletterCacheKey = (email: string) => `newsletter:${email}`

export async function getUserInfo(
  user: Pick<User, 'email'>,
  {
    forceFresh,
    timings,
  }: { request: Request; forceFresh?: boolean; timings?: Timings },
) {
  const [newsletterInfo] = await Promise.all([
    user.email
      ? cachified<{ status: SendySubscriberStatus }>({
          cache,
          timings,
          forceFresh,
          ttl: 1000 * 60 * 60 * 24 * 30,
          staleWhileRevalidate: 1000 * 60 * 60 * 24 * 30,
          key: getNewsletterCacheKey(user.email),
          checkValue: z.object({ status: SendySubscriberStatusSchema }),
          getFreshValue: async () => {
            const subscriberStatus = await getNewsletterSubscriberStatus(
              user.email,
            )
            if (!subscriberStatus) {
              return { status: 'Unsubscribed' }
            }
            return { status: subscriberStatus }
          },
        })
      : null,
  ])

  const userInfo = {
    newsletter: newsletterInfo,
  }
  return userInfo
}
