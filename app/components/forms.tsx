import { type FieldMetadata, useInputControl } from '@conform-to/react'
import {
  type SelectItemProps,
  type SelectProps,
  type SelectTriggerProps,
  type SelectValueProps,
} from '@radix-ui/react-select'
import { REGEXP_ONLY_DIGITS_AND_CHARS, type OTPInputProps } from 'input-otp'
import React, { useId } from 'react'
import { cn } from '#app/utils/misc.js'
import { BlockEditor } from './richtext-editor/components/block-editor/BlockEditor.tsx'
import { Button } from './ui/button.tsx'
import { Checkbox, type CheckboxProps } from './ui/checkbox.tsx'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command.tsx'
import { Icon } from './ui/icon.tsx'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from './ui/input-otp.tsx'
import { Input } from './ui/input.tsx'
import { Label } from './ui/label.tsx'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select.tsx'
import { Textarea } from './ui/textarea.tsx'
import { UseEditorOptions } from '@tiptap/react'

export type ListOfErrors = Array<string | null | undefined> | null | undefined

export function ErrorList({
  id,
  errors,
}: {
  errors?: ListOfErrors
  id?: string
}) {
  const errorsToRender = errors?.filter(Boolean)
  if (!errorsToRender?.length) return null
  return (
    <ul id={id} className="flex flex-col gap-1">
      {errorsToRender.map((e) => (
        <li key={e} className="text-[10px] text-destructive">
          {e}
        </li>
      ))}
    </ul>
  )
}

