import { SendRawEmailCommand, SES } from '@aws-sdk/client-ses'
import { remember } from '@epic-web/remember'
import { renderAsync } from '@react-email/components'
import nodemailer, {
  type SendMailOptions as MailerSendMailOptions,
} from 'nodemailer'
import { type ReactElement } from 'react'
import { z } from 'zod'

const resendErrorSchema = z.union([
  z.object({
    name: z.string(),
    message: z.string(),
    statusCode: z.number(),
  }),
  z.object({
    name: z.literal('UnknownError'),
    message: z.literal('Unknown Error'),
    statusCode: z.literal(500),
    cause: z.any(),
  }),
])
type ResendError = z.infer<typeof resendErrorSchema>

type SendMailOptions = {
  to: string
  subject: string
} & (
  | { html: string; text: string; react?: never }
  | { react: ReactElement; html?: never; text?: never }
)

const resendSuccessSchema = z.object({
  id: z.string(),
})

const ses = remember(
  'aws-ses',
  () =>
    new SES({
      region: process.env.AMAZON_SES_REGION,
      credentials: {
        accessKeyId: process.env.AMAZON_SES_ACCESS_KEY,
        secretAccessKey: process.env.AMAZON_SES_SECRET_ACCESS_KEY,
      },
    }),
)

const mailer = remember('mailer', () => {
  // MOCK handler. There is a msw handler that catches this request
  // before going out. See mocks/resend.ts
  if (process.env.AMAZON_SES_ACCESS_KEY.startsWith('MOCK')) {
    return {
      sendMail: async (mail: MailerSendMailOptions) => {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          body: JSON.stringify(mail),
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
        })
        const data = await response.json()
        const parsedData = resendSuccessSchema.safeParse(data)
        if (parsedData.success) {
          return parsedData.data
        } else {
          throw data
        }
      },
    }
  }

  let transporter = nodemailer.createTransport({
    SES: { ses, aws: { SendRawEmailCommand } },
  })

  return {
    ...transporter,
    sendMail: async (options: MailerSendMailOptions) => {
      const res = await transporter.sendMail(options)
      return { id: res.messageId }
    },
  }
})

export async function sendEmail({ react, ...options }: SendMailOptions) {
  const from = 'heya@mindle.ro'

  const email = {
    from,
    ...options,
    ...(react ? await renderReactEmail(react) : null),
  }
  // feel free to remove this condition once you've set up resend
  if (!process.env.AMAZON_SES_ACCESS_KEY && !process.env.MOCKS) {
    console.error(`AMAZON_SES_ACCESS_KEY not set and we're not in mocks mode.`)
    console.error(
      `To send emails, set the AMAZON_SES_ACCESS_KEY, AMAZON_SES_SECRET_ACCESS_KEY environment variables.`,
    )
    console.error(`Would have sent the following email:`, JSON.stringify(email))
    return {
      status: 'success',
      data: { id: 'mocked' },
    } as const
  }
  try {
    const data = await mailer.sendMail(email)

    return {
      status: 'success',
      data,
    } as const
  } catch (err) {
    const parseResult = resendErrorSchema.safeParse(err)
    if (parseResult.success) {
      return {
        status: 'error',
        error: parseResult.data,
      } as const
    } else {
      return {
        status: 'error',
        error: {
          name: 'UnknownError',
          message: 'Unknown Error',
          statusCode: 500,
        } satisfies ResendError,
      } as const
    }
  }
}

async function renderReactEmail(react: ReactElement) {
  const [html, text] = await Promise.all([
    renderAsync(react),
    renderAsync(react, { plainText: true }),
  ])
  return { html, text }
}
