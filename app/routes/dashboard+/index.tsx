import { type LoaderFunctionArgs } from '@remix-run/node'
import { requireUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server.js'

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request)

  const subject = 
  const chapters = await prisma.chapter.findMany({
    where: {
      userId,
    },
  })

  return null
}
export default function Dashboard() {
  return (
    <div className="container grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      Dashboard
    </div>
  )
}
