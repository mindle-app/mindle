import { getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { Field, SelectField } from '#app/components/forms.js'
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
import { ImageChooser, ImageFieldsetSchema } from '#app/utils/image.js'
import { getChapterImgSrc, getSubjectImgSrc } from '#app/utils/misc.js'
import { SubjectTypes, SubjectTypeSchema } from '#app/utils/subject.js'

const SubjectEditorSchema = z.object({
  name: z.string().min(1),
  image: ImageFieldsetSchema,
  id: z.number(),
  type: SubjectTypeSchema,
  slug: z.string(),
})

export async function loader({ params }: LoaderFunctionArgs) {
  const subject = await prisma.subject.findUnique({
    where: { id: Number(params.subjectId) },
    include: {
      image: true,
      chapters: { orderBy: { order: 'asc' }, include: { image: true } },
      studyMaterials: { include: { author: { select: { name: true } } } },
    },
  })
  invariantResponse(subject, 'Subject not found', { status: 404 })
  return json({ subject })
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

            <Field
              labelProps={{ children: 'Slug' }}
              inputProps={{
                ...getInputProps(fields.slug, {
                  type: 'text',
                }),
                disabled: true,
              }}
              errors={fields.slug.errors}
            />
            <SelectField
              errors={fields.type.errors}
              meta={fields.type}
              labelProps={{ children: 'Type' }}
              options={SubjectTypes.map((st) => ({
                label: st,
                value: st,
              }))}
              selectTriggerProps={{ className: 'w-[180px]', disabled: true }}
              selectValueProps={{ placeholder: 'Select type' }}
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
      <div className="flex h-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden px-4 pb-4 pt-4">
        <div className="flex items-center gap-2">
          <p className="text-2xl">Study Materials</p>
        </div>
        <StudyMaterialList />
      </div>
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

function StudyMaterialList() {
  const { subject } = useLoaderData<typeof loader>()
  const { studyMaterials } = subject
  return (
    <Table>
      <TableCaption>List of study materials</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>

          <TableHead className="w-[100px]">Name</TableHead>
          <TableHead>Author</TableHead>

          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {studyMaterials.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="w-[100px]">{c.id} </TableCell>

            <TableCell>{c.title}</TableCell>
            <TableCell>{c.author?.name}</TableCell>
            <TableCell className="text-right">
              <Link to={`/cms/study-materials/${c.id}/edit`}>
                <Button variant="link">Edit</Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
