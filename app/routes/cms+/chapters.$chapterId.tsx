import {
  type FieldMetadata,
  FormProvider,
  getFieldsetProps,
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
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { Field } from '#app/components/forms.js'
import { Button } from '#app/components/ui/button.js'
import { prisma } from '#app/utils/db.server.js'
import {
  ImageChooser,
  ImageFieldsetSchema,
  imageHasFile,
  imageHasId,
  MAX_UPLOAD_SIZE,
} from '#app/utils/image.js'
import { getChapterImgSrc, useIsPending } from '#app/utils/misc.js'
import { redirectWithToast } from '#app/utils/toast.server.js'

const SubchapterEditorSchema = z.object({
  name: z.string().min(1).max(255),
  order: z.number().int().min(0),
  id: z.number().optional(),
})

type SubchapterFieldset = z.infer<typeof SubchapterEditorSchema>

const ChapterEditorSchema = z.object({
  name: z.string().min(1),
  image: ImageFieldsetSchema,
  id: z.number(),
  subChapters: z.array(SubchapterEditorSchema).optional(),
})

export async function loader({ params }: LoaderFunctionArgs) {
  const chapter = await prisma.chapter.findUnique({
    where: { id: Number(params.chapterId) },
    include: { image: true, subChapters: { orderBy: { order: 'asc' } } },
  })
  invariantResponse(chapter, 'Subject not found', { status: 404 })
  return json({ chapter })
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await parseMultipartFormData(
    request,
    createMemoryUploadHandler({ maxPartSize: MAX_UPLOAD_SIZE }),
  )

  const submission = await parseWithZod(formData, {
    schema: ChapterEditorSchema.superRefine(async (data, ctx) => {
      if (!data.id) return

      const chapter = await prisma.chapter.findUnique({
        select: { id: true },
        where: { id: data.id },
      })
      if (!chapter) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Chapter not found',
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
        subChapterUpdates: (data.subChapters ?? [])
          .filter((s) => s.id)
          .map((s) => ({
            name: s.name,
            order: s.order,
            id: s.id,
          })),
        newSubchapters: (data.subChapters ?? [])
          .filter((s) => !s.id)
          .map((s) => ({ name: s.name, order: s.order })),
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
    id,
    name,
    imageUpdate = null,
    newImage = null,
    subChapterUpdates,
    newSubchapters,
  } = submission.value

  const updatedChapter = await prisma.chapter.update({
    include: { image: true, subChapters: true },
    where: { id },
    data: {
      name,
      image: {
        ...(imageUpdate ? { update: imageUpdate } : {}),
        ...(newImage ? { create: newImage } : {}),
      },
      subChapters: {
        deleteMany: {
          id: {
            notIn: subChapterUpdates.map((s) => s.id).filter(Boolean),
          },
        },
        updateMany: subChapterUpdates.map((s) => ({
          where: { id: s.id },
          data: { name: s.name, order: s.order },
        })),
        create: newSubchapters,
      },
    },
  })

  return redirectWithToast(`/cms/chapters/${updatedChapter.id}`, {
    type: 'success',
    title: 'Subject updated',
    description: 'The subject has been updated successfully',
  })
}

export default function ChapterCMS() {
  const actionData = useActionData<typeof action>()
  const { chapter } = useLoaderData<typeof loader>()
  const isPending = useIsPending()

  const [form, fields] = useForm({
    id: 'subject-editor',
    constraint: getZodConstraint(ChapterEditorSchema),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ChapterEditorSchema })
    },
    defaultValue: {
      ...chapter,
      image: chapter?.image ?? {},
    },
    shouldRevalidate: 'onBlur',
  })

  const subchapters = fields.subChapters.getFieldList()

  return (
    <div className="flex h-full w-full flex-col">
      <div className="relative flex h-full w-full flex-col items-start border-r">
        <FormProvider context={form.context}>
          <Form
            method={'POST'}
            className="relative flex h-full w-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden px-4 pt-4"
            {...getFormProps(form)}
            encType="multipart/form-data"
          >
            <div className="flex items-center gap-2">
              <p className="text-2xl">Chapter</p>
              <Link to={'edit'}>
                <Button variant={'link'}>Edit</Button>
              </Link>
            </div>

            <div className="flex w-full gap-8">
              <Field
                labelProps={{ children: 'Name' }}
                inputProps={{
                  autoFocus: true,
                  disabled: true,

                  ...getInputProps(fields.name, { type: 'text' }),
                }}
                errors={fields.name.errors}
              />

              <ImageChooser
                preview
                meta={fields.image}
                getImgSrc={getChapterImgSrc}
              />
            </div>
            <div className="x flex w-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden px-4 pb-4">
              <div className="flex items-center gap-2">
                <p className="text-2xl">Subchapters</p>
              </div>
              <SubchapterList subchapters={subchapters} />
            </div>
          </Form>
        </FormProvider>
      </div>
    </div>
  )
}

function SubchapterList({
  subchapters,
}: {
  subchapters: FieldMetadata<SubchapterFieldset>[]
}) {
  return subchapters.map((s) => {
    const subchapter = s.getFieldset()
    return (
      <fieldset key={s.id} {...getFieldsetProps(s)}>
        <div className="flex gap-4">
          <input {...getInputProps(subchapter.id, { type: 'hidden' })} />
          <Field
            className="w-16"
            labelProps={{ children: 'ID' }}
            inputProps={{ value: subchapter.id.value, disabled: true }}
            errors={subchapter.name.errors}
          />
          <Field
            labelProps={{ children: 'Name' }}
            inputProps={{
              ...getInputProps(subchapter.name, { type: 'text' }),
              disabled: true,
            }}
            errors={subchapter.name.errors}
          />
          <Field
            labelProps={{ children: 'Order' }}
            inputProps={{
              ...getInputProps(subchapter.order, { type: 'number' }),
              disabled: true,
            }}
            errors={subchapter.order.errors}
          />
        </div>
      </fieldset>
    )
  })
}
