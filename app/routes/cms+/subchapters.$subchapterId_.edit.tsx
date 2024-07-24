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
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { Field } from '#app/components/forms.js'
import { Button } from '#app/components/ui/button.js'
import { Icon } from '#app/components/ui/icon.js'
import { StatusButton } from '#app/components/ui/status-button.js'
import { prisma } from '#app/utils/db.server.js'
import {
  ImageChooser,
  type ImageFieldset,
  ImageFieldsetSchema,
  imageHasFile,
  imageHasId,
  MAX_UPLOAD_SIZE,
} from '#app/utils/image.js'
import { getLessonImgSrc, useIsPending } from '#app/utils/misc.js'
import { redirectWithToast } from '#app/utils/toast.server.js'

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

function flattenLessons(lessons: Lesson[]): Lesson[] {
  return lessons.flatMap((l) => [
    l,
    ...(l.childLessons && l.childLessons.length
      ? flattenLessons(l.childLessons)
      : []),
  ])
}
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
      lessons: {
        include: { image: { select: { altText: true, id: true } } },
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

export async function action({ request }: ActionFunctionArgs) {
  const formData = await parseMultipartFormData(
    request,
    createMemoryUploadHandler({ maxPartSize: MAX_UPLOAD_SIZE }),
  )

  const submission = await parseWithZod(formData, {
    schema: SubchapterEditorSchema.superRefine(async (data, ctx) => {
      if (!data.id) return

      const subchapter = await prisma.subChapter.findUnique({
        select: { id: true },
        where: { id: data.id },
      })
      if (!subchapter) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Subchapter not found',
        })
      }
    }).transform(async ({ ...data }) => {
      const lessons = flattenLessons(data.lessons ?? [])
      return {
        ...data,
        lessonUpdates: await Promise.all(
          lessons
            .filter((l) => l.id)
            .map(async ({ childLessons, image, ...l }) => ({
              ...l,
              ...(image
                ? {
                    image:
                      image && imageHasFile(image)
                        ? imageHasId(image)
                          ? {
                              update: {
                                altText: image.altText,
                                id: image.id,
                                contentType: image.file.type,
                                blob: Buffer.from(
                                  await image.file.arrayBuffer(),
                                ),
                              },
                            }
                          : {
                              create: {
                                altText: image.altText,
                                contentType: image.file.type,
                                blob: Buffer.from(
                                  await image.file.arrayBuffer(),
                                ),
                              },
                            }
                        : undefined,
                  }
                : {}),
            })),
        ),
        newLessons: await Promise.all(
          lessons
            .filter((l) => !l.id)
            .map(async ({ childLessons, image, ...l }) => ({
              ...l,
              subchapterId: data.id,
              image:
                image && imageHasFile(image)
                  ? {
                      create: {
                        altText: image.altText,
                        contentType: image.file.type,
                        blob: Buffer.from(await image.file.arrayBuffer()),
                      },
                    }
                  : undefined,
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
    name,
    order,
    width,
    height,
    displayId,
    lessonUpdates = [],
    newLessons = [],
  } = submission.value

  await prisma.$transaction([
    ...lessonUpdates.map(({ id, ...l }) =>
      prisma.lesson.update({ where: { id }, data: l }),
    ),
    ...(newLessons.length
      ? [prisma.lesson.createMany({ data: newLessons })]
      : []),
    prisma.subChapter.update({
      where: { id },
      data: {
        name,
        order,
        width,
        height,
        displayId,
      },
    }),
  ])

  return redirectWithToast(`/cms/subchapters/${id}`, {
    type: 'success',
    title: 'Success',
    description: 'The subchapter has been updated successfully',
  })
}

export default function SubchapterCMS() {
  const actionData = useActionData<typeof action>()
  const { subchapter } = useLoaderData<typeof loader>()
  const isPending = useIsPending()

  const [form, fields] = useForm({
    id: 'subchapter-editor',

    constraint: getZodConstraint(SubchapterEditorSchema),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      const result = parseWithZod(formData, { schema: SubchapterEditorSchema })
      console.log(result)
      return result
    },
    defaultValue: {
      ...subchapter,
      // @ts-expect-error this happens since we parse before returning the data here
      lessons: subchapter.lessons,
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
              {subchapter.id ? (
                <Field
                  labelProps={{ children: 'ID' }}
                  inputProps={{
                    ...getInputProps(fields.id, { type: 'hidden' }),
                  }}
                  errors={fields.id.errors}
                />
              ) : null}
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
            </div>
            <div className="x flex w-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden px-4 pb-4">
              <div className="flex items-center gap-2">
                <p className="text-2xl">Lessons</p>
                <Button variant={'link'}>
                  Create
                  <Icon name={'plus'} className="ml-2" />
                </Button>
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
              meta={lesson.image as FieldMetadata<ImageFieldset>}
            />
            <input {...getInputProps(lesson.id, { type: 'hidden' })} />
            <Field
              className="w-16"
              labelProps={{ children: 'ID' }}
              inputProps={{ value: lesson.id.value }}
              errors={lesson.name.errors}
            />
            <Field
              labelProps={{ children: 'ParentLessonId' }}
              inputProps={{
                ...getInputProps(lesson.parentLessonId, { type: 'text' }),
              }}
              errors={lesson.parentLessonId.errors}
            />
            <Field
              labelProps={{ children: 'Name' }}
              inputProps={{
                ...getInputProps(lesson.name, { type: 'text' }),
              }}
              errors={lesson.name.errors}
            />
            <Field
              labelProps={{ children: 'Order' }}
              inputProps={{
                ...getInputProps(lesson.order, { type: 'number' }),
              }}
              errors={lesson.order.errors}
            />
            <Field
              labelProps={{ children: 'Width' }}
              inputProps={{
                ...getInputProps(lesson.width, { type: 'number' }),
              }}
              errors={lesson.width.errors}
            />
            <Field
              labelProps={{ children: 'Height' }}
              inputProps={{
                ...getInputProps(lesson.height, { type: 'number' }),
              }}
              errors={lesson.height.errors}
            />
            <Field
              labelProps={{ children: 'DisplayId' }}
              inputProps={{
                ...getInputProps(lesson.displayId, { type: 'text' }),
              }}
              errors={lesson.displayId.errors}
            />
          </div>
          {lesson.childLessons.getFieldList().length ? (
            <div className="pl-8">
              <p>Children</p>
              <LessonList lessons={childLessons.getFieldList()} />
            </div>
          ) : null}
        </div>
      </fieldset>
    )
  })
}
