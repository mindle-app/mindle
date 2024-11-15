import { invariantResponse } from '@epic-web/invariant'
import { ElementScrollRestoration } from '@epic-web/restore-scroll'
import { Tabs, TabsContent } from '@radix-ui/react-tabs'
import { type LinksFunction, type LoaderFunctionArgs } from '@remix-run/node'
import { json, Link, useLoaderData, useSearchParams } from '@remix-run/react'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import { type RenderCustomNodeElementFn } from 'react-d3-tree'
import { toast as showToast } from 'sonner'
import { ClickableElement } from '#app/components/mindmap/clickable-element.js'
import { Mindmap } from '#app/components/mindmap/mindmap.js'
import { NonClickableElement } from '#app/components/mindmap/non-clickable-element.js'
import {
  BlockEditor,
  PreviewHTML,
} from '#app/components/richtext-editor/components/block-editor/index.js'
import editorStyleSheetUrl from '#app/components/richtext-editor/styles/index.css?url'
import { Button } from '#app/components/ui/button.js'
import { Card, CardDescription, CardTitle } from '#app/components/ui/card.js'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#app/components/ui/dialog.js'
import { Icon } from '#app/components/ui/icon.js'
import { LinkButton } from '#app/components/ui/link-button.js'
import { requireUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server.js'
import {
  assembleMindmapFromLessons,
  type MindmapTree,
} from '#app/utils/mindmap.js'
import { cn, copyRichText } from '#app/utils/misc.js'
import { withParam } from '#app/utils/search-params.js'
import { useIsAdmin, UserState } from '#app/utils/user.js'

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: editorStyleSheetUrl }].filter(Boolean)
}
const tabs = ['explicatie', 'recall', 'mindmap', 'chat'] as const

export async function loader({ params, request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request)
  const searchParams = new URL(request.url).searchParams
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

  const paragraph = await prisma.essayParagraph.findUnique({
    where: { id: searchParams.get('selectedParagraph') ?? '__no_selected' },
    include: {
      lessons: {
        include: {
          parentLesson: true,
          image: true,
          userLessons: { where: { userId } },
        },

        orderBy: { order: 'asc' },
      },
    },
  })

  const titleBits = {
    studyMaterialTitle: studyMaterial?.title,
    studyMaterialId: studyMaterial.id,
    essayTitle: essay.title,
    essayId: essay.id,
  }

  return json({
    essay,
    titleBits,
    paragraphMindmap: paragraph?.lessons.length
      ? assembleMindmapFromLessons(paragraph?.lessons)
      : null,
  })
}

