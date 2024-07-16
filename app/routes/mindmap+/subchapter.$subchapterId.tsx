import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData, useNavigate, useParams } from '@remix-run/react'
import { z } from 'zod'
import { Logo } from '#app/components/logo.js'
import { Mindmap } from '#app/components/mindmap/mindmap.js'
import { QuizCard } from '#app/components/quiz-card.js'
import { requireUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server.js'
import { generateSubchapterMindmap } from '#app/utils/mindmap.js'
import { toUserState, UserState } from '#app/utils/user.js'

const ParamsSchema = z.object({
  subchapterId: z.string().transform((v) => parseInt(v, 10)),
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
  })
}

export default function SubchapterMindmap() {
  const { quizzes, subchapterMindmap } = useLoaderData<typeof loader>()
  const navigate = useNavigate()
  const { chapterId } = useParams()
  console.log(subchapterMindmap)

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
            isSubchapter={true}
            mindmap={subchapterMindmap}
            studyProgramActive={true}
            handleNodeClick={(node) =>
              navigate(`/mindmap/chapter/${chapterId}/subchapter/${node.id}`)
            }
          />
        </main>
      </div>
    </>
  )
}