export function Field({
  labelProps,
  inputProps,
  errors,
  className,
}: {
  labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
  inputProps: React.InputHTMLAttributes<HTMLInputElement>
  errors?: ListOfErrors
  className?: string
}) {
  const fallbackId = useId()
  const id = inputProps.id ?? fallbackId
  const errorId = errors?.length ? `${id}-error` : undefined
  return (
    <div className={className}>
      <Label htmlFor={id} {...labelProps} />
      <Input
        id={id}
        aria-invalid={errorId ? true : undefined}
        aria-describedby={errorId}
        {...inputProps}
      />
      <div className="min-h-[32px] px-4 pb-3 pt-1">
        {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
      </div>
    </div>
  )
}

export function OTPField({
  labelProps,
  inputProps,
  errors,
  className,
}: {
  labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
  inputProps: Partial<OTPInputProps & { render: never }>
  errors?: ListOfErrors
  className?: string
}) {
  const fallbackId = useId()
  const id = inputProps.id ?? fallbackId
  const errorId = errors?.length ? `${id}-error` : undefined
  return (
    <div className={className}>
      <Label htmlFor={id} {...labelProps} />
      <InputOTP
        pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
        maxLength={6}
        id={id}
        aria-invalid={errorId ? true : undefined}
        aria-describedby={errorId}
        {...inputProps}
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <div className="min-h-[32px] px-4 pb-3 pt-1">
        {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
      </div>
    </div>
  )
}

export function TextareaField({
  labelProps,
  textareaProps,
  errors,
  className,
}: {
  labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
  textareaProps: React.TextareaHTMLAttributes<HTMLTextAreaElement>
  errors?: ListOfErrors
  className?: string
}) {
  const fallbackId = useId()
  const id = textareaProps.id ?? textareaProps.name ?? fallbackId
  const errorId = errors?.length ? `${id}-error` : undefined
  return (
    <div className={className}>
      <Label htmlFor={id} {...labelProps} />
      <Textarea
        id={id}
        aria-invalid={errorId ? true : undefined}
        aria-describedby={errorId}
        {...textareaProps}
      />
      <div className="min-h-[32px] px-4 pb-3 pt-1">
        {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
      </div>
    </div>
  )
}

export function CheckboxField({
  labelProps,
  buttonProps,
  errors,
  className,
}: {
  labelProps: JSX.IntrinsicElements['label']
  buttonProps: CheckboxProps & {
    name: string
    form: string
    value?: string
  }
  errors?: ListOfErrors
  className?: string
}) {
  const { key, defaultChecked, ...checkboxProps } = buttonProps
  const fallbackId = useId()
  const checkedValue = buttonProps.value ?? 'on'
  const input = useInputControl({
    key,
    name: buttonProps.name,
    formId: buttonProps.form,
    initialValue: defaultChecked ? checkedValue : undefined,
  })
  const id = buttonProps.id ?? fallbackId
  const errorId = errors?.length ? `${id}-error` : undefined

  return (
    <div className={className}>
      <div className="flex gap-2">
        <Checkbox
          {...checkboxProps}
          id={id}
          aria-invalid={errorId ? true : undefined}
          aria-describedby={errorId}
          checked={input.value === checkedValue}
          onCheckedChange={(state) => {
            input.change(state.valueOf() ? checkedValue : '')
            buttonProps.onCheckedChange?.(state)
          }}
          onFocus={(event) => {
            input.focus()
            buttonProps.onFocus?.(event)
          }}
          onBlur={(event) => {
            input.blur()
            buttonProps.onBlur?.(event)
          }}
          type="button"
        />
        <label
          htmlFor={id}
          {...labelProps}
          className="self-center text-body-xs text-muted-foreground"
        />
      </div>
      <div className="px-4 pb-3 pt-1">
        {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
      </div>
    </div>
  )
}

export type SelectOption = {
  value: string | number
  label: string
}

type SelectFieldProps<V> = {
  meta: FieldMetadata<V>
  selectProps?: Omit<SelectProps, 'value' | 'name'> & { id?: string }
  options: SelectOption[]
  selectTriggerProps?: Omit<SelectTriggerProps, 'children'>
  selectValueProps?: SelectValueProps
  selectItemProps?: Omit<SelectItemProps, 'value' | 'children'>
  labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
  errors?: ListOfErrors
}

export function SelectField<V>({
  meta,
  options,
  labelProps,
  selectProps = {},
  selectItemProps = {},
  selectTriggerProps = {},
  selectValueProps = {},
  errors,
}: SelectFieldProps<V>) {
  const control = useInputControl(meta as FieldMetadata<string>)
  const fallbackId = useId()
  const id = meta.name ?? fallbackId
  const errorId = meta.errors?.length ? `${id}-error` : undefined

  return (
    <div>
      <Label htmlFor={meta.name} {...labelProps} />
      <Select
        {...selectProps}
        name={meta.name}
        value={control.value}
        onValueChange={(value) => {
          control.change(value)
        }}
        onOpenChange={(open) => {
          if (!open) {
            control.blur()
          }
        }}
        aria-invalid={errorId ? true : undefined}
        aria-describedby={errorId}
      >
        <SelectTrigger {...selectTriggerProps} id={meta.name}>
          <SelectValue {...selectValueProps} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem
              key={o.value}
              value={String(o.value)}
              {...selectItemProps}
            >
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="px-4 pb-3 pt-1">
        {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
      </div>
    </div>
  )
}

type ComboboxOption = {
  value: string
  label: string
}

type ComboboxProps<V> = {
  meta: FieldMetadata<V>
  options: ComboboxOption[]
  selectValueProps?: SelectValueProps
  labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
  errors?: ListOfErrors
  renderNoResults?: () => React.ReactNode
  searchPlaceholder?: string
}

export function ComboboxField<V>({
  meta,
  searchPlaceholder,
  options,
  renderNoResults,
  labelProps,
  errors,
}: ComboboxProps<V>) {
  const control = useInputControl(meta as FieldMetadata<string>)
  const fallbackId = useId()
  const id = meta.name ?? fallbackId
  const errorId = meta.errors?.length ? `${id}-error` : undefined
  return (
    <div>
      <Label htmlFor={meta.name} {...labelProps} />
      <Popover
        onOpenChange={(open) => {
          if (!open) {
            control.blur()
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            aria-invalid={errorId ? true : undefined}
            variant="outline"
            role="combobox"
            className={cn(
              'flex w-[200px] justify-between',
              !control.value && 'text-muted-foreground',
            )}
          >
            {control.value
              ? options.find((o) => o.value === control.value)?.label
              : 'Select author'}
            <Icon
              name={'chevrons-up-down'}
              className="ml-2 h-4 w-4 shrink-0 opacity-50"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder={searchPlaceholder ?? 'Search...'} />
            <CommandList>
              <CommandEmpty>
                {typeof renderNoResults === 'function'
                  ? renderNoResults()
                  : ' No results'}
              </CommandEmpty>
              <CommandGroup>
                {options.map((a) => (
                  <CommandItem
                    disabled={false}
                    value={a.value}
                    key={a.value}
                    onSelect={() => {
                      control.change(a.value)
                    }}
                  >
                    <Icon
                      name={'check'}
                      className={cn(
                        'mr-2 h-4 w-4',
                        a.value === control.value ? 'opacity-100' : 'opacity-0',
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
      <div className="px-4 pb-3 pt-1">
        {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
      </div>
    </div>
  )
}

type RichTextFieldProps = {
  meta: FieldMetadata<string>
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement>
  errors?: ListOfErrors
  editorProps?: UseEditorOptions & { className?: string }
}
export function RichTextField({
  meta,
  labelProps = {},
  errors,
  editorProps = {},
}: RichTextFieldProps) {
  const control = useInputControl(meta as FieldMetadata<string>)
  const fallbackId = useId()
  const id = meta.name ?? fallbackId
  const errorId = meta.errors?.length ? `${id}-error` : undefined
  return (
    <div>
      <Label htmlFor={meta.name} {...labelProps} />
      <BlockEditor
        onFocus={control.focus}
        onBlur={control.blur}
        content={control.value}
        onUpdate={({ editor }) => control.change(editor.getHTML())}
        {...editorProps}
      />
      <div className="px-4 pb-3 pt-1">
        {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
      </div>
    </div>
  )
}
