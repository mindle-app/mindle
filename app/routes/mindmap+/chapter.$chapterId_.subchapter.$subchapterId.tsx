import {
  ActionFunctionArgs,
  json,
  type LoaderFunctionArgs,
} from '@remix-run/node'
import { Link, useFetcher, useLoaderData, useParams } from '@remix-run/react'
import { useCallback } from 'react'
import { type RenderCustomNodeElementFn } from 'react-d3-tree'
import { z } from 'zod'
import { Logo } from '#app/components/logo.js'

import { ClickableElement } from '#app/components/mindmap/clickable-element.js'
import { Mindmap } from '#app/components/mindmap/mindmap.js'
import { NonClickableElement } from '#app/components/mindmap/non-clickable-element.js'
import { QuizCard } from '#app/components/quiz-card.js'
import { Button } from '#app/components/ui/button.js'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#app/components/ui/dialog.js'

import { requireUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server.js'
import {
  generateSubchapterMindmap,
  type MindmapTree,
} from '#app/utils/mindmap.js'
import { toUserState, UserState } from '#app/utils/user.js'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'

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
  })
}

const MarkLessonCompleteSchema = z.object({
  lessonId: z.number(),
  subchapterId: z.number(),
  chapterId: z.number(),
})

export async function action({ request, params }: ActionFunctionArgs) {
  console.log('this got called')
}

export default function SubchapterMindmap() {
  const { quizzes, subchapterMindmap } = useLoaderData<typeof loader>()
  const params = useParams()
  const { subchapterId, chapterId } = ParamsSchema.parse(params)
  const studyProgramActive = false
  const completeLesson = useFetcher<typeof action>()
  const [form, fields] = useForm({
    id: 'mark-lesson-complete',
    constraint: getZodConstraint(MarkLessonCompleteSchema),
    defaultValue: { subchapterId, chapterId },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: MarkLessonCompleteSchema })
    },
    shouldRevalidate: 'onBlur',
  })
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
        <completeLesson.Form method={'POST'} {...getFormProps(form)}>
          <input
            {...getInputProps(fields.lessonId, {
              type: 'hidden',
            })}
            value={treeDatum.attributes.id}
          />
          <input {...getInputProps(fields.subchapterId, { type: 'hidden' })} />
          <input {...getInputProps(fields.chapterId, { type: 'hidden' })} />
          <Button asChild type="submit">
            <g overflow="visible">
              <foreignObject
                overflow="visible"
                width={`${nodeDatum.attributes?.width ?? 200}px`}
                height={`${nodeDatum.attributes?.height ?? 200}px`}
                x={x}
                y={y}
              >
                <div>
                  {!noPopup && (
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
                  {noPopup && <NonClickableElement text={text} />}
                </div>
              </foreignObject>
            </g>
          </Button>
        </completeLesson.Form>
      )
      const description = treeDatum.attributes?.description

      if (description) {
        return (
          <Dialog>
            <DialogTrigger asChild>{element}</DialogTrigger>
            <DialogContent className="h-2/3">
              <DialogHeader className="gap-8">
                <DialogTitle className="text-2xl">{text}</DialogTitle>
                <DialogDescription
                  className="text-xl text-foreground"
                  dangerouslySetInnerHTML={{
                    __html: description,
                  }}
                ></DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        )
      }
      return element
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
            mindmap={subchapterMindmap}
            renderCustomNodeElement={renderNode}
          />
        </main>
      </div>
    </>
  )
}
