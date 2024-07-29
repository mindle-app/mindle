import { type LinksFunction } from '@remix-run/node'
import editorStyleSheetUrl from '#app/components/richtext-editor/styles/index.css?url'
import { BlockEditor } from '../components/richtext-editor/components/block-editor'

export const links: LinksFunction = () => {
  return [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicons/favicon.svg' },
    { rel: 'stylesheet', href: editorStyleSheetUrl },
  ].filter(Boolean)
}

export default function Editor() {
  return <BlockEditor />
}
