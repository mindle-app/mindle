import { invariantResponse } from '@epic-web/invariant'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, Outlet, useLoaderData } from '@remix-run/react'
import { Logo } from '#app/components/logo'
import { Card, CardContent, CardFooter } from '#app/components/ui/card'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'
import { getChapterImgSrc } from '#app/utils/misc'
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
  return (
    <Link to={'/dahsboard'}>
      <Card>
        <CardContent
          className={`flex items-center justify-center border-b-2 p-2 2xl:p-4`}
        >
          <img
            src={getChapterImgSrc(image?.id ?? name)}
            alt={image?.altText ?? name}
            className="h-10 w-10"
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
      <div className="grid min-h-screen grid-rows-[auto_1fr] border-border md:grid-cols-[140px_auto] lg:grid-cols-[182px_auto] lg:grid-rows-[auto_1fr] 2xl:grid-cols-[224px_auto] 2xl:grid-rows-[auto_1fr] min-[2400px]:border-2">
        <header className="col-span-1 row-span-1 flex h-full w-full items-center justify-center border-b-2 border-r-2 border-border">
          <Link to="/dashboard">
            <Logo className="h-24 w-36" />
          </Link>
        </header>

        <nav className="col-span-1 row-span-1 border-b-2 border-border"></nav>
        {/* Sidebar */}
        <aside className="col-span-1 row-span-1 border-r-2 border-border">
          <div
            className={`p-base-padding flex max-h-[1300px] flex-col gap-4 overflow-y-scroll transition-all duration-300 ease-in-out md:h-[calc(100vh-88px)] lg:h-[calc(100vh-100px)] xl:h-[calc(100vh-110px)] 2xl:h-[calc(100vh-125px)] 2xl:gap-7`}
          >
            {chapters.map((c) => (
              <ChapterCard key={c.name} {...c} />
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="p-base-padding col-span-1 row-span-1">
          <Outlet />
        </main>
      </div>
    </>
  )
}
