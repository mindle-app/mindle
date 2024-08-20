import { parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs, json } from '@remix-run/node'
import { NewsletterSubmissionSchema } from '#app/newsletter/form.js'
import { addNewsletterSubscriber } from '#app/newsletter/newsletter.server.js'
import { cache } from '#app/utils/cache.server.js'
import { checkHoneypot } from '#app/utils/honeypot.server.js'
import { getNewsletterCacheKey } from '#app/utils/user-info.js'

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  checkHoneypot(formData)
  const submission = parseWithZod(formData, {
    schema: NewsletterSubmissionSchema,
  })

  if (submission.status !== 'success') {
    return json(
      { result: submission.reply() },
      { status: submission.status === 'error' ? 400 : 200 },
    )
  }

  const { email, name } = submission.value
  const isSuccess = await addNewsletterSubscriber({ name, email })

  if (isSuccess) {
    cache.delete(getNewsletterCacheKey(email))
  }

  return { status: 'success' }
}
