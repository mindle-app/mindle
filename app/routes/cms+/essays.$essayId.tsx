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
import { json, type LoaderFunctionArgs } from '@remix-run/node'
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

const EssaySchema = z.object({
  title: z.string().min(1),
  authorId: z.string().optional(),
})

export async function loader({ params }: LoaderFunctionArgs) {
  const essay = prisma.essay.findFirst({
    where: { id: String(params.essayId) },
  })

  const a = prisma.author.findMany({
    select: { id: true, name: true },
  })
  const sm = prisma.studyMaterial.findMany({
    select: { id: true, title: true },
  })
  const response = await promiseHash({
    authors: a,
    essay,
    studyMaterials: sm,
  })
  if (params.essayId !== 'create')
    invariantResponse(response.essay, 'Essay not found', {
      status: 404,
    })
  return json(response)
}

export default function EssayCMS() {
  const { essay, authors, studyMaterials } = useLoaderData<typeof loader>()
  const [form, fields] = useForm({
    id: 'essay-editor',
    constraint: getZodConstraint(EssaySchema),
    defaultValue: essay,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: EssaySchema })
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
              <p className="text-2xl">Essay</p>
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
