import { invariantResponse } from '@epic-web/invariant'
import { ElementScrollRestoration } from '@epic-web/restore-scroll'
import { TabsList, Tabs, TabsContent, TabsTrigger } from '@radix-ui/react-tabs'
import { type LinksFunction, type LoaderFunctionArgs } from '@remix-run/node'
import { json, Link, useLoaderData, useSearchParams } from '@remix-run/react'
import { PreviewHTML } from '#app/components/richtext-editor/components/block-editor/BlockEditor.js'
import editorStyleSheetUrl from '#app/components/richtext-editor/styles/index.css?url'
import { LinkButton } from '#app/components/ui/link-button.js'
import { prisma } from '#app/utils/db.server.js'
import { cn } from '#app/utils/misc.js'

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: editorStyleSheetUrl }].filter(Boolean)
}
const tabs = ['explicatie', 'recall', 'mindmap', 'chat'] as const

export async function loader({ params }: LoaderFunctionArgs) {
  const essay = await prisma.essay.findUnique({
    where: { id: params.essayId },
    include: { paragraphs: { orderBy: { order: 'asc' } } },
  })
  const studyMaterial = await prisma.studyMaterial.findUnique({
    where: { id: params.studyMaterialId },
    select: { title: true, id: true },
  })

  invariantResponse(essay, 'Essay not found', { status: 404 })
  invariantResponse(studyMaterial, 'Study material not found', { status: 404 })

  const titleBits = {
    studyMaterialTitle: studyMaterial?.title,
    studyMaterialId: studyMaterial.id,
    essayTitle: essay.title,
    essayId: essay.id,
  }

  return json({ essay, titleBits })
}

function withParam(
  searchParams: URLSearchParams,
  key: string,
  value: string | null,
) {
  const newSearchParams = new URLSearchParams(searchParams)
  if (value === null) {
    newSearchParams.delete(key)
  } else {
    newSearchParams.set(key, value)
  }
  return newSearchParams
}

export default function StudyMaterial() {
  const { essay, titleBits } = useLoaderData<typeof loader>()
  const [searchParams] = useSearchParams()
  const activeTab = searchParams.get('preview') ?? tabs[0]
  const selectedParagraphId = searchParams.get('selectedParagraph')
  const explanation = selectedParagraphId
    ? essay.paragraphs.find((p) => p.id === selectedParagraphId)?.explanation
    : null

  console.log(explanation)

  return (
    <div className="flex h-full max-w-full flex-grow flex-col">
      <main className="flex flex-grow flex-col sm:grid sm:h-full sm:min-h-[800px] sm:grid-cols-1 sm:grid-rows-2 md:min-h-[unset] lg:grid-cols-2 lg:grid-rows-1">
        <div className="relative flex h-full flex-col sm:col-span-1 sm:row-span-1 sm:h-full lg:border-r">
          <h1 className="h-14 border-b pl-10 pr-5 text-sm font-medium leading-tight">
            <div className="flex h-14 flex-wrap items-center justify-between gap-x-2 py-2">
              <div className="flex items-center justify-start gap-x-2 uppercase">
                <Link
                  to={`/study/${titleBits.studyMaterialId}`}
                  className="hover:underline"
                >
                  {titleBits.studyMaterialTitle}
                </Link>
                {'/'}
                <Link to="." className="hover:underline">
                  {titleBits.essayTitle}
                </Link>
              </div>
            </div>
          </h1>
          <article
            id={essay.id}
            key={essay.id}
            className="shadow-on-scrollbox scrollbar-thin scrollbar-thumb-scrollbar h-full w-full max-w-none flex-1 scroll-pt-6 space-y-6 overflow-y-auto p-2 sm:p-10 sm:pt-8"
          >
            <div className="flex items-center gap-1">
              <h1 className="font-coHeadlineBold text-2xl">{essay.title}</h1>
              <LinkButton to={`/cms/essays/${essay.id}/edit`}>Edit</LinkButton>
            </div>
            {essay.paragraphs.map((p) => (
              <Link
                id={`${p.id}-paragraph`}
                preventScrollReset
                prefetch="intent"
                to={`?${withParam(searchParams, 'selectedParagraph', p.id)}`}
                key={p.id}
              >
                <div
                  dangerouslySetInnerHTML={{ __html: p.content }}
                  key={p.id}
                  // content={p.content}
                  className={cn(
                    'default-transition ProseMirror rounded border-none bg-background p-2 text-foreground transition-colors hover:bg-muted',
                    { 'bg-muted/50': selectedParagraphId === p.id },
                  )}
                />
              </Link>
            ))}
          </article>
          <ElementScrollRestoration
            elementQuery={`#${essay.id}`}
            key={`scroll-${essay.id}`}
          />

          <div className="flex h-16 justify-between border-b-4 border-t lg:border-b-0">
            <div>
              <div className="h-full"></div>
            </div>
          </div>
        </div>
        <Tabs
          className="relative flex h-full flex-col overflow-y-auto sm:col-span-1 sm:row-span-1"
          value={activeTab}
          // intentionally no onValueChange here because the Link will trigger the
          // change.
        >
          <TabsList className="scrollbar-thin scrollbar-thumb-scrollbar h-14 min-h-14 overflow-x-hidden border-b">
            {tabs.map((tab) => {
              return (
                <TabsTrigger className="h-14" key={tab} value={tab} asChild>
                  <Link
                    className={cn(
                      'relative inline-block h-14 px-6 py-4 font-coHeadline text-sm outline-none focus:bg-foreground/80 focus:text-background/80 radix-state-active:z-10 radix-state-active:bg-primary radix-state-active:text-background radix-state-active:hover:bg-primary/80 radix-state-active:hover:text-background/80 radix-state-inactive:hover:bg-foreground/20 radix-state-inactive:hover:text-foreground/80',
                    )}
                    id={`${tab}-tab`}
                    preventScrollReset
                    prefetch="intent"
                    to={`?${withParam(searchParams, 'preview', tab)}`}
                  >
                    {tab}
                  </Link>
                </TabsTrigger>
              )
            })}
          </TabsList>
          <div className="relative z-10 flex min-h-96 flex-grow flex-col overflow-y-auto">
            <TabsContent
              value="explicatie"
              className="flex w-full flex-grow items-center justify-center self-start radix-state-inactive:hidden"
            >
              {explanation ? (
                <div
                  dangerouslySetInnerHTML={{ __html: explanation }}
                  key={explanation}
                  className={cn(
                    'default-transition ProseMirror rounded border-none bg-background p-2 text-foreground transition-colors',
                  )}
                  content={explanation}
                />
              ) : (
                'Selecteaza un paragraf'
              )}
            </TabsContent>
            <TabsContent
              value="recall"
              className="flex w-full flex-grow items-center justify-center self-start radix-state-inactive:hidden"
            ></TabsContent>
            <TabsContent
              value="mindmap"
              className="flex w-full flex-grow items-center justify-center self-start radix-state-inactive:hidden"
            ></TabsContent>
            <TabsContent
              value="chat"
              className="flex w-full flex-grow items-start justify-center self-start overflow-hidden radix-state-inactive:hidden"
            ></TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  )
}
