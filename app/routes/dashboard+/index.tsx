import { invariantResponse } from '@epic-web/invariant'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, Outlet, useLoaderData } from '@remix-run/react'
import { Card, CardContent, CardFooter } from '#app/components/ui/card.js'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'
import { getChapterImgSrc } from '#app/utils/misc'
import { UserState } from '#app/utils/user.js'

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
      image: { select: { id: true } },
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

function ChapterCard({ id, name, state, image }: Chapter) {
  return (
    <Link className="relative items-center justify-center" to={'/dahsboard'}>
      <Card>
        <CardContent
          className={`flex items-center justify-center border-b-2 p-2 2xl:p-4`}
        >
          <img
            src={getChapterImgSrc(image?.id ?? name)}
            width={100}
            height={100}
            alt="body"
            className="h-24 w-24"
          />
        </CardContent>
        <CardFooter className="p-2 text-center font-sans font-bold leading-none md:text-xs 2xl:p-4 2xl:text-base">
          {name}
        </CardFooter>
      </Card>
    </Link>
  )
}
export default function Dashboard() {
  const { chapters } = useLoaderData<typeof loader>()

  return <></>
}
