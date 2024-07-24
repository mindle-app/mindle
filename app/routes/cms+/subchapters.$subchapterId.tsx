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
  type ImageFieldset,
  ImageFieldsetSchema,
  MAX_UPLOAD_SIZE,
} from '#app/utils/image.js'
import { getLessonImgSrc } from '#app/utils/misc.js'
import { redirectWithToast } from '#app/utils/toast.server.js'

const BaseLessonSchema = z.object({
  name: z.string().min(1).max(255),
  order: z.number().int().min(0),
  id: z.number().optional(),
  image: ImageFieldsetSchema.optional(),
  displayId: z.string().max(2),
  width: z.number().int().min(1).optional(),
  height: z.number().int().min(1).optional(),
  parentLessonId: z.number().optional().nullable(),
})

type Lesson = z.infer<typeof BaseLessonSchema> & {
  childLessons: Lesson[]
}

const LessonFieldsetSchema: z.ZodType<Lesson> = BaseLessonSchema.extend({
  childLessons: z.lazy(() => LessonFieldsetSchema.array()),
})

type LessonFieldset = z.infer<typeof LessonFieldsetSchema>

const SubchapterEditorSchema = z.object({
  name: z.string().min(1),
  displayId: z.string().max(2),
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
        where: { parentLessonId: null },
        include: {
          image: true,
          childLessons: {
            include: {
              childLessons: { include: { childLessons: true, image: true } },
              image: true,
            },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  })
  invariantResponse(subchapter, 'Subject not found', { status: 404 })
  return json({ subchapter })
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
      return {
        ...data,
        lessonUpdates: (data.lessons ?? [])
          .filter((l) => l.id)
          .map((l) => ({
            name: l.name,
            order: l.order,
            id: l.id,
          })),
        newLessons: (data.lessons ?? [])
          .filter((l) => !l.id)
          .map((l) => ({ name: l.name, order: l.order })),
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

  const { id, name, lessonUpdates, newLessons } = submission.value

  const updatedSubchapter = await prisma.subChapter.update({
    include: { image: true, lessons: true },
    where: { id },
    data: {
      name,
      lessons: {
        deleteMany: {
          id: {
            notIn: lessonUpdates.map((l) => l.id).filter(Boolean),
          },
        },
        updateMany: lessonUpdates.map((s) => ({
          where: { id: s.id },
          data: { name: s.name, order: s.order },
        })),
        create: newLessons,
      },
    },
  })

  return redirectWithToast(`/cms/subchapters/${updatedSubchapter.id}`, {
    type: 'success',
    title: 'Success',
    description: 'The subchapter has been updated successfully',
  })
}

export default function SubchapterCMS() {
  const actionData = useActionData<typeof action>()
  const { subchapter } = useLoaderData<typeof loader>()

  const [form, fields] = useForm({
    id: 'subchapter-editor',
    constraint: getZodConstraint(SubchapterEditorSchema),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: SubchapterEditorSchema })
    },
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
              <LessonList lessons={lessons} />
            </div>
          </Form>
        </FormProvider>
      </div>
    </div>
  )
}

function LessonList({ lessons }: { lessons: FieldMetadata<LessonFieldset>[] }) {
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
