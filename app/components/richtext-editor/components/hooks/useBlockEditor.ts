import { type Editor, useEditor, type UseEditorOptions } from '@tiptap/react'

import { ExtensionKit } from '../../extensions/ExtensionKit'
import { useSidebar } from './useSidebar'

declare global {
  interface Window {
    editor: Editor | null
  }
}

const extensions = ExtensionKit()

export const useBlockEditor = (options: UseEditorOptions = {}) => {
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
      ...options,
    },
    [],
  )

  const characterCount = editor?.storage.characterCount || {
    characters: () => 0,
    words: () => 0,
  }

  return { editor, characterCount, leftSidebar }
}