function useTimeLeft(
  endTime: string | Date | dayjs.Dayjs | null,
  opts?: { onTimerEnd?: () => void },
) {
  const [timeLeft, setTimeLeft] = useState({
    seconds: 0,
    minutes: 0,
    hours: 0,
  })

  useEffect(() => {
    if (!endTime) return

    const timer = setInterval(() => {
      const now = dayjs()
      const end = dayjs(endTime)
      const diff = end.diff(now, 'second')

      if (diff <= 0) {
        clearInterval(timer)
        setTimeLeft({ seconds: 0, minutes: 0, hours: 0 })
        opts?.onTimerEnd?.()
      } else {
        const hours = Math.floor(diff / 3600)
        const minutes = Math.floor((diff % 3600) / 60)
        const seconds = diff % 60

        setTimeLeft({ seconds, minutes, hours })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [endTime, opts])

  return timeLeft
}

export default function StudyMaterial() {
  const { essay, paragraphMindmap } = useLoaderData<typeof loader>()
  const [timerEnd, setTimerEnd] = useState<dayjs.Dayjs | null>(null)
  const [searchParams] = useSearchParams()
  const activeTab = searchParams.get('preview') ?? tabs[0]
  const selectedParagraphId = searchParams.get('selectedParagraph')
  const explanation = selectedParagraphId
    ? essay.paragraphs.find((p) => p.id === selectedParagraphId)?.explanation
    : null
  const [recallContent, setRecallContent] = useState('')
  const onTimerEnd = useCallback(() => setTimerEnd(null), [])

  const isAdmin = useIsAdmin()

  const renderNode = useCallback<RenderCustomNodeElementFn>(
    ({ nodeDatum }) => {
      // TODO Parse with Zod
      const treeDatum = nodeDatum as unknown as MindmapTree
      const buttonText =
        treeDatum.attributes?.displayId ?? treeDatum.attributes?.id
      const text = treeDatum.name
      const noPopup = treeDatum?.attributes?.noPopup
      const x = 0
      const y = -50

      const element = (
        <g overflow="visible">
          <foreignObject
            overflow="visible"
            width={`${nodeDatum.attributes?.width ?? 200}px`}
            height={`${nodeDatum.attributes?.height ?? 200}px`}
            x={x}
            y={y}
          >
            {noPopup ? (
              <NonClickableElement text={text} />
            ) : (
              <ClickableElement
                text={text}
                buttonText={buttonText?.toString() ?? ''}
                state={UserState.IN_PROGRESS}
                // next lesson is leaf that is in progress
                isNextLesson={false}
              />
            )}
          </foreignObject>
        </g>
      )
      const description = treeDatum.attributes?.description
      const imageUrl = treeDatum.attributes.imageUrl

      if (description || imageUrl) {
        return (
          <Dialog>
            <DialogTrigger asChild>{element}</DialogTrigger>
            <DialogContent className="my-4 max-h-[90vh] overflow-scroll p-12 pb-6">
              <DialogHeader className="gap-8">
                <DialogTitle className="flex items-center text-2xl">
                  {text}
                  {isAdmin ? (
                    <Link to={`/cms/lessons/${treeDatum.attributes?.id}/edit`}>
                      <Button variant={'link'}>Edit</Button>
                    </Link>
                  ) : null}
                </DialogTitle>
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Lesson image"
                    className="h-auto w-full"
                  />
                )}
                <DialogDescription className="text-xl text-foreground">
                  <PreviewHTML
                    content={description ?? ''}
                    className="border-none bg-background"
                  />
                </DialogDescription>
              </DialogHeader>
              <DialogClose>
                <Button className="mt-8 w-full">Am înțeles</Button>
              </DialogClose>
            </DialogContent>
          </Dialog>
        )
      }
      return <Button asChild>{element}</Button>
    },
    [isAdmin],
  )

  const { seconds, minutes } = useTimeLeft(timerEnd, { onTimerEnd })
  return (
    <div className="flex h-full max-w-full flex-grow flex-col">
      <main className="flex flex-grow flex-col sm:grid sm:h-full sm:min-h-[800px] sm:grid-cols-1 sm:grid-rows-2 md:min-h-[unset] lg:grid-cols-2 lg:grid-rows-1">
        <div className="relative flex h-full flex-col border-b border-primary/20 sm:col-span-1 sm:row-span-1 sm:h-full lg:border-b-0 lg:border-r">
          <article
            id={essay.id}
            key={essay.id}
            className="shadow-on-scrollbox scrollbar-thin scrollbar-thumb-scrollbar relative h-full w-full max-w-none flex-1 scroll-pt-6 space-y-6 overflow-y-auto p-2 sm:p-10 sm:pt-8"
          >
            <div className="flex items-center gap-1">
              <h1 className="font-coHeadlineBold text-2xl">{essay.title}</h1>
              <LinkButton to={`/cms/essays/${essay.id}`}>Edit</LinkButton>
            </div>

            {essay.paragraphs.map((p) => (
              <Link
                id={`${p.id}-paragraph`}
                preventScrollReset
                className="relative"
                prefetch="intent"
                to={`?${withParam(searchParams, 'selectedParagraph', p.id)}`}
                key={p.id}
              >
                <div
                  dangerouslySetInnerHTML={{ __html: p.content }}
                  key={p.id}
                  className={cn(
                    'default-transition ProseMirror relative rounded border-none bg-background p-2 text-foreground transition-colors hover:bg-primary/20 dark:hover:bg-primary/30',
                    {
                      'bg-primary/10 dark:bg-primary/20':
                        selectedParagraphId === p.id,
                    },
                  )}
                />
                {timerEnd ? (
                  <div className="absolute bottom-0 left-0 right-0 top-0 z-50 backdrop-blur-md" />
                ) : null}
                <div
                  className={cn(
                    'absolute -right-2 -top-2 z-50 hidden items-center justify-center rounded-full border border-primary bg-card p-2',
                    {
                      flex: selectedParagraphId === p.id,
                    },
                  )}
                >
                  <Icon name={'mindle-head'} size={'md'} />
                </div>
              </Link>
            ))}
          </article>
          <ElementScrollRestoration
            elementQuery={`#${essay.id}`}
            key={`scroll-${essay.id}`}
          />
        </div>
        <Tabs
          className="relative flex h-full flex-col overflow-y-auto sm:col-span-1 sm:row-span-1"
          value={activeTab}
        >
          <div className="relative z-10 flex min-h-96 flex-grow flex-col overflow-y-auto">
            <TabsContent
              value="explicatie"
              className="flex w-full flex-grow justify-center self-start pt-9 radix-state-inactive:hidden"
            >
              {explanation ? (
                <div className="flex w-full flex-col items-center gap-9">
                  <div
                    dangerouslySetInnerHTML={{ __html: explanation }}
                    key={explanation}
                    className={cn(
                      'default-transition ProseMirror rounded border-none bg-background p-2 px-0 text-foreground transition-colors',
                    )}
                    content={explanation}
                  />
                  <div className="flex w-full justify-start gap-2 px-16">
                    <Button
                      size={'lg'}
                      className="w-full max-w-[16rem] justify-between border border-primary bg-primary/10 text-primary"
                      variant={'ghost'}
                      onClick={() =>
                        copyRichText(explanation).then(() =>
                          showToast('Textul a fost copiat cu success'),
                        )
                      }
                    >
                      Copiază in clipboard
                      <Icon name={'clipboard'} />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-full">
                  <Card className="flex max-w-sm flex-col items-center justify-center gap-5 border-primary/20 p-9">
                    <CardTitle className="">
                      <Icon
                        name={'highlighter'}
                        className="h-16 w-16 text-primary"
                      />
                    </CardTitle>

                    <CardDescription className="text-center">
                      <CardTitle className="mb-2 font-coHeadline text-xl text-card-foreground">
                        Selecteaza un paragraf
                      </CardTitle>
                      Fiecare paragraf are o explicație legată de mesaj, barem
                      sau context.
                    </CardDescription>
                  </Card>
                </div>
              )}
            </TabsContent>
            <TabsContent
              value="recall"
              className="flex w-full flex-grow items-center justify-center self-start radix-state-inactive:hidden"
            >
              {timerEnd ? (
                <div className="flex h-full w-full flex-col items-center gap-2 px-6 py-9 [&_.ProseMirror]:px-0">
                  <div className="mx-9 flex w-full justify-between rounded-xl border border-dashed border-primary px-6 py-5 text-primary">
                    <p>
                      Timp rămas:{' '}
                      <span className="font-bold">
                        {minutes}:{seconds < 10 ? '0' : ''}
                        {seconds}
                      </span>
                    </p>
                    <div className="flex items-center justify-center rounded-full bg-primary p-1">
                      <Icon
                        className="bg-primary text-primary-foreground"
                        name={'timer'}
                        size={'md'}
                      />
                    </div>
                  </div>
                  <BlockEditor
                    content={recallContent}
                    onBlur={({ editor }) => {
                      setRecallContent(editor.getHTML())
                    }}
                    className="border-none bg-background text-foreground"
                  />
                  <div>
                    <Button
                      variant={'secondary'}
                      className="border border-primary bg-primary/10 text-primary"
                      size={'wide'}
                      onClick={onTimerEnd}
                    >
                      Încheie sesiune de recall{' '}
                      <Icon
                        className="ml-6 rounded-full bg-primary text-primary-foreground"
                        name={'x'}
                        size="lg"
                      />
                    </Button>
                  </div>
                </div>
              ) : (
                <Card className="flex max-w-sm flex-col items-center justify-center gap-5 border-primary/20 p-9">
                  <CardTitle className="">
                    <Icon
                      name={'pen-tool'}
                      className="h-16 w-16 text-primary"
                    />
                  </CardTitle>

                  <CardDescription className="text-center">
                    <CardTitle className="mb-2 font-coHeadline text-xl text-card-foreground">
                      Începe o sesiune de recall
                    </CardTitle>
                    Scrie tot ce îți amintești din text în 5 minute pentru a
                    consolida informațiile în memorie - cea mai eficientă
                    tehnică de învățare dovedită științific.
                  </CardDescription>
                  <Button
                    className="w-full"
                    onClick={() => setTimerEnd(dayjs().add(5, 'minute'))}
                  >
                    Start recall
                  </Button>
                </Card>
              )}
            </TabsContent>
            <TabsContent
              value="mindmap"
              className="flex w-full flex-grow items-center justify-center self-start radix-state-inactive:hidden"
            >
              {paragraphMindmap ? (
                <Mindmap
                  mindmap={paragraphMindmap}
                  renderCustomNodeElement={renderNode}
                />
              ) : null}
            </TabsContent>
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
