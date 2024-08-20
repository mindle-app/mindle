import { z } from 'zod'

export const SendySubscriberStatusSchema = z.enum([
  'Subscribed',
  'Unsubscribed',
  'Bounced',
  'Complained',
  'Unconfirmed',
  'Bounced',
  'Soft Bounced',
])

export type SendySubscriberStatus = z.infer<typeof SendySubscriberStatusSchema>

export async function getNewsletterSubscriberStatus(email: string) {
  // Note: Using URLSearchParams to simulate form data as the Sendy
  // API expects
  const params = new URLSearchParams({
    email: email,
    list_id: process.env.SENDY_LIST_ID,
    api_key: process.env.SENDY_API_KEY,
    boolean: 'true',
  })
  const resp = await fetch(
    'https://mail.mindle.ro/api/subscribers/subscription-status.php',
    {
      method: 'POST',
      body: params,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    },
  )
  const text = await resp.text()
  try {
    const parsed = SendySubscriberStatusSchema.parse(text)
    return parsed
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_err) {
    return 'Unsubscribed'
  }
}

export async function addNewsletterSubscriber({
  email,
  name,
  ip,
  referrer,
}: {
  email: string
  name?: string
  ip?: string
  referrer?: string
}) {
  // Note: Using URLSearchParams to simulate form data as the Sendy
  // API expects
  const params = new URLSearchParams({
    email,
    list: process.env.SENDY_LIST_ID,
    api_key: process.env.SENDY_API_KEY,
    boolean: 'true',
    ...(name ? { name } : {}),
    ...(ip ? { ip } : {}),
    ...(referrer ? { referrer } : {}),
  })

  // this is a basic form that doesn't really do anything. It's just a way to
  // get the users on the mailing list
  const response = await fetch('https://mail.mindle.ro/subscribe', {
    method: 'POST',
    body: params,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  console.log(response)

  const text = await response.text()
  console.log(text)
  return text === 'true'
}
