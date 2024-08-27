import { invariantResponse } from '@epic-web/invariant'
import {
  type ActionFunctionArgs,
  json,
  type LinksFunction,
  type LoaderFunctionArgs,
} from '@remix-run/node'
import { Link, useFetcher, useLoaderData, useNavigate } from '@remix-run/react'
import { useCallback } from 'react'
import { type RenderCustomNodeElementFn } from 'react-d3-tree'
import { z } from 'zod'

import { ClickableElement } from '#app/components/mindmap/clickable-element.js'
import { Mindmap } from '#app/components/mindmap/mindmap.js'
import { NonClickableElement } from '#app/components/mindmap/non-clickable-element.js'
import { QuizCard } from '#app/components/quiz-card.js'

import { PreviewHTML } from '#app/components/richtext-editor/components/block-editor'
import editorStyleSheetUrl from '#app/components/richtext-editor/styles/index.css?url'
import { Button } from '#app/components/ui/button.js'
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
import { ProgressWithPercent } from '#app/components/ui/progress.js'
import { requireUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server.js'
import {
  findMindmapNode,
  findNextInProgress,
  generateSubchapterMindmap,
  type MindmapId,
  mindMapIdsToDbIds,
  completeChapterMindmap,
  type MindmapTree,
  getMindmapProgress,
} from '#app/utils/mindmap.js'
import { toUserState, UserState, useUser } from '#app/utils/user.js'

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: editorStyleSheetUrl }].filter(Boolean)
}

const ParamsSchema = z.object({
  subchapterId: z.string().transform((v) => parseInt(v, 10)),
  chapterId: z.string().transform((v) => parseInt(v, 10)),
})

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request)

  const { subchapterId } = ParamsSchema.parse(params)

  const quizzes = await prisma.quiz.findMany({
    include: {
      userQuizzes: { where: { userId } },
    },
    where: { subchapterId },
    orderBy: { order: 'asc' },
  })

  const subchapterMindmap = await generateSubchapterMindmap(
    subchapterId,
    userId,
  )

  return json({
    quizzes: quizzes.map(({ userQuizzes, ...q }) => ({
      score: userQuizzes[0]?.score ?? null,
      state: userQuizzes[0]?.state ?? UserState.LOCKED,
      ...q,
    })),
    subchapterMindmap,
    subchapterProgress: getMindmapProgress(subchapterMindmap),
  })
}

const MarkLessonAsDone = z.object({
  lessonId: z.string().transform((v) => parseInt(v, 10)),
})

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request)
  const result = ParamsSchema.safeParse(params)
  invariantResponse(result.success, 'Invalid params', { status: 500 })

  const formData = await request.formData()
  const lessonResult = MarkLessonAsDone.safeParse(Object.fromEntries(formData))
  invariantResponse(lessonResult.success, 'Invalid lessonId provided', {
    status: 400,
  })

  const lessonId = lessonResult.data.lessonId

  const subChapterMindmap = await generateSubchapterMindmap(
    result.data.subchapterId,
    userId,
  )

  const lessonNode = findMindmapNode(subChapterMindmap, `lesson|${lessonId}`)
  invariantResponse(lessonNode, 'Lesson not found', { status: 404 })
  invariantResponse(
    lessonNode.attributes.state !== UserState.DONE,
    'Lesson already completed',
    {
      status: 400,
    },
  )

  const { completed, nextInProgress } = findNextInProgress(
    subChapterMindmap,
    lessonNode,
  )

  const { lessons: lessonsToComplete } = mindMapIdsToDbIds(
    [lessonNode.id, completed].filter((id) => !!id) as MindmapId[],
  )

  const updateLessonsDone = prisma.$transaction([
    prisma.userLesson.deleteMany({
      where: {
        userId,
        lessonId: { in: lessonsToComplete },
      },
    }),
    prisma.userLesson.createMany({
      data: lessonsToComplete.map((lessonId) => ({
        userId,
        lessonId,
        state: UserState.DONE,
      })),
    }),
  ])

  const [_, nextInProgressLessonId] = nextInProgress
    ? nextInProgress.split('|')
    : []

  await Promise.all([
    updateLessonsDone,
    ...(nextInProgressLessonId
      ? [
          prisma.userLesson.upsert({
            where: {
              lessonId_userId: {
                userId,
                lessonId: parseInt(nextInProgressLessonId),
              },
            },
            update: {
              state: UserState.IN_PROGRESS,
            },
            create: {
              userId,
              lessonId: parseInt(nextInProgressLessonId),
              state: UserState.IN_PROGRESS,
            },
          }),
        ]
      : []),
  ])

  const shouldCompleteSubChapter = (
    await prisma.lesson.findMany({
      include: { userLessons: { where: { userId } } },
      where: {
        subchapterId: result.data.subchapterId,
      },
    })
  ).every((lesson) => lesson.userLessons[0]?.state === UserState.DONE)

  if (shouldCompleteSubChapter) {
    // Mark next subchapter as in progress and potentially mark next
    // chapter as in progress
    await completeChapterMindmap({
      chapterId: result.data.chapterId,
      subChapterId: result.data.subchapterId,

      userId,
    })
  }

  return json({ success: true })
}

