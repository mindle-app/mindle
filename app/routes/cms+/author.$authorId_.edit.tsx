import {
  type FieldMetadata,
  FormProvider,
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
import { floatingToolbarClassName } from '#app/components/floating-toolbar.js'
import { Field, TextareaField } from '#app/components/forms.js'
import { Button } from '#app/components/ui/button.js'
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
import { getAuthorImgSrc, useIsPending } from '#app/utils/misc.js'
import { redirectWithToast } from '#app/utils/toast.server.js'

const AuthorEditorSchema = z.object({
  name: z.string().min(1),
  image: ImageFieldsetSchema,
  bio: z.string().optional(),
  id: z.string().optional(),
})

type AuthorEdit = z.infer<typeof AuthorEditorSchema>

export async function loader({ params }: LoaderFunctionArgs) {
  let author: AuthorEdit | null = null
  if (params.authorId === 'create') {
    author = { name: '', image: {} }
  } else {
    const dbAuthor = await prisma.author.findUnique({
      where: { id: params.authorId },
      include: { image: { select: { id: true, altText: true } } },
    })
    author = dbAuthor as AuthorEdit
  }
  invariantResponse(author, 'Author not found', { status: 404 })
  return json({ author })
}

export async function action({ request, params }: ActionFunctionArgs) {
  const redirectTo =
    new URL(request.url).searchParams.get('redirectTo') ?? '/cms'
  const isCreate = params.authorId === 'create'
  const formData = await parseMultipartFormData(
    request,
    createMemoryUploadHandler({ maxPartSize: MAX_UPLOAD_SIZE }),
  )

  const submission = await parseWithZod(formData, {
    schema: AuthorEditorSchema.superRefine(async (data, ctx) => {
      if (!data.id) return

      const author = await prisma.author.findUnique({
        select: { id: true },
        where: { id: data.id },
      })
      if (!author) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Author not found',
        })
      }
    }).transform(async ({ image, ...data }) => {
      return {
        ...data,
        imageUpdate: imageHasId(image)
          ? imageHasFile(image)
            ? {
                id: image.id,
                altText: image.altText,
                contentType: image.file.type,
                blob: Buffer.from(await image.file.arrayBuffer()),
              }
            : {
                id: image.id,
                altText: image.altText,
              }
          : null,
        newImage:
          !imageHasId(image) && imageHasFile(image)
            ? {
                altText: image.altText,
                contentType: image.file.type,
                blob: Buffer.from(await image.file.arrayBuffer()),
              }
            : null,
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
    id: authorId,
    name,
    bio,
    imageUpdate = null,
    newImage = null,
  } = submission.value

  const updatedAuthor = await prisma.author.upsert({
    where: { id: authorId ?? '__new_author__' },
    create: {
      name,
      bio,
      image: {
        ...(newImage ? { create: newImage } : {}),
      },
    },
    update: {
      name,
      bio,
      image: {
        ...(imageUpdate ? { update: imageUpdate } : {}),
        ...(newImage ? { create: newImage } : {}),
      },
    },
  })

  return redirectWithToast(redirectTo, {
    type: 'success',
    title: `Author ${isCreate ? 'Created' : 'Updated'}`,
    description: 'The operation has been succesful',
  })
}

export default function AuthorCMS() {
  const actionData = useActionData<typeof action>()
  const { author } = useLoaderData<typeof loader>()
  const isPending = useIsPending()

  const [form, fields] = useForm({
    id: 'author-editor',
    constraint: getZodConstraint(AuthorEditorSchema),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: AuthorEditorSchema })
    },
    defaultValue: {
      ...author,
      image: author?.image ?? {},
    },
    shouldRevalidate: 'onBlur',
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
              <p className="text-2xl">Author</p>
            </div>
            {/*
					This hidden submit button is here to ensure that when the user hits
					"enter" on an input field, the primary form function is submitted
					rather than the first button in the form (which is delete/add image).
				      */}
            <button type="submit" className="hidden" />

            {author ? (
              <input type="hidden" name="id" value={author.id} />
            ) : null}
            <div className="flex w-full gap-8">
              <Field
                labelProps={{ children: 'Name' }}
                inputProps={{
                  autoFocus: true,
                  ...getInputProps(fields.name, { type: 'text' }),
                }}
                errors={fields.name.errors}
              />
              <TextareaField
                labelProps={{ children: 'Bio' }}
                textareaProps={{
                  autoFocus: true,
                  ...getInputProps(fields.bio, { type: 'text' }),
                }}
                errors={fields.bio.errors}
              />

              <ImageChooser
                meta={fields.image as FieldMetadata<ImageFieldset>}
                getImgSrc={getAuthorImgSrc}
              />
            </div>
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
              Save
            </StatusButton>
          </div>
        </FormProvider>
      </div>
    </div>
  )
}
