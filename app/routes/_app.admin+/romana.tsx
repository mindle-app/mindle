import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs } from '@remix-run/node'
import { Form, json, Link, useActionData } from '@remix-run/react'
import { HoneypotInputs } from 'remix-utils/honeypot/react'
import { z } from 'zod'
import { CheckboxField, ErrorList, Field } from '#app/components/forms.js'
import { StatusButton } from '#app/components/ui/status-button.js'
import { prisma } from '#app/utils/db.server.js'
import { checkHoneypot } from '#app/utils/honeypot.server.js'
import { useIsPending } from '#app/utils/misc.js'
import { requireUserWithRole } from '#app/utils/permissions.server.js'

const SubjectSchema = z.object({})

export async function action({ request }: ActionFunctionArgs) {
  await requireUserWithRole(request, 'admin')
  const formData = await request.formData()
  checkHoneypot(formData)
  const submission = await parseWithZod(formData, {
    schema: (intent) =>
      SubjectSchema.transform(async (data, ctx) => {
        if (intent !== null) return { ...data, session: null }

        return { ...data, session }
      }),
    async: true,
  })

  if (submission.status !== 'success' || !submission.value.session) {
    return json(
      { result: submission.reply({ hideFields: ['password'] }) },
      { status: submission.status === 'error' ? 400 : 200 },
    )
  }

  const { session, remember, redirectTo } = submission.value
}

export async function loader() {
  const result = await prisma.subject.findFirst({ where: { name: '' } })
  return null
}

export default function AddRomona() {
  const actionData = useActionData<typeof action>()

  const [form, fields] = useForm({
    id: 'login-form',
    constraint: getZodConstraint(SubjectSchema),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: SubjectSchema })
    },
    shouldRevalidate: 'onBlur',
  })
  const isPending = useIsPending()

  return (
    <div className="flex w-full flex-col items-center">
      <h1 className="text-bold text-2xl">Romana</h1>
      <div className="mx-auto w-full max-w-md px-8">
        <Form method="POST" {...getFormProps(form)}>
          <HoneypotInputs />
          <Field
            labelProps={{ children: 'Username' }}
            inputProps={{
              autoFocus: true,
              className: 'lowercase',
              autoComplete: 'username',
            }}
          />

          <Field
            labelProps={{ children: 'Parola' }}
            inputProps={{
              ...getInputProps(fields.password, {
                type: 'password',
              }),
              autoComplete: 'current-password',
            }}
            errors={fields.password.errors}
          />

          <div className="flex justify-between">
            <CheckboxField
              labelProps={{
                htmlFor: fields.remember.id,
                children: 'Tine-mă minte',
              }}
              buttonProps={getInputProps(fields.remember, {
                type: 'checkbox',
              })}
              errors={fields.remember.errors}
            />
            <div>
              <Link
                to="/forgot-password"
                className="text-body-xs font-semibold"
              >
                Ai uitat parola?
              </Link>
            </div>
          </div>

          <input {...getInputProps(fields.redirectTo, { type: 'hidden' })} />
          <ErrorList errors={form.errors} id={form.errorId} />

          <div className="flex items-center justify-between gap-6 pt-3">
            <StatusButton
              className="w-full"
              status={isPending ? 'pending' : form.status ?? 'idle'}
              type="submit"
              disabled={isPending}
            >
              Log in
            </StatusButton>
          </div>
        </Form>
      </div>
    </div>
  )
}
