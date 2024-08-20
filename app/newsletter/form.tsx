import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useFetcher } from '@remix-run/react'
import { HoneypotInputs } from 'remix-utils/honeypot/react'
import { z } from 'zod'
import { Field } from '#app/components/forms.js'
import { StatusButton } from '#app/components/ui/status-button.js'
import { useRootData } from '#app/utils/use-root-data.js'

export const NewsletterSubmissionSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
})

export function LandingNewsletterForm() {
  const data = useRootData()
  const newsletterFetcher = useFetcher()
  const [form, fields] = useForm({
    id: 'newsletter',
    constraint: getZodConstraint(NewsletterSubmissionSchema),
    defaultValue: {
      email: data?.user?.email,
      name: data?.user?.name,
    },
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: NewsletterSubmissionSchema }),
  })
  return (
    <div className="flex w-full items-center gap-2">
      <newsletterFetcher.Form
        className="w-full"
        method="POST"
        action="/action/newsletter"
        {...getFormProps(form)}
      >
        <HoneypotInputs />

        <Field
          labelProps={{
            children: 'Name',
            className: 'text-primary-foreground',
          }}
          inputProps={{
            ...getInputProps(fields.name, {
              type: 'text',
            }),
            placeholder: 'Ion',
          }}
        />
        <Field
          labelProps={{
            children: 'Email',
            className: 'text-primary-foreground',
          }}
          inputProps={{
            ...getInputProps(fields.email, {
              type: 'email',
            }),
            placeholder: 'ion@creanga.ro',
          }}
        />
        <StatusButton
          variant={'secondary'}
          className="w-full"
          type="submit"
          status={
            newsletterFetcher.state === 'submitting'
              ? 'pending'
              : form.status ?? 'idle'
          }
        >
          Subscribe{' '}
        </StatusButton>
      </newsletterFetcher.Form>
    </div>
  )
}
