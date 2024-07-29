import { type LinksFunction } from '@remix-run/node'
import editorStyleSheetUrl from '#app/components/richtext-editor/styles/index.css?url'
import { PageEditor } from '../components/richtext-editor/components/block-editor'

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: editorStyleSheetUrl }].filter(Boolean)
}

export default function Editor() {
  return <PageEditor />
}
