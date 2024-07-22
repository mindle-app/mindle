import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#app/components/ui/table.js'
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
  Link,
  Outlet,
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
import {
  getChapterImgSrc,
  getSubjectImgSrc,
  useIsPending,
} from '#app/utils/misc.js'
import { redirectWithToast } from '#app/utils/toast.server.js'

const ChapterEditorSchema = z.object({
  name: z.string().min(1),
  image: ImageFieldsetSchema,

  id: z.number(),
})

export async function loader({ params }: LoaderFunctionArgs) {
  const chapter = await prisma.chapter.findUnique({
    where: { id: Number(params.chapterId) },
    include: { image: true, subChapters: true },
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

  return (
    <div className="flex h-full w-full flex-col">
      <div className="relative flex w-full flex-col items-start border-r">
        <FormProvider context={form.context}>
          <Form
            method={'POST'}
            className="flex flex-col gap-y-4 overflow-y-auto overflow-x-hidden px-4 pt-4"
            {...getFormProps(form)}
            encType="multipart/form-data"
          >
            <div className="flex items-center gap-2">
              <p className="text-2xl">Chapter</p>
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

            {chapter ? (
              <input type="hidden" name="id" value={chapter.id} />
            ) : null}
            <div className="flex gap-4">
              <Field
                labelProps={{ children: 'Name' }}
                inputProps={{
                  autoFocus: true,
                  ...getInputProps(fields.name, { type: 'text' }),
                }}
                errors={fields.name.errors}
              />

              <ImageChooser meta={fields.image} getImgSrc={getChapterImgSrc} />
            </div>
          </Form>
        </FormProvider>
      </div>
      <div className="x flex h-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden px-4 pb-4">
        <div className="flex items-center gap-2">
          <p className="text-2xl">Subchapters</p>
        </div>
        <SubchapterList />
      </div>
    </div>
  )
}

function SubchapterList() {
  const { chapter } = useLoaderData<typeof loader>()
  const { subChapters } = chapter
  return (
    <Table>
      <TableCaption>List of chapters</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>

          <TableHead className="w-[100px]">Name</TableHead>

          <TableHead>Order</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {subChapters.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="w-[100px]">{s.id} </TableCell>

            <TableCell>{s.name}</TableCell>
            <TableCell>{s.order}</TableCell>
            <TableCell className="text-right">
              <Link to={`/cms/chapters/${s.id}/edit`}>
                <Button variant="link">Edit</Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
