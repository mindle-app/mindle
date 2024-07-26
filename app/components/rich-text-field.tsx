import Color from '@tiptap/extension-color'
import { type Editor, EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextStyle from '@tiptap/extension-text-style'

import { Bold, Heading2, Italic, List, ListOrdered } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '#app/utils/misc.js'
import { Toggle } from './ui/toggle'

export function RichToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null
  return (
    <div className="flex gap-1 rounded border border-input bg-card">
      <Toggle
        size={'sm'}
        pressed={editor.isActive('heading')}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 2 })
        }
      >
        <Heading2 className="h-4 w-4" />
      </Toggle>

      <Toggle
        size={'sm'}
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold()}
      >
        <Bold className="h-4 w-4" />
      </Toggle>

      <Toggle
        size={'sm'}
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic()}
      >
        <Italic className="h-4 w-4" />
      </Toggle>

      <Toggle
        size={'sm'}
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList()}
      >
        <List className="h-4 w-4" />
      </Toggle>

      <Toggle
        size={'sm'}
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList()}
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
    </div>
  )
}

const baseClass =
  'flex min-h-[80px] w-full flex-col rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-[invalid]:border-input-invalid'

export function RichTextField({
  value,
  onChange,
  className,
  disabled = false,
}: React.InputHTMLAttributes<HTMLTextAreaElement> & { value: string }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const content = value.replaceAll('/\n', '<br>')
  const editor = useEditor({
    extensions: [StarterKit, Color, TextStyle],
    content,
    editable: !disabled,
    editorProps: {
      attributes: {
        class: cn(baseClass, className),
      },
    },
    onUpdate({ editor }) {
      //@ts-expect-error Hack to make this behave like a normal textarea field
      onChange({ target: { value: editor.getHTML() } })
    },
  })

  if (!editor || !mounted) {
    return (
      <div
        className={cn(baseClass)}
        dangerouslySetInnerHTML={{
          __html: value ?? '',
        }}
      />
    )
  }

  return (
    <div
      className={cn('flex flex-col gap-2', {
        'disabled:cursor-not-allowed disabled:opacity-50': disabled,
      })}
    >
      {!disabled ? <RichToolbar editor={editor} /> : null}
      <EditorContent editor={editor} />
    </div>
  )
}
