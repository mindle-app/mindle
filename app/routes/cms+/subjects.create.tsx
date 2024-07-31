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
import {
  ImageChooser,
  ImageFieldsetSchema,
  imageHasFile,
  imageHasId,
  MAX_UPLOAD_SIZE,
} from '#app/utils/image.js'
import { getSubjectImgSrc, useIsPending } from '#app/utils/misc.js'
import { redirectWithToast } from '#app/utils/toast.server.js'

const SubjectCreateSchema = z.object({
  name: z.string().min(1),
  image: ImageFieldsetSchema,
})

export async function action({ request }: ActionFunctionArgs) {
  const formData = await parseMultipartFormData(
    request,
    createMemoryUploadHandler({ maxPartSize: MAX_UPLOAD_SIZE }),
  )

  const submission = await parseWithZod(formData, {
    schema: SubjectCreateSchema.superRefine(async (data, ctx) => {
      const subject = await prisma.subject.findFirst({
        select: { id: true },
        where: { name: data.name },
      })
      if (subject) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Subject with this name already exists',
        })
      }
    }).transform(async ({ image, ...data }) => {
      return {
        ...data,
        newImage:
          !imageHasId(image) && imageHasFile(image)
            ? {
                altText: image.altText,
                contentType: image.file.type,
                blob: Buffer.from(await image.file.arrayBuffer()),
              }
            : null,
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

  const { name, newImage = null } = submission.value

  const createdSubject = await prisma.subject.create({
    include: { image: true },
    data: {
      name,
      ...(newImage ? { image: { create: newImage } } : {}),
    },
  })

  return redirectWithToast(`/cms/subjects/${createdSubject.id}`, {
    type: 'success',
    title: 'Subject updated',
    description: 'The subject has been updated successfully',
  })
}

export default function SubjectCMS() {
  const [form, fields] = useForm({
    id: 'subject-editor',
    constraint: getZodConstraint(SubjectCreateSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: SubjectCreateSchema })
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
              <p className="text-2xl">Subject</p>
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
