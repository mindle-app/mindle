import { invariantResponse } from '@epic-web/invariant'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'

import { StepRow } from '#app/components/step-row.js'
import { Button } from '#app/components/ui/button.js'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'

import { UserState } from '#app/utils/user.js'

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request)

  const userChapter = await prisma.userChapter.findFirst({
    where: {
      userId,
      state: UserState.IN_PROGRESS,
    },
    include: {
      chapter: {
        include: {
          subChapters: { include: { userSubchapters: { where: { userId } } } },
          userChapters: { where: { userId } },
        },
      },
    },
  })
  invariantResponse(userChapter, 'No chapter in progress', { status: 404 })

  const { chapter } = userChapter
  const { subChapters, userChapters, ...rest } = chapter

  return json({
    chapter: { ...rest, state: userChapters[0]?.state ?? UserState.LOCKED },
    subChapters: subChapters.map(({ userSubchapters, ...s }) => ({
      ...s,
      state: (userSubchapters[0]?.state as UserState) ?? UserState.LOCKED,
    })),
  })
}

export default function Dashboard() {
  const { chapter, subChapters } = useLoaderData<typeof loader>()
  const learnedSubChapters = subChapters.reduce((acc, subChapter) => {
    if (subChapter.state === UserState.DONE) {
      return acc + 1
    }
    return acc
  }, 0)

  return (
    <>
      <div className="grid h-full gap-base-padding lg:grid-cols-[5fr_3fr]">
        <div className="flex flex-col gap-base-padding">
          <h1 className="font-coHeadlineBold text-2xl leading-none text-black md:text-[32px] lg:text-3xl lg:leading-none 2xl:text-5xl 2xl:leading-[130%]">
            {chapter.name}
          </h1>
          <div className="flex h-full max-h-[1080px] w-full flex-row gap-base-padding">
            <div className="flex h-full max-h-full w-full flex-col gap-3 rounded-sm border-2 border-solid border-border bg-card p-base-padding shadow-sm xl:rounded-md 2xl:flex-col 2xl:rounded-lg">
              <div className="flex items-center justify-between">
                <h2 className="font-coHeadlineBold text-2xl text-foreground">
                  Ce urmează pe azi
                </h2>
                <span className="font-coHeadline text-xl text-foreground">
                  {learnedSubChapters} / {subChapters.length} lecții învățate
                </span>
              </div>
              <div className="flex w-full flex-col gap-1 overflow-y-scroll py-1 transition-all duration-300 ease-in-out md:gap-3 2xl:gap-6 2xl:py-2">
                {subChapters.map((subChapter, i) => {
                  return (
                    <StepRow
                      href={`/mindmap/${chapter.id}`}
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
        <div className="flex flex-col gap-base-padding">
          <div className="flex h-[56px] flex-col justify-end lg:h-[84px] 2xl:h-[112px]">
            <Link to={`/mindmap/${chapter?.id}`}>
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
