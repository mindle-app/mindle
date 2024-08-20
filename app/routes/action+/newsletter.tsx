import { parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs, json } from '@remix-run/node'
import { Link } from '@remix-run/react'
import { MindleScholar } from '#app/components/illustrations/mindle-scholar.js'
import { Button } from '#app/components/ui/button.js'
import { Icon } from '#app/components/ui/icon.js'
import { NewsletterSubmissionSchema } from '#app/newsletter/form.js'
import { addNewsletterSubscriber } from '#app/newsletter/newsletter.server.js'
import { cache } from '#app/utils/cache.server.js'
import { checkHoneypot } from '#app/utils/honeypot.server.js'
import { redirectWithToast } from '#app/utils/toast.server.js'
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
    return redirectWithToast('/action/newsletter', {
      type: 'success',
      title: 'Te-ai abonat cu succes',
      description: 'Mulțumim că ne ești alături!',
    })
  }

  return { status: 'error' }
}

export default function SignupNewsletterSuccess() {
  return (
    <main className="flex h-full w-full items-center justify-center gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl">Huzzah!</h1>
        <h2 className="text-2xl text-muted-foreground">
          Te-ai abonat cu success newsletter
        </h2>

        <p>Mulțumim pentru încrederea acordată!</p>

        <Link to={'/'}>
          <Button variant={'link'} className="pl-0">
            <Icon name={'arrow-left'} />
            Mergi acasă
          </Button>
        </Link>
      </div>
      <div>
        <MindleScholar />
      </div>
    </main>
  )
}
