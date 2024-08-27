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
} from '@remix-run/node'
import { Form, Outlet, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { Field, RichTextField } from '#app/components/forms.js'

import { Button } from '#app/components/ui/button.js'
import { Icon } from '#app/components/ui/icon.js'
import { StatusButton } from '#app/components/ui/status-button.js'
import { prisma } from '#app/utils/db.server.js'
import {
  flattenLessons,
  type LessonFieldset,
  LessonFieldsetSchema,
} from '#app/utils/lesson.js'
import { useIsPending } from '#app/utils/misc.js'
import { ParagraphSchema } from './essays.$essayId'
import { LessonListEdit } from './subchapters.$subchapterId_.edit'
import { redirectWithToast } from '#app/utils/toast.server.js'

const ExtendedParagraphSchema = ParagraphSchema.extend({
  lessons: z.array(LessonFieldsetSchema),
})

export async function loader({ params }: LoaderFunctionArgs) {
  const paragraph = await prisma.essayParagraph.findUnique({
    where: { id: params.paragraphId },
    include: { lessons: { orderBy: { order: 'asc' } } },
  })
  invariantResponse(paragraph, 'Paragraph not found', { status: 404 })

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

  return json({ paragraph: { ...paragraph, lessons: root ? [root] : [] } })
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData()

  const submission = await parseWithZod(formData, {
    schema: ExtendedParagraphSchema.superRefine(async (data, ctx) => {
      if (!data.id) return

      const paragraph = await prisma.essayParagraph.findUnique({
        select: { id: true },
        where: { id: data.id },
      })
      if (!paragraph) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Paragraph not found',
        })
      }
      const rootLessons = (data.lessons ?? [])?.filter((l) => !l.parentLessonId)
      if (rootLessons.length > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'There are more than one lessons with no parent. Only one lesson can be root',
        })
      }
    }).transform(async ({ ...data }) => {
      const lessons = flattenLessons(data.lessons ?? [])

      return {
        ...data,
        lessonUpdates: await Promise.all(
          lessons
            .filter((l) => l.id)
            .map(async ({ childLessons, image, ...l }) => {
              return {
                ...l,
              }
            }),
        ),
        newLessons: await Promise.all(
          lessons
            .filter((l) => !l.id)
            .map(async ({ childLessons, image, id, ...l }) => ({
              ...l,
            })),
        ),
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
    order,
    content,
    explanation,
    newLessons = [],
    lessonUpdates = [],
  } = submission.value

  const { id: updatedId } = await prisma.essayParagraph.update({
    select: { id: true },
    where: { id: id ?? '__new_subchapter__' },
    data: {
      order,
      content,
      explanation,
      lessons: {
        deleteMany: {
          id: { notIn: lessonUpdates.map((i) => i.id).filter(Boolean) },
        },
        updateMany: lessonUpdates.map((updates) => ({
          where: { id: updates.id },
          data: updates,
        })),
        createMany: { data: newLessons },
      },
    },
  })

  return redirectWithToast(
    `/cms/essays/${params.essayId}/paragraph/${params.paragraphId}/mindmap`,
    {
      type: 'success',
      title: 'Success',
      description: 'Paragraph updated',
    },
  )
}

export default function ParagraphMindmap() {
  const { paragraph } = useLoaderData<typeof loader>()
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
              <p className="text-2xl">Paragraph</p>
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
            <div className="x flex w-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden px-4 pb-4">
              <div className="flex items-center gap-2">
                <p className="text-2xl">Lessons</p>
                <Button
                  variant={'link'}
                  {...form.insert.getButtonProps({
                    name: fields.lessons.name,
                  })}
                >
                  Create
                  <Icon name={'plus'} className="ml-2" />
                </Button>
              </div>
              <LessonListEdit lessons={lessons} />
            </div>

            <input {...getInputProps(fields.id, { type: 'hidden' })} />

            <div className="flex w-full flex-col gap-1 rounded">
              <Field
                className="max-w-[100px]"
                labelProps={{ children: 'Order' }}
                inputProps={{
                  ...getInputProps(fields.order, {
                    type: 'number',
                  }),
                }}
                errors={fields.order.errors}
              />
              <RichTextField
                labelProps={{ children: 'Content' }}
                meta={fields.content}
                errors={fields.content.errors}
              />
              <RichTextField
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
