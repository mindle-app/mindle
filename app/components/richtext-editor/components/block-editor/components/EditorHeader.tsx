import { EditorInfo } from './EditorInfo'

export type EditorHeaderProps = {
  characters: number
  words: number
}

export const EditorHeader = ({ characters, words }: EditorHeaderProps) => {
  return (
    <div className="flex flex-none flex-row items-center justify-between border-b bg-card py-2 pl-6 pr-3">
      <div className="flex flex-row items-center gap-x-1.5"></div>
      <EditorInfo characters={characters} words={words} />
    </div>
  )
}
