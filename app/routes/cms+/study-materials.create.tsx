import {
  FormProvider,
  getFormProps,
  getInputProps,
  useForm,
  unstable_useControl as useControl,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs, json } from '@remix-run/node'
import { Form, Outlet, useLoaderData } from '@remix-run/react'
import { promiseHash } from 'remix-utils/promise'
import { z } from 'zod'
import { Field, SelectField } from '#app/components/forms.js'
import { Button } from '#app/components/ui/button.js'

import { StatusButton } from '#app/components/ui/status-button.js'

import { prisma } from '#app/utils/db.server.js'
import { useIsPending } from '#app/utils/misc.js'
import {
  StudyMaterialTypeSchema,
  StudyMaterialTypes,
} from '#app/utils/study-material.js'
import { redirectWithToast } from '#app/utils/toast.server.js'
import { AuthorSelectField } from './study-materials.$studyMaterialId'

const StudyMaterialCreateSchema = z.object({
  title: z.string().min(1),
  authorId: z.string().optional(),
  subjectId: z.number().positive(),
  type: StudyMaterialTypeSchema,
})

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const submission = await parseWithZod(formData, {
    schema: StudyMaterialCreateSchema.superRefine(async (data, ctx) => {
      const studyMaterial = await prisma.studyMaterial.findFirst({
        select: { id: true },
        where: { title: data.title },
      })
      const subject = await prisma.subject.findFirst({
        select: { id: true },
        where: { id: data.subjectId },
      })
      if (!subject) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Subject not found',
        })
      }
      if (studyMaterial) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Study Material with this name already exists',
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

  const { type, title, subjectId, authorId } = submission.value

  await prisma.studyMaterial.create({
    data: {
      type,
      title,
      subjectId,
      authorId,
    },
  })

  return redirectWithToast(`/cms/study-materials/`, {
    type: 'success',
    title: 'StudyMaterial created',
    description: 'The studyMaterial has been created successfully',
  })
}

export async function loader() {
  const s = prisma.subject.findMany({
    select: { id: true, name: true },
  })
  const a = prisma.author.findMany({
    select: { id: true, name: true },
  })

  return json(await promiseHash({ authors: a, subjects: s }))
}

export default function StudyMaterialCMS() {
  const { subjects, authors } = useLoaderData<typeof loader>()
  const [form, fields] = useForm({
    id: 'study-material-editor',
    constraint: getZodConstraint(StudyMaterialCreateSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: StudyMaterialCreateSchema })
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
              <p className="text-2xl">New Study Material</p>
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

              <SelectField
                errors={fields.authorId.errors}
                meta={fields.authorId}
                labelProps={{ children: 'Author' }}
                options={authors.map((a) => ({
                  label: a.name,
                  value: a.id,
                }))}
                selectTriggerProps={{ className: 'w-[180px]' }}
                selectValueProps={{ placeholder: 'Select author' }}
              />
              <SelectField
                errors={fields.type.errors}
                meta={fields.type}
                labelProps={{ children: 'Type' }}
                options={StudyMaterialTypes.map((st) => ({
                  label: st,
                  value: st,
                }))}
                selectTriggerProps={{ className: 'w-[180px]' }}
                selectValueProps={{ placeholder: 'Select type' }}
              />
              <SelectField
                errors={fields.subjectId.errors}
                meta={fields.subjectId}
                labelProps={{ children: 'Subject' }}
                options={subjects.map((s) => ({
                  label: s.name,
                  value: s.id,
                }))}
                selectTriggerProps={{ className: 'w-[180px]' }}
                selectValueProps={{ placeholder: 'Select type' }}
              />
            </div>
          </Form>
        </FormProvider>
      </div>
      <Outlet />
    </div>
  )
}
