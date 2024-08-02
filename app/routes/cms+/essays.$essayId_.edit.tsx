import {
  FormProvider,
  getFormProps,
  getInputProps,
  useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs, json } from '@remix-run/node'
import { Form, Outlet, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { Field, SelectField } from '#app/components/forms.js'
import { Button } from '#app/components/ui/button.js'

import { StatusButton } from '#app/components/ui/status-button.js'

import { prisma } from '#app/utils/db.server.js'
import { useIsPending } from '#app/utils/misc.js'
import { redirectWithToast } from '#app/utils/toast.server.js'
import { loader as essayLoader } from './essays.$essayId.tsx'

const EssayUpdateSchema = z.object({
  title: z.string().min(1),
  authorId: z.string().optional(),
  studyMaterialId: z.string().min(1),
  id: z.string().min(1).optional(),
})

export async function action({ request, params }: ActionFunctionArgs) {
  const initialStudyMaterialId = new URL(request.url).searchParams.get(
    'studyMaterialId',
  )

  const formData = await request.formData()
  const submission = await parseWithZod(formData, {
    schema: EssayUpdateSchema.superRefine(async (data, ctx) => {
      const essay = await prisma.essay.findFirst({
        select: { id: true },
        where: { id: data.id },
      })
      if (data.authorId) {
        const author = await prisma.author.findFirst({
          where: { id: data.authorId },
        })
        if (!author) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Author not found',
          })
        }
      }

      if (!essay && params.essayId !== 'create') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Essay not found',
        })
      }
    }),
    async: true,
  })

  if (submission.status !== 'success') {
    return json(
      { result: submission.reply() },
      { status: submission.status === 'error' ? 400 : 200 },
    )
  }

  const { id: essayId, title, authorId, studyMaterialId } = submission.value

  const { id: updatedId } = await prisma.essay.upsert({
    select: { id: true },
    update: {
      title,
      authorId,
      studyMaterialId,
    },
    create: {
      title,
      authorId,
      studyMaterialId,
    },
    where: { id: essayId ?? '__new_essay__' },
  })

  return redirectWithToast(
    initialStudyMaterialId
      ? `/cms/study-materials/${initialStudyMaterialId}`
      : `/cms/essays/${updatedId}`,
    {
      type: 'success',
      title: 'Essay created',
      description: 'The essay has been created/updated successfully',
    },
  )
}

export const loader = essayLoader

export default function EssayCMS() {
  const { authors, essay, studyMaterials } = useLoaderData<typeof loader>()
  const [form, fields] = useForm({
    id: 'study-material-editor',
    constraint: getZodConstraint(EssayUpdateSchema),
    defaultValue: essay,
    onValidate({ formData }) {
      const result = parseWithZod(formData, { schema: EssayUpdateSchema })
      return result
    },
    shouldRevalidate: 'onBlur',
  })
  const isPending = useIsPending()

  return (
    <div className="flex h-full w-full flex-col md:flex-row">
      <div className="relative flex h-full w-full flex-col items-start border-r">
        <FormProvider context={form.context}>
          <Form
            method={'POST'}
            className="flex h-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden px-4 pb-4 pt-4"
            {...getFormProps(form)}
            encType="multipart/form-data"
          >
            <div className="flex items-center gap-2">
              <p className="text-2xl">Essay</p>
              <div className="flex w-full gap-1">
                <Button variant="destructive" {...form.reset.getButtonProps()}>
                  Reset
                </Button>
                <StatusButton
                  form={form.id}
                  type="submit"
                  disabled={isPending}
                  status={isPending ? 'pending' : 'idle'}
                >
                  Save
                </StatusButton>
              </div>
            </div>
            {/*
					This hidden submit button is hpere to ensure that when the user hits
					"enter" on an input field, the primary form function is submitted
					rather than the first button in the form (which is delete/add image).
				      */}
            <button type="submit" className="hidden" />

            <div className="flex gap-4">
              <Field
                labelProps={{ children: 'Title' }}
                inputProps={{
                  autoFocus: true,
                  ...getInputProps(fields.title, { type: 'text' }),
                }}
                errors={fields.title.errors}
              />
              <input {...getInputProps(fields.id, { type: 'hidden' })} />
              <SelectField
                errors={fields.authorId.errors}
                meta={fields.authorId}
                labelProps={{ children: 'Author (optional)' }}
                options={authors.map((a) => ({
                  label: a.name,
                  value: a.id,
                }))}
                selectTriggerProps={{ className: 'w-[180px]' }}
                selectValueProps={{ placeholder: 'Select author' }}
              />
              <SelectField
                errors={fields.studyMaterialId.errors}
                meta={fields.studyMaterialId}
                labelProps={{ children: 'Study Material' }}
                options={studyMaterials.map((sm) => ({
                  label: sm.title,
                  value: sm.id,
                }))}
                selectTriggerProps={{ className: 'w-[180px]' }}
                selectValueProps={{ placeholder: 'Select study material' }}
              />
            </div>
          </Form>
        </FormProvider>
      </div>
      <Outlet />
    </div>
  )
}
