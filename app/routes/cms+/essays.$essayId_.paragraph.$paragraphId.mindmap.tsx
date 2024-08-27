import {
  FormProvider,
  getFormProps,
  getInputProps,
  useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Form, Outlet, useLoaderData, useParams } from '@remix-run/react'
import { z } from 'zod'
import { Field, RichTextField } from '#app/components/forms.js'

import { LinkButton } from '#app/components/ui/link-button.js'
import { prisma } from '#app/utils/db.server.js'
import { type LessonFieldset, LessonFieldsetSchema } from '#app/utils/lesson.js'
import { SubjectTypeSchema } from '#app/utils/subject.js'
import { ParagraphSchema } from './essays.$essayId'
import { LessonList } from './subchapters.$subchapterId'

const ExtendedParagraphSchema = ParagraphSchema.extend({
  lessons: z.array(LessonFieldsetSchema),
})

const ParagraphInfoSchema = z
  .array(
    z.object({
      studyMaterialId: z.string(),
      subjectId: z.number(),
      subjectSlug: z.string(),
      subjectType: SubjectTypeSchema,
    }),
  )
  .length(1)

export async function loader({ params }: LoaderFunctionArgs) {
  const paragraph = await prisma.essayParagraph.findUnique({
    where: { id: params.paragraphId },
    include: { lessons: { orderBy: { order: 'asc' } } },
  })
  const rawIds = await prisma.$queryRaw`
  SELECT e."studyMaterialId" as "studyMaterialId", sm."subjectId" as "subjectId", s."slug" as "subjectSlug", s.type as "subjectType"
  FROM essay e
  LEFT JOIN study_material sm ON sm.id = e."studyMaterialId"
  LEFT JOIN subject s ON s.id = sm."subjectId"
  WHERE e.id = ${params.essayId} LIMIT 1`

  const paragraphInfo = ParagraphInfoSchema.safeParse(rawIds)

  invariantResponse(paragraph, 'Paragraph not found', {
    status: 404,
  })

  const lessons = LessonFieldsetSchema.array().parse(
    paragraph.lessons.map((l) => ({ ...l, childLessons: [] })),
  )

  let root: LessonFieldset | null = null

  const lessonMap = lessons.reduce(
    (acc: Record<number, LessonFieldset>, lesson) => {
      if (!lesson.id) return acc
      acc[lesson.id] = lesson
      return acc
    },
    {},
  )
  for (const lesson of lessons) {
    if (!lesson.id) continue
    const currentNode = lessonMap[lesson.id]
    if (!currentNode) {
      continue
    }
    if (lesson.parentLessonId) {
      const parentLesson = lessonMap[lesson.parentLessonId]
      if (!parentLesson) {
        continue
      }
      if (parentLesson.childLessons) parentLesson.childLessons.push(currentNode)
      else {
        parentLesson.childLessons = [currentNode]
      }
    } else {
      // This node has no parent, hence it's the root
      root = currentNode || null
    }
  }

  return json({
    paragraph: { ...paragraph, lessons: root ? [root] : [] },
    ...(paragraphInfo.success ? { paragraphInfo: paragraphInfo.data[0] } : {}),
  })
}

export default function ParagraphMindmap() {
  const { paragraph, paragraphInfo } = useLoaderData<typeof loader>()
  const { essayId, paragraphId } = useParams()
  const [form, fields] = useForm({
    id: 'essay-editor',
    constraint: getZodConstraint(ExtendedParagraphSchema),
    defaultValue: paragraph,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ExtendedParagraphSchema })
    },
    shouldRevalidate: 'onBlur',
  })

  const lessons = fields.lessons.getFieldList()

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
              <p className="text-2xl">Paragraph</p>
              <LinkButton to={'edit'}>Edit</LinkButton>
              <LinkButton
                to={`/subjects/${paragraphInfo?.subjectType}/${paragraphInfo?.subjectSlug}/${paragraphInfo?.studyMaterialId}/${essayId}?selectedParagraph=${paragraphId}&preview=mindmap`}
              >
                Preview
              </LinkButton>
            </div>
            <div className="x flex w-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden px-4 pb-4">
              <div className="flex items-center gap-2">
                <p className="text-2xl">Lessons</p>
              </div>
              <LessonList lessons={lessons} />
            </div>

            <input {...getInputProps(fields.id, { type: 'hidden' })} />

            <div className="flex w-full flex-col gap-1 rounded">
              <Field
                className="max-w-[100px]"
                labelProps={{ children: 'Order' }}
                inputProps={{
                  disabled: true,
                  ...getInputProps(fields.order, {
                    type: 'number',
                  }),
                }}
                errors={fields.order.errors}
              />
              <RichTextField
                disabled={true}
                editorProps={{
                  editable: false,
                }}
                labelProps={{ children: 'Content' }}
                meta={fields.content}
                errors={fields.content.errors}
              />
              <RichTextField
                disabled={true}
                editorProps={{
                  className: 'w-full mt-4 ',
                }}
                labelProps={{ children: 'Explanation' }}
                meta={fields.explanation}
                errors={fields.explanation.errors}
              />
            </div>
          </Form>
        </FormProvider>
      </div>
      <Outlet />
    </div>
  )
}
