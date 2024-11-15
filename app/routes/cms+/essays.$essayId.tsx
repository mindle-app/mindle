import {
  FormProvider,
  getFormProps,
  getInputProps,
  useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import {
  json,
  type LinksFunction,
  type LoaderFunctionArgs,
} from '@remix-run/node'
import { Form, Outlet, useLoaderData } from '@remix-run/react'
import { promiseHash } from 'remix-utils/promise'
import { z } from 'zod'
import { Field, RichTextField, SelectField } from '#app/components/forms.js'

import editorStyleSheetUrl from '#app/components/richtext-editor/styles/index.css?url'
import { Icon } from '#app/components/ui/icon.js'
import { Label } from '#app/components/ui/label.js'
import { LinkButton } from '#app/components/ui/link-button.js'

import { prisma } from '#app/utils/db.server.js'
import { stripHtmlTags } from '#app/utils/misc.js'

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: editorStyleSheetUrl }].filter(Boolean)
}

export const ParagraphSchema = z.object({
  id: z.string().min(1).optional(),
  content: z
    .string()
    .min(1)
    .refine((c) => !!stripHtmlTags(c).length, {
      message: 'This field is required',
    }),
  explanation: z.string().refine((c) => !!stripHtmlTags(c).length, {
    message: 'This field is required',
  }),
  order: z.number().positive(),
})

const EssaySchema = z.object({
  title: z.string().min(1),
  authorId: z.string().optional(),
  paragraphs: z.array(ParagraphSchema),
})

export async function loader({ params, request }: LoaderFunctionArgs) {
  const studyMaterialId = new URL(request.url).searchParams.get(
    'studyMaterialId',
  )

  const essay = prisma.essay.findFirst({
    where: { id: String(params.essayId) },
    include: { paragraphs: { orderBy: { order: 'asc' } } },
  })

  const a = prisma.author.findMany({
    select: { id: true, name: true },
  })
  const sm = prisma.studyMaterial.findMany({
    select: { id: true, title: true, subjectId: true },
  })
  const response = await promiseHash({
    authors: a,
    essay,
    studyMaterials: sm,
  })
  const studyMaterial = response.studyMaterials.find(
    (s) => s.id === response.essay?.studyMaterialId,
  )
  const subject = await prisma.subject.findFirst({
    where: { id: studyMaterial?.subjectId },
  })

  if (params.essayId !== 'create')
    invariantResponse(response.essay, 'Essay not found', {
      status: 404,
    })
  return json({
    ...response,
    studyMaterial,
    subject,
    essay: {
      ...response.essay,
      ...(studyMaterialId ? { studyMaterialId } : {}),
    },
  })
}

export default function EssayCMS() {
  const { essay, authors, studyMaterials, studyMaterial, subject } =
    useLoaderData<typeof loader>()
  const [form, fields] = useForm({
    id: 'essay-editor',
    constraint: getZodConstraint(EssaySchema),
    defaultValue: essay,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: EssaySchema })
    },
    shouldRevalidate: 'onBlur',
  })

  const paragraphs = fields.paragraphs.getFieldList()

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
              <p className="text-2xl">Essay</p>
              <LinkButton to={'edit'}>Edit</LinkButton>
              <LinkButton
                to={`/subjects/${subject?.type.toLowerCase()}/${subject?.slug}/${studyMaterial?.id}/${essay.id}`}
              >
                Preview
              </LinkButton>
            </div>

            <div className="flex gap-4">
              <Field
                labelProps={{ children: 'Title' }}
                inputProps={{
                  autoFocus: true,
                  disabled: true,
                  ...getInputProps(fields.title, {
                    type: 'text',
                  }),
                }}
                errors={fields.title.errors}
              />
              <SelectField
                errors={fields.authorId.errors}
                meta={fields.authorId}
                labelProps={{ children: 'Author (optional)' }}
                options={authors.map((a) => ({
                  label: a.name,
                  value: a.id,
                }))}
                selectTriggerProps={{ className: 'w-[180px]', disabled: true }}
                selectValueProps={{ placeholder: 'Select author' }}
              />
              <SelectField
                errors={fields.studyMaterialId.errors}
                meta={fields.studyMaterialId}
                labelProps={{ children: 'Study Material' }}
                options={studyMaterials.map((sm) => ({
                  label: sm.title,
                  value: sm.id,
                }))}
                selectTriggerProps={{ className: 'w-[180px]', disabled: true }}
                selectValueProps={{ placeholder: 'Select author' }}
              />
            </div>

            <div>
              <Label>Paragraphs</Label>

              <ul className="flex flex-col gap-4 pt-4">
                {paragraphs.map((p) => {
                  const paragraph = p.getFieldset()
                  return (
                    <li className="relative" key={p.key}>
                      <input
                        {...getInputProps(paragraph.id, { type: 'hidden' })}
                      />

                      <div className="flex w-full flex-col gap-1 rounded border pl-10">
                        <div className="flex w-full items-center justify-between">
                          <Field
                            className="max-w-[100px]"
                            labelProps={{ children: 'Order' }}
                            inputProps={{
                              disabled: true,
                              ...getInputProps(paragraph.order, {
                                type: 'number',
                              }),
                            }}
                            errors={paragraph.order.errors}
                          />
                          <LinkButton
                            to={`paragraph/${paragraph.id.value}/mindmap/edit`}
                          >
                            Mindmap
                            <Icon name={'arrow-right'} />
                          </LinkButton>
                        </div>
                        <RichTextField
                          disabled={true}
                          editorProps={{
                            editable: false,
                          }}
                          labelProps={{ children: 'Content' }}
                          meta={paragraph.content}
                          errors={paragraph.content.errors}
                        />
                        <RichTextField
                          disabled={true}
                          editorProps={{
                            className: 'w-full mt-4 ',
                          }}
                          labelProps={{ children: 'Explanation' }}
                          meta={paragraph.explanation}
                          errors={paragraph.explanation.errors}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </Form>
        </FormProvider>
      </div>
      <Outlet />
    </div>
  )
}
