import { useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import {
  type ActionFunctionArgs,
  json,
  type LoaderFunctionArgs,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData,
} from '@remix-run/node'
import { Link, Outlet, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { Field } from '#app/components/forms.js'
import { SvgImage } from '#app/components/svg-image.js'
import { Button } from '#app/components/ui/button.js'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#app/components/ui/table'
import { prisma } from '#app/utils/db.server.js'
import {
  ImageChooser,
  ImageFieldsetSchema,
  imageHasFile,
  imageHasId,
  MAX_UPLOAD_SIZE,
} from '#app/utils/image.js'
import { getChapterImgSrc, getSubjectImgSrc } from '#app/utils/misc.js'
import { redirectWithToast } from '#app/utils/toast.server.js'

const SubjectEditorSchema = z.object({
  name: z.string().min(1),
  image: ImageFieldsetSchema,
  id: z.number(),
})

export async function loader({ params }: LoaderFunctionArgs) {
  const subject = await prisma.subject.findUnique({
    where: { id: Number(params.subjectId) },
    include: {
      image: true,
      chapters: { orderBy: { order: 'asc' }, include: { image: true } },
    },
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
  const { subject } = useLoaderData<typeof loader>()

  const [_, fields] = useForm({
    id: 'subject-editor',
    constraint: getZodConstraint(SubjectEditorSchema),
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
    <div className="flex h-full w-full flex-col">
      <div className="relative flex w-full flex-col items-start border-r">
        <div className="flex h-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden px-4 pb-4 pt-4">
          <div className="flex items-center gap-2">
            <p className="text-2xl">Subject</p>
            <div className="flex w-full gap-2.5">
              <Link to={'edit'}>
                <Button variant="link">Edit</Button>
              </Link>
            </div>
          </div>

          {subject ? (
            <input type="hidden" name="id" value={subject.id} />
          ) : null}
          <div className="flex flex-col gap-3 md:flex-row">
            <Field
              labelProps={{ children: 'Name' }}
              inputProps={{
                autoFocus: true,
                type: 'text',
                value: subject?.name,
                disabled: true,
              }}
            />

            <ImageChooser
              preview={true}
              meta={fields.image}
              getImgSrc={getSubjectImgSrc}
            />
          </div>
        </div>
      </div>
      <div className="flex h-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden px-4 pb-4 pt-4">
        <div className="flex items-center gap-2">
          <p className="text-2xl">Chapters</p>
        </div>
        <ChapterList />
      </div>

      <Outlet />
    </div>
  )
}

function ChapterList() {
  const { subject } = useLoaderData<typeof loader>()
  const { chapters } = subject
  return (
    <Table>
      <TableCaption>List of chapters</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>

          <TableHead className="w-[100px]">Img</TableHead>
          <TableHead className="w-[100px]">Name</TableHead>

          <TableHead>Order</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {chapters.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="w-[100px]">{c.id} </TableCell>

            <TableCell>
              <SvgImage
                className="fill-active-svg rounded border p-2"
                src={getChapterImgSrc(c?.image?.id ?? '')}
              />
            </TableCell>
            <TableCell>{c.name}</TableCell>
            <TableCell>{c.order}</TableCell>
            <TableCell className="text-right">
              <Link to={`/cms/chapters/${c.id}/edit`}>
                <Button variant="link">Edit</Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
