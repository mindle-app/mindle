import {
  type FieldMetadata,
  getFieldsetProps,
  getInputProps,
  getTextareaProps,
} from '@conform-to/react'
import { Label } from '@radix-ui/react-label'
import { useState } from 'react'
import { z } from 'zod'
import { ErrorList } from '#app/components/forms.js'
import { Icon } from '#app/components/ui/icon.js'
import { Textarea } from '#app/components/ui/textarea.js'
import { cn } from './misc'

export function imageHasFile(
  image: ImageFieldset,
): image is ImageFieldset & { file: NonNullable<ImageFieldset['file']> } {
  return Boolean(image.file?.size && image.file?.size > 0)
}

export function imageHasId(
  image: ImageFieldset,
): image is ImageFieldset & { id: NonNullable<ImageFieldset['id']> } {
  return image.id != null
}

export const MAX_UPLOAD_SIZE = 1024 * 1024 * 3 // 3MB

export const ImageFieldsetSchema = z.object({
  id: z.string().optional(),
  file: z
    .instanceof(File)
    .optional()
    .refine((file) => {
      return !file || file.size <= MAX_UPLOAD_SIZE
    }, 'File size must be less than 3MB'),
  altText: z.string().optional(),
})

export type ImageFieldset = z.infer<typeof ImageFieldsetSchema>

export function ImageChooser({
  meta,
  preview = false,
  getImgSrc,
}: {
  meta: FieldMetadata<ImageFieldset>
  getImgSrc: (imgValue: string) => string
  preview?: boolean
}) {
  const fields = meta.getFieldset()
  const existingImage = Boolean(fields.id.initialValue)
  const [previewImage, setPreviewImage] = useState<string | null>(
    fields.id.initialValue ? getImgSrc(fields.id.initialValue) : null,
  )
  const [altText, setAltText] = useState(fields.altText.initialValue ?? '')

  return (
    <fieldset {...getFieldsetProps(meta)}>
      <div className="flex gap-3">
        <div className="w-32">
          <div className="relative h-32 w-32">
            <label
              htmlFor={fields.file.id}
              className={cn('group absolute h-32 w-32 rounded-lg', {
                'bg-accent opacity-40 focus-within:opacity-100 hover:opacity-100':
                  !previewImage,
                'cursor-pointer focus-within:ring-2': !existingImage,
              })}
            >
              {previewImage ? (
                <div className="relative">
                  <img
                    src={previewImage}
                    alt={altText ?? ''}
                    className="h-32 w-32 rounded-lg border object-cover"
                  />
                  {existingImage ? null : (
                    <div className="pointer-events-none absolute -right-0.5 -top-0.5 rotate-12 rounded-sm bg-secondary px-2 py-1 text-xs text-secondary-foreground shadow-md">
                      new
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-muted-foreground text-4xl text-muted-foreground">
                  <Icon name="plus" />
                </div>
              )}
              {existingImage ? (
                <input {...getInputProps(fields.id, { type: 'hidden' })} />
              ) : null}
              <input
                disabled={preview}
                aria-label="Image"
                className="absolute left-0 top-0 z-0 h-32 w-32 cursor-pointer opacity-0"
                onChange={(event) => {
                  const file = event.target.files?.[0]

                  if (file) {
                    const reader = new FileReader()
                    reader.onloadend = () => {
                      setPreviewImage(reader.result as string)
                    }
                    reader.readAsDataURL(file)
                  } else {
                    setPreviewImage(null)
                  }
                }}
                accept="image/*"
                {...getInputProps(fields.file, { type: 'file' })}
              />
            </label>
          </div>
          <div className="min-h-[32px] px-4 pb-3 pt-1">
            <ErrorList id={fields.file.errorId} errors={fields.file.errors} />
          </div>
        </div>
        <div className="flex-1">
          <Label htmlFor={fields.altText.id}>Alt Text</Label>
          <Textarea
            disabled={preview}
            onChange={(e) => setAltText(e.currentTarget.value)}
            {...getTextareaProps(fields.altText)}
          />
          <div className="min-h-[32px] px-4 pb-3 pt-1">
            <ErrorList
              id={fields.altText.errorId}
              errors={fields.altText.errors}
            />
          </div>
        </div>
      </div>
      <div className="min-h-[32px] px-4 pb-3 pt-1">
        <ErrorList id={meta.errorId} errors={meta.errors} />
      </div>
    </fieldset>
  )
}
