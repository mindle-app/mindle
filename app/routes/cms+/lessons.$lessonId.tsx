import {
  FormProvider,
  getFormProps,
  getInputProps,
  useForm,
} from '@conform-to/react'
import { parseWithZod, getZodConstraint } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import {
  json,
  type LinksFunction,
  type LoaderFunctionArgs,
} from '@remix-run/node'
import { Form, Link, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { Field } from '#app/components/forms.js'
import { RichTextField } from '#app/components/rich-text-field.js'
import editorStyleSheetUrl from '#app/components/richtext-editor/styles/index.css?url'
import { Button } from '#app/components/ui/button.js'
import { Label } from '#app/components/ui/label.js'
import { prisma } from '#app/utils/db.server.js'
import { ImageChooser, ImageFieldsetSchema } from '#app/utils/image.js'
import { getLessonImgSrc } from '#app/utils/misc.js'
import { BlockEditor } from '#app/components/richtext-editor/components/block-editor/BlockEditor.js'

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: editorStyleSheetUrl }].filter(Boolean)
}

export const LessonSchema = z.object({
  name: z.string().min(1).max(255),
  order: z.number().int().min(0),
  id: z.number().optional(),
  description: z.string().optional().nullable(),
  image: ImageFieldsetSchema,
  displayId: z.string().max(5).min(1).nullable(),
  width: z.number().int().min(1).optional(),
  height: z.number().int().min(1).optional(),
  parentLessonId: z.number().optional().nullable(),
})

export async function loader({ params }: LoaderFunctionArgs) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: Number(params.lessonId) },
    include: {
      image: { select: { id: true, altText: true } },
    },
  })

  invariantResponse(lesson, 'Lesson not found', { status: 404 })
  return json({ lesson })
}

export default function LessonCMS() {
  const { lesson } = useLoaderData<typeof loader>()

  const [form, fields] = useForm({
    id: 'lesson',
    constraint: getZodConstraint(LessonSchema),
    defaultValue: {
      ...lesson,
      image: lesson.image ? lesson.image : {},
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: LessonSchema })
    },
  })

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
              <p className="text-2xl">Lesson</p>
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
            <div>
              <ImageChooser
                preview
                meta={fields.image}
                getImgSrc={(imageId) => getLessonImgSrc(imageId, true)}
              />
            </div>
            <div>
              <Label>Description</Label>
              <BlockEditor
                editable={false}
                content={fields.description.value}
              />
            </div>
          </Form>
        </FormProvider>
      </div>
    </div>
  )
}
