import { invariantResponse } from '@epic-web/invariant'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { prisma } from '#app/utils/db.server.js'

export async function loader({ params }: LoaderFunctionArgs) {
  const subject = await prisma.subject.findUnique({
    where: { id: Number(params.subjectId) },
  })
  invariantResponse(subject, 'Subject not found', { status: 404 })
  return json({ subject })
}

export default function SubjectCMS() {
  const { subject } = useLoaderData<typeof loader>()
  return (
    <div className="flex w-full flex-col items-center">
      <h1>{subject.name}</h1>
    </div>
  )
}
