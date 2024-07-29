import { type Editor, useEditor } from '@tiptap/react'

import { useEffect } from 'react'
import ExtensionKit from '../../extensions/extension-kit'
import { useSidebar } from './useSidebar'

declare global {
  interface Window {
    editor: Editor | null
  }
}

const extensions = ExtensionKit()

export const useBlockEditor = () => {
  const leftSidebar = useSidebar()

  const editor = useEditor(
    {
      autofocus: true,
      extensions: [...extensions],
      editorProps: {
        attributes: {
          autocomplete: 'off',
          autocorrect: 'off',
          autocapitalize: 'off',
          class: 'min-h-full',
        },
      },
    },
    [],
  )

  const characterCount = editor?.storage.characterCount || {
    characters: () => 0,
    words: () => 0,
  }

  useEffect(() => {
    if (!editor) return
    window.editor = editor
  }, [editor])

  return { editor, characterCount, leftSidebar }
}
