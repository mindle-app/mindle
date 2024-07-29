import {
  FormProvider,
  getFormProps,
  getInputProps,
  useForm,
  unstable_useControl as useControl,
} from '@conform-to/react'
import { parseWithZod, getZodConstraint } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import {
  type ActionFunctionArgs,
  json,
  type LinksFunction,
  type LoaderFunctionArgs,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData,
} from '@remix-run/node'
import { Form, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { Field } from '#app/components/forms.js'
import { BlockEditor } from '#app/components/richtext-editor/components/block-editor/BlockEditor.js'
import editorStyleSheetUrl from '#app/components/richtext-editor/styles/index.css?url'
import { Button } from '#app/components/ui/button.js'
import { Label } from '#app/components/ui/label.js'
import { StatusButton } from '#app/components/ui/status-button.js'
import { prisma } from '#app/utils/db.server.js'
import {
  ImageChooser,
  ImageFieldsetSchema,
  MAX_UPLOAD_SIZE,
} from '#app/utils/image.js'
import { getLessonImgSrc, useIsPending } from '#app/utils/misc.js'
import { redirectWithToast } from '#app/utils/toast.server.js'
import { useState } from 'react'

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: editorStyleSheetUrl }].filter(Boolean)
}

export const LessonSchema = z.object({
  name: z.string().min(1).max(255),
  order: z.number().int().min(0),
  id: z.number().optional(),
  description: z.string().optional().nullable(),
  image: ImageFieldsetSchema,
  displayId: z.string().max(5).min(1).nullable(),
  width: z.number().int().min(1).optional(),
  height: z.number().int().min(1).optional(),
  parentLessonId: z.number().optional().nullable(),
})

export async function loader({ params }: LoaderFunctionArgs) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: Number(params.lessonId) },
    include: {
      image: { select: { id: true, altText: true } },
    },
  })

  invariantResponse(lesson, 'Lesson not found', { status: 404 })
  return json({ lesson })
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await parseMultipartFormData(
    request,
    createMemoryUploadHandler({ maxPartSize: MAX_UPLOAD_SIZE }),
  )

  const submission = await parseWithZod(formData, {
    schema: LessonSchema.superRefine(async (data, ctx) => {
      if (!data.id) return

      const lesson = await prisma.lesson.findUnique({
        select: { id: true },
        where: { id: data.id },
      })
      if (!lesson) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Subchapter not found',
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

  const { id, name, order, width, height, displayId, description } =
    submission.value

  const { id: updatedId } = await prisma.lesson.update({
    select: { id: true },
    where: { id },
    data: {
      name,
      order,
      width,
      height,
      displayId,
      description,
    },
  })

  return redirectWithToast(`/cms/lessons/${updatedId}`, {
    type: 'success',
    title: 'Success',
    description: 'The lesson has been updated successfully',
  })
}

export default function LessonCMS() {
  const { lesson } = useLoaderData<typeof loader>()

  const [form, fields] = useForm({
    id: 'lesson',
    constraint: getZodConstraint(LessonSchema),
    defaultValue: {
      ...lesson,
      image: lesson.image ? lesson.image : {},
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: LessonSchema })
    },
  })
  const descControl = useControl(fields.description)
  const [resetCounter, setResetCounter] = useState(0)

  const isPending = useIsPending()

  return (
    <div className="flex h-full w-full flex-col">
      <div className="relative flex h-full w-full flex-col items-start border-r px-4 pt-4">
        <FormProvider context={form.context}>
          <Form
            onReset={() => setResetCounter((c) => c + 1)}
            method={'POST'}
            className="relative flex w-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden"
            {...getFormProps(form)}
            encType="multipart/form-data"
          >
            <div className="flex items-center gap-2">
              <p className="text-2xl">Lesson</p>
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

            <div className="flex w-full flex-wrap gap-8">
              <input
                className={'hidden'}
                type={'hidden'}
                name={'id'}
                value={fields.id.value}
              />
              <Field
                labelProps={{ children: 'Name' }}
                inputProps={{
                  autoFocus: true,

                  ...getInputProps(fields.name, { type: 'text' }),
                }}
                errors={fields.name.errors}
              />
              <Field
                labelProps={{ children: 'Order' }}
                inputProps={{
                  ...getInputProps(fields.order, { type: 'number' }),
                }}
                errors={fields.order.errors}
              />
              <Field
                labelProps={{ children: 'Width' }}
                inputProps={{
                  ...getInputProps(fields.width, { type: 'number' }),
                }}
                errors={fields.width.errors}
              />
              <Field
                labelProps={{ children: 'Height' }}
                inputProps={{
                  ...getInputProps(fields.height, { type: 'number' }),
                }}
                errors={fields.height.errors}
              />
              <Field
                labelProps={{ children: 'DisplayId' }}
                inputProps={{
                  ...getInputProps(fields.displayId, { type: 'text' }),
                }}
                errors={fields.displayId.errors}
              />
              <input
                className="sr-only"
                ref={descControl.register}
                {...getInputProps(fields.description, { type: 'text' })}
              />
            </div>
            <div>
              <ImageChooser
                meta={fields.image}
                getImgSrc={(imageId) => getLessonImgSrc(imageId, true)}
              />
            </div>
          </Form>
          <div className="w-full">
            <Label>Description</Label>
            <BlockEditor
              key={`desc-${resetCounter}`}
              onFocus={descControl.focus}
              onBlur={descControl.blur}
              content={descControl.value}
              onUpdate={({ editor }) => descControl.change(editor.getHTML())}
            />
          </div>
        </FormProvider>
      </div>
    </div>
  )
}