export default function SubchapterMindmap() {
  const { quizzes, subchapterMindmap, subchapterProgress } =
    useLoaderData<typeof loader>()
  const studyProgramActive = true
  const completeLesson = useFetcher<typeof action>()
  const user = useUser()
  const isAdmin = user.roles.find((role) => role.name === 'admin')

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
                state={
                  studyProgramActive
                    ? treeDatum.attributes.state
                    : UserState.IN_PROGRESS
                }
                // next lesson is leaf that is in progress
                isNextLesson={
                  studyProgramActive &&
                  !treeDatum.children.length &&
                  treeDatum.attributes.state === UserState.IN_PROGRESS
                }
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
            <DialogTrigger
              onClick={() => {
                if (
                  !studyProgramActive ||
                  treeDatum.attributes.state !== UserState.IN_PROGRESS
                )
                  return

                completeLesson.submit(
                  {
                    lessonId: treeDatum.attributes?.id,
                  },
                  {
                    method: 'POST',
                  },
                )
              }}
              asChild
            >
              {element}
            </DialogTrigger>
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
      return (
        <Button
          asChild
          onClick={() => {
            if (
              !studyProgramActive ||
              treeDatum.attributes.state !== UserState.IN_PROGRESS
            )
              return

            completeLesson.submit(
              {
                lessonId: treeDatum.attributes?.id,
              },
              {
                method: 'POST',
              },
            )
          }}
        >
          {element}
        </Button>
      )
    },
    [completeLesson, isAdmin, studyProgramActive],
  )

  const navigate = useNavigate()

  return (
    <>
      <div className="grid min-h-screen grid-rows-[auto_1fr] border-border md:grid-cols-[140px_auto] lg:grid-cols-[240px_auto] lg:grid-rows-[auto_1fr] 2xl:grid-cols-[224px_auto] 2xl:grid-rows-[auto_1fr] min-[2400px]:border-2">
        {/* Sidebar */}
        <aside className="col-span-1 row-span-1 border-r-2 border-border">
          <div
            className={`flex max-h-screen flex-col gap-4 overflow-y-scroll p-8 transition-all duration-300 ease-in-out md:h-[calc(100vh-100px)] lg:h-[calc(100vh-100px)] xl:h-[calc(100vh-100px)] 2xl:h-[calc(100vh-100px)] 2xl:gap-7`}
          >
            {quizzes.map((q) => (
              <QuizCard key={q.id} {...q} state={toUserState(q.state)} />
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="col-span-1 row-span-1 p-base-padding">
          <div className="justify-even flex w-full items-center gap-8">
            <LinkButton
              to={'#'}
              buttonProps={{
                variant: 'secondary',
                onClick: () => navigate(-1),
                className:
                  'flex-1 w-full rounded-xl px-16 border text-semibold h-16 text-xl border-active-border',
                size: 'lg',
              }}
            >
              <Icon name={'arrow-left'} className="mr-4" />
              Mergi înapoi
            </LinkButton>
            <ProgressWithPercent
              className="h-16 rounded-xl border border-active-border"
              containerClassName="flex-1"
              value={subchapterProgress}
            />
          </div>
          <Mindmap
            mindmap={subchapterMindmap}
            renderCustomNodeElement={renderNode}
          />
        </main>
      </div>
    </>
  )
}
