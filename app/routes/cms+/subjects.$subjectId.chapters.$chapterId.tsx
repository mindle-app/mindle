import { invariantResponse } from '@epic-web/invariant'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { prisma } from '#app/utils/db.server.js'

export async function loader({ params }: LoaderFunctionArgs) {
  const chapter = await prisma.chapter.findUnique({
    where: { id: Number(params.chapterId) },
  })
  invariantResponse(chapter, 'Chapter not found', { status: 404 })
  return json({ chapter })
}

export default function SubjectCMS() {
  const { chapter } = useLoaderData<typeof loader>()
  return (
    <div className="flex w-full flex-col items-center">
      <h1>{chapter.name}</h1>
    </div>
  )
}
