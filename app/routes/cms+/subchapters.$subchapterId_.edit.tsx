import {
  type FieldMetadata,
  FormProvider,
  getFieldsetProps,
  getFormProps,
  getInputProps,
  useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import {
  type ActionFunctionArgs,
  json,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData,
} from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { ErrorList, Field } from '#app/components/forms.js'
import { Button } from '#app/components/ui/button.js'
import { Icon } from '#app/components/ui/icon.js'
import { StatusButton } from '#app/components/ui/status-button.js'
import { prisma } from '#app/utils/db.server.js'
import { MAX_UPLOAD_SIZE } from '#app/utils/image.js'
import { getLessonImgSrc, useIsPending } from '#app/utils/misc.js'
import { redirectWithToast } from '#app/utils/toast.server.js'
import {
  type Lesson,
  loader as subChapterLoader,
  SubchapterEditorSchema,
} from './subchapters.$subchapterId'

function flattenLessons(lessons: Lesson[]): Lesson[] {
  return lessons.flatMap((l) => [
    l,
    ...(l.childLessons && l.childLessons.length
      ? flattenLessons(l.childLessons)
      : []),
  ])
}

export const loader = subChapterLoader

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
    name,
    order,
    width,
    height,
    displayId,
    newLessons = [],
    lessonUpdates = [],
  } = submission.value

  const { id: updatedId } = await prisma.subChapter.upsert({
    select: { id: true },
    where: { id: id ?? '__new_subchapter__' },
    create: {
      name,
      order,
      width,
      height,
      displayId,
      lessons: {
        create: newLessons,
      },
    },
    update: {
      name,
      order,
      width,
      height,
      displayId,
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

  return redirectWithToast(`/cms/subchapters/${updatedId}`, {
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
      return result
    },
    defaultValue: {
      ...subchapter,
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
              <LessonList lessons={lessons} />
            </div>
            <ErrorList id={form.id} errors={form.errors} />
          </Form>
        </FormProvider>
      </div>
    </div>
  )
}

function LessonList({ lessons }: { lessons: FieldMetadata<Lesson>[] }) {
  return lessons.map((s) => {
    const lesson = s.getFieldset()
    const image = lesson.image.getFieldset()

    const childLessons = lesson.childLessons
    return (
      <fieldset key={s.key} {...getFieldsetProps(s)}>
        <div>
          <div className="flex gap-4">
            {image.id.value ? (
              <img
                className={'h-20 w-20 rounded-md object-cover'}
                src={getLessonImgSrc(image.id.value, true)}
              />
            ) : null}
            <input {...getInputProps(lesson.id, { type: 'hidden' })} />
            {lesson.id.value ? (
              <Field
                className="w-16"
                labelProps={{ children: 'ID' }}
                inputProps={{ value: lesson.id.value }}
                errors={lesson.name.errors}
              />
            ) : null}
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
