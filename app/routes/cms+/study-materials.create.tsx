import {
  FormProvider,
  getFormProps,
  getInputProps,
  useForm,
  unstable_useControl as useControl,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs, json } from '@remix-run/node'
import { Form, Outlet } from '@remix-run/react'
import { z } from 'zod'
import { Field } from '#app/components/forms.js'
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
import { Label } from '#app/components/ui/label.js'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#app/components/ui/popover.js'
import { StatusButton } from '#app/components/ui/status-button.js'

import { prisma } from '#app/utils/db.server.js'
import { cn, useIsPending } from '#app/utils/misc.js'
import { StudyMaterialTypeSchema } from '#app/utils/study-material.js'
import { redirectWithToast } from '#app/utils/toast.server.js'

const StudyMaterialCreateSchema = z.object({
  title: z.string().min(1),
  authorId: z.string().optional(),
  subjectId: z.number().positive(),
  type: StudyMaterialTypeSchema,
})

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const submission = await parseWithZod(formData, {
    schema: StudyMaterialCreateSchema.superRefine(async (data, ctx) => {
      const studyMaterial = await prisma.studyMaterial.findFirst({
        select: { id: true },
        where: { title: data.title },
      })
      const subject = await prisma.subject.findFirst({
        select: { id: true },
        where: { id: data.subjectId },
      })
      if (!subject) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Subject not found',
        })
      }
      if (studyMaterial) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Study Material with this name already exists',
        })
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

  const { type, title, subjectId, authorId } = submission.value

  await prisma.studyMaterial.create({
    data: {
      type,
      title,
      subjectId,
      authorId,
    },
  })

  return redirectWithToast(`/cms/study-materials/`, {
    type: 'success',
    title: 'StudyMaterial created',
    description: 'The studyMaterial has been created successfully',
  })
}

const authors = [
  { label: 'Ion Creanga', value: '1' },
  { label: 'Mihai Eminescu', value: '2' },
  { label: 'Florin Piersic', value: '3' },
  { label: 'Liviu Rebreanu', value: '4' },
] as const

export default function StudyMaterialCMS() {
  const [form, fields] = useForm({
    id: 'study-material-editor',
    constraint: getZodConstraint(StudyMaterialCreateSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: StudyMaterialCreateSchema })
    },
    shouldRevalidate: 'onBlur',
  })
  const isPending = useIsPending()

  const authorControl = useControl(fields.authorId)

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
            {/*
					This hidden submit button is hpere to ensure that when the user hits
					"enter" on an input field, the primary form function is submitted
					rather than the first button in the form (which is delete/add image).
				      */}
            <button type="submit" className="hidden" />

            <div className="flex gap-4">
              <Field
                labelProps={{ children: 'Title' }}
                inputProps={{
                  autoFocus: true,
                  ...getInputProps(fields.title, { type: 'text' }),
                }}
                errors={fields.title.errors}
              />
              <input
                ref={authorControl.register}
                {...getInputProps(fields.authorId, { type: 'hidden' })}
              />
              <div className="jutify-center mt-[5px] flex flex-col gap-1">
                <Label>Author</Label>
                <Popover
                  onOpenChange={(open) => {
                    if (open) {
                      authorControl.focus()
                    } else {
                      authorControl.blur()
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        'w-[200px] justify-between',
                        !fields.authorId.value && 'text-muted-foreground',
                      )}
                    >
                      {authorControl.value
                        ? authors.find((a) => a.value === authorControl.value)
                            ?.label
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
                        <CommandEmpty>No author found.</CommandEmpty>
                        <CommandGroup>
                          {authors.map((a) => (
                            <CommandItem
                              disabled={false}
                              value={a.label}
                              key={a.value}
                              onSelect={() => {
                                authorControl.change(a.value)
                                console.log('Select')
                              }}
                              onClick={() => {
                                console.log('Clocked')
                                authorControl.change(a.value)
                              }}
                            >
                              <Icon
                                name={'check'}
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  a.value === authorControl.value
                                    ? 'opacity-100'
                                    : 'opacity-0',
                                )}
                              />
                              {a.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </Form>
        </FormProvider>
      </div>
      <Outlet />
    </div>
  )
}
