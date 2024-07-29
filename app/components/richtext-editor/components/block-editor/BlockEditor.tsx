'use client'

import { EditorContent } from '@tiptap/react'
import { useRef } from 'react'

import { useBlockEditor } from '../hooks/useBlockEditor'
import { LinkMenu, ContentItemMenu, TextMenu } from '../menus'
import { EditorHeader } from './components/EditorHeader'

export const BlockEditor = () => {
  const menuContainerRef = useRef(null)

  const { editor, characterCount, leftSidebar } = useBlockEditor()

  if (!editor) {
    return null
  }

  return (
    <div className="flex h-full" ref={menuContainerRef}>
      <div className="relative flex h-full flex-1 flex-col overflow-hidden">
        <EditorHeader
          characters={characterCount.characters()}
          words={characterCount.words()}
          isSidebarOpen={leftSidebar.isOpen}
          toggleSidebar={leftSidebar.toggle}
        />
        <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
        <ContentItemMenu editor={editor} />
        <LinkMenu editor={editor} appendTo={menuContainerRef} />
        <TextMenu editor={editor} />
      </div>
    </div>
  )
}

export default BlockEditor
