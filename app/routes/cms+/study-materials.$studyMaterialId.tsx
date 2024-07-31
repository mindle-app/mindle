import {
  type FieldMetadata,
  FormProvider,
  getFormProps,
  getInputProps,
  useForm,
  unstable_useControl as useControl,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import {
  type ActionFunctionArgs,
  json,
  type LoaderFunctionArgs,
} from '@remix-run/node'
import { Form, Outlet, useLoaderData } from '@remix-run/react'
import { promiseHash } from 'remix-utils/promise'
import { z } from 'zod'
import { Field, SelectField } from '#app/components/forms.js'
import { Button } from '#app/components/ui/button.js'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '#app/components/ui/command.js'
import { Icon } from '#app/components/ui/icon.js'
import { Input } from '#app/components/ui/input.js'
import { Label } from '#app/components/ui/label.js'
import { LinkButton } from '#app/components/ui/link-button.js'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#app/components/ui/popover.js'

import { prisma } from '#app/utils/db.server.js'
import { cn } from '#app/utils/misc.js'
import {
  StudyMaterialTypeSchema,
  StudyMaterialTypes,
} from '#app/utils/study-material.js'

const StudyMaterialCreateSchema = z.object({
  title: z.string().min(1),
  authorId: z.string().optional(),
  subjectId: z.number().positive(),
  type: StudyMaterialTypeSchema,
})

export async function loader({ params }: LoaderFunctionArgs) {
  const studyMaterial = prisma.studyMaterial.findFirst({
    where: { id: String(params.studyMaterialId) },
  })
  const s = prisma.subject.findMany({
    select: { id: true, name: true },
  })
  const a = prisma.author.findMany({
    select: { id: true, name: true },
  })
  const response = await promiseHash({
    authors: a,
    subjects: s,
    studyMaterial,
  })

  invariantResponse(response.studyMaterial, 'Study material not found', {
    status: 404,
  })
  return json(response)
}

export default function StudyMaterialCMS() {
  const { subjects, studyMaterial, authors } = useLoaderData<typeof loader>()
  const [form, fields] = useForm({
    id: 'study-material-editor',
    constraint: getZodConstraint(StudyMaterialCreateSchema),
    defaultValue: studyMaterial,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: StudyMaterialCreateSchema })
    },
    shouldRevalidate: 'onBlur',
  })

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
              <p className="text-2xl">StudyMaterial</p>
              <LinkButton to={'edit'}>Edit</LinkButton>
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
                labelProps={{ children: 'Author' }}
                options={authors.map((a) => ({
                  label: a.name,
                  value: a.id,
                }))}
                selectTriggerProps={{ className: 'w-[180px]', disabled: true }}
                selectValueProps={{ placeholder: 'Select author' }}
              />
              <SelectField
                errors={fields.type.errors}
                meta={fields.type}
                labelProps={{ children: 'Type' }}
                options={StudyMaterialTypes.map((st) => ({
                  label: st,
                  value: st,
                }))}
                selectTriggerProps={{ className: 'w-[180px]', disabled: true }}
                selectValueProps={{ placeholder: 'Select type' }}
              />
              <SelectField
                errors={fields.subjectId.errors}
                meta={fields.subjectId}
                labelProps={{ children: 'Subject' }}
                options={subjects.map((s) => ({
                  label: s.name,
                  value: s.id,
                }))}
                selectTriggerProps={{ className: 'w-[180px]', disabled: true }}
                selectValueProps={{ placeholder: 'Select type' }}
              />
            </div>
          </Form>
        </FormProvider>
      </div>
      <Outlet />
    </div>
  )
}

export function AuthorSelectField({
  meta,
  preview,
}: {
  meta: FieldMetadata<string | null>
  preview?: boolean
}) {
  const control = useControl(meta)

  const { authors } = useLoaderData<typeof loader>()

  return (
    <div className="jutify-center mt-[5px] flex flex-col gap-1">
      <Label>Author</Label>
      {preview ? (
        <Input disabled value={control.value ?? 'No author'} />
      ) : (
        <Popover
          onOpenChange={(open) => {
            if (open) {
              control.focus()
            } else {
              control.blur()
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              role="combobox"
              className={cn(
                'w-[200px] justify-between border',
                !control.value && 'text-muted-foreground',
              )}
            >
              {control.value
                ? authors.find((a) => a.id === control.value)?.name
                : 'Select author'}
              <Icon
                name={'chevrons-up-down'}
                className="ml-2 h-4 w-4 shrink-0 opacity-50"
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search author..." />
              <CommandList>
                <CommandEmpty>
                  No author found.
                  <LinkButton to={'/cms/author/create/edit'}>
                    <Icon name={'plus'} className="h-4 w-4" />
                    Create Author
                  </LinkButton>
                </CommandEmpty>
                <CommandGroup>
                  {authors.map((a) => (
                    <CommandItem
                      disabled={false}
                      value={a.id}
                      key={a.id}
                      onSelect={() => {
                        control.change(a.id)
                      }}
                      onClick={() => {
                        control.change(a.id)
                      }}
                    >
                      <Icon
                        name={'check'}
                        className={cn(
                          'mr-2 h-4 w-4',
                          a.id === control.value ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      {a.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}