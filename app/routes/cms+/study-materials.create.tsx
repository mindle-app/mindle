import {
  FormProvider,
  getFormProps,
  getInputProps,
  useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import {
  type ActionFunctionArgs,
  json,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData,
} from '@remix-run/node'
import { Form, Outlet } from '@remix-run/react'
import { z } from 'zod'
import { Field } from '#app/components/forms.js'
import { Button } from '#app/components/ui/button.js'
import { StatusButton } from '#app/components/ui/status-button.js'

import { prisma } from '#app/utils/db.server.js'
import { ImageChooser, MAX_UPLOAD_SIZE } from '#app/utils/image.js'
import { getSubjectImgSrc, useIsPending } from '#app/utils/misc.js'
import { StudyMaterialTypeSchema } from '#app/utils/study-material.js'
import { redirectWithToast } from '#app/utils/toast.server.js'

const StudyMaterialCreateSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1).optional(),
  subjectId: z.number().positive(),
  type: StudyMaterialTypeSchema,
})

export async function action({ request }: ActionFunctionArgs) {
  const formData = await parseMultipartFormData(
    request,
    createMemoryUploadHandler({ maxPartSize: MAX_UPLOAD_SIZE }),
  )

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

  const { title, author, subjectId } = submission.value

  const createdStudyMaterial = await prisma.studyMaterial.create({
    data: {
      title,
      author,
      subjectId,
    },
  })

  return redirectWithToast(`/cms/subjects/${createdStudyMaterial.id}`, {
    type: 'success',
    title: 'StudyMaterial updated',
    description: 'The studyMaterial has been updated successfully',
  })
}

export default function StudyMaterialCMS() {
  const [form, fields] = useForm({
    id: 'studyMaterial-editor',
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
              <p className="text-2xl">StudyMaterial</p>
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
					This hidden submit button is here to ensure that when the user hits
					"enter" on an input field, the primary form function is submitted
					rather than the first button in the form (which is delete/add image).
				      */}
            <button type="submit" className="hidden" />

            <div className="flex gap-4">
              <Field
                labelProps={{ children: 'Name' }}
                inputProps={{
                  autoFocus: true,
                  ...getInputProps(fields.name, { type: 'text' }),
                }}
                errors={fields.name.errors}
              />

              <ImageChooser meta={fields.image} getImgSrc={getSubjectImgSrc} />
            </div>
          </Form>
        </FormProvider>
      </div>
      <Outlet />
    </div>
  )
}
