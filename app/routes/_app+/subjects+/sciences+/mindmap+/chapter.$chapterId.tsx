import { invariantResponse } from '@epic-web/invariant'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData, useNavigate } from '@remix-run/react'
import { useCallback } from 'react'
import { type RenderCustomNodeElementFn } from 'react-d3-tree'
import { z } from 'zod'
import { ChapterElement } from '#app/components/mindmap/chapter-element.js'
import { ClickableElement } from '#app/components/mindmap/clickable-element.js'
import { Mindmap } from '#app/components/mindmap/mindmap.js'
import { QuizCard } from '#app/components/quiz-card.js'
import { Icon } from '#app/components/ui/icon.js'
import { LinkButton } from '#app/components/ui/link-button.js'
import { ProgressWithPercent } from '#app/components/ui/progress.js'
import { requireUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server.js'
import {
  generateChapterMindmap,
  getMindmapProgress,
  type MindmapTree,
} from '#app/utils/mindmap.js'
import { cn } from '#app/utils/misc.js'
import { toUserState, UserState } from '#app/utils/user.js'

const ParamsSchema = z.object({
  chapterId: z.string().transform((v) => parseInt(v, 10)),
})

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request)

  const { chapterId } = ParamsSchema.parse(params)
  const userSubject = await prisma.userSubject.findFirst({
    select: { subjectId: true },
    where: { userId },
  })
  invariantResponse(userSubject?.subjectId, 'User has no subject', {
    status: 40,
  })
  const quizzes = await prisma.quiz.findMany({
    include: {
      userQuizzes: { where: { userId } },
    },
    where: { subchapter: { chapterId } },
    orderBy: { subchapter: { order: 'asc' } },
  })

  const chapterMindmap = await generateChapterMindmap(chapterId, userId)

  return json({
    quizzes: quizzes.map(({ userQuizzes, ...q }) => ({
      score: userQuizzes[0]?.score ?? null,
      state: userQuizzes[0]?.state ?? UserState.LOCKED,
      ...q,
    })),
    chapterMindmap,
    chapterProgress: getMindmapProgress(chapterMindmap),
    studyProgramActive: false,
  })
}

export default function ChapterMindmap() {
  const { quizzes, chapterMindmap, chapterProgress, studyProgramActive } =
    useLoaderData<typeof loader>()
  const renderNode = useCallback<RenderCustomNodeElementFn>(
    ({ nodeDatum }) => {
      const treeDatum = nodeDatum as unknown as MindmapTree
      const buttonText =
        treeDatum.attributes?.displayId ?? treeDatum.attributes?.id
      const text = treeDatum.name
      const imageUrl = treeDatum.attributes?.imageUrl?.toString() ?? ''

      const x = 0
      const y = -50

      const element = (
        <g
          overflow="visible"
          className={cn({
            'cursor-not-allowed':
              studyProgramActive &&
              treeDatum.attributes.state === UserState.LOCKED,
          })}
        >
          <foreignObject
            overflow="visible"
            width={`${treeDatum?.attributes?.width ?? 200}px`}
            height={`${treeDatum?.attributes?.height ?? 200}px`}
            x={x}
            y={treeDatum.children?.length !== 0 ? y * 2 : y}
          >
            {treeDatum.children?.length === 0 ? (
              <ClickableElement
                text={text}
                buttonText={buttonText?.toString() ?? ''}
                state={
                  studyProgramActive
                    ? treeDatum.attributes.state
                    : UserState.IN_PROGRESS
                }
                isNextLesson={
                  studyProgramActive &&
                  !treeDatum.children.length &&
                  treeDatum.attributes.state === UserState.IN_PROGRESS
                }
              />
            ) : (
              <ChapterElement
                title={text}
                image={imageUrl}
                state={toUserState(treeDatum.attributes?.state)}
              />
            )}
          </foreignObject>
        </g>
      )

      if (
        !studyProgramActive ||
        (studyProgramActive && treeDatum.attributes.state !== UserState.LOCKED)
      ) {
        return (
          <Link to={`subchapter/${treeDatum.attributes.id}`} prefetch="intent">
            {element}
          </Link>
        )
      }
      return element
    },
    [studyProgramActive],
  )

  const navigate = useNavigate()

  return (
    <>
      <div className="grid grid-rows-[auto_1fr] border-border md:grid-cols-[140px_auto] lg:grid-cols-[170px_auto] lg:grid-rows-[auto_1fr] 2xl:grid-cols-[180px_auto] 2xl:grid-rows-[auto_1fr] min-[2400px]:border-2">
        {/* Sidebar */}
        <aside className="col-span-14 scrollbar-thin scrollbar-thumb-scrollbar row-span-1 border-r-2 border-primary/20">
          <div
            className={`scrollbar-thin scrollbar-thumb-scrollbar px-auto flex h-[calc(100vh-58px)] w-full flex-col items-stretch gap-4 overflow-y-scroll p-base-padding pt-8 transition-all duration-300 ease-in-out 2xl:gap-7`}
          >
            {quizzes.map((q) => (
              <QuizCard
                key={q.id}
                {...q}
                state={
                  studyProgramActive
                    ? toUserState(q.state)
                    : UserState.IN_PROGRESS
                }
              />
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
              value={chapterProgress}
            />
          </div>
          <Mindmap
            mindmap={chapterMindmap}
            renderCustomNodeElement={renderNode}
          />
        </main>
      </div>
    </>
  )
}
