import { invariantResponse } from '@epic-web/invariant'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { StepRow } from '#app/components/step-row.js'
import { Button } from '#app/components/ui/button.js'
import { requireUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server.js'
import { UserState } from '#app/utils/user.js'
import { Card } from '#app/components/ui/card.js'

const ParamsSchema = z.object({
  chapterId: z.string().transform((v) => parseInt(v, 10)),
})

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request)
  const { chapterId } = ParamsSchema.parse(params)

  const subject = await prisma.subject.findUnique({
    where: { slug: params.slug },
  })

  invariantResponse(subject, 'Subject not found', { status: 404 })
  const chapter = await prisma.chapter.findFirst({
    where: { id: chapterId },
    include: {
      subChapters: { include: { userSubchapters: { where: { userId } } } },
      userChapters: { where: { userId } },
    },
  })

  invariantResponse(chapter, 'Chapter not found', {
    status: 40,
  })

  const { subChapters, userChapters, ...rest } = chapter

  return json({
    subject,
    chapter: { ...rest, state: userChapters[0]?.state ?? UserState.LOCKED },
    subChapters: subChapters.map(({ userSubchapters, ...s }) => ({
      ...s,
      state: (userSubchapters[0]?.state as UserState) ?? UserState.LOCKED,
    })),
  })
}

export default function ChapterPage() {
  const { chapter, subject, subChapters } = useLoaderData<typeof loader>()

  return (
    <>
      <div className="grid h-full gap-base-padding lg:grid-cols-[5fr_3fr]">
        <div className="flex flex-col gap-2">
          <Link
            to={`/subjects/sciences/${subject.slug}`}
            className="text-2xl font-semibold text-primary hover:underline"
          >
            {subject.name}
          </Link>
          <h1 className="pb-4 font-coHeadlineBold text-2xl leading-none text-foreground md:text-[32px] lg:text-3xl lg:leading-none 2xl:text-5xl 2xl:leading-[130%]">
            {chapter.name}
          </h1>
          <div className="flex h-full max-h-[1080px] w-full flex-row gap-base-padding">
            <div className="flex h-full max-h-full w-full flex-col gap-3 rounded-sm border-2 border-solid border-border bg-card p-base-padding shadow-sm xl:rounded-md 2xl:flex-col 2xl:rounded-lg">
              <div className="flex items-center justify-between"></div>
              <div className="flex w-full flex-col gap-1 overflow-y-scroll py-1 transition-all duration-300 ease-in-out md:gap-3 2xl:gap-6 2xl:py-2">
                {subChapters.map((subChapter, i) => {
                  return (
                    <StepRow
                      href={`/mindmap/chapter/${chapter.id}`}
                      number={subChapter.order ?? i}
                      title={subChapter.name}
                      key={`subchapter-row-${subChapter.id}`}
                      state={subChapter.state}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex h-[56px] flex-col justify-end lg:h-[84px] 2xl:h-[112px]">
            <Link to={`/mindmap/chapter/${chapter?.id}`}>
              <Button className="w-full" variant="outline">
                Vezi mindmap-ul capitolului
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
