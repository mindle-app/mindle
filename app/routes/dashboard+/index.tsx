import { invariantResponse } from '@epic-web/invariant'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'

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
  })

  return json({ chapters })
}
export default function Dashboard() {
  const data = useLoaderData<typeof loader>()

  return (
    <div className="container min-h-screen w-full">
      Dashboard
      {JSON.stringify(data, null, 2)}
    </div>
  )
}
