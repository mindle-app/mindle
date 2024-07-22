import {
  FormProvider,
  getFormProps,
  getInputProps,
  useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import {
  type ActionFunctionArgs,
  json,
  type LoaderFunctionArgs,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData,
} from '@remix-run/node'
import {
  Form,
  Outlet,
  redirect,
  useActionData,
  useLoaderData,
} from '@remix-run/react'
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

const SubjectEditorSchema = z.object({
  name: z.string().min(1),
  image: ImageFieldsetSchema,
  id: z.number(),
})

export async function loader({ params }: LoaderFunctionArgs) {
  const subject = await prisma.subject.findUnique({
    where: { id: Number(params.subjectId) },
    include: { image: true },
  })
  invariantResponse(subject, 'Subject not found', { status: 404 })
  return json({ subject })
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await parseMultipartFormData(
    request,
    createMemoryUploadHandler({ maxPartSize: MAX_UPLOAD_SIZE }),
  )

  const submission = await parseWithZod(formData, {
    schema: SubjectEditorSchema.superRefine(async (data, ctx) => {
      if (!data.id) return

      const subject = await prisma.subject.findUnique({
        select: { id: true },
        where: { id: data.id },
      })
      if (!subject) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Note not found',
        })
      }
    }).transform(async ({ image, ...data }) => {
      return {
        ...data,
        imageUpdate: imageHasId(image)
          ? imageHasFile(image)
            ? {
                id: image.id,
                altText: image.altText,
                contentType: image.file.type,
                blob: Buffer.from(await image.file.arrayBuffer()),
              }
            : {
                id: image.id,
                altText: image.altText,
              }
          : null,
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

  const {
    id: subjectId,
    name,
    imageUpdate = null,
    newImage = null,
  } = submission.value

  const updatedSubject = await prisma.subject.upsert({
    include: { image: true },
    where: { id: subjectId },
    create: {
      name,
      ...(newImage ? { image: { create: newImage } } : {}),
    },
    update: {
      name,
      image: {
        ...(imageUpdate ? { update: imageUpdate } : {}),
        ...(newImage ? { create: newImage } : {}),
      },
    },
  })

  return redirectWithToast(`/cms/subjects/${updatedSubject.id}`, {
    type: 'success',
    title: 'Subject updated',
    description: 'The subject has been updated successfully',
  })
}

export default function SubjectCMS() {
  const actionData = useActionData<typeof action>()
  const { subject } = useLoaderData<typeof loader>()
  const isPending = useIsPending()

  const [form, fields] = useForm({
    id: 'subject-editor',
    constraint: getZodConstraint(SubjectEditorSchema),
    lastResult: actionData?.result,
    onSubmit: async (data) => {
      console.log(data)
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: SubjectEditorSchema })
    },
    defaultValue: {
      ...subject,
      image: subject?.image ?? {},
    },
    shouldRevalidate: 'onBlur',
  })

  return (
    <div className="flex h-full flex-col md:flex-row">
      <div className="relative flex h-full w-full flex-col items-start">
        <FormProvider context={form.context}>
          <Form
            method={'POST'}
            className="flex h-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden px-10 pb-28 pt-12"
            {...getFormProps(form)}
            encType="multipart/form-data"
          >
            {/*
					This hidden submit button is here to ensure that when the user hits
					"enter" on an input field, the primary form function is submitted
					rather than the first button in the form (which is delete/add image).
				      */}
            <button type="submit" className="hidden" />

            {subject ? (
              <input type="hidden" name="id" value={subject.id} />
            ) : null}
            <div className="flex flex-col gap-1">
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
            <div className="flex gap-2.5 p-4">
              <Button variant="destructive" {...form.reset.getButtonProps()}>
                Reset
              </Button>
              <StatusButton
                form={form.id}
                type="submit"
                disabled={isPending}
                status={isPending ? 'pending' : 'idle'}
              >
                Submit
              </StatusButton>
            </div>
          </Form>
        </FormProvider>
      </div>
      <Outlet />
    </div>
  )
}
