import { EditorContent, type UseEditorOptions } from '@tiptap/react'
import { useRef } from 'react'

import { useBlockEditor } from '../hooks/useBlockEditor'
import { LinkMenu, ContentItemMenu, BubbleTextMenu } from '../menus'
import { EditorHeader } from './components/EditorHeader'

export const PageEditor = (props: UseEditorOptions) => {
  const menuContainerRef = useRef(null)

  const { editor, characterCount } = useBlockEditor(props)

  if (!editor) {
    return null
  }

  return (
    <div className="flex h-full bg-card" ref={menuContainerRef}>
      <div className="relative flex h-full flex-1 flex-col overflow-hidden">
        <EditorHeader
          characters={characterCount.characters()}
          words={characterCount.words()}
        />
        <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
        <ContentItemMenu editor={editor} />
        <LinkMenu editor={editor} appendTo={menuContainerRef} />
        <BubbleTextMenu editor={editor} />
      </div>
    </div>
  )
}

export function BlockEditor(props: UseEditorOptions) {
  const menuContainerRef = useRef(null)

  const { editor } = useBlockEditor(props)

  if (!editor) {
    return null
  }

  return (
    <div
      className="relative flex h-full w-full flex-col justify-center rounded-lg border bg-card p-2"
      ref={menuContainerRef}
    >
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
        <ContentItemMenu editor={editor} />
        <LinkMenu editor={editor} appendTo={menuContainerRef} />
        <BubbleTextMenu editor={editor} />
      </div>
    </div>
  )
}
