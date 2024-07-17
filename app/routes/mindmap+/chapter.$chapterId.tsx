import { invariantResponse } from '@epic-web/invariant'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData, useParams } from '@remix-run/react'
import { useCallback } from 'react'
import { type RenderCustomNodeElementFn } from 'react-d3-tree'
import { z } from 'zod'
import { Logo } from '#app/components/logo.js'
import { ChapterElement } from '#app/components/mindmap/chapter-element.js'
import { ClickableElement } from '#app/components/mindmap/clickable-element.js'
import { Mindmap } from '#app/components/mindmap/mindmap.js'
import { QuizCard } from '#app/components/quiz-card.js'
import { requireUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server.js'
import { generateChapterMindmap, type MindmapTree } from '#app/utils/mindmap.js'
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
  })
}

export default function ChapterMindmap() {
  const { quizzes, chapterMindmap } = useLoaderData<typeof loader>()
  const { chapterId } = useParams()
  const studyProgramActive = false // todo correct study program
  const renderNode = useCallback<RenderCustomNodeElementFn>(
    ({ nodeDatum }) => {
      // TODO Parse with Zod
      const treeDatum = nodeDatum as unknown as MindmapTree
      const buttonText =
        treeDatum.attributes?.displayId ?? treeDatum.attributes?.id
      const text = treeDatum.name
      const imageUrl = treeDatum.attributes?.imageUrl?.toString() ?? ''

      const x = 0
      const y = -50

      return (
        <Link
          to={`/mindmap/chapter/${chapterId}/subchapter/${treeDatum.attributes.id}`}
        >
          <g overflow="visible">
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
        </Link>
      )
    },
    [studyProgramActive],
  )

  return (
    <>
      <div className="grid min-h-screen grid-rows-[auto_1fr] border-border md:grid-cols-[140px_auto] lg:grid-cols-[240px_auto] lg:grid-rows-[auto_1fr] 2xl:grid-cols-[224px_auto] 2xl:grid-rows-[auto_1fr] min-[2400px]:border-2">
        <header className="col-span-1 row-span-1 flex h-full w-full items-center justify-center border-b-2 border-r-2 border-border">
          <Link to="/dashboard">
            <Logo className="h-24 w-36" />
          </Link>
        </header>

        <nav className="col-span-1 row-span-1 border-b-2 border-border"></nav>
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
          <Mindmap
            mindmap={chapterMindmap}
            renderCustomNodeElement={renderNode}
          />
        </main>
      </div>
    </>
  )
}
