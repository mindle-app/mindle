import { invariantResponse } from '@epic-web/invariant'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, Outlet, useLoaderData } from '@remix-run/react'
import { Logo } from '#app/components/logo'
import { SvgImage } from '#app/components/svg-image.js'
import { Card, CardContent, CardFooter } from '#app/components/ui/card'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'
import { cn, getChapterImgSrc } from '#app/utils/misc'
import { UserState } from '#app/utils/user'

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request)

  const userSubject = await prisma.userSubject.findFirst({
    select: { subjectId: true },
    where: { userId },
  })
  invariantResponse(userSubject?.subjectId, 'User has no subject', {
    status: 40,
  })
  const chapters = await prisma.chapter.findMany({
    where: {
      subjectId: userSubject.subjectId,
    },
    include: {
      userChapters: { where: { userId } },
      image: { select: { id: true, altText: true } },
    },
    orderBy: { chapterOrder: 'asc' },
  })

  return json({
    chapters: chapters.map(({ userChapters, ...c }) => ({
      ...c,
      state: userChapters[0]?.state ?? UserState.LOCKED,
    })),
  })
}

type Chapter = ReturnType<typeof useLoaderData<typeof loader>>['chapters'][0]

function ChapterCard({ name, state, image }: Chapter) {
  const isInProgress = state === UserState.IN_PROGRESS
  const isCompleted = state === UserState.DONE
  const isLocked = state === UserState.LOCKED

  return (
    <Link to={'/dahsboard'} aria-disabled={isLocked}>
      <Card
        className={cn(
          'group overflow-hidden border-2 transition-all duration-300 ease-in-out hover:border-foreground',
          {
            'border-active-border': isInProgress,
            'cursor-not-allowed border-disabled-border': isLocked,
            'border-completed-border': isCompleted,
          },
        )}
      >
        <CardContent
          className={cn(
            `group flex items-center justify-center border-b-2 px-12 pt-7 transition-all duration-300 ease-in-out`,
            {
              'border-disabled-border bg-disabled group-hover:border-foreground group-hover:bg-disabled-foreground':
                isLocked,
              'border-active-border bg-active hover:bg-active-foreground':
                isInProgress,
              'bg-complete hover:bg-complete-foreground': isCompleted,
            },
          )}
        >
          <SvgImage
            className={cn(
              'flex h-[72px] w-[72px] items-center justify-center',
              {
                'fill-active-svg border-active-border':
                  state === UserState.IN_PROGRESS,
                'fill-disabled-svg border-disabled-border':
                  state === UserState.LOCKED,
                'fill-completed-svg border-completed-border':
                  state === UserState.DONE,
              },
            )}
            src={getChapterImgSrc(image?.id ?? name)}
          />
        </CardContent>
        <CardFooter className="p-2 text-center font-sans font-bold leading-none md:text-xs 2xl:p-4 2xl:text-base">
          <span className="text-xs 2xl:text-base">{name}</span>
        </CardFooter>
      </Card>
    </Link>
  )
}

export default function DashboardLayout() {
  const { chapters } = useLoaderData<typeof loader>()

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
            {chapters.map((c) => (
              <ChapterCard key={c.name} {...c} />
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="col-span-1 row-span-1 p-base-padding">
          <Outlet />
        </main>
      </div>
    </>
  )
}
