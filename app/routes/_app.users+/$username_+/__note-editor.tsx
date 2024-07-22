import {
  FormProvider,
  getFormProps,
  getInputProps,
  getTextareaProps,
  useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { type Note, type NoteImage } from '@prisma/client'
import { type SerializeFrom } from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { floatingToolbarClassName } from '#app/components/floating-toolbar.tsx'
import { ErrorList, Field, TextareaField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { Label } from '#app/components/ui/label.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { ImageChooser, ImageFieldsetSchema } from '#app/utils/image.js'
import { getNoteImgSrc, useIsPending } from '#app/utils/misc.tsx'
import { type action } from './__note-editor.server'

const titleMinLength = 1
const titleMaxLength = 100
const contentMinLength = 1
const contentMaxLength = 10000

export const NoteEditorSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(titleMinLength).max(titleMaxLength),
  content: z.string().min(contentMinLength).max(contentMaxLength),
  images: z.array(ImageFieldsetSchema).max(5).optional(),
})

export function NoteEditor({
  note,
}: {
  note?: SerializeFrom<
    Pick<Note, 'id' | 'title' | 'content'> & {
      images: Array<Pick<NoteImage, 'id' | 'altText'>>
    }
  >
}) {
  const actionData = useActionData<typeof action>()
  const isPending = useIsPending()

  const [form, fields] = useForm({
    id: 'note-editor',
    constraint: getZodConstraint(NoteEditorSchema),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: NoteEditorSchema })
    },
    defaultValue: {
      ...note,
      images: note?.images ?? [{}],
    },
    shouldRevalidate: 'onBlur',
  })
  const imageList = fields.images.getFieldList()

  return (
    <div className="absolute inset-0">
      <FormProvider context={form.context}>
        <Form
          method="POST"
          className="flex h-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden px-10 pb-28 pt-12"
          {...getFormProps(form)}
          encType="multipart/form-data"
        >
          {/*
					This hidden submit button is here to ensure that when the user hits
					"enter" on an input field, the primary form function is submitted
					rather than the first button in the form (which is delete/add image).
				*/}
          <button type="submit" className="hidden" />
          {note ? <input type="hidden" name="id" value={note.id} /> : null}
          <div className="flex flex-col gap-1">
            <Field
              labelProps={{ children: 'Title' }}
              inputProps={{
                autoFocus: true,
                ...getInputProps(fields.title, { type: 'text' }),
              }}
              errors={fields.title.errors}
            />
            <TextareaField
              labelProps={{ children: 'Content' }}
              textareaProps={{
                ...getTextareaProps(fields.content),
              }}
              errors={fields.content.errors}
            />
            <div>
              <Label>Images</Label>
              <ul className="flex flex-col gap-4">
                {imageList.map((image, index) => {
                  console.log('image.key', image.key)
                  return (
                    <li
                      key={image.key}
                      className="relative border-b-2 border-muted-foreground"
                    >
                      <button
                        className="absolute right-0 top-0 text-foreground-destructive"
                        {...form.remove.getButtonProps({
                          name: fields.images.name,
                          index,
                        })}
                      >
                        <span aria-hidden>
                          <Icon name="cross-1" />
                        </span>{' '}
                        <span className="sr-only">
                          Remove image {index + 1}
                        </span>
                      </button>
                      <ImageChooser meta={image} getImgSrc={getNoteImgSrc} />
                    </li>
                  )
                })}
              </ul>
            </div>
            <Button
              className="mt-3"
              {...form.insert.getButtonProps({ name: fields.images.name })}
            >
              <span aria-hidden>
                <Icon name="plus">Image</Icon>
              </span>{' '}
              <span className="sr-only">Add image</span>
            </Button>
          </div>
          <ErrorList id={form.errorId} errors={form.errors} />
        </Form>
        <div className={floatingToolbarClassName}>
          <Button variant="destructive" {...form.reset.getButtonProps()}>
            Reset
          </Button>
          <StatusButton
            form={form.id}
            type="submit"
            disabled={isPending}
            status={isPending ? 'pending' : 'idle'}
          >
            Submit
          </StatusButton>
        </div>
      </FormProvider>
    </div>
  )
}

export function ErrorBoundary() {
  return (
    <GeneralErrorBoundary
      statusHandlers={{
        404: ({ params }) => (
          <p>No note with the id "{params.noteId}" exists</p>
        ),
      }}
    />
  )
}
