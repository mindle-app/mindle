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
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Form, Link, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { Field } from '#app/components/forms.js'
import { Button } from '#app/components/ui/button.js'
import { prisma } from '#app/utils/db.server.js'
import {
  ImageChooser,
  type ImageFieldset,
  ImageFieldsetSchema,
} from '#app/utils/image.js'
import { getLessonImgSrc } from '#app/utils/misc.js'
const BaseLessonSchema = z.object({
  name: z.string().min(1).max(255),
  order: z.number().int().min(0),
  id: z.number().optional(),
  image: ImageFieldsetSchema.optional().nullable(),
  displayId: z.string().max(5).min(1),
  width: z.number().int().min(1).optional(),
  height: z.number().int().min(1).optional(),
  parentLessonId: z.number().optional().nullable(),
})
type BaseLesson = z.infer<typeof BaseLessonSchema>

type Lesson = BaseLesson & {
  childLessons?: Lesson[]
}

const LessonFieldsetSchema: z.ZodType<Lesson> = BaseLessonSchema.extend({
  childLessons: z.lazy(() => LessonFieldsetSchema.array().optional()),
})

type LessonFieldset = z.infer<typeof LessonFieldsetSchema>

const SubchapterEditorSchema = z.object({
  name: z.string().min(1),
  displayId: z.string().max(4),
  id: z.number(),
  order: z.number().int().min(0).optional(),
  width: z.number().int().min(1).optional(),
  height: z.number().int().min(1).optional(),
  lessons: z.array(LessonFieldsetSchema).optional(),
})

export async function loader({ params }: LoaderFunctionArgs) {
  const subchapter = await prisma.subChapter.findUnique({
    where: { id: Number(params.subchapterId) },
    include: {
      image: true,
      lessons: {
        include: { image: true },
        orderBy: { order: 'asc' },
      },
    },
  })

  invariantResponse(subchapter, 'Subject not found', { status: 404 })
  const lessons = LessonFieldsetSchema.array().parse(
    subchapter.lessons.map((l) => ({ ...l, childLessons: [] })),
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
  return json({ subchapter: { ...subchapter, lessons: root ? [root] : [] } })
}

export default function SubchapterCMS() {
  const { subchapter } = useLoaderData<typeof loader>()

  const [form, fields] = useForm({
    id: 'subchapter-editor',
    constraint: getZodConstraint(SubchapterEditorSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: SubchapterEditorSchema })
    },
    // @ts-expect-error this happens since we parse before returning the data here
    defaultValue: {
      ...subchapter,
    },
    shouldRevalidate: 'onBlur',
  })

  const lessons = fields.lessons.getFieldList()

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
              <p className="text-2xl">Subchapter</p>
              <Link to={'edit'}>
                <Button variant={'link'}>Edit</Button>
              </Link>
            </div>

            <div className="flex w-full flex-wrap gap-8">
              <Field
                labelProps={{ children: 'Name' }}
                inputProps={{
                  autoFocus: true,
                  disabled: true,

                  ...getInputProps(fields.name, { type: 'text' }),
                }}
                errors={fields.name.errors}
              />
              <Field
                labelProps={{ children: 'Order' }}
                inputProps={{
                  disabled: true,

                  ...getInputProps(fields.order, { type: 'number' }),
                }}
                errors={fields.order.errors}
              />
              <Field
                labelProps={{ children: 'Width' }}
                inputProps={{
                  disabled: true,

                  ...getInputProps(fields.width, { type: 'number' }),
                }}
                errors={fields.width.errors}
              />
              <Field
                labelProps={{ children: 'Height' }}
                inputProps={{
                  disabled: true,

                  ...getInputProps(fields.height, { type: 'number' }),
                }}
                errors={fields.height.errors}
              />
              <Field
                labelProps={{ children: 'DisplayId' }}
                inputProps={{
                  disabled: true,

                  ...getInputProps(fields.displayId, { type: 'text' }),
                }}
                errors={fields.displayId.errors}
              />
            </div>
            <div className="x flex w-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden px-4 pb-4">
              <div className="flex items-center gap-2">
                <p className="text-2xl">Lessons</p>
              </div>
              <LessonList lessons={lessons as FieldMetadata<Lesson>[]} />
            </div>
          </Form>
        </FormProvider>
      </div>
    </div>
  )
}

function LessonList({ lessons }: { lessons: FieldMetadata<Lesson>[] }) {
  return lessons.map((s) => {
    const lesson = s.getFieldset()
    const childLessons = lesson.childLessons
    return (
      <fieldset key={s.id} {...getFieldsetProps(s)}>
        <div>
          <div className="flex gap-4">
            <ImageChooser
              getImgSrc={getLessonImgSrc}
              preview
              meta={lesson.image as FieldMetadata<ImageFieldset>}
            />
            <input {...getInputProps(lesson.id, { type: 'hidden' })} />
            <Field
              className="w-16"
              labelProps={{ children: 'ID' }}
              inputProps={{ value: lesson.id.value, disabled: true }}
              errors={lesson.name.errors}
            />
            <Field
              labelProps={{ children: 'ParentLessonId' }}
              inputProps={{
                disabled: true,

                ...getInputProps(lesson.parentLessonId, { type: 'text' }),
              }}
              errors={lesson.parentLessonId.errors}
            />
            <Field
              labelProps={{ children: 'Name' }}
              inputProps={{
                ...getInputProps(lesson.name, { type: 'text' }),
                disabled: true,
              }}
              errors={lesson.name.errors}
            />
            <Field
              labelProps={{ children: 'Order' }}
              inputProps={{
                ...getInputProps(lesson.order, { type: 'number' }),
                disabled: true,
              }}
              errors={lesson.order.errors}
            />
            <Field
              labelProps={{ children: 'Width' }}
              inputProps={{
                disabled: true,

                ...getInputProps(lesson.width, { type: 'number' }),
              }}
              errors={lesson.width.errors}
            />
            <Field
              labelProps={{ children: 'Height' }}
              inputProps={{
                disabled: true,

                ...getInputProps(lesson.height, { type: 'number' }),
              }}
              errors={lesson.height.errors}
            />
            <Field
              labelProps={{ children: 'DisplayId' }}
              inputProps={{
                disabled: true,

                ...getInputProps(lesson.displayId, { type: 'text' }),
              }}
              errors={lesson.displayId.errors}
            />
          </div>
          {lesson.childLessons.getFieldList().length ? (
            <div className="pl-12">
              <p className="pb-4 text-xl">Children</p>
              <LessonList lessons={childLessons.getFieldList()} />
            </div>
          ) : null}
        </div>
      </fieldset>
    )
  })
}
